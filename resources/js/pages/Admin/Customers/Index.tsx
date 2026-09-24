import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import * as CustomerRoutes from '@/routes/admin/customers';

type Customer = {
    id: number;
    type: string;
    company_name: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    orders_count: number;
};

type PaginatedCustomers = {
    data: Customer[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    customers: PaginatedCustomers;
    filters: { search: string | null };
};

export default function Index({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(CustomerRoutes.index().url, { search: search || undefined }, { preserveState: true, replace: true });
    };
    return (
        <>
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading eyebrow="Sales" title="Customers" description="Manage customer accounts and contact details." />

                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs dark:shadow-none"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Button type="submit" variant="outline">Search</Button>
                    {filters.search && (
                        <Link href={CustomerRoutes.index().url}><Button type="button" variant="ghost">Clear</Button></Link>
                    )}
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>All Customers</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>No customers.</TableEmpty>
                                ) : (
                                    customers.data.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="text-sm font-medium">{c.company_name || '—'}</TableCell>
                                            <TableCell className="text-sm">{c.contact_name || '—'}</TableCell>
                                            <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                                            <TableCell className="text-sm">{c.email || '—'}</TableCell>
                                            <TableCell><Badge variant="secondary">{c.type}</Badge></TableCell>
                                            <TableCell className="text-right text-sm tabular-nums">{c.orders_count}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {customers.last_page > 1 && <Pagination links={customers.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Customers', href: CustomerRoutes.index().url },
    ],
};
