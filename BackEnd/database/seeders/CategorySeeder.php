<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The nine top level ids here are the ones already hardcoded in the
 * Category select on newProduct.html, so existing markup keeps working.
 *
 * Rows go in through the query builder rather than Eloquent because the top
 * level ids have to be written verbatim, and `id` is not fillable.
 */
class CategorySeeder extends Seeder
{
    /**
     * @var array<int, array{name: string, children: list<string>}>
     */
    private const CATEGORIES = [
        1 => ['name' => 'Accessories', 'children' => ['Bags', 'Watches', 'Jewelry', 'Belts & Wallets']],
        2 => ['name' => 'Beverage', 'children' => ['Coffee', 'Tea', 'Juice & Syrup', 'Herbal Drinks']],
        3 => ['name' => 'Electronics', 'children' => ['Audio', 'Phone Accessories', 'Computer Accessories', 'Home Appliances']],
        4 => ['name' => 'Fashion', 'children' => ['Men Clothing', 'Women Clothing', 'Kids Clothing', 'Footwear']],
        5 => ['name' => 'Handcraft', 'children' => ['Woodcraft', 'Batik & Textile', 'Ceramics', 'Home Decor']],
        6 => ['name' => 'Health', 'children' => ['Skincare', 'Supplements', 'Personal Care', 'Medical Supplies']],
        7 => ['name' => 'Hobbies', 'children' => ['Sports', 'Music Instruments', 'Board Games', 'Collectibles']],
        8 => ['name' => 'Food', 'children' => ['Snacks', 'Frozen Food', 'Ready to Eat', 'Spices & Seasoning']],
        9 => ['name' => 'Plants', 'children' => ['Ornamental Plants', 'Seeds', 'Pots & Planters', 'Fertilizer']],
    ];

    public function run(): void
    {
        $now = now();

        // Every top level row first: a child cannot point at a parent that is
        // not there yet, and the parent ids are fixed.
        foreach (self::CATEGORIES as $id => $category) {
            DB::table('categories')->updateOrInsert(
                ['id' => $id],
                [
                    'parent_id' => null,
                    'name' => $category['name'],
                    'slug' => Str::slug($category['name']),
                    'status' => Category::STATUS_ACTIVE,
                    'sort_order' => $id,
                    'updated_at' => $now,
                ]
            );
        }

        foreach (self::CATEGORIES as $id => $category) {
            $sortOrder = 0;

            foreach ($category['children'] as $child) {
                // Sub category names repeat across categories, so the parent
                // name is part of the slug to keep categories_slug_unique happy.
                DB::table('categories')->updateOrInsert(
                    ['slug' => Str::slug($category['name'] . '-' . $child)],
                    [
                        'parent_id' => $id,
                        'name' => $child,
                        'status' => Category::STATUS_ACTIVE,
                        'sort_order' => ++$sortOrder,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}
