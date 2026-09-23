import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
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
                <Heading
                    eyebrow="Reporting"
                    title="Reports"
                    description="Operational reports across inventory, purchasing and sales. Every report is read-only and shows the same figures as its source pages."
                />

                {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reports are available for your role.</p>
                ) : (
                    <div className="flex flex-col gap-8">
                        {groups.map((group) => (
                            <section key={group.name} className="flex flex-col gap-3">
                                <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground dark:text-primary">
                                    {group.name}
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {group.reports.map((report) => (
                                        <Link
                                            key={report.title}
                                            href={report.href}
                                            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm dark:shadow-none"
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
