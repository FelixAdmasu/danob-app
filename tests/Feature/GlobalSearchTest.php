<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Phase 27 — global search.
 *
 * Every test verifies actual returned records (labels, URLs, group keys),
 * never just an HTTP 200: authorization per role, per-entity coverage,
 * bounded results, empty/malformed input and the exact normalized field set
 * that leaves the server.
 */
class GlobalSearchTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function category(string $name): Category
    {
        return Category::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'is_active' => true,
        ]);
    }

    private function brand(string $name): Brand
    {
        return Brand::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'is_active' => true,
        ]);
    }

    private function product(string $name, ?Category $category = null): Product
    {
        return Product::create([
            'category_id' => ($category ?? $this->category('General'))->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'description' => 'Description',
            'status' => 'active',
        ]);
    }

    private function customer(string $company, array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'type' => 'business',
            'company_name' => $company,
            'contact_name' => 'Contact Person',
            'is_active' => true,
        ], $overrides));
    }

    private function order(Customer $customer, string $reference): Order
    {
        return Order::create([
            'customer_id' => $customer->id,
            'reference_number' => $reference,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => '0.00',
            'total' => '0.00',
            'ordered_at' => now()->toDateString(),
        ]);
    }

    private function supplier(string $name): Supplier
    {
        return Supplier::create(['name' => $name, 'is_active' => true]);
    }

    private function purchaseOrder(Supplier $supplier, string $poNumber): PurchaseOrder
    {
        return PurchaseOrder::create([
            'po_number' => $poNumber,
            'supplier_id' => $supplier->id,
            'created_by' => $this->userWithRole('admin')->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'ordered_at' => now()->toDateString(),
        ]);
    }

    private function branch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => 'Address',
            'city' => 'Addis Ababa',
            'is_active' => true,
        ]);
    }

    /** @return array<int, string> */
    private function groupKeys(array $data): array
    {
        return array_column($data['groups'], 'key');
    }

    /** @return array<int, array<string, mixed>> */
    private function items(array $data, string $key): array
    {
        foreach ($data['groups'] as $group) {
            if ($group['key'] === $key) {
                return $group['items'];
            }
        }

        return [];
    }

    /**
     * One record per entity, all matching the same term, so a single request
     * proves coverage (or proves what staff must NOT receive).
     */
    private function seedEveryEntity(string $term): array
    {
        $customer = $this->customer(ucfirst($term).' Traders');
        $order = $this->order($customer, 'ORD-'.strtoupper($term).'-1');
        $product = $this->product(ucfirst($term).' Cake');
        $supplier = $this->supplier(ucfirst($term).' Supplies');
        // Deliberately neutral PO supplier so the supplier group stays a
        // single, unambiguous match for the seed term.
        $purchaseOrder = $this->purchaseOrder($this->supplier('Neutral Vendor'), 'PO-'.strtoupper($term).'-1');
        $branch = $this->branch(ucfirst($term).' Branch');
        $category = $this->category(ucfirst($term).' Category');
        $brand = $this->brand(ucfirst($term).' Brand');

        return compact('customer', 'order', 'product', 'supplier', 'purchaseOrder', 'branch', 'category', 'brand');
    }

    // ------------------------------------------------------------------
    // Authorization
    // ------------------------------------------------------------------

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('admin.search', ['search' => 'cake']))->assertRedirect(route('login'));
    }

    public function test_staff_receive_only_sales_facing_groups(): void
    {
        $records = $this->seedEveryEntity('zephyr');

        $response = $this->actingAs($this->userWithRole('staff'))
            ->getJson(route('admin.search', ['search' => 'zephyr']));

        $response->assertOk();
        $data = $response->json();

        // Staff can open orders/customers but none of the restricted list
        // pages — the payload mirrors exactly that authorization.
        $this->assertSame(['customers', 'orders'], $this->groupKeys($data));
        $this->assertSame(
            route('admin.customers.show', $records['customer']),
            $this->items($data, 'customers')[0]['url'] ?? null,
        );
        $this->assertSame(
            route('admin.orders.show', $records['order']),
            $this->items($data, 'orders')[0]['url'] ?? null,
        );
    }

    public function test_admin_receive_every_entity_group(): void
    {
        $records = $this->seedEveryEntity('zephyr');

        $response = $this->actingAs($this->userWithRole('admin'))
            ->getJson(route('admin.search', ['search' => 'zephyr']));

        $response->assertOk();
        $data = $response->json();

        $this->assertSame(
            ['products', 'customers', 'orders', 'purchase_orders', 'suppliers', 'branches', 'categories', 'brands'],
            $this->groupKeys($data),
        );
        $this->assertSame(route('admin.products.show', $records['product']), $this->items($data, 'products')[0]['url']);
        $this->assertSame(route('admin.purchase-orders.show', $records['purchaseOrder']), $this->items($data, 'purchase_orders')[0]['url']);
        $this->assertSame(route('admin.suppliers.show', $records['supplier']), $this->items($data, 'suppliers')[0]['url']);
        $this->assertSame(route('admin.branches.edit', $records['branch']), $this->items($data, 'branches')[0]['url']);
        $this->assertSame(route('admin.categories.edit', $records['category']), $this->items($data, 'categories')[0]['url']);
        $this->assertSame(route('admin.brands.edit', $records['brand']), $this->items($data, 'brands')[0]['url']);
    }

    public function test_manager_receive_catalog_and_purchasing_groups(): void
    {
        $this->seedEveryEntity('zephyr');

        $response = $this->actingAs($this->userWithRole('manager'))
            ->getJson(route('admin.search', ['search' => 'zephyr']));

        $response->assertOk();
        $this->assertSame(
            ['products', 'customers', 'orders', 'purchase_orders', 'suppliers', 'branches', 'categories', 'brands'],
            $this->groupKeys($response->json()),
        );
    }

    // ------------------------------------------------------------------
    // Matching behaviour per entity
    // ------------------------------------------------------------------

    public function test_product_search_matches_name_slug_and_variant_fields(): void
    {
        $admin = $this->userWithRole('admin');
        $byName = $this->product('Chocolate Cake');
        $bySlug = $this->product('Pineapple Tart');
        $bySlug->update(['slug' => 'snack-box-special']);
        $withVariant = $this->product('Gift Bundle');
        $withVariant->variants()->create(['name' => 'Family Size', 'sku' => 'FAM-BOX-001', 'is_active' => true]);

        $cases = [
            'chocolate' => $byName,
            'snack-box' => $bySlug,
            'family size' => $withVariant,
            'fam-box-001' => $withVariant,
        ];

        foreach ($cases as $term => $expected) {
            $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => $term]))->json();
            $urls = array_column($this->items($data, 'products'), 'url');
            $this->assertContains(route('admin.products.show', $expected), $urls, "Term [{$term}] should find the product.");
        }
    }

    public function test_customer_search_matches_company_contact_email_and_phone(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->customer('Sunrise Bakery', [
            'contact_name' => 'Marta Alemu',
            'email' => 'marta@sunrise.test',
            'phone' => '+251911000222',
        ]);

        foreach (['sunrise', 'marta', 'marta@sunrise', '911000'] as $term) {
            $data = $this->actingAs($staff)->getJson(route('admin.search', ['search' => $term]))->json();
            $urls = array_column($this->items($data, 'customers'), 'url');
            $this->assertContains(route('admin.customers.show', $customer), $urls, "Term [{$term}] should find the customer.");
        }
    }

    public function test_order_search_matches_reference_and_customer_name(): void
    {
        $staff = $this->userWithRole('staff');
        $customer = $this->customer('Blue Nile Trading');
        $order = $this->order($customer, 'ORD-2026-000999');
        $this->order($this->customer('Other Company'), 'ORD-2026-000111');

        foreach (['000999', 'blue nile'] as $term) {
            $data = $this->actingAs($staff)->getJson(route('admin.search', ['search' => $term]))->json();
            $urls = array_column($this->items($data, 'orders'), 'url');
            $this->assertContains(route('admin.orders.show', $order), $urls, "Term [{$term}] should find the order.");
            $this->assertCount(1, $urls, "Term [{$term}] must not leak unrelated orders.");
        }
    }

    public function test_purchase_order_search_matches_po_number_and_supplier_name(): void
    {
        $admin = $this->userWithRole('admin');
        $purchaseOrder = $this->purchaseOrder($this->supplier('Horizon Foods'), 'PO-2026-000456');

        foreach (['000456', 'horizon'] as $term) {
            $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => $term]))->json();
            $urls = array_column($this->items($data, 'purchase_orders'), 'url');
            $this->assertContains(route('admin.purchase-orders.show', $purchaseOrder), $urls, "Term [{$term}] should find the PO.");
        }
    }

    public function test_supplier_branch_category_and_brand_search(): void
    {
        $admin = $this->userWithRole('admin');
        $supplier = $this->supplier('Kefa Distributors');
        $branch = $this->branch('Bole Branch');
        $category = $this->category('Beverages');
        $brand = $this->brand('Highland Roast');

        $cases = [
            ['suppliers', 'kefa', route('admin.suppliers.show', $supplier)],
            ['branches', 'bole', route('admin.branches.edit', $branch)],
            ['categories', 'beverages', route('admin.categories.edit', $category)],
            ['brands', 'highland', route('admin.brands.edit', $brand)],
        ];

        foreach ($cases as [$key, $term, $expectedUrl]) {
            $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => $term]))->json();
            $urls = array_column($this->items($data, $key), 'url');
            $this->assertContains($expectedUrl, $urls, "Term [{$term}] should find the {$key} record.");
        }
    }

    public function test_search_is_partial_and_case_tolerant_for_mixed_input(): void
    {
        $admin = $this->userWithRole('admin');
        $this->product('Chocolate Cake');

        $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => 'ChOcOlAtE']))->json();

        $this->assertCount(1, $this->items($data, 'products'));
    }

    // ------------------------------------------------------------------
    // Bounds, empties, malformed input
    // ------------------------------------------------------------------

    public function test_results_are_bounded_to_five_per_group(): void
    {
        $admin = $this->userWithRole('admin');
        foreach (range(1, 7) as $i) {
            $this->product("Bounding Cake {$i}");
        }

        $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => 'bounding']))->json();

        $this->assertCount(5, $this->items($data, 'products'));
    }

    public function test_empty_and_unmatched_searches_return_no_groups(): void
    {
        $admin = $this->userWithRole('admin');
        $this->seedEveryEntity('populated');

        foreach (['', '   ', 'no-such-record-anywhere'] as $term) {
            $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => $term]))->json();
            $this->assertSame([], $data['groups'], "Term [{$term}] must return no groups.");
            $this->assertSame([], $this->groupKeys($data));
        }
    }

    public function test_oversized_search_term_is_rejected(): void
    {
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->getJson(route('admin.search', ['search' => str_repeat('a', 101)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('search');
    }

    // ------------------------------------------------------------------
    // Exposure surface
    // ------------------------------------------------------------------

    public function test_result_items_expose_only_safe_identifying_fields(): void
    {
        $admin = $this->userWithRole('admin');
        $product = $this->product('Exposed Cake');
        $product->variants()->create(['name' => 'Hidden Detail', 'sku' => 'SENS-1', 'is_active' => true]);

        $data = $this->actingAs($admin)->getJson(route('admin.search', ['search' => 'exposed']))->json();
        $item = $this->items($data, 'products')[0];

        // Exactly the normalized shape — no ids, notes, stock, costs or any
        // other internal field can ride along.
        $this->assertSame(['type', 'label', 'subtitle', 'status', 'url'], array_keys($item));
        $this->assertSame('product', $item['type']);
        $this->assertSame('Exposed Cake', $item['label']);
        $this->assertSame('active', $item['status']);
        $this->assertSame(route('admin.products.show', $product), $item['url']);
    }
}
