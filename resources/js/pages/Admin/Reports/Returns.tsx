import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { FilterField, FilterPanel } from '@/components/filter-panel';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ReportExportButton } from '@/components/report-export-button';
import * as OrderRoutes from '@/routes/admin/orders';
import ReportRoutes from '@/routes/admin/reports';
import { formatDate } from '@/lib/format';
import { Package, Receipt, Undo2 } from 'lucide-react';

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
        customer: {
            id: number;
            company_name?: string | null;
            contact_name?: string | null;
        } | null;
    } | null;
    // Eloquent serializes relation keys snake_case: returnedBy -> returned_by.
    returned_by: { id: number; name: string } | null;
};

type PaginatedReturns = {
    data: ReturnRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    returns: PaginatedReturns;
    summary: {
        return_count: number;
        returned_units: number;
        return_value: string;
    };
    filters: {
        customer_id: number | null;
        product_id: number | null;
        variant_id: number | null;
        search: string | null;
        date_from: string | null;
        date_to: string | null;
    };
    customers: {
        id: number;
        company_name?: string | null;
        contact_name?: string | null;
    }[];
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

export default function Returns({
    returns,
    summary,
    filters,
    customers,
    products,
    variants,
}: Props) {
    const [customerId, setCustomerId] = useState<string>(
        filters.customer_id ? String(filters.customer_id) : 'all',
    );
    const [productId, setProductId] = useState<string>(
        filters.product_id ? String(filters.product_id) : 'all',
    );
    const [variantId, setVariantId] = useState<string>(
        filters.variant_id ? String(filters.variant_id) : 'all',
    );
    const [search, setSearch] = useState<string>(filters.search || '');
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');

    const activeCount = [
        customerId !== 'all' ? customerId : '',
        productId !== 'all' ? productId : '',
        variantId !== 'all' ? variantId : '',
        search.trim(),
        dateFrom,
        dateTo,
    ].filter((v) => v !== '').length;

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
        setCustomerId('all');
        setProductId('all');
        setVariantId('all');
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get(
            ReportRoutes.returns().url,
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Sales Returns Report" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Reports — Returns"
                    title="Sales Returns"
                    description="Processed sales returns with quantities, values and original orders."
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Returns"
                        value={summary.return_count}
                        icon={Undo2}
                    />
                    <StatCard
                        label="Returned Units"
                        value={summary.returned_units}
                        icon={Package}
                        tone="warning"
                    />
                    <StatCard
                        label="Return Value"
                        value={summary.return_value}
                        icon={Receipt}
                        tone="warning"
                    />
                </div>

                <FilterPanel
                    onSubmit={handleFilter}
                    onClear={clearFilters}
                    activeCount={activeCount}
                    actions={
                        <ReportExportButton
                            url={ReportRoutes.returns.export().url}
                            filters={filters}
                        />
                    }
                >
                    <FilterField
                        label="Search"
                        htmlFor="search"
                        className="sm:col-span-2"
                    >
                        <Input
                            id="search"
                            placeholder="Search by return number, order or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="Customer">
                        <Select
                            value={customerId}
                            onValueChange={setCustomerId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All customers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All customers
                                </SelectItem>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.company_name ||
                                            c.contact_name ||
                                            `#${c.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="Product">
                        <Select value={productId} onValueChange={setProductId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All products" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All products
                                </SelectItem>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="Variant">
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All variants" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All variants
                                </SelectItem>
                                {variants
                                    .filter(
                                        (v) =>
                                            productId === 'all' ||
                                            String(v.product_id) === productId,
                                    )
                                    .map((v) => (
                                        <SelectItem
                                            key={v.id}
                                            value={String(v.id)}
                                        >
                                            {v.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </FilterField>
                    <FilterField label="From" htmlFor="date_from">
                        <Input
                            id="date_from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </FilterField>
                    <FilterField label="To" htmlFor="date_to">
                        <Input
                            id="date_to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </FilterField>
                </FilterPanel>

                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle>Returns</CardTitle>
                            <span className="text-muted-foreground text-xs font-medium tabular-nums">
                                {returns.total.toLocaleString()} record
                                {returns.total === 1 ? '' : 's'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Return #</TableHead>
                                    <TableHead>Order / Customer</TableHead>
                                    <TableHead>Returned At</TableHead>
                                    <TableHead>Returned By</TableHead>
                                    <TableHead className="text-right">
                                        Units
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Return Value
                                    </TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {returns.data.length === 0 ? (
                                    <TableEmpty colSpan={7}>
                                        No returns found.
                                    </TableEmpty>
                                ) : (
                                    returns.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {row.return_number}
                                            </TableCell>
                                            <TableCell>
                                                {row.order ? (
                                                    <>
                                                        <Link
                                                            href={
                                                                OrderRoutes.show(
                                                                    row.order
                                                                        .id,
                                                                ).url
                                                            }
                                                            className="font-medium hover:underline"
                                                        >
                                                            {
                                                                row.order
                                                                    .reference_number
                                                            }
                                                        </Link>
                                                        <div className="text-muted-foreground text-xs">
                                                            {orderCustomerName(
                                                                row,
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(row.returned_at)}
                                            </TableCell>
                                            <TableCell>
                                                {row.returned_by?.name || '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {row.returned_quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {row.total}
                                            </TableCell>
                                            <TableCell
                                                className="max-w-[200px] truncate"
                                                title={row.notes || ''}
                                            >
                                                {row.notes || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        {returns.last_page > 1 && (
                            <Pagination
                                links={returns.links}
                                className="px-6 pt-4 pb-2"
                            />
                        )}
                    </CardContent>
                </Card>
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
