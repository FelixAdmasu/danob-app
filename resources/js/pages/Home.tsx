import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { onImageError } from '@/lib/image-fallback';
import BranchVisual from '@/components/branch-visual';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    products_count: number;
};

type Brand = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    products_count: number;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: { name: string; slug: string } | null;
    brand: { name: string; slug: string } | null;
    images: {
        id: number;
        url: string;
        sort_order: number;
        is_primary: boolean;
        alt_text: string | null;
    }[];
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
    image_url: string | null;
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

export default function Home({
    featuredProducts,
    categories,
    brands,
    branches,
}: Props) {
    const heroRef = useScrollReveal();
    const categoriesRef = useScrollReveal();
    const productsRef = useScrollReveal();
    const aboutRef = useScrollReveal();
    const howToOrderRef = useScrollReveal();
    const brandsRef = useScrollReveal();
    const branchesRef = useScrollReveal();
    const contactRef = useScrollReveal();

    const totalProducts = categories.reduce(
        (sum, c) => sum + c.products_count,
        0,
    );

    return (
        <>
            <Head title="Home" />

            {/* Hero */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-[#ECF3E5] pt-32 md:pt-48"
            >
                {/* Vertical trail line */}
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px]">
                    <div className="px-6 md:px-12">
                        <div className="mb-24 flex flex-col items-start justify-between gap-12 lg:flex-row">
                            <div
                                className="max-w-[1000px]"
                                data-animation-on-scroll
                            >
                                <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    — Danob Trading PLC
                                </span>
                                <h1 className="max-w-4xl font-serif text-4xl leading-[1.1] tracking-tighter text-[#070E01] md:text-5xl lg:text-7xl">
                                    Everything Your Bakery Needs, All in One
                                    Place.
                                </h1>
                            </div>

                            <div
                                className="mb-12 lg:mb-32 lg:self-end"
                                data-animation-on-scroll
                            >
                                <a
                                    href="#categories"
                                    className="group relative flex h-32 w-32 items-center justify-center rounded-full border border-[#070E01]/20 text-[#070E01] transition-all duration-500 hover:bg-[#070E01] hover:text-[#ECF3E5]"
                                >
                                    <span className="px-4 text-center text-[9px] font-bold tracking-[0.3em] uppercase">
                                        Begin Exploration
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Marquee */}
                    <div className="mb-0 flex overflow-hidden border-y border-[#070E01]/10 py-6 whitespace-nowrap">
                        <div className="animate-marquee flex">
                            <div className="flex items-center gap-20 px-10">
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Cake Mixes
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Chocolate
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Cream Powders
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Baking Tools
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                            </div>
                            <div className="flex items-center gap-20 px-10">
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Cake Mixes
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Chocolate
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Cream Powders
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                                <span className="text-sm font-bold tracking-[0.5em] uppercase">
                                    Baking Tools
                                </span>
                                <span className="h-1.5 w-1.5 rotate-45 bg-[#070E01]" />
                            </div>
                        </div>
                    </div>

                    {/* Hero image — neutral placeholder */}
                    <div className="relative w-full" data-animation-on-scroll>
                        <div className="flex h-[600px] w-full items-center justify-center bg-gradient-to-br from-[#D4E8C8] via-[#ECF3E5] to-[#A5FFA9]/20 md:h-[850px]">
                            <span className="font-serif text-7xl tracking-tighter text-[#070E01]/10 italic select-none md:text-9xl">
                                Danob
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 hidden max-w-lg bg-[#ECF3E5] p-8 md:block md:p-12">
                            <p className="mb-4 text-xs font-medium tracking-widest text-[#4A4A4A] uppercase">
                                Trail Entry 01 // The Foundation
                            </p>
                            <p className="font-serif text-lg leading-relaxed text-[#070E01] italic">
                                "From cake mixes and chocolate to cream powders
                                and baking tools — Danob supplies bakery and
                                pastry ingredients for your business."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section
                id="categories"
                ref={categoriesRef}
                className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48"
            >
                <div className="mx-auto max-w-[1920px]">
                    <div
                        className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row"
                        data-animation-on-scroll
                    >
                        <div className="max-w-2xl">
                            <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                — The Curation
                            </span>
                            <h2 className="font-serif text-4xl tracking-tighter text-[#070E01] md:text-6xl">
                                Shop by Category.
                            </h2>
                        </div>
                        <div className="md:text-right">
                            <p className="mb-2 text-[10px] font-bold tracking-[0.3em] text-[#070E01] uppercase">
                                Total Products
                            </p>
                            <p className="font-serif text-3xl text-[#070E01] md:text-5xl">
                                {totalProducts}
                            </p>
                        </div>
                    </div>

                    {categories.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[#070E01]/10 bg-white/50 p-12 text-center">
                            <p className="font-serif text-xl text-[#070E01]">
                                No categories yet
                            </p>
                            <p className="mt-2 text-sm text-[#4A4A4A]">
                                Categories will appear here once added in Admin
                                → Categories.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-4">
                            {categories.map((category, _i) => (
                                <Link
                                    key={category.id}
                                    href={`/products?category=${category.slug}`}
                                    className="group cursor-pointer"
                                    data-animation-on-scroll
                                >
                                    <div className="relative mb-8 flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5]">
                                        {category.image_url ? (
                                            <img
                                                src={category.image_url}
                                                alt={category.name}
                                                onError={onImageError}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="font-serif text-5xl text-[#070E01]/10 italic select-none">
                                                {category.name
                                                    .split(' ')
                                                    .map((w) => w[0])
                                                    .join('')
                                                    .slice(0, 3)}
                                            </span>
                                        )}
                                        <div className="absolute top-6 left-6 bg-[#ECF3E5] px-3 py-1 text-[9px] font-bold tracking-widest text-[#070E01] uppercase">
                                            {category.products_count} Products
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="mb-2 font-serif text-2xl">
                                                {category.name}
                                            </h3>
                                            {category.description && (
                                                <p className="line-clamp-2 text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
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
                <section
                    id="products"
                    ref={productsRef}
                    className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48"
                >
                    <div className="mx-auto max-w-[1920px]">
                        <div
                            className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row"
                            data-animation-on-scroll
                        >
                            <div className="max-w-2xl">
                                <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    — Popular Items
                                </span>
                                <h2 className="font-serif text-4xl tracking-tighter text-[#070E01] md:text-6xl">
                                    Featured Products.
                                </h2>
                            </div>
                            <Link
                                href="/products"
                                className="text-[10px] font-bold tracking-[0.3em] text-[#070E01] uppercase transition-colors hover:text-[#2D5016]"
                            >
                                View All →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {featuredProducts.map((product, _i) => {
                                const primaryImage =
                                    product.images?.find(
                                        (img) => img.is_primary,
                                    ) ||
                                    product.images?.[0] ||
                                    null;
                                return (
                                    <Link
                                        key={product.id}
                                        href={`/products/${product.slug}`}
                                        className="group cursor-pointer"
                                        data-animation-on-scroll
                                    >
                                        <div className="relative mb-8 flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5]">
                                            {primaryImage ? (
                                                <img
                                                    src={primaryImage.url}
                                                    alt={
                                                        primaryImage.alt_text ||
                                                        product.name
                                                    }
                                                    onError={onImageError}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <span className="font-serif text-5xl text-[#070E01]/10 italic select-none">
                                                    {product.name
                                                        .split(' ')
                                                        .map((w) => w[0])
                                                        .join('')
                                                        .slice(0, 3)}
                                                </span>
                                            )}
                                            {product.brand && (
                                                <div className="absolute top-6 left-6 bg-[#ECF3E5] px-3 py-1 text-[9px] font-bold tracking-widest text-[#070E01] uppercase">
                                                    {product.brand.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-between border-b border-[#070E01]/10 pb-6">
                                            <div>
                                                <h3 className="mb-2 font-serif text-2xl">
                                                    {product.name}
                                                </h3>
                                                <p className="text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                    {product.category?.name ||
                                                        'Uncategorized'}
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
            <section
                id="about"
                ref={aboutRef}
                className="overflow-hidden bg-[#070E01] px-6 py-48 text-[#ECF3E5] md:px-12"
            >
                <div className="relative mx-auto max-w-[1920px]">
                    <div className="pointer-events-none absolute top-0 right-0 opacity-10">
                        <span className="font-serif text-[20vw] leading-none tracking-tighter italic select-none">
                            Danob
                        </span>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-24 lg:grid-cols-2">
                        <div data-animation-on-scroll>
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
                                            Branches
                                        </span>
                                        <span className="font-serif text-2xl tracking-widest italic">
                                            {branches.length}
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
                        <div className="relative" data-animation-on-scroll>
                            <div className="overflow-hidden rounded-[16px] border border-white/10">
                                <div className="flex h-[500px] w-full items-center justify-center bg-gradient-to-br from-[#D4E8C8] to-[#070E01]">
                                    <span className="font-serif text-8xl text-[#ECF3E5]/10 italic select-none">
                                        Danob
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services / How It Works */}
            <section
                id="how-to-order"
                ref={howToOrderRef}
                className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48"
            >
                <div className="mx-auto max-w-[1920px]">
                    <div className="mb-32 text-center" data-animation-on-scroll>
                        <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                            — The Process
                        </span>
                        <h2 className="font-serif text-4xl tracking-tighter text-[#070E01] md:text-6xl">
                            How to Order.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 border-t border-[#070E01]/10 md:grid-cols-4">
                        {[
                            {
                                num: '01',
                                title: 'Browse Products',
                                description:
                                    'Explore our range of bakery and pastry ingredients. Filter by category or brand.',
                            },
                            {
                                num: '02',
                                title: 'Contact a Branch',
                                description:
                                    'Reach out to your nearest Danob branch by phone or visit in person.',
                            },
                            {
                                num: '03',
                                title: 'Place Order',
                                description:
                                    'Confirm your order with our staff. We accept orders for pickup at any branch.',
                            },
                            {
                                num: '04',
                                title: 'Receive Order',
                                description:
                                    'Pick up your order from the branch at your convenience.',
                            },
                        ].map((step, _i) => (
                            <div
                                key={step.num}
                                className="group border-b border-[#070E01]/10 p-12 transition-colors duration-500 last:border-r-0 hover:bg-[#070E01] md:border-r md:border-b-0"
                                data-animation-on-scroll
                            >
                                <span className="mb-12 block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase group-hover:text-[#4A4A4A]">
                                    {step.num} // Step
                                </span>
                                <h3 className="mb-8 font-serif text-3xl group-hover:text-[#ECF3E5]">
                                    {step.title}
                                </h3>
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
                <section
                    id="brands"
                    ref={brandsRef}
                    className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48"
                >
                    <div className="mx-auto max-w-[1920px]">
                        <div
                            className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row"
                            data-animation-on-scroll
                        >
                            <div className="max-w-2xl">
                                <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    — Partners
                                </span>
                                <h2 className="font-serif text-4xl tracking-tighter text-[#070E01] md:text-6xl">
                                    Trusted Brands.
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {brands.map((brand, _i) => (
                                <Link
                                    key={brand.id}
                                    href={`/brands/${brand.slug}`}
                                    className="group cursor-pointer"
                                    data-animation-on-scroll
                                >
                                    <div className="relative mb-8 flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-[#D4E8C8] to-[#ECF3E5]">
                                        {brand.logo_url ? (
                                            <img
                                                src={brand.logo_url}
                                                alt={brand.name}
                                                onError={onImageError}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="font-serif text-5xl text-[#070E01]/10 italic select-none">
                                                {brand.name
                                                    .split(' ')
                                                    .map((w) => w[0])
                                                    .join('')
                                                    .slice(0, 3)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-start justify-between border-b border-[#070E01]/10 pb-6">
                                        <div>
                                            <h3 className="mb-2 font-serif text-2xl">
                                                {brand.name}
                                            </h3>
                                            {brand.description && (
                                                <p className="line-clamp-2 text-[10px] font-bold tracking-[0.3em] text-[#4A4A4A] uppercase">
                                                    {brand.description}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-[#070E01]">
                                            {brand.products_count} Products
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Branches */}
            {branches.length > 0 && (
                <section
                    id="branches"
                    ref={branchesRef}
                    className="bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-48"
                >
                    <div className="mx-auto max-w-[1920px]">
                        <div
                            className="mb-24 flex flex-col items-end justify-between gap-8 md:flex-row"
                            data-animation-on-scroll
                        >
                            <div className="max-w-2xl">
                                <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                    — Locations
                                </span>
                                <h2 className="font-serif text-4xl tracking-tighter text-[#070E01] md:text-6xl">
                                    Our Branches.
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                            {branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className="group"
                                    data-animation-on-scroll
                                >
                                    <div className="relative mb-8 aspect-[4/5] overflow-hidden">
                                        <BranchVisual
                                            name={branch.name}
                                            imageUrl={branch.image_url}
                                        />
                                    </div>
                                    <div className="border-b border-[#070E01]/10 pb-6">
                                        <h3 className="mb-4 font-serif text-2xl">
                                            {branch.name}
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-3 text-[11px] text-[#4A4A4A]">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                <span>
                                                    {branch.address}
                                                    {branch.city
                                                        ? `, ${branch.city}`
                                                        : ''}
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
                                                    <span>
                                                        {branch.opening_hours}
                                                    </span>
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
            <section
                id="contact"
                ref={contactRef}
                className="relative overflow-hidden border-t border-[#070E01]/10 bg-[#ECF3E5] px-6 py-32 md:px-12 md:py-64"
            >
                <div className="absolute top-0 bottom-0 left-6 hidden w-[1px] bg-[#070E01]/10 md:left-12 md:block">
                    <div className="animate-trail absolute h-16 w-full bg-[#A5FFA9]/60 blur-sm" />
                </div>

                <div className="relative z-10 mx-auto max-w-[1920px]">
                    <div className="flex flex-col gap-24 lg:flex-row">
                        <div className="lg:w-1/2" data-animation-on-scroll>
                            <span className="mb-8 inline-block text-[10px] font-bold tracking-[0.4em] text-[#4A4A4A] uppercase">
                                — Inquire
                            </span>
                            <h2 className="mb-12 font-serif text-4xl leading-none tracking-tighter text-[#070E01] italic md:text-7xl">
                                Get in Touch.
                            </h2>
                            <p className="mb-12 max-w-md text-xl leading-relaxed text-[#4A4A4A]">
                                Reach out for orders, inquiries, or to visit one
                                of our branches.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="h-2 w-2 rotate-45 bg-[#A5FFA9]" />
                                    <p className="text-sm font-bold tracking-widest uppercase">
                                        For Orders &amp; Inquiries
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="h-2 w-2 rotate-45 bg-[#A5FFA9]" />
                                    <p className="text-sm font-bold tracking-widest uppercase">
                                        Visit Any Branch
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="rounded-[16px] border border-[#070E01]/10 bg-white p-12 lg:w-1/2"
                            data-animation-on-scroll
                        >
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
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
