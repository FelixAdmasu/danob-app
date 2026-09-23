import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportExportButton } from '@/components/report-export-button';
import * as OrderRoutes from '@/routes/admin/orders';
import ReportRoutes from '@/routes/admin/reports';

type OrderRow = {
    id: number;
    reference_number: string;
    status: string;
    total: string;
    ordered_at: string;
    returned_quantity: number;
    return_value: string;
    customer: { id: number; company_name?: string | null; contact_name?: string | null } | null;
};

type PaginatedOrders = {
    data: OrderRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    orders: PaginatedOrders;
    summary: {
        orders: number;
        delivered_orders: number;
        delivered_sales_value: string;
        returned_units: number;
        return_value: string;
    };
    filters: {
        status: string | null;
        customer_id: number | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    customers: { id: number; company_name?: string | null; contact_name?: string | null }[];
    order_statuses: string[];
};

function customerName(order: OrderRow): string {
    if (!order.customer) {
        return '—';
    }
    return order.customer.company_name || order.customer.contact_name || '—';
}

export default function Sales({ orders, summary, filters, customers, order_statuses }: Props) {
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [customerId, setCustomerId] = useState<string>(filters.customer_id ? String(filters.customer_id) : 'all');
    const [search, setSearch] = useState<string>(filters.search || '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.sales().url,
            {
                status: status !== 'all' ? status : undefined,
                customer_id: customerId !== 'all' ? customerId : undefined,
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.sales().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Sales Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-border pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Reports — Sales</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">Sales</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">Orders by status, date and customer with returned quantities.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.orders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.delivered_orders}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Delivered Sales Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.delivered_sales_value}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Returned Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.returned_units}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Return Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.return_value}</p>
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
                                    placeholder="Search by order reference or customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {order_statuses.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All customers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All customers</SelectItem>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name || c.contact_name || `#${c.id}`}
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
                                <ReportExportButton url={ReportRoutes.sales.export().url} filters={filters} />
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
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Ordered At</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Returned Qty</th>
                                        <th className="px-4 py-3">Return Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No sales found for the selected period.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr key={order.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    <Link href={OrderRoutes.show(order.id).url} className="hover:underline">
                                                        {order.reference_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{customerName(order)}</td>
                                                <td className="px-4 py-3 text-xs">{new Date(order.ordered_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="secondary">{order.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{order.total}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{order.returned_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{order.return_value}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {orders.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {orders.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white dark:bg-primary dark:text-primary-foreground' : 'bg-white dark:bg-secondary dark:text-secondary-foreground'}`}
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

Sales.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Sales', href: '#' },
    ],
};
