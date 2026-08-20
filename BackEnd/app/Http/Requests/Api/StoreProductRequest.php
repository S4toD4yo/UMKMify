<?php

namespace App\Http\Requests\Api;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is behind auth:sanctum; every signed-in user may open a store.
        return $this->user() !== null;
    }

    /**
     * The Add New Product form posts a few fields in shapes the database
     * cannot take, so normalise them before the rules run:
     *
     * - the price input is thousand-separated ("50.000") and, when the field
     *   is left empty, arrives as "";
     * - the sub category select posts "" when untouched, which the frontend
     *   turns into Number("") === 0. There is no category 0, so 0 has to
     *   become null or `exists` rejects the whole request.
     */
    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('selling_price')) {
            $merge['selling_price'] = $this->normaliseNumber($this->input('selling_price'));
        }

        foreach (['minimum_purchase', 'stock', 'weight', 'length', 'width', 'height'] as $field) {
            if ($this->has($field)) {
                $merge[$field] = $this->normaliseNumber($this->input($field));
            }
        }

        foreach (['subcategory_id', 'category_id'] as $field) {
            $value = $this->input($field);

            if ($value === '' || $value === '0' || $value === 0) {
                $merge[$field] = null;
            }
        }

        foreach (['brand', 'location'] as $field) {
            if ($this->input($field) === '') {
                $merge[$field] = null;
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * Field lengths mirror the `products` table in umkmify.sql.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9._-]+$/'],

            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'subcategory_id' => ['nullable', 'integer', 'exists:categories,id'],

            'description' => ['required', 'string', 'max:20000'],

            // decimal(15,2) in the schema.
            'selling_price' => ['required', 'numeric', 'min:0', 'max:9999999999999'],
            'minimum_purchase' => ['required', 'integer', 'min:1', 'max:1000000'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],

            // decimal(10,2) in the schema.
            'weight' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'unit' => ['required', 'string', 'max:30'],

            'brand' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:150'],

            'length' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'width' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'height' => ['nullable', 'numeric', 'min:0', 'max:99999999'],

            'shipping_fee_payer' => ['required', 'in:' . Product::SHIPPING_FEE_BUYER . ',' . Product::SHIPPING_FEE_SELLER],

            'status' => ['required', 'in:' . Product::STATUS_ACTIVE . ',' . Product::STATUS_NONACTIVE],

            // Optional: only sent when the form posts as multipart/form-data.
            // The dropzone on newProduct.html holds five slots.
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * Cross-field checks the rule list cannot express: the category has to be
     * a top level one, and the sub category has to sit under it.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['category_id', 'subcategory_id'])) {
                    return;
                }

                $category = Category::find($this->integer('category_id'));

                if ($category && ! $category->isTopLevel()) {
                    $validator->errors()->add(
                        'category_id',
                        'Please choose a top level category.'
                    );

                    return;
                }

                $subcategoryId = $this->input('subcategory_id');

                if ($subcategoryId === null) {
                    return;
                }

                $subcategory = Category::find((int) $subcategoryId);

                if ($subcategory && $subcategory->parent_id !== $category?->id) {
                    $validator->errors()->add(
                        'subcategory_id',
                        'This sub category does not belong to the selected category.'
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'category_id' => 'category',
            'subcategory_id' => 'sub category',
            'selling_price' => 'selling price',
            'minimum_purchase' => 'minimum purchase',
            'shipping_fee_payer' => 'shipping fee',
            'images.*' => 'product image',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sku.regex' => 'The SKU may only contain letters, numbers, dots, dashes and underscores.',
            'category_id.exists' => 'The selected category does not exist.',
            'subcategory_id.exists' => 'The selected sub category does not exist.',
            'images.*.max' => 'Each product image must be 2 MB or smaller.',
        ];
    }

    /**
     * Strips the thousand separators the price input adds and turns a blank
     * field into null so `nullable` can do its job.
     */
    private function normaliseNumber(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        // "50.000" and "50.000,50" are Indonesian formatting, not decimals.
        if (preg_match('/^\d{1,3}(\.\d{3})+(,\d+)?$/', $value) === 1) {
            $value = str_replace('.', '', $value);
        }

        return str_replace(',', '.', $value);
    }
}
