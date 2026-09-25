import { Head } from '@inertiajs/react';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />

            <div className="min-h-screen bg-[#ECF3E5]">
                {/* Hero */}
                <div className="px-6 pt-32 pb-20 md:px-12">
                    <div className="mx-auto max-w-[1920px]">
                        <div className="max-w-3xl">
                            <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] text-[#2D5016] uppercase">
                                Legal
                            </span>
                            <h1 className="mb-8 font-serif text-5xl tracking-tight text-[#070E01] md:text-7xl">
                                Privacy Policy
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
                                    1. Information We Collect
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    We collect information you provide directly,
                                    such as when you contact us via email or use
                                    our services. This may include your name,
                                    email address, and business information.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="font-serif text-2xl text-[#070E01]">
                                    2. How We Use Information
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    We use collected information to provide and
                                    improve our services, communicate with you,
                                    and fulfill orders. We do not sell your
                                    personal information to third parties.
                                </p>
                            </section>

                            <section className="space-y-6">
                                <h2 className="font-serif text-2xl text-[#070E01]">
                                    3. Contact
                                </h2>
                                <p className="text-sm leading-relaxed text-[#070E01]/60">
                                    For privacy-related questions, contact us at{' '}
                                    <span className="text-[#2D5016]">
                                        contact@danob.et
                                    </span>
                                    .
                                </p>
                            </section>

                            <div className="border-t border-[#070E01]/10 pt-8">
                                <p className="text-xs text-[#070E01]/30">
                                    This page will be updated with our complete
                                    privacy policy as our services develop.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
