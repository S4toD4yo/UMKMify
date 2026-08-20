<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\UploadedFile;

/**
 * The Edit Product form posts the same fields as Add New Product, so the
 * rules, the normalising in prepareForValidation() and the category checks
 * are all inherited. What it adds is a say over the images the product
 * already has.
 */
class UpdateProductRequest extends StoreProductRequest
{
    /** The drop zone on both forms holds five slots. */
    public const MAX_IMAGES = 5;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            // Which of the product's current images survive the edit, in the
            // order they should be shown. Anything left out is deleted, so an
            // absent field is not the same as an empty one.
            'existing_image_ids' => ['sometimes', 'array', 'max:' . self::MAX_IMAGES],
            'existing_image_ids.*' => ['integer'],
        ]);
    }

    /**
     * `images` is capped at five on its own and so is `existing_image_ids`,
     * but nothing yet stops five of each.
     */
    public function after(): array
    {
        return array_merge(parent::after(), [
            function (Validator $validator) {
                $kept = count($this->input('existing_image_ids', []));

                $added = count(array_filter(
                    $this->file('images', []),
                    fn ($file) => $file instanceof UploadedFile
                ));

                if ($kept + $added > self::MAX_IMAGES) {
                    $validator->errors()->add(
                        'images',
                        'A product can have at most ' . self::MAX_IMAGES . ' images.'
                    );
                }
            },
        ]);
    }
}
