import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { name: string; slug: string } | null;
    brand: { name: string; slug: string } | null;
    images: { id: number; url: string; sort_order: number; is_primary: boolean; alt_text: string | null }[];
};

type Branch = {
    id: number;
    name: string;
    address: string;
    city: string;
    sub_city: string | null;
    kebele: string | null;
    phone: string | null;
    opening_hours: string | null;
    services: string | null;
};

type Props = {
    featuredProducts: Product[];
    categories: Category[];
    brands: Brand[];
    branches: Branch[];
};

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-on-scroll-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        );

        el.querySelectorAll('[data-animation-on-scroll]').forEach((child) => {
            child.classList.add('animate-on-scroll-hidden');
            observer.observe(child);
        });

        return () => observer.disconnect();
    }, []);

    return ref;
}

export default function Home({ featuredProducts, categories, brands, branches }: Props) {
    const heroRef = useScrollReveal();
    const categoriesRef = useScrollReveal();
    const productsRef = useScrollReveal();
    const aboutRef = useScrollReveal();
    const howToOrderRef = useScrollReveal();
    const brandsRef = useScrollReveal();
    const branchesRef = useScrollReveal();
    const contactRef = useScrollReveal();

    const totalProducts = categories.reduce((sum, c) => sum + c.products_count, 0);

    return (
        <>
            <Head title="Home" />

            {/* Hero */}
            <section ref={heroRef} className="relative bg-[#ECF3E5] pt-32 md:pt-48 overflow-hidden">
                {/* Vertical trail line */}
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10">
                    <div className="px-6 md:px-12">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-24">
                            <div className="max-w-[1000px]" data-animation-on-scroll>
                                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                    — Danob Trading PLC
                                </span>
                                <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl leading-[1.1] tracking-tighter text-[#070E01] max-w-4xl">
                                    Everything Your Bakery Needs, All in One Place.
                                </h1>
                            </div>

                            <div className="lg:self-end mb-12 lg:mb-32" data-animation-on-scroll>
                                <a
                                    href="#categories"
                                    className="w-32 h-32 rounded-full border border-[#070E01]/20 flex items-center justify-center text-[#070E01] transition-all duration-500 hover:bg-[#070E01] hover:text-[#ECF3E5] group relative"
                                >
                                    <span className="text-[9px] font-bold tracking-[0.3em] text-center uppercase px-4">
                                        Begin Exploration
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Marquee */}
                    <div className="border-y border-[#070E01]/10 py-6 mb-0 overflow-hidden whitespace-nowrap flex">
                        <div className="flex animate-marquee">
                            <div className="flex items-center gap-20 px-10">
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Cake Mixes</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Chocolate</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Cream Powders</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Baking Tools</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                            </div>
                            <div className="flex items-center gap-20 px-10">
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Cake Mixes</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Chocolate</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Cream Powders</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                                <span className="text-sm font-bold uppercase tracking-[0.5em]">Baking Tools</span>
                                <span className="w-1.5 h-1.5 bg-[#070E01] rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Hero image — neutral placeholder */}
                    <div className="relative w-full" data-animation-on-scroll>
                        <div className="w-full h-[600px] md:h-[850px] bg-gradient-to-br from-[#D4E8C8] via-[#ECF3E5] to-[#A5FFA9]/20 flex items-center justify-center">
                            <span className="font-serif text-[#070E01]/10 text-7xl md:text-9xl italic tracking-tighter select-none">Danob</span>
                        </div>
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 bg-[#ECF3E5] max-w-lg hidden md:block">
                            <p className="text-xs font-medium uppercase tracking-widest text-[#4A4A4A] mb-4">
                                Trail Entry 01 // The Foundation
                            </p>
                            <p className="text-lg font-serif leading-relaxed italic text-[#070E01]">
                                "From cake mixes and chocolate to cream powders and baking tools — Danob supplies bakery and pastry ingredients for your business."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section id="categories" ref={categoriesRef} className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                <div className="max-w-[1920px] mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24" data-animation-on-scroll>
                        <div className="max-w-2xl">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                — The Curation
                            </span>
                            <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-[#070E01]">
                                Shop by Category.
                            </h2>
                        </div>
                        <div className="md:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#070E01] mb-2">
                                Total Products
                            </p>
                            <p className="font-serif text-3xl md:text-5xl text-[#070E01]">
                                {totalProducts}
                            </p>
                        </div>
                    </div>

                    {categories.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#070E01]/10 bg-white/50 p-12 text-center">
                            <p className="font-serif text-xl text-[#070E01]">No categories yet</p>
                            <p className="mt-2 text-sm text-[#4A4A4A]">Categories will appear here once added in Admin → Categories.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">
                            {categories.map((category, i) => (
                                <Link
                                    key={category.id}
                                    href={`/products?category=${category.slug}`}
                                    className="group cursor-pointer"
                                    data-animation-on-scroll
                                >
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5] flex items-center justify-center">
                                        <span className="font-serif text-[#070E01]/10 text-5xl italic select-none">{category.name.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
                                        <div className="absolute top-6 left-6 px-3 py-1 bg-[#ECF3E5] text-[#070E01] text-[9px] font-bold uppercase tracking-widest">
                                            {category.products_count} Products
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="font-serif text-2xl mb-2">{category.name}</h3>
                                            {category.description && (
                                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A] line-clamp-2">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section id="products" ref={productsRef} className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                    <div className="max-w-[1920px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24" data-animation-on-scroll>
                            <div className="max-w-2xl">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                    — Popular Items
                                </span>
                                <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-[#070E01]">
                                    Featured Products.
                                </h2>
                            </div>
                            <Link
                                href="/products"
                                className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#070E01] hover:text-[#2D5016] transition-colors"
                            >
                                View All →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {featuredProducts.map((product, i) => {
                                const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0] || null;
                                return (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className="group cursor-pointer"
                                    data-animation-on-scroll
                                >
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5] flex items-center justify-center">
                                        {primaryImage ? (
                                            <img
                                                src={primaryImage.url}
                                                alt={primaryImage.alt_text || product.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="font-serif text-[#070E01]/10 text-5xl italic select-none">{product.name.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
                                        )}
                                        {product.brand && (
                                            <div className="absolute top-6 left-6 px-3 py-1 bg-[#ECF3E5] text-[#070E01] text-[9px] font-bold uppercase tracking-widest">
                                                {product.brand.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="font-serif text-2xl mb-2">{product.name}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">
                                                {product.category?.name || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* About */}
            <section id="about" ref={aboutRef} className="py-48 px-6 md:px-12 bg-[#070E01] text-[#ECF3E5] overflow-hidden">
                <div className="max-w-[1920px] mx-auto relative">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                        <span className="text-[20vw] font-serif tracking-tighter leading-none italic select-none">
                            Danob
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div data-animation-on-scroll>
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
                                <div className="pt-8 flex items-center gap-12">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Products
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">{totalProducts}+</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Branches
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">{branches.length}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A5FFA9] mb-2">
                                            Brands
                                        </span>
                                        <span className="text-2xl font-serif tracking-widest italic">{brands.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative" data-animation-on-scroll>
                            <div className="rounded-[16px] overflow-hidden border border-white/10">
                                <div className="w-full h-[500px] bg-gradient-to-br from-[#D4E8C8] to-[#070E01] flex items-center justify-center">
                                    <span className="font-serif text-[#ECF3E5]/10 text-8xl italic select-none">Danob</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services / How It Works */}
            <section id="how-to-order" ref={howToOrderRef} className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                <div className="max-w-[1920px] mx-auto">
                    <div className="text-center mb-32" data-animation-on-scroll>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                            — The Process
                        </span>
                        <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-[#070E01]">
                            How to Order.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 border-t border-[#070E01]/10">
                        {[
                            {
                                num: '01',
                                title: 'Browse Products',
                                description: 'Explore our range of bakery and pastry ingredients. Filter by category or brand.',
                            },
                            {
                                num: '02',
                                title: 'Contact a Branch',
                                description: 'Reach out to your nearest Danob branch by phone or visit in person.',
                            },
                            {
                                num: '03',
                                title: 'Place Order',
                                description: 'Confirm your order with our staff. We accept orders for pickup at any branch.',
                            },
                            {
                                num: '04',
                                title: 'Receive Order',
                                description: 'Pick up your order from the branch at your convenience.',
                            },
                        ].map((step, i) => (
                            <div
                                key={step.num}
                                className="p-12 border-b md:border-b-0 md:border-r border-[#070E01]/10 group hover:bg-[#070E01] transition-colors duration-500 last:border-r-0"
                                data-animation-on-scroll
                            >
                                <span className="block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] group-hover:text-[#4A4A4A] mb-12">
                                    {step.num} // Step
                                </span>
                                <h3 className="font-serif text-3xl mb-8 group-hover:text-[#ECF3E5]">{step.title}</h3>
                                <p className="text-sm leading-relaxed opacity-60 group-hover:text-[#ECF3E5] group-hover:opacity-100">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Brands */}
            {brands.length > 0 && (
                <section id="brands" ref={brandsRef} className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                    <div className="max-w-[1920px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24" data-animation-on-scroll>
                            <div className="max-w-2xl">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                    — Partners
                                </span>
                                <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-[#070E01]">
                                    Trusted Brands.
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {brands.map((brand, i) => (
                                <Link
                                    key={brand.id}
                                    href={`/brands/${brand.slug}`}
                                    className="group cursor-pointer"
                                    data-animation-on-scroll
                                >
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5] flex items-center justify-center">
                                        <span className="font-serif text-[#070E01]/10 text-5xl italic select-none">{brand.name.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
                                    </div>
                                    <div className="flex justify-between items-start border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="font-serif text-2xl mb-2">{brand.name}</h3>
                                            {brand.description && (
                                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A] line-clamp-2">
                                                    {brand.description}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-bold text-sm text-[#070E01]">{brand.products_count} Products</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Branches */}
            {branches.length > 0 && (
                <section id="branches" ref={branchesRef} className="py-32 md:py-48 px-6 md:px-12 bg-[#ECF3E5]">
                    <div className="max-w-[1920px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24" data-animation-on-scroll>
                            <div className="max-w-2xl">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                    — Locations
                                </span>
                                <h2 className="font-serif text-4xl md:text-6xl tracking-tighter text-[#070E01]">
                                    Our Branches.
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                            {branches.map((branch) => (
                                <div key={branch.id} className="group" data-animation-on-scroll>
                                    <div className="aspect-[4/5] overflow-hidden mb-8 relative bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5] flex items-center justify-center">
                                        <MapPin className="w-12 h-12 text-[#070E01]/10" strokeWidth={1} />
                                    </div>
                                    <div className="border-b border-[#070E01]/10 pb-6">
                                        <h3 className="font-serif text-2xl mb-4">{branch.name}</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-3 text-[11px] text-[#4A4A4A]">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                <span>
                                                    {branch.address}
                                                    {branch.city ? `, ${branch.city}` : ''}
                                                </span>
                                            </div>
                                            {branch.phone && (
                                                <div className="flex items-center gap-3 text-[11px] text-[#4A4A4A]">
                                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            )}
                                            {branch.opening_hours && (
                                                <div className="flex items-center gap-3 text-[11px] text-[#4A4A4A]">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span>{branch.opening_hours}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" ref={contactRef} className="py-32 md:py-64 px-6 md:px-12 bg-[#ECF3E5] border-t border-[#070E01]/10 relative overflow-hidden">
                <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-[#070E01]/10 hidden md:block">
                    <div className="absolute w-full h-16 bg-[#A5FFA9]/60 blur-sm animate-trail" />
                </div>

                <div className="max-w-[1920px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row gap-24">
                        <div className="lg:w-1/2" data-animation-on-scroll>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-[#4A4A4A] mb-8">
                                — Inquire
                            </span>
                            <h2 className="font-serif text-4xl md:text-7xl leading-none tracking-tighter text-[#070E01] mb-12 italic">
                                Get in Touch.
                            </h2>
                            <p className="text-xl max-w-md text-[#4A4A4A] leading-relaxed mb-12">
                                Reach out for orders, inquiries, or to visit one of our branches.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="w-2 h-2 bg-[#A5FFA9] rotate-45" />
                                    <p className="text-sm font-bold uppercase tracking-widest">For Orders &amp; Inquiries</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="w-2 h-2 bg-[#A5FFA9] rotate-45" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Visit Any Branch</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 bg-white p-12 rounded-[16px] border border-[#070E01]/10" data-animation-on-scroll>
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
                                    className="w-full py-6 bg-[#070E01] text-[#ECF3E5] text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-[#2D5016] transition-colors duration-500"
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
