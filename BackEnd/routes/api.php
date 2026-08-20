<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $database = 'connected';
    } catch (\Throwable $e) {
        $database = 'unavailable';
    }

    return response()->json([
        'app' => config('app.name'),
        'laravel' => app()->version(),
        'php' => PHP_VERSION,
        'database' => $database,
    ]);
});

// Public: the Add New Product form needs these before the seller submits.
Route::get('/categories', [CategoryController::class, 'index']);

// Public: the Latest Product section on the homepage, open to signed out
// visitors, so this is deliberately outside the auth group.
Route::get('/catalog/products', [CatalogController::class, 'index']);

// Public: the product page a homepage card links to.
Route::get('/catalog/products/{product}', [CatalogController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);

    // Product List row actions. Both are scoped to the seller's own store in
    // the controller, so an id from another store reads as a 404.
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    // Edit Product saves here. The form posts multipart, which PHP will not
    // parse on a real PUT, so it arrives as POST + `_method=PUT`.
    Route::put('/products/{product}', [ProductController::class, 'update']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:6,1');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});
