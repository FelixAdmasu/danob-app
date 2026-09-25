import { Link, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
    Package,
    Cake,
    Cookie,
    Milk,
    Wheat,
    ChevronDown,
    ArrowRight,
} from 'lucide-react';

type Props = {
    children: ReactNode;
};

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
};

const sectionLinks = [
    { label: 'About', href: '#about', page: '/about' },
    { label: 'How to Order', href: '#how-to-order', page: '/how-to-order' },
    { label: 'Brands', href: '#brands', page: '/brands' },
    { label: 'Branches', href: '#branches', page: '/branches' },
    { label: 'Contact', href: '#contact', page: '/contact' },
];

function getCategoryIcon(slug: string) {
    const iconMap: Record<string, typeof Cake> = {
        'cake-mixes': Cake,
        'chocolate-cocoa': Cookie,
        'baking-powders-improvers': Milk,
        'yeast-fermentation': Wheat,
        'custards-cream-products': Milk,
        'gelatin-gelling-products': Cookie,
        'ice-cream-mixes': Cake,
        flavours: Cookie,
        'food-colors': Wheat,
        fondant: Cookie,
        'food-sprays': Package,
        'baking-cups': Package,
        'cake-decoration': Cookie,
        'cake-tools': Package,
        'cake-molds': Package,
    };
    return iconMap[slug] || Package;
}

export default function PublicLayout({ children }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [productsPanelOpen, setProductsPanelOpen] = useState(false);
    const productsTriggerRef = useRef<HTMLDivElement>(null);
    const { url } = usePage();
    const isHome = url === '/' || url === '';
    const { props } = usePage<{
        categories?: Category[];
        auth?: { user?: { name?: string } | null };
    }>();
    const categories = props.categories ?? [];
    const isAuthenticated = !!props.auth?.user;

    // Track scroll position for header background
    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 20);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Products dropdown — hover trigger with slight delay to prevent flickering
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleProductsEnter() {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setProductsPanelOpen(true);
    }

    function handleProductsLeave() {
        hoverTimeout.current = setTimeout(() => {
            setProductsPanelOpen(false);
        }, 150);
    }

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                productsTriggerRef.current &&
                !productsTriggerRef.current.contains(e.target as Node)
            ) {
                setProductsPanelOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-[#ECF3E5]">
            {/* Header — Watershed + Vanguard Estates hybrid */}
            <div
                ref={productsTriggerRef}
                className="sticky top-0 right-0 left-0 z-[70]"
            >
                <header
                    className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${
                        scrolled
                            ? 'bg-[#ECF3E5]/95 shadow-[0_1px_0_0_rgba(7,14,1,0.1)] backdrop-blur-md'
                            : 'bg-[#ECF3E5] shadow-sm'
                    } `}
                >
                    {/* Top Bar (Always Visible) */}
                    <nav className="mx-auto flex max-w-[1920px] items-center justify-between px-6 py-8 md:px-12">
                        <Link
                            href="/"
                            className="font-serif text-xl font-bold tracking-widest text-[#070E01] uppercase transition-colors hover:text-[#2D5016] md:text-2xl"
                        >
                            Danob.
                        </Link>

                        <div className="hidden items-center gap-12 md:flex">
                            {/* Products Trigger — Watershed style */}
                            <div
                                className="group relative flex h-full cursor-pointer items-center"
                                onMouseEnter={handleProductsEnter}
                                onMouseLeave={handleProductsLeave}
                            >
                                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.4em] text-[#070E01] uppercase transition-colors group-hover:text-[#2D5016]">
                                    Products
                                    <ChevronDown
                                        className={`h-3 w-3 transition-transform duration-300 ${productsPanelOpen ? 'rotate-180' : ''}`}
                                    />
                                </span>
                            </div>

                            {sectionLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={
                                        isHome
                                            ? link.href
                                            : `/${link.page === '/' ? '' : link.page.replace(/^\//, '')}${link.href}`
                                    }
                                    className="text-[10px] font-bold tracking-[0.4em] text-[#070E01] uppercase transition-colors hover:text-[#2D5016]"
                                    onClick={(e) => {
                                        if (isHome) {
                                            e.preventDefault();
                                            document
                                                .querySelector(link.href)
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                });
                                        }
                                    }}
                                >
                                    {link.label}
                                </a>
                            ))}
                            {isAuthenticated ? (
                                <Link
                                    href="/admin"
                                    className="rounded-full border border-[#2D5016]/20 px-3 py-1 text-[10px] font-bold tracking-[0.4em] text-[#2D5016] uppercase transition-colors hover:text-[#1A3A0A]"
                                >
                                    Dashboard →
                                </Link>
                            ) : null}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            className="relative z-[80] flex min-h-[24px] min-w-[48px] items-center justify-center text-[#070E01] focus:outline-none md:hidden"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle Menu"
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase transition-all duration-300">
                                {mobileOpen ? 'Close' : 'Menu'}
                            </span>
                        </button>
                    </nav>

                    {/* Watershed-style Expansion Panel */}
                    <div
                        className={`w-full overflow-hidden bg-[#ECF3E5] transition-all duration-500 ease-in-out ${productsPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} `}
                        onMouseEnter={handleProductsEnter}
                        onMouseLeave={handleProductsLeave}
                    >
                        <div className="mx-auto max-w-[1920px] px-6 pb-12 md:px-12">
                            {/* Separator */}
                            <div className="mb-10 h-px w-full bg-[#070E01]/10" />

                            <div className="grid grid-cols-12 gap-12">
                                {/* Categories Grid — left side */}
                                <div className="col-span-5 grid grid-cols-2 gap-x-8 gap-y-4">
                                    {categories.map((cat) => {
                                        const Icon = getCategoryIcon(cat.slug);
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/products?category=${cat.slug}`}
                                                className="group/link flex flex-col gap-2 rounded-[16px] p-4 transition-colors hover:bg-[#D4E8C8]"
                                                onClick={() =>
                                                    setProductsPanelOpen(false)
                                                }
                                            >
                                                <div className="mb-1 text-[#2D5016]">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="text-[15px] font-bold text-[#070E01]">
                                                    {cat.name}
                                                </div>
                                                <div className="text-xs text-[#070E01]/60">
                                                    {cat.products_count} items
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Vertical divider */}
                                <div className="col-span-1 mx-auto h-full w-px bg-[#070E01]/10" />

                                {/* Featured Card — right side */}
                                <div className="col-span-6 flex items-center">
                                    <div className="group/card relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-[#070E01] p-10 text-[#ECF3E5] shadow-xl">
                                        <div className="relative z-10 flex-1">
                                            <div className="mb-6 flex items-center gap-2">
                                                <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-widest uppercase">
                                                    All Categories
                                                </span>
                                            </div>
                                            <h4 className="mb-8 max-w-sm font-serif text-[44px] leading-[1.1] font-light">
                                                Premium bakery{' '}
                                                <span className="italic opacity-80">
                                                    ingredients
                                                </span>{' '}
                                                for your business.
                                            </h4>
                                            <Link
                                                href="/products"
                                                className="inline-flex items-center gap-3 text-[14px] font-bold transition-all group-hover/card:gap-5"
                                                onClick={() =>
                                                    setProductsPanelOpen(false)
                                                }
                                            >
                                                Browse all products{' '}
                                                <ArrowRight className="h-5 w-5" />
                                            </Link>
                                        </div>
                                        {/* Abstract Background Decor */}
                                        <div className="absolute right-[-10%] bottom-[-20%] h-[300px] w-[300px] rounded-full bg-white/5 blur-3xl transition-transform duration-700 group-hover/card:scale-110" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#070E01] p-6 transition-all duration-500">
                    <div className="absolute top-8 left-6">
                        <Link
                            href="/"
                            className="font-serif text-xl font-bold tracking-widest text-[#ECF3E5] uppercase"
                            onClick={() => setMobileOpen(false)}
                        >
                            Danob.
                        </Link>
                    </div>
                    <nav className="flex flex-col gap-10 text-center">
                        {/* Mobile Products Dropdown */}
                        <div>
                            <button
                                type="button"
                                className="mx-auto flex items-center gap-3 font-serif text-3xl text-[#ECF3E5] italic transition-colors hover:text-[#A5FFA9]"
                                onClick={() =>
                                    setMobileProductsOpen(!mobileProductsOpen)
                                }
                            >
                                Products
                                <ChevronDown
                                    className={`h-5 w-5 transition-transform duration-200 ${mobileProductsOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {mobileProductsOpen && (
                                <div className="mt-6 flex flex-col gap-5">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/products?category=${cat.slug}`}
                                            className="text-lg text-[#ECF3E5]/60 transition-colors hover:text-[#A5FFA9]"
                                            onClick={() => {
                                                setMobileOpen(false);
                                                setMobileProductsOpen(false);
                                            }}
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {sectionLinks.map((link) =>
                            isHome ? (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="font-serif text-3xl text-[#ECF3E5] italic transition-colors hover:text-[#A5FFA9]"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.label}
                                    href={link.page}
                                    className="font-serif text-3xl text-[#ECF3E5] italic transition-colors hover:text-[#A5FFA9]"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ),
                        )}
                        {isAuthenticated && (
                            <Link
                                href="/admin"
                                className="font-serif text-3xl text-[#A5FFA9] italic transition-colors hover:text-white"
                                onClick={() => setMobileOpen(false)}
                            >
                                Dashboard →
                            </Link>
                        )}
                    </nav>
                    <div className="absolute bottom-12 text-[9px] font-bold tracking-[0.5em] text-[#ECF3E5] uppercase opacity-40">
                        Addis Ababa // Bahir Dar
                    </div>
                </div>
            )}

            <main className="flex-1">{children}</main>

            {/* Footer — Vanguard Estates style */}
            <footer className="border-t border-[#ECF3E5]/10 bg-[#070E01] px-6 pt-32 pb-12 text-[#ECF3E5] md:px-12">
                <div className="mx-auto max-w-[1920px]">
                    <div className="mb-24 grid grid-cols-1 gap-16 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <h2 className="mb-8 font-serif text-4xl tracking-tighter md:text-6xl">
                                Let's supply your next order.
                            </h2>
                            <div className="flex gap-4">
                                <div className="mt-4 h-[1px] w-12 bg-[#A5FFA9]" />
                                <p className="max-w-xs text-sm font-medium opacity-60">
                                    Premium bakery and pastry ingredients from
                                    trusted brands, delivered through our branch
                                    network.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <span className="block text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
                                Navigation
                            </span>
                            <ul className="space-y-4 text-sm font-bold tracking-widest uppercase">
                                <li>
                                    <Link
                                        href="/products"
                                        className="transition-colors hover:text-[#A5FFA9]"
                                    >
                                        Products
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/brands"
                                        className="transition-colors hover:text-[#A5FFA9]"
                                    >
                                        Brands
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/about"
                                        className="transition-colors hover:text-[#A5FFA9]"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="transition-colors hover:text-[#A5FFA9]"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <span className="block text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
                                Contact
                            </span>
                            <ul className="space-y-4 text-sm font-bold tracking-widest uppercase">
                                <li>Addis Ababa</li>
                                <li>Bahir Dar</li>
                                <li>contact@danob.et</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-12 md:flex-row">
                        <p className="text-[9px] font-bold tracking-[0.5em] uppercase opacity-40">
                            &copy; {new Date().getFullYear()} Danob Trading PLC.
                            All Rights Reserved.
                        </p>
                        <div className="flex gap-12 text-[9px] font-bold tracking-[0.5em] uppercase opacity-40">
                            <Link
                                href="/terms"
                                className="transition-all hover:text-[#A5FFA9] hover:opacity-100"
                            >
                                Terms
                            </Link>
                            <Link
                                href="/privacy"
                                className="transition-all hover:text-[#A5FFA9] hover:opacity-100"
                            >
                                Privacy
                            </Link>
                            {isAuthenticated ? (
                                <Link
                                    href="/admin"
                                    className="transition-all hover:text-[#A5FFA9] hover:opacity-100"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="transition-all hover:text-[#A5FFA9] hover:opacity-100"
                                >
                                    Staff Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
