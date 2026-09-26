<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * How many times create() may be re-run when the unique reference index
     * rejects a number another transaction claimed first.
     */
    private const REFERENCE_ATTEMPTS = 3;

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
        return $this->withReferenceRetry(fn (): Order => $this->createOrder($data));
    }

    /**
     * The whole create() work runs in one transaction, so the reference
     * number, the order row and its lines all persist — or all roll back —
     * together.
     */
    private function createOrder(array $data): Order
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

            // Phase 28: side effect only — delivered after the commit, to
            // everyone authorized to open admin.orders.show.
            app(AlertService::class)->dispatch(
                'order_created',
                'info',
                'Order created',
                $order->reference_number.' was created and is awaiting confirmation.',
                route('admin.orders.show', $order),
                AlertService::SALES_ROLES,
            );

            return $order->load('items');
        });
    }

    /**
     * Run $attempt, retrying only when the unique reference index rejects the
     * number that was picked. That happens whenever two transactions choose
     * the same number because there was no row to lock — the first order of a
     * calendar year, or of a fresh database. Every retry starts a brand new
     * transaction, so the recomputed number is built from the rows the failed
     * attempt could not see. Bounded, so a genuinely broken state fails
     * loudly instead of looping forever.
     *
     * @param  callable(): Order  $attempt
     */
    private function withReferenceRetry(callable $attempt): Order
    {
        $try = 1;

        while (true) {
            try {
                return $attempt();
            } catch (QueryException $e) {
                if ($try >= self::REFERENCE_ATTEMPTS || ! $this->isDuplicateReference($e)) {
                    throw $e;
                }

                $try++;
            }
        }
    }

    /**
     * True only for a unique-index rejection on orders.reference_number:
     * PostgreSQL reports "unique constraint ... reference_number" (SQLSTATE
     * 23505), SQLite reports "UNIQUE constraint failed:
     * orders.reference_number". Every other query failure escapes untouched.
     */
    private function isDuplicateReference(QueryException $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'reference_number')
            && str_contains($message, 'unique');
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

            // Phase 28: the confirmation itself is the event. Stock changes
            // already happened above; this alert is deferred past the commit
            // and can never roll the confirmation back.
            app(AlertService::class)->dispatch(
                'order_confirmed',
                'success',
                'Order confirmed',
                $locked->reference_number.' was confirmed and stock was deducted.',
                route('admin.orders.show', $locked),
                AlertService::SALES_ROLES,
            );

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

                app(AlertService::class)->dispatch(
                    'order_cancelled',
                    'warning',
                    'Order cancelled',
                    $locked->reference_number.' was cancelled.',
                    route('admin.orders.show', $locked),
                    AlertService::SALES_ROLES,
                );

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

            app(AlertService::class)->dispatch(
                'order_cancelled',
                'warning',
                'Order cancelled',
                $locked->reference_number.' was cancelled and its stock was restored.',
                route('admin.orders.show', $locked),
                AlertService::SALES_ROLES,
            );

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
        $delivered = $this->transition($order, Order::STATUS_CONFIRMED, Order::STATUS_DELIVERED, 'Only confirmed orders can be delivered.');

        // Phase 28: runs after the transition committed; the delivery itself
        // can never be undone by a failed alert.
        app(AlertService::class)->dispatch(
            'order_delivered',
            'success',
            'Order delivered',
            $delivered->reference_number.' was delivered.',
            route('admin.orders.show', $delivered),
            AlertService::SALES_ROLES,
        );

        return $delivered;
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
     * ORD-YYYY-NNNNNN per calendar year, generated inside the create()
     * transaction so the number commits together with the order it labels.
     *
     * PostgreSQL rejects `SELECT COUNT(*) ... FOR UPDATE` (SQLSTATE 0A000:
     * only row-returning queries may take a row lock), while SQLite drops the
     * lock clause entirely — which is exactly how the old aggregate version
     * passed this suite and failed in production. The lock is therefore taken
     * on a real row: the newest order of the year, which is the row every
     * concurrent creator must lock too, so a second transaction waits here
     * until the first one commits. The sequence is read in a separate
     * statement whose snapshot is taken after that wait, so it already
     * contains the number the blocking transaction committed, and it continues
     * from the highest reference of the year rather than from COUNT — a
     * deleted row can never push the next number onto one that is still
     * stored. The one gap the lock cannot cover (a year with no rows to lock)
     * is caught by the unique index and retried in withReferenceRetry().
     */
    private function generateReferenceNumber(): string
    {
        $year = date('Y');

        // Lock real rows, never an aggregate.
        DB::table('orders')
            ->whereYear('created_at', $year)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first('id');

        $highest = 0;
        foreach (DB::table('orders')->whereYear('created_at', $year)->pluck('reference_number') as $reference) {
            if (! preg_match('/^ORD-(\d{4})-(\d{6})$/', (string) $reference, $matches) || $matches[1] !== $year) {
                continue;
            }

            $highest = max($highest, (int) $matches[2]);
        }

        return sprintf('ORD-%s-%06d', $year, $highest + 1);
    }
}
