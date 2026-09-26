<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReceivingService
{
    public function receive(PurchaseOrder $po, array $items, ?string $notes = null): PurchaseReceipt
    {
        if (! $po->canBeReceived()) {
            throw ValidationException::withMessages(['purchase_order' => 'Purchase order cannot be received in status '.$po->status]);
        }

        return DB::transaction(function () use ($po, $items, $notes) {
            $lockedPo = PurchaseOrder::where('id', $po->id)->lockForUpdate()->firstOrFail();
            $receiptNumber = sprintf('GRN-%s-%06d', date('Y'), PurchaseReceipt::whereYear('created_at', date('Y'))->count() + 1);

            $receipt = PurchaseReceipt::create([
                'receipt_number' => $receiptNumber,
                'purchase_order_id' => $lockedPo->id,
                'received_by' => Auth::id(),
                'received_at' => now()->toDateString(),
                'notes' => $notes,
            ]);

            $inventory = app(InventoryService::class);
            $allReceived = true;

            foreach ($items as $itemData) {
                $orderItem = $lockedPo->items()->where('id', $itemData['purchase_order_item_id'])->lockForUpdate()->firstOrFail();
                $qtyToReceive = (int) $itemData['quantity'];
                if ($qtyToReceive <= 0) {
                    throw ValidationException::withMessages(['quantity' => 'Quantity must be positive.']);
                }
                $remaining = $orderItem->quantity - $orderItem->received_quantity;
                if ($qtyToReceive > $remaining) {
                    throw ValidationException::withMessages(['quantity' => "Cannot receive {$qtyToReceive}, only {$remaining} remaining for item {$orderItem->id}."]);
                }

                $variant = $orderItem->variant()->lockForUpdate()->firstOrFail();

                // Create receipt item
                PurchaseReceiptItem::create([
                    'purchase_receipt_id' => $receipt->id,
                    'purchase_order_item_id' => $orderItem->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $qtyToReceive,
                    'unit_cost' => $orderItem->unit_cost,
                ]);

                // Increase stock
                $inventory->increase($variant, $qtyToReceive, StockMovement::TYPE_PURCHASE, 'Purchase receiving '.$receipt->receipt_number, null, PurchaseReceipt::class, $receipt->id, Auth::id());

                $orderItem->increment('received_quantity', $qtyToReceive);
                $orderItem->refresh();
                if ($orderItem->received_quantity < $orderItem->quantity) {
                    $allReceived = false;
                }
            }

            // Update PO status
            $lockedPo->refresh();
            $hasPartial = $lockedPo->items()->whereColumn('received_quantity', '<', 'quantity')->exists();
            if (! $hasPartial) {
                $lockedPo->update(['status' => PurchaseOrder::STATUS_RECEIVED]);
            } else {
                $lockedPo->update(['status' => PurchaseOrder::STATUS_PARTIALLY_RECEIVED]);
            }

            // Phase 28: receiving already happened above — this only records
            // the outcome for purchasing users, after the commit. Receipt
            // quantities and the PO status logic above stay untouched.
            app(AlertService::class)->dispatch(
                $hasPartial ? 'purchase_order_partially_received' : 'purchase_order_received',
                $hasPartial ? 'warning' : 'success',
                $hasPartial ? 'PO partially received' : 'PO received',
                $lockedPo->po_number.($hasPartial ? ' has new goods received ('.$receipt->receipt_number.').' : ' was fully received ('.$receipt->receipt_number.').'),
                route('admin.purchase-orders.show', $lockedPo),
                AlertService::PURCHASING_ROLES,
                $this->receivingMailContext($lockedPo, $receipt, $hasPartial),
            );

            return $receipt->load('items');
        });
    }

    /**
     * Phase 29 — structured detail for the internal receiving email: who
     * supplied, what arrived in this receipt and what is still outstanding.
     * All values are read back from the records the transaction just wrote;
     * none of the receiving logic above is duplicated or re-decided here.
     *
     * @return array<string, string|array<int, string>>
     */
    private function receivingMailContext(PurchaseOrder $po, PurchaseReceipt $receipt, bool $hasPartial): array
    {
        $receipt->loadMissing('items.variant.product');
        $po->loadMissing('supplier');

        $received = [];
        foreach ($receipt->items as $receiptItem) {
            $received[] = $this->variantLabel($receiptItem->variant).' × '.$receiptItem->quantity;
        }

        $context = [
            'Supplier' => $po->supplier->name,
            'Status' => $hasPartial ? 'Partially received' : 'Fully received',
            'Receipt' => $receipt->receipt_number,
            'Received this receipt' => $received === [] ? ['nothing'] : $received,
        ];

        $outstanding = [];
        foreach ($po->items as $poItem) {
            if ($poItem->remaining > 0) {
                $outstanding[] = $this->variantLabel($poItem->variant).' — '.$poItem->remaining.' of '.$poItem->quantity.' outstanding';
            }
        }

        if ($outstanding !== []) {
            $context['Still outstanding'] = $outstanding;
        }

        return $context;
    }

    private function variantLabel(?ProductVariant $variant): string
    {
        if (! $variant) {
            return 'Removed variant';
        }

        return $variant->product ? $variant->product->name.' — '.$variant->name : $variant->name;
    }
}
