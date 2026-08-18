<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Mirrors the `roles` table in umkmify.sql. Seeded with customer, seller
 * and admin.
 */
class Role extends Model
{
    public const CUSTOMER = 'customer';
    public const SELLER = 'seller';
    public const ADMIN = 'admin';

    protected $fillable = ['name'];

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }
}
