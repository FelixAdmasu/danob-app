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
use App\Notifications\AlertMailNotification;
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
use Illuminate\Database\DatabaseTransactionsManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Phase 30 — queue & async processing.
 *
 * Every case proves a queue property (queued vs inline, after commit,
 * retry policy, failure isolation, no duplicates from reads) while also
 * re-asserting the business invariant that must survive: the database
 * transaction is authoritative and email is only ever a side effect.
 *
 * No test sends real mail: queued deliveries are captured with Queue::fake
 * or executed against the array/blackhole transports, and only reserved
 *
 * @example.test addresses are used.
 */
class QueueProcessingTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Fixtures (small mirrors of TransactionalEmailTest)
    // ------------------------------------------------------------------

    private function userWithRole(string $role): User
    {
        return User::factory()->create(['role' => $role]);
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
     * Pending order built directly: not an order-entry event, so each case
     * starts with an empty queue.
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

    /** Decode a queue payload into the wrapped SendQueuedNotifications job. */
    private function jobFromPayload(string $payload): SendQueuedNotifications
    {
        $decoded = json_decode($payload, true, flags: JSON_THROW_ON_ERROR);
        $raw = (string) ($decoded['data']['command'] ?? '');
        // The command is stored base64-encoded; tolerate plain serialize too.
        $command = unserialize(base64_decode($raw, true) ?: $raw);

        $this->assertInstanceOf(SendQueuedNotifications::class, $command);

        return $command;
    }

    // ------------------------------------------------------------------
    // 1-2. Email is queued; the database notification is immediate
    // ------------------------------------------------------------------

    public function test_customer_email_is_queued_as_one_mail_job(): void
    {
        Queue::fake();
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

        // Business transaction first: the order exists regardless of queue.
        $this->assertSame(Order::STATUS_PENDING, $order->status);

        // Exactly one queued job, carrying the customer mail notification.
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);
        Queue::assertPushed(SendQueuedNotifications::class, function (SendQueuedNotifications $job): bool {
            return $job->notification instanceof OrderCreatedNotification
                && $job->channels === ['mail'];
        });
    }

    public function test_internal_email_is_queued_while_the_in_app_notification_stays_immediate(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');

        $this->post(route('inquiries.store'), [
            'name' => 'Abebe Bakery',
            'email' => 'abebe@example.test',
            'phone' => '+251911000000',
            'interest' => 'Wholesale Order',
            'message' => 'Queue check for internal alerts.',
        ])->assertSessionHas('success');

        $this->assertSame(1, Inquiry::count(), 'the inquiry is committed');

        // In-app notification: written synchronously — the centre never
        // depends on a running worker.
        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame(
            AlertNotification::class,
            $admin->notifications()->first()->type,
        );

        // Mail: queued, one job, addressed to the same recipient.
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);
        Queue::assertPushed(SendQueuedNotifications::class, function (SendQueuedNotifications $job) use ($admin): bool {
            return $job->notification instanceof AlertMailNotification
                && $job->notification->alertType === 'inquiry_created'
                && $job->channels === ['mail']
                && $job->notifiables->first()?->is($admin) === true;
        });
    }

    // ------------------------------------------------------------------
    // 3. After-commit: the job becomes available only once the business
    //    transaction commits (and never at all when it rolls back)
    // ------------------------------------------------------------------

    public function test_queued_job_only_becomes_available_after_the_business_transaction_commits(): void
    {
        // Install the PRODUCTION transactions manager (the test double runs
        // callbacks immediately) so the real commit boundary is observable.
        $connection = DB::connection();
        $name = $connection->getName();
        $manager = new DatabaseTransactionsManager;
        $this->app->instance('db.transactions', $manager);
        $connection->setTransactionManager($manager);
        // Model the outermost business transaction, exactly as production
        // has one open while the service's own transaction nests inside it.
        $manager->begin($name, $connection->transactionLevel());

        config(['queue.default' => 'database']);

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

        // The service transaction has committed (nested level), but the
        // outermost transaction is still open: nothing may be available yet.
        $this->assertSame(1, Order::count(), 'business data is committed');
        $this->assertSame(0, DB::table('jobs')->count(), 'no job before the outermost commit');
        $this->assertSame(0, $admin->notifications()->count(), 'after-commit side effects wait too');

        // The outermost transaction commits — now, and only now, do the
        // side effects materialize.
        $manager->commit($name, 1, 0);

        $this->assertGreaterThanOrEqual(1, DB::table('jobs')->count(), 'job available after commit');
        $job = $this->jobFromPayload(DB::table('jobs')->value('payload'));
        $this->assertInstanceOf(OrderCreatedNotification::class, $job->notification);
        $this->assertSame(1, $admin->notifications()->count(), 'the in-app alert lands at the same commit');
    }

    public function test_rolled_back_business_transaction_never_produces_a_job_or_notification(): void
    {
        $connection = DB::connection();
        $name = $connection->getName();
        $manager = new DatabaseTransactionsManager;
        $this->app->instance('db.transactions', $manager);
        $connection->setTransactionManager($manager);
        $manager->begin($name, $connection->transactionLevel());

        config(['queue.default' => 'database']);

        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $customer = $this->makeCustomer('buyer@example.test');

        try {
            DB::transaction(function () use ($customer, $variant): void {
                app(OrderService::class)->create([
                    'customer_id' => $customer->id,
                    'items' => [[
                        'product_variant_id' => $variant->id,
                        'quantity' => 2,
                        'unit_price' => 10.00,
                    ]],
                ]);

                throw new \RuntimeException('business failed after the order row was written');
            });
            $this->fail('the transaction should have rolled back');
        } catch (\RuntimeException) {
            // expected
        }

        // The outermost transaction still succeeds (the failure was a
        // nested operation): nothing from the rolled-back work may leak.
        $manager->commit($name, 1, 0);

        $this->assertSame(0, Order::count(), 'business rows rolled back');
        $this->assertSame(0, DB::table('jobs')->count(), 'no email job for a failed transaction');
        $this->assertSame(0, $admin->notifications()->count(), 'no notification for a failed transaction');
    }

    // ------------------------------------------------------------------
    // 4-5. Failure handling and retries (real worker, real failed_jobs)
    // ------------------------------------------------------------------

    public function test_failed_email_job_is_recorded_in_failed_jobs_without_touching_business_data_and_can_be_retried(): void
    {
        config(['queue.default' => 'database']);

        // Make SMTP genuinely unreachable so the worker's delivery fails.
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 9,
            'mail.mailers.smtp.timeout' => 2,
        ]);

        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 15, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);

        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status, 'the business committed first');
        $this->assertSame(85, $variant->fresh()->quantity, 'stock deduction committed first');
        $this->assertSame(1, DB::table('jobs')->count(), 'the email job waits in the queue');

        // Run the real worker until it exhausts the declared attempts
        // (tries=3, backoff [30,120] — the wait is rewound between runs so
        // the test observes the retry policy instead of sleeping through it).
        for ($run = 0; $run < 5 && DB::table('jobs')->count() > 0; $run++) {
            DB::table('jobs')->update(['available_at' => time()]);
            Artisan::call('queue:work', ['--once' => true, '--sleep' => 0]);
        }

        $this->assertSame(0, DB::table('jobs')->count(), 'the job is no longer retryable');
        $this->assertSame(1, DB::table('failed_jobs')->count(), 'the failure is recorded');

        $failed = DB::table('failed_jobs')->first();
        $this->assertNotSame('', (string) $failed->exception, 'the exception is captured');

        $job = $this->jobFromPayload($failed->payload);
        $this->assertInstanceOf(OrderConfirmedNotification::class, $job->notification);

        // A failed email must never disturb committed business data.
        $this->assertSame(Order::STATUS_CONFIRMED, $order->fresh()->status);
        $this->assertSame(85, $variant->fresh()->quantity);
        $this->assertSame(
            ['order_confirmed'],
            $admin->notifications()->get()->map(fn ($row) => $row->data['type'] ?? null)->all(),
        );

        // "SMTP restored": retry the failed job with the safe local mailer.
        config(['mail.default' => 'array']);
        Artisan::call('queue:retry', ['id' => $failed->uuid]);
        $this->assertSame(1, DB::table('jobs')->count(), 'retry re-queues the job');

        Artisan::call('queue:work', ['--once' => true, '--sleep' => 0]);

        $this->assertSame(0, DB::table('jobs')->count(), 'the retried job completed');
        $this->assertSame(0, DB::table('failed_jobs')->count(), 'the failed record is cleared on success');
        $this->assertSame(1, count($this->app['mailer']->getSymfonyTransport()->messages()), 'the retried delivery reached the transport');
    }

    // ------------------------------------------------------------------
    // 6-8. Address gating and recipient isolation
    // ------------------------------------------------------------------

    public function test_missing_or_invalid_customer_email_produces_no_job(): void
    {
        config(['queue.default' => 'database']);

        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);

        app(OrderService::class)->create([
            'customer_id' => $this->makeCustomer(null)->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.00]],
        ]);
        app(OrderService::class)->create([
            'customer_id' => $this->makeCustomer('not-an-email')->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.00]],
        ]);

        $this->assertSame(2, Order::count(), 'both orders committed');
        $this->assertSame(0, DB::table('jobs')->count(), 'an undeliverable address never produces a job');

        // The in-app centre is unaffected by the skipped email.
        $this->assertSame(2, $admin->notifications()->count());
    }

    public function test_internal_recipient_without_a_valid_address_is_skipped_without_failing_the_others(): void
    {
        Queue::fake();

        $admin = $this->userWithRole('admin');
        $manager = $this->userWithRole('manager');
        $manager->forceFill(['email' => 'not-an-email'])->save();

        $variant = $this->makeVariant(20, 10);
        $this->sell($variant, 10); // -> low_stock transition

        $this->assertSame('low_stock', $variant->fresh()->stockStatus());

        // One mail job, addressed to the deliverable recipient only.
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);
        Queue::assertPushed(SendQueuedNotifications::class, function (SendQueuedNotifications $job) use ($admin): bool {
            $notifiable = $job->notifiables->first();

            return $job->notification instanceof AlertMailNotification
                && $notifiable instanceof User
                && $notifiable->is($admin);
        });

        // Both recipients still get the in-app notification.
        $this->assertSame(1, $admin->notifications()->count());
        $this->assertSame(1, $manager->notifications()->count());
    }

    // ------------------------------------------------------------------
    // 9. Notification centre
    // ------------------------------------------------------------------

    public function test_notification_centre_works_while_email_is_queued(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');

        $this->post(route('inquiries.store'), [
            'name' => 'Centre Check',
            'email' => 'centre@example.test',
            'interest' => 'Product Inquiry',
            'message' => 'The centre must not depend on the worker.',
        ])->assertSessionHas('success');

        Queue::assertPushed(SendQueuedNotifications::class); // email is queued…
        $payload = $this->actingAs($admin)->get(route('admin.notifications.index'))->assertOk()->json();
        $this->assertSame(1, $payload['unread_count'], '…but the centre already shows the unread row');

        $row = $admin->notifications()->firstOrFail();
        $this->actingAs($admin)->post(route('admin.notifications.read', $row->id))->assertOk();
        $payload = $this->actingAs($admin)->get(route('admin.notifications.index'))->assertOk()->json();
        $this->assertSame(0, $payload['unread_count'], 'mark-read still works');
    }

    // ------------------------------------------------------------------
    // 10-12. Reads never enqueue
    // ------------------------------------------------------------------

    public function test_page_refreshes_never_create_duplicate_jobs(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $customer = $this->makeCustomer('buyer@example.test');

        $order = app(OrderService::class)->create([
            'customer_id' => $customer->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_price' => 10.00]],
        ]);

        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);

        // Reads, refreshes and revisits — from a React/Inertia client or a
        // plain browser — must never add jobs.
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.show', $order))->assertOk();
        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();

        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);
    }

    public function test_get_requests_enqueue_no_email_jobs(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');

        $this->get('/')->assertOk();
        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->actingAs($admin)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.customers.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.notifications.index'))->assertOk();

        Queue::assertNothingPushed();
    }

    public function test_inertia_client_side_page_loads_enqueue_no_email_jobs(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');

        // X-Inertia requests are how the React frontend navigates after the
        // first paint: rendering is a read, never a business event. The
        // version header mirrors the middleware's own asset-version rule so
        // the requests are accepted exactly like a real client navigation.
        $assetVersion = config('app.asset_url')
            ? hash('xxh128', (string) config('app.asset_url'))
            : (file_exists($manifest = public_path('build/manifest.json'))
                ? hash_file('xxh128', $manifest)
                : '');
        $inertia = ['X-Inertia' => 'true', 'X-Inertia-Version' => (string) $assetVersion];

        $this->actingAs($admin)->withHeaders($inertia)->get(route('admin.orders.index'))->assertOk();
        $this->actingAs($admin)->withHeaders($inertia)->get(route('admin.customers.index'))->assertOk();
        $this->actingAs($admin)->withHeaders($inertia)->get(route('admin.notifications.index'))->assertOk();

        Queue::assertNothingPushed();
    }

    // ------------------------------------------------------------------
    // Retry policy
    // ------------------------------------------------------------------

    public function test_email_jobs_declare_a_bounded_after_commit_retry_policy(): void
    {
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 2, 10.00);

        $customerJob = new SendQueuedNotifications(
            NotificationFacade::route('mail', 'buyer@example.test'),
            new OrderCreatedNotification($order),
            ['mail'],
        );
        $this->assertSame(3, $customerJob->tries, 'three attempts, never infinite');
        $this->assertSame([30, 120], $customerJob->backoff());
        $this->assertTrue($customerJob->afterCommit, 'customer email waits for commit');

        $alertJob = new SendQueuedNotifications(
            $admin,
            new AlertMailNotification('low_stock', 'warning', 'Low stock', 'Cake is low.', null, []),
            ['mail'],
        );
        $this->assertSame(3, $alertJob->tries);
        $this->assertSame([30, 120], $alertJob->backoff());
        $this->assertTrue($alertJob->afterCommit, 'internal email waits for commit');
    }

    // ------------------------------------------------------------------
    // Workflow regression: every business event queues exactly its own job
    // ------------------------------------------------------------------

    public function test_order_lifecycle_queues_one_email_job_per_event(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $customer = $this->makeCustomer('buyer@example.test');

        $delivered = app(OrderService::class)->create([
            'customer_id' => $customer->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 2, 'unit_price' => 10.00]],
        ]);
        app(OrderService::class)->confirm($delivered, $admin->id);
        app(OrderService::class)->deliver($delivered->fresh());

        $cancelled = app(OrderService::class)->create([
            'customer_id' => $customer->id,
            'items' => [['product_variant_id' => $variant->id, 'quantity' => 1, 'unit_price' => 10.00]],
        ]);
        app(OrderService::class)->cancel($cancelled, $admin->id);

        $this->assertSame(Order::STATUS_DELIVERED, $delivered->fresh()->status, 'lifecycle unchanged');
        $this->assertSame(Order::STATUS_CANCELLED, $cancelled->fresh()->status, 'cancellation unchanged');

        // 2 creates + confirm + deliver + cancel = five events, five jobs.
        Queue::assertPushedTimes(SendQueuedNotifications::class, 5);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof OrderCreatedNotification);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof OrderConfirmedNotification);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof OrderDeliveredNotification);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof OrderCancelledNotification);
    }

    public function test_sales_return_queues_its_email_job(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');
        $variant = $this->makeVariant(100);
        $order = $this->makePendingOrder($this->makeCustomer('buyer@example.test'), $variant, 20, 10.00);

        app(OrderService::class)->confirm($order, $admin->id);
        app(OrderService::class)->deliver($order->fresh());

        $itemId = $order->items()->firstOrFail()->id;
        app(SalesReturnService::class)->process($order->fresh(), [
            ['order_item_id' => $itemId, 'quantity' => 4],
        ], null, $admin->id);

        $this->assertSame(84, $variant->fresh()->quantity, 'return stock behaviour unchanged');

        // makePendingOrder writes directly (no create event): confirm +
        // deliver + return = exactly three queued emails.
        Queue::assertPushedTimes(SendQueuedNotifications::class, 3);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof SalesReturnProcessedNotification);
    }

    public function test_purchase_receiving_queues_internal_email_jobs(): void
    {
        Queue::fake();
        $admin = $this->userWithRole('admin');
        [$po, $variant] = $this->makeApprovedPO($admin, 10);

        app(ReceivingService::class)->receive($po, [
            ['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 4],
        ]);

        $this->assertSame(PurchaseOrder::STATUS_PARTIALLY_RECEIVED, $po->fresh()->status);
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof AlertMailNotification
            && $job->notification->alertType === 'purchase_order_partially_received');

        app(ReceivingService::class)->receive($po, [
            ['purchase_order_item_id' => $po->items()->first()->id, 'quantity' => 6],
        ]);

        $this->assertSame(PurchaseOrder::STATUS_RECEIVED, $po->fresh()->status);
        Queue::assertPushedTimes(SendQueuedNotifications::class, 2);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof AlertMailNotification
            && $job->notification->alertType === 'purchase_order_received');
    }

    public function test_stock_transitions_queue_email_jobs_once_per_transition(): void
    {
        Queue::fake();
        $this->userWithRole('admin');

        $variant = $this->makeVariant(20, 10);

        $this->sell($variant, 10);  // in_stock -> low_stock: one job
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);

        $this->sell($variant, 1);   // still low_stock: no transition, no job
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);

        $this->restock($variant, 30); // -> in_stock: no alert, re-armed
        Queue::assertPushedTimes(SendQueuedNotifications::class, 1);

        $this->sell($variant, 30);    // -> low_stock again: a fresh job
        Queue::assertPushedTimes(SendQueuedNotifications::class, 2);
        Queue::assertPushed(SendQueuedNotifications::class, fn (SendQueuedNotifications $job): bool => $job->notification instanceof AlertMailNotification
            && $job->notification->alertType === 'low_stock');
    }
}
