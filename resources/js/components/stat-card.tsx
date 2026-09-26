import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

// Soft tinted icon chips (TailAdmin metric-card anatomy).
const METRIC_CHIP: Record<MetricTone, string> = {
    default:
        'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground',
    success:
        'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    warning:
        'bg-[#F0B429]/15 text-[#92400E] group-hover:bg-[#F0B429] group-hover:text-[#422006] dark:bg-[#2A2411] dark:text-[#F0B429] dark:group-hover:bg-[#F0B429] dark:group-hover:text-[#422006]',
    danger: 'bg-destructive/10 text-[#B42318] group-hover:bg-destructive group-hover:text-white dark:bg-destructive/60 dark:text-white dark:group-hover:bg-destructive',
    info: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
};

/**
 * TailAdmin-style KPI tile.
 *
 * Anatomy: icon chip → label + bold value row with an optional
 * trend pill → optional caption → optional progress meter.
 * Shared across every dashboard and report page so the admin
 * surfaces all share the same component language.
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    hint,
    progress,
    trend,
    className,
}: {
    label: string;
    value: ReactNode;
    icon?: LucideIcon;
    tone?: MetricTone;
    hint?: ReactNode;
    progress?: {
        value: number;
        max?: number;
        label?: string;
        tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    };
    /** Optional trend pill, e.g. { value: "+11.01%", variant: "success" }. */
    trend?: { value: string; variant?: 'success' | 'warning' };
    className?: string;
}) {
    return (
        <div
            className={cn(
                'group border-border bg-card hover:border-primary/30 relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm md:p-6 dark:shadow-none',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                {Icon && (
                    <span
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                            METRIC_CHIP[tone],
                        )}
                    >
                        <Icon className="size-6" aria-hidden="true" />
                    </span>
                )}
                {trend && (
                    <Badge
                        variant={trend.variant ?? 'success'}
                        className="shrink-0"
                    >
                        {trend.variant === 'warning' ? (
                            <TrendingDown className="size-3" />
                        ) : (
                            <TrendingUp className="size-3" />
                        )}
                        {trend.value}
                    </Badge>
                )}
            </div>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <h4
                        className={cn(
                            'mt-2 text-xl leading-none font-bold tracking-tight tabular-nums',
                            {
                                'text-[#2D5016] dark:text-[#95E6B6]':
                                    tone === 'success',
                                'text-amber-600 dark:text-[#F0B429]':
                                    tone === 'warning',
                                'text-red-600 dark:text-red-400':
                                    tone === 'danger',
                                'text-foreground':
                                    tone === 'default' || tone === 'info',
                            },
                        )}
                    >
                        {value}
                    </h4>
                </div>
            </div>
            {hint && (
                <p className="text-muted-foreground text-xs leading-5">
                    {hint}
                </p>
            )}
            {progress && (
                <ProgressBar
                    value={progress.value}
                    max={progress.max}
                    label={progress.label}
                    tone={progress.tone ?? 'primary'}
                    showValue
                />
            )}
        </div>
    );
}
