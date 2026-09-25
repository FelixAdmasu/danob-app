import { Head } from '@inertiajs/react';

export default function Contact() {
    return (
        <>
            <Head title="Contact" />

            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="flex flex-col gap-24 lg:flex-row">
                        <div className="lg:w-1/2">
                            <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                — Inquire
                            </span>
                            <h1 className="mb-12 font-serif text-4xl leading-none tracking-tighter text-[#070E01] italic md:text-5xl lg:text-7xl">
                                Get in Touch.
                            </h1>
                            <p className="mb-12 max-w-md text-xl leading-relaxed text-[#4A4A4A]">
                                Reach out for orders, inquiries, or to visit one
                                of our branches.
                            </p>

                            <div className="space-y-6">
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="mb-3 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Phone
                                    </span>
                                    <p className="text-sm font-bold tracking-widest uppercase">
                                        Call us for orders and inquiries
                                    </p>
                                </div>
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="mb-3 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Email
                                    </span>
                                    <p className="text-sm font-bold tracking-widest uppercase">
                                        Send us a message anytime
                                    </p>
                                </div>
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="mb-3 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Visit Us
                                    </span>
                                    <p className="text-sm font-bold tracking-widest uppercase">
                                        Find a branch near you
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[16px] border border-[#070E01]/10 bg-white p-12 lg:w-1/2">
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                        <label className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                        <label className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                                            placeholder="email@address.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                    <label className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        Interest
                                    </label>
                                    <select className="w-full cursor-pointer appearance-none bg-transparent font-serif text-xl outline-none">
                                        <option>Product Inquiry</option>
                                        <option>Branch Visit</option>
                                        <option>Wholesale Order</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>
                                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                    <label className="text-[9px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                        Message
                                    </label>
                                    <textarea
                                        className="h-32 w-full resize-none bg-transparent font-serif text-xl outline-none placeholder:opacity-20"
                                        placeholder="Tell us what you need..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="w-full bg-[#070E01] py-6 text-[10px] font-bold tracking-[0.5em] text-[#ECF3E5] uppercase transition-colors duration-500 hover:bg-[#2D5016]"
                                >
                                    Submit Inquiry
                                </button>
                                <p className="mt-4 text-center text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                    Inquiry form coming soon — contact us by
                                    phone or email for now.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
