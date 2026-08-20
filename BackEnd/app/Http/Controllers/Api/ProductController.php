<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Requests\Api\UpdateProductRequest;
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
     * The signed-in seller's products, newest first. Backs productList.html:
     * the table rows plus the five summary cards above them.
     *
     * Optional query string, all coming from the Product List controls:
     * `search`, `status`, `stock`, `sort`.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:' . Product::STATUS_ACTIVE . ',' . Product::STATUS_NONACTIVE],
            'stock' => ['nullable', 'in:in_stock,low_stock,out_of_stock'],
            'sort' => ['nullable', 'in:newest,oldest,name,price_low,price_high,stock_low,stock_high'],
        ]);

        $store = Store::where('owner_id', $request->user()->id)->first();

        // No store yet means the seller has never published anything. That is
        // an empty list, not an error — the page renders its empty state.
        if (! $store) {
            return response()->json([
                'products' => [],
                'summary' => $this->emptySummary(),
            ]);
        }

        $query = Product::with(['images', 'category', 'subcategory'])
            ->where('store_id', $store->id);

        if (! empty($filters['search'])) {
            // Escaped by hand: LIKE treats % and _ as wildcards, so a search
            // for "SKU_01" would otherwise match "SKU-01" too.
            $term = '%' . addcslashes($filters['search'], '%_\\') . '%';

            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('sku', 'like', $term);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        match ($filters['stock'] ?? null) {
            'out_of_stock' => $query->where('stock', '<=', 0),
            'low_stock' => $query->where('stock', '>', 0)
                ->where('stock', '<', Product::LOW_STOCK_THRESHOLD),
            'in_stock' => $query->where('stock', '>=', Product::LOW_STOCK_THRESHOLD),
            default => null,
        };

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query->orderBy('id'),
            'name' => $query->orderBy('name'),
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'stock_low' => $query->orderBy('stock'),
            'stock_high' => $query->orderByDesc('stock'),
            default => $query->orderByDesc('id'),
        };

        $products = $query->get()
            ->map(fn (Product $product) => $this->productPayload($product))
            ->all();

        return response()->json([
            'products' => $products,

            // Counted over the whole store, not over the filtered rows: the
            // cards are a picture of the catalogue, and the filters are how
            // the seller drills into it.
            'summary' => $this->summary($store->id),
        ]);
    }

    /**
     * Save the Edit Product form over an existing product.
     *
     * The form posts as multipart/form-data because it can carry new image
     * files, and PHP does not parse a multipart body on a real PUT, so the
     * frontend sends POST with `_method=PUT` and Laravel spoofs it back.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($request, $product);

        $validated = $request->validated();

        // Same (store_id, sku) unique key as store(), except the product is
        // allowed to keep the SKU it already has.
        $skuTaken = Product::where('store_id', $product->store_id)
            ->where('sku', $validated['sku'])
            ->where('id', '!=', $product->id)
            ->exists();

        if ($skuTaken) {
            throw ValidationException::withMessages([
                'sku' => 'You already have a product with this SKU.',
            ]);
        }

        /* `existing_image_ids` is the seller's whole say over the images the
           product already had: what is listed survives, in that order, and
           what is missing goes. Ids that never belonged to this product are
           dropped rather than trusted. */
        $current = $product->images()->get()->keyBy('id');

        $keptIds = collect($request->input('existing_image_ids', []))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->filter(fn (int $id) => $current->has($id))
            ->values();

        $removed = $current->reject(fn (ProductImage $image) => $keptIds->contains($image->id));

        $uploads = array_values(array_filter(
            $request->file('images', []),
            fn ($file) => $file instanceof UploadedFile
        ));

        $storedPaths = [];

        try {
            DB::transaction(function () use ($product, $validated, $keptIds, $removed, $uploads, &$storedPaths) {
                $product->fill($this->productAttributes($validated));

                /* published_at marks when the product went live. Pulling it
                   off sale clears it, so re-activating later stamps the date
                   it actually went back up. */
                $isActive = $validated['status'] === Product::STATUS_ACTIVE;

                $product->published_at = $isActive
                    ? ($product->published_at ?? now())
                    : null;

                $product->save();

                if ($removed->isNotEmpty()) {
                    ProductImage::whereIn('id', $removed->pluck('id'))->delete();
                }

                // The first image is the one the Product List shows, so the
                // order the seller left the cards in is the order stored.
                $keptIds->each(function (int $id, int $index) {
                    ProductImage::where('id', $id)->update([
                        'sort_order' => $index,
                        'is_primary' => $index === 0,
                    ]);
                });

                foreach ($uploads as $offset => $upload) {
                    $path = $upload->store('products/' . $product->id, 'public');

                    if ($path === false) {
                        throw new \RuntimeException('Failed to store a product image.');
                    }

                    $storedPaths[] = $path;

                    $index = $keptIds->count() + $offset;

                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $path,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            // Same as store(): the rows roll back, the files do not.
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            throw $e;
        }

        // Only once the transaction has committed, and never for a row that
        // was seeded with a full URL to somebody else's host.
        foreach ($removed as $image) {
            if (! str_starts_with($image->image_url, 'http://') && ! str_starts_with($image->image_url, 'https://')) {
                Storage::disk('public')->delete($image->image_url);
            }
        }

        $product->load(['images', 'category', 'subcategory']);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product_id' => $product->id,
            'product' => $this->productPayload($product),
        ]);
    }

    /**
     * One product, for the row's Edit button.
     */
    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($request, $product);

        $product->load(['images', 'category', 'subcategory']);

        return response()->json(['product' => $this->productPayload($product)]);
    }

    /**
     * Soft delete, for the row's Delete button. The `products` row keeps its
     * `deleted_at` and the image files stay on disk, so an order that already
     * points at this product still resolves.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($request, $product);

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
            'product_id' => $product->id,
            'summary' => $this->summary($product->store_id),
        ]);
    }

    /**
     * A product belonging to somebody else is a 404 rather than a 403: the
     * seller has no business knowing the id exists.
     */
    private function authorizeProduct(Request $request, Product $product): void
    {
        $store = Store::where('owner_id', $request->user()->id)->first();

        if (! $store || $product->store_id !== $store->id) {
            abort(404);
        }
    }

    /**
     * The five cards above the table, in one aggregate query.
     *
     * @return array<string, int>
     */
    private function summary(int $storeId): array
    {
        $counts = Product::where('store_id', $storeId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(CASE WHEN status = ? THEN 1 END) as published', [Product::STATUS_ACTIVE])
            ->selectRaw('COUNT(CASE WHEN status <> ? THEN 1 END) as draft', [Product::STATUS_ACTIVE])
            ->selectRaw('COUNT(CASE WHEN stock <= 0 THEN 1 END) as out_of_stock')
            ->selectRaw('COUNT(CASE WHEN stock > 0 AND stock < ? THEN 1 END) as need_restock', [Product::LOW_STOCK_THRESHOLD])
            ->first();

        return [
            'total' => (int) $counts->total,
            'published' => (int) $counts->published,
            'draft' => (int) $counts->draft,
            'out_of_stock' => (int) $counts->out_of_stock,
            'need_restock' => (int) $counts->need_restock,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function emptySummary(): array
    {
        return [
            'total' => 0,
            'published' => 0,
            'draft' => 0,
            'out_of_stock' => 0,
            'need_restock' => 0,
        ];
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
                $product = Product::create($this->productAttributes($validated) + [
                    'store_id' => $store->id,
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
     * The form's field names mapped onto the columns in umkmify.sql. Shared
     * by store() and update() so the two cannot drift apart.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function productAttributes(array $validated): array
    {
        return [
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
        ];
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
            'is_published' => $product->status === Product::STATUS_ACTIVE,
            'stock_status' => $product->stockStatus(),
            'published_at' => $product->published_at?->toIso8601String(),

            // The Product List has a Created Date column.
            'created_at' => $product->created_at?->toIso8601String(),
            'updated_at' => $product->updated_at?->toIso8601String(),

            // Saves the row from digging through `images` for its thumbnail.
            'primary_image' => $product->primaryImage()?->url(),

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
