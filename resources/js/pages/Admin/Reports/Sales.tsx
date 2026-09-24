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
import * as OrderRoutes from '@/routes/admin/orders';
import ReportRoutes from '@/routes/admin/reports';
import { PackageCheck, Receipt, ShoppingBag, Truck, Undo2 } from 'lucide-react';

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
                <Heading
                    eyebrow="Reports — Sales"
                    title="Sales"
                    description="Orders by status, date and customer with returned quantities."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <StatCard label="Orders" value={summary.orders} icon={ShoppingBag} />
                    <StatCard label="Delivered Orders" value={summary.delivered_orders} icon={PackageCheck} tone="success" />
                    <StatCard label="Delivered Sales Value" value={summary.delivered_sales_value} icon={Truck} />
                    <StatCard label="Returned Units" value={summary.returned_units} icon={Undo2} tone="warning" />
                    <StatCard label="Return Value" value={summary.return_value} icon={Receipt} tone="warning" />
                </div>

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
                    <div className="space-y-2 flex-1">
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
                    <div className="flex gap-2">
                        <Button type="submit">Filter</Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>
                        <ReportExportButton url={ReportRoutes.sales.export().url} filters={filters} />
                    </div>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>Sales</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Ordered At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Returned Qty</TableHead>
                                    <TableHead className="text-right">Return Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No sales found for the selected period.</TableEmpty>
                                ) : (
                                    orders.data.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <Link href={OrderRoutes.show(order.id).url} className="hover:underline">
                                                    {order.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{customerName(order)}</TableCell>
                                            <TableCell>{new Date(order.ordered_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{order.total}</TableCell>
                                            <TableCell className="text-right font-mono">{order.returned_quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{order.return_value}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {orders.last_page > 1 && <Pagination links={orders.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
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
