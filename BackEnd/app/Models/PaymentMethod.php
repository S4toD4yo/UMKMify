<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Mirrors the `payment_methods` table in umkmify.sql, seeded with QRIS,
 * Bank Transfer and E-Wallet.
 */
class PaymentMethod extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
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
