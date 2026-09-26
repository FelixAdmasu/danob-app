import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

type Inquiry = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    interest: string;
    product: { name: string } | null;
    variant: { name: string; unit: string } | null;
    requested_quantity: number | null;
    message: string;
    status: string;
    internal_notes: string | null;
    created_at: string;
    assignee: { name: string } | null;
};

type PaginatedInquiries = {
    data: Inquiry[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    inquiries: PaginatedInquiries;
    filters: { search: string | null; status: string | null };
    statuses: string[];
};

const labelFor = (status: string) =>
    status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Index({ inquiries, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [notes, setNotes] = useState<Record<number, string>>({});

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/inquiries',
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const updateInquiry = (inquiry: Inquiry, nextStatus: string) => {
        router.patch(`/admin/inquiries/${inquiry.id}`, {
            status: nextStatus,
            internal_notes: notes[inquiry.id] ?? inquiry.internal_notes ?? '',
        });
    };

    return (
        <>
            <Head title="Inquiries" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading
                    eyebrow="Sales"
                    title="Website inquiries"
                    description="Follow up with visitors who contacted Danob."
                />
                <form
                    onSubmit={submitSearch}
                    className="border-border/70 bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-xs"
                >
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name, email, or message..."
                            className="pl-9"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger
                            className="w-[160px]"
                            aria-label="Filter inquiries by status"
                        >
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {labelFor(value)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {inquiries.total.toLocaleString()}{' '}
                            {inquiries.total === 1 ? 'inquiry' : 'inquiries'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {inquiries.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                No inquiries yet.
                            </p>
                        ) : (
                            inquiries.data.map((inquiry) => (
                                <article
                                    key={inquiry.id}
                                    className="grid gap-4 rounded-xl border p-5 lg:grid-cols-[1fr_1.3fr_220px]"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <h2 className="font-semibold">
                                                {inquiry.name}
                                            </h2>
                                            <span className="text-muted-foreground text-xs">
                                                {new Date(
                                                    inquiry.created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <a
                                            className="text-primary block text-sm hover:underline"
                                            href={`mailto:${inquiry.email}`}
                                        >
                                            {inquiry.email}
                                        </a>
                                        {inquiry.phone && (
                                            <a
                                                className="text-muted-foreground block text-sm hover:underline"
                                                href={`tel:${inquiry.phone}`}
                                            >
                                                {inquiry.phone}
                                            </a>
                                        )}
                                        <p className="text-muted-foreground text-xs font-medium uppercase">
                                            {inquiry.interest}
                                        </p>
                                        {inquiry.product && (
                                            <div className="bg-muted/50 rounded-md p-3 text-sm">
                                                <p className="font-medium">
                                                    Quote:{' '}
                                                    {inquiry.product.name}
                                                </p>
                                                {inquiry.variant && (
                                                    <p className="text-muted-foreground text-xs">
                                                        {inquiry.variant.name} ·{' '}
                                                        {inquiry.variant.unit}
                                                    </p>
                                                )}
                                                {inquiry.requested_quantity && (
                                                    <p className="text-muted-foreground text-xs">
                                                        Estimated quantity:{' '}
                                                        {inquiry.requested_quantity.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {inquiry.message}
                                        </p>
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`notes-${inquiry.id}`}
                                            >
                                                Internal notes
                                            </Label>
                                            <textarea
                                                id={`notes-${inquiry.id}`}
                                                value={
                                                    notes[inquiry.id] ??
                                                    inquiry.internal_notes ??
                                                    ''
                                                }
                                                onChange={(event) =>
                                                    setNotes({
                                                        ...notes,
                                                        [inquiry.id]:
                                                            event.target.value,
                                                    })
                                                }
                                                placeholder="Add follow-up notes..."
                                                rows={2}
                                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Label>Status</Label>
                                        <Select
                                            value={inquiry.status}
                                            onValueChange={(value) =>
                                                updateInquiry(inquiry, value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((value) => (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {labelFor(value)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                updateInquiry(
                                                    inquiry,
                                                    inquiry.status,
                                                )
                                            }
                                        >
                                            Save notes
                                        </Button>
                                    </div>
                                </article>
                            ))
                        )}
                        {inquiries.last_page > 1 && (
                            <div className="flex flex-wrap gap-2 border-t pt-4">
                                {inquiries.links.map(
                                    (link) =>
                                        link.url && (
                                            <Button
                                                key={link.label}
                                                type="button"
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        link.url as string,
                                                    )
                                                }
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ),
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Inquiries', href: '/admin/inquiries' },
    ],
};
