<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Phase 28 — the single operational alert notification.
 *
 * Persisted through the framework's database channel (never rendered HTML,
 * never a queue): `type` in the notifications row is this class, and the
 * structured payload carries the display data the header notification
 * center needs — type, severity, title, message and an optional deep link.
 * Recipients are decided by AlertService, not by this class.
 */
class AlertNotification extends Notification
{
    /** Severity vocabulary shared with the UI's existing badge tones. */
    public const SEVERITIES = ['success', 'warning', 'info', 'critical'];

    public function __construct(
        public readonly string $alertType,
        public readonly string $severity,
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $url = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
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
}
