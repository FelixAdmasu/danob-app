import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

type ReceiveItem = {
    id: number;
    quantity: number;
    received_quantity: number;
    remaining: number;
    unit_cost: string;
    variant: { name: string; product: { name: string } | null } | null;
};

type PurchaseOrder = {
    id: number;
    po_number: string;
    status: string;
    supplier: { name: string } | null;
    items: ReceiveItem[];
};

export default function Receive({ purchase_order }: { purchase_order: PurchaseOrder }) {
    const [quantities, setQuantities] = useState<Record<number, string>>(() =>
        Object.fromEntries(purchase_order.items.map((item) => [item.id, '0'])),
    );
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const items = purchase_order.items
            .filter((item) => Number(quantities[item.id] ?? 0) > 0)
            .map((item) => ({
                purchase_order_item_id: item.id,
                quantity: Number(quantities[item.id]),
            }));
        router.post(
            PurchaseOrderRoutes.receive.store(purchase_order.id).url,
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
            <Head title={`Receive ${purchase_order.po_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`Receive ${purchase_order.po_number}`}
                        description={`Supplier: ${purchase_order.supplier?.name || '—'}`}
                    />
                    <div className="flex items-center gap-2">
                        <Badge>{purchase_order.status}</Badge>
                        <Link href={PurchaseOrderRoutes.show(purchase_order.id).url}>
                            <Button variant="outline">Back</Button>
                        </Link>
                    </div>
                </div>
                {(errors.purchase_order || errors.items || errors.quantity) && (
                    <p className="text-sm text-red-600">
                        {errors.purchase_order || errors.items || errors.quantity}
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {purchase_order.items.map((item) => {
                                    const remaining = item.quantity - item.received_quantity;
                                    const value = quantities[item.id] ?? '';
                                    return (
                                        <div
                                            key={item.id}
                                            className="grid gap-3 rounded border p-4 md:grid-cols-3 xl:grid-cols-5"
                                        >
                                            <div className="space-y-1">
                                                <Label>Product</Label>
                                                <p className="text-sm">
                                                    {item.variant?.product?.name || '—'} — {item.variant?.name || '—'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Ordered</Label>
                                                <p className="text-sm">{item.quantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Already Received</Label>
                                                <p className="text-sm">{item.received_quantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Unit Cost</Label>
                                                <p className="text-sm">{item.unit_cost}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`receive-${item.id}`}>
                                                    Receive (remaining: {remaining})
                                                </Label>
                                                <Input
                                                    id={`receive-${item.id}`}
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
                                                        Number(item.unit_cost)
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
                                <Label htmlFor="receive-notes">Receiving notes</Label>
                                <Input
                                    id="receive-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional"
                                />
                                {errors.notes && <p className="text-xs text-red-600">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                purchase_order.items.every(
                                    (item) => Number(quantities[item.id] ?? 0) <= 0,
                                )
                            }
                        >
                            Receive
                        </Button>
                        <Link href={PurchaseOrderRoutes.show(purchase_order.id).url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

Receive.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Receive', href: '#' },
    ],
};
