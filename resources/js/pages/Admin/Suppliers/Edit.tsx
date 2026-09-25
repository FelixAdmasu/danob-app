import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as SupplierRoutes from '@/routes/admin/suppliers';
import { Pencil } from 'lucide-react';

type Supplier = {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    tax_number: string | null;
    notes: string | null;
    is_active: boolean;
};

export default function Edit({ supplier }: { supplier: Supplier }) {
    const [data, setData] = useState({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        tax_number: supplier.tax_number || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put(SupplierRoutes.update(supplier.id).url, data as never, {
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
            <Head title={`Edit ${supplier.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Operations"
                    title={`Edit ${supplier.name}`}
                    description="Update supplier"
                />
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
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
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_person">
                                        Contact Person
                                    </Label>
                                    <Input
                                        id="contact_person"
                                        value={data.contact_person}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                contact_person: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError
                                        message={errors.contact_person}
                                    />
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
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                address: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="border-input bg-background focus-visible:border-primary/60 focus-visible:ring-primary/15 flex min-h-[60px] w-full rounded-lg border px-3.5 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-4"
                                    />
                                    <InputError message={errors.address} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_number">
                                        Tax Number
                                    </Label>
                                    <Input
                                        id="tax_number"
                                        value={data.tax_number}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                tax_number: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.tax_number} />
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
                                        id="is_active"
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                notes: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="border-input bg-background focus-visible:border-primary/60 focus-visible:ring-primary/15 flex min-h-[60px] w-full rounded-lg border px-3.5 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-4"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    <Pencil className="mr-2 h-4 w-4" /> Update
                                    Supplier
                                </Button>
                                <Link href={SupplierRoutes.index().url}>
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
        { title: 'Suppliers', href: SupplierRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
