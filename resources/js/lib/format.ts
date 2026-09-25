/**
 * Shared display formatters.
 *
 * One canonical style for dates, times and enum strings so every admin
 * table reads the same — no more mix of raw toLocaleDateString() output,
 * long toLocaleString() stamps and snake_case badge labels.
 */

/** "Sep 23, 2026" — locale-independent. */
export function formatDate(value?: string | number | Date | null): string {
    const date = toDate(value);
    return date
        ? date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';
}

/** "2:02 PM". */
export function formatTime(value?: string | number | Date | null): string {
    const date = toDate(value);
    return date
        ? date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
          })
        : '—';
}

/** "Sep 23, 2026, 2:02 PM". */
export function formatDateTime(value?: string | number | Date | null): string {
    const date = toDate(value);
    return date ? `${formatDate(date)}, ${formatTime(date)}` : '—';
}

/** "pending_payment" → "Pending Payment" for status badges. */
export function titleCase(value?: string | null): string {
    if (!value) return '—';
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toDate(value?: string | number | Date | null): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
