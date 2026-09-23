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
                <div className="border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Reports — Customers</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Customers</h1>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2 max-w-xl">Customer order activity and delivered sales value.</p>
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
                                            <tr key={customer.id} className="border-b hover:bg-muted/20">
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
                    <div className="flex gap-2 justify-center">
                        {customers.links.map((link, i) =>
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

CustomersReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Customers', href: '#' },
    ],
};
