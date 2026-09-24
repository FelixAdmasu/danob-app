import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

/**
 * A labeled navigation section. The label carries a trailing hairline rule so
 * grouped items read as distinct sections; when the sidebar collapses to
 * icons the label (and rule) hide with it, which is why callers pass an
 * icon-mode divider class to keep the grouping readable.
 */
export function NavMain({
    items,
    label = 'Platform',
    className,
}: {
    items: NavItem[];
    label?: string;
    className?: string;
}) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className={cn('px-2 py-0', className)}>
            <SidebarGroupLabel className="gap-2 px-3 pt-1 pb-2 text-[10px] font-semibold tracking-[0.26em] text-sidebar-foreground/45 uppercase">
                <span className="whitespace-nowrap">{label}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={
                                item.exact
                                    ? isCurrentUrl(item.href)
                                    : isCurrentOrParentUrl(item.href)
                            }
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
