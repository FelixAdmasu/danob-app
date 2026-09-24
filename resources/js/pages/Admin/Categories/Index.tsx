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
import { Image as ImageIcon, Search, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import * as CategoryRoutes from '@/routes/admin/categories';
import { onImageError } from '@/lib/image-fallback';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    image_url: string | null;
    products_count: number;
    created_at: string;
};

type PaginatedCategories = {
    data: Category[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    categories: PaginatedCategories;
    filters: { search: string | null };
};

export default function Index({ categories, filters }: Props) {
    const { props } = usePage<{ flash?: { error?: string } }>();
    const flashError = (props.flash as { error?: string } | undefined)?.error;
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(CategoryRoutes.index().url, search ? { search } : {}, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', slug: '', description: '', is_active: true });
        setImageFile(null);
        setImagePreview(null);
        setCurrentImageUrl(null);
        setRemoveImage(false);
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        setForm({ name: category.name, slug: category.slug, description: category.description || '', is_active: category.is_active });
        setImageFile(null);
        setImagePreview(category.image_url);
        setCurrentImageUrl(category.image_url);
        setRemoveImage(false);
        setErrors({});
        setDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        } else {
            setImageFile(null);
            setImagePreview(currentImageUrl);
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        setDialogOpen(open);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-'));
        formData.append('description', form.description);
        formData.append('is_active', form.is_active ? '1' : '0');
        if (imageFile) formData.append('image', imageFile);
        const onError = (err: Record<string, string>) => {
            setErrors(err);
            setProcessing(false);
        };
        const onSuccess = () => {
            setDialogOpen(false);
            setProcessing(false);
        };
        const options = {
            forceFormData: true,
            onError,
            onSuccess,
            onFinish: () => setProcessing(false),
        } as never;
        if (editing) {
            formData.append('_method', 'PUT');
            if (removeImage && !imageFile) formData.append('remove_image', '1');
            router.post(CategoryRoutes.update(editing.id).url, formData, options);
        } else {
            router.post(CategoryRoutes.store().url, formData, options);
        }
    };

    const handleDelete = (category: Category) => {
        if (!confirm(`Delete category "${category.name}"?`)) return;
        router.delete(CategoryRoutes.destroy(category.id).url);
    };

    return (
        <>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Catalog"
                    title="Categories"
                    description="Organize your catalog with clear category groups."
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    }
                />

                {flashError && <div className="rounded border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">{flashError}</div>}

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors dark:border-border/60 dark:shadow-none">
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
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                    {filters.search && (
                        <Link href={CategoryRoutes.index().url}>
                            <Button type="button" variant="ghost">
                                Clear
                            </Button>
                        </Link>
                    )}
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>All Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Products</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>No categories found.</TableEmpty>
                                ) : (
                                    categories.data.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                {category.image_url ? (
                                                    <img
                                                        src={category.image_url}
                                                        alt={category.name}
                                                        className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-border/60"
                                                        onError={onImageError}
                                                    />
                                                ) : (
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/60">
                                                        <ImageIcon className="h-4 w-4 opacity-30" aria-hidden="true" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="font-mono">{category.slug}</TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? 'success' : 'secondary'}>
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{category.products_count} products</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(category.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {categories.last_page > 1 && <Pagination links={categories.links} className="px-6 pt-4 pb-2" />}
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cat-name">Name *</Label>
                                <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                {errors.name && <InputError message={errors.name} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-slug">Slug *</Label>
                                <Input
                                    id="cat-slug"
                                    value={form.slug}
                                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    placeholder="auto-generated from name if empty"
                                />
                                {errors.slug && <InputError message={errors.slug} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-desc">Description</Label>
                                <textarea
                                    id="cat-desc"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/15"
                                />
                                {errors.description && <InputError message={errors.description} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-image" className="flex items-center gap-1.5">
                                    <Upload className="h-4 w-4" aria-hidden="true" /> Image
                                </Label>
                                {!removeImage && imagePreview ? (
                                    <div className="h-32 w-full overflow-hidden rounded-md border border-border bg-muted">
                                        <img
                                            src={imagePreview}
                                            alt="Category image preview"
                                            className="h-full w-full object-cover"
                                            onError={onImageError}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted">
                                        <ImageIcon className="h-8 w-8 opacity-20" aria-hidden="true" />
                                    </div>
                                )}
                                <Input id="cat-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                                {errors.image && <InputError message={errors.image} />}
                                {currentImageUrl && !imageFile && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="cat-remove-image"
                                            checked={removeImage}
                                            onChange={(e) => setRemoveImage(e.target.checked)}
                                        />
                                        <Label htmlFor="cat-remove-image">Remove image</Label>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="cat-active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                />
                                <Label htmlFor="cat-active">Active</Label>
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Categories', href: CategoryRoutes.index().url },
    ],
};
