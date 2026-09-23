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
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';
import ReportRoutes from '@/routes/admin/reports';

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
        router.get(ReportRoutes.purchases().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Purchases Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Reports — Purchases</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Purchases</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Purchase order activity by supplier, status and order date.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.purchase_orders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Open Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.open_orders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Ordered Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.ordered_units}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Received Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.received_units}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Outstanding Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.outstanding_units}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.purchase_value}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div className="space-y-2 md:col-span-3 lg:col-span-6">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by PO number or supplier..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
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
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_from">From</Label>
                                <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">To</Label>
                                <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                            <div className="flex gap-2 md:col-span-3 lg:col-span-6">
                                <Button type="submit">Filter</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <ReportExportButton url={ReportRoutes.purchases.export().url} filters={filters} />
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
                                        <th className="px-4 py-3">PO Number</th>
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3">Ordered At</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Ordered</th>
                                        <th className="px-4 py-3">Received</th>
                                        <th className="px-4 py-3">Outstanding</th>
                                        <th className="px-4 py-3">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchase_orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No purchase orders match these filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        purchase_orders.data.map((po) => (
                                            <tr key={po.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                        {po.po_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{po.supplier?.name || '—'}</td>
                                                <td className="px-4 py-3 text-xs">
                                                    {po.ordered_at ? new Date(po.ordered_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="secondary">{po.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{po.ordered_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{po.received_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{po.remaining_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{po.total}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {purchase_orders.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {purchase_orders.links.map((link, i) =>
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

Purchases.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Purchases', href: '#' },
    ],
};
