<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseReportsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(): Product
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'P',
            'slug' => 'p-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);
        $product->variants()->create(['name' => 'Default', 'quantity' => 0, 'is_active' => true]);

        return $product;
    }

    private function makeSupplier(bool $active = true): Supplier
    {
        return Supplier::create(['name' => 'Sup-'.uniqid(), 'is_active' => $active]);
    }

    /**
     * Lines are [quantity, unit_cost, received_quantity?]. Totals follow the
     * established integer-cent rule (subtotalCents = qty * round(unit*100)),
     * exactly as PurchaseDashboardTest builds fixtures. No stock movement is
     * ever created here: receiving through receipts is a separate flow and
     * these fixtures only persist quantities on the order lines.
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
                'product_variant_id' => $this->makeVariant()->variants()->first()->id,
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

    // ------------------------------------------------------------------
    // Report B — Purchases
    // ------------------------------------------------------------------

    public function test_rows_show_ordered_received_and_outstanding_quantities_plus_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $approved = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-01']);
        $partial = $this->makePo($admin, PurchaseOrder::STATUS_PARTIALLY_RECEIVED, [[10, '25.00', 4]], $supplier, ['ordered_at' => '2026-03-02']);
        $received = $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '25.00', 10]], $supplier, ['ordered_at' => '2026-03-03']);
        $cancelled = $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-03-04']);

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Purchases')
                ->has('purchase_orders.data', 4)
                // Newest ordered_at first, ties broken by id descending.
                ->where('purchase_orders.data.0.id', $cancelled->id)
                ->where('purchase_orders.data.0.status', 'cancelled')
                ->where('purchase_orders.data.0.ordered_quantity', 10)
                ->where('purchase_orders.data.0.received_quantity', 0)
                // Cancelled orders can never be received: outstanding is forced to zero.
                ->where('purchase_orders.data.0.remaining_quantity', 0)
                ->where('purchase_orders.data.0.total', '250.00')
                ->where('purchase_orders.data.0.supplier.name', $supplier->name)
                ->where('purchase_orders.data.1.id', $received->id)
                ->where('purchase_orders.data.1.ordered_quantity', 10)
                ->where('purchase_orders.data.1.received_quantity', 10)
                ->where('purchase_orders.data.1.remaining_quantity', 0)
                ->where('purchase_orders.data.2.id', $partial->id)
                ->where('purchase_orders.data.2.ordered_quantity', 10)
                ->where('purchase_orders.data.2.received_quantity', 4)
                ->where('purchase_orders.data.2.remaining_quantity', 6)
                ->where('purchase_orders.data.3.id', $approved->id)
                ->where('purchase_orders.data.3.ordered_quantity', 10)
                ->where('purchase_orders.data.3.received_quantity', 0)
                ->where('purchase_orders.data.3.remaining_quantity', 10)
                ->where('purchase_orders.data.3.ordered_at', fn ($v) => str_contains((string) $v, '2026-03-01'))
                ->where('summary.purchase_orders', 4)
                ->where('summary.open_orders', 2)
                ->where('summary.ordered_units', 40)
                ->where('summary.received_units', 14)
                ->where('summary.outstanding_units', 16)
                ->where('summary.purchase_value', '750.00')
                ->where('purchase_statuses', PurchaseOrder::STATUSES)
                ->whereNull('filters.status')
                ->whereNull('filters.supplier_id')
                ->whereNull('filters.date_from')
                ->whereNull('filters.date_to')
                ->whereNull('filters.search'));
    }

    public function test_status_filter_returns_only_matching_orders_and_scopes_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $approved = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier);
        $draft = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[5, '10.00']], $supplier);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[7, '30.00']], $supplier);

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases', ['status' => 'approved']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Purchases')
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $approved->id)
                ->where('summary.purchase_orders', 1)
                ->where('summary.open_orders', 1)
                ->where('summary.ordered_units', 10)
                ->where('summary.received_units', 0)
                ->where('summary.outstanding_units', 10)
                ->where('summary.purchase_value', '250.00')
                ->where('filters.status', 'approved'));

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $draft->id)
                ->where('summary.purchase_orders', 1)
                ->where('summary.purchase_value', '50.00')
                ->where('filters.status', 'draft'));

        // Statuses come from the backend whitelist; invalid values never reach SQL.
        $this->actingAs($admin)
            ->get(route('admin.reports.purchases', ['status' => 'not-a-status']))
            ->assertStatus(302)
            ->assertSessionHasErrors('status');
    }

    public function test_date_filters_are_inclusive_on_ordered_at_and_combine_with_status(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $first = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $supplier, ['ordered_at' => '2026-01-05']);
        $second = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[1, '10.00']], $supplier, ['ordered_at' => '2026-01-10']);
        $third = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[1, '10.00']], $supplier, ['ordered_at' => '2026-01-15']);

        $report = route('admin.reports.purchases');

        // Both bounds inclusive: ordered_at equal to each bound is included.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-01-05', 'date_to' => '2026-01-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 2)
                ->where('purchase_orders.data.0.id', $second->id)
                ->where('purchase_orders.data.1.id', $first->id)
                ->where('summary.purchase_orders', 2)
                ->where('summary.purchase_value', '20.00')
                ->where('filters.date_from', '2026-01-05')
                ->where('filters.date_to', '2026-01-10'));

        // from only.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-01-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $third->id)
                ->where('summary.purchase_orders', 1)
                ->where('summary.purchase_value', '10.00'));

        // to only.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_to' => '2026-01-06']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $first->id)
                ->where('summary.purchase_orders', 1));

        // No match: empty rows and a fully zeroed summary.
        $this->actingAs($admin)->get($report.'?'.http_build_query(['date_from' => '2026-02-01', 'date_to' => '2026-02-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 0)
                ->where('summary.purchase_orders', 0)
                ->where('summary.ordered_units', 0)
                ->where('summary.received_units', 0)
                ->where('summary.outstanding_units', 0)
                ->where('summary.purchase_value', '0.00'));

        // Date range combined with the status filter: both must apply.
        $this->actingAs($admin)->get($report.'?'.http_build_query([
            'date_from' => '2026-01-05',
            'date_to' => '2026-01-10',
            'status' => 'approved',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $second->id)
                ->where('summary.purchase_orders', 1)
                ->where('summary.purchase_value', '10.00')
                ->where('filters.status', 'approved'));

        // The status filter alone would match two orders; the date range narrowed it to one.
        $this->assertSame(
            2,
            PurchaseOrder::where('supplier_id', $supplier->id)->where('status', 'approved')->count()
        );
    }

    public function test_search_matches_po_number_or_supplier_name(): void
    {
        $admin = $this->userWithRole('admin');
        $findable = Supplier::create([
            'name' => 'Zenith Traders',
            'is_active' => true,
        ]);
        $target = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $findable, ['po_number' => 'PO-FINDME']);
        $other = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[2, '10.00']]);

        $report = route('admin.reports.purchases');

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'PO-FINDME']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $target->id)
                ->where('summary.purchase_orders', 1)
                ->where('summary.purchase_value', '10.00')
                ->where('filters.search', 'PO-FINDME'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'Zenith']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $target->id)
                ->where('summary.purchase_value', '10.00'));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 0)
                ->where('summary.purchase_orders', 0)
                ->where('summary.purchase_value', '0.00'));

        $this->assertNotNull($other->id);
    }

    public function test_supplier_filter_returns_only_that_suppliers_orders_and_scopes_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $supplierA = $this->makeSupplier();
        $supplierB = $this->makeSupplier();
        $poA = $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[3, '20.00']], $supplierA);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[9, '10.00']], $supplierB);

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases', ['supplier_id' => $supplierA->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('purchase_orders.data.0.id', $poA->id)
                ->where('purchase_orders.data.0.supplier.name', $supplierA->name)
                ->where('summary.purchase_orders', 1)
                ->where('summary.ordered_units', 3)
                ->where('summary.purchase_value', '60.00')
                // Query-string filters echo back as strings, not ints.
                ->where('filters.supplier_id', (string) $supplierA->id));

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases', ['supplier_id' => $supplierB->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 1)
                ->where('summary.purchase_value', '90.00'));
    }

    public function test_pagination_shows_twenty_per_page_and_filters_survive_page_two(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $ids[] = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $supplier)->id;
        }
        // Ordered_at is identical, so id descending decides the order.
        $newestFirst = array_reverse($ids);
        $report = route('admin.reports.purchases');

        $this->actingAs($admin)->get($report)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 20)
                ->where('purchase_orders.current_page', 1)
                ->where('purchase_orders.per_page', 20)
                ->where('purchase_orders.total', 25)
                ->where('purchase_orders.last_page', 2)
                ->where('purchase_orders.data.0.id', $newestFirst[0])
                ->where('purchase_orders.data.19.id', $newestFirst[19]));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['page' => 2, 'status' => 'draft', 'supplier_id' => $supplier->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('purchase_orders.data', 5)
                ->where('purchase_orders.current_page', 2)
                ->where('purchase_orders.per_page', 20)
                ->where('purchase_orders.total', 25)
                ->where('purchase_orders.data.0.id', $newestFirst[20])
                ->where('purchase_orders.data.4.id', $newestFirst[24])
                ->where('filters.status', 'draft')
                ->where('filters.supplier_id', (string) $supplier->id));
    }

    public function test_empty_state_returns_zeroed_summary_and_backend_status_vocabulary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.purchases'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Purchases')
                ->has('purchase_orders.data', 0)
                ->where('summary.purchase_orders', 0)
                ->where('summary.open_orders', 0)
                ->where('summary.ordered_units', 0)
                ->where('summary.received_units', 0)
                ->where('summary.outstanding_units', 0)
                ->where('summary.purchase_value', '0.00')
                ->where('purchase_statuses', PurchaseOrder::STATUSES)
                ->where('suppliers', []));
    }

    // ------------------------------------------------------------------
    // Report F — Suppliers
    // ------------------------------------------------------------------

    public function test_supplier_rows_aggregate_counts_open_orders_value_and_last_order(): void
    {
        $admin = $this->userWithRole('admin');
        $busy = $this->makeSupplier();
        $idle = $this->makeSupplier();
        $inactive = $this->makeSupplier(false);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[4, '25.00']], $busy, ['ordered_at' => '2026-03-01']);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[2, '50.00']], $busy, ['ordered_at' => '2026-03-02']);
        $this->makePo($admin, PurchaseOrder::STATUS_CANCELLED, [[9, '99.00']], $busy, ['ordered_at' => '2026-03-03']);

        // Suppliers are newest-created first; a supplier with three POs must
        // still appear exactly once (no join fan-out) and the cancelled PO is
        // excluded from purchase value but still counted in the lifetime max.
        $this->actingAs($admin)
            ->get(route('admin.reports.suppliers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Suppliers')
                ->has('suppliers.data', 3)
                ->where('suppliers.data.0.id', $inactive->id)
                ->where('suppliers.data.1.id', $idle->id)
                ->where('suppliers.data.2.id', $busy->id)
                ->where('suppliers.data.2.name', $busy->name)
                ->where('suppliers.data.2.purchase_orders_count', 3)
                ->where('suppliers.data.2.open_purchase_orders_count', 1)
                ->where('suppliers.data.2.purchase_value', '200.00')
                ->where('suppliers.data.2.last_ordered_at', fn ($v) => str_contains((string) $v, '2026-03-03'))
                ->where('suppliers.data.1.purchase_orders_count', 0)
                ->where('suppliers.data.1.open_purchase_orders_count', 0)
                ->where('suppliers.data.1.purchase_value', '0.00')
                ->where('suppliers.data.1.last_ordered_at', null)
                ->where('summary.suppliers', 3)
                ->where('summary.active_suppliers', 2)
                ->where('summary.suppliers_with_purchases', 1)
                ->where('summary.purchase_orders', 3)
                ->whereNull('filters.status')
                ->whereNull('filters.search'));
    }

    public function test_status_filter_returns_active_or_inactive_suppliers_with_scoped_summary(): void
    {
        $admin = $this->userWithRole('admin');
        $active = $this->makeSupplier();
        $inactive = $this->makeSupplier(false);
        $draftPo = $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[1, '10.00']], $inactive);

        $this->actingAs($admin)
            ->get(route('admin.reports.suppliers', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 1)
                ->where('suppliers.data.0.id', $inactive->id)
                ->where('summary.suppliers', 1)
                ->where('summary.active_suppliers', 0)
                ->where('summary.suppliers_with_purchases', 1)
                ->where('summary.purchase_orders', 1)
                ->where('filters.status', 'inactive'));

        $this->actingAs($admin)
            ->get(route('admin.reports.suppliers', ['status' => 'active']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 1)
                ->where('suppliers.data.0.id', $active->id)
                ->where('summary.suppliers', 1)
                ->where('summary.active_suppliers', 1)
                ->where('summary.suppliers_with_purchases', 0)
                ->where('summary.purchase_orders', 0));

        $this->assertNotNull($draftPo->id);
    }

    public function test_search_matches_name_contact_phone_or_email(): void
    {
        $admin = $this->userWithRole('admin');
        $findable = Supplier::create([
            'name' => 'Zenith Traders',
            'contact_person' => 'Alice Brown',
            'phone' => '0712345678',
            'email' => 'alice@zenith.test',
            'is_active' => true,
        ]);
        Supplier::create([
            'name' => 'Acme Parts',
            'contact_person' => 'Bob Stone',
            'is_active' => true,
        ]);

        $report = route('admin.reports.suppliers');

        $searches = ['Zenith', 'Alice Brown', '0712345678', 'alice@zenith'];
        foreach ($searches as $search) {
            $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => $search]))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->has('suppliers.data', 1)
                    ->where('suppliers.data.0.id', $findable->id)
                    ->where('summary.suppliers', 1)
                    ->where('filters.search', $search));
        }

        $this->actingAs($admin)->get($report.'?'.http_build_query(['search' => 'no-match-zzz']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 0)
                ->where('summary.suppliers', 0)
                ->where('summary.active_suppliers', 0)
                ->where('summary.suppliers_with_purchases', 0)
                ->where('summary.purchase_orders', 0));
    }

    public function test_summary_respects_the_active_search_filter(): void
    {
        $admin = $this->userWithRole('admin');
        $zenith = Supplier::create(['name' => 'Zenith Traders', 'is_active' => true]);
        Supplier::create(['name' => 'Acme Parts', 'is_active' => true]);
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[2, '30.00']], $zenith);
        $this->makePo($admin, PurchaseOrder::STATUS_DRAFT, [[5, '10.00']], $zenith);

        $this->actingAs($admin)
            ->get(route('admin.reports.suppliers', ['search' => 'Zenith']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 1)
                ->where('summary.suppliers', 1)
                ->where('summary.active_suppliers', 1)
                ->where('summary.suppliers_with_purchases', 1)
                ->where('summary.purchase_orders', 2)
                ->where('suppliers.data.0.purchase_value', '110.00')
                ->where('filters.search', 'Zenith'));
    }

    public function test_pagination_shows_twenty_suppliers_per_page(): void
    {
        $admin = $this->userWithRole('admin');
        $ids = [];
        for ($i = 0; $i < 25; $i++) {
            $ids[] = $this->makeSupplier()->id;
        }
        $newestFirst = array_reverse($ids);
        $report = route('admin.reports.suppliers');

        $this->actingAs($admin)->get($report)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 20)
                ->where('suppliers.current_page', 1)
                ->where('suppliers.per_page', 20)
                ->where('suppliers.total', 25)
                ->where('suppliers.data.0.id', $newestFirst[0])
                ->where('suppliers.data.19.id', $newestFirst[19]));

        $this->actingAs($admin)->get($report.'?'.http_build_query(['page' => 2]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('suppliers.data', 5)
                ->where('suppliers.current_page', 2)
                ->where('suppliers.per_page', 20)
                ->where('suppliers.total', 25)
                ->where('suppliers.data.0.id', $newestFirst[20])
                ->where('suppliers.data.4.id', $newestFirst[24]));
    }

    public function test_empty_supplier_report_returns_zeroed_summary(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get(route('admin.reports.suppliers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Suppliers')
                ->has('suppliers.data', 0)
                ->where('summary.suppliers', 0)
                ->where('summary.active_suppliers', 0)
                ->where('summary.suppliers_with_purchases', 0)
                ->where('summary.purchase_orders', 0));
    }

    // ------------------------------------------------------------------
    // Read-only guarantee: purchase reports never touch stock
    // ------------------------------------------------------------------

    public function test_purchase_reports_create_no_stock_movements_or_quantity_changes(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->makeSupplier();
        $this->makePo($admin, PurchaseOrder::STATUS_APPROVED, [[10, '25.00']], $supplier, ['ordered_at' => '2026-01-05']);
        $this->makePo($admin, PurchaseOrder::STATUS_RECEIVED, [[10, '25.00', 10]], $supplier, ['ordered_at' => '2026-01-06']);

        $movementsBefore = StockMovement::count();
        $quantitiesBefore = DB::table('product_variants')->orderBy('id')->pluck('quantity', 'id');

        foreach ([
            ['admin.reports.purchases', ['status' => 'approved', 'date_from' => '2026-01-01']],
            ['admin.reports.purchases', ['search' => 'Sup-']],
            ['admin.reports.suppliers', ['status' => 'active', 'search' => 'Sup']],
            ['admin.reports.index', []],
        ] as [$routeName, $query]) {
            $this->actingAs($admin)->get(route($routeName, $query))->assertOk();
        }

        $this->assertSame($movementsBefore, StockMovement::count());
        $this->assertEquals(
            $quantitiesBefore,
            DB::table('product_variants')->orderBy('id')->pluck('quantity', 'id')
        );
    }
}
