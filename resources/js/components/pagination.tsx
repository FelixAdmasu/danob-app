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
 * Modern treatment: taller transparent pills with a soft primary
 * tint on hover, and a solid primary pill with chevron icons
 * for prev/next. Renders nothing on single-page sets.
 */
export function Pagination({
    links,
    className,
}: {
    links: PaginationLink[];
    className?: string;
}) {
    return (
        <nav
            aria-label="Pagination"
            className={cn(
                'flex flex-wrap items-center justify-center gap-1.5',
                className,
            )}
        >
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        className={cn(
                            'inline-flex min-w-[36px] items-center justify-center gap-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all duration-200',
                            link.active
                                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground bg-transparent',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-[36px] items-center justify-center px-3 py-2 text-[13px] opacity-40"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
