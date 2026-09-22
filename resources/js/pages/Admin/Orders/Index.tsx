import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { AdminQuickNav } from '@/components/admin-quick-nav';
import { dashboard } from '@/routes';
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
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Sales — Orders</p>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Orders</h1>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2">Track and manage customer orders.</p>
                    </div>
                </div>

                <AdminQuickNav />

                <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
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
                                        <th className="px-4 py-3">Total</th>
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
                                            <tr key={order.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    <Link href={OrderRoutes.show(order.id).url} className="hover:underline">
                                                        {order.reference_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{order.customer?.company_name || order.customer?.contact_name || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{order.total}</td>
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
                    <div className="flex gap-2 justify-center">
                        {orders.links.map((link, i) =>
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

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Orders', href: OrderRoutes.index().url },
    ],
};
