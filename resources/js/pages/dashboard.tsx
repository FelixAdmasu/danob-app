import { Head, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import Heading from '@/components/heading';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Auth } from '@/types';

export default function Dashboard() {
    const { auth } = usePage().props as { auth: Auth };

    return (
        <>
            <Head title="Account Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Welcome Section */}
                <div className="space-y-2">
                    <Heading
                        variant="default"
                        eyebrow="Account"
                        title="Account Dashboard"
                        description={`Welcome back, ${auth.user?.name ?? 'User'}`}
                    />
                </div>

                {/* Account Info Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Name
                            </CardTitle>
                            <CardDescription>
                                {auth.user?.name ?? '—'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-xs">
                                Profile information
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Email
                            </CardTitle>
                            <CardDescription>
                                {auth.user?.email ?? '—'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-xs">
                                Account email
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Member Since
                            </CardTitle>
                            <CardDescription>
                                {auth.user?.created_at
                                    ? new Date(
                                          auth.user.created_at,
                                      ).toLocaleDateString()
                                    : '—'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-xs">
                                Account created
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions / Empty State */}
                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Your Danob workspace is ready. Start by configuring
                            your profile and exploring the settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center dark:border-border dark:bg-muted">
                                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                    Profile
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                                    Update your name and email
                                </p>
                            </div>
                            <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center dark:border-border dark:bg-muted">
                                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                                    Security
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
                                    Manage password and 2FA
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Account Dashboard',
            href: dashboard(),
        },
    ],
};
