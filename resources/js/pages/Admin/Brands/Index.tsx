import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Index() {
    return (
        <>
            <Head title="Brands" />
            <div className="p-6">
                <Heading title="Brands" description="Manage brands" />
                <p className="text-sm text-muted-foreground mt-4">Brand list placeholder.</p>
            </div>
        </>
    );
}
