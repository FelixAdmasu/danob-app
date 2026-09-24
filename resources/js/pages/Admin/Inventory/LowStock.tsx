import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { Pagination } from '@/components/pagination';
import { ProgressBar } from '@/components/progress-bar';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as InventoryRoutes from '@/routes/admin/inventory';
import * as ProductRoutes from '@/routes/admin/products';
import { AlertTriangle, Eye, Layers, Package } from 'lucide-react';

type VariantRow = {
    id: number;
    name: string;
    sku: string | null;
    quantity: number;
    low_stock_threshold: number | null;
    stock_status: string;
    product: { id: number; name: string };
};

type PaginatedVariants = {
    data: VariantRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    variants: PaginatedVariants;
    counts: { low: number; out: number; monitored: number };
    filters: { status: string; search: string | null };
};

export default function LowStock({ variants, counts, filters }: Props) {
    const [status, setStatus] = useState<string>(filters.status || 'attention');
    const [search, setSearch] = useState<string>(filters.search || '');

    const activeCount = [status !== 'attention' ? status : '', search.trim()].filter((v) => v !== '').length;

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.get(
            InventoryRoutes.lowStock().url,
            { status, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setStatus('attention');
        setSearch('');
        router.get(InventoryRoutes.lowStock().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Low Stock" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Inventory"
                    title="Low Stock"
                    description="Variants that are out of stock or at/below their low-stock threshold."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Low Stock" value={counts.low} icon={AlertTriangle} tone="warning" />
                    <StatCard label="Out of Stock" value={counts.out} icon={Package} tone="danger" />
                    <StatCard label="Monitored Variants" value={counts.monitored} icon={Layers} />
                </div>

                <FilterPanel onSubmit={handleFilter} onClear={clearFilters} activeCount={activeCount}>
                    <FilterField label="Search" htmlFor="search" className="sm:col-span-2">
                        <Input
                            id="search"
                            placeholder="Search by product, variant or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="Status">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Needs attention" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="attention">Needs Attention</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">Out of Stock</SelectItem>
                                <SelectItem value="monitored">All Monitored Variants</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>Stock levels</CardTitle>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {variants.total.toLocaleString()} record{variants.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Threshold</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No variants found. Try adjusting filters.</TableEmpty>
                                ) : (
                                    variants.data.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.product.name}</TableCell>
                                            <TableCell>{v.name}</TableCell>
                                            <TableCell className="font-mono">{v.sku || '—'}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {v.quantity}
                                                {(v.low_stock_threshold ?? 0) > 0 && (
                                                    <ProgressBar
                                                        value={v.quantity}
                                                        max={v.low_stock_threshold ?? 0}
                                                        tone="warning"
                                                        className="mt-1.5 ml-auto w-28"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{v.low_stock_threshold ?? '—'}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={v.stock_status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={ProductRoutes.show(v.product.id).url}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" /> View Product
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {variants.last_page > 1 && <Pagination links={variants.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LowStock.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Inventory', href: '#' },
        { title: 'Low Stock', href: InventoryRoutes.lowStock().url },
    ],
};
