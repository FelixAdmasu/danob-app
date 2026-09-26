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
import * as CustomerRoutes from '@/routes/admin/customers';
import { Save } from 'lucide-react';

// Mirrors the update rule vocabulary (CustomerController) — the only values
// the server will accept.
const CUSTOMER_TYPES: Record<string, string> = {
    business: 'Business',
    home_business: 'Home Business',
    individual: 'Individual',
    other: 'Other',
};

type Customer = {
    id: number;
    type: string;
    company_name: string | null;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
};

export default function Edit({ customer }: { customer: Customer }) {
    const [data, setData] = useState({
        type: customer.type,
        company_name: customer.company_name || '',
        contact_name: customer.contact_name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
        is_active: customer.is_active,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.put(CustomerRoutes.update(customer.id).url, data as never, {
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
            <Head title="Edit Customer" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Sales"
                    title="Edit Customer"
                    description="Update customer account details"
                />
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(value) =>
                                            setData({ ...data, type: value })
                                        }
                                    >
                                        <SelectTrigger
                                            id="type"
                                            aria-label="Customer type"
                                        >
                                            <SelectValue placeholder="Select a customer type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CUSTOMER_TYPES).map(
                                                ([value, label]) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">
                                        Company Name
                                    </Label>
                                    <Input
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                company_name: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.company_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_name">
                                        Contact Name
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        value={data.contact_name}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                contact_name: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={errors.contact_name} />
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
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <InputError message={errors.address} />
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
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" /> Save
                                    Changes
                                </Button>
                                <Link href={CustomerRoutes.index().url}>
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
