import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh bg-[#ECF3E5]">
            {/* Left — Dark branding panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#070E01] relative overflow-hidden flex-col justify-between p-16">
                <div className="absolute inset-0 bg-gradient-to-br from-[#070E01] via-[#0a1a03] to-[#070E01]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#A5FFA9]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#A5FFA9]/3 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <Link href={home()} className="font-serif text-2xl font-bold tracking-widest uppercase text-[#ECF3E5]">
                        Danob.
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="w-12 h-[1px] bg-[#A5FFA9]" />
                    <h2 className="font-serif text-4xl xl:text-5xl text-[#ECF3E5] leading-tight tracking-tight">
                        Premium bakery<br />ingredients.
                    </h2>
                    <p className="text-[#ECF3E5]/40 text-sm max-w-sm leading-relaxed">
                        Trusted by professional bakers across Ethiopia. Sign in to manage your account.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#ECF3E5]/20">
                        &copy; {new Date().getFullYear()} Danob Trading PLC
                    </p>
                </div>
            </div>

            {/* Right — Form panel */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-[380px]">
                    {/* Mobile-only logo */}
                    <div className="flex items-center gap-3 mb-12 lg:hidden">
                        <Link href={home()} className="font-serif text-xl font-bold tracking-widest uppercase text-[#070E01]">
                            Danob.
                        </Link>
                    </div>

                    {/* Title block */}
                    <div className="mb-10">
                        <h1 className="font-serif text-[28px] leading-tight tracking-tight text-[#070E01] mb-2">
                            {title}
                        </h1>
                        <p className="text-[13px] text-[#070E01]/40 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {children}

                    {/* Bottom link */}
                    <div className="mt-10 pt-8 border-t border-[#070E01]/6">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#070E01]/25 hover:text-[#070E01]/50 transition-colors"
                        >
                            <span>&larr;</span>
                            <span>Back to site</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
