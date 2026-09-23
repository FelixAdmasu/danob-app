import { Link, usePage } from '@inertiajs/react';
import { Github, BookOpen, LayoutGrid, Package, Tag, Building2, ShoppingCart, Users, Layers, Store, Archive, ArrowUpDown, History, Truck, FileText, AlertTriangle } from 'lucide-react';
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
        href: dashboard(),
        icon: LayoutGrid,
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
          ]
        : [];

    const platformItems = [...adminNavItems, ...orderNavItems];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Home" />
                {platformItems.length > 0 && <NavMain items={platformItems} label="Platform" />}
            </SidebarContent>

            <SidebarFooter>
                {isStaffPlus && (
                    <div className="px-2 pb-2">
                        <a
                            href="/products"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Store className="h-4 w-4" />
                            View Store ↗
                        </a>
                    </div>
                )}
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
