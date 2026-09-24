import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, titleCase } from '@/lib/format';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import { ArrowLeft, Ban, CheckCircle2, PackageCheck, Pencil, Send } from 'lucide-react';

type OrderItem = {
    id: number;
    quantity: number;
    unit_cost: string;
    subtotal: string;
    received_quantity: number;
    variant: { name: string; product: { name: string } | null } | null;
};

type PurchaseOrder = {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string | null;
    supplier: { name: string } | null;
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    items: OrderItem[];
};

export default function Show({ purchase_order }: { purchase_order: PurchaseOrder }) {
    const canEdit = purchase_order.status === 'draft';
    const canSubmit = purchase_order.status === 'draft';
    const canApprove = purchase_order.status === 'submitted';
    const canCancel = !['received', 'cancelled'].includes(purchase_order.status);
    const canReceive = ['approved', 'partially_received'].includes(purchase_order.status);
    return (
        <>
            <Head title={purchase_order.po_number} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        eyebrow="Operations"
                        title={purchase_order.po_number}
                        description={`Supplier: ${purchase_order.supplier?.name || '—'} · Ordered: ${formatDate(
                            purchase_order.ordered_at,
                        )} · Status: ${titleCase(purchase_order.status)}`}
                    />
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link href={PurchaseOrderRoutes.edit(purchase_order.id).url}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                        {canSubmit && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.submit(purchase_order.id).url)}>
                                <Send className="mr-2 h-4 w-4" /> Submit
                            </Button>
                        )}
                        {canApprove && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.approve(purchase_order.id).url)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        )}
                        {canReceive && (
                            <Link href={PurchaseOrderRoutes.receive(purchase_order.id).url}>
                                <Button>
                                    <PackageCheck className="mr-2 h-4 w-4" /> Receive
                                </Button>
                            </Link>
                        )}
                        {canCancel && (
                            <Button variant="destructive" onClick={() => router.post(PurchaseOrderRoutes.cancel(purchase_order.id).url)}>
                                <Ban className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                        )}
                        <Link href={PurchaseOrderRoutes.index().url}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit Cost</TableHead>
                                    <TableHead>Line Total</TableHead>
                                    <TableHead>Received</TableHead>
                                    <TableHead>Remaining</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase_order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.variant?.product?.name || '—'}</TableCell>
                                        <TableCell>{item.variant?.name || '—'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.unit_cost}</TableCell>
                                        <TableCell>{item.subtotal}</TableCell>
                                        <TableCell>{item.received_quantity}</TableCell>
                                        <TableCell>{item.quantity - item.received_quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4 flex flex-col items-end gap-1 px-6 pb-2">
                            <div className="flex w-72 justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{purchase_order.subtotal}</span>
                            </div>
                            <div className="flex w-72 justify-between text-sm">
                                <span className="text-muted-foreground">Discount</span>
                                <span>{purchase_order.discount}</span>
                            </div>
                            <div className="flex w-72 justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span>{purchase_order.tax}</span>
                            </div>
                            <div className="flex w-72 justify-between border-t pt-1 font-bold">
                                <span>Total</span>
                                <span>{purchase_order.total}</span>
                            </div>
                            <div className="mt-2">
                                <StatusBadge status={purchase_order.status} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
