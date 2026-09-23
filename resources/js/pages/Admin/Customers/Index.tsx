import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Sales — Customers</p>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">Customers</h1>
                        <p className="text-sm text-muted-foreground mt-2">Manage customer accounts and contact details.</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
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
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Company</th>
                                        <th className="px-4 py-3">Contact</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Orders</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No customers.</td></tr>
                                    ) : (
                                        customers.data.map((c) => (
                                            <tr key={c.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm font-medium">{c.company_name || '—'}</td>
                                                <td className="px-4 py-3 text-sm">{c.contact_name || '—'}</td>
                                                <td className="px-4 py-3 text-sm">{c.phone || '—'}</td>
                                                <td className="px-4 py-3 text-sm">{c.email || '—'}</td>
                                                <td className="px-4 py-3"><Badge variant="secondary">{c.type}</Badge></td>
                                                <td className="px-4 py-3 text-sm">{c.orders_count}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                {customers.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {customers.links.map((link, i) =>
                            link.url ? (
                                <Link key={i} href={link.url} className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white dark:bg-primary dark:text-primary-foreground' : 'bg-white dark:bg-secondary dark:text-secondary-foreground'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Customers', href: CustomerRoutes.index().url },
    ],
};
