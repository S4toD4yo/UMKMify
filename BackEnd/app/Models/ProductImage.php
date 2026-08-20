<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Mirrors the `product_images` table in umkmify.sql. `image_url` holds the
 * path on the `public` disk, e.g. products/9/abc.jpg.
 */
class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_url',
        'is_primary',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * A browser-usable URL. Rows seeded with a full URL are passed through
     * untouched.
     */
    public function url(): string
    {
        if (str_starts_with($this->image_url, 'http://') || str_starts_with($this->image_url, 'https://')) {
            return $this->image_url;
        }

        return Storage::disk('public')->url($this->image_url);
    }
}
