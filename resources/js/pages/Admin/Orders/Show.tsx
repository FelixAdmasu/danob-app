import { Head, Link, router, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import * as OrderRoutes from '@/routes/admin/orders';
import type { Auth } from '@/types';

type OrderItem = {
    id: number;
    quantity: number;
    unit_price: string;
    subtotal: string;
    productVariant: { id: number; name: string; sku?: string | null } | null;
};

type Order = {
    id: number;
    reference_number: string;
    status: string;
    order_source: string;
    subtotal: string;
    total: string;
    notes: string | null;
    ordered_at: string | null;
    customer: { id: number; company_name?: string | null; contact_name?: string | null } | null;
    items: OrderItem[];
};

export default function Show({ order }: { order: Order }) {
    const { auth, errors } = usePage().props as {
        auth: Auth;
        errors?: Record<string, string>;
    };
    const role = auth.user?.role as string | undefined;
    // Mirrors the route middleware (admin, manager + super_admin); the server
    // still enforces access — this only hides actions the user cannot use.
    const canManage = ['admin', 'manager', 'super_admin'].includes(role ?? '');

    const isPending = order.status === 'pending';
    const isConfirmed = order.status === 'confirmed';

    // Server-side status validation (OrderService) lands in the shared errors
    // bag; surface it so blocked actions explain themselves.
    const actionError = errors?.status || errors?.quantity;

    const post = (action: 'confirm' | 'cancel' | 'deliver') =>
        router.post(OrderRoutes[action](order.id).url);

    const customerName =
        order.customer?.company_name || order.customer?.contact_name || '—';
    const orderedDate = order.ordered_at
        ? new Date(order.ordered_at).toLocaleDateString()
        : '—';

    return (
        <>
            <Head title={order.reference_number} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title={order.reference_number}
                        description={`Customer: ${customerName} · Ordered: ${orderedDate} · Source: ${order.order_source} · Status: ${order.status}`}
                    />
                    <div className="flex gap-2">
                        {canManage && isPending && (
                            <Button onClick={() => post('confirm')}>Confirm</Button>
                        )}
                        {canManage && (isPending || isConfirmed) && (
                            <Button variant="destructive" onClick={() => post('cancel')}>
                                Cancel
                            </Button>
                        )}
                        {canManage && isConfirmed && (
                            <Button onClick={() => post('deliver')}>Deliver</Button>
                        )}
                        <Link href={OrderRoutes.index().url}>
                            <Button variant="outline">Back</Button>
                        </Link>
                    </div>
                </div>
                {actionError && (
                    <div
                        role="alert"
                        className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        {actionError}
                    </div>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b">
                                    <tr className="text-left text-xs">
                                        <th className="px-3 py-2">Variant</th>
                                        <th className="px-3 py-2">SKU</th>
                                        <th className="px-3 py-2">Qty</th>
                                        <th className="px-3 py-2">Unit Price</th>
                                        <th className="px-3 py-2">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="px-3 py-2">{item.productVariant?.name || '—'}</td>
                                            <td className="px-3 py-2">{item.productVariant?.sku || '—'}</td>
                                            <td className="px-3 py-2">{item.quantity}</td>
                                            <td className="px-3 py-2">{item.unit_price}</td>
                                            <td className="px-3 py-2">{item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex flex-col items-end gap-1">
                            <div className="flex w-72 justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{order.subtotal}</span>
                            </div>
                            <div className="flex w-72 justify-between border-t pt-1 font-bold">
                                <span>Total</span>
                                <span>{order.total}</span>
                            </div>
                            <div className="mt-2">
                                <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </div>
                        </div>
                        {order.notes && (
                            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                                {order.notes}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Orders', href: OrderRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
