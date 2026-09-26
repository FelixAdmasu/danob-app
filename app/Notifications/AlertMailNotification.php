<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Phase 30 — the mail-channel half of a Phase 29 operational alert.
 *
 * Phase 29 carried database + mail on one class, but a ShouldQueue
 * notification is queued per channel by the framework, so queueing that
 * class would have delayed the in-app notification too. The split keeps
 * the two guarantees Phase 30 requires:
 *
 *   AlertNotification   database channel, sent synchronously after commit
 *                       → the notification centre stays immediate.
 *   AlertMailNotification  mail channel, queued after commit (ShouldQueue +
 *                       ShouldQueueAfterCommit) → the HTTP request never
 *                       waits on SMTP and no job can start before the
 *                       business transaction commits.
 *
 * Decision logic is unchanged from Phase 29: via() only produces 'mail'
 * for the alert families in MAIL_TYPES and only for recipients that own a
 * valid address, so a job is never queued for an undeliverable recipient.
 * Recipients themselves are still chosen by AlertService (role scoping),
 * never by this class.
 */
class AlertMailNotification extends Notification implements ShouldQueue, ShouldQueueAfterCommit
{
    /**
     * Alert types that produce an internal transactional email. Order
     * workflow alerts stay database-only: those events are communicated to
     * customers by the dedicated customer notifications instead, so no one
     * receives the same event twice in two shapes. (Same list Phase 29
     * shipped on AlertNotification.)
     */
    public const MAIL_TYPES = [
        'inquiry_created',
        'low_stock',
        'out_of_stock',
        'purchase_order_partially_received',
        'purchase_order_received',
    ];

    /**
     * Retry policy for transactional email (docs/queue.md): three total
     * attempts, waiting ~30s then ~2min before each retry — enough to ride
     * out a transient SMTP outage without looping forever. After the last
     * attempt the job lands in failed_jobs and the business data stays
     * untouched.
     */
    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 120];

    /**
     * @param  array<string, string|array<int, string>>  $context  detail rows shown under the alert email
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
     * Mail only, and only when the alert family is an email event and the
     * recipient has a usable address; otherwise no channel (and therefore
     * no queued job) is produced at all.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        if (! in_array($this->alertType, self::MAIL_TYPES, true)) {
            return [];
        }

        return $this->hasMailAddress($notifiable) ? ['mail'] : [];
    }

    /**
     * Internal email form of the same alert: title, message, optional
     * detail rows and an admin link that only ever reaches internal
     * recipients (see MAIL_TYPES + AlertService role families).
     */
    public function toMail(object $notifiable): MailMessage
    {
        $severity = in_array($this->severity, AlertNotification::SEVERITIES, true) ? $this->severity : 'info';

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
     * A recipient without a usable address never produces a channel, so
     * the mail job is not even queued for them — the database notification
     * still lands as it always did.
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
