import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Index() {
    return (
        <>
            <Head title="Branches" />
            <div className="p-6">
                <Heading title="Branches" description="Manage branches" />
                <p className="text-sm text-muted-foreground mt-4">Branch list placeholder.</p>
            </div>
        </>
    );
}
