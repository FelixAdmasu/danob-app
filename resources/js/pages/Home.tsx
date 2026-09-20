import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Package, Truck, HeartHandshake, ChevronRight } from 'lucide-react';

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
};

type Props = {
    featuredProducts: Product[];
    categories: Category[];
    brands: Brand[];
};

const categoryColors: Record<string, string> = {
    'cake-mixes': 'bg-amber-50 text-amber-700 border-amber-200',
    'chocolate-cocoa': 'bg-stone-100 text-stone-700 border-stone-300',
    'baking-powders-improvers': 'bg-sky-50 text-sky-700 border-sky-200',
    'yeast-fermentation': 'bg-orange-50 text-orange-700 border-orange-200',
    'custards-cream-products': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'gelatin-gelling-products': 'bg-rose-50 text-rose-700 border-rose-200',
    'ice-cream-mixes': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    flavours: 'bg-violet-50 text-violet-700 border-violet-200',
    'food-colors': 'bg-pink-50 text-pink-700 border-pink-200',
    fondant: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'food-sprays': 'bg-lime-50 text-lime-700 border-lime-200',
    'baking-cups': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'cake-decoration': 'bg-purple-50 text-purple-700 border-purple-200',
    'cake-tools': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'cake-molds': 'bg-teal-50 text-teal-700 border-teal-200',
};

export default function Home({ featuredProducts, categories, brands }: Props) {
    return (
        <>
            <Head title="Home" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-neutral-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(120,80,40,0.15),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(200,150,80,0.1),_transparent_50%)]" />
                <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:px-8 lg:py-36">
                    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/50 px-4 py-1.5 text-xs font-medium text-neutral-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Bakery and Pastry Ingredients
                            </div>
                            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Everything Your Bakery
                                <span className="block text-amber-400">
                                    Needs, All in One Place
                                </span>
                            </h1>
                            <p className="max-w-lg text-lg leading-relaxed text-neutral-400">
                                From cake mixes and chocolate to cream powders
                                and baking tools — Danob supplies bakery and
                                pastry ingredients for your business.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                                >
                                    Explore Products
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/how-to-order"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-600 px-6 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white"
                                >
                                    How to Order
                                </Link>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="grid grid-cols-2 gap-4">
                                {categories.slice(0, 4).map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-5 backdrop-blur-sm transition-colors hover:border-neutral-600 hover:bg-neutral-800"
                                    >
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700/50">
                                            <Package className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-white">
                                            {cat.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-neutral-400">
                                            {cat.products_count}{' '}
                                            {cat.products_count === 1
                                                ? 'product'
                                                : 'products'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                            Shop by Category
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
                            Discover our range of bakery and pastry ingredients,
                            organized for easy browsing.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/products?category=${category.slug}`}
                                className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md"
                            >
                                <div
                                    className={`mb-4 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${categoryColors[category.slug] || 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}
                                >
                                    {category.name}
                                </div>
                                {category.description && (
                                    <p className="text-sm text-neutral-500 line-clamp-2">
                                        {category.description}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center text-xs font-medium text-neutral-400 group-hover:text-neutral-600">
                                    {category.products_count}{' '}
                                    {category.products_count === 1
                                        ? 'product'
                                        : 'products'}
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                        >
                            View All Categories
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section className="bg-neutral-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                                    Featured Products
                                </h2>
                                <p className="mt-3 text-base text-neutral-500">
                                    Explore some of our most popular bakery
                                    ingredients.
                                </p>
                            </div>
                            <Link
                                href="/products"
                                className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 sm:inline-flex sm:items-center sm:gap-2"
                            >
                                View All
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md"
                                >
                                    <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-neutral-100">
                                        <Package className="h-12 w-12 text-neutral-300" />
                                    </div>
                                    <div className="space-y-2">
                                        {product.brand && (
                                            <span className="text-xs font-medium text-neutral-400">
                                                {product.brand.name}
                                            </span>
                                        )}
                                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-amber-700">
                                            {product.name}
                                        </h3>
                                        {product.category && (
                                            <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
                                                {product.category.name}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-8 text-center sm:hidden">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600"
                            >
                                View All Products
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Why Danob */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                            Why Danob
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
                            We are focused on providing bakery and pastry
                            businesses with the ingredients they need.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: Package,
                                title: 'Product Selection',
                                description:
                                    'A range of bakery and pastry products from various brands.',
                            },
                            {
                                icon: Truck,
                                title: 'Branch Locations',
                                description:
                                    'Multiple branch locations to serve customers.',
                            },
                            {
                                icon: HeartHandshake,
                                title: 'For Every Baker',
                                description:
                                    'Serving professional bakeries, pastry businesses, and home-based bakers.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="rounded-xl border border-neutral-200 p-8"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900">
                                    <item.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted Brands */}
            {brands.length > 0 && (
                <section className="bg-neutral-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                                Trusted Brands
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
                                Browse the brands available through Danob.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {brands.map((brand) => (
                                <Link
                                    key={brand.id}
                                    href={`/brands/${brand.slug}`}
                                    className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-300 hover:shadow-md"
                                >
                                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-amber-700">
                                        {brand.name}
                                    </h3>
                                    {brand.description && (
                                        <p className="mt-2 text-sm text-neutral-500 line-clamp-2">
                                            {brand.description}
                                        </p>
                                    )}
                                    <div className="mt-4 flex items-center text-xs font-medium text-neutral-400 group-hover:text-neutral-600">
                                        {brand.products_count}{' '}
                                        {brand.products_count === 1
                                            ? 'product'
                                            : 'products'}
                                        <ChevronRight className="ml-1 h-3 w-3" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/brands"
                                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                            >
                                View All Brands
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* How to Order CTA */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 lg:px-8">
                    <div className="rounded-2xl bg-neutral-900 px-8 py-12 text-center sm:px-12 sm:py-16">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to Order?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-base text-neutral-400">
                            Learn how easy it is to place an order with Danob.
                            Browse our products and get in touch with your nearest
                            branch.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/how-to-order"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                            >
                                How to Order
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/branches"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-600 px-6 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white"
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
