import { Head, Link } from '@inertiajs/react';
import { Package, ChevronRight } from 'lucide-react';

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
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Products</h1>
                    <p className="mt-3 text-base text-neutral-500">Browse our selection of bakery and pastry ingredients.</p>
                </div>

                {products.data.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.data.map((product) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md">
                                <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-neutral-100">
                                    <Package className="h-16 w-16 text-neutral-300" />
                                </div>
                                <div className="space-y-2">
                                    {product.brand && (
                                        <span className="text-xs font-medium text-neutral-400">{product.brand.name}</span>
                                    )}
                                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-amber-700">{product.name}</h3>
                                    <p className="text-sm text-neutral-500 line-clamp-2">{product.description}</p>
                                    {product.category && (
                                        <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">{product.category.name}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-neutral-300" />
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No products found</h3>
                        <p className="mt-2 text-sm text-neutral-500">Products will appear here once added.</p>
                    </div>
                )}

                {products.last_page > 1 && (
                    <nav className="mt-10 flex items-center justify-center gap-1">
                        {products.links.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${link.active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-neutral-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}
