<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Create a pending sales order from validated entry data. Pending means
     * exactly that: no stock is touched here — the deduction happens later in
     * confirm() (admin/manager only). Totals are recomputed server-side in
     * integer cents (mirroring PurchaseOrderService) so client-sent money
     * values are never trusted, and every line is validated against the
     * catalog: an active customer, an existing/active variant, an active
     * product, positive quantity, and no duplicate variant lines.
     */
    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $customer = Customer::findOrFail($data['customer_id']);
            if (! $customer->is_active) {
                throw ValidationException::withMessages(['customer_id' => 'Customer is inactive.']);
            }

            $seenVariantIds = [];
            $subtotalCents = 0;
            foreach ($data['items'] as $item) {
                $this->validateItem($item, $seenVariantIds);
                $seenVariantIds[] = (int) $item['product_variant_id'];
                $subtotalCents += $this->lineSubtotalCents($item);
            }

            // Orders carry no discount/tax columns, so total === subtotal.
            $order = Order::create([
                'reference_number' => $this->generateReferenceNumber(),
                'customer_id' => $customer->id,
                'order_source' => 'manual',
                'status' => Order::STATUS_PENDING,
                'subtotal' => $this->cents($subtotalCents),
                'total' => $this->cents($subtotalCents),
                'notes' => $data['notes'] ?? null,
                'ordered_at' => now()->toDateString(),
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create([
                    'product_variant_id' => (int) $item['product_variant_id'],
                    'quantity' => (int) $item['quantity'],
                    'unit_price' => $this->cents($this->unitPriceCents($item)),
                    'subtotal' => $this->cents($this->lineSubtotalCents($item)),
                ]);
            }

            return $order->load('items');
        });
    }

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

    /**
     * Defense-in-depth line validation for order entry (the controller rules
     * already shape the payload; this keeps the service safe for any caller):
     * positive quantity, non-negative price, an existing and active variant
     * belonging to an active product, and no duplicate variant lines.
     *
     * @param  array<int, int>  $seenVariantIds
     */
    private function validateItem(array $item, array $seenVariantIds): void
    {
        if ((int) $item['quantity'] < 1) {
            throw ValidationException::withMessages(['items' => 'Quantity must be at least 1.']);
        }
        if ((float) $item['unit_price'] < 0) {
            throw ValidationException::withMessages(['items' => 'Unit price cannot be negative.']);
        }

        $variantId = (int) $item['product_variant_id'];
        if (in_array($variantId, $seenVariantIds, true)) {
            throw ValidationException::withMessages(['items' => 'Duplicate variant in order items.']);
        }

        $variant = ProductVariant::find($variantId);
        if (! $variant) {
            throw ValidationException::withMessages(['items' => 'Variant not found.']);
        }
        if (! $variant->is_active) {
            throw ValidationException::withMessages(['items' => 'Product variant is inactive.']);
        }
        if (($variant->product?->status ?? null) !== 'active') {
            throw ValidationException::withMessages(['items' => 'Product is not active.']);
        }
    }

    /**
     * quantity x unit_price computed entirely in integer cents (mirroring
     * PurchaseOrderService): exact and deterministic regardless of binary
     * floating-point rounding.
     */
    private function lineSubtotalCents(array $item): int
    {
        return $this->unitPriceCents($item) * (int) $item['quantity'];
    }

    /**
     * Unit price normalised to whole cents, so the stored decimal(10,2) value
     * always matches what was calculated.
     */
    private function unitPriceCents(array $item): int
    {
        return (int) round(((float) $item['unit_price']) * 100);
    }

    /**
     * Format integer cents as a decimal string.
     */
    private function cents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    /**
     * ORD-YYYY-NNNNNN per calendar year, counted under a row lock inside the
     * create() transaction so concurrent entries serialise instead of racing
     * (PurchaseOrderService generates its PO numbers the same way).
     */
    private function generateReferenceNumber(): string
    {
        $year = date('Y');
        $count = DB::table('orders')->whereYear('created_at', $year)->lockForUpdate()->count() + 1;

        return sprintf('ORD-%s-%06d', $year, $count);
    }
}
