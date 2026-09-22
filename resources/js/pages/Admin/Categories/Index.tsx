import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Index() {
    return (
        <>
            <Head title="Categories" />
            <div className="p-6">
                <Heading title="Categories" description="Manage categories" />
                <p className="text-sm text-muted-foreground mt-4">Category list placeholder.</p>
            </div>
        </>
    );
}
