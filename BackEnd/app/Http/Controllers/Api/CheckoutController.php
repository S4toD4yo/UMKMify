<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Everything checkout.html needs before the shopper can place an order: what
 * they are buying, where it can go, how it ships and how it is paid for.
 */
class CheckoutController extends Controller
{
    /**
     * What each courier costs the buyer.
     *
     * umkmify.sql has a `shipping_methods` table but no rate column, and
     * there is no rates table either, so the numbers live here until real
     * ones exist. Keyed by `code` rather than id so reseeding cannot silently
     * repoint a price at a different courier.
     */
    private const SHIPPING_RATES = [
        'jnt_cargo' => 12000,
        'jne' => 15000,
        'sicepat' => 14000,
        'anteraja' => 13000,
    ];

    private const FALLBACK_SHIPPING_RATE = 15000;

    /**
     * The checkout page in one request: the product being bought, the
     * shopper's saved addresses, and the couriers and payment methods on
     * offer with what each one costs.
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:1000000'],
        ]);

        $product = Product::with(['images', 'store'])->find($validated['product_id']);

        // Same rule as the product page: not on offer is a 404, whether that
        // is the product's doing or its store's.
        $onOffer = $product
            && $product->status === Product::STATUS_ACTIVE
            && $product->store
            && $product->store->status === Store::STATUS_ACTIVE;

        if (! $onOffer) {
            abort(404);
        }

        /* Clamped rather than rejected: the quantity arrives in a query
           string the shopper can edit, and the page should open on something
           buyable instead of an error. The order itself is validated for
           real when it is placed. */
        $quantity = $this->clampQuantity($product, $validated['quantity'] ?? $product->minimum_purchase);

        $shippingMethods = ShippingMethod::where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (ShippingMethod $method) => [
                'id' => $method->id,
                'code' => $method->code,
                'name' => $method->name,
                'description' => $method->description,

                // Already zeroed when the seller pays, so the page can show
                // the number without knowing the rule.
                'fee' => $this->shippingFeeFor($method, $product),
            ])
            ->all();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (PaymentMethod $method) => [
                'id' => $method->id,
                'code' => $method->code,
                'name' => $method->name,
                'type' => $method->type,
            ])
            ->all();

        $addresses = Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Address $address) => [
                'id' => $address->id,
                'label' => $address->label,
                'recipient_name' => $address->recipient_name,
                'phone' => $address->phone,
                'address_line' => $address->address_line,
                'address_line_2' => $address->address_line_2,
                'province' => $address->province,
                'city' => $address->city,
                'district' => $address->district,
                'village' => $address->village,
                'postal_code' => $address->postal_code,
                'is_default' => $address->is_default,
            ])
            ->all();

        return response()->json([
            'item' => [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'unit' => $product->unit,
                'price' => $product->price,
                'stock' => $product->stock,
                'minimum_purchase' => $product->minimum_purchase,
                'quantity' => $quantity,
                'subtotal' => $this->money($product->price * $quantity),
                'image' => $product->primaryImage()?->url(),
                'store' => $product->store?->name,
                'shipping_fee_payer' => $product->shipping_fee_type,
            ],

            'addresses' => $addresses,
            'shipping_methods' => $shippingMethods,
            'payment_methods' => $paymentMethods,

            // No promotions in umkmify.sql and nothing charging a service
            // fee yet, so both are zero rather than invented.
            'discount_amount' => $this->money(0),
            'service_fee' => $this->money(0),
        ]);
    }

    /**
     * The buyer pays nothing to ship when the seller took the fee on.
     */
    public function shippingFeeFor(ShippingMethod $method, Product $product): string
    {
        if ($product->shipping_fee_type === Product::SHIPPING_FEE_SELLER) {
            return $this->money(0);
        }

        return $this->money(self::SHIPPING_RATES[$method->code] ?? self::FALLBACK_SHIPPING_RATE);
    }

    /**
     * Never below the seller's minimum, never above what is in stock. Stock
     * wins when the two disagree, because it is the harder limit.
     */
    public function clampQuantity(Product $product, int $quantity): int
    {
        if ($product->stock <= 0) {
            return 0;
        }

        $floor = min(max(1, $product->minimum_purchase), $product->stock);

        return min($product->stock, max($floor, $quantity));
    }

    /**
     * decimal(15,2) in every money column in umkmify.sql, so everything
     * leaves here in the same shape.
     */
    private function money(float|int|string $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }
}
