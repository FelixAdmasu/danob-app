import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

export default function Show({ purchase_order }: { purchase_order: { id: number; po_number: string; status: string; supplier: { name: string } | null; total: string; subtotal: string; items: { id: number; quantity: number; unit_cost: string; subtotal: string; received_quantity: number; variant: { name: string; product: { name: string } | null } | null }[] } }) {
    const canSubmit = purchase_order.status === 'draft';
    const canApprove = purchase_order.status === 'submitted';
    const canCancel = !['received', 'cancelled'].includes(purchase_order.status);
    return (
        <>
            <Head title={purchase_order.po_number} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title={purchase_order.po_number} description={`Status: ${purchase_order.status}`} />
                    <div className="flex gap-2">
                        {canSubmit && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.submit(purchase_order.id).url)}>Submit</Button>
                        )}
                        {canApprove && (
                            <Button onClick={() => router.post(PurchaseOrderRoutes.approve(purchase_order.id).url)}>Approve</Button>
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
                                        <th className="px-3 py-2">Subtotal</th>
                                        <th className="px-3 py-2">Received</th>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Badge>{purchase_order.status}</Badge>
                            <span className="ml-4 font-bold">Total: {purchase_order.total}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
