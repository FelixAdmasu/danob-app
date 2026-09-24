import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

type Supplier = { id: number; name: string };
type Variant = { id: number; name: string; product_id: number };
type Product = { id: number; name: string; variants: Variant[] };
type OrderItem = { id: number; product_variant_id: number; quantity: number; unit_cost: string };
type PurchaseOrder = { id: number; po_number: string; supplier_id: number; items: OrderItem[] };

type ItemState = { product_variant_id: string; quantity: string; unit_cost: string };

export default function Edit({
    purchase_order,
    suppliers,
    products,
}: {
    purchase_order: PurchaseOrder;
    suppliers: Supplier[];
    products: Product[];
}) {
    const [supplierId, setSupplierId] = useState(String(purchase_order.supplier_id));
    const [items, setItems] = useState<ItemState[]>(
        purchase_order.items.map((i) => ({
            product_variant_id: String(i.product_variant_id),
            quantity: String(i.quantity),
            unit_cost: String(i.unit_cost),
        })),
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addItem = () => setItems([...items, { product_variant_id: '', quantity: '1', unit_cost: '0' }]);
    const updateItem = (idx: number, field: string, value: string) => {
        const next = [...items];
        (next[idx] as Record<string, string>)[field] = value;
        setItems(next);
    };
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    // Browser-side preview only — the server recalculates authoritatively.
    const lineTotal = (item: ItemState) =>
        ((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)).toFixed(2);
    const poTotal = items.reduce((sum, item) => sum + Number(lineTotal(item)), 0);
    const itemError = (idx: number, field: string) => errors[`items.${idx}.${field}`];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put(
            PurchaseOrderRoutes.update(purchase_order.id).url,
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
            <Head title={`Edit ${purchase_order.po_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading eyebrow="Operations" title={`Edit ${purchase_order.po_number}`} description="Only draft orders can be edited" />
                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="edit-supplier">Supplier *</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger id="edit-supplier" aria-invalid={errors.supplier_id ? true : undefined}>
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
                                {errors.supplier_id && (
                                    <p role="alert" className="text-xs text-red-600 dark:text-red-400">{errors.supplier_id}</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid gap-3 rounded border p-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`edit-variant-${idx}`}>Variant *</Label>
                                            <Select value={item.product_variant_id} onValueChange={(v) => updateItem(idx, 'product_variant_id', v)}>
                                                <SelectTrigger id={`edit-variant-${idx}`} aria-invalid={itemError(idx, 'product_variant_id') ? true : undefined}>
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
                                            {itemError(idx, 'product_variant_id') && (
                                                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{itemError(idx, 'product_variant_id')}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`edit-quantity-${idx}`}>Quantity</Label>
                                            <Input
                                                id={`edit-quantity-${idx}`}
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                aria-invalid={itemError(idx, 'quantity') ? true : undefined}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                            />
                                            {itemError(idx, 'quantity') && (
                                                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{itemError(idx, 'quantity')}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`edit-unit-cost-${idx}`}>Unit Cost</Label>
                                            <Input
                                                id={`edit-unit-cost-${idx}`}
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                value={item.unit_cost}
                                                aria-invalid={itemError(idx, 'unit_cost') ? true : undefined}
                                                onChange={(e) => updateItem(idx, 'unit_cost', e.target.value)}
                                            />
                                            {itemError(idx, 'unit_cost') && (
                                                <p role="alert" className="text-xs text-red-600 dark:text-red-400">{itemError(idx, 'unit_cost')}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium leading-none">
                                                Line Total
                                            </span>
                                            <output
                                                htmlFor={`edit-quantity-${idx} edit-unit-cost-${idx}`}
                                                className="block rounded border bg-muted/50 px-3 py-2 text-sm"
                                            >
                                                {lineTotal(item)}
                                            </output>
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
                            <div className="flex items-center justify-between rounded border bg-muted/50 px-4 py-3">
                                <span className="text-sm text-muted-foreground">
                                    Estimated total (calculated by the server on save)
                                </span>
                                <output className="text-base font-bold" aria-live="polite">{poTotal.toFixed(2)}</output>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Save Changes
                                </Button>
                                <Link href={PurchaseOrderRoutes.show(purchase_order.id).url}>
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

Edit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
