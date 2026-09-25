import { Head } from '@inertiajs/react';

type Category = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
};

type Props = {
    categories: Category[];
    brands: Brand[];
};

export default function About({ categories, brands }: Props) {
    const totalProducts = categories.reduce(
        (sum, c) => sum + c.products_count,
        0,
    );

    return (
        <>
            <Head title="About" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48">
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px] px-6 md:px-12">
                    <div className="mb-12 max-w-[1000px]">
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — Our Narrative
                        </span>
                        <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                            About Danob.
                        </h1>
                    </div>
                </div>
            </section>

            {/* About Content — Dark section */}
            <section className="overflow-hidden bg-[#070E01] px-6 py-48 text-[#ECF3E5] md:px-12">
                <div className="relative mx-auto max-w-[1920px]">
                    <div className="pointer-events-none absolute top-0 right-0 opacity-10">
                        <span className="font-serif text-[20vw] leading-none tracking-tighter italic select-none">
                            Danob
                        </span>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-24 lg:grid-cols-2">
                        <div>
                            <span className="mb-12 inline-block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                — Our Narrative
                            </span>
                            <h2 className="mb-12 font-serif text-4xl leading-[1.1] tracking-tighter md:text-7xl">
                                Building a legacy of quality ingredients.
                            </h2>
                            <div className="max-w-xl space-y-8">
                                <p className="text-lg leading-relaxed font-light opacity-80">
                                    Danob Trading PLC supplies bakery and pastry
                                    ingredients. From cake mixes and chocolate
                                    to cream powders and baking tools — we stock
                                    the products your business needs so you can
                                    focus on baking.
                                </p>
                                <p className="text-lg leading-relaxed font-light opacity-80">
                                    Serving professional bakeries, pastry
                                    businesses, and home-based bakers across the
                                    country with reliable service and quality
                                    products.
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="space-y-12">
                                <div className="border-b border-white/10 pb-8">
                                    <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Our Mission
                                    </span>
                                    <h3 className="mb-4 font-serif text-3xl">
                                        Quality First
                                    </h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        To provide bakeries and pastry
                                        businesses with quality ingredients and
                                        reliable service.
                                    </p>
                                </div>
                                <div className="border-b border-white/10 pb-8">
                                    <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Our Products
                                    </span>
                                    <h3 className="mb-4 font-serif text-3xl">
                                        Everything You Need
                                    </h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        A range of cake mixes, chocolates, cream
                                        powders, baking tools, and more.
                                    </p>
                                </div>
                                <div className="pb-8">
                                    <span className="mb-6 block text-[10px] font-bold tracking-[0.4em] text-[#A5FFA9] uppercase">
                                        Our Customers
                                    </span>
                                    <h3 className="mb-4 font-serif text-3xl">
                                        For Every Baker
                                    </h3>
                                    <p className="text-sm leading-relaxed opacity-60">
                                        Serving professional bakeries, pastry
                                        businesses, and home-based bakers.
                                    </p>
                                </div>
                                <div className="flex items-center gap-12 pt-8">
                                    <div className="flex flex-col">
                                        <span className="mb-2 text-[10px] font-bold tracking-widest text-[#A5FFA9] uppercase">
                                            Products
                                        </span>
                                        <span className="font-serif text-2xl tracking-widest italic">
                                            {totalProducts}+
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="mb-2 text-[10px] font-bold tracking-widest text-[#A5FFA9] uppercase">
                                            Brands
                                        </span>
                                        <span className="font-serif text-2xl tracking-widest italic">
                                            {brands.length}
                                        </span>
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
