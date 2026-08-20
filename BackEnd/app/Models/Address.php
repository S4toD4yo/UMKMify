<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Mirrors the `addresses` table in umkmify.sql. A shopper's saved shipping
 * addresses; an order keeps its own copy of the one it shipped to, so
 * editing an address later cannot rewrite past orders.
 */
class Address extends Model
{
    protected $fillable = [
        'user_id',
        'label',
        'recipient_name',
        'phone',
        'address_line',
        'address_line_2',
        'province',
        'city',
        'district',
        'village',
        'postal_code',
        'latitude',
        'longitude',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The address as one line, for the `orders.shipping_address` snapshot.
     */
    public function toSnapshotLine(): string
    {
        return collect([
            $this->address_line,
            $this->address_line_2,
            $this->village,
            $this->district,
        ])->filter()->implode(', ');
    }
}
