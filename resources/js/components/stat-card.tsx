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
    progress?: { value: number; max?: number; label?: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' };
    className?: string;
}) {
    return (
        <div
            className={cn(
                'group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(7,14,1,0.04),0_16px_40px_-24px_rgba(7,14,1,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_2px_4px_rgba(7,14,1,0.05),0_24px_48px_-24px_rgba(45,80,22,0.28)] dark:shadow-none',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-muted-foreground">{label}</p>
                {Icon && (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-4" aria-hidden="true" />
                    </span>
                )}
            </div>
            <p className={cn('font-serif text-3xl leading-none font-medium tracking-tight tabular-nums', TONE_VALUE[tone])}>
                {value}
            </p>
            {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
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
