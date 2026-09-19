import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome — Danob" />
            <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/80">
                    <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 40 40"
                                    xmlns="http://www.w3.org/2000/svg"
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
                            <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                                Danob
                            </span>
                        </Link>
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                    >
                                        Log in
                                    </Link>
                                    {/* @chisel-registration */}
                                    <Link
                                        href={register()}
                                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                                    >
                                        Get started
                                    </Link>
                                    {/* @end-chisel-registration */}
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <main className="mx-auto w-full max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                        <div className="space-y-8">
                            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
                                Build your workflow with Danob
                            </h1>
                            <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                                A modern platform designed to help teams work
                                smarter. Manage, organize, and grow — all in one
                                place.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                {/* @chisel-registration */}
                                <Link
                                    href={register()}
                                    className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                                >
                                    Get started free
                                </Link>
                                {/* @end-chisel-registration */}
                                {!auth.user && (
                                    <Link
                                        href={login()}
                                        className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                    >
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </div>
                        {/* Hero Visual */}
                        <div className="relative hidden aspect-[4/3] rounded-xl border border-neutral-200 bg-neutral-50 p-8 shadow-sm lg:block dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex h-full flex-col items-center justify-center gap-4">
                                <div className="grid w-full max-w-sm grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-800"
                                        >
                                            <div className="mb-2 h-3 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                            <div className="h-2 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-neutral-400">
                                    Dashboard preview
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <section className="mt-24 border-t border-neutral-200 pt-16 dark:border-neutral-800">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Everything you need
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-neutral-600 dark:text-neutral-400">
                            Danob provides the foundation for modern teams to
                            build, collaborate, and deliver.
                        </p>
                        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Modern Platform',
                                    description:
                                        'Built with the latest technologies for a seamless experience.',
                                },
                                {
                                    title: 'Secure by Default',
                                    description:
                                        'Enterprise-grade security with two-factor authentication and passkeys.',
                                },
                                {
                                    title: 'Real-time Sync',
                                    description:
                                        'Instant updates across all your devices and team members.',
                                },
                                {
                                    title: 'Developer Friendly',
                                    description:
                                        'Clean APIs, comprehensive documentation, and easy integrations.',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="mt-24 border-t border-neutral-200 py-16 dark:border-neutral-800">
                        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl bg-neutral-50 p-8 dark:bg-neutral-900">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                Ready to get started?
                            </h2>
                            <p className="text-center text-neutral-600 dark:text-neutral-400">
                                Join teams already using Danob to streamline
                                their workflows.
                            </p>
                            {/* @chisel-registration */}
                            <Link
                                href={register()}
                                className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                            >
                                Create your account
                            </Link>
                            {/* @end-chisel-registration */}
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
                        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                            <span>
                                &copy; {new Date().getFullYear()} Danob. All
                                rights reserved.
                            </span>
                        </div>
                        <nav className="flex gap-6 text-sm">
                            <a
                                href="#"
                                className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                            >
                                Privacy
                            </a>
                            <a
                                href="#"
                                className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                            >
                                Terms
                            </a>
                            <a
                                href="#"
                                className="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                            >
                                Contact
                            </a>
                        </nav>
                    </div>
                </footer>
            </div>
        </>
    );
}
