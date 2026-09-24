import { Head, Link } from '@inertiajs/react';
import { BarList, DonutChart } from '@/components/charts';
import Heading from '@/components/heading';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as CustomerRoutes from '@/routes/admin/customers';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as OrderRoutes from '@/routes/admin/orders';
import { ArrowUpDown, BadgeCheck, PackageCheck, Receipt, ShoppingBag, Truck, Undo2 } from 'lucide-react';

type Metrics = {
    total_orders: number;
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
    pending_value: string;
    confirmed_value: string;
    delivered_value: string;
    cancelled_value: string;
};

type PipelineRow = { status: string; count: number; value: string };

type ReturnsSummary = { count: number; quantity: number; value: string };

type RecentOrderRow = {
    id: number;
    reference_number: string;
    status: string;
    total: string;
    ordered_at: string | null;
    returned_quantity: number | null;
    customer: { company_name?: string | null; contact_name?: string | null } | null;
};

type TopCustomerRow = {
    id: number;
    name: string;
    orders_count: number;
    delivered_orders_count: number;
    order_value: string;
};

type TopProductRow = {
    variant_id: number;
    product_name: string;
    variant_name: string;
    sold_quantity: number;
    returned_quantity: number;
    net_quantity: number;
};

type Movement = {
    id: number;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string | null;
    created_at: string;
    variant: { id: number; name: string; product: { id: number; name: string } };
    user: { name: string } | null;
};

type Sales = {
    metrics: Metrics;
    pipeline: PipelineRow[];
    returns: ReturnsSummary;
    recent_orders: RecentOrderRow[];
    top_customers: TopCustomerRow[];
    top_products: TopProductRow[];
    movements: Movement[] | null;
};

// Textual status labels stay readable without relying on colour
// (same convention as the Orders index).
function StatusBadge({ status }: { status: string }) {
    return <Badge variant={status === 'delivered' ? 'success' : status === 'cancelled' ? 'cancelled' : 'warning'}>{status}</Badge>;
}

const STATUS_COLOR: Record<string, string> = {
    pending: 'var(--viz-warning)',
    confirmed: 'var(--chart-3)',
    delivered: 'var(--viz-success)',
    cancelled: 'var(--viz-danger)',
};

function formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : '—';
}

// Display-only signed quantity derived from the stored before/after ledger values.
function movementLabel(m: Movement): string {
    const delta = m.quantity_after - m.quantity_before;
    if (delta > 0) return `+${m.quantity}`;
    if (delta < 0) return `-${m.quantity}`;
    return `${m.quantity}`;
}

export default function SalesDashboard({ sales }: { sales: Sales }) {
    const m = sales.metrics;
    const pipelineMix = sales.pipeline
        .filter((row) => row.count > 0)
        .map((row) => ({
            label: row.status,
            value: row.count,
            color: STATUS_COLOR[row.status],
        }));

    return (
        <>
            <Head title="Sales Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Sales"
                    title="Sales Dashboard"
                    description="Orders, deliveries, returns, and customer activity"
                    actions={
                        <div className="flex gap-2">
                            <Link href={OrderRoutes.index().url}>
                                <Button variant="outline">View Orders</Button>
                            </Link>
                            <Link href={CustomerRoutes.index().url}>
                                <Button>View Customers</Button>
                            </Link>
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard label="Total Orders" value={m.total_orders} icon={ShoppingBag} />
                    <StatCard label="Pending" value={m.pending} icon={Undo2} tone="warning" hint={m.pending_value} />
                    <StatCard label="Confirmed" value={m.confirmed} icon={BadgeCheck} hint={m.confirmed_value} />
                    <StatCard label="Delivered" value={m.delivered} icon={Truck} tone="success" />
                    <StatCard label="Cancelled" value={m.cancelled} icon={Undo2} tone="danger" hint={m.cancelled_value} />
                    <StatCard label="Delivered Value" value={m.delivered_value} icon={PackageCheck} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        <DonutChart
                            data={pipelineMix}
                            size={160}
                            centerValue={m.total_orders}
                            centerLabel="Orders"
                            emptyText="No orders yet."
                        />
                        <div className="min-w-0 flex-1">
                            <p className="mb-3 text-xs text-muted-foreground">
                                Count and operational order value at each stage. The sales figure above counts delivered orders only — pending and
                                confirmed are still in flight, and cancelled orders were reversed.
                            </p>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                        <TableHead className="text-right">Order Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.pipeline.length === 0 ? (
                                        <TableEmpty colSpan={3}>No orders yet.</TableEmpty>
                                    ) : (
                                        sales.pipeline.map((row) => (
                                            <TableRow key={row.status}>
                                                <TableCell>
                                                    <StatusBadge status={row.status} />
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{row.count}</TableCell>
                                                <TableCell className="text-right font-mono">{row.value}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Returned</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.recent_orders.length === 0 ? (
                                        <TableEmpty colSpan={6}>No orders yet.</TableEmpty>
                                    ) : (
                                        sales.recent_orders.map((o) => (
                                            <TableRow key={o.id}>
                                                <TableCell className="font-mono">
                                                    <Link href={OrderRoutes.show(o.id).url} className="hover:underline">
                                                        {o.reference_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    {o.customer?.company_name || o.customer?.contact_name || '—'}
                                                </TableCell>
                                                <TableCell>{formatDate(o.ordered_at)}</TableCell>
                                                <TableCell className="text-right font-mono">{o.total}</TableCell>
                                                <TableCell className="text-right">{o.returned_quantity ?? 0}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={o.status} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {sales.recent_orders.length > 0 && (
                                <div className="px-4 pt-4">
                                    <Link href={OrderRoutes.index().url} className="text-xs font-medium text-primary hover:underline">
                                        View all orders →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Returns</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <StatCard label="Returns" value={sales.returns.count} icon={Receipt} />
                                <StatCard label="Units" value={sales.returns.quantity} icon={ArrowUpDown} />
                                <StatCard label="Value" value={sales.returns.value} icon={PackageCheck} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Returns apply only after delivery: the order stays <span className="font-medium">delivered</span> and stock is
                                restored. Cancelled orders never delivered and are counted separately in the pipeline — a cancelled order is not a
                                returned order.
                            </p>
                            <Link href={OrderRoutes.index().url} className="text-xs font-medium text-primary hover:underline">
                                View orders and their return history →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BarList
                                data={sales.top_customers.map((c) => ({
                                    label: c.name,
                                    value: c.orders_count,
                                    meta: `${c.delivered_orders_count} delivered`,
                                    displayValue: c.order_value,
                                }))}
                                emptyText="No customer activity yet."
                            />
                            <p className="text-xs text-muted-foreground">Order value excludes cancelled orders.</p>
                            <Link href={CustomerRoutes.index().url} className="text-xs font-medium text-primary hover:underline">
                                View all customers →
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Selling Variants</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BarList
                                data={sales.top_products.map((p) => ({
                                    label: p.product_name,
                                    meta: p.variant_name,
                                    value: p.net_quantity,
                                    displayValue: `${p.sold_quantity} sold`,
                                }))}
                                emptyText="No confirmed or delivered product sales yet."
                            />
                            <p className="text-xs text-muted-foreground">
                                Confirmed and delivered orders only — pending and cancelled orders are excluded — net of returned units.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {sales.movements !== null && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Sales Movements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sales.movements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No sales movements yet.</p>
                                ) : (
                                    <ul className="flex flex-col divide-y divide-border/70">
                                        {sales.movements.map((movement) => (
                                            <li key={movement.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {movement.variant.product.name} — {movement.variant.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(movement.created_at).toLocaleString()} · {movement.quantity_before} →{' '}
                                                        {movement.quantity_after}
                                                        {movement.reason ? ` · ${movement.reason}` : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Badge
                                                        variant={movement.quantity_after >= movement.quantity_before ? 'success' : 'secondary'}
                                                    >
                                                        {movement.movement_type}
                                                    </Badge>
                                                    <span className="font-mono text-sm font-semibold">{movementLabel(movement)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="mt-4">
                                    <Link href={InventoryRoutes.history().url} className="text-xs font-medium text-primary hover:underline">
                                        View inventory history →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Related Dashboards</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                                    {[
                                        { title: 'Inventory Dashboard', href: '/admin' },
                                        { title: 'Purchase Dashboard', href: '/admin/purchases/dashboard' },
                                        { title: 'Low Stock', href: InventoryRoutes.lowStock().url },
                                    ].map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm dark:shadow-none"
                                        >
                                            <span className="text-sm font-medium">{item.title}</span>
                                            <span className="text-xs text-muted-foreground">Open →</span>
                                        </Link>
                                    ))}
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Inventory and purchasing detail is available to managers and admins. Sales activity links to inventory history so
                                    both views share the same ledger.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}

SalesDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Orders', href: OrderRoutes.index().url },
        { title: 'Sales Dashboard', href: '#' },
    ],
};
