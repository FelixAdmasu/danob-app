import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    products_count: number;
};

type Props = {
    brands: Brand[];
};

export default function BrandsIndex({ brands }: Props) {
    return (
        <>
            <Head title="Brands" />

            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="mb-12 max-w-[1000px]">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — Partners
                        </span>
                        <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            Trusted Brands.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-[#4A4A4A]">
                            Browse the brands available through Danob.
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48">
                <div className="mx-auto max-w-[1920px]">
                    {brands.length > 0 ? (
                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {brands.map((brand) => (
                                <Link
                                    key={brand.id}
                                    href={`/brands/${brand.slug}`}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative mb-8 aspect-[4/5] overflow-hidden bg-[#D4E8C8]">
                                        {brand.logo_url ? (
                                            <img
                                                src={brand.logo_url}
                                                alt={brand.name}
                                                onError={onImageError}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Package className="h-16 w-16 text-[#070E01]/15 transition-colors duration-700 group-hover:text-[#070E01]/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-start justify-between border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="mb-2 font-serif text-2xl">
                                                {brand.name}
                                            </h3>
                                            {brand.description && (
                                                <p className="line-clamp-2 text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                    {brand.description}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-[#070E01]">
                                            {brand.products_count} Products
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <h3 className="font-serif text-2xl text-[#070E01]">
                                No brands found
                            </h3>
                            <p className="mt-2 text-sm text-[#4A4A4A]">
                                Brand information will appear here once added.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
