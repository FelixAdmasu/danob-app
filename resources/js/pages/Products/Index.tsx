import { Head, Link } from '@inertiajs/react';
import { Package, Search, X } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';

type ProductImage = {
    id: number;
    url: string;
    sort_order: number;
    is_primary: boolean;
    alt_text: string | null;
};

type ProductVariant = {
    id: number;
    public_price: string | null;
    is_active: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
    images: ProductImage[];
    variants: ProductVariant[];
};

type PaginatedProducts = {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type FilterData = {
    search: string;
    category: string;
    brand: string;
};

type Category = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
};

type Props = {
    products: PaginatedProducts;
    filters: FilterData;
    categories: Category[];
    brands: Brand[];
};

export default function ProductsIndex({
    products,
    filters,
    categories,
    brands,
}: Props) {
    const baseUrl = '/products';

    function buildUrl(params: Record<string, string | null>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== 'all') {
                searchParams.set(key, value);
            }
        });
        const qs = searchParams.toString();
        return qs ? `${baseUrl}?${qs}` : baseUrl;
    }

    const currentFilterCount = [
        filters.search ? 1 : 0,
        filters.category ? 1 : 0,
        filters.brand ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (
        <>
            <Head title="Products" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="mb-12 max-w-[1000px]">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — The Catalog
                        </span>
                        <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            Our Products.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-[#4A4A4A]">
                            Browse our selection of bakery and pastry
                            ingredients. {products.total} products available.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filters Bar */}
            <section className="border-b border-[#070E01]/10 bg-[#ECF3E5] px-6 py-8 md:px-12">
                <div className="mx-auto max-w-[1920px]">
                    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                        {/* Search */}
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4A4A4A]" />
                            <input
                                type="search"
                                defaultValue={filters.search}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    window.location.href = buildUrl({
                                        search: val || null,
                                        category: filters.category || null,
                                        brand: filters.brand || null,
                                    });
                                }}
                                placeholder="Search products..."
                                className="w-full rounded-lg border border-[#070E01]/10 bg-white py-2.5 pr-4 pl-10 font-serif text-sm text-[#070E01] transition-colors placeholder:text-[#4A4A4A]/40 focus:border-[#2D5016] focus:outline-none"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            defaultValue={filters.category || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                window.location.href = buildUrl({
                                    search: filters.search || null,
                                    category: val || null,
                                    brand: filters.brand || null,
                                });
                            }}
                            className="min-w-[180px] cursor-pointer appearance-none rounded-lg border border-[#070E01]/10 bg-white px-4 py-2.5 font-serif text-sm text-[#070E01] transition-colors focus:border-[#2D5016] focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.slug}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        {/* Brand Filter */}
                        <select
                            defaultValue={filters.brand || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                window.location.href = buildUrl({
                                    search: filters.search || null,
                                    category: filters.category || null,
                                    brand: val || null,
                                });
                            }}
                            className="min-w-[180px] cursor-pointer appearance-none rounded-lg border border-[#070E01]/10 bg-white px-4 py-2.5 font-serif text-sm text-[#070E01] transition-colors focus:border-[#2D5016] focus:outline-none"
                        >
                            <option value="">All Brands</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.slug}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>

                        {/* Clear Filters */}
                        {currentFilterCount > 0 && (
                            <Link
                                href={baseUrl}
                                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-[#2D5016] uppercase transition-colors hover:text-[#1A3A0A]"
                            >
                                <X className="h-3 w-3" />
                                Clear Filters
                            </Link>
                        )}
                    </div>

                    {/* Active filter count */}
                    {currentFilterCount > 0 && (
                        <p className="mt-3 text-xs text-[#4A4A4A]">
                            Showing {products.data.length} of {products.total}{' '}
                            results
                            {filters.category &&
                                ` in ${categories.find((c) => c.slug === filters.category)?.name || filters.category}`}
                            {filters.brand &&
                                ` by ${brands.find((b) => b.slug === filters.brand)?.name || filters.brand}`}
                        </p>
                    )}
                </div>
            </section>

            {/* Products Grid */}
            <section className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48">
                <div className="mx-auto max-w-[1920px]">
                    {products.data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const primaryImage =
                                    product.images.find(
                                        (img) => img.is_primary,
                                    ) ||
                                    product.images[0] ||
                                    null;
                                const cheapestPrice =
                                    product.variants
                                        .filter(
                                            (v) =>
                                                v.is_active &&
                                                v.public_price !== null,
                                        )
                                        .map((v) =>
                                            parseFloat(
                                                v.public_price as string,
                                            ),
                                        )
                                        .filter((n) => !isNaN(n))
                                        .sort((a, b) => a - b)[0] ?? null;
                                return (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative mb-8 aspect-[4/5] overflow-hidden bg-[#D4E8C8]">
                                            {primaryImage ? (
                                                <img
                                                    src={primaryImage.url}
                                                    alt={
                                                        primaryImage.alt_text ||
                                                        product.name
                                                    }
                                                    onError={onImageError}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Package className="h-16 w-16 text-[#070E01]/15 transition-colors duration-700 group-hover:text-[#070E01]/30" />
                                                </div>
                                            )}
                                            {product.brand && (
                                                <div className="absolute top-6 left-6 bg-[#070E01] px-3 py-1 text-[9px] font-bold tracking-widest text-[#ECF3E5] uppercase">
                                                    {product.brand.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-between border-b border-[#070E01]/10 pb-6">
                                            <div>
                                                <h3 className="mb-2 font-serif text-2xl">
                                                    {product.name}
                                                </h3>
                                                <p className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                    {product.category?.name ||
                                                        'Uncategorized'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {cheapestPrice !== null ? (
                                                    <p className="text-sm font-bold text-[#070E01]">
                                                        {cheapestPrice.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                        Contact for price
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <Package className="mx-auto mb-6 h-16 w-16 text-[#070E01]/15" />
                            <h3 className="font-serif text-2xl text-[#070E01]">
                                No products found
                            </h3>
                            <p className="mt-2 text-sm text-[#4A4A4A]">
                                {currentFilterCount > 0
                                    ? 'Try adjusting your filters.'
                                    : 'Products will appear here once added.'}
                            </p>
                        </div>
                    )}

                    {products.last_page > 1 && (
                        <nav className="mt-16 flex items-center justify-center gap-2">
                            {products.links.map((link, i) =>
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`inline-flex h-10 min-w-10 items-center justify-center px-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-colors ${
                                            link.active
                                                ? 'bg-[#070E01] text-[#ECF3E5]'
                                                : 'border border-[#070E01]/10 bg-white text-[#070E01] hover:border-[#070E01]/30'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="inline-flex h-10 min-w-10 items-center justify-center px-4 text-[10px] font-bold tracking-[0.3em] text-[#070E01]/20 uppercase"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </nav>
                    )}
                </div>
            </section>
        </>
    );
}
