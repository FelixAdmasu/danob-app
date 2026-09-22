<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'products' => Product::count(),
                'categories' => Category::count(),
                'orders' => Order::count(),
                'customers' => Customer::count(),
                'branches' => Branch::count(),
                'low_stock_variants' => ProductVariant::where('quantity', '<=', 5)->where('is_active', true)->count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
            ],
            'recent_orders' => Order::with('customer')->latest('ordered_at')->limit(5)->get(['id', 'reference_number', 'status', 'total', 'customer_id', 'ordered_at']),
            'low_stock' => ProductVariant::with('product:id,name')->where('quantity', '<=', 5)->where('is_active', true)->limit(5)->get(['id', 'product_id', 'name', 'quantity', 'sku']),
        ]);
    }
}
