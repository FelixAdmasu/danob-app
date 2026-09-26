<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * Phase 29 — customer email for a cancelled order. The system stores no
 * cancellation reason, so none is invented: the message states the outcome
 * and how to reach us, nothing more.
 */
class OrderCancelledNotification extends CustomerOrderNotification
{
    public function toMail(object $notifiable): MailMessage
    {
        return $this->orderMail(
            subject: 'Order '.$this->order->reference_number.' cancelled',
            heading: 'Your order has been cancelled',
            statusLabel: 'Cancelled',
            statusTone: 'critical',
            message: 'Your order has been cancelled and will not be processed further. No action is needed on your side.',
            nextStep: 'If this was unexpected or you have questions, please get in touch through our website and quote the order number above.',
        );
    }
}
