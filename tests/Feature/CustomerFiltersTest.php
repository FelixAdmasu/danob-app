<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Phase 27 — customer list filtering (type / status), matching the same
 * contract as the other list pages: database-side constraints, validated
 * vocabulary, state echoed back to the UI and preserved through pagination.
 */
class CustomerFiltersTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function customer(string $company, array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'type' => 'business',
            'company_name' => $company,
            'contact_name' => 'Contact for '.$company,
            'is_active' => true,
        ], $overrides));
    }

    /** @return array<int, string> */
    private function names(TestResponse $response): array
    {
        return array_map(
            fn (array $row): string => (string) ($row['company_name'] ?? $row['contact_name']),
            $response->inertiaProps('customers.data'),
        );
    }

    public function test_customer_index_filters_by_type(): void
    {
        $admin = $this->admin();
        $this->customer('Bakery One', ['type' => 'business']);
        $this->customer('Bakery Two', ['type' => 'business']);
        $this->customer('Home Client', ['type' => 'home_business']);

        $response = $this->actingAs($admin)->get(route('admin.customers.index', ['type' => 'business']));

        $response->assertOk();
        $this->assertEqualsCanonicalizing(['Bakery One', 'Bakery Two'], $this->names($response));
        $this->assertSame('business', $response->inertiaProps('filters.type'));
    }

    public function test_customer_index_filters_by_status(): void
    {
        $admin = $this->admin();
        $this->customer('Active Co');
        $this->customer('Dormant Co', ['is_active' => false]);

        $inactive = $this->actingAs($admin)->get(route('admin.customers.index', ['status' => 'inactive']));
        $inactive->assertOk();
        $this->assertSame(['Dormant Co'], $this->names($inactive));
        $this->assertSame('inactive', $inactive->inertiaProps('filters.status'));

        $active = $this->actingAs($admin)->get(route('admin.customers.index', ['status' => 'active']));
        $active->assertOk();
        $this->assertSame(['Active Co'], $this->names($active));
    }

    public function test_customer_index_combines_search_type_and_status(): void
    {
        $admin = $this->admin();
        $this->customer('Sunrise Bakery', ['type' => 'business']);
        $this->customer('Sunrise Dormant', ['type' => 'business', 'is_active' => false]);
        $this->customer('Sunrise Individual', ['type' => 'individual']);

        // search + type
        $response = $this->actingAs($admin)->get(route('admin.customers.index', ['search' => 'Sunrise', 'type' => 'business']));
        $this->assertEqualsCanonicalizing(['Sunrise Bakery', 'Sunrise Dormant'], $this->names($response));

        // search + type + status
        $response = $this->actingAs($admin)->get(route('admin.customers.index', ['search' => 'Sunrise', 'type' => 'business', 'status' => 'inactive']));
        $this->assertSame(['Sunrise Dormant'], $this->names($response));

        // filters that legitimately match nothing
        $response = $this->actingAs($admin)->get(route('admin.customers.index', ['search' => 'Sunrise', 'type' => 'individual', 'status' => 'inactive']));
        $response->assertOk();
        $this->assertSame([], $this->names($response));
    }

    public function test_customer_index_rejects_invalid_filter_values(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.customers.index', ['type' => 'enterprise']))
            ->assertSessionHasErrors('type');
        $this->actingAs($admin)->get(route('admin.customers.index', ['status' => 'archived']))
            ->assertSessionHasErrors('status');
    }

    public function test_customer_index_filter_state_survives_pagination(): void
    {
        $admin = $this->admin();
        foreach (range(1, 21) as $i) {
            $this->customer("Bulk Customer {$i}", ['type' => 'business']);
        }
        $this->customer('Outsider', ['type' => 'individual']);

        $response = $this->actingAs($admin)->get(route('admin.customers.index', ['type' => 'business']));
        $this->assertCount(20, $response->inertiaProps('customers.data'));

        $next = $response->inertiaProps('customers.next_page_url');
        $this->assertIsString($next);
        $this->assertStringContainsString('type=business', $next);

        $pageTwo = $this->get($next);
        $pageTwo->assertOk();
        $rows = $pageTwo->inertiaProps('customers.data');
        $this->assertCount(1, $rows);
        // Every row inside the filtered set is a business customer — the
        // individual "Outsider" can never reach either page.
        $this->assertStringStartsWith('Bulk', (string) $rows[0]['company_name']);
        $this->assertSame('business', $pageTwo->inertiaProps('filters.type'));
    }

    public function test_staff_can_use_customer_filters(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->customer('Staff Visible', ['type' => 'business']);

        $response = $this->actingAs($staff)->get(route('admin.customers.index', ['type' => 'business', 'status' => 'active']));

        $response->assertOk();
        $this->assertSame(['Staff Visible'], $this->names($response));
    }
}
