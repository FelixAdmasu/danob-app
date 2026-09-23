import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
                <Heading
                    eyebrow="Operations"
                    title="Branches"
                    description="Manage branch locations and contact information."
                />
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
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
                        <CardTitle>All Branches</CardTitle>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.data.length === 0 ? (
                                    <TableEmpty colSpan={5}>No branches.</TableEmpty>
                                ) : (
                                    branches.data.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell className="text-sm font-medium">{b.name}</TableCell>
                                            <TableCell className="text-sm">{b.city}</TableCell>
                                            <TableCell className="text-sm">{b.address}</TableCell>
                                            <TableCell className="text-sm">{b.phone || '—'}</TableCell>
                                            <TableCell><Badge variant={b.is_active ? 'success' : 'secondary'}>{b.is_active ? 'Yes' : 'No'}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {branches.last_page > 1 && <Pagination links={branches.links} className="px-4 pt-4 pb-2" />}
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
