import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { ProgressBar } from '@/components/progress-bar';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const TONE_VALUE: Record<Tone, string> = {
    default: 'text-foreground',
    success: 'text-[#2D5016] dark:text-[#95E6B6]',
    warning: 'text-amber-600 dark:text-[#F0B429]',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-[#2D5016] dark:text-[#7FB069]',
};

/**
 * KPI tile used across every dashboard and report summary.
 *
 * Anatomy: micro-label + optional icon chip (sage → primary on hover),
 * oversized Playfair value, optional hint line and optional progress meter.
 * Matches the public site's card language: white surface, hairline border,
 * hairline radius, gentle lift on hover.
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    hint,
    progress,
    className,
}: {
    label: string;
    value: ReactNode;
    icon?: LucideIcon;
    tone?: Tone;
    hint?: ReactNode;
    progress?: {
        value: number;
        max?: number;
        label?: string;
        tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    };
    className?: string;
}) {
    return (
        <div
            className={cn(
                'group border-border bg-card hover:border-primary/30 relative flex flex-col gap-3 overflow-hidden rounded-xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:shadow-none',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-[11px] leading-4 font-semibold tracking-[0.18em] uppercase">
                    {label}
                </p>
                {Icon && (
                    <span className="bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200">
                        <Icon className="size-4" aria-hidden="true" />
                    </span>
                )}
            </div>
            <p
                className={cn(
                    'font-serif text-3xl leading-none font-medium tracking-tight tabular-nums',
                    TONE_VALUE[tone],
                )}
            >
                {value}
            </p>
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
