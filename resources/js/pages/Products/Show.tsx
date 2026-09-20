import { Head, Link } from '@inertiajs/react';
import { Package, ChevronRight } from 'lucide-react';

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
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
                    <Link href="/" className="hover:text-neutral-900">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/products" className="hover:text-neutral-900">Products</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-neutral-900">{product.name}</span>
                </nav>

                <div className="grid gap-12 lg:grid-cols-2">
                    <div>
                        <div className="flex aspect-square items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100">
                            {primaryImage ? (
                                <img src={primaryImage.url} alt={product.name} className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                                <Package className="h-32 w-32 text-neutral-300" />
                            )}
                        </div>
                        {product.images.length > 1 && (
                            <div className="mt-4 grid grid-cols-4 gap-3">
                                {product.images.map((img) => (
                                    <div key={img.id} className={`aspect-square overflow-hidden rounded-lg border bg-neutral-100 ${img.id === primaryImage?.id ? 'border-neutral-900' : 'border-neutral-200'}`}>
                                        <img src={img.url} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div>
                            {product.brand && (
                                <Link href={`/brands/${product.brand.slug}`} className="text-sm font-medium text-neutral-400 hover:text-neutral-600">{product.brand.name}</Link>
                            )}
                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{product.name}</h1>
                            {product.category && (
                                <div className="mt-3">
                                    <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">{product.category.name}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-neutral-900">Description</h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{product.description}</p>
                        </div>

                        {activeVariants.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-neutral-900">Available Options</h2>
                                <div className="mt-4 space-y-3">
                                    {activeVariants.map((variant) => (
                                        <div key={variant.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-neutral-900">{variant.name}</h3>
                                                <p className="text-xs text-neutral-500">{variant.unit}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Back to Products</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
