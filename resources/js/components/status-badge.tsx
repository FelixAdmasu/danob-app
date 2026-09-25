import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { titleCase } from '@/lib/format';

/**
 * Exact-match tone map for every status string the app renders. Unknown
 * values fall back to `secondary` (the old look), so adding a new enum
 * value never breaks a table.
 */
const STATUS_TONES: Record<string, BadgeVariant> = {
    // healthy / done
    active: 'success',
    confirmed: 'success',
    delivered: 'success',
    approved: 'success',
    received: 'success',
    in_stock: 'success',
    paid: 'success',
    completed: 'success',
    // in progress / needs attention
    pending: 'warning',
    submitted: 'warning',
    partially_received: 'warning',
    low_stock: 'warning',
    processing: 'warning',
    shipped: 'warning',
    awaiting_payment: 'warning',
    // stopped / failed
    cancelled: 'cancelled',
    canceled: 'cancelled',
    out_of_stock: 'cancelled',
    expired: 'cancelled',
    damaged: 'cancelled',
    failed: 'cancelled',
    refunded: 'cancelled',
    rejected: 'cancelled',
    overdue: 'cancelled',
    // neutral
    draft: 'secondary',
    archived: 'secondary',
    inactive: 'secondary',
};

export function statusTone(status?: string | null): BadgeVariant {
    return (status && STATUS_TONES[status.toLowerCase()]) || 'secondary';
}

/**
 * One status chip for every table: mapped tone + humanized label, so
 * `partially_received` / `active` stop rendering as raw enum strings in
 * mismatched colors.
 */
export function StatusBadge({
    status,
    className,
}: {
    status?: string | null;
    className?: string;
}) {
    if (!status) return <span className="text-muted-foreground">—</span>;
    return (
        <Badge variant={statusTone(status)} className={className}>
            {titleCase(status)}
        </Badge>
    );
}
