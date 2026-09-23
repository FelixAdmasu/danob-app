import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Pencil, Eye, Power } from 'lucide-react';
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
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Purchasing — Suppliers</p>
                        <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Suppliers</h1>
                        <p className="text-sm text-muted-foreground mt-2">Manage supplier contacts and purchasing relationships.</p>
                    </div>
                    <Link href={SupplierRoutes.create().url}>
                        <Button className="bg-[#A16AE8] text-white hover:bg-[#8539D3]">
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
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
                                Search
                            </Button>
                            {filters.search && (
                                <Link href={SupplierRoutes.index().url}>
                                    <Button type="button" variant="ghost">
                                        Clear
                                    </Button>
                                </Link>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No suppliers found.
                                            </td>
                                        </tr>
                                    ) : (
                                        suppliers.data.map((s) => (
                                            <tr key={s.id} className="border-b transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                                <td className="px-4 py-3 text-sm">{s.contact_person || '—'}</td>
                                                <td className="px-4 py-3 text-sm">{s.phone || '—'}</td>
                                                <td className="px-4 py-3 text-sm">{s.email || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                                                </td>
                                                <td className="px-4 py-3">
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
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {suppliers.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {suppliers.links.map((link, i) =>
                            link.url ? (
                                <Link key={i} href={link.url} className={`inline-flex min-w-8 justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
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
        { title: 'Suppliers', href: SupplierRoutes.index().url },
    ],
};
