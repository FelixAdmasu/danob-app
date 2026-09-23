<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'url', 'sort_order', 'is_primary', 'alt_text'])]
class ProductImage extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Local storage urls are served through the /storage symlink on whatever
     * origin the app runs on. Rows persisted before this was normalized bake
     * in an absolute APP_URL host/port (dev ports and deploy domains change),
     * so map absolute /storage/... urls to root-relative. Supabase/s3 urls
     * (other hosts, /storage/v1/... paths) stay absolute.
     */
    protected function url(): Attribute
    {
        return Attribute::get(function (?string $value): ?string {
            if ($value === null || $value === '') {
                return $value;
            }

            $path = parse_url($value, PHP_URL_PATH);
            if (is_string($path)
                && (str_starts_with($path, '/storage/products/') || str_starts_with($path, '/storage/product-images/'))) {
                return $path;
            }

            return $value;
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
