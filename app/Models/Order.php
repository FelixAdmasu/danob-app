<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['reference_number', 'customer_id', 'order_source', 'status', 'subtotal', 'total', 'notes', 'ordered_at'])]
class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
            'ordered_at' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function canBeConfirmed(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Pending orders never deducted stock (plain status change); confirmed
     * orders are cancellable only with an inventory reversal. Delivered
     * orders require the Returns workflow, cancelled orders are final.
     */
    public function canBeCancelled(): bool
    {
        return $this->status === self::STATUS_PENDING
            || $this->status === self::STATUS_CONFIRMED;
    }

    public function canBeDelivered(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }
}
