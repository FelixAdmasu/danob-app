import { Head, Link, router, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, titleCase } from '@/lib/format';
import { ArrowLeft } from 'lucide-react';
import * as OrderRoutes from '@/routes/admin/orders';
import type { Auth } from '@/types';

type OrderItem = {
    id: number;
    quantity: number;
    returned_quantity: number;
    unit_price: string;
    subtotal: string;
    // Relation keys serialize snake_case (Eloquent $snakeAttributes).
    product_variant: { id: number; name: string; sku?: string | null } | null;
};

type SalesReturn = {
    id: number;
    return_number: string;
    returned_at: string | null;
    total: string;
    returned_by: { id: number; name: string } | null;
    items: { id: number; quantity: number }[];
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
    returns: SalesReturn[];
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
    const isDelivered = order.status === 'delivered';

    // Server-side status validation (OrderService) lands in the shared errors
    // bag; surface it so blocked actions explain themselves.
    const actionError = errors?.status || errors?.quantity;

    const post = (action: 'confirm' | 'cancel' | 'deliver') =>
        router.post(OrderRoutes[action](order.id).url);

    const customerName =
        order.customer?.company_name || order.customer?.contact_name || '—';
    const orderedDate = formatDate(order.ordered_at);

    return (
        <>
            <Head title={order.reference_number} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        eyebrow="Sales"
                        title={order.reference_number}
                        description={`Customer: ${customerName} · Ordered: ${orderedDate} · Source: ${order.order_source} · Status: ${titleCase(order.status)}`}
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
                        {canManage && isDelivered && (
                            <Link href={OrderRoutes.processReturn(order.id).url}>
                                <Button>Process Return</Button>
                            </Link>
                        )}
                        <Link href={OrderRoutes.index().url}>
                            <Button variant="outline">
                                <ArrowLeft /> Back
                            </Button>
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
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Returned</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Line Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.product_variant?.name || '—'}</TableCell>
                                        <TableCell>{item.product_variant?.sku || '—'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.returned_quantity ?? 0}</TableCell>
                                        <TableCell>{item.unit_price}</TableCell>
                                        <TableCell>{item.subtotal}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="px-6">
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
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                            {order.notes && (
                                <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                                    {order.notes}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                {order.returns && order.returns.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Returns</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Return #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Lines</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Processed by</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.returns.map((salesReturn) => (
                                        <TableRow key={salesReturn.id}>
                                            <TableCell>{salesReturn.return_number}</TableCell>
                                            <TableCell>
                                                {formatDate(salesReturn.returned_at)}
                                            </TableCell>
                                            <TableCell>{salesReturn.items.length}</TableCell>
                                            <TableCell>{salesReturn.total}</TableCell>
                                            <TableCell>
                                                {salesReturn.returned_by?.name || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Orders', href: OrderRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
