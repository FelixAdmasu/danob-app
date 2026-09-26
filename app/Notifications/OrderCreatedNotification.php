<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * Phase 29 — customer email for a freshly created (pending) sales order.
 * Sent only when Customer.email is present and valid; the order itself
 * never depends on delivery.
 */
class OrderCreatedNotification extends CustomerOrderNotification
{
    public function toMail(object $notifiable): MailMessage
    {
        return $this->orderMail(
            subject: 'Order '.$this->order->reference_number.' received',
            heading: 'We have received your order',
            statusLabel: 'Pending',
            statusTone: 'warning',
            message: 'Thank you. Your order has been recorded and is now awaiting confirmation by our team.',
            nextStep: 'What happens next: we confirm your order, prepare it, and email you again at each step — confirmation and delivery. Keep the order number above for reference.',
        );
    }
}
