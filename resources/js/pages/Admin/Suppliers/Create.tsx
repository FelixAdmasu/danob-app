import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as SupplierRoutes from '@/routes/admin/suppliers';

export default function Create() {
    const [data, setData] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', tax_number: '', notes: '', is_active: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(SupplierRoutes.store().url, data as never, {
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
            <Head title="Create Supplier" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading eyebrow="Operations" title="Create Supplier" description="Add a new supplier" />
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_person">Contact Person</Label>
                                    <Input id="contact_person" value={data.contact_person} onChange={(e) => setData({ ...data, contact_person: e.target.value })} />
                                    <InputError message={errors.contact_person} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <textarea id="address" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} rows={3} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    <InputError message={errors.address} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_number">Tax Number</Label>
                                    <Input id="tax_number" value={data.tax_number} onChange={(e) => setData({ ...data, tax_number: e.target.value })} />
                                    <InputError message={errors.tax_number} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <textarea id="notes" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} rows={3} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Create Supplier
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

Create.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Suppliers', href: SupplierRoutes.index().url },
        { title: 'Create', href: SupplierRoutes.create().url },
    ],
};
