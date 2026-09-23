<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report G — Customers (page AND CSV export).
 *
 * One row per customer (subquery aggregates, never join duplication):
 * order count, delivered order count, Delivered Sales Value (Phase 23
 * scope — cancelled orders are never presented as completed sales),
 * returned quantity (persisted order-line counters) and return value
 * (authoritative SalesReturn totals over the customer's orders). No
 * "customer revenue" labels and no accounting figures.
 *
 * No date filter: aggregates are lifetime figures, matching how the
 * sales-facing pages present customers.
 */
final class CustomerReport extends Report
{
    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:255',
        ];
    }

    public function query(array $validated): Builder
    {
        $search = $validated['search'] ?? null;

        $query = Customer::query();

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function summary(Builder $query): array
    {
        // Summary over the filtered set; the order aggregates reuse the same
        // filtered builder as a subquery so the filters are defined once.
        $summary = [
            'customers' => $query->clone()->count(),
            'customers_with_orders' => $query->clone()->whereHas('orders')->count(),
            'delivered_orders' => Order::whereIn(
                'customer_id',
                $query->clone()->select('id'),
            )->where('status', Order::STATUS_DELIVERED)->count(),
            'delivered_sales_value' => Order::whereIn(
                'customer_id',
                $query->clone()->select('id'),
            )->where('status', Order::STATUS_DELIVERED)->sum('total'),
        ];

        return [
            'customers' => (int) $summary['customers'],
            'customers_with_orders' => (int) $summary['customers_with_orders'],
            'delivered_orders' => (int) $summary['delivered_orders'],
            'delivered_sales_value' => number_format((float) $summary['delivered_sales_value'], 2, '.', ''),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->withCount(['orders', 'orders as delivered_orders_count' => function ($q): void {
            $q->where('status', Order::STATUS_DELIVERED);
        }])
            ->withSum(['orders as delivered_sales_value' => function ($q): void {
                $q->where('status', Order::STATUS_DELIVERED);
            }], 'total')
            // Correlated scalar subqueries: each customer's returned units
            // and return value, without a join that could duplicate rows.
            ->selectSub(function ($q) {
                return $q->from('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->whereColumn('orders.customer_id', 'customers.id')
                    ->selectRaw('coalesce(sum(order_items.returned_quantity), 0)');
            }, 'returned_units')
            ->selectSub(function ($q) {
                return $q->from('sales_returns')
                    ->join('orders', 'orders.id', '=', 'sales_returns.order_id')
                    ->whereColumn('orders.customer_id', 'customers.id')
                    ->selectRaw('coalesce(sum(sales_returns.total), 0)');
            }, 'return_value')
            ->latest()
            ->latest('id');
    }

    public function transformRow(Model $model): Model
    {
        /** @var Customer $customer */
        $customer = $model;

        $customer->setAttribute('name', $customer->company_name ?: $customer->contact_name ?: '—');
        $customer->setAttribute('orders_count', (int) ($customer->orders_count ?? 0));
        $customer->setAttribute('delivered_orders_count', (int) ($customer->delivered_orders_count ?? 0));
        $customer->setAttribute('returned_units', (int) ($customer->returned_units ?? 0));
        // Normalise the decimal sums to 2dp strings regardless of driver.
        $customer->setAttribute('delivered_sales_value', number_format((float) ($customer->delivered_sales_value ?? 0), 2, '.', ''));
        $customer->setAttribute('return_value', number_format((float) ($customer->return_value ?? 0), 2, '.', ''));

        return $customer;
    }

    public function filters(array $validated): array
    {
        return [
            'search' => $validated['search'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Customer',
            'Contact',
            'Email',
            'Phone',
            'Orders',
            'Delivered Orders',
            'Delivered Sales Value',
            'Returned Units',
            'Return Value',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var Customer $customer */
        $customer = $model;

        return [[
            $customer->name,
            $customer->contact_name,
            $customer->email,
            $customer->phone,
            $customer->orders_count,
            $customer->delivered_orders_count,
            $customer->delivered_sales_value,
            $customer->returned_units,
            $customer->return_value,
        ]];
    }
}
