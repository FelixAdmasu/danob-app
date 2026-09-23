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
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import * as CategoryRoutes from '@/routes/admin/categories';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(CategoryRoutes.index().url, search ? { search } : {}, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', slug: '', description: '', is_active: true });
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (category: Category) => {
        setEditing(category);
        setForm({ name: category.name, slug: category.slug, description: category.description || '', is_active: category.is_active });
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
            router.put(CategoryRoutes.update(editing.id).url, payload as never, {
                onError,
                onSuccess,
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(CategoryRoutes.store().url, payload as never, {
                onError,
                onSuccess,
                onFinish: () => setProcessing(false),
            });
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
                                    <TableEmpty colSpan={6}>No categories found.</TableEmpty>
                                ) : (
                                    categories.data.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? 'success' : 'secondary'}>
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">{category.products_count} products</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
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
                        {categories.last_page > 1 && <Pagination links={categories.links} className="px-4 pt-4 pb-2" />}
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                {errors.description && <InputError message={errors.description} />}
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
