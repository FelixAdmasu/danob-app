import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { DonutChart } from '@/components/charts';
import Heading from '@/components/heading';
import { ProgressBar } from '@/components/progress-bar';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as OrderRoutes from '@/routes/admin/orders';
import * as ProductRoutes from '@/routes/admin/products';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import { Archive, Package, Plus, ShoppingCart, Users } from 'lucide-react';
import { StatCard } from '@/components/stat-card';

type Order = {
    id: number;
    reference_number: string;
    status: string;
    total: string;
    ordered_at: string;
    customer: { name: string } | null;
};
type VariantRow = {
    id: number;
    name: string;
    sku: string | null;
    quantity: number;
    low_stock_threshold: number | null;
    stock_status: string;
    product: { id: number; name: string };
};
type Movement = {
    id: number;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string | null;
    created_at: string;
    variant: {
        id: number;
        name: string;
        product: { id: number; name: string };
    };
    user: { name: string } | null;
};
type PurchaseOrderRow = {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string | null;
    total: string;
    supplier: { name: string } | null;
};
type Inventory = {
    metrics: {
        total_active: number;
        total_units: number;
        in_stock: number;
        low_stock: number;
        out_of_stock: number;
        monitored: number;
    };
    low_stock: VariantRow[];
    out_of_stock: VariantRow[];
    recent_movements: Movement[];
    recent_purchase_orders: PurchaseOrderRow[];
};

/** Panel in the TailAdmin card language: rounded-2xl surface, title + subtitle
    with an optional action pushed to the header right edge, and one padded
    content block below. `contentClassName` lets full-bleed content (tables)
    opt out of the side padding. */
function Panel({
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

function PanelLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
        >
            {children}
        </Link>
    );
}

export default function Dashboard({
    stats,
    recent_orders,
    inventory,
}: {
    stats: {
        products: number;
        categories: number;
        orders: number;
        customers: number;
        branches: number;
        pending_orders: number;
    };
    recent_orders: Order[];
    inventory: Inventory | null;
}) {
    const page = usePage<{ auth: { user: { role?: string } | null } }>();
    const role = (page.props.auth?.user as { role?: string } | null)?.role;
    const isAdmin =
        role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';

    const [summaryTab, setSummaryTab] = useState<
        'overview' | 'orders' | 'stock'
    >('overview');

    const m = inventory?.metrics;
    const availability =
        m && m.total_active > 0
            ? Math.round((m.in_stock / m.total_active) * 100)
            : 0;

    const statusCounts = ['pending', 'confirmed', 'delivered', 'cancelled'].map(
        (status) => ({
            status,
            label: titleCase(status),
            value: recent_orders.filter((o) => o.status === status).length,
        }),
    );

    const pending = stats.pending_orders;
    const delivered = recent_orders.filter(
        (o) => o.status === 'delivered',
    ).length;
    const confirmed = recent_orders.filter(
        (o) => o.status === 'confirmed',
    ).length;
    const cancelled = recent_orders.filter(
        (o) => o.status === 'cancelled',
    ).length;

    const summarySets: Record<
        'overview' | 'orders' | 'stock',
        { label: string; value: number }[]
    > = {
        overview: [
            { label: 'Orders', value: stats.orders },
            { label: 'Products', value: stats.products },
            { label: 'Customers', value: stats.customers },
            { label: 'Pending', value: pending },
            { label: 'Branches', value: stats.branches },
            { label: 'Categories', value: stats.categories },
        ],
        orders: [
            { label: 'Total', value: stats.orders },
            { label: 'Delivered', value: delivered },
            { label: 'Confirmed', value: confirmed },
            { label: 'Pending', value: pending },
            { label: 'Cancelled', value: cancelled },
            { label: 'Revenue', value: recent_orders.length },
        ],
        stock: [
            { label: 'Active', value: m?.total_active ?? 0 },
            { label: 'Units', value: m?.total_units ?? 0 },
            { label: 'In Stock', value: m?.in_stock ?? 0 },
            { label: 'Low', value: m?.low_stock ?? 0 },
            { label: 'Out', value: m?.out_of_stock ?? 0 },
            { label: 'Monitored', value: m?.monitored ?? 0 },
        ],
    };

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Overview"
                    title="Admin Dashboard"
                    description="Catalog, orders, inventory and purchasing at a glance."
                    actions={
                        <>
                            {isAdmin && (
                                <Button variant="outline" asChild>
                                    <Link href={ProductRoutes.create().url}>
                                        Add Product
                                    </Link>
                                </Button>
                            )}
                            {isStaffPlus && (
                                <Button asChild>
                                    <Link href={OrderRoutes.create().url}>
                                        <Plus className="size-4" />
                                        New Order
                                    </Link>
                                </Button>
                            )}
                            <input
                                type="date"
                                className="datepicker text-theme-sm shadow-theme-xs border-input bg-background text-foreground focus:ring-ring dark:text-foreground h-9 w-full max-w-28 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus-visible:outline-none xl:max-w-fit dark:border-[#33452A] dark:bg-transparent"
                                aria-label="Select a date range"
                            />
                        </>
                    }
                />

                {/* Metric strip — 4 across (TailAdmin KPI row) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Orders"
                        value={stats.orders}
                        icon={ShoppingCart}
                        hint={`${pending} pending`}
                        trend={
                            pending > 0
                                ? {
                                      value: `${pending} pending`,
                                      variant: 'warning',
                                  }
                                : undefined
                        }
                    />
                    <StatCard
                        label="Pending Orders"
                        value={stats.pending_orders}
                        icon={ShoppingCart}
                        tone={pending > 0 ? 'warning' : 'success'}
                        hint={
                            pending > 0
                                ? 'Awaiting confirmation'
                                : 'Queue is clear'
                        }
                    />
                    <StatCard
                        label="Customers"
                        value={stats.customers}
                        icon={Users}
                        hint="Registered accounts"
                    />
                    <StatCard
                        label="Products"
                        value={stats.products}
                        icon={Package}
                        hint={`Across ${stats.categories} categories`}
                    />
                    {m && (
                        <>
                            <StatCard
                                label="Active Variants"
                                value={m.total_active}
                                icon={Package}
                                hint="Tracked SKUs"
                            />
                            <StatCard
                                label="Total Units"
                                value={m.total_units}
                                icon={Archive}
                                hint="On hand, all variants"
                            />
                            <StatCard
                                label="In Stock"
                                value={m.in_stock}
                                icon={Package}
                                tone="success"
                                hint={`${availability}% of tracked variants`}
                                trend={
                                    availability >= 70
                                        ? {
                                              value: '+Healthy',
                                              variant: 'success',
                                          }
                                        : { value: 'Watch', variant: 'warning' }
                                }
                            />
                            <StatCard
                                label="Low Stock"
                                value={m.low_stock}
                                icon={Package}
                                tone={m.low_stock > 0 ? 'warning' : 'default'}
                                hint="At or below threshold"
                                trend={
                                    m.low_stock > 0
                                        ? {
                                              value: 'Alerts',
                                              variant: 'warning',
                                          }
                                        : undefined
                                }
                            />
                        </>
                    )}
                </div>

                {/* Charts row: Stock Health (7) + Order Status Mix (5) */}
                {m && (
                    <div className="grid grid-cols-12 gap-4 md:gap-6">
                        <Panel
                            className="col-span-12 xl:col-span-7"
                            title="Stock Health"
                            subtitle="Availability across active variants"
                            action={
                                <PanelLink
                                    href={InventoryRoutes.lowStock().url}
                                >
                                    View report →
                                </PanelLink>
                            }
                        >
                            <DonutChart
                                size={168}
                                centerValue={m.total_active}
                                centerLabel="Variants"
                                data={[
                                    {
                                        label: 'In stock',
                                        value: m.in_stock,
                                        color: 'var(--viz-success)',
                                    },
                                    {
                                        label: 'Low stock',
                                        value: m.low_stock,
                                        color: 'var(--viz-warning)',
                                    },
                                    {
                                        label: 'Out of stock',
                                        value: m.out_of_stock,
                                        color: 'var(--viz-danger)',
                                    },
                                ]}
                                emptyText="No tracked variants."
                            />
                            <div className="border-border mt-6 border-t pt-5">
                                <ProgressBar
                                    label="Stock availability"
                                    value={m.total_active > 0 ? m.in_stock : 0}
                                    max={m.total_active || 1}
                                    valueLabel={`${availability}%`}
                                    tone="success"
                                    showValue
                                />
                            </div>
                        </Panel>

                        <Panel
                            className="col-span-12 xl:col-span-5"
                            title="Order Status Mix"
                            subtitle="Share of the latest orders by status"
                            action={
                                <PanelLink href={OrderRoutes.index().url}>
                                    View all →
                                </PanelLink>
                            }
                        >
                            <DonutChart
                                size={150}
                                centerValue={recent_orders.length}
                                centerLabel="Recent"
                                data={[
                                    {
                                        label: 'Pending',
                                        value: pending,
                                        color: 'var(--viz-warning)',
                                    },
                                    {
                                        label: 'Confirmed',
                                        value: confirmed,
                                        color: 'var(--chart-3)',
                                    },
                                    {
                                        label: 'Delivered',
                                        value: delivered,
                                        color: 'var(--viz-success)',
                                    },
                                ]}
                                emptyText="No recent orders."
                            />
                            {recent_orders.length > 0 && (
                                <div className="border-border divide-border mt-6 grid grid-cols-4 divide-x border-t pt-4">
                                    {statusCounts.map((s) => (
                                        <div
                                            key={s.status}
                                            className="flex flex-col items-center gap-1 px-1"
                                        >
                                            <span className="text-muted-foreground text-[10px] leading-3 font-semibold tracking-[0.12em] uppercase">
                                                {s.label}
                                            </span>
                                            <span className="text-xl leading-none font-bold tabular-nums">
                                                {s.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </div>
                )}

                {/* Statistics card with segmented tabs (client-side toggle) */}
                <Panel
                    title="Dashboard Summary"
                    subtitle="Key figures for the current period"
                    action={
                        <div className="flex items-center gap-2">
                            {(['overview', 'orders', 'stock'] as const).map(
                                (key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSummaryTab(key)}
                                        className={cn(
                                            'text-theme-sm rounded-md px-3 py-1.5 font-medium transition-colors',
                                            summaryTab === key
                                                ? 'shadow-theme-xs bg-white text-gray-900 dark:bg-[#18240F] dark:text-white'
                                                : 'hover:bg-muted/60 text-gray-500 dark:text-gray-400 dark:hover:bg-[#1C2B12]',
                                        )}
                                    >
                                        {key === 'overview'
                                            ? 'Overview'
                                            : key === 'orders'
                                              ? 'Orders'
                                              : 'Stock'}
                                    </button>
                                ),
                            )}
                        </div>
                    }
                >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                        {(summarySets[summaryTab] ?? []).map((item) => (
                            <div
                                key={item.label}
                                className="bg-muted/50 border-border rounded-xl border p-4"
                            >
                                <span className="text-muted-foreground text-xs font-semibold">
                                    {item.label}
                                </span>
                                <p className="mt-1.5 text-2xl font-bold tabular-nums">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Recent orders — full-width data table */}
                <Panel
                    title="Recent Orders"
                    subtitle="Latest orders across all branches"
                    action={
                        <PanelLink href={OrderRoutes.index().url}>
                            View all orders →
                        </PanelLink>
                    }
                    contentClassName="px-0 pb-4 sm:px-0"
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recent_orders.length === 0 ? (
                                <TableEmpty colSpan={5}>
                                    No orders yet.
                                </TableEmpty>
                            ) : (
                                recent_orders.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell className="font-mono text-sm">
                                            {o.reference_number}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {o.customer?.name || 'Guest'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(o.ordered_at)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {o.total}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={o.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Panel>

                {m && (
                    <>
                        {/* Alert lists */}
                        <div className="grid grid-cols-12 gap-4 md:gap-6">
                            <Panel
                                className="col-span-12 lg:col-span-6"
                                title="Low Stock Variants"
                                subtitle="At or below their reorder point"
                                action={
                                    <PanelLink
                                        href={InventoryRoutes.lowStock().url}
                                    >
                                        View all →
                                    </PanelLink>
                                }
                            >
                                {inventory!.low_stock.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Nothing needs restocking right now.
                                    </p>
                                ) : (
                                    <ul className="flex flex-col gap-4">
                                        {inventory!.low_stock.map((v) => {
                                            const threshold =
                                                v.low_stock_threshold ?? 0;
                                            return (
                                                <li
                                                    key={v.id}
                                                    className="flex flex-col gap-1.5"
                                                >
                                                    <div className="flex items-baseline justify-between gap-3 text-xs">
                                                        <span className="text-foreground min-w-0 truncate font-medium">
                                                            {v.product.name} —{' '}
                                                            {v.name}
                                                            <span className="text-muted-foreground ml-2 font-normal">
                                                                {v.sku ||
                                                                    'No SKU'}
                                                            </span>
                                                        </span>
                                                        <span className="text-muted-foreground shrink-0 font-mono tabular-nums">
                                                            {v.quantity} /{' '}
                                                            {threshold}
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        value={v.quantity}
                                                        max={
                                                            threshold > 0
                                                                ? threshold
                                                                : 1
                                                        }
                                                        tone="warning"
                                                        barClassName={
                                                            v.quantity === 0
                                                                ? 'bg-red-500 dark:bg-red-400'
                                                                : undefined
                                                        }
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </Panel>

                            <Panel
                                className="col-span-12 lg:col-span-6"
                                title="Out of Stock"
                                subtitle="Zero units on hand"
                                action={
                                    <PanelLink
                                        href={
                                            InventoryRoutes.lowStock({
                                                query: { status: 'out' },
                                            }).url
                                        }
                                    >
                                        View all →
                                    </PanelLink>
                                }
                            >
                                {inventory!.out_of_stock.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Everything on the shelf.
                                    </p>
                                ) : (
                                    <ul className="divide-border/70 flex flex-col divide-y">
                                        {inventory!.out_of_stock.map((v) => (
                                            <li
                                                key={v.id}
                                                className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                                            >
                                                <div className="min-w-0">
                                                    <Link
                                                        href={
                                                            ProductRoutes.show(
                                                                v.product.id,
                                                            ).url
                                                        }
                                                        className="block truncate text-sm font-medium hover:underline"
                                                    >
                                                        {v.product.name} —{' '}
                                                        {v.name}
                                                    </Link>
                                                    <p className="text-muted-foreground font-mono text-xs">
                                                        {v.sku || 'No SKU'}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="destructive"
                                                    className="shrink-0"
                                                >
                                                    Out of Stock
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Panel>
                        </div>

                        {/* Activity lists */}
                        <div className="grid grid-cols-12 gap-4 md:gap-6">
                            <Panel
                                className="col-span-12 lg:col-span-6"
                                title="Recent Stock Movements"
                                subtitle="Latest ledger entries"
                                action={
                                    <PanelLink
                                        href={InventoryRoutes.history().url}
                                    >
                                        Full history →
                                    </PanelLink>
                                }
                            >
                                {inventory!.recent_movements.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        The ledger is empty.
                                    </p>
                                ) : (
                                    <ul className="divide-border/70 flex flex-col divide-y">
                                        {inventory!.recent_movements.map(
                                            (mv) => (
                                                <li
                                                    key={mv.id}
                                                    className="flex items-start justify-between gap-3 py-2.5 first:pt-0"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {
                                                                mv.variant
                                                                    .product
                                                                    .name
                                                            }{' '}
                                                            — {mv.variant.name}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {formatDateTime(
                                                                mv.created_at,
                                                            )}{' '}
                                                            ·{' '}
                                                            {mv.quantity_before}{' '}
                                                            →{' '}
                                                            {mv.quantity_after}
                                                            {mv.reason
                                                                ? ` · ${mv.reason}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                mv.quantity_after >=
                                                                mv.quantity_before
                                                                    ? 'success'
                                                                    : 'destructive'
                                                            }
                                                        >
                                                            {titleCase(
                                                                mv.movement_type,
                                                            )}
                                                        </Badge>
                                                        <span className="font-mono text-sm font-semibold">
                                                            {movementLabel(mv)}
                                                        </span>
                                                    </div>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                            </Panel>

                            <Panel
                                className="col-span-12 lg:col-span-6"
                                title="Recent Purchase Orders"
                                subtitle="Newest supplier orders"
                                action={
                                    <PanelLink
                                        href={PurchaseOrderRoutes.index().url}
                                    >
                                        View all →
                                    </PanelLink>
                                }
                            >
                                {inventory!.recent_purchase_orders.length ===
                                0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Nothing has been ordered yet.
                                    </p>
                                ) : (
                                    <ul className="divide-border/70 flex flex-col divide-y">
                                        {inventory!.recent_purchase_orders.map(
                                            (po) => (
                                                <li
                                                    key={po.id}
                                                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-sm">
                                                            {po.po_number}
                                                        </p>
                                                        <p className="text-muted-foreground truncate text-xs">
                                                            {po.supplier
                                                                ?.name ||
                                                                'Unknown supplier'}
                                                            {po.ordered_at
                                                                ? ` · ${formatDate(po.ordered_at)}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <span className="font-mono text-sm">
                                                            {po.total}
                                                        </span>
                                                        <StatusBadge
                                                            status={po.status}
                                                        />
                                                    </div>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                            </Panel>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

// Display-only signed quantity derived from the stored before/after ledger values.
function movementLabel(m: Movement): string {
    const delta = m.quantity_after - m.quantity_before;
    if (delta > 0) return `+${m.quantity}`;
    if (delta < 0) return `-${m.quantity}`;
    return `${m.quantity}`;
}
