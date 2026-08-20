<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Mirrors the `categories` table in umkmify.sql. The table is self
 * referencing: a row with `parent_id` = null is a top level category, a row
 * with a `parent_id` is a sub category of it.
 */
class Category extends Model
{
    public const STATUS_ACTIVE = 'active';

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'status',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function isTopLevel(): bool
    {
        return $this->parent_id === null;
    }
}
