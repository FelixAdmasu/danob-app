import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

type Supplier = { id: number; name: string };
type Variant = { id: number; name: string; product_id: number };
type Product = { id: number; name: string; variants: Variant[] };

export default function Create({ suppliers, products }: { suppliers: Supplier[]; products: Product[] }) {
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([{ product_variant_id: '', quantity: '1', unit_cost: '0' }]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addItem = () => setItems([...items, { product_variant_id: '', quantity: '1', unit_cost: '0' }]);
    const updateItem = (idx: number, field: string, value: string) => {
        const next = [...items];
        (next[idx] as Record<string, string>)[field] = value;
        setItems(next);
    };
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            PurchaseOrderRoutes.store().url,
            {
                supplier_id: Number(supplierId),
                items: items.map((i) => ({ product_variant_id: Number(i.product_variant_id), quantity: Number(i.quantity), unit_cost: Number(i.unit_cost) })),
            } as never,
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
            <Head title="Create Purchase Order" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="Create Purchase Order" description="Add supplier and items" />
                <Card>
                    <CardHeader>
                        <CardTitle>New PO</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Supplier *</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-xs text-red-600">{errors.supplier_id}</p>}
                            </div>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid gap-3 md:grid-cols-3 rounded border p-4">
                                        <div className="space-y-2">
                                            <Label>Variant *</Label>
                                            <Select value={item.product_variant_id} onValueChange={(v) => updateItem(idx, 'product_variant_id', v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.flatMap((p) => p.variants.map((v) => (
                                                        <SelectItem key={v.id} value={String(v.id)}>
                                                            {p.name} — {v.name}
                                                        </SelectItem>
                                                    )))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unit Cost</Label>
                                            <Input type="number" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(idx, 'unit_cost', e.target.value)} />
                                        </div>
                                        <Button type="button" variant="ghost" onClick={() => removeItem(idx)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={addItem}>
                                    Add Item
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Create
                                </Button>
                                <Link href={PurchaseOrderRoutes.index().url}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Create', href: PurchaseOrderRoutes.create().url },
    ],
};
