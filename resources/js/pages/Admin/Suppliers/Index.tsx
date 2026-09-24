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
import { Search, Plus, Pencil, Eye, Power, X } from 'lucide-react';
import * as SupplierRoutes from '@/routes/admin/suppliers';

type Supplier = {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    created_at: string;
};

type PaginatedSuppliers = {
    data: Supplier[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    suppliers: PaginatedSuppliers;
    filters: { search: string | null; status: string | null };
};

export default function Index({ suppliers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            SupplierRoutes.index().url,
            { search: search || undefined, status: status !== 'all' ? status : undefined },
            { preserveState: true, replace: true },
        );
    };

    const handleToggle = (supplier: Supplier) => {
        const action = supplier.is_active ? SupplierRoutes.deactivate(supplier.id) : SupplierRoutes.activate(supplier.id);
        if (confirm(`${supplier.is_active ? 'Deactivate' : 'Activate'} supplier "${supplier.name}"?`)) {
            router.post(action.url);
        }
    };

    return (
        <>
            <Head title="Suppliers" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Purchasing"
                    title="Suppliers"
                    description="Manage supplier contacts and purchasing relationships."
                    actions={
                        <Link href={SupplierRoutes.create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Supplier
                            </Button>
                        </Link>
                    }
                />

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors dark:border-border/60 dark:shadow-none">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, contact, phone, email..." className="pl-9" />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline">
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                    {filters.search && (
                        <Link href={SupplierRoutes.index().url}>
                            <Button type="button" variant="ghost">
                                <X className="mr-2 h-4 w-4" /> Clear
                            </Button>
                        </Link>
                    )}
                </form>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>All Suppliers</CardTitle>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {suppliers.total.toLocaleString()} record{suppliers.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>No suppliers found.</TableEmpty>
                                ) : (
                                    suppliers.data.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell>{s.contact_person || '—'}</TableCell>
                                            <TableCell>{s.phone || '—'}</TableCell>
                                            <TableCell>{s.email || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Link href={SupplierRoutes.show(s.id).url}>
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={SupplierRoutes.edit(s.id).url}>
                                                        <Button variant="ghost" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => handleToggle(s)}>
                                                        <Power className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {suppliers.last_page > 1 && <Pagination links={suppliers.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Suppliers', href: SupplierRoutes.index().url },
    ],
};
