import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

/**
 * Reusable panel card in the modern admin language.
 *
 * Anatomy: rounded-2xl surface, title + subtitle with an optional
 * action pushed to the header right edge, and one padded content
 * block below. `contentClassName` lets full-bleed content (tables)
 * opt out of the side padding.
 */
export function Panel({
    title,
    subtitle,
    action,
    children,
    className,
    contentClassName,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}) {
    return (
        <section
            className={cn(
                'border-border bg-card flex flex-col rounded-2xl border shadow-xs dark:shadow-none',
                className,
            )}
        >
            <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
                <div className="min-w-0">
                    <h3 className="font-serif text-lg leading-snug font-semibold tracking-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            {subtitle}
                        </p>
                    )}
                </div>
                {action && (
                    <div className="flex shrink-0 items-center gap-2">
                        {action}
                    </div>
                )}
            </div>
            <div
                className={cn(
                    'flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6',
                    contentClassName,
                )}
            >
                {children}
            </div>
        </section>
    );
}

/** Light-text link inside a Panel header action slot. */
export function PanelLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
        >
            {children}
        </Link>
    );
}
