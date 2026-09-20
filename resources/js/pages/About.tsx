import { Head } from '@inertiajs/react';
import { Package, Users, Target } from 'lucide-react';

export default function About() {
    return (
        <>
            <Head title="About" />
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">About Danob</h1>
                    <p className="mt-4 text-lg text-neutral-500">
                        Danob Trading PLC supplies bakery and pastry ingredients.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <Target className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">Our Mission</h3>
                        <p className="mt-2 text-sm text-neutral-500">
                            To provide bakeries and pastry businesses with quality ingredients and reliable service.
                        </p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">Our Products</h3>
                        <p className="mt-2 text-sm text-neutral-500">
                            A range of cake mixes, chocolates, cream powders, baking tools, and more.
                        </p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">Our Customers</h3>
                        <p className="mt-2 text-sm text-neutral-500">
                            Serving professional bakeries, pastry businesses, and home-based bakers.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
