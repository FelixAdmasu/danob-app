import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Tag, Layers, Building2, Archive, ArrowUpDown, ShoppingCart, Users, History } from 'lucide-react';

type Order = { id: number; reference_number: string; status: string; total: string; ordered_at: string; customer: { name: string } | null };
type Variant = { id: number; name: string; quantity: number; sku: string | null; product: { id: number; name: string } };

export default function Dashboard({
    stats,
    recent_orders,
    low_stock,
}: {
    stats: { products: number; categories: number; orders: number; customers: number; branches: number; low_stock_variants: number; pending_orders: number };
    recent_orders: Order[];
    low_stock: Variant[];
}) {
    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="p-6 space-y-6">
                <Heading title="Admin Dashboard" description="Overview" />
                <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{stats.products}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Categories</p>
                        <p className="text-2xl font-bold">{stats.categories}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Orders</p>
                        <p className="text-2xl font-bold">{stats.orders}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pending_orders}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Customers</p>
                        <p className="text-2xl font-bold">{stats.customers}</p>
                    </div>
                    <div className="rounded border p-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Branches</p>
                        <p className="text-2xl font-bold">{stats.branches}</p>
                    </div>
                    <div className="rounded border p-4 bg-red-50">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Low Stock</p>
                        <p className="text-2xl font-bold text-red-600">{stats.low_stock_variants}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Quick Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            {[
                                { title: 'Products', href: '/admin/products', icon: Package, desc: 'Catalog' },
                                { title: 'Categories', href: '/admin/categories', icon: Tag, desc: 'Groups' },
                                { title: 'Brands', href: '/admin/brands', icon: Layers, desc: 'Brands' },
                                { title: 'Branches', href: '/admin/branches', icon: Building2, desc: 'Locations' },
                                { title: 'Opening Stock', href: '/admin/inventory/opening-stock', icon: Archive, desc: 'Initial' },
                                { title: 'Stock Adjustments', href: '/admin/inventory/adjustments', icon: ArrowUpDown, desc: 'Correct' },
                                { title: 'Inventory History', href: '/admin/inventory/history', icon: History, desc: 'Ledger' },
                                { title: 'Orders', href: '/admin/orders', icon: ShoppingCart, desc: 'Sales' },
                                { title: 'Customers', href: '/admin/customers', icon: Users, desc: 'Clients' },
                            ].map((item) => (
                                <Link key={item.title} href={item.href} className="group flex flex-col gap-2 rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recent_orders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No orders.</p>
                            ) : (
                                <div className="space-y-3">
                                    {recent_orders.map((o) => (
                                        <div key={o.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                                <p className="font-mono text-sm">{o.reference_number}</p>
                                                <p className="text-xs text-muted-foreground">{o.customer?.name || 'Guest'}</p>
                                            </div>
                                            <Badge variant={o.status === 'delivered' ? 'default' : 'secondary'}>{o.status}</Badge>
                                        </div>
                                    ))}
                                    <Link href="/admin/orders" className="text-xs text-primary hover:underline">
                                        View all →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Low Stock Variants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {low_stock.length === 0 ? (
                                <p className="text-sm text-muted-foreground">All stocked.</p>
                            ) : (
                                <div className="space-y-3">
                                    {low_stock.map((v) => (
                                        <div key={v.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                                <p className="text-sm font-medium">{v.product.name} — {v.name}</p>
                                                <p className="text-xs text-muted-foreground">{v.sku || 'No SKU'}</p>
                                            </div>
                                            <Badge variant="destructive">{v.quantity} left</Badge>
                                        </div>
                                    ))}
                                    <Link href="/admin/products" className="text-xs text-primary hover:underline">
                                        Manage products →
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
