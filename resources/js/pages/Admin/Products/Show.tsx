import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Pencil } from 'lucide-react';
import * as ProductRoutes from '@/routes/admin/products';
import { onImageError } from '@/lib/image-fallback';

type Variant = {
    id: number;
    name: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    low_stock_threshold: number | null;
    stock_status: string;
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
                    <Heading eyebrow="Catalog" title={product.name} description={`Slug: ${product.slug}`} />
                    <div className="flex gap-2">
                        <Link href={ProductRoutes.edit(product.id).url}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </Link>
                        <Link href={ProductRoutes.index().url}>
                            <Button variant="ghost">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
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
                            <StatusBadge status={product.status} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Variants ({product.variants.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {product.variants.length === 0 ? (
                                    <TableEmpty colSpan={6}>No variants.</TableEmpty>
                                ) : (
                                    product.variants.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.name}</TableCell>
                                            <TableCell className="font-mono">{v.sku || '—'}</TableCell>
                                            <TableCell>{v.unit || '—'}</TableCell>
                                            <TableCell>
                                                <span className={v.is_active && v.stock_status !== 'in_stock' ? 'text-red-600 dark:text-red-400 font-bold' : ''}>{v.quantity}</span>
                                                {v.is_active && v.stock_status === 'low_stock' && <Badge variant="destructive" className="ml-2 text-[10px]">Low</Badge>}
                                                {v.is_active && v.stock_status === 'out_of_stock' && <Badge variant="destructive" className="ml-2 text-[10px]">Out</Badge>}
                                                <div className="text-[10px] text-muted-foreground">Threshold: {v.low_stock_threshold ?? '—'}</div>
                                            </TableCell>
                                            <TableCell>{v.public_price ?? '—'}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={v.is_active ? 'active' : 'inactive'} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
                                        <div key={img.id} className="overflow-hidden rounded-2xl ring-1 ring-border">
                                            <div className="aspect-square bg-muted">
                                                <img src={img.url} alt={img.alt_text || product.name} onError={onImageError} className="h-full w-full object-cover" />
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Products', href: ProductRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
