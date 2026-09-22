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

        return redirect()->back()->with('success', 'Order confirmed. Stock deducted.');
    }

    public function cancel(Order $order, OrderService $service)
    {
        $service->cancel($order);

        return redirect()->back()->with('success', 'Order cancelled.');
    }

    public function deliver(Order $order, OrderService $service)
    {
        $service->deliver($order);

        return redirect()->back()->with('success', 'Order delivered.');
    }
}
