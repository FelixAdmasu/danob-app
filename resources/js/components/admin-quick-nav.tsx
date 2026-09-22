import { Link } from '@inertiajs/react';
import { Package, Tag, Layers, Building2, Archive, ArrowUpDown, History, ShoppingCart, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const items = [
    { title: 'Products', href: '/admin/products', icon: Package, desc: 'Catalog' },
    { title: 'Categories', href: '/admin/categories', icon: Tag, desc: 'Groups' },
    { title: 'Brands', href: '/admin/brands', icon: Layers, desc: 'Brands' },
    { title: 'Branches', href: '/admin/branches', icon: Building2, desc: 'Locations' },
    { title: 'Opening Stock', href: '/admin/inventory/opening-stock', icon: Archive, desc: 'Initial' },
    { title: 'Stock Adjustments', href: '/admin/inventory/adjustments', icon: ArrowUpDown, desc: 'Correct' },
    { title: 'Inventory History', href: '/admin/inventory/history', icon: History, desc: 'Ledger' },
    { title: 'Orders', href: '/admin/orders', icon: ShoppingCart, desc: 'Sales' },
    { title: 'Customers', href: '/admin/customers', icon: Users, desc: 'Clients' },
];

export function AdminQuickNav() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-9">
                    {items.map((item) => (
                        <Link key={item.title} href={item.href} className="group flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                            <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.desc}</span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
