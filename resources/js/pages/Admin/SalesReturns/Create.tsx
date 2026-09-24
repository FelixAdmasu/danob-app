import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as OrderRoutes from '@/routes/admin/orders';

type ReturnItem = {
    id: number;
    quantity: number;
    returned_quantity: number;
    unit_price: string;
    // Relation keys serialize snake_case (Eloquent $snakeAttributes).
    product_variant: { name: string; sku?: string | null } | null;
};

type Order = {
    id: number;
    reference_number: string;
    status: string;
    customer: { company_name?: string | null; contact_name?: string | null } | null;
    items: ReturnItem[];
};

export default function Create({ order }: { order: Order }) {
    const [quantities, setQuantities] = useState<Record<number, string>>(() =>
        Object.fromEntries(order.items.map((item) => [item.id, '0'])),
    );
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const customerName =
        order.customer?.company_name || order.customer?.contact_name || '—';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const items = order.items
            .filter((item) => Number(quantities[item.id] ?? 0) > 0)
            .map((item) => ({
                order_item_id: item.id,
                quantity: Number(quantities[item.id]),
            }));
        router.post(
            OrderRoutes.processReturn.store(order.id).url,
            { items, notes } as never,
            {
                onError: (err) => {
                    setErrors(err as Record<string, string>);
                    setProcessing(false);
                },
                onSuccess: () => setProcessing(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`Return ${order.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        eyebrow="Sales"
                        title={`Return ${order.reference_number}`}
                        description={`Customer: ${customerName} · Status: ${order.status}`}
                    />
                    <div className="flex items-center gap-2">
                        <Badge>{order.status}</Badge>
                        <Link href={OrderRoutes.show(order.id).url}>
                            <Button variant="outline">Back</Button>
                        </Link>
                    </div>
                </div>
                {(errors.order || errors.items || errors.quantity) && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                        {errors.order || errors.items || errors.quantity}
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => {
                                    const remaining = item.quantity - item.returned_quantity;
                                    const value = quantities[item.id] ?? '';
                                    if (remaining <= 0) {
                                        return (
                                            <div
                                                key={item.id}
                                                className="grid gap-3 rounded border p-4 opacity-60 md:grid-cols-3 xl:grid-cols-5"
                                            >
                                                <div className="space-y-1">
                                                    <Label>Product</Label>
                                                    <p className="text-sm">
                                                        {item.product_variant?.name || '—'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Ordered</Label>
                                                    <p className="text-sm">{item.quantity}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Already Returned</Label>
                                                    <p className="text-sm">{item.returned_quantity}</p>
                                                </div>
                                                <div className="space-y-1 xl:col-span-2">
                                                    <Label>Fully returned</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Nothing left to return on this line.
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div
                                            key={item.id}
                                            className="grid gap-3 rounded border p-4 md:grid-cols-3 xl:grid-cols-5"
                                        >
                                            <div className="space-y-1">
                                                <Label>Product</Label>
                                                <p className="text-sm">
                                                    {item.product_variant?.name || '—'}
                                                    {item.product_variant?.sku ? ` (${item.product_variant.sku})` : ''}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Ordered</Label>
                                                <p className="text-sm">{item.quantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Already Returned</Label>
                                                <p className="text-sm">{item.returned_quantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Unit Price</Label>
                                                <p className="text-sm">{item.unit_price}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`return-${item.id}`}>
                                                    Return (remaining: {remaining})
                                                </Label>
                                                <Input
                                                    id={`return-${item.id}`}
                                                    type="number"
                                                    min={0}
                                                    max={remaining}
                                                    value={value}
                                                    aria-invalid={errors.quantity ? true : undefined}
                                                    onChange={(e) =>
                                                        setQuantities((prev) => ({
                                                            ...prev,
                                                            [item.id]: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Value:{' '}
                                                    {(
                                                        (Number(quantities[item.id] ?? 0) || 0) *
                                                        Number(item.unit_price)
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="return-notes">Return notes</Label>
                                <Input
                                    id="return-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional"
                                />
                                {errors.notes && <p className="text-xs text-red-600 dark:text-red-400">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                order.items.every(
                                    (item) => Number(quantities[item.id] ?? 0) <= 0,
                                )
                            }
                        >
                            Process Return
                        </Button>
                        <Link href={OrderRoutes.show(order.id).url}>
                            <Button type="button" variant="outline">
                                Back
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Orders', href: OrderRoutes.index().url },
        { title: 'Process Return', href: '#' },
    ],
};
