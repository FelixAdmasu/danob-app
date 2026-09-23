<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $stats = [
            'products' => Product::count(),
            'categories' => Category::count(),
            'orders' => Order::count(),
            'customers' => Customer::count(),
            'branches' => Branch::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
        ];

        $recentOrders = Order::with('customer')->latest('ordered_at')->limit(5)
            ->get(['id', 'reference_number', 'status', 'total', 'customer_id', 'ordered_at']);

        // Inventory overview mirrors ProductVariant::stockStatus() in SQL and is
        // gated by the same role rule as the inventory routes (admin, manager,
        // super_admin) so staff never receive administrative stock data.
        $inventory = $request->user()->isRole('admin', 'manager') ? $this->inventoryPayload() : null;

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recent_orders' => $recentOrders,
            'inventory' => $inventory,
        ]);
    }

    private function inventoryPayload(): array
    {
        return [
            'metrics' => $this->metrics(),
            'low_stock' => ProductVariant::with('product:id,name')
                ->where('is_active', true)
                ->whereNotNull('low_stock_threshold')
                ->where('quantity', '>', 0)
                ->whereColumn('quantity', '<=', 'low_stock_threshold')
                ->orderBy('quantity')
                ->limit(5)
                ->get(['id', 'product_id', 'name', 'sku', 'quantity', 'low_stock_threshold']),
            'out_of_stock' => ProductVariant::with('product:id,name')
                ->where('is_active', true)
                ->where('quantity', '<=', 0)
                ->orderBy('name')
                ->limit(5)
                ->get(['id', 'product_id', 'name', 'sku', 'quantity', 'low_stock_threshold']),
            'recent_movements' => StockMovement::with(['variant.product:id,name', 'user:id,name'])
                ->latest('created_at')
                ->latest('id')
                ->limit(8)
                ->get(),
            'recent_purchase_orders' => PurchaseOrder::with('supplier:id,name')
                ->latest('created_at')
                ->limit(5)
                ->get(['id', 'po_number', 'supplier_id', 'status', 'ordered_at', 'total', 'created_at']),
        ];
    }

    private function metrics(): array
    {
        // SQL mirror of ProductVariant::stockStatus() over active variants: the
        // out/low/in cases partition every row with exactly the model's rules.
        $row = ProductVariant::where('is_active', true)
            ->selectRaw('count(*) as total_active,
                coalesce(sum(quantity), 0) as total_units,
                coalesce(sum(case when quantity <= 0 then 1 else 0 end), 0) as out_of_stock,
                coalesce(sum(case when quantity > 0 and low_stock_threshold is not null and quantity <= low_stock_threshold then 1 else 0 end), 0) as low_stock,
                coalesce(sum(case when quantity > 0 and (low_stock_threshold is null or quantity > low_stock_threshold) then 1 else 0 end), 0) as in_stock,
                coalesce(sum(case when low_stock_threshold is not null then 1 else 0 end), 0) as monitored')
            ->first();

        return [
            'total_active' => (int) $row->total_active,
            'total_units' => (int) $row->total_units,
            'in_stock' => (int) $row->in_stock,
            'low_stock' => (int) $row->low_stock,
            'out_of_stock' => (int) $row->out_of_stock,
            'monitored' => (int) $row->monitored,
        ];
    }
}
