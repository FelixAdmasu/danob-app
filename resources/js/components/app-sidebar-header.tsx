import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * Slim sticky top bar for the sidebar shell: trigger + hairline divider +
 * breadcrumbs over a translucent, blurred backdrop that picks up the sage
 * canvas beneath. Uses the same px-4/px-6 gutter as every page root and the
 * same max-width column (enforced by app-sidebar-layout) so crumbs align
 * exactly with page content below.
 */
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl transition-[width,height] ease-linear md:px-6">
            <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:text-foreground" />
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
            <div className="min-w-0 flex-1">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
