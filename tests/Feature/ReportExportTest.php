<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SalesReturn;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderService;
use App\Services\SalesReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Phase 25 — CSV exports for all seven operational reports.
 *
 * Covers the full authorization matrix (guest / staff / manager / admin per
 * export), filter parity with the Phase 24 pages (including dates), the
 * pagination-vs-export-all distinction, CSV content (headers, escaping,
 * nulls, money and date formats), formula-injection and filename security,
 * read-only invariants (exports write NOTHING), and cross-consistency:
 * every export's rows agree with its web report's rows.
 */
class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    /** Every export route => attachment slug (filename = slug-YYYY-MM-DD.csv). */
    private const EXPORTS = [
        'admin.reports.inventory-movements.export' => 'inventory-movements',
        'admin.reports.purchases.export' => 'purchases',
        'admin.reports.sales.export' => 'sales',
        'admin.reports.returns.export' => 'returns',
        'admin.reports.low-stock.export' => 'low-stock',
        'admin.reports.suppliers.export' => 'suppliers',
        'admin.reports.customers.export' => 'customers',
    ];

    /** Staff-facing exports — identical to Phase 24's sales report group. */
    private const SALES_FACING = [
        'admin.reports.sales.export',
        'admin.reports.returns.export',
        'admin.reports.customers.export',
    ];

    /** Admin/manager-only exports: stock history, thresholds, purchasing, suppliers. */
    private const PRIVILEGED = [
        'admin.reports.inventory-movements.export',
        'admin.reports.purchases.export',
        'admin.reports.low-stock.export',
        'admin.reports.suppliers.export',
    ];

    /** @var list<string> */
    private const MOVEMENT_HEADER = [
        'Date', 'Movement Type', 'Product', 'Variant', 'Quantity',
        'Before Quantity', 'After Quantity', 'User', 'Reference', 'Reason', 'Notes',
    ];

    /** @var list<string> */
    private const PURCHASE_HEADER = [
        'Purchase Order', 'Supplier', 'Status', 'Ordered Date', 'Ordered Units',
        'Received Units', 'Outstanding Units', 'Purchase Value',
    ];

    /** @var list<string> */
    private const SALES_HEADER = [
        'Order', 'Customer', 'Status', 'Ordered Date', 'Total', 'Returned Units', 'Return Value',
    ];

    /** @var list<string> */
    private const RETURNS_HEADER = [
        'Return', 'Order', 'Customer', 'Product', 'Variant', 'Quantity', 'Value', 'Returned By', 'Returned At',
    ];

    /** @var list<string> */
    private const LOW_STOCK_HEADER = [
        'Product', 'Variant', 'SKU', 'Quantity', 'Threshold', 'Stock Status',
    ];

    /** @var list<string> */
    private const SUPPLIERS_HEADER = [
        'Supplier', 'Status', 'Purchase Orders', 'Open Purchase Orders', 'Purchase Value', 'Last Order',
    ];

    /** @var list<string> */
    private const CUSTOMERS_HEADER = [
        'Customer', 'Contact', 'Email', 'Phone', 'Orders', 'Delivered Orders',
        'Delivered Sales Value', 'Returned Units', 'Return Value',
    ];

    // ------------------------------------------------------------------
    // Fixtures — mirror the Phase 24 report test helpers exactly.
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity = 1000, ?int $threshold = null): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'P-'.uniqid(),
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => 'V-'.uniqid(),
            'sku' => 'SKU-'.strtoupper(bin2hex(random_bytes(4))),
            'quantity' => $quantity,
            'low_stock_threshold' => $threshold,
            'is_active' => true,
        ]);
    }

    private function makeCustomer(?string $company = null, array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'type' => 'individual',
            'company_name' => $company,
            'contact_name' => 'C-'.uniqid(),
            'is_active' => true,
        ], $overrides));
    }

    /**
     * @param  array<int, array{0: ProductVariant, 1: int, 2: float}>  $lines
     */
    private function makeOrder(
        string $status,
        array $lines,
        ?Customer $customer = null,
        array $overrides = [],
    ): Order {
        $actor = $this->userWithRole('admin');

        $order = Order::create(array_merge([
            'customer_id' => ($customer ?? $this->makeCustomer())->id,
            'reference_number' => 'ORD-'.uniqid(),
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => number_format(array_reduce($lines, fn ($c, $l) => $c + ($l[1] * $l[2]), 0.0), 2, '.', ''),
            'total' => number_format(array_reduce($lines, fn ($c, $l) => $c + ($l[1] * $l[2]), 0.0), 2, '.', ''),
            'notes' => null,
            'ordered_at' => now()->toDateString(),
        ], $overrides));

        foreach ($lines as $line) {
            $order->items()->create([
                'product_variant_id' => $line[0]->id,
                'quantity' => $line[1],
                'unit_price' => number_format($line[2], 2, '.', ''),
                'subtotal' => number_format($line[1] * $line[2], 2, '.', ''),
            ]);
        }

        if ($status !== Order::STATUS_PENDING) {
            app(OrderService::class)->confirm($order, $actor->id);
        }

        if ($status === Order::STATUS_DELIVERED) {
            app(OrderService::class)->deliver($order);
        }

        if ($status === Order::STATUS_CANCELLED) {
            app(OrderService::class)->cancel($order, (int) $actor->id);
        }

        return $order->fresh();
    }

    private function processReturn(Order $order, int $quantity, ?string $notes = null): SalesReturn
    {
        $itemId = (int) $order->items()->orderBy('id')->value('id');

        return app(SalesReturnService::class)->process($order, [
            ['order_item_id' => $itemId, 'quantity' => $quantity],
        ], $notes, $this->userWithRole('admin')->id);
    }

    private function makeSupplier(bool $active = true): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => $active]);
    }

    /**
     * Lines are [quantity, unit_cost, received_quantity?] — the established
     * integer-cent rule from PurchaseReportsTest / PurchaseDashboardTest.
     * Never creates stock movements.
     *
     * @param  array<int, array{0: int, 1: string, 2?: int}>  $lines
     */
    private function makePo(
        User $admin,
        string $status,
        array $lines,
        ?Supplier $supplier = null,
        array $overrides = [],
    ): PurchaseOrder {
        $subtotalCents = 0;
        $receivedCents = 0;

        $po = PurchaseOrder::create(array_merge([
            'po_number' => 'PO-'.uniqid(),
            'supplier_id' => ($supplier ?? $this->makeSupplier())->id,
            'created_by' => $admin->id,
            'status' => $status,
            'ordered_at' => now()->toDateString(),
        ], $overrides));

        foreach ($lines as $line) {
            $lineCents = $line[0] * (int) round(((float) $line[1]) * 100);
            $subtotalCents += $lineCents;
            $receivedCents += ($line[2] ?? 0) * (int) round(((float) $line[1]) * 100);

            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_variant_id' => $this->makeVariant(0)->id,
                'quantity' => $line[0],
                'unit_cost' => $line[1],
                'subtotal' => number_format($lineCents / 100, 2, '.', ''),
                'received_quantity' => $line[2] ?? 0,
            ]);
        }

        $po->update([
            'subtotal' => number_format($subtotalCents / 100, 2, '.', ''),
            'tax' => '0.00',
            'discount' => '0.00',
            'total' => number_format($subtotalCents / 100, 2, '.', ''),
            'received_total' => number_format($receivedCents / 100, 2, '.', ''),
        ]);

        return $po->fresh();
    }

    private function openStock(ProductVariant $variant, int $quantity, User $user): StockMovement
    {
        return app(InventoryService::class)->openingBalance($variant, $quantity, $user->id);
    }

    private function increaseStock(ProductVariant $variant, int $quantity, User $user, ?string $reason = 'Restock'): StockMovement
    {
        return app(InventoryService::class)->increase(
            $variant,
            $quantity,
            StockMovement::TYPE_ADJUSTMENT_IN,
            $reason,
            null,
            null,
            null,
            $user->id,
        );
    }

    private function decreaseStock(ProductVariant $variant, int $quantity, User $user, ?string $reason = 'Sale'): StockMovement
    {
        return app(InventoryService::class)->decrease(
            $variant,
            $quantity,
            StockMovement::TYPE_SALE,
            $reason,
            null,
            null,
            null,
            $user->id,
        );
    }

    // ------------------------------------------------------------------
    // Parsing helpers
    // ------------------------------------------------------------------

    /**
     * Strip the UTF-8 BOM and parse the streamed CSV with fgetcsv (handles
     * quoted commas/quotes/newlines correctly).
     *
     * @return list<list<string|null>>
     */
    private function csv(TestResponse $response): array
    {
        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, substr($content, 3));
        rewind($stream);

        $rows = [];
        while (($row = fgetcsv($stream, 0, ',', '"', '')) !== false) {
            $rows[] = $row;
        }
        fclose($stream);

        $this->assertNotEmpty($rows);

        return $rows;
    }

    /**
     * Assert the exact header row (deterministic column order) and return
     * only the data rows.
     *
     * @return list<list<string|null>>
     */
    private function csvData(TestResponse $response, array $expectedHeader): array
    {
        $rows = $this->csv($response);

        $this->assertSame($expectedHeader, $rows[0]);

        return array_slice($rows, 1);
    }

    /**
     * Inertia props of a report page for the currently authenticated user.
     *
     * @return array<string, mixed>
     */
    private function webProps(string $routeName): array
    {
        $response = $this->get(route($routeName));
        $response->assertOk();

        // Same normalisation AssertableInertia applies (view data -> array).
        $page = json_decode(json_encode($response->viewData('page')), true, 512, JSON_THROW_ON_ERROR);

        return $page['props'];
    }

    // ------------------------------------------------------------------
    // Authorization matrix
    // ------------------------------------------------------------------

    public function test_guests_are_redirected_to_login_from_every_export_route(): void
    {
        foreach (array_keys(self::EXPORTS) as $routeName) {
            $this->get(route($routeName))->assertRedirect(route('login'));
        }
    }

    public function test_admin_and_manager_can_export_every_report_as_csv_attachments(): void
    {
        foreach (['admin', 'manager'] as $role) {
            $user = $this->userWithRole($role);

            foreach (self::EXPORTS as $routeName => $slug) {
                $response = $this->actingAs($user)->get(route($routeName));

                $response->assertOk()
                    ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
                    ->assertDownload($slug.'-'.now()->toDateString().'.csv');

                // Parsed content proves a real header row streamed for this role.
                $this->assertNotEmpty($this->csv($response));
            }
        }
    }

    public function test_staff_can_export_their_sales_facing_reports(): void
    {
        $staff = $this->userWithRole('staff');

        foreach (self::SALES_FACING as $routeName) {
            $slug = self::EXPORTS[$routeName];

            $this->actingAs($staff)
                ->get(route($routeName))
                ->assertOk()
                ->assertDownload($slug.'-'.now()->toDateString().'.csv');
        }
    }

    public function test_staff_are_forbidden_from_privileged_exports(): void
    {
        $staff = $this->userWithRole('staff');

        foreach (self::PRIVILEGED as $routeName) {
            $this->actingAs($staff)->get(route($routeName))->assertForbidden();
        }
    }

    // ------------------------------------------------------------------
    // Content + filters, one meaningful test per report
    // ------------------------------------------------------------------

    public function test_inventory_movements_export_contains_the_ledger_with_stable_formats(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0);
        $this->openStock($variant, 100, $admin);      // 0   -> 100
        $this->increaseStock($variant, 10, $admin);   // 100 -> 110
        $this->decreaseStock($variant, 5, $admin);    // 110 -> 105

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export')),
            self::MOVEMENT_HEADER,
        );

        $this->assertCount(3, $data);

        // Newest first (created_at DESC, id DESC): sale, adjustment_in, opening.
        $newest = $data[0];
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string) $newest[0]);
        $this->assertSame(
            ['sale', $variant->product->name, $variant->name, '5', '110', '105', $admin->name, '', 'Sale', ''],
            array_slice($newest, 1),
        );

        $this->assertSame('adjustment_in', $data[1][1]);
        $this->assertSame('Restock', $data[1][9]);

        // Null reference/notes become empty cells, and the acting user is named.
        $this->assertSame('opening_balance', $data[2][1]);
        $this->assertSame(['100', '0', '100'], [$data[2][4], $data[2][5], $data[2][6]]);
        $this->assertSame($admin->name, $data[2][7]);
        $this->assertSame('', $data[2][8]); // null reference -> empty cell
        $this->assertSame('', $data[2][10]); // null notes -> empty cell
    }

    public function test_inventory_movements_export_honours_type_and_date_filters(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0);
        $opening = $this->openStock($variant, 30, $admin);
        $this->increaseStock($variant, 10, $admin);

        // Move the opening movement into a fixed historical day.
        DB::table('stock_movements')->where('id', $opening->id)->update([
            'created_at' => '2026-01-15 10:00:00',
            'updated_at' => '2026-01-15 10:00:00',
        ]);

        $typeData = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export', ['movement_type' => 'adjustment_in'])),
            self::MOVEMENT_HEADER,
        );
        $this->assertCount(1, $typeData);
        $this->assertSame('adjustment_in', $typeData[0][1]);

        $dayData = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export', [
                'date_from' => '2026-01-15',
                'date_to' => '2026-01-15',
            ])),
            self::MOVEMENT_HEADER,
        );
        $this->assertCount(1, $dayData);
        $this->assertSame('opening_balance', $dayData[0][1]);
        $this->assertStringStartsWith('2026-01-15', (string) $dayData[0][0]);
    }

    public function test_purchases_export_contains_report_values_and_status_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $approved = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-01']);
        $partial = $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '25.00', 4]], $supplier, ['ordered_at' => '2026-03-02']);
        $cancelled = $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-04']);

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.purchases.export')),
            self::PURCHASE_HEADER,
        );

        // ordered_at DESC, id DESC: cancelled, partial, approved.
        $this->assertSame([
            [$cancelled->po_number, $supplier->name, 'cancelled', '2026-03-04', '10', '0', '0', '250.00'],
            [$partial->po_number, $supplier->name, 'partially_received', '2026-03-02', '10', '4', '6', '250.00'],
            [$approved->po_number, $supplier->name, 'approved', '2026-03-01', '10', '0', '10', '250.00'],
        ], $data);

        $filtered = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.purchases.export', ['status' => 'approved'])),
            self::PURCHASE_HEADER,
        );
        $this->assertCount(1, $filtered);
        $this->assertSame($approved->po_number, $filtered[0][0]);
    }

    public function test_sales_export_contains_report_values_with_status_and_date_filters(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Acme Corp');
        $pending = $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $customer, ['ordered_at' => '2026-04-01']);
        $confirmed = $this->makeOrder(Order::STATUS_CONFIRMED, [[$variant, 2, 100.00]], $customer, ['ordered_at' => '2026-04-02']);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer, ['ordered_at' => '2026-04-03']);
        $cancelled = $this->makeOrder(Order::STATUS_CANCELLED, [[$variant, 5, 100.00]], $customer, ['ordered_at' => '2026-04-04']);
        $this->processReturn($delivered, 2);

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.sales.export')),
            self::SALES_HEADER,
        );

        // ordered_at DESC: cancelled, delivered (with its return), confirmed, pending.
        $this->assertSame([
            [$cancelled->reference_number, 'Acme Corp', 'cancelled', '2026-04-04', '500.00', '0', '0.00'],
            [$delivered->reference_number, 'Acme Corp', 'delivered', '2026-04-03', '400.00', '2', '200.00'],
            [$confirmed->reference_number, 'Acme Corp', 'confirmed', '2026-04-02', '200.00', '0', '0.00'],
            [$pending->reference_number, 'Acme Corp', 'pending', '2026-04-01', '100.00', '0', '0.00'],
        ], $data);

        $byStatus = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.sales.export', ['status' => 'delivered'])),
            self::SALES_HEADER,
        );
        $this->assertCount(1, $byStatus);
        $this->assertSame($delivered->reference_number, $byStatus[0][0]);

        $byDate = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.sales.export', [
                'date_from' => '2026-04-02',
                'date_to' => '2026-04-03',
            ])),
            self::SALES_HEADER,
        );
        // ordered_at DESC within the range: delivered (04-03) then confirmed (04-02).
        $this->assertSame(
            [$delivered->reference_number, $confirmed->reference_number],
            array_column($byDate, 0),
        );
    }

    public function test_returns_export_has_one_row_per_line_and_honours_the_variant_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $acme = $this->makeCustomer('Acme Corp');
        $beta = $this->makeCustomer('Beta Ltd');
        $variantOne = $this->makeVariant();
        $variantTwo = $this->makeVariant();

        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantOne, 2, 100.00], [$variantTwo, 1, 50.00]], $acme);
        $orderB = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantOne, 3, 100.00]], $beta);

        // Return A spans both lines; return B is single-line.
        $itemIds = $orderA->items()->orderBy('id')->pluck('id')->all();
        $returnA = app(SalesReturnService::class)->process($orderA, [
            ['order_item_id' => $itemIds[0], 'quantity' => 2],
            ['order_item_id' => $itemIds[1], 'quantity' => 1],
        ], null, $admin->id);
        $returnB = $this->processReturn($orderB, 1);

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.returns.export')),
            self::RETURNS_HEADER,
        );

        // returned_at DESC (id DESC tiebreak), then one row per return line:
        // B first (single line), then A's two lines in line order.
        $this->assertCount(3, $data);
        $this->assertSame([
            $returnB->return_number,
            $orderB->reference_number,
            'Beta Ltd',
            $variantOne->product->name,
            $variantOne->name,
            '1',
            '100.00',
            $returnB->returnedBy->name,
            now()->format('Y-m-d'),
        ], $data[0]);

        $this->assertSame($returnA->return_number, $data[1][0]);
        $this->assertSame($returnA->return_number, $data[2][0]);
        $this->assertSame('Acme Corp', $data[1][2]);
        $this->assertSame([$variantOne->name, $variantTwo->name], [$data[1][4], $data[2][4]]);
        $this->assertSame(['2', '1'], [$data[1][5], $data[2][5]]);
        $this->assertSame(['200.00', '50.00'], [$data[1][6], $data[2][6]]);

        // Variant filter matches RETURNS containing that variant, so every
        // line of the matched return is exported.
        $filtered = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.returns.export', ['variant_id' => $variantTwo->id])),
            self::RETURNS_HEADER,
        );
        $this->assertCount(2, $filtered);
        $this->assertSame([$returnA->return_number, $returnA->return_number], array_column($filtered, 0));
    }

    public function test_low_stock_export_exposes_status_codes_and_thresholds_with_status_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $out = $this->makeVariant(0, null);
        $low = $this->makeVariant(5, 10);
        $healthy = $this->makeVariant(100, 10);

        // Default = attention: out-of-stock OR at/below a set threshold.
        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.low-stock.export')),
            self::LOW_STOCK_HEADER,
        );

        $this->assertSame([
            [$out->product->name, $out->name, $out->sku, '0', '', 'out_of_stock'],
            [$low->product->name, $low->name, $low->sku, '5', '10', 'low_stock'],
        ], $data);

        $only = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.low-stock.export', ['status' => 'out'])),
            self::LOW_STOCK_HEADER,
        );
        $this->assertCount(1, $only);
        $this->assertSame('out_of_stock', $only[0][5]);

        $monitored = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.low-stock.export', ['status' => 'monitored'])),
            self::LOW_STOCK_HEADER,
        );
        // Stock Status ships the backend status CODE (not the filter label).
        $this->assertSame(['low_stock', 'in_stock'], array_column($monitored, 5));
        $this->assertSame($low->sku, $monitored[0][2]);
        $this->assertSame($healthy->sku, $monitored[1][2]);
    }

    public function test_suppliers_export_contains_phase22_aggregates_and_status_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $active = $this->makeSupplier(true);
        $inactive = $this->makeSupplier(false);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $active, ['ordered_at' => '2026-03-05']);

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.suppliers.export')),
            self::SUPPLIERS_HEADER,
        );

        $byName = collect($data)->keyBy(0);
        // Last Order is the raw withMax value — byte-identical to the page
        // payload (which the browser localises on render).
        $this->assertSame(
            ['Active', '1', '1', '250.00', '2026-03-05 00:00:00'],
            array_slice($byName->get($active->name), 1),
        );
        // Zero aggregates and a never-ordered supplier stay explicit (0s, empty date).
        $this->assertSame(
            ['Inactive', '0', '0', '0.00', ''],
            array_slice($byName->get($inactive->name), 1),
        );

        $activeOnly = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.suppliers.export', ['status' => 'active'])),
            self::SUPPLIERS_HEADER,
        );
        $this->assertSame([$active->name], array_column($activeOnly, 0));

        $inactiveOnly = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.suppliers.export', ['status' => 'inactive'])),
            self::SUPPLIERS_HEADER,
        );
        $this->assertSame([$inactive->name], array_column($inactiveOnly, 0));
    }

    public function test_customers_export_contains_contact_columns_and_search_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $acme = $this->makeCustomer('Acme Corp', [
            'contact_name' => 'Ada Lovelace',
            'email' => 'ada@acme.test',
            'phone' => '0900123456',
        ]);
        $beta = $this->makeCustomer('Beta Ltd');
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $acme);
        $this->processReturn($delivered, 2);

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.customers.export')),
            self::CUSTOMERS_HEADER,
        );

        $byName = collect($data)->keyBy(0);
        $this->assertSame(
            ['Ada Lovelace', 'ada@acme.test', '0900123456', '1', '1', '400.00', '2', '200.00'],
            array_slice($byName->get('Acme Corp'), 1),
        );
        // Null contact fields are empty cells; zero aggregates are explicit.
        $this->assertSame(
            [$beta->contact_name, '', '', '0', '0', '0.00', '0', '0.00'],
            array_slice($byName->get('Beta Ltd'), 1),
        );

        $found = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.customers.export', ['search' => 'Acme'])),
            self::CUSTOMERS_HEADER,
        );
        $this->assertSame(['Acme Corp'], array_column($found, 0));

        // No match: a valid, filtered export is a header-only file.
        $none = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.customers.export', ['search' => 'no-such-company'])),
            self::CUSTOMERS_HEADER,
        );
        $this->assertSame([], $none);
    }

    // ------------------------------------------------------------------
    // Pagination vs export-all
    // ------------------------------------------------------------------

    public function test_sales_export_returns_every_matching_row_not_just_one_page(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $main = $this->makeCustomer('Main Co');
        $other = $this->makeCustomer('Other Co');

        for ($i = 0; $i < 25; $i++) {
            $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $main);
        }
        for ($i = 0; $i < 3; $i++) {
            $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 10.00]], $other);
        }

        // The PAGE paginates: 20 rows on page 1, the rest behind page 2.
        $this->actingAs($admin)
            ->get(route('admin.reports.sales'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 20)
                ->where('orders.last_page', 2));

        $this->actingAs($admin)
            ->get(route('admin.reports.sales', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('orders.data', 8));

        // The EXPORT ignores pagination entirely: all 28 matching rows…
        $all = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.sales.export')),
            self::SALES_HEADER,
        );
        $this->assertCount(28, $all);

        // …and a filtered export contains every row of THAT filter (3), not 20 and not 28.
        $filtered = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.sales.export', ['customer_id' => $other->id])),
            self::SALES_HEADER,
        );
        $this->assertCount(3, $filtered);

        $webFiltered = $this->actingAs($admin)
            ->get(route('admin.reports.sales', ['customer_id' => $other->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('orders.data', 3));
        $this->assertNotNull($webFiltered);
    }

    public function test_inventory_movements_export_streams_every_movement_not_one_page(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0);
        $this->openStock($variant, 100, $admin);
        for ($i = 0; $i < 24; $i++) {
            $this->increaseStock($variant, 1, $admin, 'Restock '.$i);
        }

        $this->actingAs($admin)
            ->get(route('admin.reports.inventory-movements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('movements.data', 20)
                ->where('summary.movement_count', 25));

        $data = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export')),
            self::MOVEMENT_HEADER,
        );
        $this->assertCount(25, $data);
    }

    // ------------------------------------------------------------------
    // CSV correctness and security
    // ------------------------------------------------------------------

    public function test_csv_escaping_round_trips_commas_quotes_and_newlines(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $reason = "Damage, \"bulk\" lot\nsecond line";
        $this->increaseStock($variant, 5, $admin, $reason);

        $response = $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export'));
        $data = $this->csvData($response, self::MOVEMENT_HEADER);

        $this->assertCount(1, $data);
        // The parsed cell is byte-identical to the original text…
        $this->assertSame($reason, $data[0][9]);
        // …while the raw stream carries RFC-style doubled quotes.
        $this->assertStringContainsString('"Damage, ""bulk"" lot', $response->streamedContent());
    }

    public function test_formula_like_text_is_neutralised_but_numeric_cells_are_untouched(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $this->increaseStock($variant, 5, $admin, '=SUM(A1:A3)');
        $this->increaseStock($variant, 7, $admin, '@shell');
        $this->increaseStock($variant, 3, $admin, '-50');

        $this->makeCustomer('+Growth Ltd');
        $this->makeCustomer('-Tricky Ltd');

        $movements = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export')),
            self::MOVEMENT_HEADER,
        );

        $reasons = array_column($movements, 9);
        $this->assertContains("'=SUM(A1:A3)", $reasons);
        $this->assertContains("'@shell", $reasons);
        // A numeric-looking negative value stays a valid number (no prefix).
        $this->assertContains('-50', $reasons);
        // Quantity cells are plain numbers, never prefixed.
        $this->assertContains('3', array_column($movements, 4));
        $this->assertContains('5', array_column($movements, 4));

        // Formula-shaped customer names are neutralised too.
        $customers = $this->csvData(
            $this->actingAs($admin)->get(route('admin.reports.customers.export')),
            self::CUSTOMERS_HEADER,
        );
        $names = array_column($customers, 0);
        $this->assertContains("'+Growth Ltd", $names);
        $this->assertContains("'-Tricky Ltd", $names);
    }

    public function test_filename_is_date_based_and_never_contains_user_input(): void
    {
        $staff = $this->userWithRole('staff');

        $response = $this->actingAs($staff)->get(route('admin.reports.customers.export', [
            'search' => '../../..\\evil',
        ]));

        $response->assertOk()->assertDownload('customers-'.now()->toDateString().'.csv');
        $this->assertStringNotContainsString('evil', $response->headers->get('content-disposition', ''));
        $this->assertStringNotContainsString('..', $response->headers->get('content-disposition', ''));
    }

    public function test_export_validation_rejects_the_same_invalid_filters_as_the_page(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases.export', ['status' => 'not-a-status']))
            ->assertRedirect()
            ->assertSessionHasErrors('status');

        $this->actingAs($admin)
            ->get(route('admin.reports.sales.export', [
                'date_from' => '2026-04-05',
                'date_to' => '2026-04-01',
            ]))
            ->assertRedirect()
            ->assertSessionHasErrors('date_to');
    }

    // ------------------------------------------------------------------
    // Read-only invariants
    // ------------------------------------------------------------------

    public function test_exports_never_write_any_business_data(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0, 50);
        $this->openStock($variant, 100, $admin);
        $this->increaseStock($variant, 10, $admin);
        $this->decreaseStock($variant, 5, $admin);

        $customer = $this->makeCustomer('Acme Corp', ['email' => 'a@b.test']);
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 3, 100.00]], $customer);
        $this->processReturn($delivered, 1);

        $supplier = $this->makeSupplier();
        $po = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[5, '20.00']], $supplier);

        // Snapshot AFTER fixtures, BEFORE any export.
        $before = [
            'quantities' => ProductVariant::orderBy('id')->pluck('quantity', 'id')->all(),
            'thresholds' => ProductVariant::orderBy('id')->pluck('low_stock_threshold', 'id')->all(),
            'movements' => StockMovement::orderBy('id')->get(['id', 'movement_type', 'quantity', 'quantity_before', 'quantity_after', 'reason'])->toArray(),
            'movement_count' => StockMovement::count(),
            'orders' => Order::orderBy('id')->get(['id', 'status', 'subtotal', 'total', 'ordered_at'])->toArray(),
            'items' => DB::table('order_items')->orderBy('id')->get(['id', 'quantity', 'unit_price', 'subtotal', 'returned_quantity'])->map(fn ($r) => (array) $r)->all(),
            'returns' => SalesReturn::orderBy('id')->get()->toArray(),
            'return_count' => SalesReturn::count(),
            'purchase_orders' => PurchaseOrder::orderBy('id')->get()->toArray(),
            'suppliers' => Supplier::orderBy('id')->get()->toArray(),
            'customers' => Customer::orderBy('id')->get()->toArray(),
        ];

        // Hit every export, each under a meaningful filter.
        $this->actingAs($admin)->get(route('admin.reports.inventory-movements.export', ['movement_type' => 'adjustment_in']))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.purchases.export', ['status' => 'approved']))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.sales.export', ['status' => 'delivered']))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.returns.export', ['variant_id' => $variant->id]))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.low-stock.export', ['status' => 'attention']))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.suppliers.export', ['status' => 'active']))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.customers.export', ['search' => 'Acme']))->assertOk();

        $after = [
            'quantities' => ProductVariant::orderBy('id')->pluck('quantity', 'id')->all(),
            'thresholds' => ProductVariant::orderBy('id')->pluck('low_stock_threshold', 'id')->all(),
            'movements' => StockMovement::orderBy('id')->get(['id', 'movement_type', 'quantity', 'quantity_before', 'quantity_after', 'reason'])->toArray(),
            'movement_count' => StockMovement::count(),
            'orders' => Order::orderBy('id')->get(['id', 'status', 'subtotal', 'total', 'ordered_at'])->toArray(),
            'items' => DB::table('order_items')->orderBy('id')->get(['id', 'quantity', 'unit_price', 'subtotal', 'returned_quantity'])->map(fn ($r) => (array) $r)->all(),
            'returns' => SalesReturn::orderBy('id')->get()->toArray(),
            'return_count' => SalesReturn::count(),
            'purchase_orders' => PurchaseOrder::orderBy('id')->get()->toArray(),
            'suppliers' => Supplier::orderBy('id')->get()->toArray(),
            'customers' => Customer::orderBy('id')->get()->toArray(),
        ];

        $this->assertSame($before, $after);

        // Fixtures sanity: the snapshots actually covered real data.
        $this->assertGreaterThan(0, $before['movement_count']);
        $this->assertSame('delivered', $before['orders'][0]['status']);
        $this->assertSame(1, $before['return_count']);
        $this->assertGreaterThan(0, (int) $after['quantities'][$variant->id]);
        $this->assertNotEmpty($before['purchase_orders']);
        $this->assertSame((int) $delivered->items()->first()->returned_quantity, (int) $after['items'][0]['returned_quantity']);
        $this->assertSame($po->po_number, $after['purchase_orders'][0]['po_number']);
    }

    // ------------------------------------------------------------------
    // Cross-consistency: export rows agree with the Phase 24 page rows
    // ------------------------------------------------------------------

    public function test_inventory_movements_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0);
        $this->openStock($variant, 100, $admin);
        $this->increaseStock($variant, 10, $admin);
        $this->decreaseStock($variant, 5, $admin);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.inventory-movements');
        $webTuples = collect($props['movements']['data'])
            ->map(fn ($m) => [$m['movement_type'], (int) $m['quantity'], (int) $m['quantity_after'], $m['user']['name']])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.inventory-movements.export')),
            self::MOVEMENT_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[1], (int) $r[4], (int) $r[6], $r[7]], $data);

        $this->assertSame($webTuples, $csvTuples);
        $this->assertSame($props['summary']['movement_count'], count($data));
    }

    public function test_purchases_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-01']);
        $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '25.00', 4]], $supplier, ['ordered_at' => '2026-03-02']);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '25.00', 10]], $supplier, ['ordered_at' => '2026-03-03']);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.purchases');
        $webTuples = collect($props['purchase_orders']['data'])
            ->map(fn ($p) => [$p['po_number'], (int) $p['ordered_quantity'], (int) $p['remaining_quantity'], $p['total']])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.purchases.export')),
            self::PURCHASE_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[0], (int) $r[4], (int) $r[6], $r[7]], $data);

        $this->assertSame($webTuples, $csvTuples);
        $this->assertSame($props['summary']['purchase_orders'], count($data));
    }

    public function test_sales_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $customer = $this->makeCustomer('Acme Corp');
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $customer, ['ordered_at' => '2026-04-03']);
        $this->makeOrder(Order::STATUS_PENDING, [[$variant, 1, 100.00]], $customer, ['ordered_at' => '2026-04-01']);
        $this->processReturn($delivered, 2);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.sales');
        $webTuples = collect($props['orders']['data'])
            ->map(fn ($o) => [$o['reference_number'], $o['status'], $o['total'], (int) $o['returned_quantity'], $o['return_value']])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.sales.export')),
            self::SALES_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[0], $r[2], $r[4], (int) $r[5], $r[6]], $data);

        $this->assertSame($webTuples, $csvTuples);
        $this->assertSame($props['summary']['orders'], count($data));
    }

    public function test_returns_export_agrees_with_the_page_per_return(): void
    {
        $admin = $this->userWithRole('admin');
        $acme = $this->makeCustomer('Acme Corp');
        $variantOne = $this->makeVariant();
        $variantTwo = $this->makeVariant();

        $orderA = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantOne, 2, 100.00], [$variantTwo, 1, 50.00]], $acme);
        $orderB = $this->makeOrder(Order::STATUS_DELIVERED, [[$variantOne, 3, 100.00]], $acme);

        $itemIds = $orderA->items()->orderBy('id')->pluck('id')->all();
        app(SalesReturnService::class)->process($orderA, [
            ['order_item_id' => $itemIds[0], 'quantity' => 2],
            ['order_item_id' => $itemIds[1], 'quantity' => 1],
        ], null, $admin->id);
        $this->processReturn($orderB, 1);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.returns');
        $webByNumber = collect($props['returns']['data'])->keyBy('return_number');

        $data = $this->csvData(
            $this->get(route('admin.reports.returns.export')),
            self::RETURNS_HEADER,
        );

        // The same SET of returns appears in the export…
        $grouped = collect($data)->groupBy(0);
        $this->assertSame(
            $webByNumber->keys()->sort()->values()->all(),
            $grouped->keys()->sort()->values()->all(),
        );

        // …and summing the exported lines reproduces each page row's Units
        // and Return Value exactly (total = Σ persisted line subtotals).
        foreach ($webByNumber as $number => $webReturn) {
            $lines = $grouped->get($number);
            $this->assertSame(
                (int) $webReturn['returned_quantity'],
                (int) collect($lines)->sum(fn ($r) => (int) $r[5]),
            );
            $this->assertSame(
                $webReturn['total'],
                number_format((float) collect($lines)->sum(fn ($r) => (float) $r[6]), 2, '.', ''),
            );
        }
    }

    public function test_low_stock_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $this->makeVariant(0, null);
        $this->makeVariant(5, 10);
        $this->makeVariant(100, 10);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.low-stock');
        $webTuples = collect($props['variants']['data'])
            ->map(fn ($v) => [$v['sku'], (int) $v['quantity'], $v['stock_status']])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.low-stock.export')),
            self::LOW_STOCK_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[2], (int) $r[3], $r[5]], $data);

        $this->assertSame($webTuples, $csvTuples);
        // attention rows = out + low (the default card scope) = exported rows.
        $this->assertSame($props['counts']['out'] + $props['counts']['low'], count($data));
    }

    public function test_suppliers_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier(true);
        $this->makeSupplier(false);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-05']);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.suppliers');
        $webTuples = collect($props['suppliers']['data'])
            ->map(fn ($s) => [
                $s['name'],
                $s['is_active'] ? 'Active' : 'Inactive',
                (int) $s['purchase_orders_count'],
                (int) $s['open_purchase_orders_count'],
                $s['purchase_value'],
                $s['last_ordered_at'] ?? '',
            ])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.suppliers.export')),
            self::SUPPLIERS_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[0], $r[1], (int) $r[2], (int) $r[3], $r[4], $r[5]], $data);

        $this->assertSame($webTuples, $csvTuples);
        $this->assertSame($props['summary']['suppliers'], count($data));
    }

    public function test_customers_export_agrees_with_the_page(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant();
        $acme = $this->makeCustomer('Acme Corp');
        $this->makeCustomer('Beta Ltd');
        $delivered = $this->makeOrder(Order::STATUS_DELIVERED, [[$variant, 4, 100.00]], $acme);
        $this->processReturn($delivered, 2);

        $this->actingAs($admin);

        $props = $this->webProps('admin.reports.customers');
        $webTuples = collect($props['customers']['data'])
            ->map(fn ($c) => [
                $c['name'],
                (int) $c['orders_count'],
                (int) $c['delivered_orders_count'],
                $c['delivered_sales_value'],
                (int) $c['returned_units'],
                $c['return_value'],
            ])
            ->all();

        $data = $this->csvData(
            $this->get(route('admin.reports.customers.export')),
            self::CUSTOMERS_HEADER,
        );
        $csvTuples = array_map(fn ($r) => [$r[0], (int) $r[4], (int) $r[5], $r[6], (int) $r[7], $r[8]], $data);

        $this->assertSame($webTuples, $csvTuples);
        $this->assertSame($props['summary']['customers'], count($data));
    }
}
