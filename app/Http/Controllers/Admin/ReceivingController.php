<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\ReceivingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReceivingController extends Controller
{
    public function create(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'items.variant.product']);
        if (! $purchaseOrder->canBeReceived()) {
            return redirect()->route('admin.purchase-orders.show', $purchaseOrder)->with('error', 'Cannot receive this order.');
        }

        return Inertia::render('Admin/PurchaseOrders/Receive', ['purchase_order' => $purchaseOrder]);
    }

    public function store(Request $request, PurchaseOrder $purchaseOrder, ReceivingService $service)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'notes' => 'nullable|string|max:1000',
        ]);

        $receipt = $service->receive($purchaseOrder, $validated['items'], $validated['notes'] ?? null);

        return redirect()->route('admin.purchase-orders.show', $purchaseOrder)->with('success', 'Received '.$receipt->receipt_number);
    }
}
