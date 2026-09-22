import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminQuickNav } from '@/components/admin-quick-nav';
import { dashboard } from '@/routes';
import * as InventoryRoutes from '@/routes/admin/inventory';

type Movement = {
    id: number;
    product_variant_id: number;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string | null;
    notes: string | null;
    reference_type: string | null;
    reference_id: number | null;
    user_id: number | null;
    created_at: string;
    variant: { id: number; name: string; product: { id: number; name: string } };
    user: { id: number; name: string } | null;
};

type PaginatedMovements = {
    data: Movement[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    movements: PaginatedMovements;
    filters: {
        product_id: number | null;
        variant_id: number | null;
        movement_type: string | null;
        user_id: number | null;
        date_from: string | null;
        date_to: string | null;
    };
    products: { id: number; name: string }[];
    variants: { id: number; name: string; product_id: number }[];
    users: { id: number; name: string }[];
    movement_types: string[];
};

export default function History({ movements, filters, products, variants, users, movement_types }: Props) {
    const [productId, setProductId] = useState<string>(filters.product_id ? String(filters.product_id) : 'all');
    const [variantId, setVariantId] = useState<string>(filters.variant_id ? String(filters.variant_id) : 'all');
    const [movementType, setMovementType] = useState<string>(filters.movement_type || 'all');
    const [userId, setUserId] = useState<string>(filters.user_id ? String(filters.user_id) : 'all');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            InventoryRoutes.history().url,
            {
                product_id: productId !== 'all' ? productId : undefined,
                variant_id: variantId !== 'all' ? variantId : undefined,
                movement_type: movementType !== 'all' ? movementType : undefined,
                user_id: userId !== 'all' ? userId : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(InventoryRoutes.history().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Inventory History" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Inventory — History</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Inventory History</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Searchable, filterable, paginated stock movement ledger.</p>
                </div>

                <AdminQuickNav />

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div className="space-y-2">
                                <Label>Product</Label>
                                <Select value={productId} onValueChange={setProductId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All products</SelectItem>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Variant</Label>
                                <Select value={variantId} onValueChange={setVariantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All variants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All variants</SelectItem>
                                        {variants
                                            .filter((v) => productId === 'all' || String(v.product_id) === productId)
                                            .map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={movementType} onValueChange={setMovementType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        {movement_types.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>User</Label>
                                <Select value={userId} onValueChange={setUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All users</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_from">From</Label>
                                <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">To</Label>
                                <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                            <div className="flex gap-2 md:col-span-3 lg:col-span-6">
                                <Button type="submit">Filter</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Product / Variant</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">Before → After</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3">User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No movements found. Try adjusting filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.data.map((m) => (
                                            <tr key={m.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="font-medium">{m.variant.product.name}</div>
                                                    <div className="text-xs text-muted-foreground">{m.variant.name}{m.variant.id ? ` — ${m.variant.id}` : ''}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={m.movement_type.includes('in') || m.movement_type === 'purchase' || m.movement_type === 'opening_balance' ? 'default' : 'secondary'}>
                                                        {m.movement_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{m.quantity}</td>
                                                <td className="px-4 py-3 text-xs font-mono">
                                                    {m.quantity_before} → {m.quantity_after}
                                                </td>
                                                <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={m.reason || ''}>
                                                    {m.reason || '—'}
                                                    {m.notes && <div className="text-[10px] text-muted-foreground">{m.notes}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-xs">{m.user?.name || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {movements.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {movements.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white' : 'bg-white'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i} className="px-3 py-1 text-xs opacity-30" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

History.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Inventory', href: '#' },
        { title: 'History', href: InventoryRoutes.history().url },
    ],
};
