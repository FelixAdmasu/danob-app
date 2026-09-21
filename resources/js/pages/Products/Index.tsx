import { Head, Link, usePage } from '@inertiajs/react';
import { Package, Search, X } from 'lucide-react';

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
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

export default function ProductsIndex({ products, filters, categories, brands }: Props) {
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
            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="max-w-[1000px] mb-12">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                            — The Catalog
                        </span>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] tracking-tighter text-[#070E01] max-w-4xl">
                            Our Products.
                        </h1>
                        <p className="text-lg text-[#4A4A4A] mt-6 max-w-xl">
                            Browse our selection of bakery and pastry ingredients. {products.total} products available.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filters Bar */}
            <section className="py-8 px-6 md:px-12 bg-[#ECF3E5] border-b border-[#070E01]/10">
                <div className="max-w-[1920px] mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A4A]" />
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
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#070E01]/10 rounded-lg text-sm font-serif text-[#070E01] placeholder:text-[#4A4A4A]/40 focus:outline-none focus:border-[#2D5016] transition-colors"
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
                            className="px-4 py-2.5 bg-white border border-[#070E01]/10 rounded-lg text-sm font-serif text-[#070E01] focus:outline-none focus:border-[#2D5016] transition-colors appearance-none cursor-pointer min-w-[180px]"
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
                            className="px-4 py-2.5 bg-white border border-[#070E01]/10 rounded-lg text-sm font-serif text-[#070E01] focus:outline-none focus:border-[#2D5016] transition-colors appearance-none cursor-pointer min-w-[180px]"
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
                                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#2D5016] hover:text-[#1A3A0A] transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Clear Filters
                            </Link>
                        )}
                    </div>

                    {/* Active filter count */}
                    {currentFilterCount > 0 && (
                        <p className="mt-3 text-xs text-[#4A4A4A]">
                            Showing {products.data.length} of {products.total} results
                            {filters.category && ` in ${categories.find(c => c.slug === filters.category)?.name || filters.category}`}
                            {filters.brand && ` by ${brands.find(b => b.slug === filters.brand)?.name || filters.brand}`}
                        </p>
                    )}
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                <div className="max-w-[1920px] mx-auto">
                    {products.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {products.data.map((product) => (
                                <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer">
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-[#D4E8C8]">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-16 w-16 text-[#070E01]/15 group-hover:text-[#070E01]/30 transition-colors duration-700" />
                                        </div>
                                        {product.brand && (
                                            <div className="absolute top-6 left-6 px-3 py-1 bg-[#070E01] text-[#ECF3E5] text-[9px] font-bold uppercase tracking-widest">
                                                {product.brand.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="font-serif text-2xl mb-2">{product.name}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">
                                                {product.category?.name || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <Package className="mx-auto h-16 w-16 text-[#070E01]/15 mb-6" />
                            <h3 className="font-serif text-2xl text-[#070E01]">No products found</h3>
                            <p className="text-sm text-[#4A4A4A] mt-2">
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
                                        className={`inline-flex h-10 min-w-10 items-center justify-center px-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${
                                            link.active
                                                ? 'bg-[#070E01] text-[#ECF3E5]'
                                                : 'bg-white text-[#070E01] border border-[#070E01]/10 hover:border-[#070E01]/30'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="inline-flex h-10 min-w-10 items-center justify-center px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#070E01]/20"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
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
