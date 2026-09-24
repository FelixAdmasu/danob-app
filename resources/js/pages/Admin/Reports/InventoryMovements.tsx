import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportExportButton } from '@/components/report-export-button';
import { ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';
import ReportRoutes from '@/routes/admin/reports';

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
    summary: { movement_count: number; units_in: number; units_out: number };
    filters: {
        product_id: number | null;
        variant_id: number | null;
        movement_type: string | null;
        user_id: number | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    products: { id: number; name: string }[];
    variants: { id: number; name: string; product_id: number }[];
    users: { id: number; name: string }[];
    movement_types: string[];
};

function referenceLabel(movement: Movement): string {
    if (!movement.reference_type || !movement.reference_id) {
        return '—';
    }
    const segments = movement.reference_type.split('\\');
    return `${segments[segments.length - 1]} #${movement.reference_id}`;
}

export default function InventoryMovements({ movements, summary, filters, products, variants, users, movement_types }: Props) {
    const [productId, setProductId] = useState<string>(filters.product_id ? String(filters.product_id) : 'all');
    const [variantId, setVariantId] = useState<string>(filters.variant_id ? String(filters.variant_id) : 'all');
    const [movementType, setMovementType] = useState<string>(filters.movement_type || 'all');
    const [userId, setUserId] = useState<string>(filters.user_id ? String(filters.user_id) : 'all');
    const [search, setSearch] = useState<string>(filters.search || '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.inventoryMovements().url,
            {
                product_id: productId !== 'all' ? productId : undefined,
                variant_id: variantId !== 'all' ? variantId : undefined,
                movement_type: movementType !== 'all' ? movementType : undefined,
                user_id: userId !== 'all' ? userId : undefined,
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.inventoryMovements().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Inventory Movements Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Reports — Inventory Movements"
                    title="Inventory Movements"
                    description="Review stock changes across products, variants, users and movement types."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Movements" value={summary.movement_count} icon={History} />
                    <StatCard label="Units In" value={summary.units_in} icon={ArrowDownToLine} tone="success" />
                    <StatCard label="Units Out" value={summary.units_out} icon={ArrowUpFromLine} />
                </div>

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors dark:border-border/60 dark:shadow-none">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            placeholder="Search by reason, variant, SKU or product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
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
                        <Button type="submit">Filter</Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                        <ReportExportButton url={ReportRoutes.inventoryMovements.export().url} filters={filters} />
                    </div>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>All Movements</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product / Variant</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Before → After</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>User</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.length === 0 ? (
                                    <TableEmpty colSpan={8}>No inventory movements found.</TableEmpty>
                                ) : (
                                    movements.data.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="text-xs">{new Date(m.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-sm">
                                                <div className="font-medium">{m.variant.product.name}</div>
                                                <div className="text-xs text-muted-foreground">{m.variant.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{m.movement_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-mono">{m.quantity}</TableCell>
                                            <TableCell className="text-right text-xs font-mono">
                                                {m.quantity_before} → {m.quantity_after}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs" title={m.reason || ''}>
                                                {m.reason || '—'}
                                                {m.notes && <div className="text-[10px] text-muted-foreground">{m.notes}</div>}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">{referenceLabel(m)}</TableCell>
                                            <TableCell className="text-xs">{m.user?.name || '—'}</TableCell>
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

InventoryMovements.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Inventory Movements', href: '#' },
    ],
};
