import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as CategoryRoutes from '@/routes/admin/categories';
import { onImageError } from '@/lib/image-fallback';
import { Image as ImageIcon, Upload } from 'lucide-react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    image_url: string | null;
};

type Props = {
    category: Category;
};

export default function Edit({ category }: Props) {
    const [data, setData] = useState({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        is_active: category.is_active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);

    const previewSrc = imageFile ? imagePreview : removeImage ? null : category.image_url;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description);
        formData.append('is_active', data.is_active ? '1' : '0');
        if (imageFile) {
            formData.append('image', imageFile);
        } else if (removeImage) {
            formData.append('remove_image', '1');
        }
        router.post(CategoryRoutes.update(category.id).url, formData, {
            forceFormData: true,
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
            },
            onSuccess: () => setProcessing(false),
            onFinish: () => setProcessing(false),
        } as never);
    };

    return (
        <>
            <Head title={`Edit ${category.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading eyebrow="Catalog" title={`Edit ${category.name}`} description="Update category" />
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="max-w-3xl">
                        <CardHeader>
                            <CardTitle>Category Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug *</Label>
                                <Input id="slug" value={data.slug} onChange={(e) => setData({ ...data, slug: e.target.value })} required />
                                <InputError message={errors.slug} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData({ ...data, is_active: e.target.checked })} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="max-w-3xl">
                        <CardHeader>
                            <CardTitle>Image</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {previewSrc ? (
                                <div className="h-32 w-full overflow-hidden rounded-md border border-border bg-muted">
                                    <img src={previewSrc} alt="Category image preview" className="h-full w-full object-cover" onError={onImageError} />
                                </div>
                            ) : (
                                <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-border bg-muted">
                                    <ImageIcon className="h-8 w-8 opacity-20" aria-hidden="true" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="image" className="flex items-center gap-1.5">
                                    <Upload className="h-4 w-4" aria-hidden="true" /> Upload Image
                                </Label>
                                <Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
                                <InputError message={errors.image} />
                                <p className="text-xs text-muted-foreground">JPG, PNG or WEBP up to 5MB. Uploading replaces the current image.</p>
                            </div>
                            {category.image_url && !imageFile && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="remove_image"
                                        checked={removeImage}
                                        onChange={(e) => setRemoveImage(e.target.checked)}
                                    />
                                    <Label htmlFor="remove_image">Remove image</Label>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            Update
                        </Button>
                        <Link href={CategoryRoutes.index().url}>
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
        { title: 'Categories', href: CategoryRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
