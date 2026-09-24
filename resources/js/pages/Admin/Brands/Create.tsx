import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Plus, Upload } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';
import * as BrandRoutes from '@/routes/admin/brands';

export default function Create() {
    const [data, setData] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
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
        setLogoPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug || data.name.toLowerCase().replace(/\s+/g, '-'));
        formData.append('description', data.description);
        formData.append('is_active', data.is_active ? '1' : '0');
        if (logoFile) formData.append('logo', logoFile);

        router.post(
            BrandRoutes.store().url,
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
            <Head title="Create Brand" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading eyebrow="Catalog" title="Create Brand" description="Add a new brand" />
                <Card className="max-w-3xl">
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
                                <Input id="slug" value={data.slug} onChange={(e) => setData({ ...data, slug: e.target.value })} placeholder="auto-generated if empty" />
                                <InputError message={errors.slug} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData({ ...data, description: e.target.value })}
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/15"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo" className="flex items-center gap-1.5">
                                    <Upload className="h-4 w-4" /> Upload Logo
                                </Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                                />
                                <InputError message={errors.logo} />
                                {logoPreview ? (
                                    <div className="h-32 w-full overflow-hidden rounded border">
                                        <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" onError={onImageError} />
                                    </div>
                                ) : (
                                    <div className="flex h-32 w-full items-center justify-center rounded border border-dashed bg-muted">
                                        <ImageIcon className="h-8 w-8 opacity-20" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData({ ...data, is_active: e.target.checked })} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    <Plus className="mr-2 h-4 w-4" /> Create
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

Create.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Brands', href: BrandRoutes.index().url },
        { title: 'Create', href: BrandRoutes.create().url },
    ],
};
