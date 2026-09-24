import * as React from 'react';

import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Premium table primitives (every admin table renders identically):
 * - quiet sticky header: transparent band on the card surface, micro-caps
 *   labels and a single hairline rule (no heavy filled band)
 * - airy rows: 14px vertical padding, hairline rules at 50% border opacity,
 *   soft sage hover wash
 * - card-gutter alignment: first/last cells inset to the card's 24px
 *   padding (pl/pr-6) while columns stay on the 4px grid (px-4)
 * - centered empty state in a rounded icon tile
 */
function Table({ className, children, ...props }: React.ComponentProps<'table'>) {
    return (
        <div data-slot="table-scroll" className="relative max-h-[70vh] w-full overflow-auto">
            <table
                data-slot="table"
                className={cn(
                    'w-full caption-bottom text-sm [&_td:first-child]:pl-6 [&_th:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:last-child]:pr-6',
                    className,
                )}
                {...props}
            >
                {children}
            </table>
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return (
        <thead
            data-slot="table-header"
            className={cn('bg-card sticky top-0 z-10 [&_tr]:border-b [&_tr]:border-border/70', className)}
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
                'h-11 whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase',
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
            className={cn('border-border/50 border-b transition-colors hover:bg-muted/50', className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td data-slot="table-cell" className={cn('px-4 py-3.5 align-middle', className)} {...props} />;
}

/**
 * Centered empty-state cell in a rounded icon tile. Plain-text children get
 * the tile treatment; richer ReactNode children pass through untouched.
 */
function TableEmpty({ colSpan, className, children, ...props }: React.ComponentProps<'td'> & { colSpan: number }) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn('px-6 py-16 text-center text-sm text-muted-foreground', className)} {...props}>
                {typeof children === 'string' ? (
                    <span className="flex flex-col items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl border border-border/60 bg-muted/60">
                            <Inbox className="size-5 text-muted-foreground/70" aria-hidden="true" />
                        </span>
                        <span>{children}</span>
                    </span>
                ) : (
                    children
                )}
            </td>
        </tr>
    );
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty };
