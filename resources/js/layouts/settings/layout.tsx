import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

/**
 * Settings shell: same page rhythm as every admin page (gap-6 root, shared
 * Heading with border), a card-wrapped sub-nav whose active pill mirrors the
 * sidebar's primary treatment, and a comfortable form column.
 */
export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
            <Heading
                eyebrow="Account"
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                <aside className="w-full lg:w-60 lg:shrink-0">
                    <nav
                        className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-2.5 shadow-[0_1px_2px_rgba(7,14,1,0.04),0_16px_40px_-24px_rgba(7,14,1,0.18)] dark:shadow-none"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);
                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-200',
                                        active
                                            ? 'bg-primary font-medium text-primary-foreground dark:bg-[#24411B] dark:text-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {item.icon && (
                                        <item.icon className="h-4 w-4 shrink-0" />
                                    )}
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-0 lg:hidden" />

                <div className="min-w-0 flex-1">
                    <section className="max-w-2xl space-y-10">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
