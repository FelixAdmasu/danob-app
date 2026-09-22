import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Index() {
    return (
        <>
            <Head title="Customers" />
            <div className="p-6">
                <Heading title="Customers" description="Manage customers" />
                <p className="text-sm text-muted-foreground mt-4">Customer list placeholder.</p>
            </div>
        </>
    );
}
