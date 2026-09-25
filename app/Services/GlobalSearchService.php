<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Global search (Phase 27) — a bounded, read-only, server-authoritative
 * lookup across the entities the ERP already treats as searchable.
 *
 * Contracts honoured here:
 * - Authorization is inherited, never re-invented: the sales-facing groups
 *   (customers, orders) sit behind the shared role:admin,manager,staff
 *   group, and every catalog/purchasing group is gated with the same
 *   isRole('admin','manager') rule as its list routes — so a role only
 *   ever receives records it could already open directly.
 * - Every query is database-side and bounded: LIKE constraints with the
 *   term as a bound parameter (never string-concatenated into SQL) and a
 *   hard per-entity limit. Nothing is loaded "all rows then filtered".
 * - Results are normalized to safe identifying fields only (type, label,
 *   subtitle, status, url): no notes, costs, thresholds, phone numbers on
 *   restricted entities, no internal ids — the URL is the single way in.
 * - Groups only appear when they have matches, so the payload stays as
 *   small as the answer actually is.
 */
class GlobalSearchService
{
    /**
     * Per-entity cap. Enough rows to recognize and click through, small
     * enough that the header panel can never become a data dump.
     */
    public const LIMIT = 5;

    /**
     * @return array<int, array{key: string, label: string, items: array<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>}>
     */
    public function search(string $term, User $user): array
    {
        $term = trim($term);

        if ($term === '') {
            return [];
        }

        // Catalog and purchasing groups mirror the role:admin,manager route
        // group; sales-facing groups are open to every role that can reach
        // this endpoint (role:admin,manager,staff).
        $canManageCatalog = $user->isRole('admin', 'manager');

        $groups = [];

        if ($canManageCatalog) {
            $groups[] = $this->group('products', 'Products', $this->products($term));
        }

        $groups[] = $this->group('customers', 'Customers', $this->customers($term));
        $groups[] = $this->group('orders', 'Orders', $this->orders($term));

        if ($canManageCatalog) {
            $groups[] = $this->group('purchase_orders', 'Purchase Orders', $this->purchaseOrders($term));
            $groups[] = $this->group('suppliers', 'Suppliers', $this->suppliers($term));
            $groups[] = $this->group('branches', 'Branches', $this->branches($term));
            $groups[] = $this->group('categories', 'Categories', $this->categories($term));
            $groups[] = $this->group('brands', 'Brands', $this->brands($term));
        }

        return array_values(array_filter($groups));
    }

    /**
     * @param  Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>  $items
     * @return array{key: string, label: string, items: array<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>}|null
     */
    private function group(string $key, string $label, Collection $items): ?array
    {
        if ($items->isEmpty()) {
            return null;
        }

        return [
            'key' => $key,
            'label' => $label,
            'items' => $items->values()->all(),
        ];
    }

    /**
     * Products by name/slug or by any variant name/SKU — the same fields a
     * user types from a product page.
     *
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function products(string $term): Collection
    {
        return Product::query()
            ->with('category:id,name')
            ->where(function ($query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%")
                    ->orWhereHas('variants', function ($variant) use ($term): void {
                        $variant->where('name', 'like', "%{$term}%")
                            ->orWhere('sku', 'like', "%{$term}%");
                    });
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Product $product): array => [
                'type' => 'product',
                'label' => $product->name,
                'subtitle' => $product->category?->name,
                'status' => $product->status,
                'url' => route('admin.products.show', $product),
            ]);
    }

    /**
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function customers(string $term): Collection
    {
        return Customer::query()
            ->where(function ($query) use ($term): void {
                $query->where('company_name', 'like', "%{$term}%")
                    ->orWhere('contact_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Customer $customer): array => [
                'type' => 'customer',
                'label' => $customer->company_name ?: $customer->contact_name ?: $customer->email ?: $customer->phone ?: 'Customer #'.$customer->id,
                'subtitle' => $customer->company_name
                    ? ($customer->contact_name ?: $customer->email)
                    : ($customer->email ?: $customer->phone),
                'status' => $customer->is_active ? 'active' : 'inactive',
                'url' => route('admin.customers.show', $customer),
            ]);
    }

    /**
     * Orders by reference number or by the customer's name — the two things
     * anyone ever remembers about an order.
     *
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function orders(string $term): Collection
    {
        return Order::query()
            ->with('customer:id,company_name,contact_name')
            ->where('reference_number', 'like', "%{$term}%")
            ->orWhereHas('customer', function ($query) use ($term): void {
                $query->where('company_name', 'like', "%{$term}%")
                    ->orWhere('contact_name', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Order $order): array => [
                'type' => 'order',
                'label' => $order->reference_number,
                'subtitle' => $order->customer
                    ? ($order->customer->company_name ?: $order->customer->contact_name)
                    : null,
                'status' => $order->status,
                'url' => route('admin.orders.show', $order),
            ]);
    }

    /**
     * Purchase orders by PO number or supplier name.
     *
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function purchaseOrders(string $term): Collection
    {
        return PurchaseOrder::query()
            ->with('supplier:id,name')
            ->where('po_number', 'like', "%{$term}%")
            ->orWhereHas('supplier', fn ($query) => $query->where('name', 'like', "%{$term}%"))
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (PurchaseOrder $purchaseOrder): array => [
                'type' => 'purchase_order',
                'label' => $purchaseOrder->po_number,
                'subtitle' => $purchaseOrder->supplier?->name,
                'status' => $purchaseOrder->status,
                'url' => route('admin.purchase-orders.show', $purchaseOrder),
            ]);
    }

    /**
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function suppliers(string $term): Collection
    {
        return Supplier::query()
            ->where(function ($query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('contact_person', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Supplier $supplier): array => [
                'type' => 'supplier',
                'label' => $supplier->name,
                'subtitle' => $supplier->contact_person ?: $supplier->email ?: $supplier->phone,
                'status' => $supplier->is_active ? 'active' : 'inactive',
                'url' => route('admin.suppliers.show', $supplier),
            ]);
    }

    /**
     * Branches have no show page, so results land on the existing edit page.
     *
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function branches(string $term): Collection
    {
        return Branch::query()
            ->where(function ($query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('city', 'like', "%{$term}%")
                    ->orWhere('address', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Branch $branch): array => [
                'type' => 'branch',
                'label' => $branch->name,
                'subtitle' => $branch->city,
                'status' => $branch->is_active ? 'active' : 'inactive',
                'url' => route('admin.branches.edit', $branch),
            ]);
    }

    /**
     * Categories/brands have no show page either — same edit-page target.
     *
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function categories(string $term): Collection
    {
        return Category::query()
            ->where(function ($query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Category $category): array => [
                'type' => 'category',
                'label' => $category->name,
                'subtitle' => $category->slug,
                'status' => $category->is_active ? 'active' : 'inactive',
                'url' => route('admin.categories.edit', $category),
            ]);
    }

    /**
     * @return Collection<int, array{type: string, label: string, subtitle: string|null, status: string|null, url: string}>
     */
    private function brands(string $term): Collection
    {
        return Brand::query()
            ->where(function ($query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('slug', 'like', "%{$term}%");
            })
            ->latest()
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Brand $brand): array => [
                'type' => 'brand',
                'label' => $brand->name,
                'subtitle' => $brand->slug,
                'status' => $brand->is_active ? 'active' : 'inactive',
                'url' => route('admin.brands.edit', $brand),
            ]);
    }
}
