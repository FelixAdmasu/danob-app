import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as BranchRoutes from '@/routes/admin/branches';
import { onImageError } from '@/lib/image-fallback';
import { Image as ImageIcon, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react';

type Branch = {
    id: number;
    name: string;
    city: string;
    address: string;
    sub_city: string | null;
    kebele: string | null;
    phone: string | null;
    opening_hours: string | null;
    services: string | null;
    image_url: string | null;
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
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const pickTargetRef = useRef<Branch | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const openImagePicker = (branch: Branch) => {
        pickTargetRef.current = branch;
        fileInputRef.current?.click();
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        e.target.value = '';
        const branch = pickTargetRef.current;
        if (!file || !branch) return;
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be 5 MB or smaller.');
            return;
        }
        setUploadError(null);
        setUploadingId(branch.id);
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', branch.name);
        formData.append('address', branch.address);
        formData.append('city', branch.city);
        if (branch.sub_city) formData.append('sub_city', branch.sub_city);
        if (branch.kebele) formData.append('kebele', branch.kebele);
        if (branch.phone) formData.append('phone', branch.phone);
        if (branch.opening_hours) formData.append('opening_hours', branch.opening_hours);
        if (branch.services) formData.append('services', branch.services);
        formData.append('is_active', branch.is_active ? '1' : '0');
        formData.append('image', file);
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors: Record<string, string>) =>
                setUploadError(errors.image ?? 'Image upload failed. Please try again.'),
            onFinish: () => setUploadingId(null),
        } as never;
        router.post(BranchRoutes.update(branch.id).url, formData, options);
    };

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

                {uploadError && (
                    <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{uploadError}</div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                />
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
                                    <TableHead>Image</TableHead>
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
                                    <TableEmpty colSpan={7}>No branches found.</TableEmpty>
                                ) : (
                                    branches.data.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => openImagePicker(b)}
                                                    title={b.image_url ? 'Change image' : 'Upload image'}
                                                    className="group relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/60 transition-colors hover:border-primary/60"
                                                >
                                                    {b.image_url ? (
                                                        <img
                                                            src={b.image_url}
                                                            alt={b.name}
                                                            className="size-full object-cover"
                                                            onError={onImageError}
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-4 w-4 opacity-30" aria-hidden="true" />
                                                    )}
                                                    <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                                                        <Upload className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                                                    </span>
                                                    {uploadingId === b.id && (
                                                        <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                            <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </button>
                                            </TableCell>
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
