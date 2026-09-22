import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Index() {
    return (
        <>
            <Head title="Orders" />
            <div className="p-6">
                <Heading title="Orders" description="Manage orders" />
                <p className="text-sm text-muted-foreground mt-4">Order list placeholder.</p>
            </div>
        </>
    );
}
