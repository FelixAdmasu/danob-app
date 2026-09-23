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
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Operations — Branches</p>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Branches</h1>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2">Manage branch locations and contact information.</p>
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
                                            <tr key={b.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 text-sm font-medium">{b.name}</td>
                                                <td className="px-4 py-3 text-sm">{b.city}</td>
                                                <td className="px-4 py-3 text-sm">{b.address}</td>
                                                <td className="px-4 py-3 text-sm">{b.phone || '—'}</td>
                                                <td className="px-4 py-3"><Badge variant={b.is_active ? 'default' : 'secondary'}>{b.is_active ? 'Yes' : 'No'}</Badge></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                {branches.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {branches.links.map((link, i) =>
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Branches', href: BranchRoutes.index().url },
    ],
};
