import { Head, Link } from '@inertiajs/react';
import { DonutChart } from '@/components/charts';
import Heading from '@/components/heading';
import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as InventoryRoutes from '@/routes/admin/inventory';
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
    ScrollText,
    ShoppingCart,
    Tag,
    Users,
} from 'lucide-react';

type Order = { id: number; reference_number: string; status: string; total: string; ordered_at: string; customer: { name: string } | null };
type VariantRow = { id: number; name: string; sku: string | null; quantity: number; low_stock_threshold: number | null; stock_status: string; product: { id: number; name: string } };
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
type PurchaseOrderRow = { id: number; po_number: string; status: string; ordered_at: string | null; total: string; supplier: { name: string } | null };
type Inventory = {
    metrics: { total_active: number; total_units: number; in_stock: number; low_stock: number; out_of_stock: number; monitored: number };
    low_stock: VariantRow[];
    out_of_stock: VariantRow[];
    recent_movements: Movement[];
    recent_purchase_orders: PurchaseOrderRow[];
};

function orderBadgeVariant(status: string) {
    return status === 'delivered' ? 'success' : status === 'cancelled' ? 'cancelled' : 'warning';
}

function poBadgeVariant(status: string) {
    return status === 'received' ? 'success' : status === 'cancelled' ? 'cancelled' : 'warning';
}

// Display-only signed quantity derived from the stored before/after ledger values.
function movementLabel(m: Movement): string {
    const delta = m.quantity_after - m.quantity_before;
    if (delta > 0) return `+${m.quantity}`;
    if (delta < 0) return `-${m.quantity}`;
    return `${m.quantity}`;
}

function listCard(title: string, children: React.ReactNode, action?: React.ReactNode) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
                {action && <div className="mt-4">{action}</div>}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    stats,
    recent_orders,
    inventory,
}: {
    stats: { products: number; categories: number; orders: number; customers: number; branches: number; pending_orders: number };
    recent_orders: Order[];
    inventory: Inventory | null;
}) {
    const statusMix = ['pending', 'confirmed', 'delivered', 'cancelled']
        .map((status, i) => ({
            label: status,
            value: recent_orders.filter((o) => o.status === status).length,
            color: ['var(--viz-warning)', 'var(--chart-3)', 'var(--viz-success)', 'var(--viz-danger)'][i],
        }))
        .filter((d) => d.value > 0);

    const m = inventory?.metrics;

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Overview"
                    title="Admin Dashboard"
                    description="Catalog, orders, inventory and purchasing at a glance."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard label="Products" value={stats.products} icon={Package} />
                    <StatCard label="Categories" value={stats.categories} icon={Tag} />
                    <StatCard label="Orders" value={stats.orders} icon={ShoppingCart} />
                    <StatCard label="Pending" value={stats.pending_orders} icon={ScrollText} tone="warning" />
                    <StatCard label="Customers" value={stats.customers} icon={Users} />
                    <StatCard label="Branches" value={stats.branches} icon={Building2} />
                </div>

                {m && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <StatCard label="Active Variants" value={m.total_active} icon={Layers} />
                            <StatCard label="Total Units" value={m.total_units} icon={Archive} />
                            <StatCard label="In Stock" value={m.in_stock} icon={CheckCircle2} tone="success" />
                            <StatCard label="Low Stock" value={m.low_stock} icon={AlertTriangle} tone="warning" />
                            <StatCard label="Out of Stock" value={m.out_of_stock} icon={Package} tone="danger" />
                            <StatCard label="Monitored" value={m.monitored} icon={ScrollText} />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>Stock Health</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <DonutChart
                                        size={150}
                                        centerValue={m.total_active}
                                        centerLabel="Variants"
                                        data={[
                                            { label: 'In stock', value: m.in_stock, color: 'var(--viz-success)' },
                                            { label: 'Low stock', value: m.low_stock, color: 'var(--viz-warning)' },
                                            { label: 'Out of stock', value: m.out_of_stock, color: 'var(--viz-danger)' },
                                        ]}
                                        emptyText="No tracked variants."
                                    />
                                    <ProgressBar
                                        label="Stock availability"
                                        value={m.total_active > 0 ? m.in_stock : 0}
                                        max={m.total_active || 1}
                                        valueLabel={m.total_active > 0 ? `${Math.round((m.in_stock / m.total_active) * 100)}%` : '0%'}
                                        tone="success"
                                        showValue
                                    />
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 lg:col-span-2">
                                {listCard(
                                    'Low Stock Variants',
                                    inventory!.low_stock.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Nothing needs restocking right now.</p>
                                    ) : (
                                        <ul className="flex flex-col gap-4">
                                            {inventory!.low_stock.map((v) => {
                                                const threshold = v.low_stock_threshold ?? 0;
                                                return (
                                                    <li key={v.id} className="flex flex-col gap-1.5">
                                                        <div className="flex items-baseline justify-between gap-3 text-xs">
                                                            <span className="min-w-0 truncate font-medium text-foreground">
                                                                {v.product.name} — {v.name}
                                                                <span className="ml-2 font-normal text-muted-foreground">
                                                                    {v.sku || 'No SKU'}
                                                                </span>
                                                            </span>
                                                            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                                                                {v.quantity} / {threshold}
                                                            </span>
                                                        </div>
                                                        <ProgressBar
                                                            value={v.quantity}
                                                            max={threshold > 0 ? threshold : 1}
                                                            tone="warning"
                                                            barClassName={v.quantity === 0 ? 'bg-red-500 dark:bg-red-400' : undefined}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ),
                                    <Link href={InventoryRoutes.lowStock().url} className="text-xs font-medium text-primary hover:underline">
                                        View all low stock →
                                    </Link>,
                                )}

                                {listCard(
                                    'Out of Stock',
                                    inventory!.out_of_stock.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Everything on the shelf.</p>
                                    ) : (
                                        <ul className="flex flex-col divide-y divide-border/70">
                                            {inventory!.out_of_stock.map((v) => (
                                                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={ProductRoutes.show(v.product.id).url}
                                                            className="block truncate text-sm font-medium hover:underline"
                                                        >
                                                            {v.product.name} — {v.name}
                                                        </Link>
                                                        <p className="font-mono text-xs text-muted-foreground">{v.sku || 'No SKU'}</p>
                                                    </div>
                                                    <Badge variant="destructive" className="shrink-0">
                                                        Out of Stock
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    ),
                                    <Link href={InventoryRoutes.lowStock({ status: 'out' }).url} className="text-xs font-medium text-primary hover:underline">
                                        View all out of stock →
                                    </Link>,
                                )}
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {listCard(
                                'Recent Stock Movements',
                                inventory!.recent_movements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">The ledger is empty.</p>
                                ) : (
                                    <ul className="flex flex-col divide-y divide-border/70">
                                        {inventory!.recent_movements.map((mv) => (
                                            <li key={mv.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {mv.variant.product.name} — {mv.variant.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(mv.created_at).toLocaleString()} · {mv.quantity_before} → {mv.quantity_after}
                                                        {mv.reason ? ` · ${mv.reason}` : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Badge variant={mv.quantity_after >= mv.quantity_before ? 'success' : 'secondary'}>
                                                        {mv.movement_type}
                                                    </Badge>
                                                    <span className="font-mono text-sm font-semibold">{movementLabel(mv)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ),
                                <Link href={InventoryRoutes.history().url} className="text-xs font-medium text-primary hover:underline">
                                    View inventory history →
                                </Link>,
                            )}

                            {listCard(
                                'Recent Purchase Orders',
                                inventory!.recent_purchase_orders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nothing has been ordered yet.</p>
                                ) : (
                                    <ul className="flex flex-col divide-y divide-border/70">
                                        {inventory!.recent_purchase_orders.map((po) => (
                                            <li key={po.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm">{po.po_number}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {po.supplier?.name || 'Unknown supplier'}
                                                        {po.ordered_at ? ` · ${new Date(po.ordered_at).toLocaleDateString()}` : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className="font-mono text-sm">{po.total}</span>
                                                    <Badge variant={poBadgeVariant(po.status)}>{po.status}</Badge>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ),
                                <Link href={PurchaseOrderRoutes.index().url} className="text-xs font-medium text-primary hover:underline">
                                    View all purchase orders →
                                </Link>,
                            )}
                        </div>
                    </>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recent_orders.length === 0 ? (
                                        <TableEmpty colSpan={4}>No orders yet.</TableEmpty>
                                    ) : (
                                        recent_orders.map((o) => (
                                            <TableRow key={o.id}>
                                                <TableCell className="font-mono text-sm">{o.reference_number}</TableCell>
                                                <TableCell className="text-sm">{o.customer?.name || 'Guest'}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">{o.total}</TableCell>
                                                <TableCell>
                                                    <Badge variant={orderBadgeVariant(o.status)}>{o.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {recent_orders.length > 0 && (
                                <div className="px-4 pt-4">
                                    <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
                                        View all orders →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Status Mix</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonutChart
                                size={150}
                                centerValue={recent_orders.length}
                                centerLabel="Recent"
                                data={statusMix}
                                emptyText="No recent orders."
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {[
                                { title: 'Products', href: '/admin/products', icon: Package, desc: 'Catalog' },
                                { title: 'Categories', href: '/admin/categories', icon: Tag, desc: 'Groups' },
                                { title: 'Brands', href: '/admin/brands', icon: Layers, desc: 'Brands' },
                                { title: 'Branches', href: '/admin/branches', icon: Building2, desc: 'Locations' },
                                { title: 'Opening Stock', href: '/admin/inventory/opening-stock', icon: Archive, desc: 'Initial' },
                                { title: 'Stock Adjustments', href: '/admin/inventory/adjustments', icon: ArrowUpDown, desc: 'Correct' },
                                { title: 'Inventory History', href: '/admin/inventory/history', icon: History, desc: 'Ledger' },
                                { title: 'Orders', href: '/admin/orders', icon: ShoppingCart, desc: 'Sales' },
                                { title: 'Customers', href: '/admin/customers', icon: Users, desc: 'Clients' },
                                ...(inventory
                                    ? [
                                          { title: 'Low Stock', href: '/admin/inventory/low-stock', icon: AlertTriangle, desc: 'Alerts' },
                                          { title: 'Purchase Orders', href: '/admin/purchase-orders', icon: FileText, desc: 'Purchasing' },
                                      ]
                                    : []),
                            ].map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_2px_rgba(7,14,1,0.04),0_16px_40px_-24px_rgba(7,14,1,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_2px_4px_rgba(7,14,1,0.05),0_24px_48px_-24px_rgba(45,80,22,0.28)] dark:shadow-none"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                                        <item.icon className="size-4.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">{item.title}</span>
                                        <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
