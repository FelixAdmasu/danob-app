import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as SupplierRoutes from '@/routes/admin/suppliers';

type Supplier = { id: number; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; tax_number: string | null; notes: string | null; is_active: boolean; created_at: string; updated_at: string; purchase_orders_count?: number };

export default function Show({ supplier }: { supplier: Supplier }) {
    return (
        <>
            <Head title={supplier.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title={supplier.name} description={`Supplier detail`} />
                    <div className="flex gap-2">
                        <Link href={SupplierRoutes.edit(supplier.id).url}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        <Link href={SupplierRoutes.index().url}>
                            <Button variant="ghost">Back</Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Name</p>
                            <p className="font-medium">{supplier.name}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Contact</p>
                            <p>{supplier.contact_person || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Phone</p>
                            <p>{supplier.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
                            <p>{supplier.email || '—'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Address</p>
                            <p className="text-sm">{supplier.address || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tax Number</p>
                            <p>{supplier.tax_number || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                            <Badge variant={supplier.is_active ? 'success' : 'secondary'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Notes</p>
                            <p className="text-sm">{supplier.notes || '—'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchasing Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Purchase history will appear here once purchase orders are implemented (Phase 14).</p>
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
