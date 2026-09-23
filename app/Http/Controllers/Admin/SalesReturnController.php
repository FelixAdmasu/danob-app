<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\SalesReturnService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesReturnController extends Controller
{
    public function create(Order $order)
    {
        $order->load(['customer', 'items.productVariant']);

        if ($order->status !== Order::STATUS_DELIVERED) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Only delivered orders can be returned.']);

            return redirect()->route('admin.orders.show', $order);
        }

        if (! $order->items()->whereColumn('quantity', '>', 'returned_quantity')->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'All items on this order have already been returned.']);

            return redirect()->route('admin.orders.show', $order);
        }

        return Inertia::render('Admin/SalesReturns/Create', ['order' => $order]);
    }

    public function store(Request $request, Order $order, SalesReturnService $service)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'notes' => 'nullable|string|max:1000',
        ]);

        $return = $service->process($order, $validated['items'], $validated['notes'] ?? null, (int) $request->user()->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Return '.$return->return_number.' processed. Stock restored.']);

        return redirect()->route('admin.orders.show', $order);
    }
}
