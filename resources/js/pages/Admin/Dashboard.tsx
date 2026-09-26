import { Head, Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { DonutChart } from '@/components/charts';
import Heading from '@/components/heading';
import { ProgressBar } from '@/components/progress-bar';
import { StatusBadge } from '@/components/status-badge';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
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
import {
    AlertTriangle,
    Archive,
    ArrowUpDown,
    Building2,
    CheckCircle2,
    FileText,
    History,
    Layers,
    Package,
    PackagePlus,
    Plus,
    ScrollText,
    ShoppingCart,
    Tag,
    Users,
} from 'lucide-react';

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

type MetricTone = 'default' | 'success' | 'warning' | 'danger';

// Soft tinted icon chips (TailAdmin metric-card anatomy), sage on hover.
const METRIC_CHIP: Record<MetricTone, string> = {
    default:
        'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground',
    success:
        'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    warning:
        'bg-[#F0B429]/15 text-[#92400E] group-hover:bg-[#F0B429] group-hover:text-[#422006] dark:bg-[#2A2411] dark:text-[#F0B429] dark:group-hover:bg-[#F0B429] dark:group-hover:text-[#422006]',
    danger: 'bg-destructive/10 text-[#B42318] group-hover:bg-destructive group-hover:text-white dark:bg-destructive/60 dark:text-white dark:group-hover:bg-destructive',
};

const METRIC_VALUE: Record<MetricTone, string> = {
    default: 'text-foreground',
    success: 'text-[#2D5016] dark:text-[#95E6B6]',
    warning: 'text-amber-600 dark:text-[#F0B429]',
    danger: 'text-red-600 dark:text-red-400',
};

// Display-only signed quantity derived from the stored before/after ledger values.
function movementLabel(m: Movement): string {
    const delta = m.quantity_after - m.quantity_before;
    if (delta > 0) return `+${m.quantity}`;
    if (delta < 0) return `-${m.quantity}`;
    return `${m.quantity}`;
}

/**
 * TailAdmin-style KPI tile: icon chip, then a label + value row with an
 * optional status pill, closed by a caption line. Kept local to this page so
 * the shared StatCard (sales/purchase dashboards, reports) keeps its own
 * anatomy.
 */
function MetricCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    pill,
    caption,
}: {
    label: string;
    value: ReactNode;
    icon: LucideIcon;
    tone?: MetricTone;
    pill?: { label: string; variant?: BadgeVariant };
    caption?: string;
}) {
    return (
        <div className="group border-border bg-card hover:border-primary/30 relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm md:p-6 dark:shadow-none">
            <span
                className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                    METRIC_CHIP[tone],
                )}
            >
                <Icon className="size-6" aria-hidden="true" />
            </span>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p
                        className={cn(
                            'font-serif text-3xl leading-none font-medium tracking-tight tabular-nums',
                            METRIC_VALUE[tone],
                        )}
                    >
                        {value}
                    </p>
                </div>
                {pill && (
                    <Badge
                        variant={pill.variant ?? 'secondary'}
                        className="shrink-0"
                    >
                        {pill.label}
                    </Badge>
                )}
            </div>
            {caption && (
                <p className="text-muted-foreground text-xs leading-5">
                    {caption}
                </p>
            )}
        </div>
    );
}

/**
 * Dashboard panel in the TailAdmin card language: rounded-2xl surface, title
 * + subtitle with an optional action pushed to the header's right edge, and
 * one padded content block below. `contentClassName` lets full-bleed content
 * (tables) opt out of the side padding.
 */
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

// Small header link used as every panel's action ("View all →").
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
    // Mirrors the sidebar: catalog/purchasing links only for admin-level
    // roles, sales links for staff too — never a tile that 403s.
    const isAdmin =
        role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';

    const statusMix = ['pending', 'confirmed', 'delivered', 'cancelled']
        .map((status, i) => ({
            label: status,
            value: recent_orders.filter((o) => o.status === status).length,
            color: [
                'var(--viz-warning)',
                'var(--chart-3)',
                'var(--viz-success)',
                'var(--viz-danger)',
            ][i],
        }))
        .filter((d) => d.value > 0);

    const statusCounts = ['pending', 'confirmed', 'delivered', 'cancelled'].map(
        (status) => ({
            status,
            label: titleCase(status),
            value: recent_orders.filter((o) => o.status === status).length,
        }),
    );

    const m = inventory?.metrics;
    const availability =
        m && m.total_active > 0
            ? Math.round((m.in_stock / m.total_active) * 100)
            : 0;

    const catalogLinks = [
        {
            title: 'Products',
            href: '/admin/products',
            icon: Package,
            desc: 'Catalog',
        },
        {
            title: 'Categories',
            href: '/admin/categories',
            icon: Tag,
            desc: 'Groups',
        },
        {
            title: 'Brands',
            href: '/admin/brands',
            icon: Layers,
            desc: 'Brands',
        },
        {
            title: 'Branches',
            href: '/admin/branches',
            icon: Building2,
            desc: 'Locations',
        },
    ];
    const stockLinks = [
        {
            title: 'Opening Stock',
            href: '/admin/inventory/opening-stock',
            icon: Archive,
            desc: 'Initial',
        },
        {
            title: 'Stock Adjustments',
            href: '/admin/inventory/adjustments',
            icon: ArrowUpDown,
            desc: 'Correct',
        },
        {
            title: 'Inventory History',
            href: '/admin/inventory/history',
            icon: History,
            desc: 'Ledger',
        },
        ...(inventory
            ? [
                  {
                      title: 'Low Stock',
                      href: '/admin/inventory/low-stock',
                      icon: AlertTriangle,
                      desc: 'Alerts',
                  },
                  {
                      title: 'Purchase Orders',
                      href: '/admin/purchase-orders',
                      icon: FileText,
                      desc: 'Purchasing',
                  },
              ]
            : []),
    ];
    const salesLinks = [
        {
            title: 'Orders',
            href: '/admin/orders',
            icon: ShoppingCart,
            desc: 'Sales',
        },
        {
            title: 'Customers',
            href: '/admin/customers',
            icon: Users,
            desc: 'Clients',
        },
    ];
    const quickLinks = [
        ...(isAdmin ? catalogLinks : []),
        ...(isAdmin ? stockLinks : []),
        ...salesLinks,
    ];

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
                                        <PackagePlus aria-hidden="true" />
                                        Add Product
                                    </Link>
                                </Button>
                            )}
                            {isStaffPlus && (
                                <Button asChild>
                                    <Link href={OrderRoutes.create().url}>
                                        <Plus aria-hidden="true" />
                                        New Order
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />

                {/* Business KPIs — TailAdmin metric-card row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <MetricCard
                        label="Orders"
                        value={stats.orders}
                        icon={ShoppingCart}
                        pill={
                            stats.pending_orders > 0
                                ? {
                                      label: `${stats.pending_orders} pending`,
                                      variant: 'warning',
                                  }
                                : { label: 'All clear', variant: 'success' }
                        }
                        caption="Placed to date"
                    />
                    <MetricCard
                        label="Pending Orders"
                        value={stats.pending_orders}
                        icon={ScrollText}
                        tone={stats.pending_orders > 0 ? 'warning' : 'success'}
                        caption={
                            stats.pending_orders > 0
                                ? 'Awaiting confirmation'
                                : 'Queue is clear'
                        }
                    />
                    <MetricCard
                        label="Customers"
                        value={stats.customers}
                        icon={Users}
                        caption="Registered accounts"
                    />
                    <MetricCard
                        label="Products"
                        value={stats.products}
                        icon={Package}
                        caption={`Across ${stats.categories} categories`}
                    />
                    <MetricCard
                        label="Categories"
                        value={stats.categories}
                        icon={Tag}
                        caption="Catalog groups"
                    />
                    <MetricCard
                        label="Branches"
                        value={stats.branches}
                        icon={Building2}
                        caption="Active locations"
                    />
                </div>

                {m && (
                    <>
                        {/* Inventory KPIs */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <MetricCard
                                label="Active Variants"
                                value={m.total_active}
                                icon={Layers}
                                caption="Tracked SKUs"
                            />
                            <MetricCard
                                label="Total Units"
                                value={m.total_units}
                                icon={Archive}
                                caption="On hand, all variants"
                            />
                            <MetricCard
                                label="In Stock"
                                value={m.in_stock}
                                icon={CheckCircle2}
                                tone="success"
                                caption={`${availability}% of tracked variants`}
                            />
                            <MetricCard
                                label="Low Stock"
                                value={m.low_stock}
                                icon={AlertTriangle}
                                tone={m.low_stock > 0 ? 'warning' : 'default'}
                                pill={
                                    m.low_stock > 0
                                        ? {
                                              label: 'Reorder soon',
                                              variant: 'warning',
                                          }
                                        : { label: 'Clear', variant: 'success' }
                                }
                                caption="At or below threshold"
                            />
                            <MetricCard
                                label="Out of Stock"
                                value={m.out_of_stock}
                                icon={Package}
                                tone={m.out_of_stock > 0 ? 'danger' : 'default'}
                                pill={
                                    m.out_of_stock > 0
                                        ? {
                                              label: 'Unavailable',
                                              variant: 'destructive',
                                          }
                                        : undefined
                                }
                                caption="Zero on hand"
                            />
                            <MetricCard
                                label="Monitored"
                                value={m.monitored}
                                icon={ScrollText}
                                caption="With thresholds set"
                            />
                        </div>

                        {/* Chart row: Stock Health (7) + Order Status Mix (5) */}
                        <div className="grid grid-cols-12 gap-4 md:gap-5">
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
                                        value={
                                            m.total_active > 0 ? m.in_stock : 0
                                        }
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
                                    data={statusMix}
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
                                                <span className="font-serif text-lg leading-none font-semibold tabular-nums">
                                                    {s.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>
                    </>
                )}

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
                        <div className="grid grid-cols-12 gap-4 md:gap-5">
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
                        <div className="grid grid-cols-12 gap-4 md:gap-5">
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

                {/* Quick navigation — role-gated tiles */}
                <Panel title="Quick Navigation" subtitle="Jump to a workspace">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                        {quickLinks.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className="group border-border bg-card hover:border-primary/30 flex items-center gap-3 rounded-xl border p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:shadow-none"
                            >
                                <span className="bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200">
                                    <item.icon
                                        className="size-4.5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium">
                                        {item.title}
                                    </span>
                                    <span className="text-muted-foreground block truncate text-xs">
                                        {item.desc}
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </Panel>
            </div>
        </>
    );
}
