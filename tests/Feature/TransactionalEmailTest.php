<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Inquiry;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Notifications\AlertNotification;
use App\Notifications\OrderCancelledNotification;
use App\Notifications\OrderConfirmedNotification;
use App\Notifications\OrderCreatedNotification;
use App\Notifications\OrderDeliveredNotification;
use App\Notifications\SalesReturnProcessedNotification;
use App\Services\InventoryService;
use App\Services\OrderService;
use App\Services\ReceivingService;
use App\Services\SalesReturnService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Phase 29 — transactional email.
 *
 * Every case also re-asserts the business behaviour that must stay exactly
 * as it was (status, stock, receipts, database alerts), so a green run
 * proves email is a side effect only: it never changes, blocks or bypasses
 * the workflow that produced it. Automated tests never send real mail
 * (phpunit forces MAIL_MAILER=array; these tests additionally fake
 * notifications) and only use reserved @example.test addresses.
 */
class TransactionalEmailTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    /** @return array{0: User, 1: User, 2: User} admin, manager, staff */
    private function salesAudience(): array
    {
        return [
            $this->userWithRole('admin'),
            $this->userWithRole('manager'),
            $this->userWithRole('staff'),
        ];
    }

    private function makeVariant(int $quantity = 100, ?int $threshold = 10): ProductVariant
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

    private function makeCustomer(?string $email): Customer
    {
        return Customer::create([
            'type' => 'individual',
            'contact_name' => 'QA Buyer',
            'email' => $email,
            'is_active' => true,
        ]);
    }

    /**
     * Pending order built directly: creating it this way is not an order
     * entry event, so lifecycle cases start with a clean email slate.
     */
    private function makePendingOrder(Customer $customer, ProductVariant $variant, int $quantity, float $price): Order
    {
        $subtotal = number_format($quantity * $price, 2, '.', '');

        $order = Order::create([
            'reference_number' => 'ORD-TEST-'.uniqid(),
            'customer_id' => $customer->id,
            'order_source' => 'manual',
            'status' => Order::STATUS_PENDING,
            'subtotal' => $subtotal,
            'total' => $subtotal,
            'ordered_at' => now()->toDateString(),
        ]);

        $order->items()->create([
            'product_variant_id' => $variant->id,
            'quantity' => $quantity,
            'unit_price' => $price,
            'subtotal' => $subtotal,
        ]);

        return $order;
    }

    /** @return array{0: PurchaseOrder, 1: ProductVariant} */
    private function makeApprovedPO(User $admin, int $quantity = 10): array
    {
        // Starting stock sits comfortably above the low-stock threshold, so
        // receiving only moves the variant deeper into in_stock and the
        // receiving cases observe exactly the alerts they are about.
        $variant = $this->makeVariant(50);
        $supplier = Supplier::create(['name' => 'QA Supplier', 'is_active' => true]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-TEST-'.uniqid(),
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => PurchaseOrder::STATUS_APPROVED,
            'ordered_at' => now()->toDateString(),
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_variant_id' => $variant->id,
            'quantity' => $quantity,
            'unit_cost' => 10,
            'subtotal' => 10 * $quantity,
        ]);

        return [$po, $variant];
    }

    private function sell(ProductVariant $variant, int $quantity): void
    {
        app(InventoryService::class)
            ->decrease($variant, $quantity, StockMovement::TYPE_SALE, 'Sale', null, null, null, null);
    }

    private function restock(ProductVariant $variant, int $quantity): void
    {
        app(InventoryService::class)
            ->increase($variant, $quantity, StockMovement::TYPE_PURCHASE, 'Restock', null, null, null, null);
    }

    /** First customer-routed (on-demand) notification of the given class. */
    private function customerNotification(string $class): ?object
    {
        return Notification::sent(new AnonymousNotifiable, $class)->first();
    }

    /** Rendered HTML of a customer-routed notification. */
    private function htmlOf(?object $notification): string
    {
        $this->assertNotNull($notification, 'expected a customer email notification');

        return (string) $notification->toMail(new AnonymousNotifiable)->render();
    }

    /** Rendered HTML of an internal alert notification. */
    private function alertHtml(AlertNotification $notification, User $recipient): string
    {
        return (string) $notification->toMail($recipient)->render();
    }

    // ------------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------------

    public function test_local_mail_configuration_resolves_and_delivers_without_error(): void
    {
        $default = (string) config('mail.default');
        $this->assertNotSame('', $default, 'a default mailer must be configured');
        $this->assertArrayHasKey($default, config('mail.mailers'), 'the default mailer must be defined');

        // Local test transport is the array mailer: a real send that never
        // touches the network and must complete without an exception.
        Mail::raw('Danob mail configuration check.', function ($message): void {
            $message->to('qa@example.test')->subject('Danob mail configuration check');
        });

        $this->assertTrue(true, 'the configured local mailer accepted a message');
    }

    public function test_mail_sender_configuration_is_correct(): void
    {
        $address = config('mail.from.address');
        $name = config('mail.from.name');

        $this->assertIsString($address);
        $this->assertNotFalse(filter_var($address, FILTER_VALIDATE_EMAIL), 'MAIL_FROM_ADDRESS must be a valid address');
        $this->assertIsString($name);
        $this->assertNotSame('', trim($name), 'MAIL_FROM_NAME must not be empty');
    }

    public function test_no_mail_secrets_are_committed(): void
    {
        $example = (string) file_get_contents(base_path('.env.example'));

        $this->assertStringContainsString('MAIL_MAILER=', $example, 'the example env documents the mail settings');

        foreach (['MAIL_PASSWORD', 'MAIL_USERNAME'] as $key) {
            preg_match('/^'.$key.'=(.*)$/m', $example, $matches);
            $value = trim($matches[1] ?? 'null', " \t\"'");

            $this->assertTrue(
                in_array($value, ['', 'null'], true),
                $key.' must not carry a value in .env.example',
            );
        }

        $this->assertStringNotContainsString('MAIL_PASSWORD=', (string) file_get_contents(base_path('render.yaml')));
    }

    // ------------------------------------------------------------------
    // Inquiry (new website inquiry + product quote request)
    // ------------------------------------------------------------------

    public function test_new_inquiry_sends_the_internal_email_to_sales_roles_only(): void
    {
        Notification::fake();
        [$admin, $manager, $staff] = $this->salesAudience();

        $this->post(route('inquiries.store'), [
            'name' => 'Abebe Bakery',
            'email' => 'abebe@example.test',
            'phone' => '+251911000000',
            'interest' => 'Wholesale Order',
            'message' => 'We need a monthly supply of cake mixes and cocoa.',
        ])->assertSessionHas('success');

        $this->assertSame(1, Inquiry::count(), 'the business operation must still store the inquiry');

        foreach ([$admin, $manager, $staff] as $recipient) {
            Notification::assertSentTo($recipient, AlertNotification::class, function ($notification, $channels) {
                return $notification->alertType === 'inquiry_created'
                    && in_array('database', $channels, true)
                    && in_array('mail', $channels, true);
            });
        }

        // The public submitter is never a recipient of internal content.
        Notification::assertSentOnDemandTimes(AlertNotification::class, 0);
        Notification::assertSentOnDemandTimes(OrderCreatedNotification::class, 0);
    }

    public function test_inquiry_email_contains_the_expected_fields(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $this->post(route('inquiries.store'), [
            'name' => 'Abebe Bakery',
            'email' => 'abebe@example.test',
            'phone' => '+251911000000',
            'interest' => 'Wholesale Order',
            'message' => 'We need a monthly supply of cake mixes and cocoa.',
        ])->assertSessionHas('success');

        $notification = Notification::sent($admin, AlertNotification::class)->first();
        $this->assertNotNull($notification, 'the sales admin must receive the inquiry alert');

        $html = $this->alertHtml($notification, $admin);

        $this->assertStringContainsString('New website inquiry', $html);
        $this->assertStringContainsString('Abebe Bakery', $html);
        $this->assertStringContainsString('abebe@example.test', $html);
        $this->assertStringContainsString('+251911000000', $html);
        $this->assertStringContainsString('Wholesale Order', $html);
        $this->assertStringContainsString('We need a monthly supply of cake mixes and cocoa.', $html);
        $this->assertStringContainsString(route('admin.inquiries.index'), $html, 'internal mail may link into the admin area');
    }

    public function test_product_quote_request_email_carries_product_context(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $category = Category::create(['name' => 'Quote Category', 'slug' => 'quote-category', 'is_active' => true]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Bulk Cocoa Powder',
            'slug' => 'bulk-cocoa-powder',
            'description' => 'Wholesale cocoa powder',
            'status' => 'active',
        ]);
        $variant = $product->variants()->create([
            'name' => '25 kg bag',
            'unit' => 'bag',
            'quantity' => 12,
            'is_active' => true,
        ]);

        $this->post(route('inquiries.store'), [
            'name' => 'Wholesale Buyer',
            'email' => 'wholesale@example.test',
            'interest' => 'Wholesale Order',
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'requested_quantity' => 40,
            'message' => 'Please send a quote for forty bags of cocoa powder.',
        ])->assertSessionHas('success');

        $notification = Notification::sent($admin, AlertNotification::class)->first();
        $this->assertNotNull($notification);

        $html = $this->alertHtml($notification, $admin);

        $this->assertStringContainsString('New website inquiry for Bulk Cocoa Powder', $html);
        $this->assertStringContainsString('Bulk Cocoa Powder', $html);
        $this->assertStringContainsString('25 kg bag', $html);
        $this->assertStringContainsString('40', $html);
        $this->assertStringContainsString('Please send a quote for forty bags of cocoa powder.', $html);

        // Quote requests are internal too: no email to the requester.
        Notification::assertSentOnDemandTimes(AlertNotification::class, 0);
    }

    public function test_inquiry_conversion_sends_no_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $inquiry = Inquiry::create([
            'name' => 'Converted Buyer',
            'email' => 'converted@example.test',
            'interest' => 'Product Inquiry',
            'message' => 'I would like to become a customer of Danob.',
            'source' => 'website',
            'status' => Inquiry::STATUS_NEW,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.inquiries.convert-to-customer', $inquiry))
            ->assertSessionHasNoErrors();

        $this->assertSame(Inquiry::STATUS_CONVERTED, $inquiry->fresh()->status, 'conversion itself is untouched');
        Notification::assertNothingSent();
    }

    // ------------------------------------------------------------------
    // Orders: created / confirmed / cancelled / delivered
    // ------------------------------------------------------------------

    public function test_order_creation_emails_the_customer_and_keeps_the_workflow_intact(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $customer = $this->makeCustomer('buyer@example.test');

        $order = app(OrderService::class)->create([
            'customer_id' => $customer->id,
            'items' => [[
                'product_variant_id' => $variant->id,
                'quantity' => 2,
                'unit_price' => 10.00,
            ]],
        ]);

        // Business behaviour unchanged: pending order, stock untouched.
        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertSame(100, $variant->fresh()->quantity);

        Notification::assertSentOnDemandOnce(OrderCreatedNotification::class);
        Notification::assertSentOnDemand(
            OrderCreatedNotification::class,
            function ($notification, $channels, $notifiable) use ($customer) {
                return $notifiable->routes['mail'] === $customer->email
                    && $channels === ['mail'];
            },
        );

        // The internal Phase 28 alert for the same event stays database-only.
        Notification::assertSentTo($admin, AlertNotification::class, function ($notification, $channels) {
            return $notification->alertType === 'order_created' && $channels === ['database'];
        });

        $html = $this->htmlOf($this->customerNotification(OrderCreatedNotification::class));
        $this->assertStringContainsString($order->reference_number, $html);
        $this->assertStringContainsString('Pending', $html);
        $this->assertStringContainsString('QA Buyer', $html);
        $this->assertStringContainsString('20.00', $html, 'the email reports the authoritative totals');
    }

    public function test_confirmation_emails_the_customer_and_still_deducts_stock(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 15, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status, 'confirmation must be unchanged');
        $this->assertSame(85, $variant->fresh()->quantity, 'stock deduction must be unchanged');

        Notification::assertSentOnDemandOnce(OrderConfirmedNotification::class);

        $html = $this->htmlOf($this->customerNotification(OrderConfirmedNotification::class));
        $this->assertStringContainsString('Your order is confirmed', $html);
        $this->assertStringContainsString($order->reference_number, $html);
        $this->assertStringContainsString('Confirmed', $html);
    }

    public function test_cancellation_emails_the_customer_without_changing_stock_behaviour(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 5, 10.00);

        app(OrderService::class)->cancel($order, $admin->id);

        $this->assertSame(Order::STATUS_CANCELLED, $order->fresh()->status);
        $this->assertSame(100, $variant->fresh()->quantity, 'a pending order never held stock');

        Notification::assertSentOnDemandOnce(OrderCancelledNotification::class);

        $html = $this->htmlOf($this->customerNotification(OrderCancelledNotification::class));
        $this->assertStringContainsString('Your order has been cancelled', $html);
        $this->assertStringContainsString($order->reference_number, $html);
        // No cancellation reason exists in the system, so none is invented.
        $this->assertStringNotContainsString('reason:', $html);
    }

    public function test_delivery_emails_the_customer_and_is_the_only_status_change(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 5, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);
        Notification::fake(); // slate clean: only the delivery email matters here
        app(OrderService::class)->deliver($order->fresh());

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status);

        Notification::assertSentOnDemandOnce(OrderDeliveredNotification::class);

        $html = $this->htmlOf($this->customerNotification(OrderDeliveredNotification::class));
        $this->assertStringContainsString('Your order has been delivered', $html);
        $this->assertStringContainsString($order->reference_number, $html);
    }

    public function test_no_email_is_attempted_without_a_valid_customer_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);

        $withoutEmail = $this->makeCustomer(null);
        $orderWithoutEmail = app(OrderService::class)->create([
            'customer_id' => $withoutEmail->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.00]],
        ]);

        $invalidEmail = $this->makeCustomer('not-an-email');
        $orderInvalidEmail = app(OrderService::class)->create([
            'customer_id' => $invalidEmail->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.00]],
        ]);

        // The orders exist and are pending — delivery was skipped, not fatal.
        $this->assertSame(Order::STATUS_PENDING, $orderWithoutEmail->status);
        $this->assertSame(Order::STATUS_PENDING, $orderInvalidEmail->status);

        Notification::assertSentOnDemandTimes(OrderCreatedNotification::class, 0);

        // The internal Phase 28 alerts still land (database-only) for both
        // orders — skipped delivery must not suppress the in-app centre.
        Notification::assertSentToTimes($admin, AlertNotification::class, 2);
    }

    public function test_customer_email_contains_no_admin_only_information(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 3, 25.00);

        app(OrderService::class)->confirm($order, $admin->id);

        $html = $this->htmlOf($this->customerNotification(OrderConfirmedNotification::class));
        $lower = strtolower($html);

        $this->assertStringContainsString($order->reference_number, $html);
        $this->assertStringNotContainsString('/admin', $lower, 'customer mail must never expose admin URLs');
        $this->assertStringNotContainsString('supplier', $lower);
        $this->assertStringNotContainsString('threshold', $lower);
        $this->assertStringNotContainsString('stock level', $lower);
        $this->assertStringNotContainsString('internal', $lower);
        $this->assertStringNotContainsString('staff', $lower);
        $this->assertStringNotContainsString(
            strtolower(route('admin.orders.show', $order)),
            $lower,
        );
    }

    // ------------------------------------------------------------------
    // Sales returns
    // ------------------------------------------------------------------

    public function test_processed_return_emails_the_customer_and_leaves_the_workflow_unchanged(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 20, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->deliver($order->fresh());
        $this->assertSame(80, $variant->fresh()->quantity);

        $itemId = $order->items()->firstOrFail()->id;
        $return = app(SalesReturnService::class)->process($order->fresh(), [
            ['order_item_id' => $itemId, 'quantity' => 4],
        ], null, $admin->id);

        $this->assertSame(Order::STATUS_DELIVERED, $order->fresh()->status, 'returns never change order status');
        $this->assertSame(84, $variant->fresh()->quantity, 'returned stock is restored exactly as before');

        Notification::assertSentOnDemandOnce(SalesReturnProcessedNotification::class);
        Notification::assertSentOnDemand(
            SalesReturnProcessedNotification::class,
            function ($notification, $channels, $notifiable) {
                return $notifiable->routes['mail'] === 'buyer@example.test' && $channels === ['mail'];
            },
        );

        $this->assertSame(1, $return->items()->count(), 'the return record itself is unchanged');
        $this->assertSame('4', (string) $return->items()->firstOrFail()->quantity);
    }

    public function test_return_email_contains_returned_quantities_and_total(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 20, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->deliver($order->fresh());

        app(SalesReturnService::class)->process($order->fresh(), [
            ['order_item_id' => $order->items()->firstOrFail()->id, 'quantity' => 4],
        ], null, $admin->id);

        $html = $this->htmlOf($this->customerNotification(SalesReturnProcessedNotification::class));

        $this->assertStringContainsString('Your return has been processed', $html);
        $this->assertStringContainsString('RET-'.date('Y'), $html, 'the email carries the return number');
        $this->assertStringContainsString($order->reference_number, $html, 'the email carries the order reference');
        $this->assertStringContainsString('Returned qty', $html);
        $this->assertStringContainsString('40.00', $html, '4 units × 10.00 = the authoritative return total');
        $this->assertStringNotContainsString('/admin', $html);
        $this->assertStringNotContainsString('refund', strtolower($html), 'a return is not a refund');
    }

    // ------------------------------------------------------------------
    // Purchasing: partial + full receiving
    // ------------------------------------------------------------------

    public function test_partial_receiving_sends_the_internal_email_with_receiving_detail(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        app(ReceivingService::class)->receive($po, [
            ['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 4],
        ]);

        // Receiving itself unchanged.
        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->fresh()->status);
        $this->assertSame(54, $variant->fresh()->quantity);

        Notification::assertSentTo($admin, AlertNotification::class, function ($notification, $channels) {
            return $notification->alertType === 'purchase_order_partially_received'
                && in_array('mail', $channels, true)
                && in_array('database', $channels, true);
        });

        $notification = Notification::sent($admin, AlertNotification::class)
            ->first(fn (AlertNotification $alert): bool => $alert->alertType === 'purchase_order_partially_received');
        $this->assertNotNull($notification, 'a partial receipt must produce its own email');
        $html = $this->alertHtml($notification, $admin);

        $this->assertStringContainsString('PO partially received', $html);
        $this->assertStringContainsString('QA Supplier', $html, 'the email names the supplier');
        $this->assertStringContainsString('GRN-'.date('Y'), $html, 'the email names the receipt');
        $this->assertStringContainsString('Partially received', $html);
        $this->assertStringContainsString('6 of 10 outstanding', $html, 'remaining quantities are reported');
        $this->assertStringContainsString('4', $html, 'received quantities are reported');
    }

    public function test_full_receiving_sends_the_internal_fully_received_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        app(ReceivingService::class)->receive($po, [
            ['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 10],
        ]);

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->fresh()->status);
        $this->assertSame(60, $variant->fresh()->quantity);

        $notification = Notification::sent($admin, AlertNotification::class)
            ->first(fn (AlertNotification $alert): bool => $alert->alertType === 'purchase_order_received');
        $this->assertNotNull($notification, 'a fully received PO must produce its own email');
        $this->assertArrayNotHasKey('Still outstanding', $notification->context, 'a complete receipt has nothing outstanding');

        $html = $this->alertHtml($notification, $admin);
        $this->assertStringContainsString('PO received', $html);
        $this->assertStringContainsString('Fully received', $html);
        $this->assertStringContainsString('QA Supplier', $html);
        $this->assertStringContainsString(route('admin.purchase-orders.show', $po), $html);
    }

    // ------------------------------------------------------------------
    // Inventory: low stock / out of stock / transition-only behaviour
    // ------------------------------------------------------------------

    public function test_entering_low_stock_sends_the_email_to_inventory_roles_only(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $manager = $this->userWithRole('manager');
        $staff = $this->userWithRole('staff');

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10); // 20 -> 10, threshold 10 => low_stock

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());

        foreach ([$admin, $manager] as $recipient) {
            Notification::assertSentTo($recipient, AlertNotification::class, function ($notification, $channels) {
                return $notification->alertType === 'low_stock'
                    && in_array('mail', $channels, true)
                    && in_array('database', $channels, true);
            });
        }
        Notification::assertNothingSentTo($staff, AlertNotification::class);

        $notification = Notification::sent($admin, AlertNotification::class)->first();
        $html = $this->alertHtml($notification, $admin);

        $this->assertStringContainsString('Low stock', $html);
        $this->assertStringContainsString('Chocolate Cake — Family Size', $html);
        $this->assertStringContainsString('10', $html);
        $this->assertStringContainsString(route('admin.products.show', $variant->product_id), $html);
    }

    public function test_entering_out_of_stock_sends_its_own_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $variant = $this->makeVariant(10, 10);
        $this->sell($variant, 10); // -> 0 => out_of_stock

        $this->assertSame('out_of_stock', $variant->fresh()->stockStatus());

        $notification = Notification::sent($admin, AlertNotification::class)->first();
        $this->assertNotNull($notification);
        $this->assertSame('out_of_stock', $notification->alertType);

        $html = $this->alertHtml($notification, $admin);
        $this->assertStringContainsString('Out of stock', $html);
        $this->assertStringContainsString('On hand', $html);
    }

    public function test_unchanged_low_stock_state_sends_no_duplicate_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10); // in_stock -> low_stock: one email

        $this->sell($variant, 1); // still low_stock: no transition, no email

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());
        Notification::assertSentToOnce($admin, AlertNotification::class);
    }

    public function test_restock_then_a_new_dip_sends_a_fresh_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10);   // -> low_stock: first email
        $this->restock($variant, 30); // -> in_stock: no email, re-arms
        $this->sell($variant, 30);    // -> low_stock again: fresh email

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());
        Notification::assertSentToTimes($admin, AlertNotification::class, 2);
    }

    // ------------------------------------------------------------------
    // Failure safety
    // ------------------------------------------------------------------

    public function test_customer_email_failure_never_rolls_back_the_business_transaction(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 15, 10.00);

        // Point the real (non-faked) mail channel at a closed local port so
        // delivery genuinely fails, then prove the workflow doesn't care.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 9,
            'mail.mailers.smtp.timeout' => 2,
        ]);

        app(OrderService::class)->confirm($order, $admin->id);

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status, 'confirmation must survive a mail outage');
        $this->assertSame(85, $variant->fresh()->quantity, 'stock must be deducted regardless of email delivery');
        $this->assertSame(
            ['order_confirmed'],
            $admin->notifications()->get()->map(fn ($row) => $row->data['type'] ?? null)->all(),
            'the database notification still lands when the mail channel fails',
        );
    }

    public function test_internal_alert_email_failure_never_fails_the_inquiry_submission(): void
    {
        $admin = $this->userWithRole('admin');

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 9,
            'mail.mailers.smtp.timeout' => 2,
        ]);

        $response = $this->post(route('inquiries.store'), [
            'name' => 'Resilient Buyer',
            'email' => 'resilient@example.test',
            'interest' => 'Product Inquiry',
            'message' => 'This submission must succeed even when mail is down.',
        ]);

        $response->assertSessionHas('success');
        $this->assertSame(1, Inquiry::count(), 'the inquiry is stored even though email delivery failed');
        $this->assertSame(
            ['inquiry_created'],
            $admin->notifications()->get()->map(fn ($row) => $row->data['type'] ?? null)->all(),
            'the database notification still lands when the mail channel fails',
        );
    }

    // ------------------------------------------------------------------
    // Duplicate prevention
    // ------------------------------------------------------------------

    public function test_page_refreshes_and_get_requests_send_no_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk(); // refresh

        Notification::assertNothingSent();
    }

    public function test_viewing_lists_and_records_sends_no_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 2, 10.00);

        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.show', $order))->assertOk();
        $this->actingAs($admin)->get(route('admin.inquiries.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.reports.sales'))->assertOk();

        Notification::assertNothingSent();
    }

    public function test_notification_centre_access_sends_no_email(): void
    {
        Notification::fake();
        $admin = $this->userWithRole('admin');

        // Seed an in-app notification straight into the database, exactly as
        // the notification centre expects to find one.
        $row = $admin->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => AlertNotification::class,
            'data' => [
                'severity' => 'info',
                'type' => 'order_created',
                'title' => 'Order created',
                'message' => 'ORD-TEST was created and is awaiting confirmation.',
                'url' => null,
            ],
        ]);

        $payload = $this->actingAs($admin)->get(route('admin.notifications.index'))->assertOk()->json();
        $this->assertSame(1, $payload['unread_count'], 'unread counts still work');

        $this->actingAs($admin)->post(route('admin.notifications.read', $row->id))->assertOk();
        $this->actingAs($admin)->post(route('admin.notifications.read-all'))->assertOk();

        Notification::assertNothingSent();
    }
}
