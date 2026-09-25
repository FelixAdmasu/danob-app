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
            <div className="relative hidden flex-col justify-between overflow-hidden bg-[#070E01] p-16 lg:flex lg:w-1/2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#070E01] via-[#0a1a03] to-[#070E01]" />
                <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#A5FFA9]/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#A5FFA9]/3 blur-3xl" />

                <div className="relative z-10">
                    <Link
                        href={home()}
                        className="font-serif text-2xl font-bold tracking-widest text-[#ECF3E5] uppercase"
                    >
                        Danob.
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="h-[1px] w-12 bg-[#A5FFA9]" />
                    <h2 className="font-serif text-4xl leading-tight tracking-tight text-[#ECF3E5] xl:text-5xl">
                        Premium bakery
                        <br />
                        ingredients.
                    </h2>
                    <p className="max-w-sm text-sm leading-relaxed text-[#ECF3E5]/40">
                        Trusted by professional bakers across Ethiopia. Sign in
                        to manage your account.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-[9px] font-bold tracking-[0.3em] text-[#ECF3E5]/20 uppercase">
                        &copy; {new Date().getFullYear()} Danob Trading PLC
                    </p>
                </div>
            </div>

            {/* Right — Form panel */}
            <div className="flex w-full flex-col items-center justify-center p-6 md:p-10 lg:w-1/2">
                <div className="w-full max-w-[380px]">
                    {/* Mobile-only logo */}
                    <div className="mb-12 flex items-center gap-3 lg:hidden">
                        <Link
                            href={home()}
                            className="font-serif text-xl font-bold tracking-widest text-[#070E01] uppercase"
                        >
                            Danob.
                        </Link>
                    </div>

                    {/* Title block */}
                    <div className="mb-10">
                        <h1 className="mb-2 font-serif text-[28px] leading-tight tracking-tight text-[#070E01]">
                            {title}
                        </h1>
                        <p className="text-[13px] leading-relaxed text-[#070E01]/40">
                            {description}
                        </p>
                    </div>

                    {children}

                    {/* Bottom link */}
                    <div className="mt-10 border-t border-[#070E01]/6 pt-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] text-[#070E01]/25 uppercase transition-colors hover:text-[#070E01]/50"
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
