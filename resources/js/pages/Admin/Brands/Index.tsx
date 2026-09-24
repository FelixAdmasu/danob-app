import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';
import * as BrandRoutes from '@/routes/admin/brands';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
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

type BrandForm = {
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
    logo: File | null;
    logoPreview: string | null;
    removeLogo: boolean;
};

const emptyForm = (): BrandForm => ({
    name: '',
    slug: '',
    description: '',
    is_active: true,
    logo: null,
    logoPreview: null,
    removeLogo: false,
});

export default function Index({ brands, filters }: Props) {
    const { props } = usePage<{ flash?: { error?: string } }>();
    const flashError = (props.flash as { error?: string } | undefined)?.error;
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Brand | null>(null);
    const [form, setForm] = useState<BrandForm>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(BrandRoutes.index().url, search ? { search } : {}, { preserveState: true, replace: true });
    };

    const revokePreview = (preview: string | null) => {
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };

    const openCreate = () => {
        revokePreview(form.logoPreview);
        setEditing(null);
        setForm(emptyForm());
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (brand: Brand) => {
        revokePreview(form.logoPreview);
        setEditing(brand);
        setForm({ ...emptyForm(), name: brand.name, slug: brand.slug, description: brand.description || '', is_active: brand.is_active, logoPreview: brand.logo_url });
        setErrors({});
        setDialogOpen(true);
    };

    const closeDialog = () => {
        revokePreview(form.logoPreview);
        setDialogOpen(false);
    };

    const handleLogoChange = (file: File | null) => {
        revokePreview(form.logoPreview);
        setForm({
            ...form,
            logo: file,
            logoPreview: file ? URL.createObjectURL(file) : editing?.logo_url ?? null,
            removeLogo: file ? false : form.removeLogo,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Multipart PUT bodies are not parsed by PHP: edits submit as POST
        // with _method appended to the FormData (mirrors Admin/Products/Edit).
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-'));
        formData.append('description', form.description);
        formData.append('is_active', form.is_active ? '1' : '0');
        if (form.logo) formData.append('logo', form.logo);
        if (editing && form.removeLogo && !form.logo) formData.append('remove_logo', '1');
        if (editing) formData.append('_method', 'PUT');

        const onError = (err: Record<string, string>) => {
            setErrors(err);
            setProcessing(false);
        };
        const onSuccess = () => {
            closeDialog();
            setProcessing(false);
        };
        const options = {
            forceFormData: true,
            onError,
            onSuccess,
            onFinish: () => setProcessing(false),
        };
        if (editing) {
            router.post(BrandRoutes.update(editing.id).url, formData, options as never);
        } else {
            router.post(BrandRoutes.store().url, formData, options as never);
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
                <Heading
                    eyebrow="Catalog"
                    title="Brands"
                    description="Manage product brands and their catalog presence."
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Add Brand
                        </Button>
                    }
                />

                {flashError && <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{flashError}</div>}

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs dark:shadow-none">
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

                <Card>
                    <CardHeader>
                        <CardTitle>All Brands</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Logo</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Products</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brands.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No brands found.</TableEmpty>
                                ) : (
                                    brands.data.map((brand) => (
                                        <TableRow key={brand.id}>
                                            <TableCell>
                                                {brand.logo_url ? (
                                                    <img
                                                        src={brand.logo_url}
                                                        alt={brand.name}
                                                        className="h-10 w-10 rounded-md border object-cover"
                                                        onError={onImageError}
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed bg-muted">
                                                        <ImageIcon className="h-4 w-4 text-muted-foreground opacity-40" aria-hidden="true" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{brand.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{brand.slug}</TableCell>
                                            <TableCell>
                                                <Badge variant={brand.is_active ? 'success' : 'secondary'}>
                                                    {brand.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">{brand.products_count} products</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(brand.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(brand)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(brand)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {brands.last_page > 1 && <Pagination links={brands.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
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
                            <div className="space-y-2">
                                <Label htmlFor="brand-logo">Logo</Label>
                                <Input
                                    id="brand-logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                                />
                                {errors.logo && <InputError message={errors.logo} />}
                                {form.logoPreview ? (
                                    <img
                                        src={form.logoPreview}
                                        alt="Logo preview"
                                        className={`h-24 w-24 rounded-md border object-cover ${form.removeLogo && !form.logo ? 'opacity-50' : ''}`}
                                        onError={onImageError}
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed bg-muted">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground opacity-40" aria-hidden="true" />
                                    </div>
                                )}
                                {editing?.logo_url && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="brand-remove-logo"
                                            checked={form.removeLogo}
                                            disabled={!!form.logo}
                                            onChange={(e) => setForm({ ...form, removeLogo: e.target.checked })}
                                        />
                                        <Label htmlFor="brand-remove-logo">Remove logo</Label>
                                    </div>
                                )}
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
                                <Button type="button" variant="outline" onClick={closeDialog}>
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Brands', href: BrandRoutes.index().url },
    ],
};
