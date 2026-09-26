import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as BranchRoutes from '@/routes/admin/branches';
import { Save } from 'lucide-react';

// Mirrors the update rule vocabulary (BranchController::update) — the only
// values the server will accept. Branch images are managed from the Index
// row action, so this form edits the branch record itself.
type Branch = {
    id: number;
    name: string;
    city: string;
    address: string;
    sub_city: string | null;
    kebele: string | null;
    phone: string | null;
    opening_hours: string | null;
    services: string | null;
    is_active: boolean;
};

export default function Edit({ branch }: { branch: Branch }) {
    const [data, setData] = useState({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        sub_city: branch.sub_city || '',
        kebele: branch.kebele || '',
        phone: branch.phone || '',
        opening_hours: branch.opening_hours || '',
        services: branch.services || '',
        is_active: branch.is_active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put(BranchRoutes.update(branch.id).url, data as never, {
            onError: (err) => {
                setErrors(err as Record<string, string>);
                setProcessing(false);
            },
            onSuccess: () => setProcessing(false),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Edit Branch" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Operations"
                    title="Edit Branch"
                    description="Update branch location and contact details."
                />
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Branch Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                city: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.city} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address *</Label>
                                    <Input
                                        id="address"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                address: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.address} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sub_city">Sub City</Label>
                                    <Input
                                        id="sub_city"
                                        value={data.sub_city}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                sub_city: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.sub_city} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kebele">Kebele</Label>
                                    <Input
                                        id="kebele"
                                        value={data.kebele}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                kebele: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.kebele} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                phone: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-border"
                                        id="is_active"
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="opening_hours">
                                        Opening Hours
                                    </Label>
                                    <textarea
                                        id="opening_hours"
                                        value={data.opening_hours}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                opening_hours: e.target.value,
                                            })
                                        }
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <InputError
                                        message={errors.opening_hours}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="services">Services</Label>
                                    <textarea
                                        id="services"
                                        value={data.services}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                services: e.target.value,
                                            })
                                        }
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <InputError message={errors.services} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Save
                                    Changes
                                </Button>
                                <Link href={BranchRoutes.index().url}>
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
        { title: 'Branches', href: BranchRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
