import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
};

type Props = {
    brands: Brand[];
};

export default function BrandsIndex({ brands }: Props) {
    return (
        <>
            <Head title="Brands" />
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Brands</h1>
                    <p className="mt-3 text-base text-neutral-500">Browse the brands available through Danob.</p>
                </div>

                {brands.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {brands.map((brand) => (
                            <Link key={brand.id} href={`/brands/${brand.slug}`} className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md">
                                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-amber-700">{brand.name}</h3>
                                {brand.description && (
                                    <p className="mt-3 text-sm text-neutral-500 line-clamp-2">{brand.description}</p>
                                )}
                                <div className="mt-4 flex items-center text-xs font-medium text-neutral-400 group-hover:text-neutral-600">
                                    {brand.products_count} {brand.products_count === 1 ? 'product' : 'products'}
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
                        <h3 className="text-lg font-semibold text-neutral-900">No brands found</h3>
                        <p className="mt-2 text-sm text-neutral-500">Brand information will appear here once added.</p>
                    </div>
                )}
            </div>
        </>
    );
}
