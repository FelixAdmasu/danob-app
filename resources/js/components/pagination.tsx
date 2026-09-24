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
 * Premium treatment: taller transparent pills on the card, a soft primary
 * tint on hover, and a solid primary pill for the active page. Renders
 * nothing on single-page sets (callers still guard with `last_page > 1`).
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
                            'inline-flex min-w-9 justify-center rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors duration-200',
                            link.active
                                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                : 'border-border/70 bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-9 justify-center px-3 py-2 text-[13px] opacity-40"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
