import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';
import InquiryForm from '@/components/inquiry-form';

type Variant = {
    id: number;
    name: string;
    unit: string;
    quantity: number;
    sku: string;
    public_price: string | null;
    is_active: boolean;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
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

type RelatedProduct = {
    id: number;
    name: string;
    slug: string;
    category: { id: number; name: string; slug: string } | null;
    brand: { id: number; name: string; slug: string } | null;
    images: ProductImage[];
    variants: {
        id: number;
        public_price: string | null;
        quantity: number;
        is_active: boolean;
    }[];
};

type Props = {
    product: Product;
    related: RelatedProduct[];
};

type StockBadge = {
    label: string;
    className: string;
};

function stockBadge(variant: Variant): StockBadge {
    if (variant.stock_status === 'out_of_stock') {
        return {
            label: 'Out of stock',
            className: 'bg-[#070E01]/10 text-[#4A4A4A]',
        };
    }
    if (variant.stock_status === 'low_stock') {
        return {
            label: `Only ${variant.quantity} left`,
            className: 'bg-[#A5FFA9] text-[#070E01]',
        };
    }
    return { label: 'In stock', className: 'bg-[#D4E8C8] text-[#2D5016]' };
}

function cheapestPrice(
    variants: { public_price: string | null; is_active: boolean }[],
): number | null {
    const prices = variants
        .filter((variant) => variant.is_active && variant.public_price !== null)
        .map((variant) => parseFloat(variant.public_price as string))
        .filter((price) => !Number.isNaN(price));

    return prices.length > 0 ? Math.min(...prices) : null;
}

function formatPrice(value: number): string {
    return `ETB ${value.toFixed(2)}`;
}

const quickLinks = [
    {
        label: '01 // How to Order',
        title: 'Ordering Steps',
        href: '/how-to-order',
    },
    { label: '02 // Find Us', title: 'Branch Locations', href: '/branches' },
    { label: '03 // Talk to Us', title: 'Contact & Support', href: '/contact' },
];

export default function ProductShow({ product, related }: Props) {
    const [selectedImageId, setSelectedImageId] = useState<number | null>(
        (product.images.find((img) => img.is_primary) ?? product.images[0])
            ?.id ?? null,
    );

    const displayedImage =
        product.images.find((img) => img.id === selectedImageId) ??
        product.images[0] ??
        null;
    const displayedIndex = displayedImage
        ? product.images.findIndex((img) => img.id === displayedImage.id)
        : -1;

    const activeVariants = product.variants.filter((v) => v.is_active);
    const prices = activeVariants
        .map((variant) =>
            variant.public_price !== null
                ? parseFloat(variant.public_price)
                : Number.NaN,
        )
        .filter((price) => !Number.isNaN(price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const totalUnits = activeVariants.reduce(
        (sum, variant) => sum + (variant.quantity || 0),
        0,
    );
    const hasDescription = product.description.trim().length > 0;

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

                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
                        {/* Media gallery */}
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <div className="relative aspect-square overflow-hidden bg-[#D4E8C8]">
                                {displayedImage ? (
                                    <img
                                        src={displayedImage.url}
                                        alt={
                                            displayedImage.alt_text ||
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
                                {product.images.length > 1 &&
                                    displayedIndex >= 0 && (
                                        <div className="absolute right-4 bottom-4 bg-[#ECF3E5] px-3 py-1 text-[9px] font-bold tracking-[0.3em] text-[#070E01] uppercase">
                                            {String(
                                                displayedIndex + 1,
                                            ).padStart(2, '0')}{' '}
                                            /{' '}
                                            {String(
                                                product.images.length,
                                            ).padStart(2, '0')}
                                        </div>
                                    )}
                            </div>

                            {product.images.length > 1 && (
                                <div className="mt-4 grid grid-cols-4 gap-3">
                                    {product.images.map((img) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            aria-label={`View image of ${product.name}`}
                                            onClick={() =>
                                                setSelectedImageId(img.id)
                                            }
                                            className={`aspect-square cursor-pointer overflow-hidden bg-[#D4E8C8] transition-opacity ${
                                                img.id === displayedImage?.id
                                                    ? 'ring-2 ring-[#2D5016]'
                                                    : 'opacity-60 hover:opacity-100'
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
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product info */}
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
                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    {product.category && (
                                        <Link
                                            href={`/products?category=${product.category.slug}`}
                                            className="bg-[#D4E8C8] px-3 py-1.5 text-[9px] font-bold tracking-widest text-[#2D5016] uppercase transition-colors hover:bg-[#070E01] hover:text-[#ECF3E5]"
                                        >
                                            {product.category.name}
                                        </Link>
                                    )}
                                    {activeVariants.length > 0 && (
                                        <span
                                            className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase ${
                                                totalUnits > 0
                                                    ? 'bg-[#A5FFA9] text-[#070E01]'
                                                    : 'bg-[#070E01]/10 text-[#4A4A4A]'
                                            }`}
                                        >
                                            {totalUnits > 0
                                                ? `${totalUnits} in stock`
                                                : 'Out of stock'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="border-b border-[#070E01]/10 pb-8">
                                <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    {minPrice === null
                                        ? 'Pricing'
                                        : minPrice === maxPrice
                                          ? 'Price'
                                          : 'Price Range'}
                                </span>
                                {minPrice === null || maxPrice === null ? (
                                    <p className="font-serif text-3xl text-[#070E01] italic md:text-4xl">
                                        Contact for price
                                    </p>
                                ) : minPrice === maxPrice ? (
                                    <p className="font-serif text-3xl text-[#070E01] md:text-4xl">
                                        {formatPrice(minPrice)}
                                    </p>
                                ) : (
                                    <p className="font-serif text-3xl text-[#070E01] md:text-4xl">
                                        {formatPrice(minPrice)}
                                        <span className="mx-2 text-[#4A4A4A]">
                                            —
                                        </span>
                                        {formatPrice(maxPrice)}
                                    </p>
                                )}
                                <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-[#4A4A4A] uppercase">
                                    All prices in Ethiopian Birr (ETB) · Pickup
                                    at any Danob branch
                                </p>
                                {activeVariants.length > 0 && (
                                    <p className="mt-2 text-[11px] font-bold tracking-[0.2em] text-[#070E01] uppercase">
                                        {activeVariants.length} package size
                                        {activeVariants.length > 1
                                            ? 's'
                                            : ''}{' '}
                                        available · {totalUnits} unit
                                        {totalUnits === 1 ? '' : 's'} in stock
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            {hasDescription && (
                                <div className="border-b border-[#070E01]/10 pb-8">
                                    <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        Description
                                    </span>
                                    <p className="text-base leading-relaxed text-[#4A4A4A]">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Package options */}
                            {activeVariants.length > 0 && (
                                <div className="border-b border-[#070E01]/10 pb-8">
                                    <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        Package Options
                                    </span>
                                    <div className="border border-[#070E01]/10 bg-white">
                                        <div className="hidden items-center justify-between border-b border-[#070E01]/10 bg-[#ECF3E5] px-5 py-3 sm:flex">
                                            <span className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                                Package
                                            </span>
                                            <span className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                                Price
                                            </span>
                                            <span className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                                Availability
                                            </span>
                                        </div>
                                        {activeVariants.map((variant) => {
                                            const badge = stockBadge(variant);
                                            return (
                                                <div
                                                    key={variant.id}
                                                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-[#070E01]/10 px-5 py-4 last:border-b-0"
                                                >
                                                    <div className="min-w-0">
                                                        <h3 className="font-serif text-lg text-[#070E01]">
                                                            {variant.name}
                                                        </h3>
                                                        {variant.sku && (
                                                            <p className="mt-1 text-[9px] font-bold tracking-[0.3em] text-[#070E01]/40 uppercase">
                                                                SKU{' '}
                                                                {variant.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-bold text-[#070E01]">
                                                        {variant.public_price !==
                                                        null ? (
                                                            formatPrice(
                                                                parseFloat(
                                                                    variant.public_price,
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                                Contact for
                                                                price
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1 text-[9px] font-bold tracking-widest uppercase ${badge.className}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quick links */}
                            <div className="grid grid-cols-1 border-t border-[#070E01]/10 sm:grid-cols-3">
                                {quickLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="group flex items-center justify-between gap-4 border-b border-[#070E01]/10 py-5 pr-4 transition-colors duration-500 hover:bg-white sm:border-r sm:border-b-0 sm:pr-5 sm:last:border-r-0"
                                    >
                                        <div>
                                            <span className="block text-[9px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                {item.label}
                                            </span>
                                            <p className="mt-2 font-serif text-lg text-[#070E01]">
                                                {item.title}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#070E01]/30 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#2D5016]" />
                                    </Link>
                                ))}
                            </div>

                            <InquiryForm
                                compact
                                productId={product.id}
                                productName={product.name}
                                variants={activeVariants.map((variant) => ({
                                    id: variant.id,
                                    name: variant.name,
                                    unit: variant.unit,
                                }))}
                            />

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

                    {/* Related products */}
                    {related.length > 0 && (
                        <div className="mt-32 border-t border-[#070E01]/10 pt-16 md:mt-40 md:pt-24">
                            <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                                <div>
                                    <span className="mb-6 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        — Continue Exploring
                                    </span>
                                    <h2 className="font-serif text-3xl tracking-tighter text-[#070E01] md:text-5xl">
                                        You May Also Like.
                                    </h2>
                                </div>
                                <Link
                                    href="/products"
                                    className="text-[10px] font-bold tracking-[0.3em] text-[#070E01] uppercase transition-colors hover:text-[#2D5016]"
                                >
                                    View All →
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                                {related.map((item) => {
                                    const itemImage =
                                        item.images.find(
                                            (img) => img.is_primary,
                                        ) ||
                                        item.images[0] ||
                                        null;
                                    const itemPrice = cheapestPrice(
                                        item.variants,
                                    );
                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/products/${item.slug}`}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative mb-6 flex aspect-[4/5] items-center justify-center overflow-hidden bg-[#D4E8C8]">
                                                {itemImage ? (
                                                    <img
                                                        src={itemImage.url}
                                                        alt={
                                                            itemImage.alt_text ||
                                                            item.name
                                                        }
                                                        onError={onImageError}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <Package className="h-16 w-16 text-[#070E01]/15" />
                                                )}
                                                {item.brand && (
                                                    <div className="absolute top-4 left-4 bg-[#ECF3E5] px-3 py-1 text-[9px] font-bold tracking-widest text-[#070E01] uppercase">
                                                        {item.brand.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-start justify-between gap-4 border-b border-[#070E01]/10 pb-5">
                                                <div>
                                                    <h3 className="mb-1 font-serif text-xl text-[#070E01] transition-colors group-hover:text-[#2D5016]">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                        {item.category?.name ||
                                                            'Uncategorized'}
                                                    </p>
                                                </div>
                                                {itemPrice !== null && (
                                                    <p className="text-sm font-bold whitespace-nowrap text-[#070E01]">
                                                        From{' '}
                                                        {formatPrice(itemPrice)}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
