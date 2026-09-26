<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * Phase 29 — customer email for the pending → confirmed transition. Stock
 * deduction is an internal matter and is deliberately not exposed here.
 */
class OrderConfirmedNotification extends CustomerOrderNotification
{
    public function toMail(object $notifiable): MailMessage
    {
        return $this->orderMail(
            subject: 'Order '.$this->order->reference_number.' confirmed',
            heading: 'Your order is confirmed',
            statusLabel: 'Confirmed',
            statusTone: 'success',
            message: 'Good news — your order has been confirmed by our team.',
            nextStep: 'What happens next: we prepare your order and mark it delivered once it is handed over. You will receive another email at that point.',
        );
    }
}
