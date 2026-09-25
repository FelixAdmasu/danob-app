import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as SupplierRoutes from '@/routes/admin/suppliers';
import { ArrowLeft, Pencil } from 'lucide-react';

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
    created_at: string;
    updated_at: string;
    purchase_orders_count?: number;
};

export default function Show({ supplier }: { supplier: Supplier }) {
    return (
        <>
            <Head title={supplier.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        eyebrow="Operations"
                        title={supplier.name}
                        description={`Supplier detail`}
                    />
                    <div className="flex gap-2">
                        <Link href={SupplierRoutes.edit(supplier.id).url}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </Link>
                        <Link href={SupplierRoutes.index().url}>
                            <Button variant="ghost">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Name
                            </p>
                            <p className="font-medium">{supplier.name}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Contact
                            </p>
                            <p>{supplier.contact_person || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Phone
                            </p>
                            <p>{supplier.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Email
                            </p>
                            <p>{supplier.email || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Address
                            </p>
                            <p className="text-sm">{supplier.address || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Tax Number
                            </p>
                            <p>{supplier.tax_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Status
                            </p>
                            <Badge
                                variant={
                                    supplier.is_active ? 'success' : 'secondary'
                                }
                            >
                                {supplier.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-muted-foreground text-xs tracking-widest uppercase">
                                Notes
                            </p>
                            <p className="text-sm">{supplier.notes || '—'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchasing Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Purchase history will appear here once purchase
                            orders are implemented (Phase 14).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Suppliers', href: SupplierRoutes.index().url },
        { title: 'Details', href: '#' },
    ],
};
