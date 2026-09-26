<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Phase 29 — customer email for a processed sales return. Reports the
 * authoritative return record only: return number, order reference, the
 * returned line quantities, the stored return total and its date. A return
 * is not a monetary refund, so the email makes no refund, payment or
 * credit claims — and, like every customer email, carries no admin links.
 *
 * Phase 30 — queued like every customer email (ShouldQueue +
 * ShouldQueueAfterCommit, three attempts with ~30s/~2min backoff). This
 * class cannot reuse CustomerOrderNotification's shared order plumbing —
 * it carries a SalesReturn, not an Order — so it declares the identical
 * queue contract itself; the serialized payload stays one model id.
 */
class SalesReturnProcessedNotification extends Notification implements ShouldQueue, ShouldQueueAfterCommit
{
    /** Total delivery attempts before the job is marked failed. */
    public int $tries = 3;

    /** @var array<int, int> Seconds to wait before the 2nd and 3rd attempt. */
    public array $backoff = [30, 120];

    public function __construct(public readonly SalesReturn $return) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $return = $this->return;
        $return->loadMissing(['order.customer', 'items.productVariant.product']);

        $rows = $return->items->map(fn (SalesReturnItem $item): array => [
            'name' => $this->variantLabel($item->productVariant),
            'quantity' => (string) $item->quantity,
            'line_total' => $this->money($item->subtotal),
        ])->all();

        return (new MailMessage)
            ->subject('Return '.$return->return_number.' processed')
            ->view('emails.return', [
                'heading' => 'Your return has been processed',
                'statusLabel' => 'Processed',
                'statusTone' => 'info',
                // "body", never "message": Mailer injects a Message object
                // into $message and would overwrite the copy.
                'body' => 'We have processed your return for the order listed below. The returned items and quantities are summarised here for your records.',
                'returnNumber' => $return->return_number,
                'reference' => $return->order?->reference_number ?? '—',
                'returnDate' => $return->returned_at?->format('M j, Y'),
                'customerName' => $this->customerName($return->order?->customer),
                'rows' => $rows,
                'total' => $this->money($return->total),
                'nextStep' => 'Keep this email with your records. If you have questions about the return, please contact us through our website and quote the return number above.',
            ]);
    }

    private function customerName(?Customer $customer): string
    {
        $name = trim(($customer->company_name ?? '').' '.($customer->contact_name ?? ''));

        return $name !== '' ? $name : 'customer';
    }

    private function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function variantLabel(?ProductVariant $variant): string
    {
        if (! $variant) {
            return 'Returned item';
        }

        return $variant->product ? $variant->product->name.' — '.$variant->name : $variant->name;
    }
}
