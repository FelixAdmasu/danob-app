<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'name', 'unit', 'quantity', 'low_stock_threshold', 'sku', 'public_price', 'is_active'])]
class ProductVariant extends Model
{
    use HasFactory;

    public const STOCK_STATUS_IN_STOCK = 'in_stock';

    public const STOCK_STATUS_LOW_STOCK = 'low_stock';

    public const STOCK_STATUS_OUT_OF_STOCK = 'out_of_stock';

    protected $appends = ['stock_status'];

    protected function casts(): array
    {
        return [
            'public_price' => 'decimal:2',
            'is_active' => 'boolean',
            'quantity' => 'integer',
            'low_stock_threshold' => 'integer',
        ];
    }

    /**
     * Authoritative stock status for this variant. Derived state only: it
     * reads the quantity, never writes it, and never creates a StockMovement.
     *
     * - quantity <= 0                                  -> out_of_stock (always)
     * - quantity > 0 and threshold is null             -> in_stock (monitoring disabled)
     * - quantity <= threshold                          -> low_stock
     * - quantity > threshold                           -> in_stock
     */
    public function stockStatus(): string
    {
        if ($this->quantity <= 0) {
            return self::STOCK_STATUS_OUT_OF_STOCK;
        }

        if ($this->low_stock_threshold === null) {
            return self::STOCK_STATUS_IN_STOCK;
        }

        if ($this->quantity <= $this->low_stock_threshold) {
            return self::STOCK_STATUS_LOW_STOCK;
        }

        return self::STOCK_STATUS_IN_STOCK;
    }

    protected function getStockStatusAttribute(): string
    {
        return $this->stockStatus();
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
