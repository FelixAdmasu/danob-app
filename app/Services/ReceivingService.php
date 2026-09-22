<?php

namespace App\Services;

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

            return $receipt->load('items');
        });
    }
}
