import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';

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

type Props = {
    products: PaginatedProducts;
};

export default function ProductsIndex({ products }: Props) {
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
                            <p className="text-sm text-[#4A4A4A] mt-2">Products will appear here once added.</p>
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
