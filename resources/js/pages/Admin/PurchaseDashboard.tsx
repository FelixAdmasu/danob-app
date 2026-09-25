import { Head, Link } from '@inertiajs/react';
import { BarList, DonutChart } from '@/components/charts';
import Heading from '@/components/heading';
import { ProgressBar } from '@/components/progress-bar';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import * as SupplierRoutes from '@/routes/admin/suppliers';
import {
    Ban,
    CheckCircle2,
    Eye,
    Hourglass,
    Layers,
    PackageCheck,
    Plus,
    Truck,
    Users,
} from 'lucide-react';

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
    purchase_order: {
        id: number;
        po_number: string;
        supplier: { name: string } | null;
    } | null;
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

const STATUS_COLOR: Record<string, string> = {
    approved: 'var(--viz-warning)',
    partially_received: 'var(--chart-3)',
    open: 'var(--viz-warning)',
    received: 'var(--viz-success)',
    cancelled: 'var(--viz-danger)',
};

// Mirrors PurchaseOrder::canBeReceived() on the Purchase Order Show page.
function canReceive(status: string): boolean {
    return ['approved', 'partially_received'].includes(status);
}

export default function PurchaseDashboard({
    purchases,
}: {
    purchases: Purchases;
}) {
    const m = purchases.metrics;
    const statusMix = [
        { label: 'Open', value: m.open, color: STATUS_COLOR.open },
        {
            label: 'Partially received',
            value: m.partially_received,
            color: STATUS_COLOR.partially_received,
        },
        { label: 'Received', value: m.received, color: STATUS_COLOR.received },
        {
            label: 'Cancelled',
            value: m.cancelled,
            color: STATUS_COLOR.cancelled,
        },
    ].filter((d) => d.value > 0);

    return (
        <>
            <Head title="Purchase Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Purchasing"
                    title="Purchase Dashboard"
                    description="Purchase orders, receiving, and supplier activity"
                    actions={
                        <div className="flex gap-2">
                            <Link href={PurchaseOrderRoutes.index().url}>
                                <Button variant="outline">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                    Purchase Orders
                                </Button>
                            </Link>
                            <Link href={PurchaseOrderRoutes.create().url}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> New PO
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    <StatCard
                        label="Purchase Orders"
                        value={m.total_pos}
                        icon={Layers}
                    />
                    <StatCard
                        label="Open"
                        value={m.open}
                        icon={Hourglass}
                        tone="warning"
                    />
                    <StatCard
                        label="Partial"
                        value={m.partially_received}
                        icon={Truck}
                        tone="warning"
                    />
                    <StatCard
                        label="Received"
                        value={m.received}
                        icon={CheckCircle2}
                        tone="success"
                    />
                    <StatCard
                        label="Cancelled"
                        value={m.cancelled}
                        icon={Ban}
                        tone="danger"
                    />
                    <StatCard
                        label="Purchase Value"
                        value={m.purchase_value}
                        icon={PackageCheck}
                    />
                    <StatCard
                        label="Active Suppliers"
                        value={m.suppliers_with_purchases}
                        icon={Users}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Outstanding Purchases</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Ordered</TableHead>
                                    <TableHead>Expected</TableHead>
                                    <TableHead className="text-right">
                                        Ordered Qty
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Received
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Remaining
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.outstanding.length === 0 ? (
                                    <TableEmpty colSpan={10}>
                                        No outstanding purchase orders.
                                    </TableEmpty>
                                ) : (
                                    purchases.outstanding.map((po) => (
                                        <TableRow key={po.id}>
                                            <TableCell className="font-mono">
                                                <Link
                                                    href={
                                                        PurchaseOrderRoutes.show(
                                                            po.id,
                                                        ).url
                                                    }
                                                    className="hover:underline"
                                                >
                                                    {po.po_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {po.supplier?.name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(po.ordered_at)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(po.expected_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {po.ordered_quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {po.received_quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {po.remaining_quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {po.total}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={po.status}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {canReceive(po.status) ? (
                                                    <Link
                                                        href={
                                                            PurchaseOrderRoutes.receive(
                                                                po.id,
                                                            ).url
                                                        }
                                                        className="text-primary font-medium hover:underline"
                                                    >
                                                        Receive
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={
                                                            PurchaseOrderRoutes.show(
                                                                po.id,
                                                            ).url
                                                        }
                                                        className="text-primary font-medium hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {purchases.outstanding.length > 0 && (
                            <div className="px-4 pt-4">
                                <Link
                                    href={PurchaseOrderRoutes.index().url}
                                    className="text-primary text-xs font-medium hover:underline"
                                >
                                    View all purchase orders →
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>PO Status Mix</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DonutChart
                                data={statusMix}
                                size={150}
                                centerValue={m.total_pos}
                                centerLabel="POs"
                                emptyText="No purchase orders yet."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Partially Received</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchases.partial.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    No partially received purchase orders.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-4">
                                    {purchases.partial.map((po) => (
                                        <li
                                            key={po.id}
                                            className="flex flex-col gap-1.5"
                                        >
                                            <div className="flex items-baseline justify-between gap-3 text-xs">
                                                <Link
                                                    href={
                                                        PurchaseOrderRoutes.show(
                                                            po.id,
                                                        ).url
                                                    }
                                                    className="min-w-0 truncate font-medium hover:underline"
                                                >
                                                    {po.po_number}
                                                    <span className="text-muted-foreground ml-2 font-normal">
                                                        {po.supplier?.name ||
                                                            'Unknown supplier'}
                                                    </span>
                                                </Link>
                                                <span className="text-muted-foreground shrink-0 font-mono tabular-nums">
                                                    {po.received_quantity} /{' '}
                                                    {po.ordered_quantity}
                                                </span>
                                            </div>
                                            <ProgressBar
                                                value={po.received_quantity}
                                                max={
                                                    po.ordered_quantity > 0
                                                        ? po.ordered_quantity
                                                        : 1
                                                }
                                                showValue
                                                valueLabel={`${po.remaining_quantity} left`}
                                            />
                                        </li>
                                    ))}
                                    <li>
                                        <Link
                                            href={
                                                PurchaseOrderRoutes.index().url
                                            }
                                            className="text-primary text-xs font-medium hover:underline"
                                        >
                                            View all purchase orders →
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Receiving Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchases.recent_receipts.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    No receiving activity yet.
                                </p>
                            ) : (
                                <ul className="divide-border/70 flex flex-col divide-y">
                                    {purchases.recent_receipts.map((r) => (
                                        <li
                                            key={r.id}
                                            className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm">
                                                    {r.receipt_number}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {r.purchase_order ? (
                                                        <Link
                                                            href={
                                                                PurchaseOrderRoutes.show(
                                                                    r
                                                                        .purchase_order
                                                                        .id,
                                                                ).url
                                                            }
                                                            className="hover:underline"
                                                        >
                                                            {
                                                                r.purchase_order
                                                                    .po_number
                                                            }
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                    {r.purchase_order?.supplier
                                                        ? ` · ${r.purchase_order.supplier.name}`
                                                        : ''}
                                                    {` · ${formatDate(r.received_at)}`}
                                                    {r.receiver
                                                        ? ` · by ${r.receiver.name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <span className="shrink-0 font-mono text-sm">
                                                {r.units_received ?? 0} units
                                            </span>
                                        </li>
                                    ))}
                                    <li className="pt-2.5">
                                        <Link
                                            href={InventoryRoutes.history().url}
                                            className="text-primary text-xs font-medium hover:underline"
                                        >
                                            View inventory history →
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <BarList
                                data={purchases.supplier_activity.map((s) => ({
                                    label: s.name,
                                    value: s.purchase_orders_count,
                                    meta: `${s.open_purchase_orders_count} open`,
                                    displayValue: s.purchase_value,
                                }))}
                                emptyText="No supplier purchase activity yet."
                            />
                            {purchases.supplier_activity.length > 0 && (
                                <Link
                                    href={SupplierRoutes.index().url}
                                    className="text-primary text-xs font-medium hover:underline"
                                >
                                    View all suppliers →
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Purchase Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">
                                            Total
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.recent_purchase_orders.length ===
                                    0 ? (
                                        <TableEmpty colSpan={5}>
                                            No purchase orders yet.
                                        </TableEmpty>
                                    ) : (
                                        purchases.recent_purchase_orders.map(
                                            (po) => (
                                                <TableRow key={po.id}>
                                                    <TableCell className="font-mono">
                                                        <Link
                                                            href={
                                                                PurchaseOrderRoutes.show(
                                                                    po.id,
                                                                ).url
                                                            }
                                                            className="hover:underline"
                                                        >
                                                            {po.po_number}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {po.supplier?.name ||
                                                            '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(
                                                            po.ordered_at,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {po.total}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            status={po.status}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    )}
                                </TableBody>
                            </Table>
                            {purchases.recent_purchase_orders.length > 0 && (
                                <div className="px-4 pt-4">
                                    <Link
                                        href={PurchaseOrderRoutes.index().url}
                                        className="text-primary text-xs font-medium hover:underline"
                                    >
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
