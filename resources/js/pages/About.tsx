import { Head } from '@inertiajs/react';

export default function About() {
    return (
        <>
            <Head title="About" />

            {/* Hero */}
            <section className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10 px-6 md:px-12">
                    <div className="max-w-[1000px] mb-12">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                            — Our Narrative
                        </span>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] tracking-tighter text-[#070E01] max-w-4xl">
                            About Danob.
                        </h1>
                    </div>
                </div>
            </section>

            {/* About Content — Dark section */}
            <section className="py-48 px-6 md:px-12 bg-[#070E01] text-[#ECF3E5] overflow-hidden">
                <div className="max-w-[1920px] mx-auto relative">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                        <span className="text-[20vw] font-serif tracking-tighter leading-none italic select-none">
                            Danob
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-12">
                                — Our Narrative
                            </span>
                            <h2 className="font-serif text-4xl md:text-7xl leading-[1.1] tracking-tighter mb-12">
                                Building a legacy of quality ingredients.
                            </h2>
                            <div className="space-y-8 max-w-xl">
                                <p className="text-lg leading-relaxed font-light opacity-80">
                                    Danob Trading PLC supplies bakery and pastry ingredients. From cake mixes and
                                    chocolate to cream powders and baking tools — we stock the products your
                                    business needs so you can focus on baking.
                                </p>
                                <p className="text-lg leading-relaxed font-light opacity-80">
                                    Serving professional bakeries, pastry businesses, and home-based bakers
                                    across the country with reliable service and quality products.
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="space-y-12">
                                <div className="border-b border-white/10 pb-8">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-6">
                                        Our Mission
                                    </span>
                                    <h3 className="font-serif text-3xl mb-4">Quality First</h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        To provide bakeries and pastry businesses with quality ingredients and reliable service.
                                    </p>
                                </div>
                                <div className="border-b border-white/10 pb-8">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-6">
                                        Our Products
                                    </span>
                                    <h3 className="font-serif text-3xl mb-4">Everything You Need</h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        A range of cake mixes, chocolates, cream powders, baking tools, and more.
                                    </p>
                                </div>
                                <div className="pb-8">
                                    <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#A5FFA9] mb-6">
                                        Our Customers
                                    </span>
                                    <h3 className="font-serif text-3xl mb-4">For Every Baker</h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        Serving professional bakeries, pastry businesses, and home-based bakers.
                                    </p>
                                </div>
                                <div className="pt-8 flex items-center gap-12">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Products
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">150+</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Branches
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">3</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Brands
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">6</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
