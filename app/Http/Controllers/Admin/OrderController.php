<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
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

    public function create(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        // Deferred props: partial reloads from the search box only re-run the
        // products query. Only active, sellable catalog reaches the picker;
        // variant quantity is deliberately excluded — stock levels stay
        // admin/manager data, and insufficient stock is surfaced at
        // confirmation time instead. Filters run in the database, bounded.
        return Inertia::render('Admin/Orders/Create', [
            'search' => $search,
            'customers' => fn () => Customer::where('is_active', true)
                ->orderBy('company_name')
                ->orderBy('contact_name')
                ->get(['id', 'company_name', 'contact_name']),
            'products' => fn () => Product::where('status', 'active')
                ->whereHas('variants', fn ($q) => $q->where('is_active', true))
                ->with(['variants' => fn ($q) => $q->where('is_active', true)
                    // Explicit columns: variant quantity (stock) must never
                    // reach this payload — it is admin/manager data.
                    ->select(['id', 'product_id', 'name', 'sku', 'public_price'])
                    ->orderBy('name')])
                ->when($search !== '', fn ($q) => $q->where(function ($w) use ($search) {
                    $like = '%'.$search.'%';
                    $w->where('name', 'like', $like)
                        ->orWhereHas('variants', fn ($v) => $v->where('is_active', true)
                            ->where(fn ($vv) => $vv->where('name', 'like', $like)
                                ->orWhere('sku', 'like', $like)));
                }))
                ->orderBy('name')
                ->take(100)
                ->get(['id', 'name'])
                // stock_status is an appended accessor derived from quantity:
                // without quantity it would serialize as a false out_of_stock,
                // and stock state is admin/manager data — never ship it here.
                ->each(fn ($product) => $product->variants->makeHidden(['stock_status'])),
        ]);
    }

    public function store(Request $request, OrderService $service)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'notes' => 'nullable|string|max:5000',
            'intent' => 'nullable|string|in:draft,create',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id|distinct',
            'items.*.quantity' => 'required|integer|min:1|max:1000000',
            'items.*.unit_price' => 'required|numeric|min:0|max:999999.99',
        ]);

        $order = $service->create($validated);

        // intent only picks the destination: both paths store an identical
        // pending order (the data model has no separate draft status —
        // pending already means "not confirmed, stock untouched").
        $isDraft = ($validated['intent'] ?? 'create') === 'draft';

        Inertia::flash('toast', ['type' => 'success', 'message' => $isDraft
            ? 'Draft saved.'
            : 'Order created.']);

        return $isDraft
            ? redirect()->route('admin.orders.index')
            : redirect()->route('admin.orders.show', $order);
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'items.productVariant', 'returns.returnedBy', 'returns.items']);

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
