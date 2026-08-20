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
}
