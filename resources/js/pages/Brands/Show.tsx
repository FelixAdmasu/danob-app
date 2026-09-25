import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { name: string; slug: string } | null;
    images: {
        id: number;
        url: string;
        sort_order: number;
        is_primary: boolean;
        alt_text: string | null;
    }[];
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

            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <nav className="mb-12 flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                        <Link
                            href="/"
                            className="transition-colors hover:text-[#070E01]"
                        >
                            Home
                        </Link>
                        <span>/</span>
                        <Link
                            href="/brands"
                            className="transition-colors hover:text-[#070E01]"
                        >
                            Brands
                        </Link>
                        <span>/</span>
                        <span className="text-[#070E01]">{brand.name}</span>
                    </nav>

                    <div className="mb-16 max-w-[1000px]">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — Brand
                        </span>
                        <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            {brand.name}
                        </h1>
                        {brand.description && (
                            <p className="mt-6 max-w-xl text-lg text-[#4A4A4A]">
                                {brand.description}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48">
                <div className="mx-auto max-w-[1920px]">
                    {brand.products.length > 0 ? (
                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {brand.products.map((product) => {
                                const primaryImage =
                                    product.images?.find(
                                        (img) => img.is_primary,
                                    ) ||
                                    product.images?.[0] ||
                                    null;
                                return (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative mb-8 flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#D4E8C8]">
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
                                                <Package className="h-16 w-16 text-[#070E01]/15 transition-colors duration-700 group-hover:text-[#070E01]/30" />
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
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <Package className="mx-auto mb-6 h-16 w-16 text-[#070E01]/15" />
                            <h3 className="font-serif text-2xl text-[#070E01]">
                                No products yet
                            </h3>
                            <p className="mt-2 text-sm text-[#4A4A4A]">
                                Products from this brand will appear here once
                                added.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
