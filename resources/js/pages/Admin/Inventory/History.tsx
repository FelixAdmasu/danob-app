import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as InventoryRoutes from '@/routes/admin/inventory';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, titleCase } from '@/lib/format';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

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
    total: number;
};

type Props = {
    movements: PaginatedMovements;
    filters: {
        search: string | null;
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
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState<string>(filters.product_id ? String(filters.product_id) : 'all');
    const [variantId, setVariantId] = useState<string>(filters.variant_id ? String(filters.variant_id) : 'all');
    const [movementType, setMovementType] = useState<string>(filters.movement_type || 'all');
    const [userId, setUserId] = useState<string>(filters.user_id ? String(filters.user_id) : 'all');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const activeCount = [
        search.trim(),
        productId !== 'all' ? productId : '',
        variantId !== 'all' ? variantId : '',
        movementType !== 'all' ? movementType : '',
        userId !== 'all' ? userId : '',
        dateFrom,
        dateTo,
    ].filter((v) => v !== '').length;

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.get(
            InventoryRoutes.history().url,
            {
                search: search.trim() || undefined,
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
        setSearch('');
        setProductId('all');
        setVariantId('all');
        setMovementType('all');
        setUserId('all');
        setDateFrom('');
        setDateTo('');
        router.get(InventoryRoutes.history().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Inventory History" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Inventory"
                    title="Inventory History"
                    description="Search and filter the full stock movement ledger."
                />

                <FilterPanel onSubmit={handleFilter} onClear={clearFilters} activeCount={activeCount}>
                    <FilterField label="Search" htmlFor="history-search" className="sm:col-span-2">
                        <Input
                            id="history-search"
                            placeholder="Search reason, notes, product or variant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="Product">
                        <Select value={productId} onValueChange={setProductId}>
                            <SelectTrigger className="w-full">
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
                    </FilterField>
                    <FilterField label="Variant">
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger className="w-full">
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
                    </FilterField>
                    <FilterField label="Type">
                        <Select value={movementType} onValueChange={setMovementType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {movement_types.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {titleCase(t)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="User">
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger className="w-full">
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
                    </FilterField>
                    <FilterField label="From" htmlFor="history-date-from">
                        <Input
                            id="history-date-from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="To" htmlFor="history-date-to">
                        <Input
                            id="history-date-to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>Stock movements</CardTitle>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {movements.total.toLocaleString()} record{movements.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product / Variant</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Change</TableHead>
                                    <TableHead>Before → After</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>User</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No movements match these filters.</TableEmpty>
                                ) : (
                                    movements.data.map((m) => {
                                        const delta = m.quantity_after - m.quantity_before;
                                        const increase = delta >= 0;
                                        return (
                                            <TableRow key={m.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="text-[13px] font-medium tabular-nums">
                                                        {formatDate(m.created_at)}
                                                    </div>
                                                    <div className="text-xs tabular-nums text-muted-foreground">
                                                        {formatTime(m.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{m.variant.product.name}</div>
                                                    <div className="text-xs text-muted-foreground">{m.variant.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={increase ? 'success' : 'destructive'}>
                                                        {increase ? (
                                                            <ArrowUpRight aria-hidden="true" />
                                                        ) : (
                                                            <ArrowDownRight aria-hidden="true" />
                                                        )}
                                                        {titleCase(m.movement_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell
                                                    className={cn(
                                                        'text-right font-mono font-medium tabular-nums',
                                                        increase
                                                            ? 'text-[#2D5016] dark:text-[#95E6B6]'
                                                            : 'text-red-600 dark:text-red-400',
                                                    )}
                                                >
                                                    {increase ? '+' : '−'}
                                                    {Math.abs(delta)}
                                                </TableCell>
                                                <TableCell className="font-mono text-[13px] tabular-nums">
                                                    <span className="text-muted-foreground">{m.quantity_before}</span>
                                                    <span className="mx-1.5 text-muted-foreground/60">→</span>
                                                    <span className="font-medium">{m.quantity_after}</span>
                                                </TableCell>
                                                <TableCell className="max-w-[240px]">
                                                    <div className="truncate" title={m.reason || ''}>
                                                        {m.reason || '—'}
                                                    </div>
                                                    {m.notes && (
                                                        <div
                                                            className="truncate text-xs text-muted-foreground"
                                                            title={m.notes}
                                                        >
                                                            {m.notes}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{m.user?.name || '—'}</TableCell>
                                            </TableRow>
                                        );
                                    })
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
