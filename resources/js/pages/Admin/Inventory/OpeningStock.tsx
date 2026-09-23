import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as InventoryRoutes from '@/routes/admin/inventory';

type Variant = { id: number; name: string; sku: string | null; quantity: number };
type Product = { id: number; name: string; slug: string; variants: Variant[] };

type Props = {
    products: Product[];
};

export default function OpeningStock({ products }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flashSuccess = props.flash?.success;
    const [productId, setProductId] = useState<string>('');
    const [variantId, setVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const selectedProduct = useMemo(() => products.find((p) => String(p.id) === productId) || null, [products, productId]);
    const selectedVariant = useMemo(() => selectedProduct?.variants.find((v) => String(v.id) === variantId) || null, [selectedProduct, variantId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post(
            InventoryRoutes.openingStock.store().url,
            {
                product_id: productId ? Number(productId) : undefined,
                product_variant_id: variantId ? Number(variantId) : undefined,
                quantity: quantity ? Number(quantity) : undefined,
                notes: notes || undefined,
            } as never,
            {
                onError: (err) => {
                    setErrors(err as Record<string, string>);
                    setProcessing(false);
                },
                onSuccess: () => {
                    setQuantity('');
                    setNotes('');
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Opening Stock" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Inventory"
                    title="Opening Stock"
                    description="Establish initial inventory for a variant. This creates an opening_balance ledger entry."
                />

                {flashSuccess && <div className="rounded border border-green-200 bg-green-50 dark:border-[#477158] dark:bg-[#15261C] px-4 py-3 text-sm text-green-800 dark:text-[#95E6B6]">{flashSuccess}</div>}

                <Card>
                    <CardHeader>
                        <CardTitle>Set Opening Balance</CardTitle>
                        <CardDescription>Select product and variant, then enter the opening quantity. Allowed only once per variant.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Product *</Label>
                                    <Select
                                        value={productId}
                                        onValueChange={(v) => {
                                            setProductId(v);
                                            setVariantId('');
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.name} ({p.variants.length} variants)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Variant *</Label>
                                    <Select value={variantId} onValueChange={setVariantId} disabled={!selectedProduct}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedProduct ? 'Select variant' : 'Select product first'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProduct?.variants.map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.name} {v.sku ? `(${v.sku})` : ''} — Qty: {v.quantity}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_variant_id} />
                                </div>
                            </div>

                            {selectedVariant && (
                                <div className="rounded border bg-muted/30 p-4 text-sm">
                                    <p>
                                        Current quantity for <span className="font-medium">{selectedVariant.name}</span>: <span className="font-bold">{selectedVariant.quantity}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Opening stock will set this to the new quantity and record a ledger entry.</p>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Opening Quantity *</Label>
                                    <Input id="quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="e.g. 100" />
                                    <InputError message={errors.quantity} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason or reference" />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || !productId || !variantId || quantity === ''}>
                                    {processing ? 'Saving...' : 'Record Opening Stock'}
                                </Button>
                                <Link href="/admin">
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

OpeningStock.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Inventory', href: '#' },
        { title: 'Opening Stock', href: InventoryRoutes.openingStock().url },
    ],
};
