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
 *
 * Phase 29 — the same alert additionally travelled on the mail channel
 * from this class. Phase 30 moved that mail leg to AlertMailNotification
 * (ShouldQueue): a queued notification is queued per channel, so keeping
 * 'mail' here would have forced the database channel onto the queue and
 * delayed the in-app centre. This class now always delivers synchronously
 * after commit, exactly as Phase 28 defined it.
 */
class AlertNotification extends Notification
{
    /** Severity vocabulary shared with the UI's existing badge tones. */
    public const SEVERITIES = ['success', 'warning', 'info', 'critical'];

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
     * Database channel only, always synchronously: the notification centre
     * must never wait on a worker. The email twin is dispatched separately
     * by AlertService as AlertMailNotification.
     *
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
