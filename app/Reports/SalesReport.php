<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Report C — Sales (page AND CSV export).
 *
 * Every order status is shown as-is (pending/confirmed/delivered/
 * cancelled stay obvious). Delivered Sales Value is Phase 23's operational
 * figure: SUM(orders.total) for delivered orders only — cancelled totals
 * never count as sales. Returned quantity and return value are derived per
 * order (persisted counters and SalesReturn.total, never recalculated); a
 * returned order keeps its Delivered status and the return information is
 * shown in separate columns.
 *
 * Date field: ordered_at.
 */
final class SalesReport extends Report
{
    public function rules(): array
    {
        return [
            'status' => 'nullable|in:'.implode(',', Order::STATUSES),
            'customer_id' => 'nullable|exists:customers,id',
            'search' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ];
    }

    public function query(array $validated): Builder
    {
        $query = Order::query();

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['customer_id'])) {
            $query->where('customer_id', $validated['customer_id']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%"));
            });
        }

        $this->applyDateRange($query, 'ordered_at', $validated['date_from'] ?? null, $validated['date_to'] ?? null);

        return $query;
    }

    public function summary(Builder $query): array
    {
        // One filtered aggregate. Each return total is a correlated scalar
        // subquery wrapped in the outer sum (report B's pattern): a bare
        // scalar column alongside count/sum is evaluated against a single
        // arbitrary row instead of being aggregated across every order.
        $summary = $query->clone()->toBase()->selectRaw('
                count(*) as orders,
                coalesce(sum(case when status = ? then 1 else 0 end), 0) as delivered_orders,
                coalesce(sum(case when status = ? then total else 0 end), 0) as delivered_sales_value,
                coalesce(sum((
                    select coalesce(sum(order_items.returned_quantity), 0)
                    from order_items
                    where order_items.order_id = orders.id
                )), 0) as returned_units,
                coalesce(sum((
                    select coalesce(sum(sales_returns.total), 0)
                    from sales_returns
                    where sales_returns.order_id = orders.id
                )), 0) as return_value
            ', [
            Order::STATUS_DELIVERED,
            Order::STATUS_DELIVERED,
        ])->first();

        return [
            'orders' => (int) $summary->orders,
            'delivered_orders' => (int) $summary->delivered_orders,
            'delivered_sales_value' => number_format((float) $summary->delivered_sales_value, 2, '.', ''),
            'returned_units' => (int) $summary->returned_units,
            'return_value' => number_format((float) $summary->return_value, 2, '.', ''),
        ];
    }

    public function rows(Builder $query): Builder
    {
        return $query->with('customer:id,company_name,contact_name')
            ->withSum('items as returned_quantity', 'returned_quantity')
            ->withSum('returns as return_value', 'total')
            ->latest('ordered_at')
            ->latest('id');
    }

    public function transformRow(Model $model): Model
    {
        /** @var Order $order */
        $order = $model;

        $order->setAttribute('returned_quantity', (int) ($order->returned_quantity ?? 0));
        $order->setAttribute('return_value', number_format((float) ($order->return_value ?? 0), 2, '.', ''));

        return $order;
    }

    public function filters(array $validated): array
    {
        return [
            'status' => $validated['status'] ?? null,
            'customer_id' => $validated['customer_id'] ?? null,
            'search' => $validated['search'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ];
    }

    public function columns(): array
    {
        return [
            'Order',
            'Customer',
            'Status',
            'Ordered Date',
            'Total',
            'Returned Units',
            'Return Value',
        ];
    }

    public function mapRows(Model $model): array
    {
        /** @var Order $order */
        $order = $model;

        return [[
            $order->reference_number,
            $order->customer?->company_name ?: $order->customer?->contact_name ?: null,
            $order->status,
            $order->ordered_at?->format('Y-m-d'),
            $order->total,
            $order->returned_quantity,
            $order->return_value,
        ]];
    }
}
