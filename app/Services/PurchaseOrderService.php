<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderService
{
    /**
     * How many times create() may be re-run when the unique po_number index
     * rejects a number another transaction claimed first.
     */
    private const REFERENCE_ATTEMPTS = 3;

    public function create(array $data, int $userId): PurchaseOrder
    {
        return $this->withReferenceRetry(fn (): PurchaseOrder => $this->createPurchaseOrder($data, $userId));
    }

    /**
     * The whole create() work runs in one transaction, so the PO number, the
     * purchase order row and its lines all persist — or all roll back —
     * together.
     */
    private function createPurchaseOrder(array $data, int $userId): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $userId) {
            $supplier = Supplier::findOrFail($data['supplier_id']);
            if (! $supplier->is_active) {
                throw ValidationException::withMessages(['supplier_id' => 'Supplier is inactive.']);
            }

            $poNumber = $this->generatePoNumber();

            // Money math uses integer cents so totals are deterministic
            // (no binary floating-point drift), then stored as decimal(12,2).
            $subtotalCents = 0;
            foreach ($data['items'] as $item) {
                $subtotalCents += $this->lineSubtotalCents($item);
            }

            $discountCents = (int) round(((float) ($data['discount'] ?? 0)) * 100);
            $taxCents = (int) round(((float) ($data['tax'] ?? 0)) * 100);
            $totalCents = $subtotalCents - $discountCents + $taxCents;

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $supplier->id,
                'created_by' => $userId,
                'status' => PurchaseOrder::STATUS_DRAFT,
                'ordered_at' => $data['ordered_at'] ?? now()->toDateString(),
                'expected_at' => $data['expected_at'] ?? null,
                'subtotal' => $this->cents($subtotalCents),
                'discount' => $this->cents($discountCents),
                'tax' => $this->cents($taxCents),
                'total' => $this->cents($totalCents),
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $this->validateItem($item);
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $this->cents($this->unitCostCents($item)),
                    'subtotal' => $this->cents($this->lineSubtotalCents($item)),
                    'received_quantity' => 0,
                ]);
            }

            return $po->load('items');
        });
    }

    /**
     * Run $attempt, retrying only when the unique po_number index rejects the
     * number that was picked. That happens whenever two transactions choose
     * the same number because there was no row to lock — the first purchase
     * order of a calendar year, or of a fresh database. Every retry starts a
     * brand new transaction, so the recomputed number is built from the rows
     * the failed attempt could not see. Bounded, so a genuinely broken state
     * fails loudly instead of looping forever.
     *
     * @param  callable(): PurchaseOrder  $attempt
     */
    private function withReferenceRetry(callable $attempt): PurchaseOrder
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
     * True only for a unique-index rejection on purchase_orders.po_number:
     * PostgreSQL reports "unique constraint ... po_number" (SQLSTATE 23505),
     * SQLite reports "UNIQUE constraint failed:
     * purchase_orders.po_number". Every other query failure escapes untouched.
     */
    private function isDuplicateReference(QueryException $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'po_number')
            && str_contains($message, 'unique');
    }

    public function update(PurchaseOrder $po, array $data): PurchaseOrder
    {
        if (! $po->canBeEdited()) {
            throw ValidationException::withMessages(['status' => 'Only draft purchase orders can be edited.']);
        }

        return DB::transaction(function () use ($po, $data) {
            $supplierId = $data['supplier_id'] ?? $po->supplier_id;
            $supplier = Supplier::findOrFail($supplierId);
            if (! $supplier->is_active) {
                throw ValidationException::withMessages(['supplier_id' => 'Supplier is inactive.']);
            }

            // Same deterministic cents math as create(): totals are always
            // recalculated from lines, never trusted from the client.
            $subtotalCents = 0;
            foreach ($data['items'] as $item) {
                $subtotalCents += $this->lineSubtotalCents($item);
            }
            $discountCents = (int) round(((float) ($data['discount'] ?? $po->discount)) * 100);
            $taxCents = (int) round(((float) ($data['tax'] ?? $po->tax)) * 100);
            $totalCents = $subtotalCents - $discountCents + $taxCents;

            $po->update([
                'supplier_id' => $supplierId,
                'ordered_at' => $data['ordered_at'] ?? $po->ordered_at,
                'expected_at' => $data['expected_at'] ?? $po->expected_at,
                'subtotal' => $this->cents($subtotalCents),
                'discount' => $this->cents($discountCents),
                'tax' => $this->cents($taxCents),
                'total' => $this->cents($totalCents),
                'notes' => $data['notes'] ?? $po->notes,
            ]);

            // Replace items
            $po->items()->delete();
            foreach ($data['items'] as $item) {
                $this->validateItem($item);
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $this->cents($this->unitCostCents($item)),
                    'subtotal' => $this->cents($this->lineSubtotalCents($item)),
                    'received_quantity' => 0,
                ]);
            }

            return $po->load('items');
        });
    }

    public function transition(PurchaseOrder $po, string $newStatus): PurchaseOrder
    {
        $allowed = [
            PurchaseOrder::STATUS_DRAFT => [PurchaseOrder::STATUS_SUBMITTED, PurchaseOrder::STATUS_CANCELLED],
            PurchaseOrder::STATUS_SUBMITTED => [PurchaseOrder::STATUS_APPROVED, PurchaseOrder::STATUS_CANCELLED],
            PurchaseOrder::STATUS_APPROVED => [PurchaseOrder::STATUS_PARTIALLY_RECEIVED, PurchaseOrder::STATUS_RECEIVED, PurchaseOrder::STATUS_CANCELLED],
            PurchaseOrder::STATUS_PARTIALLY_RECEIVED => [PurchaseOrder::STATUS_RECEIVED, PurchaseOrder::STATUS_CANCELLED],
        ];

        $current = $po->status;
        if (! isset($allowed[$current]) || ! in_array($newStatus, $allowed[$current], true)) {
            throw ValidationException::withMessages(['status' => "Cannot transition from {$current} to {$newStatus}."]);
        }

        $po->update(['status' => $newStatus]);

        return $po;
    }

    /**
     * Unit cost normalised to whole cents (e.g. 250.5 => 25050), so the
     * stored decimal(12,2) value always matches what was calculated.
     */
    private function unitCostCents(array $item): int
    {
        return (int) round(((float) $item['unit_cost']) * 100);
    }

    /**
     * quantity x unit_cost computed entirely in integer cents:
     * exact and deterministic regardless of binary floating-point rounding.
     */
    private function lineSubtotalCents(array $item): int
    {
        return $this->unitCostCents($item) * (int) $item['quantity'];
    }

    /**
     * Format integer cents as a decimal(12,2) string.
     */
    private function cents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    private function validateItem(array $item): void
    {
        if (! isset($item['product_variant_id'], $item['quantity'], $item['unit_cost'])) {
            throw ValidationException::withMessages(['items' => 'Invalid item data.']);
        }
        if ($item['quantity'] < 1) {
            throw ValidationException::withMessages(['items' => 'Quantity must be at least 1.']);
        }
        if ($item['unit_cost'] < 0) {
            throw ValidationException::withMessages(['items' => 'Unit cost cannot be negative.']);
        }
        $variant = ProductVariant::find($item['product_variant_id']);
        if (! $variant) {
            throw ValidationException::withMessages(['items' => 'Variant not found.']);
        }
        // Ensure variant belongs to product if product_id provided in item
        if (isset($item['product_id']) && (int) $variant->product_id !== (int) $item['product_id']) {
            throw ValidationException::withMessages(['items' => 'Variant does not belong to product.']);
        }
    }

    /**
     * PO-YYYY-NNNNNN per calendar year, generated inside the create()
     * transaction so the number commits together with the purchase order it
     * labels.
     *
     * PostgreSQL rejects `SELECT COUNT(*) ... FOR UPDATE` (SQLSTATE 0A000:
     * only row-returning queries may take a row lock), while SQLite drops the
     * lock clause entirely — which is exactly how the old aggregate version
     * passed this suite and failed in production. The lock is therefore taken
     * on a real row: the newest purchase order of the year, which is the row
     * every concurrent creator must lock too, so a second transaction waits
     * here until the first one commits. The sequence is read in a separate
     * statement whose snapshot is taken after that wait, so it already
     * contains the number the blocking transaction committed, and it continues
     * from the highest number of the year rather than from COUNT — a deleted
     * row can never push the next number onto one that is still stored. The
     * one gap the lock cannot cover (a year with no rows to lock) is caught
     * by the unique po_number index and retried in withReferenceRetry().
     */
    private function generatePoNumber(): string
    {
        $year = date('Y');

        // Lock real rows, never an aggregate.
        DB::table('purchase_orders')
            ->whereYear('created_at', $year)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first('id');

        $highest = 0;
        foreach (DB::table('purchase_orders')->whereYear('created_at', $year)->pluck('po_number') as $poNumber) {
            if (! preg_match('/^PO-(\d{4})-(\d{6})$/', (string) $poNumber, $matches) || $matches[1] !== $year) {
                continue;
            }

            $highest = max($highest, (int) $matches[2]);
        }

        return sprintf('PO-%s-%06d', $year, $highest + 1);
    }
}
