<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_user_management(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('users.data')->has('roles'));
    }

    public function test_manager_and_staff_cannot_manage_users(): void
    {
        foreach (['manager', 'staff'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user)
                ->get(route('admin.users.index'))
                ->assertForbidden();
        }
    }

    public function test_admin_can_create_a_staff_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'New Sales User',
                'email' => 'new.sales@example.com',
                'role' => 'staff',
                'password' => 'StrongPassword123!',
                'password_confirmation' => 'StrongPassword123!',
            ])
            ->assertRedirect(route('admin.users.index'));

        $created = User::where('email', 'new.sales@example.com')->firstOrFail();
        $this->assertSame('staff', $created->role);
        $this->assertTrue($created->email_verified_at !== null);
        $this->assertTrue(Hash::check('StrongPassword123!', $created->password));
    }

    public function test_admin_cannot_grant_super_admin_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Unsafe User',
                'email' => 'unsafe@example.com',
                'role' => 'super_admin',
                'password' => 'StrongPassword123!',
                'password_confirmation' => 'StrongPassword123!',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'unsafe@example.com']);
    }

    public function test_super_admin_can_change_a_users_role_and_password(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($superAdmin)
            ->put(route('admin.users.update', $staff), [
                'name' => 'Promoted Manager',
                'email' => $staff->email,
                'role' => 'manager',
                'password' => 'AnotherStrongPassword123!',
                'password_confirmation' => 'AnotherStrongPassword123!',
            ])
            ->assertRedirect(route('admin.users.index'));

        $staff->refresh();
        $this->assertSame('manager', $staff->role);
        $this->assertTrue(Hash::check('AnotherStrongPassword123!', $staff->password));
    }
}
