import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { Filter } from 'lucide-react';

/**
 * Shared filter panel for every list, ledger and report page.
 *
 * Layout contract (so all filter UIs look identical):
 * - fields live in a padded responsive grid — labels always line up and
 *   controls wrap into clean rows instead of one long flex row that
 *   pushes buttons under the fields at mid widths
 * - a hairline footer keeps actions right-aligned on their own row with
 *   a small active-filter hint on the left
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
    /** Number of non-default filters; drives the footer hint. */
    activeCount?: number;
    /** Extra controls (e.g. export buttons) rendered left of Clear/Apply. */
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                'border-border/70 bg-card dark:border-border/60 rounded-xl border shadow-xs transition-colors dark:shadow-none',
                className,
            )}
        >
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {children}
            </div>
            <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
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
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}
