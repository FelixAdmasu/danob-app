<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_registration_creates_user_with_role_staff(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertEquals('staff', auth()->user()->role);
    }

    public function test_registration_cannot_specify_admin_role(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $this->assertAuthenticated();
        $this->assertEquals('staff', auth()->user()->role);
    }

    public function test_user_model_is_role_method_works(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $manager = User::factory()->create(['role' => 'manager']);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->assertTrue($admin->isRole('admin'));
        $this->assertTrue($admin->isRole('admin', 'manager', 'staff'));
        $this->assertFalse($admin->isRole('manager'));
        $this->assertFalse($manager->isRole('admin'));
        $this->assertTrue($staff->isRole('staff'));
        $this->assertFalse($staff->isRole('admin'));
    }

    public function test_user_has_admin_method(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($staff->isAdmin());
    }

    public function test_user_has_manager_method(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->assertTrue($manager->isManager());
        $this->assertFalse($staff->isManager());
    }

    public function test_user_has_staff_method(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($staff->isStaff());
        $this->assertFalse($admin->isStaff());
    }

    public function test_staff_cannot_escalate_role_through_profile_update(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->put(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'admin',
        ]);

        $this->assertNotEquals('admin', $staff->fresh()->role);
        $this->assertEquals('staff', $staff->fresh()->role);
    }

    public function test_role_middleware_allows_access_when_no_roles_specified(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff);

        $response = $this->get(route('home'));
        $response->assertOk();
    }
}
