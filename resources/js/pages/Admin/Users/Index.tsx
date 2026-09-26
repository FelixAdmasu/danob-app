import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, UserRoundPlus } from 'lucide-react';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};
type PaginatedUsers = {
    data: User[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
    total: number;
};
type Props = {
    users: PaginatedUsers;
    filters: { search: string | null; role: string | null };
    roles: string[];
};

const labelFor = (value: string) =>
    value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Index({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? 'all');
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/users',
            {
                search: search || undefined,
                role: role !== 'all' ? role : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        eyebrow="Administration"
                        title="Users"
                        description="Manage team accounts and access roles."
                    />
                    <Link href="/admin/users/create">
                        <Button>
                            <UserRoundPlus className="mr-2 h-4 w-4" />
                            Create user
                        </Button>
                    </Link>
                </div>
                <form
                    onSubmit={submit}
                    className="border-border/70 bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3 shadow-xs"
                >
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or email..."
                            className="pl-9"
                        />
                    </div>
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger
                            className="w-[170px]"
                            aria-label="Filter by role"
                        >
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {roles.map((value) => (
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
                        <div className="flex items-center justify-between">
                            <CardTitle>Team accounts</CardTitle>
                            <span className="text-muted-foreground text-xs">
                                {users.total.toLocaleString()} users
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {users.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                No users found.
                            </p>
                        ) : (
                            users.data.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-muted rounded-full px-3 py-1 text-xs font-medium">
                                            {labelFor(user.role)}
                                        </span>
                                        <Link
                                            href={`/admin/users/${user.id}/edit`}
                                        >
                                            <Button variant="outline" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                        {users.last_page > 1 && (
                            <Pagination links={users.links} />
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
        { title: 'Users', href: '/admin/users' },
    ],
};
