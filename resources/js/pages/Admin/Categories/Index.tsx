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
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Catalog — Categories</p>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">Categories</h1>
                        <p className="text-sm text-muted-foreground mt-2">Organize your catalog with clear category groups.</p>
                    </div>
                    <Button onClick={openCreate} className="bg-[#070E01] hover:bg-[#1A3A0A] text-[#ECF3E5] dark:bg-primary dark:text-primary-foreground dark:hover:bg-[#8539D3]">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
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
                                <Link href={CategoryRoutes.index().url}>
                                    <Button type="button" variant="ghost">
                                        Clear
                                    </Button>
                                </Link>
                            )}
                        </form>
                    </CardContent>
                </Card>

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
                                    {categories.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No categories found.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.data.map((category) => (
                                            <tr key={category.id} className="border-b hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium">{category.name}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{category.slug}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={category.is_active ? 'success' : 'secondary'}>
                                                        {category.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{category.products_count} products</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(category.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
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

                {categories.last_page > 1 && (
                    <div className="flex gap-2 justify-center">
                        {categories.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1 text-xs border rounded ${link.active ? 'bg-black text-white dark:bg-primary dark:text-primary-foreground' : 'bg-white dark:bg-secondary dark:text-secondary-foreground'}`}
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
