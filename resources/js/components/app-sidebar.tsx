import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Github, BookOpen, LayoutGrid, LayoutDashboard, Package, Tag, Building2, ShoppingCart, Users, Layers, Store, Archive, ArrowUpDown, History, Truck, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
    SidebarSeparator,
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
    const page = usePage<{ auth: { user: { role?: string } | null } }>();
    const role = (page.props.auth?.user as { role?: string } | null)?.role;
    const isAdmin = role === 'super_admin' || role === 'admin' || role === 'manager';
    const isStaffPlus = isAdmin || role === 'staff';

    const adminNavItems: NavItem[] = isAdmin
        ? [
              { title: 'Products', href: productRoutes.index().url, icon: Package },
              { title: 'Categories', href: categoryRoutes.index().url, icon: Tag },
              { title: 'Brands', href: brandRoutes.index().url, icon: Layers },
              { title: 'Branches', href: branchRoutes.index().url, icon: Building2 },
              { title: 'Suppliers', href: supplierRoutes.index().url, icon: Truck },
              { title: 'Purchase Orders', href: purchaseOrderRoutes.index().url, icon: FileText },
              { title: 'Purchase Dashboard', href: '/admin/purchases/dashboard', icon: LayoutDashboard },
              { title: 'Opening Stock', href: inventoryRoutes.openingStock().url, icon: Archive },
              { title: 'Stock Adjustments', href: inventoryRoutes.adjustments().url, icon: ArrowUpDown },
              { title: 'Inventory History', href: inventoryRoutes.history().url, icon: History },
              { title: 'Low Stock', href: inventoryRoutes.lowStock().url, icon: AlertTriangle },
          ]
        : [];

    const orderNavItems: NavItem[] = isStaffPlus
        ? [
              { title: 'Orders', href: orderRoutes.index().url, icon: ShoppingCart },
              { title: 'Customers', href: customerRoutes.index().url, icon: Users },
              { title: 'Sales Dashboard', href: '/admin/sales/dashboard', icon: LayoutDashboard },
              { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
          ]
        : [];

    const platformItems = [...adminNavItems, ...orderNavItems];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-sidebar-border/70 pb-3">
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

            <SidebarContent>
                <NavMain items={mainNavItems} label="Home" />
                {platformItems.length > 0 && (
                    <>
                        <SidebarSeparator className="mx-3 my-1 opacity-70" />
                        <NavMain items={platformItems} label="Platform" />
                    </>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 pt-3">
                {isStaffPlus && (
                    <div className="px-2 pb-2">
                        <a
                            href="/products"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-secondary/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
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
