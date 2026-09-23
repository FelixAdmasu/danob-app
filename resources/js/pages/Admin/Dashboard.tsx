import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, Layers, Building2, Archive, ArrowUpDown, ShoppingCart, Users, History, AlertTriangle, FileText } from 'lucide-react';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as ProductRoutes from '@/routes/admin/products';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

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

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors dark:shadow-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className={`font-serif text-3xl leading-none font-medium tracking-tight ${accent ?? 'text-foreground'}`}>{value}</p>
        </div>
    );
}

// Display-only signed quantity derived from the stored before/after ledger values.
function movementLabel(m: Movement): string {
    const delta = m.quantity_after - m.quantity_before;
    if (delta > 0) return `+${m.quantity}`;
    if (delta < 0) return `-${m.quantity}`;
    return `${m.quantity}`;
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
    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="p-6 space-y-6">
                <Heading title="Admin Dashboard" description="Overview" />

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <StatTile label="Products" value={stats.products} />
                    <StatTile label="Categories" value={stats.categories} />
                    <StatTile label="Orders" value={stats.orders} />
                    <StatTile label="Pending" value={stats.pending_orders} accent="text-amber-600 dark:text-[#BF9FEF]" />
                    <StatTile label="Customers" value={stats.customers} />
                    <StatTile label="Branches" value={stats.branches} />
                </div>

                {inventory && (
                    <>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <StatTile label="Active Variants" value={inventory.metrics.total_active} />
                            <StatTile label="Total Units in Stock" value={inventory.metrics.total_units} />
                            <StatTile label="In Stock" value={inventory.metrics.in_stock} />
                            <StatTile label="Low Stock" value={inventory.metrics.low_stock} accent="text-amber-600 dark:text-[#BF9FEF]" />
                            <StatTile label="Out of Stock" value={inventory.metrics.out_of_stock} accent="text-red-600 dark:text-red-400" />
                            <StatTile label="Monitored Variants" value={inventory.metrics.monitored} />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Low Stock Variants</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {inventory.low_stock.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No variants below their low-stock threshold.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {inventory.low_stock.map((v) => (
                                                <div key={v.id} className="flex items-center justify-between gap-3 border-b pb-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{v.product.name} — {v.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {v.sku || 'No SKU'} · Qty {v.quantity} · Threshold {v.low_stock_threshold ?? '—'}
                                                        </p>
                                                    </div>
                                                    <Badge variant="destructive" className="shrink-0">Low Stock</Badge>
                                                </div>
                                            ))}
                                            <Link href={InventoryRoutes.lowStock().url} className="text-xs text-primary hover:underline">
                                                View all low stock →
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Out of Stock</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {inventory.out_of_stock.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Nothing is out of stock.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {inventory.out_of_stock.map((v) => (
                                                <div key={v.id} className="flex items-center justify-between gap-3 border-b pb-2">
                                                    <div className="min-w-0">
                                                        <Link href={ProductRoutes.show(v.product.id).url} className="text-sm font-medium hover:underline truncate block">
                                                            {v.product.name} — {v.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground font-mono">{v.sku || 'No SKU'} · Qty {v.quantity}</p>
                                                    </div>
                                                    <Badge variant="destructive" className="shrink-0">Out of Stock</Badge>
                                                </div>
                                            ))}
                                            <Link href={InventoryRoutes.lowStock({ status: 'out' }).url} className="text-xs text-primary hover:underline">
                                                View all out of stock →
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Stock Movements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {inventory.recent_movements.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No stock movements yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {inventory.recent_movements.map((m) => (
                                                <div key={m.id} className="flex items-start justify-between gap-3 border-b pb-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{m.variant.product.name} — {m.variant.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(m.created_at).toLocaleString()} · {m.quantity_before} → {m.quantity_after}
                                                            {m.reason ? ` · ${m.reason}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Badge variant={m.quantity_after >= m.quantity_before ? 'success' : 'secondary'}>{m.movement_type}</Badge>
                                                        <span className="font-mono text-sm font-semibold">{movementLabel(m)}</span>
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
                                    <CardTitle>Recent Purchase Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {inventory.recent_purchase_orders.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {inventory.recent_purchase_orders.map((po) => (
                                                <div key={po.id} className="flex items-center justify-between gap-3 border-b pb-2">
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-sm">{po.po_number}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {po.supplier?.name || 'Unknown supplier'}
                                                            {po.ordered_at ? ` · ${new Date(po.ordered_at).toLocaleDateString()}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <span className="font-mono text-sm">{po.total}</span>
                                                        <Badge variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'cancelled' : 'warning'}>{po.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            <Link href={PurchaseOrderRoutes.index().url} className="text-xs text-primary hover:underline">
                                                View all purchase orders →
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
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
                                <Link key={item.title} href={item.href} className="group flex flex-col gap-2 rounded-lg border p-4 dark:bg-card hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recent_orders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No orders.</p>
                        ) : (
                            <div className="space-y-3">
                                {recent_orders.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between border-b pb-2">
                                        <div>
                                            <p className="font-mono text-sm">{o.reference_number}</p>
                                            <p className="text-xs text-muted-foreground">{o.customer?.name || 'Guest'}</p>
                                        </div>
                                        <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'cancelled' : 'warning'}>{o.status}</Badge>
                                    </div>
                                ))}
                                <Link href="/admin/orders" className="text-xs text-primary hover:underline">
                                    View all →
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
