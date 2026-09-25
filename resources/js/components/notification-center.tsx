import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import * as NotificationRoutes from '@/routes/admin/notifications';
import { Bell, Check, Loader2, RotateCw } from 'lucide-react';
import type {
    NotificationItem,
    NotificationsPayload,
    SharedNotifications,
} from '@/types';

/**
 * Severity → the app's existing badge tones (Phase 1 vocabulary): success
 * and warning stay semantic, info falls back to neutral, critical uses the
 * destructive treatment. Unknown severities degrade to neutral instead of
 * breaking the panel.
 */
const SEVERITY_TONES: Record<string, BadgeVariant> = {
    success: 'success',
    warning: 'warning',
    info: 'secondary',
    critical: 'cancelled',
};

/** Laravel's encrypted XSRF cookie, as axios-style clients read it. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Notification links are always routes of this app, but they are rendered
 * with whichever root the server had when the alert fired — APP_URL when the
 * payload was built outside a request, or a proxy's host. Visiting a foreign
 * host with a same-app route would be a cross-origin XHR that CORS blocks, so
 * navigate by path: identical for same-origin URLs, still the right page for
 * a mismatched root.
 */
function appHref(url: string): string {
    try {
        const parsed = new URL(url, window.location.href);

        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return url;
    }
}

async function post(url: string): Promise<NotificationsPayload> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
    });

    if (!response.ok) {
        throw new Error(
            `Notifications request failed with status ${response.status}`,
        );
    }

    return (await response.json()) as NotificationsPayload;
}

/**
 * Notification center for the admin header (Phase 28).
 *
 * Server-authoritative: the unread badge comes from the shared Inertia
 * payload (one COUNT), the bounded recent list is fetched only when the
 * panel opens, and both mutations answer with the fresh server state that
 * the panel adopts — nothing is ever decremented optimistically, so a
 * failed request leaves the visible state correct. The panel reuses the
 * header panel pattern and badge/typography language of the Phase 27 search
 * box, with keyboard (Escape), outside-click and screen-reader support.
 */
export function NotificationCenter({ className }: { className?: string }) {
    const page = usePage<{ notifications?: SharedNotifications }>();
    const notificationsProps = page.props.notifications;
    const sharedUnread = notificationsProps?.unread_count ?? 0;

    // Local mirror of the last server response, so marking read updates the
    // badge immediately. Every Inertia visit re-shares the count as a fresh
    // props object, which retires the mirror: the badge then shows exactly
    // what the server just said — even when the number itself did not
    // change (e.g. a dip that left 1 unread while the mirror said 0).
    const [localUnread, setLocalUnread] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => setLocalUnread(null), [notificationsProps]);

    const unreadCount = localUnread ?? sharedUnread;

    /** Adopt a complete server response (list + count) as the new state. */
    const apply = (payload: NotificationsPayload) => {
        setItems(payload.notifications);
        setLocalUnread(payload.unread_count);
        setFailed(false);
    };

    const load = async (signal?: AbortSignal) => {
        setLoading(true);
        setFailed(false);

        try {
            const response = await fetch(NotificationRoutes.index().url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(
                    `Notifications failed with status ${response.status}`,
                );
            }

            apply((await response.json()) as NotificationsPayload);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            setFailed(true);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    // Fetch the bounded list each time the panel opens; abort on close.
    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;
        void load(controller.signal);

        return () => controller.abort();
    }, [open]);

    // Dismiss on outside click or Escape.
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
        }
    };

    const markRead = async (item: NotificationItem) => {
        if (item.read || busy) {
            return;
        }

        setBusy(true);

        try {
            apply(await post(NotificationRoutes.read(item.id).url));
        } catch {
            // No optimistic change was made: the unread state on screen is
            // still the server's, and the failure is surfaced to the user.
            toast.error('Could not mark the notification as read. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const markAllRead = async () => {
        if (busy || unreadCount === 0) {
            return;
        }

        setBusy(true);

        try {
            apply(await post(NotificationRoutes.readAll().url));
        } catch {
            toast.error('Could not mark all notifications as read. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const unreadLabel =
        unreadCount === 0
            ? 'Notifications'
            : `Notifications (${unreadCount} unread)`;

    return (
        <div
            ref={wrapperRef}
            onKeyDown={handleKeyDown}
            className={cn('relative shrink-0', className)}
        >
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-label={unreadLabel}
                aria-expanded={open}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/70 focus-visible:ring-ring relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
                <Bell aria-hidden="true" className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span
                        aria-hidden="true"
                        className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="border-border/70 bg-background dark:border-border/60 absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg">
                    <div className="border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2">
                        <span className="text-sm font-semibold">
                            Notifications
                        </span>
                        <span className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <span className="text-muted-foreground text-xs">
                                    {unreadCount} unread
                                </span>
                            )}
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => void markAllRead()}
                                    disabled={busy}
                                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-xs underline-offset-2 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && items === null ? (
                            <p className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-6 text-center text-sm">
                                <Loader2
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin"
                                />
                                Loading…
                            </p>
                        ) : failed ? (
                            <div className="text-muted-foreground px-3 py-6 text-center text-sm">
                                <p>Could not load notifications.</p>
                                <button
                                    type="button"
                                    onClick={() => void load()}
                                    className="text-foreground focus-visible:ring-ring mt-2 inline-flex items-center gap-1.5 rounded-sm text-xs font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <RotateCw
                                        aria-hidden="true"
                                        className="h-3 w-3"
                                    />
                                    Try again
                                </button>
                            </div>
                        ) : items === null || items.length === 0 ? (
                            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                                You’re all caught up.
                            </p>
                        ) : (
                            <ul
                                aria-label="Recent notifications"
                                className="py-1"
                            >
                                {items.map((item) => {
                                    const unread = !item.read;
                                    const href = item.url
                                        ? appHref(item.url)
                                        : null;
                                    const body = (
                                        <span className="text-foreground block text-sm leading-snug">
                                            {item.message}
                                        </span>
                                    );

                                    return (
                                        <li
                                            key={item.id}
                                            className={cn(
                                                'flex items-start gap-2.5 px-3 py-2.5',
                                                unread && 'bg-muted/50',
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                                                    unread
                                                        ? 'bg-primary'
                                                        : 'bg-transparent',
                                                )}
                                            />
                                            <div className="min-w-0 flex-1 space-y-1">
                                                {unread && (
                                                    <span className="sr-only">
                                                        Unread.{' '}
                                                    </span>
                                                )}
                                                <Badge
                                                    variant={
                                                        SEVERITY_TONES[
                                                            item.severity
                                                        ] ?? 'secondary'
                                                    }
                                                >
                                                    {item.title}
                                                </Badge>
                                                {href ? (
                                                    <Link
                                                        href={href}
                                                        onClick={(event) => {
                                                            // Modifier clicks keep the browser
                                                            // default (new tab/window), and an
                                                            // already-read item needs no POST.
                                                            if (
                                                                item.read ||
                                                                event.metaKey ||
                                                                event.ctrlKey ||
                                                                event.shiftKey ||
                                                                event.altKey ||
                                                                event.button !==
                                                                    0
                                                            ) {
                                                                return;
                                                            }

                                                            // The visit's GET can out-run the
                                                            // mark-read POST and hand the
                                                            // header a count that still says
                                                            // "unread", so hold navigation
                                                            // until the read has landed. A
                                                            // failed request still navigates;
                                                            // the toast explains the read that
                                                            // did not happen.
                                                            event.preventDefault();
                                                            void markRead(
                                                                item,
                                                            ).finally(() =>
                                                                router.visit(
                                                                    href,
                                                                ),
                                                            );
                                                        }}
                                                        className="hover:text-foreground focus-visible:ring-ring block rounded-sm text-sm leading-snug transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                                    >
                                                        {body}
                                                    </Link>
                                                ) : (
                                                    body
                                                )}
                                                <span className="text-muted-foreground block text-[11px]">
                                                    {item.created_at_diff}
                                                </span>
                                            </div>
                                            {unread && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void markRead(item)
                                                    }
                                                    disabled={busy}
                                                    aria-label={`Mark “${item.title}” notification as read`}
                                                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                                                >
                                                    <Check
                                                        aria-hidden="true"
                                                        className="h-3.5 w-3.5"
                                                    />
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
