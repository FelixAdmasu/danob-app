<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\User;
use App\Notifications\AlertMailNotification;
use App\Notifications\AlertNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Phase 28 — operational alert boundary.
 *
 * One small service owns the three decisions every alert needs:
 *
 *  1. WHEN — callers only report a real event (a stock status transition,
 *     a committed order/PO/return state change). Nothing here recomputes
 *     quantities: stock alerts read ProductVariant::stockStatus(), the
 *     single inventory authority, and only act on a transition INTO
 *     low_stock / out_of_stock, so a page refresh can never re-alert.
 *  2. WHO — recipient roles are fixed per alert family and mirror the
 *     route groups in routes/web.php, so a notification can only ever point
 *     at a page its recipient is authorized to open.
 *  3. HOW — delivery is deferred with DB::afterCommit() and every step is
 *     best-effort: an alert is a side effect and can never roll back or
 *     fail the business transaction that produced it. Phase 29: the same
 *     dispatch also carries the mail-only $context rows, so the alert
 *     families listed in AlertMailNotification::MAIL_TYPES reach the same
 *     role-based recipients by email under the identical guarantees.
 *     Phase 30: each recipient now gets two notifications after commit —
 *     AlertNotification (database, synchronous → the centre is immediate)
 *     and AlertMailNotification (mail, queued → the request never waits
 *     on SMTP, and ShouldQueueAfterCommit keeps the job invisible until
 *     the business transaction has committed).
 */
class AlertService
{
    /** Can open admin.products.* and admin.inventory.* (stock levels, thresholds). */
    public const INVENTORY_ROLES = ['admin', 'manager'];

    /** Can open admin.purchase-orders.* (receiving, suppliers, costs). */
    public const PURCHASING_ROLES = ['admin', 'manager'];

    /** Can open admin.orders.* — index/create/store/show, incl. returns data. */
    public const SALES_ROLES = ['admin', 'manager', 'staff'];

    /**
     * Persist one alert for every authorized user. Delivered after the
     * outermost transaction commits (immediately when none is open);
     * never throws.
     *
     * $context is Phase 29 mail-only detail (label => value rows) for the
     * alert families that also send an email; it is ignored by the
     * database channel, so the in-app payload stays exactly as Phase 28
     * defined it.
     *
     * @param  array<string, string|array<int, string>>  $context
     */
    public function dispatch(string $type, string $severity, string $title, string $message, ?string $url, array $roles, array $context = []): void
    {
        try {
            DB::connection()->afterCommit(function () use ($type, $severity, $title, $message, $url, $roles, $context): void {
                foreach ($this->recipients($roles) as $user) {
                    try {
                        // Phase 30: one synchronous database notification
                        // (immediate in-app state) and one queued mail
                        // notification (via() decides whether the alert
                        // family and address justify a job at all). Both
                        // run after the business commit; a failure of
                        // either is contained to this recipient.
                        $user->notify(new AlertNotification($type, $severity, $title, $message, $url, $context));
                        $user->notify(new AlertMailNotification($type, $severity, $title, $message, $url, $context));
                    } catch (\Throwable) {
                        // A single recipient must never break the others, and
                        // an alert must never surface as a request failure.
                    }
                }
            });
        } catch (\Throwable) {
            // No transaction manager available: dropping an alert is the
            // correct failure mode — it is never worth failing a request.
        }
    }

    /**
     * Stock level alert, driven purely by a status transition reported by
     * InventoryService:
     *
     *   in_stock -> low_stock     one "low_stock" alert
     *   in_stock -> out_of_stock  one "out_of_stock" alert
     *   low_stock -> out_of_stock one "out_of_stock" alert
     *   anything -> in_stock      no alert (restock re-arms future ones)
     *   unchanged status          no alert (no duplicate on repeat moves)
     */
    public function stockTransition(int $variantId, string $before, string $after): void
    {
        if ($before === $after || $after === ProductVariant::STOCK_STATUS_IN_STOCK) {
            return;
        }

        $variant = ProductVariant::with('product')->find($variantId);

        if (! $variant) {
            return;
        }

        $product = $variant->product?->name;
        $label = $product ? $product.' — '.$variant->name : $variant->name;
        $url = $variant->product ? route('admin.products.show', $variant->product) : null;

        if ($after === ProductVariant::STOCK_STATUS_OUT_OF_STOCK) {
            $this->dispatch(
                'out_of_stock',
                'critical',
                'Out of stock',
                $label.' is out of stock.',
                $url,
                self::INVENTORY_ROLES,
                $this->stockContext($variant),
            );

            return;
        }

        $this->dispatch(
            'low_stock',
            'warning',
            'Low stock',
            $label.' has '.$variant->quantity.' left, at or below its low-stock threshold of '.$variant->low_stock_threshold.'.',
            $url,
            self::INVENTORY_ROLES,
            $this->stockContext($variant),
        );
    }

    /**
     * Phase 29: structured detail for the stock alert email. Values are the
     * same authoritative fields the message already reports — nothing is
     * recomputed here, ProductVariant::stockStatus() remains the only
     * authority for whether an alert fires at all.
     *
     * @return array<string, string>
     */
    private function stockContext(ProductVariant $variant): array
    {
        return [
            'Product' => $variant->product?->name ? $variant->product->name.' — '.$variant->name : $variant->name,
            'On hand' => (string) $variant->quantity,
            'Low-stock threshold' => $variant->low_stock_threshold === null ? 'not set' : (string) $variant->low_stock_threshold,
        ];
    }

    /**
     * Users whose role grants access to the destination of an alert.
     * super_admin passes every isRole() check, so it is included with each
     * family. One bounded query, no per-user lookups.
     *
     * @param  array<int, string>  $roles
     * @return Collection<int, User>
     */
    private function recipients(array $roles): iterable
    {
        return User::query()
            ->where(fn ($query) => $query->whereIn('role', $roles)->orWhere('role', 'super_admin'))
            ->orderBy('id')
            ->get();
    }
}
