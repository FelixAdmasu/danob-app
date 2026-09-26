import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FilterPanel, FilterField } from '@/components/filter-panel';
import { Panel, PanelLink } from '@/components/panel';
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
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Order
                            </Button>
                        </Link>
                    }
                />

                <FilterPanel
                    onSubmit={handleSearch}
                    onClear={() =>
                        router.get(
                            OrderRoutes.index().url,
                            {},
                            { preserveState: true, replace: true },
                        )
                    }
                    activeCount={filters.search || filters.status ? 1 : 0}
                >
                    <FilterField label="Search" htmlFor="order-search">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="order-search"
                                placeholder="Search by reference..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </FilterField>
                    <FilterField label="Status" htmlFor="order-status">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="order-status">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="delivered">
                                    Delivered
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Cancelled
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                </FilterPanel>

                <Panel
                    title="Recent Orders"
                    subtitle={`${orders.total.toLocaleString()} record${orders.total === 1 ? '' : 's'}`}
                    action={
                        <PanelLink href={OrderRoutes.create().url}>
                            + New Order
                        </PanelLink>
                    }
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">
                                    Total
                                </TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.data.length === 0 ? (
                                <TableEmpty colSpan={5}>
                                    No orders yet.
                                </TableEmpty>
                            ) : (
                                orders.data.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell className="font-mono text-sm">
                                            <Link
                                                href={
                                                    OrderRoutes.show(o.id).url
                                                }
                                                className="hover:underline"
                                            >
                                                {o.reference_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {o.customer?.company_name ||
                                                o.customer?.contact_name ||
                                                '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(o.ordered_at)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {o.total}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={o.status} />
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
                </Panel>
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
