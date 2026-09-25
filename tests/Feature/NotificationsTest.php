<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\AlertNotification;
use App\Services\AlertService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Phase 28 — notification centre: persistence, read state, ownership,
 * bounded payloads and recipient rules.
 *
 * Every test checks real rows and real endpoint responses (never just an
 * HTTP 200): the exact stored payload, who receives it, who can see or
 * mutate it, and that counts are computed server-side.
 */
class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    /**
     * Persist one alert through the real notification pipeline (database
     * channel, uuid id, read_at null).
     *
     * @param  array<string, mixed>  $overrides
     */
    private function alert(User $user, array $overrides = []): void
    {
        $user->notify(new AlertNotification(
            $overrides['type'] ?? 'order_confirmed',
            $overrides['severity'] ?? 'success',
            $overrides['title'] ?? 'Order confirmed',
            $overrides['message'] ?? 'ORD-2026-000001 was confirmed and stock was deducted.',
            $overrides['url'] ?? '/admin/orders/1',
        ));
    }

    /**
     * Seed $count notifications with strictly increasing timestamps, so the
     * "newest first, bounded" assertions are deterministic.
     */
    private function seedAlerts(User $user, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            $this->alert($user, ['title' => "Alert {$i}", 'message' => "Message {$i}"]);

            $row = $user->notifications()->get()->first(
                fn ($notification) => ($notification->data['title'] ?? null) === "Alert {$i}"
            );
            $row->created_at = now()->subMinutes($count - $i + 1);
            $row->save();
        }
    }

    // ------------------------------------------------------------------
    // Persistence / payload
    // ------------------------------------------------------------------

    public function test_alert_is_persisted_for_the_recipient_with_a_structured_payload(): void
    {
        $admin = $this->userWithRole('admin');
        $staff = $this->userWithRole('staff');

        $this->alert($admin, [
            'type' => 'low_stock',
            'severity' => 'warning',
            'title' => 'Low stock',
            'message' => 'Chocolate Cake — Family Size has 3 left.',
            'url' => '/admin/products/7',
        ]);

        $this->assertDatabaseCount('notifications', 1);
        $this->assertSame(0, $staff->notifications()->count());

        $row = $admin->notifications()->firstOrFail();

        $this->assertSame(AlertNotification::class, $row->type);
        $this->assertNull($row->read_at);
        $this->assertSame('low_stock', $row->data['type']);
        $this->assertSame('warning', $row->data['severity']);
        $this->assertSame('Low stock', $row->data['title']);
        $this->assertSame('Chocolate Cake — Family Size has 3 left.', $row->data['message']);
        $this->assertSame('/admin/products/7', $row->data['url']);
    }

    public function test_unknown_severity_falls_back_to_the_neutral_tone(): void
    {
        $admin = $this->userWithRole('admin');

        $this->alert($admin, ['severity' => 'made-up']);

        $this->assertSame('info', $admin->notifications()->firstOrFail()->data['severity']);
    }

    // ------------------------------------------------------------------
    // List / unread count (server-side, bounded)
    // ------------------------------------------------------------------

    public function test_index_returns_a_bounded_newest_first_list_of_display_fields_only(): void
    {
        $user = $this->userWithRole('manager');
        $this->seedAlerts($user, 25);

        $response = $this->actingAs($user)->get(route('admin.notifications.index'));

        $response->assertOk();
        $this->assertSame(25, $response->json('unread_count'));
        $this->assertCount(20, $response->json('notifications'));

        $first = $response->json('notifications.0');
        $this->assertSame('Alert 25', $first['title']);
        $this->assertFalse($first['read']);
        $this->assertIsString($first['created_at_diff']);

        // Exactly the normalized field set — nothing else leaves the server.
        $this->assertSame(
            ['id', 'type', 'severity', 'title', 'message', 'url', 'read', 'created_at_diff'],
            array_keys($first),
        );

        // The five oldest are trimmed rather than shipped.
        $titles = array_column($response->json('notifications'), 'title');
        $this->assertNotContains('Alert 1', $titles);
        $this->assertContains('Alert 6', $titles);
    }

    public function test_index_returns_an_empty_bounded_state_for_a_user_with_no_notifications(): void
    {
        $user = $this->userWithRole('staff');

        $response = $this->actingAs($user)->get(route('admin.notifications.index'));

        $response->assertOk();
        $this->assertSame(0, $response->json('unread_count'));
        $this->assertSame([], $response->json('notifications'));
    }

    public function test_the_unread_count_is_shared_on_admin_pages_not_the_whole_list(): void
    {
        $user = $this->userWithRole('staff');
        $this->alert($user);
        $this->alert($user);

        $this->actingAs($user)->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('notifications.unread_count', 2)
                ->missing('notifications.notifications'));
    }

    public function test_guests_see_a_zero_unread_count_and_are_redirected_from_the_endpoints(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('notifications.unread_count', 0));

        $this->get(route('admin.notifications.index'))->assertRedirect(route('login'));
        $this->post(route('admin.notifications.read-all'))->assertRedirect(route('login'));
        $this->post(route('admin.notifications.read', '00000000-0000-0000-0000-000000000000'))
            ->assertRedirect(route('login'));
    }

    // ------------------------------------------------------------------
    // Read state
    // ------------------------------------------------------------------

    public function test_marking_one_notification_read_updates_read_state_and_unread_count(): void
    {
        $user = $this->userWithRole('admin');
        $this->alert($user);
        $this->alert($user, ['title' => 'Order cancelled']);

        $target = $user->notifications()->firstOrFail();

        $response = $this->actingAs($user)->post(route('admin.notifications.read', $target->id));

        $response->assertOk();
        $this->assertSame(1, $response->json('unread_count'));
        $this->assertNotNull($target->fresh()->read_at);
        $readAt = $target->fresh()->read_at->toDateTimeString();

        $item = collect($response->json('notifications'))->firstWhere('id', $target->id);
        $this->assertTrue($item['read']);

        // A second, already-read request is a no-op, not an error.
        $again = $this->actingAs($user)->post(route('admin.notifications.read', $target->id));
        $again->assertOk();
        $this->assertSame(1, $again->json('unread_count'));
        $this->assertSame($readAt, $target->fresh()->read_at->toDateTimeString());
    }

    public function test_mark_all_read_clears_the_callers_unread_count(): void
    {
        $user = $this->userWithRole('manager');
        $this->seedAlerts($user, 3);

        $response = $this->actingAs($user)->post(route('admin.notifications.read-all'));

        $response->assertOk();
        $this->assertSame(0, $response->json('unread_count'));
        $this->assertSame(
            0,
            $user->notifications()->unread()->count(),
            'every notification of the caller should now be read',
        );

        foreach ($user->notifications()->get() as $notification) {
            $this->assertNotNull($notification->read_at);
        }
    }

    // ------------------------------------------------------------------
    // Ownership / security
    // ------------------------------------------------------------------

    public function test_a_user_cannot_read_another_users_notification(): void
    {
        $owner = $this->userWithRole('admin');
        $stranger = $this->userWithRole('staff');

        $this->alert($owner);
        $foreign = $owner->notifications()->firstOrFail();

        // A foreign id is a 404 (indistinguishable from a non-existent id),
        // and it leaves the owner's row untouched.
        $this->actingAs($stranger)
            ->post(route('admin.notifications.read', $foreign->id))
            ->assertNotFound();

        $this->assertNull($foreign->fresh()->read_at);
        $this->assertSame(0, $stranger->notifications()->count());
    }

    public function test_index_and_read_all_never_expose_or_touch_another_users_notifications(): void
    {
        $owner = $this->userWithRole('admin');
        $stranger = $this->userWithRole('staff');

        $this->alert($owner, ['title' => 'Owner only']);
        $this->alert($stranger, ['title' => 'Stranger only']);

        $list = $this->actingAs($stranger)->get(route('admin.notifications.index'));
        $list->assertOk();
        $this->assertSame(1, $list->json('unread_count'));
        $this->assertSame(
            ['Stranger only'],
            array_column($list->json('notifications'), 'title'),
            'the caller must only ever see their own notifications',
        );

        $this->actingAs($stranger)->post(route('admin.notifications.read-all'))->assertOk();

        $this->assertSame(1, $owner->notifications()->unread()->count(), 'owner rows must stay unread');
        $this->assertSame(0, $stranger->notifications()->unread()->count());
    }

    // ------------------------------------------------------------------
    // Recipient rules (mirror the route groups in routes/web.php)
    // ------------------------------------------------------------------

    public function test_inventory_alerts_reach_inventory_roles_and_never_staff(): void
    {
        $admin = $this->userWithRole('admin');
        $manager = $this->userWithRole('manager');
        $super = $this->userWithRole('super_admin');
        $staff = $this->userWithRole('staff');

        app(AlertService::class)->dispatch(
            'out_of_stock',
            'critical',
            'Out of stock',
            'Chocolate Cake — Family Size is out of stock.',
            '/admin/products/7',
            AlertService::INVENTORY_ROLES,
        );

        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame(1, $manager->notifications()->count());
        $this->assertSame(1, $super->notifications()->count());
        $this->assertSame(0, $staff->notifications()->count());
    }

    public function test_sales_alerts_reach_staff_while_purchasing_alerts_do_not(): void
    {
        $admin = $this->userWithRole('admin');
        $staff = $this->userWithRole('staff');

        app(AlertService::class)->dispatch(
            'order_delivered',
            'success',
            'Order delivered',
            'ORD-2026-000001 was delivered.',
            '/admin/orders/1',
            AlertService::SALES_ROLES,
        );

        app(AlertService::class)->dispatch(
            'purchase_order_received',
            'success',
            'PO received',
            'PO-2026-000001 was fully received (GRN-2026-000001).',
            '/admin/purchase-orders/1',
            AlertService::PURCHASING_ROLES,
        );

        $this->assertSame(2, $admin->notifications()->count());
        $this->assertSame(1, $staff->notifications()->count());
        $this->assertSame('order_delivered', $staff->notifications()->firstOrFail()->data['type']);
    }
}
