<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * What checkout.html posts to place an order.
 *
 * Deliberately absent: prices, fees and totals. Those are read from the
 * database in OrderController, because anything posted from the page is
 * something the shopper can edit.
 */
class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is behind auth:sanctum; any signed in shopper may order.
        return $this->user() !== null;
    }

    /**
     * An empty text field posts "", which `nullable` cannot see as absent.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];

        foreach (['address_id', 'label', 'address_line_2', 'district', 'village'] as $field) {
            if ($this->input($field) === '') {
                $merge[$field] = null;
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * Field lengths mirror `addresses` and `orders` in umkmify.sql.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Either an address they saved before, or one typed in now.
        $newAddress = $this->input('address_id') ? 'nullable' : 'required';

        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000000'],

            'shipping_method_id' => ['required', 'integer', 'exists:shipping_methods,id'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],

            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],

            'label' => ['nullable', 'string', 'max:50'],
            'recipient_name' => [$newAddress, 'string', 'max:150'],
            'phone' => [$newAddress, 'string', 'max:30'],
            'address_line' => [$newAddress, 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'province' => [$newAddress, 'string', 'max:100'],
            'city' => [$newAddress, 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'village' => ['nullable', 'string', 'max:100'],
            'postal_code' => [$newAddress, 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'product_id' => 'product',
            'shipping_method_id' => 'delivery service',
            'payment_method_id' => 'payment method',
            'address_id' => 'shipping address',
            'recipient_name' => 'recipient name',
            'address_line' => 'address',
            'address_line_2' => 'address detail',
            'postal_code' => 'postal code',
        ];
    }
}
