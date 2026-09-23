import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportExportButton } from '@/components/report-export-button';
import ReportRoutes from '@/routes/admin/reports';

type SupplierRow = {
    id: number;
    name: string;
    contact_person: string | null;
    is_active: boolean;
    purchase_orders_count: number;
    open_purchase_orders_count: number;
    purchase_value: string;
    last_ordered_at: string | null;
};

type PaginatedSuppliers = {
    data: SupplierRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    suppliers: PaginatedSuppliers;
    summary: {
        suppliers: number;
        active_suppliers: number;
        suppliers_with_purchases: number;
        purchase_orders: number;
    };
    filters: { status: string | null; search: string | null };
};

export default function SuppliersReport({ suppliers, summary, filters }: Props) {
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [search, setSearch] = useState<string>(filters.search || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.suppliers().url,
            { status: status !== 'all' ? status : undefined, search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.suppliers().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Suppliers Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Reports — Suppliers</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Suppliers</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Supplier activity: purchase counts, open orders and purchase value.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.suppliers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.active_suppliers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Suppliers With Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.suppliers_with_purchases}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.purchase_orders}</p>
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
                                        <SelectValue placeholder="All suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All suppliers</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by name, contact, phone or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Filter</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <ReportExportButton url={ReportRoutes.suppliers.export().url} filters={filters} />
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
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Purchase Orders</th>
                                        <th className="px-4 py-3">Open Orders</th>
                                        <th className="px-4 py-3">Purchase Value</th>
                                        <th className="px-4 py-3">Last Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No suppliers found.
                                            </td>
                                        </tr>
                                    ) : (
                                        suppliers.data.map((supplier) => (
                                            <tr key={supplier.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="font-medium">{supplier.name}</div>
                                                    {supplier.contact_person && (
                                                        <div className="text-xs text-muted-foreground">{supplier.contact_person}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{supplier.purchase_orders_count}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{supplier.open_purchase_orders_count}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{supplier.purchase_value}</td>
                                                <td className="px-4 py-3 text-xs">
                                                    {supplier.last_ordered_at ? new Date(supplier.last_ordered_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {suppliers.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {suppliers.links.map((link, i) =>
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

SuppliersReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Suppliers', href: '#' },
    ],
};
