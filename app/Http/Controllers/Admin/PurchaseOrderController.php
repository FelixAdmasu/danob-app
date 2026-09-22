<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\PurchaseOrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = PurchaseOrder::with(['supplier:id,name', 'items'])->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status && in_array($status, PurchaseOrder::STATUSES, true)) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/PurchaseOrders/Index', [
            'purchase_orders' => $orders,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function create()
    {
        $suppliers = Supplier::active()->orderBy('name')->get(['id', 'name']);
        $products = Product::with(['variants' => fn ($q) => $q->orderBy('name')])->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/PurchaseOrders/Create', [
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, PurchaseOrderService $service)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'ordered_at' => 'nullable|date',
            'expected_at' => 'nullable|date|after_or_equal:ordered_at',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'items.*.unit_cost' => 'required|numeric|min:0|max:1000000',
        ]);

        $po = $service->create($validated, auth()->id());

        return redirect()->route('admin.purchase-orders.show', $po)->with('success', 'Purchase order created.');
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'items.variant.product', 'creator']);

        return Inertia::render('Admin/PurchaseOrders/Show', [
            'purchase_order' => $purchaseOrder,
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder)
    {
        if (! $purchaseOrder->canBeEdited()) {
            return redirect()->route('admin.purchase-orders.show', $purchaseOrder)->with('error', 'Only draft orders can be edited.');
        }

        $suppliers = Supplier::active()->orderBy('name')->get(['id', 'name']);
        $products = Product::with(['variants' => fn ($q) => $q->orderBy('name')])->orderBy('name')->get(['id', 'name']);
        $purchaseOrder->load('items');

        return Inertia::render('Admin/PurchaseOrders/Edit', [
            'purchase_order' => $purchaseOrder,
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder, PurchaseOrderService $service)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'ordered_at' => 'nullable|date',
            'expected_at' => 'nullable|date|after_or_equal:ordered_at',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:5000',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'items.*.unit_cost' => 'required|numeric|min:0|max:1000000',
        ]);

        $service->update($purchaseOrder, $validated);

        return redirect()->route('admin.purchase-orders.show', $purchaseOrder)->with('success', 'Purchase order updated.');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if (! $purchaseOrder->canBeEdited()) {
            return redirect()->route('admin.purchase-orders.index')->with('error', 'Only draft orders can be deleted.');
        }

        $purchaseOrder->delete();

        return redirect()->route('admin.purchase-orders.index')->with('success', 'Purchase order deleted.');
    }

    public function submit(PurchaseOrder $purchaseOrder, PurchaseOrderService $service)
    {
        $service->transition($purchaseOrder, PurchaseOrder::STATUS_SUBMITTED);

        return redirect()->back()->with('success', 'Purchase order submitted.');
    }

    public function approve(PurchaseOrder $purchaseOrder, PurchaseOrderService $service)
    {
        $service->transition($purchaseOrder, PurchaseOrder::STATUS_APPROVED);

        return redirect()->back()->with('success', 'Purchase order approved.');
    }

    public function cancel(PurchaseOrder $purchaseOrder, PurchaseOrderService $service)
    {
        $service->transition($purchaseOrder, PurchaseOrder::STATUS_CANCELLED);

        return redirect()->back()->with('success', 'Purchase order cancelled.');
    }
}
