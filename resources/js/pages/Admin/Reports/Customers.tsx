import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportExportButton } from '@/components/report-export-button';
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

export default function CustomersReport({ customers, summary, filters }: Props) {
    const [search, setSearch] = useState<string>(filters.search || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.customers().url,
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.customers().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Customers Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-border pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Reports — Customers</p>
                    <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Customers</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">Customer order activity and delivered sales value.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Customers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.customers}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Customers With Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.customers_with_orders}</p>
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
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by company, contact, email or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Filter</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <ReportExportButton url={ReportRoutes.customers.export().url} filters={filters} />
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
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Orders</th>
                                        <th className="px-4 py-3">Delivered Orders</th>
                                        <th className="px-4 py-3">Delivered Sales Value</th>
                                        <th className="px-4 py-3">Returned Units</th>
                                        <th className="px-4 py-3">Return Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No customers found.
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.data.map((customer) => (
                                            <tr key={customer.id} className="border-b transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3 text-sm">
                                                    <Link href={CustomerRoutes.edit(customer.id).url} className="font-medium hover:underline">
                                                        {customer.name}
                                                    </Link>
                                                    {customer.email && (
                                                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{customer.orders_count}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{customer.delivered_orders_count}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{customer.delivered_sales_value}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{customer.returned_units}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{customer.return_value}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {customers.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {customers.links.map((link, i) =>
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

CustomersReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Customers', href: '#' },
    ],
};
