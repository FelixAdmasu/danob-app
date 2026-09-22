import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import * as ProductRoutes from '@/routes/admin/products';

type Variant = {
    id: number;
    name: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    public_price: string | null;
    is_active: boolean;
};

type Image = {
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
    images: Image[];
};

type Props = {
    product: Product;
};

export default function Show({ product }: Props) {
    return (
        <>
            <Head title={product.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title={product.name} description={`Slug: ${product.slug}`} />
                    <div className="flex gap-2">
                        <Link href={ProductRoutes.edit(product.id).url}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        <Link href={ProductRoutes.index().url}>
                            <Button variant="ghost">Back</Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Name</p>
                            <p className="font-medium">{product.name}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Slug</p>
                            <p className="font-mono text-sm">{product.slug}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Category</p>
                            <p>{product.category?.name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Brand</p>
                            <p>{product.brand?.name || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Description</p>
                            <p className="text-sm leading-relaxed">{product.description}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{product.status}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Variants ({product.variants.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {product.variants.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No variants.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b text-xs uppercase tracking-widest text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-left">SKU</th>
                                            <th className="px-3 py-2 text-left">Unit</th>
                                            <th className="px-3 py-2 text-left">Qty</th>
                                            <th className="px-3 py-2 text-left">Price</th>
                                            <th className="px-3 py-2 text-left">Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.variants.map((v) => (
                                            <tr key={v.id} className="border-b">
                                                <td className="px-3 py-2 font-medium">{v.name}</td>
                                                <td className="px-3 py-2 font-mono text-xs">{v.sku || '—'}</td>
                                                <td className="px-3 py-2">{v.unit || '—'}</td>
                                                <td className="px-3 py-2">{v.quantity}</td>
                                                <td className="px-3 py-2">{v.public_price ?? '—'}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant={v.is_active ? 'default' : 'secondary'}>
                                                        {v.is_active ? 'Yes' : 'No'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Images ({product.images.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {product.images.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No images.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-3">
                                {product.images
                                    .slice()
                                    .sort((a, b) => a.sort_order - b.sort_order)
                                    .map((img) => (
                                        <div key={img.id} className="rounded-lg border overflow-hidden">
                                            <div className="aspect-square bg-muted">
                                                <img src={img.url} alt={img.alt_text || product.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <p className="text-xs font-mono truncate">{img.url}</p>
                                                <div className="flex gap-2 text-xs">
                                                    <Badge variant={img.is_primary ? 'default' : 'outline'}>
                                                        {img.is_primary ? 'Primary' : `Order ${img.sort_order}`}
                                                    </Badge>
                                                    {img.alt_text && <span className="text-muted-foreground">{img.alt_text}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Products', href: ProductRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
