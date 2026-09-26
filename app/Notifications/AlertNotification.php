<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Phase 28 — the single operational alert notification.
 *
 * Persisted through the framework's database channel (never rendered HTML,
 * never a queue): `type` in the notifications row is this class, and the
 * structured payload carries the display data the header notification
 * center needs — type, severity, title, message and an optional deep link.
 * Recipients are decided by AlertService, not by this class.
 *
 * Phase 29 — the same alert may additionally travel on the mail channel,
 * but only for the alert families that are actual email events (MAIL_TYPES)
 * and only for recipients that own a valid mail address. The database
 * payload stays byte-identical to Phase 28: `context` is extra mail-only
 * detail (label => value or label => list of values) that never reaches the
 * notification centre.
 */
class AlertNotification extends Notification
{
    /** Severity vocabulary shared with the UI's existing badge tones. */
    public const SEVERITIES = ['success', 'warning', 'info', 'critical'];

    /**
     * Alert types that also produce an internal transactional email. Order
     * workflow alerts stay database-only: those events are communicated to
     * customers by the dedicated customer notifications instead, so no one
     * receives the same event twice in two shapes.
     */
    public const MAIL_TYPES = [
        'inquiry_created',
        'low_stock',
        'out_of_stock',
        'purchase_order_partially_received',
        'purchase_order_received',
    ];

    /**
     * @param  array<string, string|array<int, string>>  $context  mail-only detail rows
     */
    public function __construct(
        public readonly string $alertType,
        public readonly string $severity,
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $url = null,
        public readonly array $context = [],
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $via = ['database'];

        if (in_array($this->alertType, self::MAIL_TYPES, true) && $this->hasMailAddress($notifiable)) {
            $via[] = 'mail';
        }

        return $via;
    }

    /**
     * @return array<string, string|null>
     */
    public function toArray(object $notifiable): array
    {
        return [
            // An unknown severity must never break delivery — fall back to
            // the neutral tone instead of throwing inside a transaction.
            'severity' => in_array($this->severity, self::SEVERITIES, true) ? $this->severity : 'info',
            'type' => $this->alertType,
            'title' => $this->title,
            'message' => $this->message,
            // Null means "no safe destination": the UI renders it as plain
            // text rather than inventing a route.
            'url' => $this->url,
        ];
    }

    /**
     * Internal email form of the same alert: title, message, optional
     * detail rows and an admin link that only ever reaches internal
     * recipients (see MAIL_TYPES + AlertService role families).
     */
    public function toMail(object $notifiable): MailMessage
    {
        $severity = in_array($this->severity, self::SEVERITIES, true) ? $this->severity : 'info';

        return (new MailMessage)
            ->subject($this->title)
            ->view('emails.alert', [
                'heading' => $this->title,
                'severity' => $severity,
                'severityLabel' => str_replace('_', ' ', $this->alertType),
                // NB: never call this variable "message" — Mailer::render()
                // injects $data['message'] as the Mail Message instance and
                // would clobber the alert text.
                'body' => $this->message,
                'context' => $this->context,
                'actionUrl' => $this->url,
                'actionLabel' => 'Open in Danob',
            ]);
    }

    /**
     * A recipient without a usable address is skipped here, so the mail
     * channel is never even attempted with an empty or malformed address —
     * the database notification still lands as it always did.
     */
    private function hasMailAddress(object $notifiable): bool
    {
        try {
            $address = $notifiable->routeNotificationFor('mail', $this);
        } catch (\Throwable) {
            return false;
        }

        return is_string($address) && filter_var($address, FILTER_VALIDATE_EMAIL) !== false;
    }
}
