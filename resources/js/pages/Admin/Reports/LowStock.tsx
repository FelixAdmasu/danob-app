import { Head, Link, router } from '@inertiajs/react';
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
};

type Props = {
    variants: PaginatedVariants;
    counts: { low: number; out: number; monitored: number };
    filters: { status: string; search: string | null };
};

// Same stock-status vocabulary as ProductVariant::STOCK_STATUS_* (value is
// computed server-side; this only maps it to a label, mirroring the
// Phase 20 Low Stock page).
const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    in_stock: { label: 'In Stock', variant: 'secondary' },
    low_stock: { label: 'Low Stock', variant: 'destructive' },
    out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
};

function StatusBadge({ status }: { status: string }) {
    const badge = STATUS_BADGES[status] ?? STATUS_BADGES.in_stock;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
}

export default function LowStockReport({ variants, counts, filters }: Props) {
    const [status, setStatus] = useState<string>(filters.status || 'attention');
    const [search, setSearch] = useState<string>(filters.search || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.lowStock().url,
            { status, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.lowStock().url, {}, { preserveState: true, replace: true });
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
                    <StatCard label="Low Stock" value={counts.low} icon={AlertTriangle} tone="warning" />
                    <StatCard label="Out of Stock" value={counts.out} icon={Package} tone="danger" />
                    <StatCard label="Monitored Variants" value={counts.monitored} icon={Layers} />
                </div>

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Needs attention" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="attention">Needs Attention</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">Out of Stock</SelectItem>
                                <SelectItem value="monitored">All Monitored Variants</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="search">Search</Label>
                        <Input
                            id="search"
                            placeholder="Search by product, variant or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Filter</Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                        <ReportExportButton url={ReportRoutes.lowStock.export().url} filters={filters} />
                    </div>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>All Variants</CardTitle>
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
                                    <TableHead>Monitoring</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.data.length === 0 ? (
                                    <TableEmpty colSpan={8}>No low-stock variants.</TableEmpty>
                                ) : (
                                    variants.data.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="text-sm font-medium">{v.product.name}</TableCell>
                                            <TableCell className="text-sm">{v.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{v.sku || '—'}</TableCell>
                                            <TableCell className="text-right text-sm font-mono">{v.quantity}</TableCell>
                                            <TableCell className="text-right text-sm font-mono">{v.low_stock_threshold ?? '—'}</TableCell>
                                            <TableCell className="text-xs">
                                                {v.low_stock_threshold === null ? 'Unmonitored' : 'Monitored'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={v.stock_status} />
                                            </TableCell>
                                            <TableCell>
                                                <Link href={ProductRoutes.show(v.product.id).url}>
                                                    <Button variant="ghost" size="sm">View Product</Button>
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

LowStockReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Low Stock', href: '#' },
    ],
};
