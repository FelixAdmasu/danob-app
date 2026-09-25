import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import { Plus, Trash2 } from 'lucide-react';

type Supplier = { id: number; name: string };
type Variant = { id: number; name: string; product_id: number };
type Product = { id: number; name: string; variants: Variant[] };

export default function Create({
    suppliers,
    products,
}: {
    suppliers: Supplier[];
    products: Product[];
}) {
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([
        { product_variant_id: '', quantity: '1', unit_cost: '0' },
    ]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addItem = () =>
        setItems([
            ...items,
            { product_variant_id: '', quantity: '1', unit_cost: '0' },
        ]);
    const updateItem = (idx: number, field: string, value: string) => {
        const next = [...items];
        (next[idx] as Record<string, string>)[field] = value;
        setItems(next);
    };
    const removeItem = (idx: number) =>
        setItems(items.filter((_, i) => i !== idx));

    // Browser-side preview only — the server recalculates authoritatively.
    const lineTotal = (item: { quantity: string; unit_cost: string }) =>
        ((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)).toFixed(
            2,
        );
    const poTotal = items.reduce(
        (sum, item) => sum + Number(lineTotal(item)),
        0,
    );
    const itemError = (idx: number, field: string) =>
        errors[`items.${idx}.${field}`];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            PurchaseOrderRoutes.store().url,
            {
                supplier_id: Number(supplierId),
                items: items.map((i) => ({
                    product_variant_id: Number(i.product_variant_id),
                    quantity: Number(i.quantity),
                    unit_cost: Number(i.unit_cost),
                })),
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
                <Heading
                    eyebrow="Operations"
                    title="Create Purchase Order"
                    description="Add supplier and items"
                />
                <Card>
                    <CardHeader>
                        <CardTitle>New PO</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="po-supplier">Supplier *</Label>
                                <Select
                                    value={supplierId}
                                    onValueChange={setSupplierId}
                                >
                                    <SelectTrigger
                                        id="po-supplier"
                                        aria-invalid={
                                            errors.supplier_id
                                                ? true
                                                : undefined
                                        }
                                    >
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && (
                                    <p
                                        role="alert"
                                        className="text-xs text-red-600 dark:text-red-400"
                                    >
                                        {errors.supplier_id}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="grid gap-3 rounded border p-4 md:grid-cols-4"
                                    >
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`po-variant-${idx}`}
                                            >
                                                Variant *
                                            </Label>
                                            <Select
                                                value={item.product_variant_id}
                                                onValueChange={(v) =>
                                                    updateItem(
                                                        idx,
                                                        'product_variant_id',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id={`po-variant-${idx}`}
                                                    aria-invalid={
                                                        itemError(
                                                            idx,
                                                            'product_variant_id',
                                                        )
                                                            ? true
                                                            : undefined
                                                    }
                                                >
                                                    <SelectValue placeholder="Variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.flatMap((p) =>
                                                        p.variants.map((v) => (
                                                            <SelectItem
                                                                key={v.id}
                                                                value={String(
                                                                    v.id,
                                                                )}
                                                            >
                                                                {p.name} —{' '}
                                                                {v.name}
                                                            </SelectItem>
                                                        )),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {itemError(
                                                idx,
                                                'product_variant_id',
                                            ) && (
                                                <p
                                                    role="alert"
                                                    className="text-xs text-red-600 dark:text-red-400"
                                                >
                                                    {itemError(
                                                        idx,
                                                        'product_variant_id',
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`po-quantity-${idx}`}
                                            >
                                                Quantity
                                            </Label>
                                            <Input
                                                id={`po-quantity-${idx}`}
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                aria-invalid={
                                                    itemError(idx, 'quantity')
                                                        ? true
                                                        : undefined
                                                }
                                                onChange={(e) =>
                                                    updateItem(
                                                        idx,
                                                        'quantity',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {itemError(idx, 'quantity') && (
                                                <p
                                                    role="alert"
                                                    className="text-xs text-red-600 dark:text-red-400"
                                                >
                                                    {itemError(idx, 'quantity')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`po-unit-cost-${idx}`}
                                            >
                                                Unit Cost
                                            </Label>
                                            <Input
                                                id={`po-unit-cost-${idx}`}
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                value={item.unit_cost}
                                                aria-invalid={
                                                    itemError(idx, 'unit_cost')
                                                        ? true
                                                        : undefined
                                                }
                                                onChange={(e) =>
                                                    updateItem(
                                                        idx,
                                                        'unit_cost',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {itemError(idx, 'unit_cost') && (
                                                <p
                                                    role="alert"
                                                    className="text-xs text-red-600 dark:text-red-400"
                                                >
                                                    {itemError(
                                                        idx,
                                                        'unit_cost',
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Line Total
                                            </span>
                                            <output
                                                htmlFor={`po-quantity-${idx} po-unit-cost-${idx}`}
                                                className="bg-muted/50 block rounded border px-3 py-2 text-sm"
                                            >
                                                {lineTotal(item)}
                                            </output>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => removeItem(idx)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addItem}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>
                            <div className="bg-muted/50 flex items-center justify-between rounded border px-4 py-3">
                                <span className="text-muted-foreground text-sm">
                                    Estimated total (calculated by the server on
                                    save)
                                </span>
                                <output
                                    className="text-base font-bold"
                                    aria-live="polite"
                                >
                                    {poTotal.toFixed(2)}
                                </output>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    <Plus className="mr-2 h-4 w-4" /> Create
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Create', href: PurchaseOrderRoutes.create().url },
    ],
};
