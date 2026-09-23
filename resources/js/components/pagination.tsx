import { Link } from '@inertiajs/react';

import { cn } from '@/lib/utils';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

/**
 * Shared Laravel paginator controls.
 *
 * Replaces the pill-row markup that was duplicated on every index page:
 * active page = solid primary pill, inactive = bordered card pill with a
 * soft accent hover, ellipsis = dimmed. Renders nothing on single-page sets
 * (callers still guard with `last_page > 1`).
 */
export function Pagination({
    links,
    className,
}: {
    links: PaginationLink[];
    className?: string;
}) {
    return (
        <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        className={cn(
                            'inline-flex min-w-8 justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                            link.active
                                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-8 justify-center px-3 py-1.5 text-xs opacity-40"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
