<?php

use App\Http\Controllers\Admin\BranchController as AdminBranchController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\ReceivingController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Public\BranchController;
use App\Http\Controllers\Public\BrandController;
use App\Http\Controllers\Public\HomeController;
use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('products.show');

Route::get('/brands', [BrandController::class, 'index'])->name('brands.index');
Route::get('/brands/{brand:slug}', [BrandController::class, 'show'])->name('brands.show');

Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');

Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::get('/how-to-order', [PageController::class, 'howToOrder'])->name('how-to-order');
Route::get('/terms', [PageController::class, 'terms'])->name('terms');
Route::get('/privacy', [PageController::class, 'privacy'])->name('privacy');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::middleware('role:admin,manager,staff')->group(function () {
        Route::resource('orders', OrderController::class)->only(['index', 'show']);
        Route::resource('customers', CustomerController::class);
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::resource('products', AdminProductController::class);
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('brands', AdminBrandController::class)->except(['show']);
        Route::resource('branches', AdminBranchController::class)->except(['show']);
        Route::get('inventory/opening-stock', [InventoryController::class, 'openingStock'])->name('inventory.opening-stock');
        Route::post('inventory/opening-stock', [InventoryController::class, 'storeOpeningStock'])->name('inventory.opening-stock.store');
        Route::get('inventory/adjustments', [InventoryController::class, 'adjustments'])->name('inventory.adjustments');
        Route::post('inventory/adjustments', [InventoryController::class, 'storeAdjustment'])->name('inventory.adjustments.store');
        Route::get('inventory/history', [InventoryController::class, 'history'])->name('inventory.history');
        Route::resource('suppliers', SupplierController::class);
        Route::post('suppliers/{supplier}/deactivate', [SupplierController::class, 'deactivate'])->name('suppliers.deactivate');
        Route::post('suppliers/{supplier}/activate', [SupplierController::class, 'activate'])->name('suppliers.activate');
        Route::resource('purchase-orders', PurchaseOrderController::class);
        Route::post('purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])->name('purchase-orders.submit');
        Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');
        Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
        Route::get('purchase-orders/{purchaseOrder}/receive', [ReceivingController::class, 'create'])->name('purchase-orders.receive');
        Route::post('purchase-orders/{purchaseOrder}/receive', [ReceivingController::class, 'store'])->name('purchase-orders.receive.store');
    });

});

require __DIR__.'/settings.php';
