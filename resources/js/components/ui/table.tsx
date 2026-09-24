import * as React from 'react';

import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Foundation-aligned table primitives.
 *
 * Styling rules baked in (so every admin table looks identical):
 * - solid muted header band with uppercase micro labels, sticky while the
 *   card's scrollport scrolls (tables cap at 70vh with inner scrolling)
 * - hairline row rules with a soft hover wash and no trailing border
 * - card-gutter alignment: first/last cells inset to the card's 24px padding
 *   (pl/pr-6) while the inter-column rhythm stays on the 4px grid (px-4)
 * - centered empty state with a muted glyph + text
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
            className={cn('bg-muted/80 supports-[backdrop-filter]:backdrop-blur-sm sticky top-0 z-10 [&_tr]:border-b', className)}
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
            className={cn('border-border/60 border-b transition-colors hover:bg-muted/40', className)}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td data-slot="table-cell" className={cn('px-4 py-3.5 align-middle', className)} {...props} />;
}

/**
 * Centered empty-state cell. Plain-text children get their own muted glyph;
 * richer ReactNode children (custom markup) pass through untouched.
 */
function TableEmpty({ colSpan, className, children, ...props }: React.ComponentProps<'td'> & { colSpan: number }) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn('px-6 py-16 text-center text-sm text-muted-foreground', className)} {...props}>
                {typeof children === 'string' ? (
                    <span className="flex flex-col items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-full bg-muted/70">
                            <Inbox className="size-5 opacity-40" aria-hidden="true" />
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
