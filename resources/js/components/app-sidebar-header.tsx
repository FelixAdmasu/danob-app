import { Breadcrumbs } from '@/components/breadcrumbs';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * Slim sticky top bar for the sidebar shell: trigger + hairline divider +
 * breadcrumbs. Uses the same px-4/px-6 gutter as every page root and the
 * same max-width column (enforced by app-sidebar-layout) so crumbs align
 * exactly with page content below.
 */
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-border/70 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <SidebarTrigger className="text-muted-foreground -ml-1 shrink-0" />
            <span aria-hidden="true" className="bg-border h-4 w-px shrink-0" />
            <div className="min-w-0 flex-1">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {/* Global search (Phase 27): sits in the header's flex-1 row so
                the approved shell layout is untouched. Hidden below md where
                the breadcrumbs need the full width. */}
            <GlobalSearch className="hidden w-56 shrink-0 md:block lg:w-72" />
            {/* Notification bell (Phase 28): trailing icon button after the
                search box, always visible (including mobile) and sized like
                any other header control so the shell stays as it was. */}
            <NotificationCenter />
        </header>
    );
}
