<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The shopper's side of the catalogue. Everything here is public and read
 * only — ProductController is the seller's view of the same table, scoped to
 * whoever is signed in.
 */
class CatalogController extends Controller
{
    /** What the homepage asks for when it does not say. */
    private const DEFAULT_LIMIT = 12;

    private const MAX_LIMIT = 48;

    /**
     * Latest products on offer, newest first. Backs the Latest Product
     * section on homePage.html.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:' . self::MAX_LIMIT],
        ]);

        $products = Product::with(['images', 'store', 'category'])
            ->where('status', Product::STATUS_ACTIVE)

            // A product is only on offer if its store is too. Without this a
            // suspended store would keep selling through the homepage.
            ->whereHas('store', fn ($query) => $query->where('status', Store::STATUS_ACTIVE))

            /* published_at is when the product went live, which is what
               "latest" means here. Nulls should not happen for an active
               product, so id breaks the tie and keeps the order stable. */
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit($validated['limit'] ?? self::DEFAULT_LIMIT)
            ->get()
            ->map(fn (Product $product) => $this->cardPayload($product))
            ->all();

        return response()->json(['products' => $products]);
    }

    /**
     * One product in full, for product.html.
     */
    public function show(Product $product): JsonResponse
    {
        /* A product that is not on offer is a 404 here even though the row
           exists: this endpoint is the shop front, and the seller's own view
           of it lives behind auth in ProductController. */
        $onOffer = $product->status === Product::STATUS_ACTIVE
            && $product->store
            && $product->store->status === Store::STATUS_ACTIVE;

        if (! $onOffer) {
            abort(404);
        }

        $product->load(['images', 'store', 'category', 'subcategory']);

        return response()->json(['product' => $this->detailPayload($product)]);
    }

    /**
     * Just enough for a product card.
     *
     * @return array<string, mixed>
     */
    private function cardPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'category' => $product->category?->name,
            'location' => $product->location,
            'store' => $product->store?->name,
            'image' => $product->primaryImage()?->url(),
        ];
    }

    /**
     * Everything the product page shows. Ratings and variants are in
     * Design.md but not in umkmify.sql, so there is nothing to send for them
     * yet.
     *
     * @return array<string, mixed>
     */
    private function detailPayload(Product $product): array
    {
        return $this->cardPayload($product) + [
            'subcategory' => $product->subcategory?->name,
            'description' => $product->description,

            'stock' => $product->stock,
            'minimum_purchase' => $product->minimum_purchase,
            'unit' => $product->unit,

            'weight' => $product->weight,
            'length' => $product->length,
            'width' => $product->width,
            'height' => $product->height,

            'brand' => $product->brand,
            'shipping_fee_payer' => $product->shipping_fee_type,

            'published_at' => $product->published_at?->toIso8601String(),

            // In sort order, so the first one is the gallery's opening shot.
            'images' => $product->images
                ->map(fn (ProductImage $image) => [
                    'id' => $image->id,
                    'url' => $image->url(),
                ])
                ->all(),
        ];
    }
}
