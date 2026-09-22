import { Link, usePage } from '@inertiajs/react';
import { Github, BookOpen, LayoutGrid, Package, Tag, Building2, ShoppingCart, Users, Layers } from 'lucide-react';
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
          ]
        : [];

    const orderNavItems: NavItem[] = isStaffPlus
        ? [
              { title: 'Orders', href: orderRoutes.index().url, icon: ShoppingCart },
              { title: 'Customers', href: customerRoutes.index().url, icon: Users },
          ]
        : [];

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
                <NavMain items={mainNavItems} />
                {adminNavItems.length > 0 && <NavMain items={adminNavItems} />}
                {orderNavItems.length > 0 && <NavMain items={orderNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
