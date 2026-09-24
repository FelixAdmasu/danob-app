import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, LayoutGrid, LayoutDashboard, Package, Tag, Building2, ShoppingCart, Users, Layers, Store, Archive, ArrowUpDown, History, Truck, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { dashboard } from '@/routes/admin';
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

export function AppSidebar() {
    const page = usePage<{ auth: { user: { role?: string } | null } }>();
    const role = (page.props.auth?.user as { role?: string } | null)?.role;
    const isAdmin = role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';

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
            <SidebarHeader className="border-b border-sidebar-border/70 pb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent data-[state=open]:bg-transparent"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-2">
                <NavMain items={mainNavItems} label="Home" />
                <NavMain items={catalogItems} label="Catalog" className={SECTION_DIVIDER} />
                <NavMain items={operationsItems} label="Operations" className={SECTION_DIVIDER} />
                <NavMain items={inventoryItems} label="Inventory" className={SECTION_DIVIDER} />
                <NavMain items={salesItems} label="Sales" className={SECTION_DIVIDER} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 pt-3">
                {isStaffPlus && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            {/* Collapses to a clean icon-only square (with a
                                tooltip) when the sidebar is minimized, so the
                                label never spills past the panel edge. */}
                            <SidebarMenuButton
                                asChild
                                tooltip="View Store"
                                className="group h-10 border border-white/10 bg-white/[0.05] px-3 text-[11px] font-semibold tracking-[0.15em] text-white/70 uppercase hover:border-[#7FB069]/50 hover:bg-[#7FB069] hover:text-[#08110B] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-[#7FB069]"
                            >
                                <a href="/products" target="_blank" rel="noopener noreferrer">
                                    <Store />
                                    <span className="flex-1 group-data-[collapsible=icon]:hidden">View Store</span>
                                    <ArrowUpRight
                                        aria-hidden="true"
                                        className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-data-[collapsible=icon]:hidden"
                                    />
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
