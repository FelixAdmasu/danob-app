import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Github, BookOpen, LayoutGrid, LayoutDashboard, Package, Tag, Building2, ShoppingCart, Users, Layers, Store, Archive, ArrowUpDown, History, Truck, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import * as productRoutes from '@/routes/admin/products';
import * as categoryRoutes from '@/routes/admin/categories';
import * as brandRoutes from '@/routes/admin/brands';
import * as branchRoutes from '@/routes/admin/branches';
import * as orderRoutes from '@/routes/admin/orders';
import * as customerRoutes from '@/routes/admin/customers';
import * as inventoryRoutes from '@/routes/admin/inventory';
import * as supplierRoutes from '@/routes/admin/suppliers';
import * as purchaseOrderRoutes from '@/routes/admin/purchase-orders';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutGrid,
        exact: true,
    },
];

// When the sidebar collapses to icons the section labels hide with them; a
// hairline top border keeps the grouping readable in that mode.
const SECTION_DIVIDER =
    'group-data-[collapsible=icon]:border-t group-data-[collapsible=icon]:border-sidebar-border/70';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/FelixAdmasu/danob-app',
        icon: Github,
    },
    {
        title: 'About',
        href: '#',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const page = usePage<{ auth: { user: { role?: string } | null }; name?: string }>();
    const role = (page.props.auth?.user as { role?: string } | null)?.role;
    const isAdmin = role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';
    const brandName = page.props.name ?? 'Danob';

    // Sections mirror the page eyebrows (Catalog / Operations / Inventory /
    // Sales) so the nav, breadcrumbs and page headers tell the same story.
    // Role gating is unchanged: admins see the admin sections, staff+ see
    // sales, everyone sees Home. NavMain renders nothing for empty sections.
    const catalogItems: NavItem[] = isAdmin
        ? [
              { title: 'Products', href: productRoutes.index().url, icon: Package },
              { title: 'Categories', href: categoryRoutes.index().url, icon: Tag },
              { title: 'Brands', href: brandRoutes.index().url, icon: Layers },
          ]
        : [];

    const operationsItems: NavItem[] = isAdmin
        ? [
              { title: 'Branches', href: branchRoutes.index().url, icon: Building2 },
              { title: 'Suppliers', href: supplierRoutes.index().url, icon: Truck },
              { title: 'Purchase Orders', href: purchaseOrderRoutes.index().url, icon: FileText },
              { title: 'Purchase Dashboard', href: '/admin/purchases/dashboard', icon: LayoutDashboard },
          ]
        : [];

    const inventoryItems: NavItem[] = isAdmin
        ? [
              { title: 'Opening Stock', href: inventoryRoutes.openingStock().url, icon: Archive },
              { title: 'Stock Adjustments', href: inventoryRoutes.adjustments().url, icon: ArrowUpDown },
              { title: 'Inventory History', href: inventoryRoutes.history().url, icon: History },
              { title: 'Low Stock', href: inventoryRoutes.lowStock().url, icon: AlertTriangle },
          ]
        : [];

    const salesItems: NavItem[] = isStaffPlus
        ? [
              { title: 'Orders', href: orderRoutes.index().url, icon: ShoppingCart },
              { title: 'Customers', href: customerRoutes.index().url, icon: Users },
              { title: 'Sales Dashboard', href: '/admin/sales/dashboard', icon: LayoutDashboard },
              { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
          ]
        : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                {/* Premium brand block: gradient monogram tile +
                                    serif wordmark + micro console caption. */}
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#9CCB7B] via-[#4A8C2A] to-[#24411B] shadow-[0_6px_16px_-6px_rgba(127,176,105,0.85)] ring-1 ring-white/15">
                                    <span className="font-serif text-[15px] leading-none font-semibold text-[#081006]">
                                        {brandName.charAt(0).toUpperCase()}
                                    </span>
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col text-left leading-none group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-serif text-[15px] font-semibold tracking-tight text-white">
                                        {brandName}
                                    </span>
                                    <span className="mt-1 truncate text-[9px] font-bold tracking-[0.3em] text-white/40 uppercase">
                                        Admin Console
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Home" />
                <NavMain items={catalogItems} label="Catalog" className={SECTION_DIVIDER} />
                <NavMain items={operationsItems} label="Operations" className={SECTION_DIVIDER} />
                <NavMain items={inventoryItems} label="Inventory" className={SECTION_DIVIDER} />
                <NavMain items={salesItems} label="Sales" className={SECTION_DIVIDER} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border pt-3">
                {isStaffPlus && (
                    <div className="px-2 pb-2">
                        <a
                            href="/products"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-[0.18em] text-white/65 uppercase transition-all duration-200 hover:border-[#7FB069]/40 hover:bg-[#7FB069] hover:text-[#0B1406]"
                        >
                            <Store className="h-4 w-4 shrink-0 transition-colors" />
                            <span className="flex-1 text-left">View Store</span>
                            <ArrowUpRight
                                aria-hidden="true"
                                className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </a>
                    </div>
                )}
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
