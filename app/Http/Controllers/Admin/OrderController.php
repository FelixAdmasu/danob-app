<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = Order::with('customer')->latest('ordered_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%"));
            });
        }

        if ($status && in_array($status, Order::STATUSES, true)) {
            $query->where('status', $status);
        }

        $orders = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'items.productVariant']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function confirm(Order $order, OrderService $service)
    {
        $service->confirm($order, (int) auth()->id());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order confirmed. Stock deducted.']);

        return back();
    }

    public function cancel(Order $order, OrderService $service)
    {
        // The service re-reads the status under lock (it is authoritative);
        // this pre-read only words the success toast.
        $wasConfirmed = $order->status === Order::STATUS_CONFIRMED;

        $service->cancel($order, (int) auth()->id());

        Inertia::flash('toast', ['type' => 'success', 'message' => $wasConfirmed
            ? 'Order cancelled and inventory restored.'
            : 'Order cancelled.']);

        return back();
    }

    public function deliver(Order $order, OrderService $service)
    {
        $service->deliver($order);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order delivered.']);

        return back();
    }
}
