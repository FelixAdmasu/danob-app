import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

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
                        title={purchase_order.po_number}
                        description={`Supplier: ${purchase_order.supplier?.name || '—'} · Ordered: ${
                            purchase_order.ordered_at ? new Date(purchase_order.ordered_at).toLocaleDateString() : '—'
                        } · Status: ${purchase_order.status}`}
                    />
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link href={PurchaseOrderRoutes.edit(purchase_order.id).url}>
                                <Button variant="outline">Edit</Button>
                            </Link>
                        )}
                        {canSubmit && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.submit(purchase_order.id).url)}>Submit</Button>
                        )}
                        {canApprove && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.approve(purchase_order.id).url)}>Approve</Button>
                        )}
                        {canReceive && (
                            <Link href={PurchaseOrderRoutes.receive(purchase_order.id).url}>
                                <Button>Receive</Button>
                            </Link>
                        )}
                        {canCancel && (
                            <Button variant="destructive" onClick={() => router.post(PurchaseOrderRoutes.cancel(purchase_order.id).url)}>
                                Cancel
                            </Button>
                        )}
                        <Link href={PurchaseOrderRoutes.index().url}>
                            <Button variant="outline">Back</Button>
                        </Link>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b">
                                    <tr className="text-left text-xs">
                                        <th className="px-3 py-2">Product</th>
                                        <th className="px-3 py-2">Variant</th>
                                        <th className="px-3 py-2">Qty</th>
                                        <th className="px-3 py-2">Unit Cost</th>
                                        <th className="px-3 py-2">Line Total</th>
                                        <th className="px-3 py-2">Received</th>
                                        <th className="px-3 py-2">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchase_order.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-3 py-2">{item.variant?.product?.name || '—'}</td>
                                            <td className="px-3 py-2">{item.variant?.name || '—'}</td>
                                            <td className="px-3 py-2">{item.quantity}</td>
                                            <td className="px-3 py-2">{item.unit_cost}</td>
                                            <td className="px-3 py-2">{item.subtotal}</td>
                                            <td className="px-3 py-2">{item.received_quantity}</td>
                                            <td className="px-3 py-2">{item.quantity - item.received_quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex flex-col items-end gap-1">
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
                                <Badge>{purchase_order.status}</Badge>
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
