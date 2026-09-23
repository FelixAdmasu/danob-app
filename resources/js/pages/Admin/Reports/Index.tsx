import { Head, Link } from '@inertiajs/react';
import * as ReportRoutes from '@/routes/admin/reports';

type ReportCard = {
    title: string;
    description: string;
    href: string;
};

type ReportGroup = {
    name: string;
    reports: ReportCard[];
};

export default function ReportsIndex({ groups }: { groups: ReportGroup[] }) {
    return (
        <>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="border-b border-border pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary mb-3">Reporting</p>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                        Operational reports across inventory, purchasing and sales. Every report is read-only and shows
                        the same figures as its source pages.
                    </p>
                </div>

                {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reports are available for your role.</p>
                ) : (
                    <div className="flex flex-col gap-8">
                        {groups.map((group) => (
                            <section key={group.name} className="flex flex-col gap-3">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground dark:text-primary">
                                    {group.name}
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {group.reports.map((report) => (
                                        <Link
                                            key={report.title}
                                            href={report.href}
                                            className="group flex flex-col gap-2 rounded-lg border p-4 dark:bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                            <span className="text-sm font-medium">{report.title}</span>
                                            <span className="text-xs text-muted-foreground">{report.description}</span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Reports', href: ReportRoutes.index().url },
    ],
};
