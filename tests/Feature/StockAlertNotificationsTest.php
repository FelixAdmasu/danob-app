<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Phase 28 — inventory alerts.
 *
 * Every case goes through the production inventory authority
 * (InventoryService -> ProductVariant::stockStatus()) and asserts real
 * transitions: one alert when a variant enters low/out of stock, silence
 * while it stays there, a fresh alert after a restock dips again, nothing
 * for a page load, and nothing at all when the transaction rolls back.
 */
class StockAlertNotificationsTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    private function makeVariant(int $quantity, ?int $threshold): ProductVariant
    {
        $category = Category::create([
            'name' => 'Cat',
            'slug' => 'cat-'.uniqid(),
            'is_active' => true,
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Chocolate Cake',
            'slug' => 'chocolate-cake-'.uniqid(),
            'description' => 'D',
            'status' => 'active',
        ]);

        return $product->variants()->create([
            'name' => 'Family Size',
            'quantity' => $quantity,
            'low_stock_threshold' => $threshold,
            'is_active' => true,
        ]);
    }

    private function inventory(): InventoryService
    {
        return app(InventoryService::class);
    }

    private function sell(ProductVariant $variant, int $quantity): void
    {
        $this->inventory()->decrease($variant, $quantity, StockMovement::TYPE_SALE, 'Sale', null, null, null, null);
    }

    private function titlesOf(User $user): array
    {
        return $user->notifications()->get()
            ->map(fn ($notification) => $notification->data['type'] ?? null)
            ->all();
    }

    // ------------------------------------------------------------------
    // Transitions
    // ------------------------------------------------------------------

    public function test_entering_low_stock_creates_one_alert_for_inventory_roles_only(): void
    {
        $admin = $this->userWithRole('admin');
        $manager = $this->userWithRole('manager');
        $staff = $this->userWithRole('staff');

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10); // 20 -> 10, threshold 10 => low_stock

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());
        $this->assertSame(['low_stock'], $this->titlesOf($admin));
        $this->assertSame(['low_stock'], $this->titlesOf($manager));
        $this->assertSame([], $this->titlesOf($staff), 'staff have no inventory access and get no stock alert');

        $row = $admin->notifications()->firstOrFail();
        $this->assertSame('warning', $row->data['severity']);
        $this->assertSame('Low stock', $row->data['title']);
        $this->assertStringContainsString('Chocolate Cake — Family Size', $row->data['message']);
        $this->assertStringContainsString('threshold of 10', $row->data['message']);
        $this->assertSame(
            route('admin.products.show', $variant->product_id),
            $row->data['url'],
            'the link must point at the existing product page',
        );

        // The movement itself is unchanged: one sale movement, same quantity.
        $this->assertSame(1, StockMovement::count());
        $this->assertSame(10, $variant->fresh()->quantity);
    }

    public function test_staying_low_does_not_duplicate_the_alert(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(20, 10);

        $this->sell($variant, 10); // 20 -> 10: low
        $this->sell($variant, 1);  // 10 -> 9: still low

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());
        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame(2, StockMovement::count());
    }

    public function test_going_out_of_stock_adds_the_out_of_stock_alert(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(20, 10);

        $this->sell($variant, 10); // -> low
        $this->sell($variant, 10); // -> out

        $this->assertSame('out_of_stock', $variant->fresh()->stockStatus());
        $this->assertEqualsCanonicalizing(['low_stock', 'out_of_stock'], $this->titlesOf($admin));

        $out = $admin->notifications()->get()
            ->first(fn ($notification) => ($notification->data['type'] ?? null) === 'out_of_stock');
        $this->assertSame('critical', $out->data['severity']);
        $this->assertSame('Out of stock', $out->data['title']);
        $this->assertStringContainsString('is out of stock', $out->data['message']);
    }

    public function test_out_of_stock_cannot_repeat_and_a_failed_movement_creates_nothing(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(1, 10);

        $this->sell($variant, 1); // -> out
        $this->assertSame(['out_of_stock'], $this->titlesOf($admin));

        // Stock cannot go below zero: the movement is rejected, the variant
        // stays out of stock, and no second alert appears.
        try {
            $this->sell($variant, 1);
            $this->fail('an out-of-stock variant must reject a sale');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('Insufficient stock', $exception->getMessage());
        }

        $this->assertSame('out_of_stock', $variant->fresh()->stockStatus());
        $this->assertSame(['out_of_stock'], $this->titlesOf($admin));
        $this->assertSame(1, StockMovement::count());
    }

    public function test_restocking_rearms_the_alert_for_a_later_dip(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(20, 10);

        $this->sell($variant, 10);                                  // -> low (alert 1)
        $this->inventory()->increase($variant, 20, StockMovement::TYPE_PURCHASE, 'Restock', null, null, null, null);
        $this->assertSame('in_stock', $variant->fresh()->stockStatus());
        $this->assertSame(1, $admin->notifications()->count(), 'restocking is not an alert');

        $this->sell($variant, 21); // 30 -> 9: dips again (alert 2)

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());
        $this->assertSame(['low_stock', 'low_stock'], $this->titlesOf($admin));
    }

    public function test_opening_stock_and_adjustments_alert_through_the_same_transition_rule(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(0, 10); // already below threshold, but no event yet

        $this->assertSame(0, $admin->notifications()->count());

        $this->inventory()->openingBalance($variant, 4, $admin->id);   // out -> low (alert 1)
        $this->inventory()->adjustTo($variant, 50, 'Count correction', $admin->id); // low -> in (no alert)
        $this->inventory()->adjustTo($variant, 5, 'Count correction', $admin->id);  // in -> low (alert 2)

        $this->assertSame(['low_stock', 'low_stock'], $this->titlesOf($admin));
        $this->assertSame(5, $variant->fresh()->quantity);
    }

    // ------------------------------------------------------------------
    // Duplicate prevention on read paths
    // ------------------------------------------------------------------

    public function test_viewing_a_low_stock_page_never_creates_alerts(): void
    {
        $manager = $this->userWithRole('manager');
        $admin = $this->userWithRole('admin');

        // A variant that is simply stored below its threshold: existing
        // state, not a transition.
        $this->makeVariant(3, 10);

        $this->actingAs($manager)->get(route('admin.inventory.low-stock'))->assertOk();
        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->actingAs($admin)->get(route('admin.products.index'))->assertOk();

        $this->assertSame(0, $manager->notifications()->count());
        $this->assertSame(0, $admin->notifications()->count());
    }

    // ------------------------------------------------------------------
    // Authorization
    // ------------------------------------------------------------------

    public function test_the_alert_destination_is_a_page_the_recipient_is_allowed_to_open(): void
    {
        $admin = $this->userWithRole('admin');
        $staff = $this->userWithRole('staff');

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10);

        $url = $admin->notifications()->firstOrFail()->data['url'];

        $this->actingAs($admin)->get($url)->assertOk();
        $this->actingAs($staff)->get($url)->assertForbidden();
    }

    // ------------------------------------------------------------------
    // Transaction safety
    // ------------------------------------------------------------------

    public function test_a_rolled_back_confirmation_creates_no_notifications(): void
    {
        $admin = $this->userWithRole('admin');

        $low = $this->makeVariant(20, 10);
        $scarce = $this->makeVariant(1, null);

        $customer = Customer::create([
            'type' => 'individual',
            'contact_name' => 'C-'.uniqid(),
            'is_active' => true,
        ]);
        $order = Order::create([
            'reference_number' => 'ORD-ROLLBACK-'.uniqid(),
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => '21.00',
            'total' => '21.00',
            'ordered_at' => now()->toDateString(),
        ]);
        $order->items()->create([
            'product_variant_id' => $low->id,
            'quantity' => 15,
            'unit_price' => '1.00',
            'subtotal' => '15.00',
        ]);
        $order->items()->create([
            'product_variant_id' => $scarce->id,
            'quantity' => 5, // only 1 in stock
            'unit_price' => '1.00',
            'subtotal' => '5.00',
        ]);

        try {
            app(OrderService::class)->confirm($order, $admin->id);
            $this->fail('confirmation must fail when a line has insufficient stock');
        } catch (ValidationException) {
            // expected: the whole transaction rolls back together
        }

        // Stock, status and notifications all rolled back together — the
        // first line had already transitioned into low_stock inside the
        // transaction, and none of it survived.
        $this->assertSame(20, $low->fresh()->quantity);
        $this->assertSame(1, $scarce->fresh()->quantity);
        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
        $this->assertSame(0, $admin->notifications()->count());
        $this->assertSame(0, StockMovement::count());
    }
}
