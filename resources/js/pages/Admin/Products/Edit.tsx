import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as ProductRoutes from '@/routes/admin/products';
import { Pencil, Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';

type Category = { id: number; name: string; slug: string };
type Brand = { id: number; name: string; slug: string };
type Variant = {
    id: number;
    name: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    low_stock_threshold: number | null;
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
    variants: Variant[];
    images: Image[];
};

type Props = { product: Product; categories: Category[]; brands: Brand[] };

type VariantForm = {
    id?: number;
    name: string;
    sku: string;
    unit: string;
    quantity: string;
    low_stock_threshold: string;
    public_price: string;
    is_active: boolean;
};
type ImageForm = {
    id?: number;
    url: string;
    file: File | null;
    preview: string | null;
    alt_text: string;
    sort_order: string;
    is_primary: boolean;
};

export default function Edit({ product, categories, brands }: Props) {
    const [data, setData] = useState({
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
            low_stock_threshold:
                v.low_stock_threshold == null
                    ? ''
                    : String(v.low_stock_threshold),
            public_price: v.public_price || '',
            is_active: v.is_active,
        })) as VariantForm[],
        images: product.images.map((img) => ({
            id: img.id,
            url: img.url,
            file: null as File | null,
            preview: img.url,
            alt_text: img.alt_text || '',
            sort_order: String(img.sort_order),
            is_primary: img.is_primary,
        })) as ImageForm[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const addVariant = () =>
        setData({
            ...data,
            variants: [
                ...data.variants,
                {
                    name: '',
                    sku: '',
                    unit: '',
                    quantity: '1',
                    low_stock_threshold: '',
                    public_price: '',
                    is_active: true,
                },
            ],
        });
    const updateVariant = (
        idx: number,
        field: keyof VariantForm,
        value: string | boolean,
    ) => {
        const next = [...data.variants];
        (next[idx] as Record<string, unknown>)[field] = value;
        setData({ ...data, variants: next });
    };
    const removeVariant = (idx: number) =>
        setData({
            ...data,
            variants: data.variants.filter((_, i) => i !== idx),
        });

    const addImage = () =>
        setData({
            ...data,
            images: [
                ...data.images,
                {
                    url: '',
                    file: null,
                    preview: null,
                    alt_text: '',
                    sort_order: String(data.images.length),
                    is_primary: false,
                },
            ],
        });
    const updateImage = (
        idx: number,
        field: keyof ImageForm,
        value: string | boolean | File | null,
    ) => {
        const next = [...data.images];
        if (field === 'is_primary' && value === true) {
            next.forEach((img, i) => (img.is_primary = i === idx));
        } else if (field === 'file' && value instanceof File) {
            const preview = URL.createObjectURL(value);
            if (next[idx].preview && next[idx].preview?.startsWith('blob:'))
                URL.revokeObjectURL(next[idx].preview!);
            next[idx].file = value;
            next[idx].preview = preview;
            next[idx].url = '';
        } else {
            (next[idx] as Record<string, unknown>)[field] = value;
        }
        setData({ ...data, images: next });
    };
    const removeImage = (idx: number) => {
        const img = data.images[idx];
        if (img.preview?.startsWith('blob:')) URL.revokeObjectURL(img.preview);
        setData({ ...data, images: data.images.filter((_, i) => i !== idx) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('category_id', data.category_id);
        if (data.brand_id) formData.append('brand_id', data.brand_id);
        formData.append('description', data.description);
        formData.append('status', data.status);
        data.variants.forEach((v, idx) => {
            if (v.id) formData.append(`variants[${idx}][id]`, String(v.id));
            formData.append(`variants[${idx}][name]`, v.name);
            if (v.sku) formData.append(`variants[${idx}][sku]`, v.sku);
            if (v.unit) formData.append(`variants[${idx}][unit]`, v.unit);
            formData.append(`variants[${idx}][quantity]`, v.quantity || '1');
            if (v.low_stock_threshold !== '')
                formData.append(
                    `variants[${idx}][low_stock_threshold]`,
                    v.low_stock_threshold,
                );
            if (v.public_price)
                formData.append(
                    `variants[${idx}][public_price]`,
                    v.public_price,
                );
            formData.append(
                `variants[${idx}][is_active]`,
                v.is_active ? '1' : '0',
            );
        });
        data.images.forEach((img, idx) => {
            if (img.id) formData.append(`images[${idx}][id]`, String(img.id));
            if (img.file) {
                formData.append(`images[${idx}][file]`, img.file);
            } else if (img.url) {
                formData.append(`images[${idx}][url]`, img.url);
            }
            formData.append(`images[${idx}][alt_text]`, img.alt_text || '');
            formData.append(
                `images[${idx}][sort_order]`,
                img.sort_order || String(idx),
            );
            formData.append(
                `images[${idx}][is_primary]`,
                img.is_primary ? '1' : '0',
            );
        });
        router.post(ProductRoutes.update(product.id).url, formData, {
            forceFormData: true,
            onError: (err: Record<string, string>) => {
                setErrors(err as Record<string, string>);
                setProcessing(false);
            },
            onSuccess: () => setProcessing(false),
            onFinish: () => setProcessing(false),
        } as never);
    };

    return (
        <>
            <Head title={`Edit ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Catalog"
                    title={`Edit ${product.name}`}
                    description="Update product details"
                />
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                name: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                slug: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                    <InputError message={errors.slug} />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(v) =>
                                            setData({ ...data, category_id: v })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                >
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
                                        onValueChange={(v) =>
                                            setData({
                                                ...data,
                                                brand_id: v === 'none' ? '' : v,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No brand
                                            </SelectItem>
                                            {brands.map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={String(b.id)}
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.brand_id} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description *
                                </Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData({
                                            ...data,
                                            description: e.target.value,
                                        })
                                    }
                                    required
                                    rows={4}
                                    className="border-input bg-background focus-visible:border-primary/60 focus-visible:ring-primary/15 flex min-h-[80px] w-full rounded-lg border px-3.5 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-4"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) =>
                                        setData({ ...data, status: v })
                                    }
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Variants</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addVariant}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Variant
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.variants.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    No variants.
                                </p>
                            ) : (
                                data.variants.map((variant, idx) => (
                                    <div
                                        key={idx}
                                        className="space-y-3 rounded-lg border p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Variant {idx + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeVariant(idx)
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Name *</Label>
                                                <Input
                                                    value={variant.name}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `variants.${idx}.name`
                                                        ]
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>SKU</Label>
                                                <Input
                                                    value={variant.sku}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'sku',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[`variants.${idx}.sku`]
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Unit</Label>
                                                <Input
                                                    value={variant.unit}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'unit',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Quantity</Label>
                                                <Input
                                                    type="number"
                                                    value={variant.quantity}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'quantity',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>
                                                    Low Stock Threshold
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={
                                                        variant.low_stock_threshold
                                                    }
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'low_stock_threshold',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Empty = monitoring off"
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `variants.${idx}.low_stock_threshold`
                                                        ]
                                                    }
                                                />
                                                <p className="text-muted-foreground text-[10px]">
                                                    Flag as low stock when
                                                    quantity is at or below this
                                                    value.
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Public Price</Label>
                                                <Input
                                                    value={variant.public_price}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'public_price',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={variant.is_active}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'is_active',
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id={`variant-active-${idx}`}
                                                />
                                                <Label
                                                    htmlFor={`variant-active-${idx}`}
                                                >
                                                    Active
                                                </Label>
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addImage}
                            >
                                <Upload className="mr-2 h-4 w-4" /> Add Image
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.images.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    No images. Upload JPG, PNG or WEBP (max
                                    5MB).
                                </p>
                            ) : (
                                data.images.map((image, idx) => (
                                    <div
                                        key={idx}
                                        className="space-y-3 rounded-lg border p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-sm font-medium">
                                                <ImageIcon className="h-4 w-4" />{' '}
                                                Image {idx + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeImage(idx)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="bg-muted h-32 w-full overflow-hidden rounded border">
                                            {image.preview ? (
                                                <img
                                                    src={image.preview}
                                                    alt={
                                                        image.alt_text ||
                                                        'Preview'
                                                    }
                                                    onError={onImageError}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : image.url ? (
                                                <img
                                                    src={image.url}
                                                    alt={
                                                        image.alt_text ||
                                                        'Preview'
                                                    }
                                                    className="h-full w-full object-cover"
                                                    onError={onImageError}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <ImageIcon className="h-8 w-8 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Upload Image</Label>
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0] ||
                                                        null;
                                                    if (file)
                                                        updateImage(
                                                            idx,
                                                            'file',
                                                            file,
                                                        );
                                                }}
                                            />
                                            <InputError
                                                message={
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[`images.${idx}.file`]
                                                }
                                            />
                                            {image.url && !image.file && (
                                                <p className="text-muted-foreground truncate text-xs">
                                                    Current: {image.url}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="space-y-1">
                                                <Label>Alt Text</Label>
                                                <Input
                                                    value={image.alt_text}
                                                    onChange={(e) =>
                                                        updateImage(
                                                            idx,
                                                            'alt_text',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Alt for accessibility"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Sort Order</Label>
                                                <Input
                                                    type="number"
                                                    value={image.sort_order}
                                                    onChange={(e) =>
                                                        updateImage(
                                                            idx,
                                                            'sort_order',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={image.is_primary}
                                                    onChange={(e) =>
                                                        updateImage(
                                                            idx,
                                                            'is_primary',
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id={`image-primary-edit-${idx}`}
                                                />
                                                <Label
                                                    htmlFor={`image-primary-edit-${idx}`}
                                                >
                                                    Primary
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            <Pencil className="mr-2 h-4 w-4" /> Update Product
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
        { title: 'Dashboard', href: '/admin' },
        { title: 'Products', href: ProductRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
