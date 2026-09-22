import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminQuickNav } from '@/components/admin-quick-nav';
import { dashboard } from '@/routes';
import * as InventoryRoutes from '@/routes/admin/inventory';

type Variant = { id: number; name: string; sku: string | null; quantity: number };
type Product = { id: number; name: string; slug: string; variants: Variant[] };

type Props = {
    products: Product[];
};

export default function Adjustments({ products }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flashSuccess = props.flash?.success;
    const [productId, setProductId] = useState<string>('');
    const [variantId, setVariantId] = useState<string>('');
    const [adjustmentType, setAdjustmentType] = useState<string>('adjustment_in');
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const selectedProduct = useMemo(() => products.find((p) => String(p.id) === productId) || null, [products, productId]);
    const selectedVariant = useMemo(() => selectedProduct?.variants.find((v) => String(v.id) === variantId) || null, [selectedProduct, variantId]);

    const preview = useMemo(() => {
        if (!selectedVariant || !quantity) return null;
        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) return null;
        const before = selectedVariant.quantity;
        const after = adjustmentType === 'adjustment_in' ? before + qty : before - qty;
        return { before, qty, after };
    }, [selectedVariant, quantity, adjustmentType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post(
            InventoryRoutes.adjustments.store().url,
            {
                product_id: productId ? Number(productId) : undefined,
                product_variant_id: variantId ? Number(variantId) : undefined,
                adjustment_type: adjustmentType,
                quantity: quantity ? Number(quantity) : undefined,
                reason: reason || undefined,
                notes: notes || undefined,
            } as never,
            {
                onError: (err) => {
                    setErrors(err as Record<string, string>);
                    setProcessing(false);
                },
                onSuccess: () => {
                    setQuantity('');
                    setReason('');
                    setNotes('');
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title="Stock Adjustments" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Inventory — Stock Adjustments</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Stock Adjustments</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Correct inventory with Adjustment In/Out. Creates an immutable ledger entry.</p>
                </div>

                {flashSuccess && <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flashSuccess}</div>}

                <AdminQuickNav />

                <Card>
                    <CardHeader>
                        <CardTitle>Adjust Stock</CardTitle>
                        <CardDescription>Select product/variant, choose Increase or Decrease, enter quantity and reason.</CardDescription>
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
                                        Current stock for <span className="font-medium">{selectedVariant.name}</span>: <span className="font-bold">{selectedVariant.quantity}</span>
                                    </p>
                                    {preview && (
                                        <p className="mt-2 text-xs">
                                            Current: {preview.before} | Adjustment: {adjustmentType === 'adjustment_in' ? '+' : '-'}
                                            {preview.qty} | <span className={preview.after < 0 ? 'text-red-600 font-bold' : 'font-bold'}>New: {preview.after}</span>
                                            {preview.after < 0 && <span className="text-red-600"> — will be blocked (negative stock)</span>}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Adjustment Type *</Label>
                                    <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="adjustment_in">Adjustment In (+)</SelectItem>
                                            <SelectItem value="adjustment_out">Adjustment Out (-)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.adjustment_type} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity *</Label>
                                    <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="e.g. 25" />
                                    <InputError message={errors.quantity} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason *</Label>
                                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. Physical count correction" />
                                <InputError message={errors.reason} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details" />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || !productId || !variantId || !quantity || !reason}>
                                    {processing ? 'Saving...' : 'Submit Adjustment'}
                                </Button>
                                <Link href={dashboard().url}>
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

Adjustments.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Inventory', href: '#' },
        { title: 'Stock Adjustments', href: InventoryRoutes.adjustments().url },
    ],
};
