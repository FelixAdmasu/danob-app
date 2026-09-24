import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as InventoryRoutes from '@/routes/admin/inventory';
import { Filter, X } from 'lucide-react';

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
                <Heading
                    eyebrow="Inventory"
                    title="Inventory History"
                    description="Searchable, filterable, paginated stock movement ledger."
                />

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors dark:border-border/60 dark:shadow-none">
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
                    <div className="flex gap-2">
                        <Button type="submit">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            <X className="mr-2 h-4 w-4" /> Clear
                        </Button>
                    </div>
                </form>

                <Card>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product / Variant</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Before → After</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>User</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No movements found. Try adjusting filters.</TableEmpty>
                                ) : (
                                    movements.data.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{m.variant.product.name}</div>
                                                <div className="text-xs text-muted-foreground">{m.variant.name}{m.variant.id ? ` — ${m.variant.id}` : ''}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={m.movement_type.includes('in') || m.movement_type === 'purchase' || m.movement_type === 'opening_balance' ? 'success' : 'secondary'}>
                                                    {m.movement_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                                            <TableCell className="font-mono">
                                                {m.quantity_before} → {m.quantity_after}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={m.reason || ''}>
                                                {m.reason || '—'}
                                                {m.notes && <div className="text-[10px] text-muted-foreground">{m.notes}</div>}
                                            </TableCell>
                                            <TableCell>{m.user?.name || '—'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {movements.last_page > 1 && <Pagination links={movements.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

History.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Inventory', href: '#' },
        { title: 'History', href: InventoryRoutes.history().url },
    ],
};
