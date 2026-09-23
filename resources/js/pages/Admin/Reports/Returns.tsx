import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportExportButton } from '@/components/report-export-button';
import * as OrderRoutes from '@/routes/admin/orders';
import ReportRoutes from '@/routes/admin/reports';

type ReturnRow = {
    id: number;
    return_number: string;
    returned_at: string;
    total: string;
    notes: string | null;
    returned_quantity: number;
    order: {
        id: number;
        reference_number: string;
        customer: { id: number; company_name?: string | null; contact_name?: string | null } | null;
    } | null;
    // Eloquent serializes relation keys snake_case: returnedBy -> returned_by.
    returned_by: { id: number; name: string } | null;
};

type PaginatedReturns = {
    data: ReturnRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    returns: PaginatedReturns;
    summary: { return_count: number; returned_units: number; return_value: string };
    filters: {
        customer_id: number | null;
        product_id: number | null;
        variant_id: number | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    customers: { id: number; company_name?: string | null; contact_name?: string | null }[];
    products: { id: number; name: string }[];
    variants: { id: number; name: string; product_id: number }[];
};

function orderCustomerName(row: ReturnRow): string {
    const customer = row.order?.customer;
    if (!customer) {
        return '—';
    }
    return customer.company_name || customer.contact_name || '—';
}

export default function Returns({ returns, summary, filters, customers, products, variants }: Props) {
    const [customerId, setCustomerId] = useState<string>(filters.customer_id ? String(filters.customer_id) : 'all');
    const [productId, setProductId] = useState<string>(filters.product_id ? String(filters.product_id) : 'all');
    const [variantId, setVariantId] = useState<string>(filters.variant_id ? String(filters.variant_id) : 'all');
    const [search, setSearch] = useState<string>(filters.search || '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            ReportRoutes.returns().url,
            {
                customer_id: customerId !== 'all' ? customerId : undefined,
                product_id: productId !== 'all' ? productId : undefined,
                variant_id: variantId !== 'all' ? variantId : undefined,
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        router.get(ReportRoutes.returns().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Sales Returns Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-border pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Reports — Returns</p>
                    <h1 className="font-serif text-[32px] leading-tight font-medium md:text-[40px] tracking-tight text-foreground">Sales Returns</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">Processed sales returns with quantities, values and original orders.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Returns</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.return_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Returned Units</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.returned_units}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Return Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-3xl">{summary.return_value}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                            <div className="space-y-2 md:col-span-3 lg:col-span-6">
                                <Label htmlFor="search">Search</Label>
                                <Input
                                    id="search"
                                    placeholder="Search by return number, order or customer..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All customers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All customers</SelectItem>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name || c.contact_name || `#${c.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Product</Label>
                                <Select value={productId} onValueChange={setProductId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All products</SelectItem>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Variant</Label>
                                <Select value={variantId} onValueChange={setVariantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All variants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All variants</SelectItem>
                                        {variants
                                            .filter((v) => productId === 'all' || String(v.product_id) === productId)
                                            .map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_from">From</Label>
                                <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">To</Label>
                                <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                            <div className="flex gap-2 md:col-span-3 lg:col-span-6">
                                <Button type="submit">Filter</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <ReportExportButton url={ReportRoutes.returns.export().url} filters={filters} />
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                        <th className="px-4 py-3">Return #</th>
                                        <th className="px-4 py-3">Order / Customer</th>
                                        <th className="px-4 py-3">Returned At</th>
                                        <th className="px-4 py-3">Returned By</th>
                                        <th className="px-4 py-3">Units</th>
                                        <th className="px-4 py-3">Return Value</th>
                                        <th className="px-4 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                No returns found.
                                            </td>
                                        </tr>
                                    ) : (
                                        returns.data.map((row) => (
                                            <tr key={row.id} className="border-b transition-colors hover:bg-muted/40">
                                                <td className="px-4 py-3 text-sm font-medium">{row.return_number}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {row.order ? (
                                                        <>
                                                            <Link href={OrderRoutes.show(row.order.id).url} className="font-medium hover:underline">
                                                                {row.order.reference_number}
                                                            </Link>
                                                            <div className="text-xs text-muted-foreground">{orderCustomerName(row)}</div>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs">{new Date(row.returned_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-xs">{row.returned_by?.name || '—'}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{row.returned_quantity}</td>
                                                <td className="px-4 py-3 text-sm font-mono">{row.total}</td>
                                                <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={row.notes || ''}>
                                                    {row.notes || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {returns.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {returns.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`inline-flex min-w-8 justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i} className="inline-flex min-w-8 justify-center px-3 py-1.5 text-xs opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Returns.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
        { title: 'Returns', href: '#' },
    ],
};
