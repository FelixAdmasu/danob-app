import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';
import * as BrandRoutes from '@/routes/admin/brands';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    is_active: boolean;
};

type Props = {
    brand: Brand;
};

export default function Edit({ brand }: Props) {
    const [data, setData] = useState({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        is_active: brand.is_active,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(brand.logo_url);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Revoke stale object URLs whenever the preview changes or the page unmounts.
    useEffect(
        () => () => {
            if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        },
        [logoPreview],
    );

    const handleLogoChange = (file: File | null) => {
        setLogoFile(file);
        setLogoPreview(file ? URL.createObjectURL(file) : brand.logo_url);
        if (file) setRemoveLogo(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Multipart PUT bodies are not parsed by PHP: submit as POST with
        // _method appended to the FormData (mirrors Admin/Products/Edit).
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description);
        formData.append('is_active', data.is_active ? '1' : '0');
        if (logoFile) {
            formData.append('logo', logoFile);
        } else if (brand.logo_url && removeLogo) {
            formData.append('remove_logo', '1');
        }

        router.post(
            BrandRoutes.update(brand.id).url,
            formData,
            {
                forceFormData: true,
                onError: (err: Record<string, string>) => {
                    setErrors(err);
                    setProcessing(false);
                },
                onSuccess: () => setProcessing(false),
                onFinish: () => setProcessing(false),
            } as never,
        );
    };

    return (
        <>
            <Head title={`Edit ${brand.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title={`Edit ${brand.name}`} description="Update brand" />
                <Card>
                    <CardHeader>
                        <CardTitle>Brand Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="logo" className="flex items-center gap-1.5">
                                    <Upload className="h-4 w-4" /> {brand.logo_url ? 'Replace Logo' : 'Upload Logo'}
                                </Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                                />
                                <InputError message={errors.logo} />
                                <p className="text-xs text-muted-foreground">JPG, PNG or WEBP (max 5MB).</p>
                                {logoPreview ? (
                                    <div className="h-32 w-full overflow-hidden rounded border">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className={`h-full w-full object-cover ${removeLogo && !logoFile ? 'opacity-50' : ''}`}
                                            onError={onImageError}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-32 w-full items-center justify-center rounded border border-dashed bg-muted">
                                        <ImageIcon className="h-8 w-8 opacity-20" />
                                    </div>
                                )}
                                {brand.logo_url && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="remove_logo"
                                            checked={removeLogo}
                                            disabled={!!logoFile}
                                            onChange={(e) => setRemoveLogo(e.target.checked)}
                                        />
                                        <Label htmlFor="remove_logo">Remove logo</Label>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData({ ...data, is_active: e.target.checked })} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Update
                                </Button>
                                <Link href={BrandRoutes.index().url}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Brands', href: BrandRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
