import * as React from 'react';

import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Premium table primitives.
 *
 * Design rules baked in (so every admin table looks identical):
 * - card-colored sticky header with a backdrop blur — rows scroll under it
 *   instead of sitting beneath a filled color band
 * - sentence-case 12px semibold column labels in muted foreground (no
 *   uppercase micro-type)
 * - hairline row rules at 40% border opacity with a soft green hover wash
 * - airier 14px cell rhythm, card-gutter alignment on first/last cells
 *   (pl/pr-6) while inter-column padding stays on the 4px grid (px-4)
 * - centered empty state: muted glyph in a soft circle + medium text
 * - tables cap at 70vh with an inner scrollport (keeps page rhythm)
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
            className={cn(
                'bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 border-b border-border/60 backdrop-blur-sm',
                className,
            )}
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
            className={cn('h-11 px-4 py-3 text-left text-xs font-semibold tracking-normal text-muted-foreground', className)}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return (
        <tr
            data-slot="table-row"
            className={cn('border-b border-border/40 transition-colors hover:bg-muted/50', className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td data-slot="table-cell" className={cn('px-4 py-3.5 align-middle', className)} {...props} />;
}

/**
 * Centered empty-state cell. Plain-text children get their own glyph in a
 * soft circle; richer ReactNode children (custom markup) pass through
 * untouched.
 */
function TableEmpty({ colSpan, className, children, ...props }: React.ComponentProps<'td'> & { colSpan: number }) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn('px-6 py-16 text-center text-sm text-muted-foreground', className)} {...props}>
                {typeof children === 'string' ? (
                    <span className="flex flex-col items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                            <Inbox className="size-4 text-muted-foreground/70" aria-hidden="true" />
                        </span>
                        <span className="font-medium">{children}</span>
                    </span>
                ) : (
                    children
                )}
            </td>
        </tr>
    );
}

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmpty };
