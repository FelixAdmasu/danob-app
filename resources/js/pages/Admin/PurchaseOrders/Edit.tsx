import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import * as PurchaseOrderRoutes from '@/routes/admin/purchase-orders';

export default function Edit({ purchase_order }: { purchase_order: { id: number; po_number: string } }) {
    return (
        <>
            <Head title={`Edit ${purchase_order.po_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title={`Edit ${purchase_order.po_number}`} description="Only draft orders can be edited" />
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Editing not allowed for this status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={PurchaseOrderRoutes.show(purchase_order.id).url}>
                            <Button variant="outline">Back to Order</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Edit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Purchase Orders', href: PurchaseOrderRoutes.index().url },
        { title: 'Edit', href: '#' },
    ],
};
