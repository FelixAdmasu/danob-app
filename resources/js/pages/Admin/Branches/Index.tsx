import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import * as BranchRoutes from '@/routes/admin/branches';

type Branch = {
    id: number;
    name: string;
    city: string;
    address: string;
    phone: string | null;
    is_active: boolean;
};

type PaginatedBranches = {
    data: Branch[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    branches: PaginatedBranches;
    filters: { search: string | null };
};

export default function Index({ branches, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(BranchRoutes.index().url, { search: search || undefined }, { preserveState: true, replace: true });
    };
    return (
        <>
            <Head title="Branches" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Operations — Branches</p>
                        <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Branches</h1>
                        <p className="text-sm text-muted-foreground mt-2">Manage branch locations and contact information.</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search name, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Button type="submit" variant="outline">Search</Button>
                    {filters.search && (
                        <Link href={BranchRoutes.index().url}><Button type="button" variant="ghost">Clear</Button></Link>
                    )}
                </form>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">City</th>
                                        <th className="px-4 py-3">Address</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branches.data.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No branches.</td></tr>
                                    ) : (
                                        branches.data.map((b) => (
                                            <tr key={b.id} className="border-b transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3 text-sm font-medium">{b.name}</td>
                                                <td className="px-4 py-3 text-sm">{b.city}</td>
                                                <td className="px-4 py-3 text-sm">{b.address}</td>
                                                <td className="px-4 py-3 text-sm">{b.phone || '—'}</td>
                                                <td className="px-4 py-3"><Badge variant={b.is_active ? 'success' : 'secondary'}>{b.is_active ? 'Yes' : 'No'}</Badge></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                {branches.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {branches.links.map((link, i) =>
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
        { title: 'Branches', href: BranchRoutes.index().url },
    ],
};
