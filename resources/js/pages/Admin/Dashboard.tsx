import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';

export default function Dashboard({ stats }: { stats: { products: number; categories: number; orders: number; customers: number } }) {
    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="p-6 space-y-6">
                <Heading title="Admin Dashboard" description="Overview" />
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{stats.products}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Categories</p>
                        <p className="text-2xl font-bold">{stats.categories}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Orders</p>
                        <p className="text-2xl font-bold">{stats.orders}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Customers</p>
                        <p className="text-2xl font-bold">{stats.customers}</p>
                    </div>
                </div>
            </div>
        </>
    );
}
