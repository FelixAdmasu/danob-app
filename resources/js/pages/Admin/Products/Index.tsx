import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FilterPanel, FilterField } from '@/components/filter-panel';
import { Panel, PanelLink } from '@/components/panel';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Eye, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as ProductRoutes from '@/routes/admin/products';
import { onImageError } from '@/lib/image-fallback';

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
    is_featured: boolean;
    featured_sort_order: number;
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
    total: number;
};

type Filters = {
    search: string | null;
    category_id: number | null;
    brand_id: number | null;
    status: string | null;
};

type FilterOption = { id: number; name: string };

type Props = {
    products: PaginatedProducts;
    categories: FilterOption[];
    brands: FilterOption[];
    filters: Filters;
};

export default function Index({
    products,
    categories,
    brands,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState(
        filters.category_id ? String(filters.category_id) : 'all',
    );
    const [brandId, setBrandId] = useState(
        filters.brand_id ? String(filters.brand_id) : 'all',
    );
    const [status, setStatus] = useState(filters.status ?? 'all');

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.category_id ||
        filters.brand_id ||
        filters.status,
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ProductRoutes.index().url,
            {
                search: search || undefined,
                category_id: categoryId !== 'all' ? categoryId : undefined,
                brand_id: brandId !== 'all' ? brandId : undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
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
                <Heading
                    eyebrow="Catalog"
                    title="Products"
                    description="Manage your products, variants and inventory information."
                    actions={
                        <Link href={ProductRoutes.create().url}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </Link>
                    }
                />

                <FilterPanel
                    onSubmit={handleSearch}
                    onClear={() =>
                        router.get(
                            ProductRoutes.index().url,
                            {},
                            { preserveState: true, replace: true },
                        )
                    }
                    activeCount={hasActiveFilters ? 1 : 0}
                >
                    <FilterField label="Search" htmlFor="product-search">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                id="product-search"
                                placeholder="Search by name, slug..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </FilterField>
                    <FilterField label="Category" htmlFor="product-category">
                        <Select
                            value={categoryId}
                            onValueChange={setCategoryId}
                        >
                            <SelectTrigger id="product-category">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="Brand" htmlFor="product-brand">
                        <Select value={brandId} onValueChange={setBrandId}>
                            <SelectTrigger id="product-brand">
                                <SelectValue placeholder="Brand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {brands.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="Status" htmlFor="product-status">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="product-status">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                </FilterPanel>

                <Panel
                    title="All Products"
                    subtitle={`${products.total.toLocaleString()} record${products.total === 1 ? '' : 's'}`}
                    action={
                        <PanelLink href={ProductRoutes.create().url}>
                            + Add Product
                        </PanelLink>
                    }
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Featured</TableHead>
                                <TableHead className="text-right">
                                    Variants
                                </TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.data.length === 0 ? (
                                <TableEmpty colSpan={8}>
                                    No products yet.
                                </TableEmpty>
                            ) : (
                                products.data.map((product) => {
                                    const primary =
                                        product.images.find(
                                            (i) => i.is_primary,
                                        ) ||
                                        product.images[0] ||
                                        null;
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                {primary ? (
                                                    <img
                                                        src={primary.url}
                                                        alt={product.name}
                                                        onError={onImageError}
                                                        className="border-border h-10 w-10 rounded-lg border object-cover"
                                                    />
                                                ) : (
                                                    <div className="border-border bg-muted/60 flex h-10 w-10 items-center justify-center rounded-lg border border-dashed">
                                                        <Package
                                                            className="h-4 w-4 opacity-30"
                                                            aria-hidden="true"
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {product.category?.name || '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {product.brand?.name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={product.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {product.is_featured
                                                    ? `Yes · ${product.featured_sort_order}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>
                                                        {product.variants_count}
                                                    </span>
                                                    {product.low_stock_variants_count >
                                                        0 && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-[10px]"
                                                        >
                                                            Low:{' '}
                                                            {
                                                                product.low_stock_variants_count
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link
                                                        href={
                                                            ProductRoutes.show(
                                                                product.id,
                                                            ).url
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link
                                                        href={
                                                            ProductRoutes.edit(
                                                                product.id,
                                                            ).url
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDelete(
                                                                product.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    {products.last_page > 1 && (
                        <Pagination
                            links={products.links}
                            className="px-6 pt-4 pb-2"
                        />
                    )}
                </Panel>
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
