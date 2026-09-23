import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Foundation-aligned table primitives.
 *
 * Styling rules baked in (so every admin table looks identical):
 * - uppercase, wide-tracked micro headers on a muted band
 * - borderless rows with a soft hover wash and no trailing border
 * - comfortable 4px-grid cell padding, medium-weight first-column emphasis
 */
function Table({ className, children, ...props }: React.ComponentProps<'table'>) {
    return (
        <div className="relative w-full overflow-x-auto">
            <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props}>
                {children}
            </table>
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return (
        <thead
            data-slot="table-header"
            className={cn('bg-muted/50 [&_tr]:border-b', className)}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
    return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-b-0', className)} {...props} />;
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
    return (
        <th
            data-slot="table-head"
            className={cn(
                'h-10 whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return (
        <tr
            data-slot="table-row"
            className={cn('border-b transition-colors hover:bg-muted/40', className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td data-slot="table-cell" className={cn('px-4 py-3 align-middle', className)} {...props} />;
}

/** Centered empty-state cell matching the foundation's muted icon + text look. */
function TableEmpty({ colSpan, className, children, ...props }: React.ComponentProps<'td'> & { colSpan: number }) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn('px-4 py-14 text-center text-sm text-muted-foreground', className)} {...props}>
                {children}
            </td>
        </tr>
    );
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty };
