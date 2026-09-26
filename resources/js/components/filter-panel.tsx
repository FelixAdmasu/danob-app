import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';

/**
 * Shared filter panel for every list, ledger and report page.
 *
 * Modern layout contract:
 * - fields live in a padded responsive grid with clear labels
 * - controls wrap into clean rows
 * - a refined footer keeps actions right-aligned with a small
 *   active-filter hint on the left
 */
export function FilterPanel({
    onSubmit,
    onClear,
    activeCount = 0,
    actions,
    children,
    className,
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
    activeCount?: number;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                'border-border/70 bg-card/80 dark:border-border/60 rounded-xl border shadow-xs backdrop-blur-sm transition-colors dark:shadow-none',
                className,
            )}
        >
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {children}
            </div>
            <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                <p className="text-muted-foreground text-xs">
                    {activeCount > 0
                        ? `Showing results for ${activeCount} active filter${activeCount === 1 ? '' : 's'}`
                        : 'No filters applied'}
                </p>
                <div className="flex items-center gap-2">
                    {actions}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClear}
                    >
                        Clear
                    </Button>
                    <Button type="submit" size="sm">
                        <Filter className="mr-2 h-4 w-4" /> Apply filters
                    </Button>
                </div>
            </div>
        </form>
    );
}

/** Label + control pair sized for the panel's field grid. */
export function FilterField({
    label,
    htmlFor,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label
                htmlFor={htmlFor}
                className="text-foreground/80 text-xs font-semibold"
            >
                {label}
            </Label>
            {children}
        </div>
    );
}
