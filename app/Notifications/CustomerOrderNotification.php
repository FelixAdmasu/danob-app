<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Phase 29 — shared plumbing for customer-facing sales order emails.
 *
 * via() is ['mail'] only: customer emails are addressed directly through
 * Notification::route('mail', ...) and never write rows into the database
 * notification centre (that stays the internal, role-scoped system).
 *
 * The view only ever receives authoritative order values — reference,
 * status, line quantities, stored prices and stored totals. No calculation
 * is introduced here, and no admin URL, stock level, supplier name or
 * internal note may cross into customer content.
 */
abstract class CustomerOrderNotification extends Notification
{
    public function __construct(public readonly Order $order) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the shared order email: subject, heading, status chip, the
     * order's own items/prices/totals and a concise next-step note.
     *
     * @param  array<int, array{name: string, quantity: string, unit_price: string, line_total: string}>  $rows
     */
    protected function orderMail(
        string $subject,
        string $heading,
        string $statusLabel,
        string $statusTone,
        string $message,
        string $nextStep,
    ): MailMessage {
        $order = $this->order;
        $order->loadMissing(['customer', 'items.productVariant.product']);

        $rows = $order->items->map(fn (OrderItem $item): array => [
            'name' => $this->variantLabel($item->productVariant),
            'quantity' => (string) $item->quantity,
            'unit_price' => $this->money($item->unit_price),
            'line_total' => $this->money($item->subtotal),
        ])->all();

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.order', [
                'heading' => $heading,
                'statusLabel' => $statusLabel,
                'statusTone' => $statusTone,
                // "body", never "message": Mailer injects a Message object
                // into $message and would overwrite the copy.
                'body' => $message,
                'reference' => $order->reference_number,
                'customerName' => $this->customerName($order->customer),
                'orderedAt' => $order->ordered_at?->format('M j, Y'),
                'rows' => $rows,
                'subtotal' => $this->money($order->subtotal),
                'total' => $this->money($order->total),
                'nextStep' => $nextStep,
            ]);
    }

    /**
     * Company first for business customers, contact name otherwise — the
     * customer record is the only name authority.
     */
    protected function customerName(?Customer $customer): string
    {
        $name = trim(($customer->company_name ?? '').' '.($customer->contact_name ?? ''));

        return $name !== '' ? $name : 'customer';
    }

    /**
     * Stored money values are already decimal(2) strings; this only formats
     * them for display and never recomputes a total.
     */
    protected function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    protected function variantLabel(?ProductVariant $variant): string
    {
        if (! $variant) {
            return 'Order item';
        }

        return $variant->product ? $variant->product->name.' — '.$variant->name : $variant->name;
    }
}
