import { Head, Link } from '@inertiajs/react';
import { Package, ArrowRight } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';

type Variant = {
    id: number;
    name: string;
    unit: string;
    quantity: number;
    sku: string;
    public_price: string | null;
    is_active: boolean;
};

type ProductImage = {
    id: number;
    url: string;
    sort_order: number;
    is_primary: boolean;
    alt_text: string | null;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    status: string;
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
    variants: Variant[];
    images: ProductImage[];
};

type Props = {
    product: Product;
};

export default function ProductShow({ product }: Props) {
    const primaryImage =
        product.images.find((img) => img.is_primary) || product.images[0];
    const activeVariants = product.variants.filter((v) => v.is_active);

    return (
        <>
            <Head title={product.name} />

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
                            href="/products"
                            className="transition-colors hover:text-[#070E01]"
                        >
                            Products
                        </Link>
                        <span>/</span>
                        <span className="text-[#070E01]">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
                        <div>
                            <div className="relative aspect-square overflow-hidden bg-[#D4E8C8]">
                                {primaryImage ? (
                                    <img
                                        src={primaryImage.url}
                                        alt={
                                            primaryImage.alt_text ||
                                            product.name
                                        }
                                        onError={onImageError}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Package className="h-32 w-32 text-[#070E01]/15" />
                                    </div>
                                )}
                            </div>
                            {product.images.length > 1 && (
                                <div className="mt-4 grid grid-cols-4 gap-3">
                                    {product.images.map((img) => (
                                        <div
                                            key={img.id}
                                            className={`aspect-square overflow-hidden bg-[#D4E8C8] ${
                                                img.id === primaryImage?.id
                                                    ? 'ring-2 ring-[#2D5016]'
                                                    : ''
                                            }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={
                                                    img.alt_text || product.name
                                                }
                                                onError={onImageError}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-10">
                            <div>
                                {product.brand && (
                                    <Link
                                        href={`/brands/${product.brand.slug}`}
                                        className="text-[10px] font-bold tracking-[0.4em] text-[#2D5016] uppercase transition-colors hover:text-[#1A3A0A]"
                                    >
                                        {product.brand.name}
                                    </Link>
                                )}
                                <h1 className="mt-3 font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-6xl">
                                    {product.name}
                                </h1>
                                {product.category && (
                                    <span className="mt-4 inline-block bg-[#D4E8C8] px-3 py-1 text-[9px] font-bold tracking-widest uppercase">
                                        {product.category.name}
                                    </span>
                                )}
                            </div>

                            <div className="border-b border-[#070E01]/10 pb-8">
                                <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    Description
                                </span>
                                <p className="text-base leading-relaxed text-[#4A4A4A]">
                                    {product.description}
                                </p>
                            </div>

                            {activeVariants.length > 0 && (
                                <div className="border-b border-[#070E01]/10 pb-8">
                                    <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        Available Options
                                    </span>
                                    <div className="space-y-3">
                                        {activeVariants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className="flex items-center justify-between border border-[#070E01]/10 bg-white p-4"
                                            >
                                                <div>
                                                    <h3 className="font-serif text-lg text-[#070E01]">
                                                        {variant.name}
                                                    </h3>
                                                    <p className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                        {variant.unit}
                                                    </p>
                                                    {variant.sku && (
                                                        <p className="text-[9px] font-bold tracking-[0.3em] text-[#070E01]/40 uppercase">
                                                            SKU: {variant.sku}
                                                        </p>
                                                    )}
                                                </div>
                                                {variant.public_price && (
                                                    <span className="text-sm font-bold text-[#070E01]">
                                                        {variant.public_price}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center gap-3 border border-[#070E01]/20 px-6 py-3 text-[10px] font-bold tracking-[0.3em] text-[#070E01] uppercase transition-colors duration-500 hover:bg-[#070E01] hover:text-[#ECF3E5]"
                                >
                                    <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                                    Back to Products
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
