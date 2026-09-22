import { Head, Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { dashboard } from '@/routes';
import * as ProductRoutes from '@/routes/admin/products';

type Category = { id: number; name: string; slug: string };
type Brand = { id: number; name: string; slug: string };
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
    category_id: number;
    brand_id: number | null;
    category: Category | null;
    brand: Brand | null;
    variants: Variant[];
    images: Image[];
};

type Props = {
    product: Product;
    categories: Category[];
    brands: Brand[];
};

type VariantForm = {
    id?: number;
    name: string;
    sku: string;
    unit: string;
    quantity: string;
    public_price: string;
    is_active: boolean;
};

type ImageForm = {
    id?: number;
    url: string;
    alt_text: string;
    sort_order: string;
    is_primary: boolean;
};

export default function Edit({ product, categories, brands }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        slug: product.slug,
        category_id: String(product.category_id),
        brand_id: product.brand_id ? String(product.brand_id) : '',
        description: product.description,
        status: product.status,
        variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku || '',
            unit: v.unit || '',
            quantity: String(v.quantity),
            public_price: v.public_price || '',
            is_active: v.is_active,
        })) as VariantForm[],
        images: product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt_text: img.alt_text || '',
            sort_order: String(img.sort_order),
            is_primary: img.is_primary,
        })) as ImageForm[],
    });

    const addVariant = () => {
        setData('variants', [
            ...data.variants,
            { name: '', sku: '', unit: '', quantity: '1', public_price: '', is_active: true },
        ]);
    };

    const updateVariant = (idx: number, field: keyof VariantForm, value: string | boolean) => {
        const next = [...data.variants];
        (next[idx] as Record<string, unknown>)[field] = value;
        setData('variants', next);
    };

    const removeVariant = (idx: number) => {
        setData(
            'variants',
            data.variants.filter((_, i) => i !== idx),
        );
    };

    const addImage = () => {
        setData('images', [
            ...data.images,
            { url: '', alt_text: '', sort_order: String(data.images.length), is_primary: false },
        ]);
    };

    const updateImage = (idx: number, field: keyof ImageForm, value: string | boolean) => {
        const next = [...data.images];
        if (field === 'is_primary' && value === true) {
            next.forEach((img, i) => (img.is_primary = i === idx));
        } else {
            (next[idx] as Record<string, unknown>)[field] = value;
        }
        setData('images', next);
    };

    const removeImage = (idx: number) => {
        setData(
            'images',
            data.images.filter((_, i) => i !== idx),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            name: data.name,
            slug: data.slug,
            category_id: data.category_id ? Number(data.category_id) : null,
            brand_id: data.brand_id ? Number(data.brand_id) : null,
            description: data.description,
            status: data.status,
            variants: data.variants.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku || null,
                unit: v.unit || null,
                quantity: v.quantity ? Number(v.quantity) : 1,
                public_price: v.public_price || null,
                is_active: v.is_active,
            })),
            images: data.images.map((img, idx) => ({
                id: img.id,
                url: img.url,
                alt_text: img.alt_text || null,
                sort_order: img.sort_order ? Number(img.sort_order) : idx,
                is_primary: img.is_primary,
            })),
        };
        put(ProductRoutes.update(product.id).url, payload as never);
    };

    return (
        <>
            <Head title={`Edit ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title={`Edit ${product.name}`} description="Update product details" />
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} required />
                                    <InputError message={errors.slug} />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Select
                                        value={data.brand_id || 'none'}
                                        onValueChange={(v) => setData('brand_id', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No brand</SelectItem>
                                            {brands.map((b) => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.brand_id} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    required
                                    rows={4}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Variants</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                Add Variant
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.variants.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No variants.</p>
                            ) : (
                                data.variants.map((variant, idx) => (
                                    <div key={idx} className="rounded-lg border p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Variant {idx + 1}</span>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(idx)}>
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Name *</Label>
                                                <Input value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} />
                                                <InputError message={(errors as Record<string, string>)[`variants.${idx}.name`]} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>SKU</Label>
                                                <Input value={variant.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                                                <InputError message={(errors as Record<string, string>)[`variants.${idx}.sku`]} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Unit</Label>
                                                <Input value={variant.unit} onChange={(e) => updateVariant(idx, 'unit', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Quantity</Label>
                                                <Input type="number" value={variant.quantity} onChange={(e) => updateVariant(idx, 'quantity', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Public Price</Label>
                                                <Input value={variant.public_price} onChange={(e) => updateVariant(idx, 'public_price', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <Checkbox
                                                    checked={variant.is_active}
                                                    onCheckedChange={(v) => updateVariant(idx, 'is_active', v === true)}
                                                    id={`variant-active-${idx}`}
                                                />
                                                <Label htmlFor={`variant-active-${idx}`}>Active</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Images</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addImage}>
                                Add Image
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.images.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No images.</p>
                            ) : (
                                data.images.map((image, idx) => (
                                    <div key={idx} className="rounded-lg border p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Image {idx + 1}</span>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(idx)}>
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>URL / Path *</Label>
                                            <Input value={image.url} onChange={(e) => updateImage(idx, 'url', e.target.value)} />
                                            <InputError message={(errors as Record<string, string>)[`images.${idx}.url`]} />
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="space-y-1">
                                                <Label>Alt Text</Label>
                                                <Input value={image.alt_text} onChange={(e) => updateImage(idx, 'alt_text', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Sort Order</Label>
                                                <Input type="number" value={image.sort_order} onChange={(e) => updateImage(idx, 'sort_order', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <Checkbox
                                                    checked={image.is_primary}
                                                    onCheckedChange={(v) => updateImage(idx, 'is_primary', v === true)}
                                                    id={`image-primary-edit-${idx}`}
                                                />
                                                <Label htmlFor={`image-primary-edit-${idx}`}>Primary</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            Update Product
                        </Button>
                        <Link href={ProductRoutes.index().url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Products', href: ProductRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
