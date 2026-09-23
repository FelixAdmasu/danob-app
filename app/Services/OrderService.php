<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Confirm a pending order: atomically deduct stock for every line through
     * InventoryService (TYPE_SALE). The order row is locked first, so an order
     * can never be confirmed — and therefore never deducted — twice. If any
     * line has insufficient stock, the exception escapes the transaction and
     * every deduction rolls back together with the status change.
     */
    public function confirm(Order $order, int $userId): Order
    {
        return DB::transaction(function () use ($order, $userId) {
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== Order::STATUS_PENDING) {
                throw ValidationException::withMessages(['status' => 'Only pending orders can be confirmed.']);
            }

            $inventory = app(InventoryService::class);

            foreach ($locked->items()->get() as $item) {
                $variant = ProductVariant::where('id', $item->product_variant_id)->lockForUpdate()->firstOrFail();

                $inventory->decrease(
                    $variant,
                    $item->quantity,
                    StockMovement::TYPE_SALE,
                    'Sale '.$locked->reference_number,
                    null,
                    Order::class,
                    $locked->id,
                    $userId,
                );
            }

            $locked->update(['status' => Order::STATUS_CONFIRMED]);

            return $locked;
        });
    }

    /**
     * Cancel an order. A pending order never deducted stock, so cancellation
     * is a plain status change. A confirmed order deducted stock on
     * confirmation, so every line is restored through InventoryService
     * (TYPE_CANCELLATION_IN) inside the same transaction: the order row is
     * locked first, so a second cancellation waits, sees "cancelled" and is
     * rejected — stock can never be restored twice. If any line fails to
     * restore, the exception escapes DB::transaction and rolls back the
     * partial restorations, their stock movements and the status change
     * together. Delivered orders require the Returns workflow and stay
     * blocked; cancelled orders are final.
     */
    public function cancel(Order $order, int $userId): Order
    {
        return DB::transaction(function () use ($order, $userId) {
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages(['status' => 'Order is already cancelled.']);
            }

            if ($locked->status === Order::STATUS_PENDING) {
                // No stock was ever deducted for a pending order.
                $locked->update(['status' => Order::STATUS_CANCELLED]);

                return $locked;
            }

            if ($locked->status !== Order::STATUS_CONFIRMED) {
                throw ValidationException::withMessages(['status' => 'Only pending or confirmed orders can be cancelled. Delivered orders require the returns workflow.']);
            }

            $inventory = app(InventoryService::class);

            foreach ($locked->items()->get() as $item) {
                $variant = ProductVariant::where('id', $item->product_variant_id)->lockForUpdate()->firstOrFail();

                $inventory->increase(
                    $variant,
                    $item->quantity,
                    StockMovement::TYPE_CANCELLATION_IN,
                    'Order '.$locked->reference_number.' cancellation reversal',
                    null,
                    Order::class,
                    $locked->id,
                    $userId,
                );
            }

            $locked->update(['status' => Order::STATUS_CANCELLED]);

            return $locked;
        });
    }

    /**
     * Deliver a confirmed order. Pure status change — stock was already
     * deducted at confirmation (and would have been restored by a
     * cancellation, but a cancelled order can never reach this transition).
     */
    public function deliver(Order $order): Order
    {
        return $this->transition($order, Order::STATUS_CONFIRMED, Order::STATUS_DELIVERED, 'Only confirmed orders can be delivered.');
    }

    private function transition(Order $order, string $from, string $to, string $message): Order
    {
        return DB::transaction(function () use ($order, $from, $to, $message) {
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== $from) {
                throw ValidationException::withMessages(['status' => $message]);
            }

            $locked->update(['status' => $to]);

            return $locked;
        });
    }
}
