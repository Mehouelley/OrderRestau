<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\FedapayController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\TableController;
use Illuminate\Support\Facades\Route;

Route::get('/media/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        return response()->json(['error' => 'File not found'], 404);
    }

    return response()->file($fullPath);
})->where('path', '.*')->name('media.show');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('api.token')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Public endpoints
Route::prefix('restaurants')->group(function () {
    Route::get('/', [RestaurantController::class, 'listPublic']);
    Route::get('/{slug}', [RestaurantController::class, 'showPublic']);
    Route::get('/{slug}/tables', [TableController::class, 'listByRestaurant']);
    Route::get('/{slug}/tables/{tableId}/context', [TableController::class, 'contextByRestaurant']);
    Route::get('/{slug}/categories', [CategoryController::class, 'listByRestaurant']);
    Route::get('/{slug}/products', [ProductController::class, 'listByRestaurant']);
});

// Public order endpoints
Route::prefix('orders')->group(function () {
    Route::post('/', [OrderController::class, 'create']);
    Route::get('/{id}', [OrderController::class, 'show']);
});

// Public payment endpoints
Route::post('/payments/confirm', [PaymentController::class, 'confirm']);

// Fedapay integration: create checkout session, handle callback and webhook
Route::post('/payments/fedapay/create', [FedapayController::class, 'createCheckout']);
Route::get('/payments/fedapay/callback', [FedapayController::class, 'callback']); // Browser redirect callback with query params
Route::post('/payments/fedapay/webhook', [FedapayController::class, 'webhook']); // Server-to-server webhook

// Invoice download (HTML) for customers - printed / saved as PDF
Route::get('/orders/{id}/invoice', [\App\Http\Controllers\OrderController::class, 'invoice']);
// Kitchen public access
Route::post('/kitchen/access', [KitchenController::class, 'access']);
Route::get('/kitchen/{slug}/orders', [KitchenController::class, 'ordersBySlug']);
Route::get('/kitchen/orders/{id}/ticket', [KitchenController::class, 'ticket']);
Route::patch('/kitchen/orders/{id}', [KitchenController::class, 'updateOrderStatus']);

// Protected restaurateur endpoints
Route::middleware('api.token')->group(function () {
    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Restaurant management
    Route::prefix('restaurant')->group(function () {
        Route::get('/', [RestaurantController::class, 'showOwned']);
        Route::put('/', [RestaurantController::class, 'update']);
    });

    // Tables management
    Route::prefix('tables')->group(function () {
        Route::get('/', [TableController::class, 'listOwned']);
        Route::post('/', [TableController::class, 'create']);
        Route::put('/{id}', [TableController::class, 'update']);
        Route::delete('/{id}', [TableController::class, 'delete']);
    });

    // Categories management
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'listOwned']);
        Route::post('/', [CategoryController::class, 'create']);
        Route::put('/{id}', [CategoryController::class, 'update']);
        Route::delete('/{id}', [CategoryController::class, 'delete']);
    });

    // Products management
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'listOwned']);
        Route::post('/', [ProductController::class, 'create']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'delete']);
    });

    // Orders management
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'listOwned']);
        Route::patch('/{id}', [OrderController::class, 'updateStatus']);
    });
});
