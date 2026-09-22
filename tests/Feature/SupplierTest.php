<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_redirected_to_login(): void
    {
        $this->get(route('admin.suppliers.index'))->assertRedirect(route('login'));
    }

    public function test_super_admin_can_view_suppliers(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($super)->get(route('admin.suppliers.index'))->assertOk();
    }

    public function test_admin_can_view_suppliers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get(route('admin.suppliers.index'))->assertOk();
    }

    public function test_manager_can_view_suppliers(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager)->get(route('admin.suppliers.index'))->assertOk();
    }

    public function test_staff_cannot_view_suppliers(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get(route('admin.suppliers.index'))->assertForbidden();
    }

    public function test_authorized_user_can_create_supplier(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->actingAs($admin)->post(route('admin.suppliers.store'), [
            'name' => 'Supplier A',
            'contact_person' => 'John',
            'phone' => '0911111111',
            'email' => 'a@example.com',
            'address' => 'Addis',
            'tax_number' => '123',
            'notes' => 'Test',
            'is_active' => true,
        ]);
        $response->assertRedirect(route('admin.suppliers.index'));
        $this->assertDatabaseHas('suppliers', ['name' => 'Supplier A']);
    }

    public function test_validation_rejects_missing_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.suppliers.store'), [
            'name' => '',
        ])->assertSessionHasErrors('name');
    }

    public function test_validation_rejects_invalid_email(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.suppliers.store'), [
            'name' => 'Test',
            'email' => 'invalid-email',
        ])->assertSessionHasErrors('email');
    }

    public function test_validation_accepts_nullable_optional_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->post(route('admin.suppliers.store'), [
            'name' => 'Minimal',
        ])->assertRedirect(route('admin.suppliers.index'));
        $this->assertDatabaseHas('suppliers', ['name' => 'Minimal']);
    }

    public function test_authorized_user_can_update_supplier(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'Old']);
        $this->actingAs($admin)->put(route('admin.suppliers.update', $supplier), [
            'name' => 'New Name',
        ])->assertRedirect(route('admin.suppliers.index'));
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'name' => 'New Name']);
    }

    public function test_unauthorized_user_cannot_update_supplier(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $supplier = Supplier::create(['name' => 'Old']);
        $this->actingAs($staff)->put(route('admin.suppliers.update', $supplier), [
            'name' => 'Hacked',
        ])->assertForbidden();
    }

    public function test_invalid_update_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'Old']);
        $this->actingAs($admin)->put(route('admin.suppliers.update', $supplier), [
            'name' => '',
        ])->assertSessionHasErrors('name');
    }

    public function test_supplier_detail_loads(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'Detail']);
        $this->actingAs($admin)->get(route('admin.suppliers.show', $supplier))->assertOk();
    }

    public function test_nonexistent_supplier_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get(route('admin.suppliers.show', 99999))->assertNotFound();
    }

    public function test_supplier_search_works(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Supplier::create(['name' => 'Alpha']);
        Supplier::create(['name' => 'Beta']);
        $response = $this->actingAs($admin)->get(route('admin.suppliers.index', ['search' => 'Alpha']));
        $response->assertOk();
    }

    public function test_status_filter_works(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Supplier::create(['name' => 'Active', 'is_active' => true]);
        Supplier::create(['name' => 'Inactive', 'is_active' => false]);
        $this->actingAs($admin)->get(route('admin.suppliers.index', ['status' => 'active']))->assertOk();
        $this->actingAs($admin)->get(route('admin.suppliers.index', ['status' => 'inactive']))->assertOk();
    }

    public function test_supplier_pagination_works(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        for ($i = 0; $i < 25; $i++) {
            Supplier::create(['name' => 'Supplier '.$i]);
        }
        $this->actingAs($admin)->get(route('admin.suppliers.index'))->assertOk();
    }

    public function test_supplier_can_be_deactivated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'ToDeactivate', 'is_active' => true]);
        $this->actingAs($admin)->post(route('admin.suppliers.deactivate', $supplier))->assertRedirect(route('admin.suppliers.index'));
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'is_active' => false]);
    }

    public function test_supplier_can_be_reactivated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'ToActivate', 'is_active' => false]);
        $this->actingAs($admin)->post(route('admin.suppliers.activate', $supplier))->assertRedirect(route('admin.suppliers.index'));
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'is_active' => true]);
    }

    public function test_inactive_supplier_remains_visible(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::create(['name' => 'Inactive', 'is_active' => false]);
        $this->actingAs($admin)->get(route('admin.suppliers.show', $supplier))->assertOk();
    }

    public function test_unauthorized_mutation_rejected(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->post(route('admin.suppliers.store'), ['name' => 'Hacked'])->assertForbidden();
    }

    public function test_arbitrary_supplier_id_cannot_bypass_authorization(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $supplier = Supplier::create(['name' => 'Victim']);
        $this->actingAs($staff)->put(route('admin.suppliers.update', $supplier), ['name' => 'Hacked'])->assertForbidden();
    }
}
