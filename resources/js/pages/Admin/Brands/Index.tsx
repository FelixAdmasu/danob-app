import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminQuickNav } from '@/components/admin-quick-nav';
import { dashboard } from '@/routes';
import * as BrandRoutes from '@/routes/admin/brands';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    products_count: number;
    created_at: string;
};

type PaginatedBrands = {
    data: Brand[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    brands: PaginatedBrands;
    filters: { search: string | null };
};

export default function Index({ brands, filters }: Props) {
    const { props } = usePage<{ flash?: { error?: string } }>();
    const flashError = (props.flash as { error?: string } | undefined)?.error;
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Brand | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(BrandRoutes.index().url, search ? { search } : {}, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', slug: '', description: '', is_active: true });
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (brand: Brand) => {
        setEditing(brand);
        setForm({ name: brand.name, slug: brand.slug, description: brand.description || '', is_active: brand.is_active });
        setErrors({});
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const payload = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
            description: form.description || null,
            is_active: form.is_active,
        };
        const onError = (err: Record<string, string>) => {
            setErrors(err);
            setProcessing(false);
        };
        const onSuccess = () => {
            setDialogOpen(false);
            setProcessing(false);
        };
        if (editing) {
            router.put(BrandRoutes.update(editing.id).url, payload as never, {
                onError,
                onSuccess,
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(BrandRoutes.store().url, payload as never, {
                onError,
                onSuccess,
                onFinish: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (brand: Brand) => {
        if (!confirm(`Delete brand "${brand.name}"?`)) return;
        router.delete(BrandRoutes.destroy(brand.id).url);
    };

    return (
        <>
            <Head title="Brands" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#070E01]/10 dark:border-[#ECF3E5]/15 pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] dark:text-[#A5FFA9]/80 mb-3">Catalog — Brands</p>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#070E01] dark:text-[#ECF3E5]">Brands</h1>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#ECF3E5]/70 mt-2">Manage product brands and their catalog presence.</p>
                    </div>
                    <Button onClick={openCreate} className="bg-[#070E01] hover:bg-[#1A3A0A] text-[#ECF3E5] dark:bg-[#A5FFA9] dark:text-[#070E01] dark:hover:bg-[#8FEF95]">
                        <Plus className="mr-2 h-4 w-4" /> Add Brand
                    </Button>
                </div>

                {flashError && <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{flashError}</div>}

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or slug..."
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                            {filters.search && (
                                <Link href={BrandRoutes.index().url}>
                                    <Button type="button" variant="ghost">
                                        Clear
                                    </Button>
                                </Link>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <AdminQuickNav />

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Slug</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Products</th>
                                        <th className="px-4 py-3">Created</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brands.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No brands found.
                                            </td>
                                        </tr>
                                    ) : (
                                        brands.data.map((brand) => (
                                            <tr key={brand.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium">{brand.name}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{brand.slug}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                                                        {brand.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{brand.products_count} products</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(brand.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand)}>
                                                            <Trash2 className="h-4 w-4" />
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

                {brands.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {brands.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white' : 'bg-white'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i} className="px-3 py-1 text-xs opacity-30" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ),
                        )}
                    </div>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="brand-name">Name *</Label>
                                <Input id="brand-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                {errors.name && <InputError message={errors.name} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand-slug">Slug *</Label>
                                <Input
                                    id="brand-slug"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    placeholder="auto-generated from name if empty"
                                />
                                {errors.slug && <InputError message={errors.slug} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand-desc">Description</Label>
                                <textarea
                                    id="brand-desc"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                {errors.description && <InputError message={errors.description} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="brand-active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                />
                                <Label htmlFor="brand-active">Active</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editing ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Brands', href: BrandRoutes.index().url },
    ],
};
