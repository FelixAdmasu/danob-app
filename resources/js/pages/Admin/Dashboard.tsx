import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { DonutChart } from '@/components/charts';
import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime, titleCase } from '@/lib/format';
import { Panel, PanelLink } from '@/components/panel';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as OrderRoutes from '@/routes/admin/orders';
import * as ProductRoutes from '@/routes/admin/products';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import {
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Archive,
    CheckCircle2,
    Clock,
    Package,
    RefreshCw,
    ShoppingCart,
    Tag,
    Users,
} from 'lucide-react';
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

/** Animate a number from 0 to `target` on mount. */
function AnimatedCounter({
    target,
    duration = 1100,
}: {
    target: number;
    duration?: number;
}) {
    const [display, setDisplay] = useState(0);
    const raf = useRef<number | null>(null);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setDisplay(Math.round(eased * target));
            if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [target, duration]);
    return <>{display}</>;
}

/** Vertical bar chart (orders by status) with hover highlights. */
function ColumnChart({
    data,
    height = 176,
}: {
    data: { label: string; value: number; color: string }[];
    height?: number;
}) {
    const [hover, setHover] = useState<number | null>(null);
    const max = Math.max(...data.map((d) => d.value), 1);

    const padLeft = 36;
    const padRight = 12;
    const padBottom = 26;
    const width = 400;
    const chartTop = 8;
    const chartBottom = height - padBottom;
    const chartH = chartBottom - chartTop;
    const colW = (width - padLeft - padRight) / data.length;
    const bw = colW * 0.56;

    const bars = data.map((d, i) => {
        const x = padLeft + i * colW + (colW - bw) / 2;
        const barH = max > 0 ? (d.value / max) * chartH : 0;
        const y = chartBottom - barH;
        const r = Math.min(4, barH / 2);
        const path = `M${x},${chartBottom}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${chartBottom}Z`;
        return { d, x, y, bw, barH, path };
    });

    return (
        <div className="relative w-full" style={{ height }}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full overflow-visible"
                style={{ height }}
            >
                {/* subtle horizontal gridlines */}
                {[0.25, 0.5, 0.75].map((frac, i) => (
                    <line
                        key={i}
                        x1={padLeft}
                        y1={chartBottom - frac * chartH}
                        x2={width - padRight}
                        y2={chartBottom - frac * chartH}
                        stroke="var(--border)"
                        strokeWidth={0.5}
                        strokeDasharray="4"
                    />
                ))}
                {/* bars */}
                {bars.map((b, i) => (
                    <g
                        key={b.d.label}
                        className="cursor-pointer"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                    >
                        <path
                            d={b.path}
                            fill={b.d.color}
                            className="grow-up"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                        {/* hover glow */}
                        <path
                            d={b.path}
                            fill={b.d.color}
                            opacity={hover === i ? 0.18 : 0}
                            className="grow-up"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                        {/* value label above bar */}
                        <text
                            x={b.x + b.bw / 2}
                            y={b.y - 7}
                            textAnchor="middle"
                            fill={
                                hover === i
                                    ? 'var(--foreground)'
                                    : 'var(--muted-foreground)'
                            }
                            fontSize={11}
                            fontWeight={hover === i ? 600 : 400}
                            style={{ transition: 'all 0.15s ease' }}
                        >
                            {b.d.value}
                        </text>
                    </g>
                ))}
                {/* x-axis labels */}
                {data.map((d, i) => (
                    <text
                        key={d.label}
                        x={bars[i].x + bars[i].bw / 2}
                        y={chartBottom + 15}
                        textAnchor="middle"
                        fill="var(--muted-foreground)"
                        fontSize={10}
                    >
                        {d.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}

const PERIODS = [
    { key: 'all' as const, label: 'All time' },
    { key: 'today' as const, label: 'Today' },
    { key: 'week' as const, label: 'This week' },
    { key: 'month' as const, label: 'This month' },
];

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
    const page = usePage<{
        auth: { user: { name?: string; role?: string } | null };
    }>();
    const name =
        (page.props.auth?.user as { name?: string } | null)?.name ?? 'Admin';
    const role = (page.props.auth?.user as { role?: string } | null)?.role;
    const isAdmin =
        role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';

    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>(
        'all',
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    function filterOrders() {
        return recent_orders.filter((o) => {
            const d = new Date(o.ordered_at);
            if (period === 'today')
                return d.toDateString() === now.toDateString();
            if (period === 'week')
                return now.getTime() - d.getTime() < 7 * 86400000;
            if (period === 'month')
                return now.getTime() - d.getTime() < 30 * 86400000;
            return true;
        });
    }

    const orders = filterOrders();
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;

    const m = inventory?.metrics;
    const availability =
        m && m.total_active > 0
            ? Math.round((m.in_stock / m.total_active) * 100)
            : 0;

    const statusChart = [
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
        {
            label: 'Cancelled',
            value: cancelled,
            color: 'var(--viz-danger)',
        },
    ];

    const stockDonut = m
        ? [
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
          ]
        : [];

    function statusBadge(mv: Movement) {
        const isIn = mv.quantity_after >= mv.quantity_before;
        return {
            label: isIn
                ? titleCase(mv.movement_type)
                : titleCase(mv.movement_type),
            variant: (isIn ? 'success' : 'destructive') as
                | 'success'
                | 'destructive',
        };
    }

    function movementDelta(m: Movement) {
        const delta = m.quantity_after - m.quantity_before;
        if (delta > 0)
            return (
                <span className="text-success flex items-center gap-0.5">
                    <ArrowUpRight className="size-3" /> +{m.quantity}
                </span>
            );
        if (delta < 0)
            return (
                <span className="text-destructive flex items-center gap-0.5">
                    <ArrowDownRight className="size-3" /> -
                    {Math.abs(m.quantity)}
                </span>
            );
        return <span>{m.quantity}</span>;
    }

    type KpiCard = {
        label: string;
        value: ReactNode;
        icon: LucideIcon;
        tone?: 'warning' | 'success';
        hint?: ReactNode;
        trend?: { value: string; variant: 'success' | 'warning' };
    };
    const kpiCards: KpiCard[] = [
        {
            label: 'Orders',
            value: <AnimatedCounter target={stats.orders} />,
            icon: ShoppingCart,
            hint: `${pending} pending`,
            trend:
                pending > 0
                    ? { value: `${pending} pending`, variant: 'warning' }
                    : undefined,
        },
        {
            label: 'Pending',
            value: <AnimatedCounter target={stats.pending_orders} />,
            icon: Clock,
            tone: stats.pending_orders > 0 ? 'warning' : 'success',
            hint:
                stats.pending_orders > 0
                    ? 'Awaiting confirmation'
                    : 'Queue clear',
        },
        {
            label: 'Delivered',
            value: <AnimatedCounter target={delivered} />,
            icon: CheckCircle2,
            tone: 'success',
            hint: 'Completed orders',
        },
        {
            label: 'Customers',
            value: <AnimatedCounter target={stats.customers} />,
            icon: Users,
            hint: 'Registered accounts',
        },
        {
            label: 'Products',
            value: <AnimatedCounter target={stats.products} />,
            icon: Package,
            hint: `Across ${stats.categories} categories`,
        },
        ...(m
            ? [
                  {
                      label: 'Active Variants',
                      value: <AnimatedCounter target={m.total_active} />,
                      icon: Package,
                      hint: 'Tracked SKUs',
                  },
              ]
            : [
                  {
                      label: 'Categories',
                      value: <AnimatedCounter target={stats.categories} />,
                      icon: Tag,
                      hint: 'Product categories',
                  },
              ]),
    ];

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4 md:p-6">
                {/* Gradient accent bar */}
                <div className="h-1 shrink-0 rounded-full bg-gradient-to-r from-[#2d5016] via-[#7fb069] to-[#2d5016] opacity-70" />

                {/* Header */}
                <Heading
                    eyebrow={`Good morning, ${name}`}
                    title="Dashboard"
                    description={`${dateStr} · Overview at a glance`}
                    actions={
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
                                <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-[#4a8c2a]" />
                                Live
                            </span>
                            <span className="text-muted-foreground text-xs">
                                {now.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.reload()}
                                aria-label="Refresh"
                                className="size-8"
                            >
                                <RefreshCw className="size-4" />
                            </Button>
                            {isStaffPlus && (
                                <Button asChild size="sm">
                                    <Link href={OrderRoutes.create().url}>
                                        <ShoppingCart className="size-4" />
                                        New Order
                                    </Link>
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Period selector */}
                <div className="flex shrink-0 items-center">
                    <div className="bg-muted inline-flex rounded-lg p-0.5">
                        {PERIODS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => setPeriod(p.key)}
                                className={cn(
                                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                                    period === p.key
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI tiles — fade-up on mount */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {kpiCards.map((kpi, i) => (
                        <div
                            key={kpi.label}
                            className="fade-up"
                            style={{ animationDelay: `${i * 0.07}s` }}
                        >
                            <StatCard
                                label={kpi.label}
                                value={kpi.value}
                                icon={kpi.icon}
                                tone={kpi.tone}
                                hint={kpi.hint}
                                trend={kpi.trend}
                            />
                        </div>
                    ))}
                </div>

                {/* Chart row: Orders by Status (7) | Stock Health (5) */}
                <div className="grid grid-cols-12 gap-4 md:gap-6">
                    <Panel
                        className="col-span-12 xl:col-span-7"
                        title="Orders by Status"
                        subtitle={`Distribution of the ${period} orders`}
                        action={
                            <PanelLink href={OrderRoutes.index().url}>
                                View all →
                            </PanelLink>
                        }
                    >
                        <ColumnChart data={statusChart} />
                    </Panel>

                    <Panel
                        className="col-span-12 xl:col-span-5"
                        title="Stock Health"
                        subtitle="Availability across active variants"
                        action={
                            <PanelLink href={InventoryRoutes.lowStock().url}>
                                View report →
                            </PanelLink>
                        }
                    >
                        {m ? (
                            <>
                                <DonutChart
                                    size={156}
                                    centerValue={m.total_active}
                                    centerLabel="Variants"
                                    data={stockDonut}
                                    emptyText="No tracked variants."
                                />
                                <div className="border-border mt-5 border-t pt-5">
                                    <ProgressBar
                                        label="Availability"
                                        value={
                                            m.total_active > 0 ? m.in_stock : 0
                                        }
                                        max={m.total_active || 1}
                                        valueLabel={`${availability}%`}
                                        tone="success"
                                        showValue
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground py-8 text-center text-sm">
                                Stock data is restricted to admin and manager
                                roles.
                            </p>
                        )}
                    </Panel>
                </div>

                {/* Bottom row: Activity feed (7) | Quick actions (5) */}
                <div className="grid grid-cols-12 gap-4 md:gap-6">
                    <Panel
                        className="col-span-12 lg:col-span-7"
                        title="Recent Activity"
                        subtitle="Latest ledger movements"
                        action={
                            <PanelLink href={InventoryRoutes.history().url}>
                                Full history →
                            </PanelLink>
                        }
                    >
                        {inventory ? (
                            inventory.recent_movements.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    The ledger is empty.
                                </p>
                            ) : (
                                <ul className="flex flex-col">
                                    {inventory.recent_movements.map((mv, i) => {
                                        const st = statusBadge(mv);
                                        return (
                                            <li
                                                key={mv.id}
                                                className={cn(
                                                    'border-border/50 flex items-start gap-3 py-2.5 first:pt-0',
                                                    i <
                                                        inventory
                                                            .recent_movements
                                                            .length -
                                                            1
                                                        ? 'border-b'
                                                        : '',
                                                )}
                                                style={{
                                                    animationDelay: `${i * 0.06}s`,
                                                }}
                                            >
                                                <span
                                                    className={cn(
                                                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-xs',
                                                        mv.quantity_after >=
                                                            mv.quantity_before
                                                            ? 'bg-success/10 dark:bg-success/15 text-[#4a8c2a] dark:text-[#95E6B6]'
                                                            : 'bg-destructive/10 dark:bg-destructive/15 text-[#B42318] dark:text-red-400',
                                                    )}
                                                >
                                                    {mv.quantity_after >=
                                                    mv.quantity_before ? (
                                                        <ArrowUpRight className="size-4" />
                                                    ) : (
                                                        <ArrowDownRight className="size-4" />
                                                    )}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {
                                                            mv.variant.product
                                                                .name
                                                        }{' '}
                                                        — {mv.variant.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatDateTime(
                                                            mv.created_at,
                                                        )}
                                                        {mv.user
                                                            ? ` · ${mv.user.name}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Badge
                                                        variant={st.variant}
                                                        className="shrink-0"
                                                    >
                                                        {st.label}
                                                    </Badge>
                                                    {movementDelta(mv)}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Stock data is restricted to admin and manager
                                roles.
                            </p>
                        )}
                    </Panel>

                    <Panel
                        className="col-span-12 lg:col-span-5"
                        title="Quick Actions"
                        subtitle="Jump to key areas"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            {isStaffPlus && (
                                <Link
                                    href={OrderRoutes.create().url}
                                    className="border-border hover:border-primary/30 group bg-card flex flex-col gap-2 rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                                        <ShoppingCart className="size-5" />
                                    </span>
                                    <span className="text-sm font-medium">
                                        New Order
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {stats.orders} total
                                    </span>
                                </Link>
                            )}
                            {isAdmin && (
                                <Link
                                    href={ProductRoutes.create().url}
                                    className="border-border hover:border-primary/30 group bg-card flex flex-col gap-2 rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                                        <Package className="size-5" />
                                    </span>
                                    <span className="text-sm font-medium">
                                        Add Product
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {stats.products} listed
                                    </span>
                                </Link>
                            )}
                            <Link
                                href={InventoryRoutes.lowStock().url}
                                className="border-border hover:border-primary/30 group bg-card flex flex-col gap-2 rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            >
                                <span className="bg-warning/15 flex size-9 items-center justify-center rounded-lg text-[#92400E] dark:bg-[#2A2411] dark:text-[#F0B429]">
                                    <AlertTriangle className="size-5" />
                                </span>
                                <span className="text-sm font-medium">
                                    Low Stock
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {m?.low_stock ?? '—'} flagged
                                </span>
                            </Link>
                            <Link
                                href={PurchaseOrderRoutes.index().url}
                                className="border-border hover:border-primary/30 group bg-card flex flex-col gap-2 rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            >
                                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                                    <Archive className="size-5" />
                                </span>
                                <span className="text-sm font-medium">
                                    Purchase Orders
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {inventory?.recent_purchase_orders.length ??
                                        0}{' '}
                                    recent
                                </span>
                            </Link>
                        </div>
                    </Panel>
                </div>
            </div>
        </>
    );
}

/** Shared heading for the dashboard shell. */
function Heading({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-muted-foreground text-sm">{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                    {title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {description}
                </p>
            </div>
            {actions && (
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
