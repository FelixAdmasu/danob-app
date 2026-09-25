import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import * as OrderRoutes from '@/routes/admin/orders';
import { formatDate } from '@/lib/format';

type Order = {
    id: number;
    reference_number: string;
    status: string;
    total: string;
    ordered_at: string;
    customer: {
        id: number;
        company_name?: string | null;
        contact_name?: string | null;
    } | null;
};

type PaginatedOrders = {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    orders: PaginatedOrders;
    filters: { search: string | null; status: string | null };
};

export default function Index({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            OrderRoutes.index().url,
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Sales"
                    title="Orders"
                    description="Track and manage customer orders."
                    actions={
                        <Link href={OrderRoutes.create().url}>
                            <Button type="button">
                                <Plus className="mr-2 h-4 w-4" /> New Order
                            </Button>
                        </Link>
                    }
                />

                <form
                    onSubmit={handleSearch}
                    className="border-border/70 bg-card dark:border-border/60 flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-xs transition-colors dark:shadow-none"
                >
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search reference or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>All Orders</CardTitle>
                            <span className="text-muted-foreground text-xs font-medium tabular-nums">
                                {orders.total.toLocaleString()} record
                                {orders.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 ? (
                                    <TableEmpty colSpan={5}>
                                        No orders found.
                                    </TableEmpty>
                                ) : (
                                    orders.data.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono">
                                                <Link
                                                    href={
                                                        OrderRoutes.show(
                                                            order.id,
                                                        ).url
                                                    }
                                                    className="hover:underline"
                                                >
                                                    {order.reference_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {order.customer?.company_name ||
                                                    order.customer
                                                        ?.contact_name ||
                                                    '—'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={order.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums">
                                                {order.total}
                                            </TableCell>
                                            <TableCell>
                                                {order.ordered_at
                                                    ? formatDate(
                                                          order.ordered_at,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {orders.last_page > 1 && (
                            <Pagination
                                links={orders.links}
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
        { title: 'Orders', href: OrderRoutes.index().url },
    ],
};
