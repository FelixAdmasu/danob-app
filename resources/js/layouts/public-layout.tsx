import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    children: ReactNode;
};

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Brands', href: '/brands' },
    { label: 'Branches', href: '/branches' },
    { label: 'About', href: '/about' },
    { label: 'How to Order', href: '/how-to-order' },
    { label: 'Contact', href: '/contact' },
];

export default function PublicLayout({ children }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 40 40"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <rect
                                    width="40"
                                    height="40"
                                    rx="8"
                                    fill="currentColor"
                                />
                                <path
                                    d="M14 10H18C20.2 10 22 11.8 22 14V16H18V14H16V26H14V14H12V10H14ZM26 10H28C30.2 10 32 11.8 32 14V26H30V14H28V10H26Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-neutral-900 leading-tight">
                                Danob
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400 leading-tight">
                                Trading PLC
                            </span>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-1 lg:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden lg:block">
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                        >
                            Explore Products
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </nav>

                {mobileOpen && (
                    <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 lg:hidden">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/products"
                                className="mt-2 inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                                onClick={() => setMobileOpen(false)}
                            >
                                Explore Products
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-neutral-200 bg-neutral-50">
                <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 40 40"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            width="40"
                                            height="40"
                                            rx="8"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M14 10H18C20.2 10 22 11.8 22 14V16H18V14H16V26H14V14H12V10H14ZM26 10H28C30.2 10 32 11.8 32 14V26H30V14H28V10H26Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-neutral-900">
                                        Danob
                                    </span>
                                    <span className="ml-1 text-xs text-neutral-400">
                                        Trading PLC
                                    </span>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                                Bakery and pastry ingredients supplier.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                                Quick Links
                            </h3>
                            <ul className="mt-3 space-y-2">
                                {[
                                    { label: 'Products', href: '/products' },
                                    { label: 'Brands', href: '/brands' },
                                    { label: 'Branches', href: '/branches' },
                                    { label: 'About', href: '/about' },
                                ].map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                                Get in Touch
                            </h3>
                            <ul className="mt-3 space-y-2">
                                <li>
                                    <Link
                                        href="/how-to-order"
                                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                                    >
                                        How to Order
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                                    >
                                        Contact Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/branches"
                                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                                    >
                                        Visit a Branch
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-neutral-200 pt-6">
                        <p className="text-center text-xs text-neutral-400">
                            &copy; {new Date().getFullYear()} Danob Trading PLC.
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
