import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as AdminRoutes from '@/routes/admin';
import { Loader2, Search } from 'lucide-react';

type SearchResult = {
    type: string;
    label: string;
    subtitle: string | null;
    status: string | null;
    url: string;
};

type SearchGroup = {
    key: string;
    label: string;
    items: SearchResult[];
};

type IndexedResult = SearchResult & { index: number };

const DEBOUNCE_MS = 300;

/**
 * Global search box for the admin header (Phase 27).
 *
 * Server-authoritative: every keystroke is debounced and fetched from the
 * bounded `admin.search` JSON endpoint — nothing is searched client-side.
 * Results render as grouped links in a small panel using the app's own
 * badge/input visual language (no new design system), with full keyboard
 * support (Arrow keys move, Enter opens, Escape closes), an ARIA combobox
 * contract, explicit loading / error / empty states and click-outside to
 * dismiss. Visiting a result clears the box, exactly like a jump should.
 */
export function GlobalSearch({ className }: { className?: string }) {
    const [term, setTerm] = useState('');
    const [groups, setGroups] = useState<SearchGroup[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [active, setActive] = useState(-1);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = term.trim();
    const showPanel = open && trimmed !== '';

    // Indexed copy of the current result set: stable positions for keyboard
    // navigation, aria-activedescendant and scroll-into-view.
    const indexedGroups = useMemo(() => {
        let index = -1;
        return groups.map((group) => ({
            ...group,
            items: group.items.map((item): IndexedResult => ({ ...item, index: (index += 1) })),
        }));
    }, [groups]);

    const flatItems = useMemo(() => indexedGroups.flatMap((group) => group.items), [indexedGroups]);

    // Debounced, abortable server lookup. An empty term resets everything
    // without ever issuing a request.
    useEffect(() => {
        const query = term.trim();

        if (query === '') {
            abortRef.current?.abort();
            setGroups([]);
            setLoading(false);
            setFailed(false);
            setActive(-1);

            return;
        }

        const timeout = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            setFailed(false);

            try {
                const response = await fetch(AdminRoutes.search({ query: { search: query } }).url, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Search failed with status ${response.status}`);
                }

                const payload = (await response.json()) as { groups?: SearchGroup[] };
                setGroups(Array.isArray(payload.groups) ? payload.groups : []);
                setActive(-1);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                setGroups([]);
                setFailed(true);
            } finally {
                if (abortRef.current === controller) {
                    setLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [term]);

    // Abort any in-flight request when the box unmounts.
    useEffect(() => () => abortRef.current?.abort(), []);

    // Dismiss when clicking anywhere outside the box/panel.
    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, []);

    // Keep the keyboard-highlighted result visible inside the panel.
    useEffect(() => {
        if (active < 0) {
            return;
        }

        document.getElementById(`global-search-result-${active}`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const goTo = (item: IndexedResult) => {
        setOpen(false);
        setTerm('');
        setGroups([]);
        setActive(-1);
        router.visit(item.url);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            if (showPanel) {
                event.preventDefault();
                setOpen(false);
            }

            return;
        }

        if (!showPanel || flatItems.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current) => (current + 1) % flatItems.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => (current <= 0 ? flatItems.length - 1 : current - 1));
        } else if (event.key === 'Enter') {
            const target = flatItems[active >= 0 ? active : 0];
            if (target) {
                event.preventDefault();
                goTo(target);
            }
        }
    };

    return (
        <div ref={wrapperRef} className={cn('relative', className)}>
            <Search aria-hidden="true" className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
                type="text"
                value={term}
                onChange={(event) => {
                    setTerm(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    if (trimmed !== '') {
                        setOpen(true);
                    }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search Danob..."
                aria-label="Search products, orders, customers and more"
                role="combobox"
                aria-expanded={showPanel}
                aria-controls="global-search-results"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? `global-search-result-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
                className="h-9 pl-9 pr-9"
            />
            {loading && (
                <Loader2 aria-hidden="true" className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}

            {showPanel && (
                <div
                    id="global-search-results"
                    className="border-border/70 bg-background absolute right-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg dark:border-border/60"
                >
                    <div role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto py-1">
                        {loading && groups.length === 0 ? (
                            <p className="text-muted-foreground px-3 py-4 text-center text-sm">Searching…</p>
                        ) : failed ? (
                            <p className="text-muted-foreground px-3 py-4 text-center text-sm">Search failed. Try again.</p>
                        ) : flatItems.length === 0 ? (
                            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
                                No results for “{trimmed}”.
                            </p>
                        ) : (
                            indexedGroups.map((group) => (
                                <div key={group.key} role="group" aria-label={group.label}>
                                    <div aria-hidden="true" className="border-border/60 text-muted-foreground flex items-center gap-2 border-b px-3 py-1.5">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider">{group.label}</span>
                                        <span className="bg-border/70 h-px flex-1" />
                                    </div>
                                    {group.items.map((item) => (
                                        <div
                                            key={`${group.key}-${item.index}`}
                                            id={`global-search-result-${item.index}`}
                                            role="option"
                                            aria-selected={active === item.index}
                                            onMouseMove={() => setActive(item.index)}
                                            onClick={() => goTo(item)}
                                            className={cn(
                                                'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left outline-none',
                                                active === item.index ? 'bg-muted' : 'hover:bg-muted/70',
                                            )}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{item.label}</span>
                                                {item.subtitle && <span className="text-muted-foreground block truncate text-xs">{item.subtitle}</span>}
                                            </span>
                                            {item.status && <StatusBadge status={item.status} className="shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
