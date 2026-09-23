import { Head, Link, router } from '@inertiajs/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Search } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as OrderRoutes from '@/routes/admin/orders';

type Customer = { id: number; company_name?: string | null; contact_name?: string | null };
type Variant = { id: number; product_id: number; name: string; sku?: string | null; public_price?: string | null };
type Product = { id: number; name: string; variants: Variant[] };

type Line = {
    product_variant_id: string;
    quantity: string;
    unit_price: string;
    product_name: string;
    variant_name: string;
    sku?: string | null;
};

type Props = {
    search: string;
    customers: Customer[];
    products: Product[];
};

export default function Create({ search: initialSearch, customers, products }: Props) {
    const [search, setSearch] = useState(initialSearch);
    const [customerId, setCustomerId] = useState('');
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unitPrice, setUnitPrice] = useState('0');
    const [items, setItems] = useState<Line[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const skipNextSearch = useRef(true);

    // Debounced, database-side catalog search: the partial reload swaps only
    // the `products` prop (name / variant name / SKU LIKE, active rows, capped
    // server-side), so form state and the customer list are untouched.
    useEffect(() => {
        if (skipNextSearch.current) {
            skipNextSearch.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                OrderRoutes.create().url,
                { search: search || undefined },
                { only: ['products'], preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const flatVariants = products.flatMap((p) => p.variants.map((v) => ({ ...v, product_name: p.name })));
    // Variants already on the order are hidden — uniqueness is prevented here
    // and enforced authoritatively by the server (`distinct` + service check).
    const availableVariants = flatVariants.filter((v) => !items.some((i) => Number(i.product_variant_id) === v.id));

    const selectVariant = (id: string) => {
        setVariantId(id);
        const variant = flatVariants.find((v) => String(v.id) === id);
        setUnitPrice(variant?.public_price ?? '0');
        setErrors((prev) => {
            const next = { ...prev };
            delete next.items;
            return next;
        });
    };

    const stepQuantity = (delta: number) => {
        setQuantity(String(Math.max(1, (Number(quantity) || 1) + delta)));
    };

    const addItem = () => {
        const variant = flatVariants.find((v) => String(v.id) === variantId);
        if (!variant) {
            setErrors((prev) => ({ ...prev, items: 'Select a product variant to add.' }));
            return;
        }
        if (items.some((i) => Number(i.product_variant_id) === variant.id)) {
            setErrors((prev) => ({ ...prev, items: 'That variant is already on the order.' }));
            return;
        }
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1) {
            setErrors((prev) => ({ ...prev, items: 'Quantity must be at least 1.' }));
            return;
        }
        const price = Number(unitPrice);
        if (Number.isNaN(price) || price < 0) {
            setErrors((prev) => ({ ...prev, items: 'Unit price cannot be negative.' }));
            return;
        }

        setItems((prev) => [
            ...prev,
            {
                product_variant_id: String(variant.id),
                quantity: String(qty),
                unit_price: unitPrice || '0',
                product_name: variant.product_name,
                variant_name: variant.name,
                sku: variant.sku,
            },
        ]);
        setVariantId('');
        setQuantity('1');
        setUnitPrice('0');
        setErrors((prev) => {
            const next = { ...prev };
            delete next.items;
            return next;
        });
    };

    const updateItem = (idx: number, field: 'quantity' | 'unit_price', value: string) => {
        setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };
    const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

    // Browser-side preview only — the server recalculates authoritatively in
    // integer cents and ignores any totals sent by the client.
    const lineTotal = (item: { quantity: string; unit_price: string }) =>
        ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2);
    const subtotal = items.reduce((sum, item) => sum + Number(lineTotal(item)), 0);
    const itemError = (idx: number) =>
        errors[`items.${idx}.quantity`] ??
        errors[`items.${idx}.unit_price`] ??
        errors[`items.${idx}.product_variant_id`];

    const submit = (intent: 'draft' | 'create') => {
        if (!customerId) {
            setErrors((prev) => ({ ...prev, customer_id: 'Please select a customer.' }));
            return;
        }
        if (items.length === 0) {
            setErrors((prev) => ({ ...prev, items: 'Add at least one item.' }));
            return;
        }

        setProcessing(true);
        router.post(
            OrderRoutes.store().url,
            {
                customer_id: Number(customerId),
                notes: notes || null,
                intent,
                items: items.map((item) => ({
                    product_variant_id: Number(item.product_variant_id),
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            } as never,
            {
                onError: (err) => setErrors(err as Record<string, string>),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="New Order" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="New Sales Order"
                    description="Creates a pending order — stock is deducted only on confirmation."
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Order Entry</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit('create');
                            }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="order-customer">Customer *</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger id="order-customer" aria-invalid={errors.customer_id ? true : undefined}>
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name || c.contact_name || `Customer #${c.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customer_id && (
                                    <p role="alert" className="text-xs text-red-600">{errors.customer_id}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="catalog-search">Product / SKU</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="catalog-search"
                                            className="pl-9"
                                            placeholder="Search products, variants or SKUs..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-12">
                                    <div className="space-y-2 md:col-span-6">
                                        <Label htmlFor="order-variant">Variant *</Label>
                                        <Select value={variantId} onValueChange={selectVariant}>
                                            <SelectTrigger id="order-variant">
                                                <SelectValue placeholder="Select variant" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableVariants.map((v) => (
                                                    <SelectItem key={v.id} value={String(v.id)}>
                                                        {v.product_name} — {v.name}
                                                        {v.sku ? ` (${v.sku})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {availableVariants.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                No matching variants — adjust the search or remove items above.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-3">
                                        <Label htmlFor="order-quantity">Quantity</Label>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Decrease quantity"
                                                onClick={() => stepQuantity(-1)}
                                            >
                                                <Minus />
                                            </Button>
                                            <Input
                                                id="order-quantity"
                                                className="text-center"
                                                type="number"
                                                min={1}
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Increase quantity"
                                                onClick={() => stepQuantity(1)}
                                            >
                                                <Plus />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-3">
                                        <Label htmlFor="order-unit-price">Unit Price</Label>
                                        <Input
                                            id="order-unit-price"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button type="button" variant="outline" onClick={addItem}>
                                    <Plus /> Add Item
                                </Button>

                                {errors.items && (
                                    <p role="alert" className="text-xs text-red-600">{errors.items}</p>
                                )}

                                {items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50 text-left">
                                                    <th className="h-10 px-2 font-medium">Product</th>
                                                    <th className="h-10 px-2 font-medium">SKU</th>
                                                    <th className="h-10 px-2 font-medium">Quantity</th>
                                                    <th className="h-10 px-2 font-medium">Unit Price</th>
                                                    <th className="h-10 px-2 font-medium">Subtotal</th>
                                                    <th className="h-10 px-2 font-medium">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <Fragment key={item.product_variant_id}>
                                                        <tr className="border-b">
                                                            <td className="px-2 py-2">
                                                                {item.product_name} — {item.variant_name}
                                                            </td>
                                                            <td className="px-2 py-2">{item.sku ?? '—'}</td>
                                                            <td className="px-2 py-2">
                                                                <Input
                                                                    aria-label={`Quantity for ${item.variant_name}`}
                                                                    className="w-20 text-center"
                                                                    type="number"
                                                                    min={1}
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <Input
                                                                    aria-label={`Unit price for ${item.variant_name}`}
                                                                    className="w-28"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={0}
                                                                    value={item.unit_price}
                                                                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 tabular-nums">{lineTotal(item)}</td>
                                                            <td className="px-2 py-2 text-right">
                                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                                                                    Remove
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        {itemError(idx) && (
                                                            <tr>
                                                                <td colSpan={6} className="px-2 pb-2">
                                                                    <p role="alert" className="text-xs text-red-600">{itemError(idx)}</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No items added yet.</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                {/* Orders carry no discount/tax columns, so total === subtotal.
                                    Values below are a preview; the server recomputes both. */}
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <output>{subtotal.toFixed(2)}</output>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total</span>
                                    <output className="text-base font-bold" aria-live="polite">{subtotal.toFixed(2)}</output>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order-notes">Notes</Label>
                                <textarea
                                    id="order-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                {errors.notes && (
                                    <p role="alert" className="text-xs text-red-600">{errors.notes}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" disabled={processing} onClick={() => submit('draft')}>
                                    Save Draft
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Create Order
                                </Button>
                                <Link href={OrderRoutes.index().url}>
                                    <Button type="button" variant="ghost">
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
        { title: 'Orders', href: OrderRoutes.index().url },
        { title: 'New Order', href: OrderRoutes.create().url },
    ],
};
