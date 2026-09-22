<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
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
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status && in_array($status, ['pending', 'confirmed', 'delivered', 'cancelled'])) {
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
}
