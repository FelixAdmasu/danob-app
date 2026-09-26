<?php

use App\Http\Controllers\Admin\BranchController as AdminBranchController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\PurchaseDashboardController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\ReceivingController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ReportExportController;
use App\Http\Controllers\Admin\SalesDashboardController;
use App\Http\Controllers\Admin\SalesReturnController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\InquiryController;
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
Route::post('/inquiries', [InquiryController::class, 'store'])->middleware('throttle:inquiries')->name('inquiries.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');

    // Notification center (Phase 28): bounded JSON behind the same
    // auth+verified gate as the rest of the shell. No role group — the bell
    // belongs to every shell user, and every query is scoped to the
    // requester's own notifications, so ownership is the only authority
    // needed (a staff member can never read, count or mark someone else's).
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');

    Route::middleware('role:admin,manager,staff')->group(function () {
        // Order entry creates pending orders only — no stock effect — so it
        // shares the viewing authorization; confirmation (the inventory step)
        // stays with admin/manager in the group below.
        Route::resource('orders', OrderController::class)->only(['index', 'create', 'store', 'show']);
        Route::resource('customers', CustomerController::class);
        // Read-only sales dashboard: same authorization as viewing orders and
        // customers; stock-level data inside it is gated to admin/manager.
        Route::get('sales/dashboard', SalesDashboardController::class)->name('sales.dashboard');

        // Operational reporting: read-only report pages. Sales-facing reports
        // share the Orders/customers viewing authorization; the inventory and
        // purchasing reports live with their stricter groups below so stock
        // levels, thresholds, costs and supplier data never reach staff.
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
        Route::get('reports/returns', [ReportController::class, 'returns'])->name('reports.returns');
        Route::get('reports/customers', [ReportController::class, 'customers'])->name('reports.customers');
        // CSV exports mirror each report exactly: same filters, every
        // matching row instead of one page. Sales-facing exports share the
        // Orders/customers viewing authorization.
        Route::get('reports/sales/export', [ReportExportController::class, 'sales'])->name('reports.sales.export');
        Route::get('reports/returns/export', [ReportExportController::class, 'returns'])->name('reports.returns.export');
        Route::get('reports/customers/export', [ReportExportController::class, 'customers'])->name('reports.customers.export');

        // Global search: one bounded, read-only JSON endpoint for the header
        // box. Every admin role may ask, but the service applies the same
        // isRole rule as each group below, so results never become a path
        // around authorization (staff only ever see Orders/customers records).
        Route::get('search', [SearchController::class, 'index'])->name('search');
        Route::get('inquiries', [InquiryController::class, 'index'])->name('inquiries.index');
        Route::patch('inquiries/{inquiry}', [InquiryController::class, 'update'])->name('inquiries.update');
        Route::post('inquiries/{inquiry}/convert-to-customer', [InquiryController::class, 'convertToCustomer'])->name('inquiries.convert-to-customer');
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
        // Low-stock monitoring view: derived status only, never mutates stock.
        Route::get('inventory/low-stock', [InventoryController::class, 'lowStock'])->name('inventory.low-stock');
        Route::resource('suppliers', SupplierController::class);
        Route::post('suppliers/{supplier}/deactivate', [SupplierController::class, 'deactivate'])->name('suppliers.deactivate');
        Route::post('suppliers/{supplier}/activate', [SupplierController::class, 'activate'])->name('suppliers.activate');
        // Read-only purchase dashboard: aggregates existing PO/receipt data
        // behind the same authorization as the rest of purchasing.
        Route::get('purchases/dashboard', PurchaseDashboardController::class)->name('purchases.dashboard');
        Route::resource('purchase-orders', PurchaseOrderController::class);
        Route::post('purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])->name('purchase-orders.submit');
        Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');
        Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
        Route::get('purchase-orders/{purchaseOrder}/receive', [ReceivingController::class, 'create'])->name('purchase-orders.receive');
        Route::post('purchase-orders/{purchaseOrder}/receive', [ReceivingController::class, 'store'])->name('purchase-orders.receive.store');

        // Sales lifecycle: confirmation deducts stock, so it lives with the
        // other inventory-affecting routes (admin, manager only).
        Route::post('orders/{order}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');
        Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('orders/{order}/deliver', [OrderController::class, 'deliver'])->name('orders.deliver');

        // Sales returns: only delivered orders, restores stock through
        // InventoryService — inventory-affecting (admin, manager only).
        Route::get('orders/{order}/process-return', [SalesReturnController::class, 'create'])->name('orders.process-return');
        Route::post('orders/{order}/process-return', [SalesReturnController::class, 'store'])->name('orders.process-return.store');

        // Inventory/purchasing reports: read-only, same authorization as the
        // source areas (history, low stock, suppliers, purchase orders).
        Route::get('reports/inventory-movements', [ReportController::class, 'inventoryMovements'])->name('reports.inventory-movements');
        Route::get('reports/purchases', [ReportController::class, 'purchases'])->name('reports.purchases');
        Route::get('reports/low-stock', [ReportController::class, 'lowStock'])->name('reports.low-stock');
        Route::get('reports/suppliers', [ReportController::class, 'suppliers'])->name('reports.suppliers');
        // Restricted exports: stock history, thresholds, purchase orders and
        // supplier data never reach staff — enforced here, not in the UI.
        Route::get('reports/inventory-movements/export', [ReportExportController::class, 'inventoryMovements'])->name('reports.inventory-movements.export');
        Route::get('reports/purchases/export', [ReportExportController::class, 'purchases'])->name('reports.purchases.export');
        Route::get('reports/low-stock/export', [ReportExportController::class, 'lowStock'])->name('reports.low-stock.export');
        Route::get('reports/suppliers/export', [ReportExportController::class, 'suppliers'])->name('reports.suppliers.export');
    });

});

require __DIR__.'/settings.php';
