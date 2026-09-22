import { Head, Link } from '@inertiajs/react';
import { Package, ArrowRight } from 'lucide-react';

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
    const primaryImage = product.images.find((img) => img.is_primary) || product.images[0];
    const activeVariants = product.variants.filter((v) => v.is_active);

    return (
        <>
            <Head title={product.name} />

            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <nav className="mb-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">
                        <Link href="/" className="hover:text-[#070E01] transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/products" className="hover:text-[#070E01] transition-colors">Products</Link>
                        <span>/</span>
                        <span className="text-[#070E01]">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div>
                            <div className="aspect-square overflow-hidden bg-[#D4E8C8] relative">
                                {primaryImage ? (
                                    <img src={primaryImage.url} alt={primaryImage.alt_text || product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
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
                                                img.id === primaryImage?.id ? 'ring-2 ring-[#2D5016]' : ''
                                            }`}
                                        >
                                            <img src={img.url} alt={img.alt_text || product.name} className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-10">
                            <div>
                                {product.brand && (
                                    <Link href={`/brands/${product.brand.slug}`} className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#2D5016] hover:text-[#1A3A0A] transition-colors">
                                        {product.brand.name}
                                    </Link>
                                )}
                                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tighter text-[#070E01] mt-3">
                                    {product.name}
                                </h1>
                                {product.category && (
                                    <span className="inline-block mt-4 text-[9px] font-bold uppercase tracking-widest bg-[#D4E8C8] px-3 py-1">
                                        {product.category.name}
                                    </span>
                                )}
                            </div>

                            <div className="border-b border-[#070E01]/10 pb-8">
                                <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-4">
                                    Description
                                </span>
                                <p className="text-base leading-relaxed text-[#4A4A4A]">
                                    {product.description}
                                </p>
                            </div>

                            {activeVariants.length > 0 && (
                                <div className="border-b border-[#070E01]/10 pb-8">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-4">
                                        Available Options
                                    </span>
                                    <div className="space-y-3">
                                        {activeVariants.map((variant) => (
                                            <div key={variant.id} className="flex items-center justify-between p-4 bg-white border border-[#070E01]/10">
                                                <div>
                                                    <h3 className="font-serif text-lg text-[#070E01]">{variant.name}</h3>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">{variant.unit}</p>
                                                    {variant.sku && (
                                                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#070E01]/40">SKU: {variant.sku}</p>
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
                                    className="inline-flex items-center gap-3 border border-[#070E01]/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#070E01] hover:bg-[#070E01] hover:text-[#ECF3E5] transition-colors duration-500"
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
