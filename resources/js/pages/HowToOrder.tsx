import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function HowToOrder() {
    return (
        <>
            <Head title="How to Order" />
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">How to Order</h1>
                    <p className="mt-4 text-lg text-neutral-500">
                        Ordering from Danob is simple. Follow these steps to get started.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-4xl space-y-12">
                    <div className="flex gap-6">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">1</div>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">Browse Our Products</h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                Explore our range of bakery and pastry ingredients. Filter by category or brand to find what you need.
                            </p>
                            <Link href="/products" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
                                Browse Products <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">2</div>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">Contact Your Nearest Branch</h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                Once you know what you need, reach out to your nearest Danob branch by phone or visit in person.
                            </p>
                            <Link href="/branches" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
                                Find a Branch <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">3</div>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">Place Your Order</h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                Confirm your order with our staff. We accept orders for pickup at any of our branches.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">4</div>
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">Receive Your Order</h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                Pick up your order from the branch at your convenience.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 max-w-4xl rounded-2xl bg-neutral-900 px-8 py-12 text-center">
                    <h2 className="text-2xl font-bold text-white">Need Help?</h2>
                    <p className="mt-3 text-neutral-400">Contact us directly or visit one of our branches for assistance.</p>
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
                            Contact Us <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link href="/branches" className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-6 py-3 text-sm font-medium text-neutral-300 hover:border-neutral-400 hover:text-white">
                            Find a Branch
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
