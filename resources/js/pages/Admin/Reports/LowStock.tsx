import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ReportExportButton } from '@/components/report-export-button';
import { AlertTriangle, Layers, Package } from 'lucide-react';
import * as ProductRoutes from '@/routes/admin/products';
import ReportRoutes from '@/routes/admin/reports';

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

export default function LowStockReport({ variants, counts, filters }: Props) {
    const [status, setStatus] = useState<string>(filters.status || 'attention');
    const [search, setSearch] = useState<string>(filters.search || '');

    const activeCount = [
        status !== 'attention' ? status : '',
        search.trim(),
    ].filter((v) => v !== '').length;

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.lowStock().url,
            { status, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setStatus('attention');
        setSearch('');
        router.get(
            ReportRoutes.lowStock().url,
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Low Stock Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Reports — Low Stock"
                    title="Low Stock"
                    description="Variants that are out of stock or at/below their low-stock threshold."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Low Stock"
                        value={counts.low}
                        icon={AlertTriangle}
                        tone="warning"
                    />
                    <StatCard
                        label="Out of Stock"
                        value={counts.out}
                        icon={Package}
                        tone="danger"
                    />
                    <StatCard
                        label="Monitored Variants"
                        value={counts.monitored}
                        icon={Layers}
                    />
                </div>

                <FilterPanel
                    onSubmit={handleFilter}
                    onClear={clearFilters}
                    activeCount={activeCount}
                    actions={
                        <ReportExportButton
                            url={ReportRoutes.lowStock.export().url}
                            filters={filters}
                        />
                    }
                >
                    <FilterField label="Status">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Needs attention" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="attention">
                                    Needs Attention
                                </SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">
                                    Out of Stock
                                </SelectItem>
                                <SelectItem value="monitored">
                                    All Monitored Variants
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField
                        label="Search"
                        htmlFor="search"
                        className="sm:col-span-2"
                    >
                        <Input
                            id="search"
                            placeholder="Search by product, variant or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>All Variants</CardTitle>
                            <span className="text-muted-foreground text-xs font-medium tabular-nums">
                                {variants.total.toLocaleString()} record
                                {variants.total === 1 ? '' : 's'}
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
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Threshold
                                    </TableHead>
                                    <TableHead>Monitoring</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.data.length === 0 ? (
                                    <TableEmpty colSpan={8}>
                                        No low-stock variants.
                                    </TableEmpty>
                                ) : (
                                    variants.data.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell>
                                                {v.product.name}
                                            </TableCell>
                                            <TableCell>{v.name}</TableCell>
                                            <TableCell className="font-mono">
                                                {v.sku || '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {v.quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {v.low_stock_threshold ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {v.low_stock_threshold === null
                                                    ? 'Unmonitored'
                                                    : 'Monitored'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={v.stock_status}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={
                                                        ProductRoutes.show(
                                                            v.product.id,
                                                        ).url
                                                    }
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        View Product
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {variants.last_page > 1 && (
                            <Pagination
                                links={variants.links}
                                className="px-6 pt-4 pb-2"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LowStockReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Low Stock', href: '#' },
    ],
};
