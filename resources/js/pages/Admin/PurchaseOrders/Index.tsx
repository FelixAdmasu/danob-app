import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { dashboard } from '@/routes';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

type PO = { id: number; po_number: string; status: string; supplier: { name: string } | null; total: string; ordered_at: string };

type Paginated = { data: PO[]; links: { url: string | null; label: string; active: boolean }[]; current_page: number; last_page: number };

export default function Index({ purchase_orders, filters }: { purchase_orders: Paginated; filters: { search: string | null; status: string | null } }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(PurchaseOrderRoutes.index().url, { search: search || undefined, status: status !== 'all' ? status : undefined }, { preserveState: true, replace: true });
    };
    return (
        <>
            <Head title="Purchase Orders" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title="Purchase Orders" description="Manage purchasing" />
                    <Link href={PurchaseOrderRoutes.create().url}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New PO
                        </Button>
                    </Link>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO number or supplier..." className="pl-9" />
                            </div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="partially_received">Partially Received</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">PO Number</th>
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchase_orders.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No purchase orders.
                                            </td>
                                        </tr>
                                    ) : (
                                        purchase_orders.data.map((po) => (
                                            <tr key={po.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                        {po.po_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{po.supplier?.name || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={po.status === 'received' ? 'default' : 'secondary'}>{po.status}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{po.total}</td>
                                                <td className="px-4 py-3 text-xs">{po.ordered_at ? new Date(po.ordered_at).toLocaleDateString() : '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                {purchase_orders.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {purchase_orders.links.map((link, i) =>
                            link.url ? (
                                <Link key={i} href={link.url} className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white' : 'bg-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
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
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
    ],
};
