<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\SalesReturn;
use App\Notifications\OrderCancelledNotification;
use App\Notifications\OrderConfirmedNotification;
use App\Notifications\OrderCreatedNotification;
use App\Notifications\OrderDeliveredNotification;
use App\Notifications\SalesReturnProcessedNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;

/**
 * Phase 29 — customer transactional email boundary.
 *
 * Mirrors AlertService's three decisions:
 *
 *  1. WHEN — only real business events reported by the existing services
 *     (created / confirmed / cancelled / delivered order, processed
 *     return), always deferred with DB::afterCommit() so the business
 *     transaction finishes first. Nothing here re-runs or re-decides any
 *     workflow step.
 *  2. WHO — Customer.email, and only when it is present and syntactically
 *     valid. Missing, empty or malformed addresses are a logged skip, never
 *     an error: the operation that produced the event always succeeds.
 *  3. HOW — best-effort by design: every failure is contained and logged
 *     with the event name and record id (never the payload, never
 *     credentials), so an SMTP outage can never roll back an order,
 *     confirmation, cancellation, delivery or return.
 *
 * Queue-ready by construction — delivery is already an isolated, post-commit
 * side effect — but nothing here implements ShouldQueue: queuing belongs to
 * Phase 30.
 */
class TransactionalEmailService
{
    public function orderCreated(Order $order): void
    {
        $this->send('order_created', $order->id, $order->customer, fn (): Notification => new OrderCreatedNotification($order));
    }

    public function orderConfirmed(Order $order): void
    {
        $this->send('order_confirmed', $order->id, $order->customer, fn (): Notification => new OrderConfirmedNotification($order));
    }

    public function orderCancelled(Order $order): void
    {
        $this->send('order_cancelled', $order->id, $order->customer, fn (): Notification => new OrderCancelledNotification($order));
    }

    public function orderDelivered(Order $order): void
    {
        $this->send('order_delivered', $order->id, $order->customer, fn (): Notification => new OrderDeliveredNotification($order));
    }

    public function returnProcessed(SalesReturn $return): void
    {
        $this->send('sales_return_processed', $return->id, $return->order?->customer, fn (): Notification => new SalesReturnProcessedNotification($return));
    }

    /**
     * Register the delivery for after the outermost commit (immediate when
     * no transaction is open). Registration itself is wrapped too: even a
     * broken transaction manager must degrade to a logged no-op, never to a
     * failed business request.
     *
     * @param  callable(): Notification  $makeNotification
     */
    private function send(string $event, int $recordId, ?Customer $customer, callable $makeNotification): void
    {
        try {
            DB::connection()->afterCommit(function () use ($event, $recordId, $customer, $makeNotification): void {
                $this->deliver($event, $recordId, $customer, $makeNotification);
            });
        } catch (\Throwable $e) {
            Log::warning('transactional email could not be scheduled', [
                'event' => $event,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Validate the recipient, then attempt delivery. Every exit path here
     * returns normally: a skip is logged for traceability, a failure is
     * logged for troubleshooting, and neither is ever rethrown.
     *
     * @param  callable(): Notification  $makeNotification
     */
    private function deliver(string $event, int $recordId, ?Customer $customer, callable $makeNotification): void
    {
        try {
            if (! $customer) {
                Log::info('transactional email skipped', [
                    'event' => $event,
                    'record_id' => $recordId,
                    'reason' => 'customer missing',
                ]);

                return;
            }

            $address = trim((string) $customer->email);

            if ($address === '') {
                Log::info('transactional email skipped', [
                    'event' => $event,
                    'record_id' => $recordId,
                    'customer_id' => $customer->id,
                    'reason' => 'customer has no email address',
                ]);

                return;
            }

            if (filter_var($address, FILTER_VALIDATE_EMAIL) === false) {
                Log::info('transactional email skipped', [
                    'event' => $event,
                    'record_id' => $recordId,
                    'customer_id' => $customer->id,
                    'reason' => 'customer email address is not valid',
                ]);

                return;
            }

            NotificationFacade::route('mail', $address)->notify($makeNotification());
        } catch (\Throwable $e) {
            Log::warning('transactional email failed', [
                'event' => $event,
                'record_id' => $recordId,
                'customer_id' => $customer?->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
