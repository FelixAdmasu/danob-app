import { Head, Link } from '@inertiajs/react';
import { Package, ChevronRight } from 'lucide-react';

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { name: string; slug: string } | null;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products: Product[];
};

type Props = {
    brand: Brand;
};

export default function BrandShow({ brand }: Props) {
    return (
        <>
            <Head title={brand.name} />
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/" className="hover:text-neutral-900">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/brands" className="hover:text-neutral-900">Brands</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-neutral-900">{brand.name}</span>
                </nav>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{brand.name}</h1>
                    {brand.description && (
                        <p className="mt-4 max-w-2xl text-base text-neutral-500">{brand.description}</p>
                    )}
                </div>

                {brand.products.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {brand.products.map((product) => (
                            <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md">
                                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-neutral-100">
                                    <Package className="h-12 w-12 text-neutral-300" />
                                </div>
                                <h3 className="text-base font-semibold text-neutral-900 group-hover:text-amber-700">{product.name}</h3>
                                <p className="mt-2 text-sm text-neutral-500 line-clamp-2">{product.description}</p>
                                {product.category && (
                                    <span className="mt-3 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">{product.category.name}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-neutral-300" />
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No products yet</h3>
                        <p className="mt-2 text-sm text-neutral-500">Products from this brand will appear here once added.</p>
                    </div>
                )}
            </div>
        </>
    );
}
