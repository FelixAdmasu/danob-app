import { Head } from '@inertiajs/react';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service" />

            <div className="min-h-screen bg-[#ECF3E5]">
                {/* Hero */}
                <div className="px-6 pt-32 pb-20 md:px-12">
                    <div className="mx-auto max-w-[1920px]">
                        <div className="max-w-3xl">
                            <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] text-[#2D5016] uppercase">
                                Legal
                            </span>
                            <h1 className="mb-8 font-serif text-5xl tracking-tight text-[#070E01] md:text-7xl">
                                Terms of Service
                            </h1>
                            <div className="mb-8 h-[1px] w-16 bg-[#2D5016]" />
                            <p className="text-sm text-[#070E01]/50">
                                Last updated:{' '}
                                {new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-32 md:px-12">
                    <div className="mx-auto max-w-[1920px]">
                        <div className="max-w-3xl space-y-16">
                            <section className="space-y-6">
                                <h2 className="font-serif text-2xl text-[#070E01]">
                                    1. Overview
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    Danob Trading PLC (&quot;we,&quot;
                                    &quot;our,&quot; or &quot;us&quot;) provides
                                    bakery and pastry ingredient supply
                                    services. These terms govern your use of our
                                    website and services.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="font-serif text-2xl text-[#070E01]">
                                    2. Products &amp; Orders
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    Product information on this website is for
                                    reference only. Actual product availability,
                                    pricing, and specifications may vary. All
                                    orders are subject to confirmation and
                                    availability.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="font-serif text-2xl text-[#070E01]">
                                    3. Contact
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    For questions about these terms, please
                                    contact us at{' '}
                                    <span className="text-[#2D5016]">
                                        contact@danob.et
                                    </span>
                                    .
                                </p>
                            </section>

                            <div className="border-t border-[#070E01]/10 pt-8">
                                <p className="text-xs text-[#070E01]/30">
                                    This page will be updated with complete
                                    terms as our services develop.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
