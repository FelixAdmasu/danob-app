import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { CheckCircle2, DollarSign, ShoppingBag, Users } from 'lucide-react';
import * as CustomerRoutes from '@/routes/admin/customers';
import ReportRoutes from '@/routes/admin/reports';

type CustomerRow = {
    id: number;
    name: string;
    email: string | null;
    orders_count: number;
    delivered_orders_count: number;
    delivered_sales_value: string;
    returned_units: number;
    return_value: string;
};

type PaginatedCustomers = {
    data: CustomerRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    customers: PaginatedCustomers;
    summary: {
        customers: number;
        customers_with_orders: number;
        delivered_orders: number;
        delivered_sales_value: string;
    };
    filters: { search: string | null };
};

export default function CustomersReport({
    customers,
    summary,
    filters,
}: Props) {
    const [search, setSearch] = useState<string>(filters.search || '');

    const activeCount = [search.trim()].filter((v) => v !== '').length;

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.customers().url,
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(
            ReportRoutes.customers().url,
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Customers Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Reports — Customers"
                    title="Customers"
                    description="Customer order activity and delivered sales value."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Customers"
                        value={summary.customers}
                        icon={Users}
                    />
                    <StatCard
                        label="Customers With Orders"
                        value={summary.customers_with_orders}
                        icon={ShoppingBag}
                    />
                    <StatCard
                        label="Delivered Orders"
                        value={summary.delivered_orders}
                        icon={CheckCircle2}
                        tone="success"
                    />
                    <StatCard
                        label="Delivered Sales Value"
                        value={summary.delivered_sales_value}
                        icon={DollarSign}
                    />
                </div>

                <FilterPanel
                    onSubmit={handleFilter}
                    onClear={clearFilters}
                    activeCount={activeCount}
                    actions={
                        <ReportExportButton
                            url={ReportRoutes.customers.export().url}
                            filters={filters}
                        />
                    }
                >
                    <FilterField
                        label="Search"
                        htmlFor="search"
                        className="sm:col-span-2"
                    >
                        <Input
                            id="search"
                            placeholder="Search by company, contact, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>All Customers</CardTitle>
                            <span className="text-muted-foreground text-xs font-medium tabular-nums">
                                {customers.total.toLocaleString()} record
                                {customers.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">
                                        Orders
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Delivered Orders
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Delivered Sales Value
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Returned Units
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Return Value
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>
                                        No customers found.
                                    </TableEmpty>
                                ) : (
                                    customers.data.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <Link
                                                    href={
                                                        CustomerRoutes.edit(
                                                            customer.id,
                                                        ).url
                                                    }
                                                    className="font-medium hover:underline"
                                                >
                                                    {customer.name}
                                                </Link>
                                                {customer.email && (
                                                    <div className="text-muted-foreground text-xs">
                                                        {customer.email}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {customer.orders_count}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {
                                                    customer.delivered_orders_count
                                                }
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {customer.delivered_sales_value}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {customer.returned_units}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {customer.return_value}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {customers.last_page > 1 && (
                            <Pagination
                                links={customers.links}
                                className="px-6 pt-4 pb-2"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CustomersReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Customers', href: '#' },
    ],
};
