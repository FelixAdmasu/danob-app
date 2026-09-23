<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsIndexTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    // ── Access (§34/§41) ─────────────────────────────────────────────

    public function test_guest_is_redirected_from_reports_index(): void
    {
        $this->get(route('admin.reports.index'))->assertRedirect(route('login'));
    }

    public function test_staff_sees_only_sales_facing_report_cards(): void
    {
        $this->actingAs($this->userWithRole('staff'))
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                // Staff can open the sales-facing reports only, so the two
                // stricter groups are never rendered for them.
                ->has('groups', 1)
                ->where('groups.0.name', 'Sales')
                ->has('groups.0.reports', 3)
                ->where('groups.0.reports.0.title', 'Sales')
                ->where('groups.0.reports.0.href', route('admin.reports.sales'))
                ->where('groups.0.reports.1.title', 'Returns')
                ->where('groups.0.reports.1.href', route('admin.reports.returns'))
                ->where('groups.0.reports.2.title', 'Customers')
                ->where('groups.0.reports.2.href', route('admin.reports.customers')));
    }

    public function test_manager_sees_every_report_group(): void
    {
        $this->assertIndexGroupsFor($this->userWithRole('manager'));
    }

    public function test_admin_sees_every_report_group(): void
    {
        $this->assertIndexGroupsFor($this->userWithRole('admin'));
    }

    public function test_super_admin_sees_every_report_group(): void
    {
        $this->assertIndexGroupsFor($this->userWithRole('super_admin'));
    }

    private function assertIndexGroupsFor(User $user): void
    {
        $this->actingAs($user)
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->has('groups', 3)
                ->where('groups.0.name', 'Inventory')
                ->where('groups.1.name', 'Purchasing')
                ->where('groups.2.name', 'Sales')
                ->has('groups.0.reports', 2)
                ->has('groups.1.reports', 2)
                ->has('groups.2.reports', 3)
                // Every card links to a real named route (no fake hrefs).
                ->where('groups.0.reports.0.title', 'Inventory Movements')
                ->where('groups.0.reports.0.href', route('admin.reports.inventory-movements'))
                ->where('groups.0.reports.1.title', 'Low Stock')
                ->where('groups.0.reports.1.href', route('admin.reports.low-stock'))
                ->where('groups.1.reports.0.title', 'Purchases')
                ->where('groups.1.reports.0.href', route('admin.reports.purchases'))
                ->where('groups.1.reports.1.title', 'Suppliers')
                ->where('groups.1.reports.1.href', route('admin.reports.suppliers'))
                ->where('groups.2.reports.0.title', 'Sales')
                ->where('groups.2.reports.0.href', route('admin.reports.sales'))
                ->where('groups.2.reports.1.title', 'Returns')
                ->where('groups.2.reports.1.href', route('admin.reports.returns'))
                ->where('groups.2.reports.2.title', 'Customers')
                ->where('groups.2.reports.2.href', route('admin.reports.customers')));
    }
}
