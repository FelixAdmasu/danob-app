import { Head } from '@inertiajs/react';

export default function Contact() {
    return (
        <>
            <Head title="Contact" />

            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="flex flex-col lg:flex-row gap-24">
                        <div className="lg:w-1/2">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                — Inquire
                            </span>
                            <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-none tracking-tighter text-[#070E01] mb-12 italic">
                                Get in Touch.
                            </h1>
                            <p className="text-xl max-w-md text-[#4A4A4A] leading-relaxed mb-12">
                                Reach out for orders, inquiries, or to visit one of our branches.
                            </p>

                            <div className="space-y-6">
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-3">
                                        Phone
                                    </span>
                                    <p className="text-sm font-bold uppercase tracking-widest">Call us for orders and inquiries</p>
                                </div>
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-3">
                                        Email
                                    </span>
                                    <p className="text-sm font-bold uppercase tracking-widest">Send us a message anytime</p>
                                </div>
                                <div className="border-b border-[#070E01]/10 pb-6">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-3">
                                        Visit Us
                                    </span>
                                    <p className="text-sm font-bold uppercase tracking-widest">Find a branch near you</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 bg-white p-12 rounded-[16px] border border-[#070E01]/10">
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A]">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent outline-none font-serif text-xl placeholder:opacity-20"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A]">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full bg-transparent outline-none font-serif text-xl placeholder:opacity-20"
                                            placeholder="email@address.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A]">
                                        Interest
                                    </label>
                                    <select className="w-full bg-transparent outline-none font-serif text-xl appearance-none cursor-pointer">
                                        <option>Product Inquiry</option>
                                        <option>Branch Visit</option>
                                        <option>Wholesale Order</option>
                                        <option>Partnership</option>
                                    </select>
                                </div>
                                <div className="space-y-2 border-b border-[#070E01]/20 pb-2">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A]">
                                        Message
                                    </label>
                                    <textarea
                                        className="w-full bg-transparent outline-none font-serif text-xl h-32 resize-none placeholder:opacity-20"
                                        placeholder="Tell us what you need..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="w-full py-6 bg-[#070E01] text-[#ECF3E5] text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-[#5B21B6] transition-colors duration-500"
                                >
                                    Submit Inquiry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
