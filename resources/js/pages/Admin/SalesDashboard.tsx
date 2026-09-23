import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as CustomerRoutes from '@/routes/admin/customers';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as OrderRoutes from '@/routes/admin/orders';

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

function StatTile({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors dark:shadow-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className={`font-serif text-3xl leading-none font-medium tracking-tight ${accent ?? 'text-foreground'}`}>{value}</p>
        </div>
    );
}

// Textual status labels stay readable without relying on colour
// (same convention as the Orders index).
function StatusBadge({ status }: { status: string }) {
    return <Badge variant={status === 'delivered' ? 'success' : status === 'cancelled' ? 'cancelled' : 'warning'}>{status}</Badge>;
}

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
    return (
        <>
            <Head title="Sales Dashboard" />
            <div className="p-6 space-y-6">
                <Heading
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

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <StatTile label="Total Orders" value={m.total_orders} />
                    <StatTile label="Pending" value={m.pending} accent="text-amber-600 dark:text-[#BF9FEF]" />
                    <StatTile label="Confirmed" value={m.confirmed} />
                    <StatTile label="Delivered" value={m.delivered} />
                    <StatTile label="Cancelled" value={m.cancelled} />
                    <StatTile label="Delivered Sales Value" value={m.delivered_value} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="px-4 pt-2 text-xs text-muted-foreground">
                            Count and operational order value at each stage. The sales figure above counts delivered orders only — pending and confirmed
                            are still in flight, and cancelled orders were reversed.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Orders</th>
                                        <th className="px-4 py-3">Order Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.pipeline.map((row) => (
                                        <tr key={row.status} className="border-b transition-colors hover:bg-muted/40">
                                            <td className="px-4 py-3">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="px-4 py-3 text-sm">{row.count}</td>
                                            <td className="px-4 py-3 text-sm">{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">Order</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3">Returned</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.recent_orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                    No orders yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            sales.recent_orders.map((o) => (
                                                <tr key={o.id} className="border-b transition-colors hover:bg-muted/40">
                                                    <td className="px-4 py-3 font-mono text-sm">
                                                        <Link href={OrderRoutes.show(o.id).url} className="hover:underline">
                                                            {o.reference_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {o.customer?.company_name || o.customer?.contact_name || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">{formatDate(o.ordered_at)}</td>
                                                    <td className="px-4 py-3 text-sm">{o.total}</td>
                                                    <td className="px-4 py-3 text-sm">{o.returned_quantity ?? 0}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={o.status} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {sales.recent_orders.length > 0 && (
                                <div className="p-4">
                                    <Link href={OrderRoutes.index().url} className="text-xs text-primary hover:underline">
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
                                <div className="rounded border p-3">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Returns</p>
                                    <p className="text-xl font-bold">{sales.returns.count}</p>
                                </div>
                                <div className="rounded border p-3">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Units Returned</p>
                                    <p className="text-xl font-bold">{sales.returns.quantity}</p>
                                </div>
                                <div className="rounded border p-3">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Return Value</p>
                                    <p className="text-xl font-bold">{sales.returns.value}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Returns apply only after delivery: the order stays <span className="font-medium">delivered</span> and stock is restored.
                                Cancelled orders never delivered and are counted separately in the pipeline — a cancelled order is not a returned order.
                            </p>
                            <Link href={OrderRoutes.index().url} className="text-xs text-primary hover:underline">
                                View orders and their return history →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Orders</th>
                                            <th className="px-4 py-3">Delivered</th>
                                            <th className="px-4 py-3">Order Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.top_customers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                    No customer activity yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            sales.top_customers.map((c) => (
                                                <tr key={c.id} className="border-b transition-colors hover:bg-muted/40">
                                                    <td className="px-4 py-3 text-sm">{c.name}</td>
                                                    <td className="px-4 py-3 text-sm">{c.orders_count}</td>
                                                    <td className="px-4 py-3 text-sm">{c.delivered_orders_count}</td>
                                                    <td className="px-4 py-3 text-sm">{c.order_value}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4">
                                <p className="mb-2 text-xs text-muted-foreground">Order value excludes cancelled orders.</p>
                                <Link href={CustomerRoutes.index().url} className="text-xs text-primary hover:underline">
                                    View all customers →
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Selling Variants</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Variant</th>
                                            <th className="px-4 py-3">Sold</th>
                                            <th className="px-4 py-3">Returned</th>
                                            <th className="px-4 py-3">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.top_products.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                    No confirmed or delivered product sales yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            sales.top_products.map((p) => (
                                                <tr key={p.variant_id} className="border-b transition-colors hover:bg-muted/40">
                                                    <td className="px-4 py-3 text-sm">{p.product_name}</td>
                                                    <td className="px-4 py-3 text-sm">{p.variant_name}</td>
                                                    <td className="px-4 py-3 text-sm">{p.sold_quantity}</td>
                                                    <td className="px-4 py-3 text-sm">{p.returned_quantity}</td>
                                                    <td className="px-4 py-3 text-sm font-medium">{p.net_quantity}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <p className="p-4 text-xs text-muted-foreground">
                                Confirmed and delivered orders only — pending and cancelled orders are excluded — net of returned units.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {sales.movements !== null && (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Sales Movements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sales.movements.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No sales movements yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {sales.movements.map((movement) => (
                                                <div key={movement.id} className="flex items-start justify-between gap-3 border-b pb-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {movement.variant.product.name} — {movement.variant.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(movement.created_at).toLocaleString()} · {movement.quantity_before} →{' '}
                                                            {movement.quantity_after}
                                                            {movement.reason ? ` · ${movement.reason}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Badge variant={movement.quantity_after >= movement.quantity_before ? 'success' : 'secondary'}>
                                                            {movement.movement_type}
                                                        </Badge>
                                                        <span className="font-mono text-sm font-semibold">{movementLabel(movement)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <Link href={InventoryRoutes.history().url} className="text-xs text-primary hover:underline">
                                                View inventory history →
                                            </Link>
                                        </div>
                                    )}
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
                                                className="flex flex-col gap-1 rounded-lg border p-4 dark:bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
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
                    </>
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
