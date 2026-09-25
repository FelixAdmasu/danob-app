<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesReturnService
{
    /**
     * Process a customer return against a delivered order. Returns are
     * deliberately separate from cancellation: cancellation unwinds a sale
     * before delivery, a return brings physically-delivered goods back after
     * delivery. The order stays delivered — only stock, the per-line
     * returned_quantity counters and the sales_return records change.
     *
     * Everything runs in one transaction: the order row is locked first
     * (serialising concurrent returns), each ordered line is re-read under
     * lock, and the remaining returnable quantity (quantity -
     * returned_quantity) is enforced per line, so returned stock can never
     * exceed what was actually sold. Stock is restored exclusively through
     * InventoryService::increase (TYPE_RETURN_IN), which records an auditable
     * StockMovement referencing the SalesReturn. Any failure escapes
     * DB::transaction and rolls back every movement, counter and the return
     * record together.
     */
    public function process(Order $order, array $items, ?string $notes, int $userId): SalesReturn
    {
        return DB::transaction(function () use ($order, $items, $notes, $userId) {
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== Order::STATUS_DELIVERED) {
                throw ValidationException::withMessages(['order' => 'Only delivered orders can be returned. Undelivered orders use cancellation.']);
            }

            $return = SalesReturn::create([
                'return_number' => sprintf('RET-%s-%06d', date('Y'), SalesReturn::whereYear('created_at', date('Y'))->count() + 1),
                'order_id' => $locked->id,
                'returned_by' => $userId,
                'returned_at' => now()->toDateString(),
                'notes' => $notes,
                'total' => 0,
            ]);

            $inventory = app(InventoryService::class);
            $total = 0;

            foreach ($items as $itemData) {
                $orderItem = $locked->items()->where('id', $itemData['order_item_id'])->lockForUpdate()->firstOrFail();
                $qty = (int) $itemData['quantity'];

                if ($qty <= 0) {
                    throw ValidationException::withMessages(['quantity' => 'Quantity must be positive.']);
                }

                $remaining = $orderItem->quantity - $orderItem->returned_quantity;
                if ($qty > $remaining) {
                    throw ValidationException::withMessages(['quantity' => "Cannot return {$qty}, only {$remaining} remaining for item {$orderItem->id}."]);
                }

                $variant = $orderItem->productVariant()->lockForUpdate()->firstOrFail();
                $lineSubtotal = number_format($qty * (float) $orderItem->unit_price, 2, '.', '');

                SalesReturnItem::create([
                    'sales_return_id' => $return->id,
                    'order_item_id' => $orderItem->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $qty,
                    'unit_price' => $orderItem->unit_price,
                    'subtotal' => $lineSubtotal,
                ]);

                $inventory->increase(
                    $variant,
                    $qty,
                    StockMovement::TYPE_RETURN_IN,
                    'Sales return '.$return->return_number.' for '.$locked->reference_number,
                    null,
                    SalesReturn::class,
                    $return->id,
                    $userId,
                );

                $orderItem->increment('returned_quantity', $qty);

                $total += (float) $lineSubtotal;
            }

            $return->update(['total' => number_format($total, 2, '.', '')]);

            // Phase 28: the return is complete; alert every user who can open
            // the order page. Stock restoration above is unchanged.
            app(AlertService::class)->dispatch(
                'sales_return_processed',
                'warning',
                'Sales return processed',
                $return->return_number.' for '.$locked->reference_number.' was processed and stock was restored.',
                route('admin.orders.show', $locked),
                AlertService::SALES_ROLES,
            );

            return $return->load('items');
        });
    }
}
