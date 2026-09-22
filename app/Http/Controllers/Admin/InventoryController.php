<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
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
}
