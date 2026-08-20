<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProductRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Role;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * The signed-in seller's products, newest first. Backs productList.html.
     */
    public function index(Request $request): JsonResponse
    {
        $store = Store::where('owner_id', $request->user()->id)->first();

        if (! $store) {
            return response()->json(['products' => []]);
        }

        $products = Product::with(['images', 'category', 'subcategory'])
            ->where('store_id', $store->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (Product $product) => $this->productPayload($product))
            ->all();

        return response()->json(['products' => $products]);
    }

    /**
     * Create a product from the Add New Product form.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // A store is created on the first product instead of rejecting the
        // request: there is no "open your store" screen yet, and the seller
        // has already filled in the whole form by this point.
        $store = $this->resolveStore($user);

        // products_store_sku_unique is a (store_id, sku) unique key. Catching
        // it here turns what would be a 500 into a field error the form can
        // show next to the SKU input.
        $skuTaken = Product::where('store_id', $store->id)
            ->where('sku', $validated['sku'])
            ->exists();

        if ($skuTaken) {
            throw ValidationException::withMessages([
                'sku' => 'You already have a product with this SKU.',
            ]);
        }

        $isActive = $validated['status'] === Product::STATUS_ACTIVE;

        $uploads = array_values(array_filter(
            $request->file('images', []),
            fn ($file) => $file instanceof UploadedFile
        ));

        $storedPaths = [];

        try {
            $product = DB::transaction(function () use ($validated, $store, $isActive, $uploads, &$storedPaths) {
                $product = Product::create([
                    'store_id' => $store->id,

                    'name' => $validated['name'],
                    'sku' => $validated['sku'],

                    'category_id' => $validated['category_id'],
                    'subcategory_id' => $validated['subcategory_id'] ?? null,

                    'description' => $validated['description'],

                    'price' => $validated['selling_price'],
                    'minimum_purchase' => $validated['minimum_purchase'],
                    'stock' => $validated['stock'],

                    'weight' => $validated['weight'],
                    'unit' => $validated['unit'],

                    'brand' => $validated['brand'] ?? null,
                    'location' => $validated['location'] ?? null,

                    'length' => $validated['length'] ?? null,
                    'width' => $validated['width'] ?? null,
                    'height' => $validated['height'] ?? null,

                    'shipping_fee_type' => $validated['shipping_fee_payer'],

                    'status' => $validated['status'],
                    'published_at' => $isActive ? now() : null,
                ]);

                foreach ($uploads as $index => $upload) {
                    $path = $upload->store('products/' . $product->id, 'public');

                    if ($path === false) {
                        throw new \RuntimeException('Failed to store a product image.');
                    }

                    $storedPaths[] = $path;

                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }

                return $product;
            });
        } catch (\Throwable $e) {
            // The rows are gone with the rolled back transaction, but files
            // written to disk are not, so clean those up by hand.
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            throw $e;
        }

        $product->load(['images', 'category', 'subcategory']);

        return response()->json([
            'message' => 'Product created successfully.',
            'product_id' => $product->id,
            'product' => $this->productPayload($product),
        ], 201);
    }

    /**
     * The seller's store, created on first use. Opening a store also grants
     * the seller role, which registration deliberately leaves off.
     */
    private function resolveStore(User $user): Store
    {
        $store = Store::where('owner_id', $user->id)->first();

        if ($store) {
            return $store;
        }

        return DB::transaction(function () use ($user) {
            $store = Store::create([
                'owner_id' => $user->id,
                'name' => $user->username . ' Store',
                'slug' => $this->uniqueStoreSlug($user->username),
                'status' => Store::STATUS_ACTIVE,
            ]);

            $seller = Role::where('name', Role::SELLER)->first();

            if ($seller && ! $user->roles()->where('roles.id', $seller->id)->exists()) {
                $user->roles()->attach($seller->id);
            }

            return $store;
        });
    }

    /**
     * `stores_slug_unique` in umkmify.sql means duplicates have to be
     * resolved before the insert.
     */
    private function uniqueStoreSlug(string $username): string
    {
        $base = Str::slug($username) ?: 'store';
        $base = Str::limit($base, 170, '');

        $slug = $base;
        $suffix = 2;

        while (Store::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'category' => $product->category?->name,
            'category_id' => (int) $product->category_id,
            'subcategory' => $product->subcategory?->name,
            'subcategory_id' => $product->subcategory_id === null ? null : (int) $product->subcategory_id,
            'description' => $product->description,
            'price' => $product->price,
            'minimum_purchase' => $product->minimum_purchase,
            'stock' => $product->stock,
            'weight' => $product->weight,
            'unit' => $product->unit,
            'brand' => $product->brand,
            'location' => $product->location,
            'length' => $product->length,
            'width' => $product->width,
            'height' => $product->height,
            'shipping_fee_payer' => $product->shipping_fee_type,
            'status' => $product->status,
            'published_at' => $product->published_at?->toIso8601String(),
            'images' => $product->images
                ->map(fn (ProductImage $image) => [
                    'id' => $image->id,
                    'url' => $image->url(),
                    'is_primary' => $image->is_primary,
                ])
                ->all(),
        ];
    }
}
