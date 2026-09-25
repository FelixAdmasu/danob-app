<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function increase(ProductVariant $variant, int $quantity, string $type, ?string $reason = null, ?string $notes = null, ?string $referenceType = null, ?int $referenceId = null, ?int $userId = null): StockMovement
    {
        return $this->adjust($variant, $quantity, $type, 1, $reason, $notes, $referenceType, $referenceId, $userId);
    }

    public function decrease(ProductVariant $variant, int $quantity, string $type, ?string $reason = null, ?string $notes = null, ?string $referenceType = null, ?int $referenceId = null, ?int $userId = null): StockMovement
    {
        return $this->adjust($variant, $quantity, $type, -1, $reason, $notes, $referenceType, $referenceId, $userId);
    }

    public function openingBalance(ProductVariant $variant, int $quantity, ?int $userId = null): StockMovement
    {
        return DB::transaction(function () use ($variant, $quantity, $userId) {
            $locked = ProductVariant::where('id', $variant->id)->lockForUpdate()->firstOrFail();
            $before = $locked->quantity;
            $beforeStatus = $locked->stockStatus();
            $after = $quantity;
            if ($quantity < 0) {
                throw ValidationException::withMessages(['quantity' => 'Opening balance cannot be negative.']);
            }
            $locked->quantity = $after;
            $locked->save();

            $movement = StockMovement::create([
                'product_variant_id' => $locked->id,
                'movement_type' => StockMovement::TYPE_OPENING_BALANCE,
                'quantity' => abs($quantity - $before),
                'quantity_before' => $before,
                'quantity_after' => $after,
                'reason' => 'Opening balance',
                'user_id' => $userId ?? Auth::id(),
            ]);

            // Phase 28: an opening balance is a real stock event, so it may
            // transition a variant into low/out of stock. Delegated to
            // AlertService, which only alerts on the transition itself.
            app(AlertService::class)->stockTransition($locked->id, $beforeStatus, $locked->stockStatus());

            return $movement;
        });
    }

    public function adjust(ProductVariant $variant, int $quantity, string $type, int $direction, ?string $reason, ?string $notes, ?string $referenceType, ?int $referenceId, ?int $userId): StockMovement
    {
        if (! in_array($type, StockMovement::TYPES, true)) {
            throw ValidationException::withMessages(['movement_type' => 'Invalid movement type.']);
        }
        if ($quantity <= 0) {
            throw ValidationException::withMessages(['quantity' => 'Quantity must be positive.']);
        }

        return DB::transaction(function () use ($variant, $quantity, $type, $direction, $reason, $notes, $referenceType, $referenceId, $userId) {
            $locked = ProductVariant::where('id', $variant->id)->lockForUpdate()->firstOrFail();
            $before = $locked->quantity;
            $beforeStatus = $locked->stockStatus();
            $after = $before + ($quantity * $direction);

            if ($after < 0) {
                throw ValidationException::withMessages(['quantity' => 'Insufficient stock. Available: '.$before]);
            }

            $locked->quantity = $after;
            $locked->save();

            $movement = StockMovement::create([
                'product_variant_id' => $locked->id,
                'movement_type' => $type,
                'quantity' => $quantity,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'reason' => $reason,
                'notes' => $notes,
                'user_id' => $userId ?? Auth::id(),
            ]);

            // Phase 28: threshold-aware stock alert. The old hardcoded
            // "quantity <= 5" stub is gone — stock status is decided solely
            // by ProductVariant::stockStatus(), and only a genuine
            // transition into low/out of stock produces an alert.
            app(AlertService::class)->stockTransition($locked->id, $beforeStatus, $locked->stockStatus());

            return $movement;
        });
    }

    public function adjustTo(ProductVariant $variant, int $targetQuantity, string $reason, ?int $userId = null): StockMovement
    {
        return DB::transaction(function () use ($variant, $targetQuantity, $reason, $userId) {
            $locked = ProductVariant::where('id', $variant->id)->lockForUpdate()->firstOrFail();
            $before = $locked->quantity;
            $beforeStatus = $locked->stockStatus();
            if ($targetQuantity < 0) {
                throw ValidationException::withMessages(['quantity' => 'Target quantity cannot be negative.']);
            }
            if ($before === $targetQuantity) {
                throw ValidationException::withMessages(['quantity' => 'No change.']);
            }
            $diff = abs($targetQuantity - $before);
            $type = $targetQuantity > $before ? StockMovement::TYPE_ADJUSTMENT_IN : StockMovement::TYPE_ADJUSTMENT_OUT;
            $locked->quantity = $targetQuantity;
            $locked->save();

            $movement = StockMovement::create([
                'product_variant_id' => $locked->id,
                'movement_type' => $type,
                'quantity' => $diff,
                'quantity_before' => $before,
                'quantity_after' => $targetQuantity,
                'reason' => $reason,
                'user_id' => $userId ?? Auth::id(),
            ]);

            // Phase 28: an explicit adjustment is a real stock event too.
            app(AlertService::class)->stockTransition($locked->id, $beforeStatus, $locked->stockStatus());

            return $movement;
        });
    }
}
