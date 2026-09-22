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
     * Cancel a pending order. Stock is only committed on confirmation, so a
     * pending cancellation never touches inventory. Unwinding stock for an
     * already-confirmed sale is deliberately blocked — restoring inventory on
     * cancellations/returns belongs to the Returns phase.
     */
    public function cancel(Order $order): Order
    {
        return $this->transition($order, Order::STATUS_PENDING, Order::STATUS_CANCELLED, 'Only pending orders can be cancelled.');
    }

    /**
     * Deliver a confirmed order. Pure status change — stock was already
     * deducted at confirmation.
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
