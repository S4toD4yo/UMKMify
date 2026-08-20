<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Mirrors the `products` table in umkmify.sql. Two column names differ from
 * what the Add New Product form calls them: the form's "selling price" is
 * `price`, and its "shipping fee payer" is `shipping_fee_type`.
 */
class Product extends Model
{
    use SoftDeletes;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_NONACTIVE = 'nonactive';

    public const SHIPPING_FEE_BUYER = 'buyer';
    public const SHIPPING_FEE_SELLER = 'seller';

    /**
     * Anything below this — but not yet at zero — is what the Product List
     * calls "Need to Restock". The database has no such column: it is a
     * reading of `stock`, so the threshold lives here rather than in a row.
     */
    public const LOW_STOCK_THRESHOLD = 10;

    protected $fillable = [
        'store_id',
        'name',
        'sku',
        'category_id',
        'subcategory_id',
        'description',
        'price',
        'minimum_purchase',
        'stock',
        'weight',
        'unit',
        'brand',
        'location',
        'length',
        'width',
        'height',
        'shipping_fee_type',
        'status',
        'published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'minimum_purchase' => 'integer',
            'stock' => 'integer',
            'weight' => 'decimal:2',
            'length' => 'decimal:2',
            'width' => 'decimal:2',
            'height' => 'decimal:2',
            'published_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    /**
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * The image the Product List shows in the row. Falls back to the first
     * one when no row was flagged primary.
     */
    public function primaryImage(): ?ProductImage
    {
        return $this->images->firstWhere('is_primary', true) ?? $this->images->first();
    }

    /**
     * One of `out_of_stock`, `low_stock`, `in_stock` — the three buckets the
     * Product List summary counts.
     */
    public function stockStatus(): string
    {
        if ($this->stock <= 0) {
            return 'out_of_stock';
        }

        if ($this->stock < self::LOW_STOCK_THRESHOLD) {
            return 'low_stock';
        }

        return 'in_stock';
    }
}
