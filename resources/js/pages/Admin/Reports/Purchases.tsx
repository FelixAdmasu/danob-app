import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportExportButton } from '@/components/report-export-button';
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
                <div className="border-b border-border pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Reports — Purchases</p>
                    <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Purchases</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">Purchase order activity by supplier, status and order date.</p>
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
                                            <tr key={po.id} className="border-b transition-colors hover:bg-muted/40">
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
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {purchase_orders.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`inline-flex min-w-8 justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i} className="inline-flex min-w-8 justify-center px-3 py-1.5 text-xs opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Purchases', href: '#' },
    ],
};
