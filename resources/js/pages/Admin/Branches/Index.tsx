import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as BranchRoutes from '@/routes/admin/branches';
import { Pencil, Search, Trash2 } from 'lucide-react';

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
    total: number;
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

    const handleDelete = (branch: Branch) => {
        if (confirm(`Delete branch "${branch.name}"?`)) {
            router.delete(BranchRoutes.destroy(branch.id).url);
        }
    };

    return (
        <>
            <Head title="Branches" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Operations"
                    title="Branches"
                    description="Manage branch locations and contact information."
                />
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors dark:border-border/60 dark:shadow-none">
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
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>All Branches</CardTitle>
                            <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                {branches.total.toLocaleString()} record{branches.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.data.length === 0 ? (
                                    <TableEmpty colSpan={6}>No branches found.</TableEmpty>
                                ) : (
                                    branches.data.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell className="text-sm font-medium">{b.name}</TableCell>
                                            <TableCell className="text-sm">{b.city}</TableCell>
                                            <TableCell className="text-sm">{b.address}</TableCell>
                                            <TableCell className="text-sm">{b.phone || '—'}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={b.is_active ? 'active' : 'inactive'} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={BranchRoutes.edit(b.id).url}>
                                                        <Button variant="ghost" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {branches.last_page > 1 && <Pagination links={branches.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>
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
