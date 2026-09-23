import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import * as ProductRoutes from '@/routes/admin/products';

type ProductImage = {
    id: number;
    url: string;
    is_primary: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    status: string;
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
    variants_count: number;
    low_stock_variants_count: number;
    images: ProductImage[];
};

type PaginatedProducts = {
    data: Product[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    products: PaginatedProducts;
    filters: { search: string | null };
};

export default function Index({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(ProductRoutes.index().url, { search: search || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this product?')) {
            router.delete(ProductRoutes.destroy(id).url);
        }
    };

    return (
        <>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Catalog — Products</p>
                        <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Products</h1>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xl">Manage your products, variants and inventory information.</p>
                    </div>
                    <Link href={ProductRoutes.create().url}>
                        <Button className="bg-[#A16AE8] text-white hover:bg-[#8539D3] tracking-wide">
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name, slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                    {filters.search && (
                        <Link href={ProductRoutes.index().url}>
                            <Button type="button" variant="ghost">
                                Clear
                            </Button>
                        </Link>
                    )}
                </form>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Image</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Brand</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Variants</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                <Package className="mx-auto h-8 w-8 opacity-20 mb-2" />
                                                No products yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data.map((product) => {
                                            const primary = product.images.find((i) => i.is_primary) || product.images[0] || null;
                                            return (
                                                <tr key={product.id} className="border-b transition-colors hover:bg-muted/40">
                                                    <td className="px-4 py-3">
                                                        {primary ? (
                                                            <img src={primary.url} alt={product.name} className="h-10 w-10 rounded object-cover" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                                <Package className="h-4 w-4 opacity-30" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">{product.name}</td>
                                                    <td className="px-4 py-3 text-sm">{product.category?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-sm">{product.brand?.name || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>{product.status}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>{product.variants_count}</span>
                                                            {product.low_stock_variants_count > 0 && (
                                                                <Badge variant="destructive" className="text-[10px]">
                                                                    Low: {product.low_stock_variants_count}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <Link href={ProductRoutes.show(product.id).url}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={ProductRoutes.edit(product.id).url}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {products.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {products.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`inline-flex min-w-8 justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
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
        { title: 'Products', href: ProductRoutes.index().url },
    ],
};
