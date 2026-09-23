import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import * as SupplierRoutes from '@/routes/admin/suppliers';

type Metrics = {
    total_pos: number;
    open: number;
    partially_received: number;
    received: number;
    cancelled: number;
    purchase_value: string;
    suppliers_with_purchases: number;
};

type OutstandingRow = {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string | null;
    expected_at: string | null;
    total: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    supplier: { name: string } | null;
};

type PartialRow = {
    id: number;
    po_number: string;
    status: string;
    total: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    supplier: { name: string } | null;
};

type ReceiptRow = {
    id: number;
    receipt_number: string;
    received_at: string;
    units_received: number | null;
    purchase_order: { id: number; po_number: string; supplier: { name: string } | null } | null;
    receiver: { name: string } | null;
};

type SupplierActivityRow = {
    id: number;
    name: string;
    purchase_orders_count: number;
    open_purchase_orders_count: number;
    purchase_value: string;
};

type RecentPurchaseOrderRow = {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string | null;
    total: string;
    supplier: { name: string } | null;
};

type Purchases = {
    metrics: Metrics;
    outstanding: OutstandingRow[];
    partial: PartialRow[];
    recent_receipts: ReceiptRow[];
    supplier_activity: SupplierActivityRow[];
    recent_purchase_orders: RecentPurchaseOrderRow[];
};

function StatTile({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
    return (
        <div className="rounded border p-4 dark:bg-card">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${accent ?? ''}`}>{value}</p>
        </div>
    );
}

// Textual status labels stay readable without relying on colour.
function StatusBadge({ status }: { status: string }) {
    return <Badge variant={status === 'received' ? 'success' : status === 'cancelled' ? 'cancelled' : 'warning'}>{status}</Badge>;
}

function formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : '—';
}

// Mirrors PurchaseOrder::canBeReceived() on the Purchase Order Show page.
function canReceive(status: string): boolean {
    return ['approved', 'partially_received'].includes(status);
}

export default function PurchaseDashboard({ purchases }: { purchases: Purchases }) {
    const m = purchases.metrics;
    return (
        <>
            <Head title="Purchase Dashboard" />
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title="Purchase Dashboard" description="Purchase orders, receiving, and supplier activity" />
                    <div className="flex gap-2">
                        <Link href={PurchaseOrderRoutes.index().url}>
                            <Button variant="outline">View Purchase Orders</Button>
                        </Link>
                        <Link href={PurchaseOrderRoutes.create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New PO
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    <StatTile label="Total Purchase Orders" value={m.total_pos} />
                    <StatTile label="Open Purchase Orders" value={m.open} accent="text-amber-600 dark:text-[#BF9FEF]" />
                    <StatTile label="Partially Received" value={m.partially_received} accent="text-amber-600 dark:text-[#BF9FEF]" />
                    <StatTile label="Fully Received" value={m.received} />
                    <StatTile label="Cancelled" value={m.cancelled} />
                    <StatTile label="Purchase Value" value={m.purchase_value} />
                    <StatTile label="Active Suppliers With Purchases" value={m.suppliers_with_purchases} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Outstanding Purchases</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {purchases.outstanding.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No outstanding purchase orders.</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b bg-muted/50">
                                            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                                <th className="px-4 py-3">PO Number</th>
                                                <th className="px-4 py-3">Supplier</th>
                                                <th className="px-4 py-3">Ordered</th>
                                                <th className="px-4 py-3">Expected</th>
                                                <th className="px-4 py-3">Ordered Qty</th>
                                                <th className="px-4 py-3">Received</th>
                                                <th className="px-4 py-3">Remaining</th>
                                                <th className="px-4 py-3">Total</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchases.outstanding.map((po) => (
                                                <tr key={po.id} className="border-b hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-mono text-sm">
                                                        <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                            {po.po_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{po.supplier?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-xs">{formatDate(po.ordered_at)}</td>
                                                    <td className="px-4 py-3 text-xs">{formatDate(po.expected_at)}</td>
                                                    <td className="px-4 py-3 text-sm">{po.ordered_quantity}</td>
                                                    <td className="px-4 py-3 text-sm">{po.received_quantity}</td>
                                                    <td className="px-4 py-3 text-sm">{po.remaining_quantity}</td>
                                                    <td className="px-4 py-3 text-sm">{po.total}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={po.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        {canReceive(po.status) ? (
                                                            <Link href={PurchaseOrderRoutes.receive(po.id).url} className="text-primary hover:underline">
                                                                Receive
                                                            </Link>
                                                        ) : (
                                                            <Link href={PurchaseOrderRoutes.show(po.id).url} className="text-primary hover:underline">
                                                                View
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3">
                                    <Link href={PurchaseOrderRoutes.index().url} className="text-xs text-primary hover:underline">
                                        View all purchase orders →
                                    </Link>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Receiving Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchases.recent_receipts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No receiving activity yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {purchases.recent_receipts.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between gap-3 border-b pb-2">
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm">{r.receipt_number}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {r.purchase_order ? (
                                                        <Link href={PurchaseOrderRoutes.show(r.purchase_order.id).url} className="hover:underline">
                                                            {r.purchase_order.po_number}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                    {r.purchase_order?.supplier ? ` · ${r.purchase_order.supplier.name}` : ''}
                                                    {` · ${formatDate(r.received_at)}`}
                                                    {r.receiver ? ` · by ${r.receiver.name}` : ''}
                                                </p>
                                            </div>
                                            <span className="font-mono text-sm shrink-0">{r.units_received ?? 0} units</span>
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
                            <CardTitle className="text-sm">Partially Received</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchases.partial.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No partially received purchase orders.</p>
                            ) : (
                                <div className="space-y-3">
                                    {purchases.partial.map((po) => (
                                        <div key={po.id} className="flex items-center justify-between gap-3 border-b pb-2">
                                            <div className="min-w-0">
                                                <Link href={PurchaseOrderRoutes.show(po.id).url} className="font-mono text-sm hover:underline truncate block">
                                                    {po.po_number}
                                                </Link>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {po.supplier?.name || 'Unknown supplier'} · Received {po.received_quantity} of {po.ordered_quantity} · Remaining{' '}
                                                    {po.remaining_quantity}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <StatusBadge status={po.status} />
                                                <Link href={PurchaseOrderRoutes.receive(po.id).url} className="text-xs text-primary hover:underline">
                                                    Receive
                                                </Link>
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

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Supplier Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">Supplier</th>
                                            <th className="px-4 py-3">Purchase Orders</th>
                                            <th className="px-4 py-3">Open</th>
                                            <th className="px-4 py-3">Purchase Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.supplier_activity.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                    No supplier purchase activity yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            purchases.supplier_activity.map((s) => (
                                                <tr key={s.id} className="border-b hover:bg-muted/20">
                                                    <td className="px-4 py-3 text-sm">{s.name}</td>
                                                    <td className="px-4 py-3 text-sm">{s.purchase_orders_count}</td>
                                                    <td className="px-4 py-3 text-sm">{s.open_purchase_orders_count}</td>
                                                    <td className="px-4 py-3 text-sm">{s.purchase_value}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {purchases.supplier_activity.length > 0 && (
                                <div className="p-4">
                                    <Link href={SupplierRoutes.index().url} className="text-xs text-primary hover:underline">
                                        View all suppliers →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Purchase Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                            <th className="px-4 py-3">PO Number</th>
                                            <th className="px-4 py-3">Supplier</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.recent_purchase_orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                    No purchase orders yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            purchases.recent_purchase_orders.map((po) => (
                                                <tr key={po.id} className="border-b hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-mono text-sm">
                                                        <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                            {po.po_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{po.supplier?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-xs">{formatDate(po.ordered_at)}</td>
                                                    <td className="px-4 py-3 text-sm">{po.total}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={po.status} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {purchases.recent_purchase_orders.length > 0 && (
                                <div className="p-4">
                                    <Link href={PurchaseOrderRoutes.index().url} className="text-xs text-primary hover:underline">
                                        View all purchase orders →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PurchaseDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Purchase Dashboard', href: '#' },
    ],
};
