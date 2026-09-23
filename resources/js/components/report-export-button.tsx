import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ExportFilterValue = string | number | null | undefined;

type ReportExportButtonProps = {
    /** The report's export route (wayfinder), e.g. sales.export().url. */
    url: string;
    /** The filters the page was rendered with (APPLIED values, not pending input). */
    filters: Record<string, ExportFilterValue>;
};

/**
 * "Export CSV" control shown beside a report's Filter/Clear buttons.
 *
 * The download URL is built from the page's APPLIED filters — the exact
 * values driving the visible table — so the file always matches what the
 * user is looking at instead of silently exporting a wider dataset. A
 * native link keeps it keyboard accessible with visible text plus a
 * Download icon; the server sets the CSV filename and attachment headers,
 * so user input never reaches the filename.
 */
export function ReportExportButton({ url, filters }: ReportExportButtonProps) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return;
        }

        query.set(key, String(value));
    });

    const search = query.toString();

    return (
        <Button type="button" variant="outline" asChild>
            <a href={search ? `${url}?${search}` : url}>
                <Download aria-hidden="true" />
                Export CSV
            </a>
        </Button>
    );
}
