import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportExportButton } from '@/components/report-export-button';
import { dashboard } from '@/routes';
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
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Reports — Low Stock</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Low Stock</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Variants that are out of stock or at/below their low-stock threshold.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{counts.low}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{counts.out}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Monitored Variants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{counts.monitored}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-3">
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
                            <div className="space-y-2 md:col-span-2">
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
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">Variant</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Quantity</th>
                                        <th className="px-4 py-3">Threshold</th>
                                        <th className="px-4 py-3">Monitoring</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No low-stock variants.
                                            </td>
                                        </tr>
                                    ) : (
                                        variants.data.map((v) => (
                                            <tr key={v.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm font-medium">{v.product.name}</td>
                                                <td className="px-4 py-3 text-sm">{v.name}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{v.sku || '—'}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{v.quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{v.low_stock_threshold ?? '—'}</td>
                                                <td className="px-4 py-3 text-xs">
                                                    {v.low_stock_threshold === null ? 'Unmonitored' : 'Monitored'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={v.stock_status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link href={ProductRoutes.show(v.product.id).url}>
                                                        <Button variant="ghost" size="sm">View Product</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {variants.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {variants.links.map((link, i) =>
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

LowStockReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Low Stock', href: '#' },
    ],
};
