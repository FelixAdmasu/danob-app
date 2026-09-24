import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportExportButton } from '@/components/report-export-button';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import ReportRoutes from '@/routes/admin/reports';
import { formatDate } from '@/lib/format';
import { Clock, FileText, Package, PackageCheck, Receipt, Truck } from 'lucide-react';

type PurchaseOrderRow = {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string | null;
    total: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    supplier: { id: number; name: string } | null;
};

type PaginatedPurchaseOrders = {
    data: PurchaseOrderRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    purchase_orders: PaginatedPurchaseOrders;
    summary: {
        purchase_orders: number;
        open_orders: number;
        ordered_units: number;
        received_units: number;
        outstanding_units: number;
        purchase_value: string;
    };
    filters: {
        supplier_id: number | null;
        status: string | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    suppliers: { id: number; name: string }[];
    purchase_statuses: string[];
};

export default function Purchases({ purchase_orders, summary, filters, suppliers, purchase_statuses }: Props) {
    const [supplierId, setSupplierId] = useState<string>(filters.supplier_id ? String(filters.supplier_id) : 'all');
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [search, setSearch] = useState<string>(filters.search || '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const activeCount = [
        supplierId !== 'all' ? supplierId : '',
        status !== 'all' ? status : '',
        search.trim(),
        dateFrom,
        dateTo,
    ].filter((v) => v !== '').length;

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.purchases().url,
            {
                supplier_id: supplierId !== 'all' ? supplierId : undefined,
                status: status !== 'all' ? status : undefined,
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSupplierId('all');
        setStatus('all');
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get(ReportRoutes.purchases().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Purchases Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Reports — Purchases"
                    title="Purchases"
                    description="Purchase order activity by supplier, status and order date."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Purchase Orders" value={summary.purchase_orders} icon={FileText} />
                    <StatCard label="Open Orders" value={summary.open_orders} icon={Clock} tone="warning" />
                    <StatCard label="Ordered Units" value={summary.ordered_units} icon={Package} />
                    <StatCard label="Received Units" value={summary.received_units} icon={PackageCheck} tone="success" />
                    <StatCard label="Outstanding Units" value={summary.outstanding_units} icon={Truck} tone="warning" />
                    <StatCard label="Purchase Value" value={summary.purchase_value} icon={Receipt} />
                </div>

                <FilterPanel
                    onSubmit={handleFilter}
                    onClear={clearFilters}
                    activeCount={activeCount}
                    actions={<ReportExportButton url={ReportRoutes.purchases.export().url} filters={filters} />}
                >
                    <FilterField label="Search" htmlFor="search" className="sm:col-span-2">
                        <Input
                            id="search"
                            placeholder="Search by PO number or supplier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="Supplier">
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All suppliers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All suppliers</SelectItem>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="Status">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {purchase_statuses.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="From" htmlFor="date_from">
                        <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </FilterField>
                    <FilterField label="To" htmlFor="date_to">
                        <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>Purchases</CardTitle>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {purchase_orders.total.toLocaleString()} record{purchase_orders.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Ordered At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ordered</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase_orders.data.length === 0 ? (
                                    <TableEmpty colSpan={8}>No purchase orders match these filters.</TableEmpty>
                                ) : (
                                    purchase_orders.data.map((po) => (
                                        <TableRow key={po.id}>
                                            <TableCell>
                                                <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                    {po.po_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{po.supplier?.name || '—'}</TableCell>
                                            <TableCell>
                                                {po.ordered_at ? formatDate(po.ordered_at) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={po.status} />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{po.ordered_quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{po.received_quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{po.remaining_quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{po.total}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {purchase_orders.last_page > 1 && <Pagination links={purchase_orders.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Purchases.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Purchases', href: '#' },
    ],
};
