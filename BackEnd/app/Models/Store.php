<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Mirrors the `stores` table in umkmify.sql. One store per seller: the
 * owner is a `users` row.
 */
class Store extends Model
{
    public const STATUS_ACTIVE = 'active';

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'phone',
        'status',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
