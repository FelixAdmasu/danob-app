<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * Phase 29 — customer email for the confirmed → delivered transition.
 * No reviews, loyalty, tracking or promotional content: just the delivery
 * outcome and a short order summary.
 */
class OrderDeliveredNotification extends CustomerOrderNotification
{
    public function toMail(object $notifiable): MailMessage
    {
        return $this->orderMail(
            subject: 'Order '.$this->order->reference_number.' delivered',
            heading: 'Your order has been delivered',
            statusLabel: 'Delivered',
            statusTone: 'success',
            message: 'Your order has been delivered. Thank you for choosing Danob.',
            nextStep: 'If anything about your order is not right, please contact us through our website and quote the order number above so we can help.',
        );
    }
}
