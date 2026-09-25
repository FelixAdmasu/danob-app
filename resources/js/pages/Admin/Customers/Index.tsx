import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    total: number;
};

type Filters = {
    search: string | null;
    type: string | null;
    status: string | null;
};

type Props = {
    customers: PaginatedCustomers;
    filters: Filters;
};

// Mirrors the store rule vocabulary (CustomerController) — the only values
// the server will accept.
const CUSTOMER_TYPES: Record<string, string> = {
    business: 'Business',
    home_business: 'Home Business',
    individual: 'Individual',
    other: 'Other',
};

export default function Index({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const hasActiveFilters = Boolean(
        filters.search || filters.type || filters.status,
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            CustomerRoutes.index().url,
            {
                search: search || undefined,
                type: type !== 'all' ? type : undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
    };
    return (
        <>
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Sales"
                    title="Customers"
                    description="Manage customer accounts and contact details."
                />

                <form
                    onSubmit={handleSearch}
                    className="border-border/70 bg-card dark:border-border/60 flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-xs transition-colors dark:shadow-none"
                >
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search name, email, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger
                            className="w-[160px]"
                            aria-label="Filter by type"
                        >
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(CUSTOMER_TYPES).map(
                                ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger
                            className="w-[140px]"
                            aria-label="Filter by status"
                        >
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                    {hasActiveFilters && (
                        <Link href={CustomerRoutes.index().url}>
                            <Button type="button" variant="ghost">
                                Clear
                            </Button>
                        </Link>
                    )}
                </form>

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
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">
                                        Orders
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>
                                        No customers.
                                    </TableEmpty>
                                ) : (
                                    customers.data.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                {c.company_name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {c.contact_name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {c.phone || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {c.email || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={c.type} />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {c.orders_count}
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

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Customers', href: CustomerRoutes.index().url },
    ],
};
