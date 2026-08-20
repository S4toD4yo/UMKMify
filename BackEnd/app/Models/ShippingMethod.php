<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Mirrors the `shipping_methods` table in umkmify.sql, seeded with the four
 * couriers. There is no rate column: what a method costs is decided in
 * CheckoutController for now.
 */
class ShippingMethod extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
