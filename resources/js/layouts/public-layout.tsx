import { Link, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Package, Cake, Cookie, Milk, Wheat, ChevronDown, ArrowRight } from 'lucide-react';

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
        'flavours': Cookie,
        'food-colors': Wheat,
        'fondant': Cookie,
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
    const navRef = useRef<HTMLElement>(null);
    const { url } = usePage();
    const isHome = url === '/' || url === '';
    const { props } = usePage<{ categories?: Category[]; auth?: { user?: { name?: string } | null } }>();
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            <div ref={productsTriggerRef} className="sticky top-0 left-0 right-0 z-[70]">
                <header
                    className={`
                        w-full transition-all duration-500 ease-in-out overflow-hidden
                        ${scrolled
                            ? 'bg-[#ECF3E5]/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(7,14,1,0.1)]'
                            : 'bg-[#ECF3E5] shadow-sm'
                        }
                    `}
                >
                    {/* Top Bar (Always Visible) */}
                    <nav className="max-w-[1920px] mx-auto px-6 md:px-12 py-8 flex items-center justify-between">
                        <Link href="/" className="font-serif text-xl md:text-2xl font-bold tracking-widest uppercase text-[#070E01] hover:text-[#2D5016] transition-colors">
                            Danob.
                        </Link>

                        <div className="hidden md:flex items-center gap-12">
                            {/* Products Trigger — Watershed style */}
                            <div
                                className="relative h-full flex items-center cursor-pointer group"
                                onMouseEnter={handleProductsEnter}
                                onMouseLeave={handleProductsLeave}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#070E01] group-hover:text-[#2D5016] transition-colors flex items-center gap-1.5">
                                    Products
                                    <ChevronDown
                                        className={`w-3 h-3 transition-transform duration-300 ${productsPanelOpen ? 'rotate-180' : ''}`}
                                    />
                                </span>
                            </div>

                            {sectionLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={isHome ? link.href : `/${link.page === '/' ? '' : link.page.replace(/^\//, '')}${link.href}`}
                                    className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#070E01] hover:text-[#2D5016] transition-colors"
                                    onClick={(e) => {
                                        if (isHome) {
                                            e.preventDefault();
                                            document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    {link.label}
                                </a>
                            ))}
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#2D5016] hover:text-[#1A3A0A] transition-colors border border-[#2D5016]/20 px-3 py-1 rounded-full">
                                    Dashboard →
                                </Link>
                            ) : null}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            className="md:hidden text-[#070E01] relative z-[80] focus:outline-none flex items-center justify-center min-w-[48px] min-h-[24px]"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle Menu"
                        >
                            <span className="uppercase text-[10px] tracking-widest font-bold transition-all duration-300">
                                {mobileOpen ? 'Close' : 'Menu'}
                            </span>
                        </button>
                    </nav>

                    {/* Watershed-style Expansion Panel */}
                    <div
                        className={`
                            w-full transition-all duration-500 ease-in-out overflow-hidden bg-[#ECF3E5]
                            ${productsPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                        onMouseEnter={handleProductsEnter}
                        onMouseLeave={handleProductsLeave}
                    >
                        <div className="max-w-[1920px] mx-auto px-6 md:px-12 pb-12">
                            {/* Separator */}
                            <div className="w-full h-px bg-[#070E01]/10 mb-10" />

                            <div className="grid grid-cols-12 gap-12">
                                {/* Categories Grid — left side */}
                                <div className="col-span-5 grid grid-cols-2 gap-x-8 gap-y-4">
                                    {categories.map((cat) => {
                                        const Icon = getCategoryIcon(cat.slug);
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/products?category=${cat.slug}`}
                                                className="flex flex-col gap-2 p-4 rounded-[16px] hover:bg-[#D4E8C8] transition-colors group/link"
                                                onClick={() => setProductsPanelOpen(false)}
                                            >
                                                <div className="text-[#2D5016] mb-1">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="text-[15px] font-bold text-[#070E01]">{cat.name}</div>
                                                <div className="text-xs text-[#070E01]/60">{cat.products_count} items</div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Vertical divider */}
                                <div className="col-span-1 h-full w-px bg-[#070E01]/10 mx-auto" />

                                {/* Featured Card — right side */}
                                <div className="col-span-6 flex items-center">
                                    <div className="flex flex-col w-full h-full bg-[#070E01] rounded-[28px] p-10 text-[#ECF3E5] relative overflow-hidden group/card shadow-xl">
                                        <div className="relative z-10 flex-1">
                                            <div className="flex items-center gap-2 mb-6">
                                                <span className="px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold uppercase tracking-widest">
                                                    All Categories
                                                </span>
                                            </div>
                                            <h4 className="font-serif text-[44px] leading-[1.1] font-light mb-8 max-w-sm">
                                                Premium bakery <span className="italic opacity-80">ingredients</span> for your business.
                                            </h4>
                                            <Link
                                                href="/products"
                                                className="inline-flex items-center gap-3 text-[14px] font-bold group-hover/card:gap-5 transition-all"
                                                onClick={() => setProductsPanelOpen(false)}
                                            >
                                                Browse all products <ArrowRight className="w-5 h-5" />
                                            </Link>
                                        </div>
                                        {/* Abstract Background Decor */}
                                        <div className="absolute right-[-10%] bottom-[-20%] w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl transition-transform duration-700 group-hover/card:scale-110" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] bg-[#070E01] flex flex-col items-center justify-center p-6 transition-all duration-500">
                    <div className="absolute top-8 left-6">
                        <Link href="/" className="font-serif text-xl font-bold tracking-widest uppercase text-[#ECF3E5]" onClick={() => setMobileOpen(false)}>
                            Danob.
                        </Link>
                    </div>
                    <nav className="flex flex-col gap-10 text-center">
                        {/* Mobile Products Dropdown */}
                        <div>
                            <button
                                type="button"
                                className="text-3xl font-serif italic text-[#ECF3E5] hover:text-[#A5FFA9] transition-colors flex items-center gap-3 mx-auto"
                                onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                            >
                                Products
                                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileProductsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {mobileProductsOpen && (
                                <div className="mt-6 flex flex-col gap-5">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/products?category=${cat.slug}`}
                                            className="text-lg text-[#ECF3E5]/60 hover:text-[#A5FFA9] transition-colors"
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
                                    className="text-3xl font-serif italic text-[#ECF3E5] hover:text-[#A5FFA9] transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.label}
                                    href={link.page}
                                    className="text-3xl font-serif italic text-[#ECF3E5] hover:text-[#A5FFA9] transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                        {isAuthenticated && (
                            <Link
                                href="/dashboard"
                                className="text-3xl font-serif italic text-[#A5FFA9] hover:text-white transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                Dashboard →
                            </Link>
                        )}
                    </nav>
                    <div className="absolute bottom-12 text-[9px] font-bold uppercase tracking-[0.5em] text-[#ECF3E5] opacity-40">
                        Addis Ababa // Bahir Dar
                    </div>
                </div>
            )}

            <main className="flex-1">{children}</main>

            {/* Footer — Vanguard Estates style */}
            <footer className="bg-[#070E01] text-[#ECF3E5] pt-32 pb-12 px-6 md:px-12 border-t border-[#ECF3E5]/10">
                <div className="max-w-[1920px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                        <div className="md:col-span-2">
                            <h2 className="font-serif text-4xl md:text-6xl mb-8 tracking-tighter">
                                Let's supply your next order.
                            </h2>
                            <div className="flex gap-4">
                                <div className="w-12 h-[1px] bg-[#A5FFA9] mt-4" />
                                <p className="text-sm font-medium opacity-60 max-w-xs">
                                    Premium bakery and pastry ingredients from trusted brands, delivered through our branch network.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                                Navigation
                            </span>
                            <ul className="space-y-4 text-sm font-bold uppercase tracking-widest">
                                <li><Link href="/products" className="hover:text-[#A5FFA9] transition-colors">Products</Link></li>
                                <li><Link href="/brands" className="hover:text-[#A5FFA9] transition-colors">Brands</Link></li>
                                <li><Link href="/about" className="hover:text-[#A5FFA9] transition-colors">About</Link></li>
                                <li><Link href="/contact" className="hover:text-[#A5FFA9] transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                                Contact
                            </span>
                            <ul className="space-y-4 text-sm font-bold uppercase tracking-widest">
                                <li>Addis Ababa</li>
                                <li>Bahir Dar</li>
                                <li>contact@danob.et</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-8">
                        <p className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-40">
                            &copy; {new Date().getFullYear()} Danob Trading PLC. All Rights Reserved.
                        </p>
                        <div className="flex gap-12 text-[9px] font-bold uppercase tracking-[0.5em] opacity-40">
                            <Link href="/terms" className="hover:opacity-100 hover:text-[#A5FFA9] transition-all">Terms</Link>
                            <Link href="/privacy" className="hover:opacity-100 hover:text-[#A5FFA9] transition-all">Privacy</Link>
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="hover:opacity-100 hover:text-[#A5FFA9] transition-all">Dashboard</Link>
                            ) : (
                                <Link href="/login" className="hover:opacity-100 hover:text-[#A5FFA9] transition-all">Staff Login</Link>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
