import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import * as OrderRoutes from '@/routes/admin/orders';

type Order = {
    id: number;
    reference_number: string;
    status: string;
    total: string;
    ordered_at: string;
    customer: { id: number; company_name?: string | null; contact_name?: string | null } | null;
};

type PaginatedOrders = {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
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
            { search: search || undefined, status: status !== 'all' ? status : undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Orders" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Sales — Orders</p>
                        <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Orders</h1>
                        <p className="text-sm text-muted-foreground mt-2">Track and manage customer orders.</p>
                    </div>
                    <Link href={OrderRoutes.create().url}>
                        <Button type="button">
                            <Plus className="mr-2 h-4 w-4" /> New Order
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search reference or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.data.map((order) => (
                                            <tr key={order.id} className="border-b transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    <Link href={OrderRoutes.show(order.id).url} className="hover:underline">
                                                        {order.reference_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{order.customer?.company_name || order.customer?.contact_name || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'cancelled' : 'warning'}>{order.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">{order.total}</td>
                                                <td className="px-4 py-3 text-sm">{order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {orders.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {orders.links.map((link, i) =>
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

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Orders', href: OrderRoutes.index().url },
    ],
};
