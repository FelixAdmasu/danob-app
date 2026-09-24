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
import { ClipboardList, ShoppingCart, UserCheck, Users } from 'lucide-react';
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
                <Heading
                    eyebrow="Reports — Suppliers"
                    title="Suppliers"
                    description="Supplier activity: purchase counts, open orders and purchase value."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Suppliers" value={summary.suppliers} icon={Users} />
                    <StatCard label="Active Suppliers" value={summary.active_suppliers} icon={UserCheck} tone="success" />
                    <StatCard label="Suppliers With Purchases" value={summary.suppliers_with_purchases} icon={ShoppingCart} />
                    <StatCard label="Purchase Orders" value={summary.purchase_orders} icon={ClipboardList} />
                </div>

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
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
                    <div className="space-y-2 flex-1">
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

                <Card>
                    <CardHeader>
                        <CardTitle>All Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Purchase Orders</TableHead>
                                    <TableHead className="text-right">Open Orders</TableHead>
                                    <TableHead className="text-right">Purchase Value</TableHead>
                                    <TableHead>Last Order</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>No suppliers found.</TableEmpty>
                                ) : (
                                    suppliers.data.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="text-sm">
                                                <div className="font-medium">{supplier.name}</div>
                                                {supplier.contact_person && (
                                                    <div className="text-xs text-muted-foreground">{supplier.contact_person}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                                                    {supplier.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-mono">{supplier.purchase_orders_count}</TableCell>
                                            <TableCell className="text-right text-sm font-mono">{supplier.open_purchase_orders_count}</TableCell>
                                            <TableCell className="text-right text-sm font-mono">{supplier.purchase_value}</TableCell>
                                            <TableCell className="text-xs">
                                                {supplier.last_ordered_at ? new Date(supplier.last_ordered_at).toLocaleDateString() : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {suppliers.last_page > 1 && <Pagination links={suppliers.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
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
