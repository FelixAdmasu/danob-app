import { Head, Link } from '@inertiajs/react';

export default function HowToOrder() {
    return (
        <>
            <Head title="How to Order" />

            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="mx-auto mb-32 max-w-3xl text-center">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — The Process
                        </span>
                        <h1 className="font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            How to Order.
                        </h1>
                        <p className="mx-auto mt-6 max-w-xl text-lg text-[#4A4A4A]">
                            Ordering from Danob is simple. Follow these steps to
                            get started.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 border-t border-[#070E01]/10 md:grid-cols-4">
                        {[
                            {
                                num: '01',
                                title: 'Browse Products',
                                description:
                                    'Explore our range of bakery and pastry ingredients. Filter by category or brand to find what you need.',
                                link: '/products',
                                linkText: 'Browse Products',
                            },
                            {
                                num: '02',
                                title: 'Contact a Branch',
                                description:
                                    'Once you know what you need, reach out to your nearest Danob branch by phone or visit in person.',
                                link: '/branches',
                                linkText: 'Find a Branch',
                            },
                            {
                                num: '03',
                                title: 'Place Order',
                                description:
                                    'Confirm your order with our staff. We accept orders for pickup at any of our branches.',
                                link: null,
                                linkText: null,
                            },
                            {
                                num: '04',
                                title: 'Receive Order',
                                description:
                                    'Pick up your order from the branch at your convenience.',
                                link: null,
                                linkText: null,
                            },
                        ].map((step) => (
                            <div
                                key={step.num}
                                className="group border-b border-[#070E01]/10 p-12 transition-colors duration-500 last:border-r-0 hover:bg-[#070E01] md:border-r md:border-b-0"
                            >
                                <span className="mb-12 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase group-hover:text-[#A5FFA9]">
                                    {step.num} // Step
                                </span>
                                <h3 className="mb-8 font-serif text-3xl group-hover:text-[#ECF3E5]">
                                    {step.title}
                                </h3>
                                <p className="text-sm leading-relaxed opacity-60 group-hover:text-[#ECF3E5] group-hover:opacity-100">
                                    {step.description}
                                </p>
                                {step.link && (
                                    <Link
                                        href={step.link}
                                        className="mt-6 inline-block text-[10px] font-bold tracking-[0.3em] text-[#2D5016] uppercase transition-colors group-hover:text-[#A5FFA9]"
                                    >
                                        {step.linkText} →
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-32 bg-[#070E01] p-16 text-center text-[#ECF3E5]">
                        <h2 className="mb-6 font-serif text-3xl md:text-4xl">
                            Need Help?
                        </h2>
                        <p className="mx-auto mb-8 max-w-md text-sm text-white/60">
                            Contact us directly or visit one of our branches for
                            assistance.
                        </p>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Link
                                href="/contact"
                                className="bg-[#A5FFA9] px-8 py-4 text-[10px] font-bold tracking-[0.5em] text-[#070E01] uppercase transition-colors duration-500 hover:bg-[#2D5016] hover:text-white"
                            >
                                Contact Us
                            </Link>
                            <Link
                                href="/branches"
                                className="border border-white/20 px-8 py-4 text-[10px] font-bold tracking-[0.5em] text-white uppercase transition-colors duration-500 hover:bg-white/10"
                            >
                                Find a Branch
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
