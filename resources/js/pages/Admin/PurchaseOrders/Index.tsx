import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';
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
                <Heading
                    eyebrow="Purchasing"
                    title="Purchase Orders"
                    description="Manage purchasing"
                    actions={
                        <Link href={PurchaseOrderRoutes.create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New PO
                            </Button>
                        </Link>
                    }
                />
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
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
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                </form>
                <Card>
                    <CardHeader>
                        <CardTitle>All Purchase Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchase_orders.data.length === 0 ? (
                                    <TableEmpty colSpan={5}>No purchase orders.</TableEmpty>
                                ) : (
                                    purchase_orders.data.map((po) => (
                                        <TableRow key={po.id}>
                                            <TableCell className="font-mono">
                                                <Link href={PurchaseOrderRoutes.show(po.id).url} className="hover:underline">
                                                    {po.po_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{po.supplier?.name || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'cancelled' : 'warning'}>{po.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums">{po.total}</TableCell>
                                            <TableCell>{po.ordered_at ? new Date(po.ordered_at).toLocaleDateString() : '—'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {purchase_orders.last_page > 1 && <Pagination links={purchase_orders.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
    ],
};
