import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';

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

            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <nav className="mb-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">
                        <Link href="/" className="hover:text-[#070E01] transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/brands" className="hover:text-[#070E01] transition-colors">Brands</Link>
                        <span>/</span>
                        <span className="text-[#070E01]">{brand.name}</span>
                    </nav>

                    <div className="max-w-[1000px] mb-16">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                            — Brand
                        </span>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] tracking-tighter text-[#070E01] max-w-4xl">
                            {brand.name}
                        </h1>
                        {brand.description && (
                            <p className="text-lg text-[#4A4A4A] mt-6 max-w-xl">
                                {brand.description}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                <div className="max-w-[1920px] mx-auto">
                    {brand.products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {brand.products.map((product) => (
                                <Link key={product.id} href={`/products/${product.slug}`} className="group cursor-pointer">
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-[#D4E8C8]">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-16 w-16 text-[#070E01]/15 group-hover:text-[#070E01]/30 transition-colors duration-700" />
                                        </div>
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
                            <h3 className="font-serif text-2xl text-[#070E01]">No products yet</h3>
                            <p className="text-sm text-[#4A4A4A] mt-2">Products from this brand will appear here once added.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
