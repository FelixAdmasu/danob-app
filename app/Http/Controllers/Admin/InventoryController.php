<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function openingStock(Request $request)
    {
        $products = Product::with(['variants' => fn ($q) => $q->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Inventory/OpeningStock', [
            'products' => $products,
        ]);
    }

    public function storeOpeningStock(Request $request, InventoryService $service)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:0|max:1000000',
            'notes' => 'nullable|string|max:1000',
        ]);

        $variant = ProductVariant::findOrFail($validated['product_variant_id']);

        if ((int) $variant->product_id !== (int) $validated['product_id']) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'Selected variant does not belong to the selected product.',
            ]);
        }

        if ($variant->stockMovements()->exists()) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'Opening balance already established for this variant. Use stock adjustment instead.',
            ]);
        }

        $service->openingBalance($variant, (int) $validated['quantity'], auth()->id());

        return redirect()->route('admin.inventory.opening-stock')->with('success', 'Opening stock recorded.');
    }

    public function adjustments(Request $request)
    {
        $products = Product::with(['variants' => fn ($q) => $q->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/Inventory/Adjustments', [
            'products' => $products,
        ]);
    }

    public function storeAdjustment(Request $request, InventoryService $service)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'required|exists:product_variants,id',
            'adjustment_type' => 'required|in:adjustment_in,adjustment_out',
            'quantity' => 'required|integer|min:1|max:1000000',
            'reason' => 'required|string|max:1000',
            'notes' => 'nullable|string|max:1000',
        ]);

        $variant = ProductVariant::findOrFail($validated['product_variant_id']);

        if ((int) $variant->product_id !== (int) $validated['product_id']) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'Selected variant does not belong to the selected product.',
            ]);
        }

        $type = $validated['adjustment_type'];
        $quantity = (int) $validated['quantity'];
        $reason = $validated['reason'];
        $notes = $validated['notes'] ?? null;

        if ($type === StockMovement::TYPE_ADJUSTMENT_IN) {
            $service->increase($variant, $quantity, $type, $reason, $notes, null, null, auth()->id());
        } else {
            $service->decrease($variant, $quantity, $type, $reason, $notes, null, null, auth()->id());
        }

        return redirect()->route('admin.inventory.adjustments')->with('success', 'Stock adjustment completed successfully.');
    }

    public function lowStock(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:attention,low,out,monitored',
            'search' => 'nullable|string|max:255',
        ]);

        $status = $validated['status'] ?? 'attention';
        $search = $validated['search'] ?? null;

        // SQL mirror of ProductVariant::stockStatus() — backend stays
        // authoritative and the page only reads the derived status.
        $query = ProductVariant::with(['product:id,name'])
            ->where('is_active', true);

        if ($status === 'low') {
            $query->whereNotNull('low_stock_threshold')
                ->where('quantity', '>', 0)
                ->whereColumn('quantity', '<=', 'low_stock_threshold');
        } elseif ($status === 'out') {
            $query->where('quantity', '<=', 0);
        } elseif ($status === 'monitored') {
            $query->whereNotNull('low_stock_threshold');
        } else {
            $query->where(fn ($q) => $q
                ->where('quantity', '<=', 0)
                ->orWhere(fn ($q2) => $q2->whereNotNull('low_stock_threshold')
                    ->whereColumn('quantity', '<=', 'low_stock_threshold')));
        }

        if ($search !== null && $search !== '') {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%")));
        }

        $variants = $query->orderBy('quantity')->orderBy('name')->paginate(20)->withQueryString();

        $activeVariants = fn () => ProductVariant::where('is_active', true);

        return Inertia::render('Admin/Inventory/LowStock', [
            'variants' => $variants,
            'counts' => [
                'low' => $activeVariants()->whereNotNull('low_stock_threshold')
                    ->where('quantity', '>', 0)
                    ->whereColumn('quantity', '<=', 'low_stock_threshold')->count(),
                'out' => $activeVariants()->where('quantity', '<=', 0)->count(),
                'monitored' => $activeVariants()->whereNotNull('low_stock_threshold')->count(),
            ],
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    public function history(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'movement_type' => 'nullable|in:'.implode(',', StockMovement::TYPES),
            'user_id' => 'nullable|exists:users,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = StockMovement::with(['variant.product:id,name', 'user:id,name'])
            ->latest('created_at');

        if (! empty($validated['product_id'])) {
            $productId = $validated['product_id'];
            $query->whereHas('variant', fn ($q) => $q->where('product_id', $productId));
        }

        if (! empty($validated['variant_id'])) {
            $query->where('product_variant_id', $validated['variant_id']);
        }

        if (! empty($validated['movement_type'])) {
            $query->where('movement_type', $validated['movement_type']);
        }

        if (! empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $movements = $query->paginate(20)->withQueryString();

        $products = Product::orderBy('name')->get(['id', 'name']);
        $variants = ProductVariant::with('product:id,name')->orderBy('name')->get(['id', 'name', 'product_id']);
        $users = User::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Inventory/History', [
            'movements' => $movements,
            'filters' => [
                'product_id' => $validated['product_id'] ?? null,
                'variant_id' => $validated['variant_id'] ?? null,
                'movement_type' => $validated['movement_type'] ?? null,
                'user_id' => $validated['user_id'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ],
            'products' => $products,
            'variants' => $variants,
            'users' => $users,
            'movement_types' => StockMovement::TYPES,
        ]);
    }
}
