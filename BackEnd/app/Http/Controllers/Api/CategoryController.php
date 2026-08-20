<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Top level categories with their sub categories, so the two selects on
     * newProduct.html can be filled from the database instead of the ids
     * hardcoded in the markup.
     */
    public function index(): JsonResponse
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->where('status', Category::STATUS_ACTIVE)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'subcategories' => $category->children
                    ->where('status', Category::STATUS_ACTIVE)
                    ->map(fn (Category $child) => [
                        'id' => $child->id,
                        'name' => $child->name,
                        'slug' => $child->slug,
                    ])
                    ->values()
                    ->all(),
            ])
            ->all();

        return response()->json(['categories' => $categories]);
    }
}
