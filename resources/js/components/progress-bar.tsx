import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONE_FILL: Record<Tone, string> = {
    primary: 'bg-primary',
    success: 'bg-[#4A8C2A] dark:bg-[#95E6B6]',
    warning: 'bg-amber-500 dark:bg-[#BF9FEF]',
    danger: 'bg-red-500 dark:bg-red-400',
    info: 'bg-[#2D5016] dark:bg-[#A16AE8]',
};

/**
 * Foundation progress meter: sage track, green (light) / violet (dark) fill,
 * optional micro-label + percentage readout. The fill grows once on mount via
 * the shared `bar-grow` keyframe (reduced-motion safe — see app.css).
 */
export function ProgressBar({
    value,
    max = 100,
    label,
    tone = 'primary',
    showValue = false,
    valueLabel,
    className,
    barClassName,
}: {
    value: number;
    max?: number;
    label?: string;
    tone?: Tone;
    showValue?: boolean;
    /** Overrides the right-hand readout (e.g. "12 / 40"); falls back to rounded %. */
    valueLabel?: string;
    className?: string;
    barClassName?: string;
}) {
    const safeMax = max > 0 ? max : 0;
    const pct = safeMax > 0 ? Math.min(100, Math.max(0, (value / safeMax) * 100)) : 0;

    return (
        <div className={cn('flex w-full flex-col gap-1.5', className)}>
            {(label || showValue) && (
                <div className="flex items-baseline justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {label && <span className="truncate text-muted-foreground">{label}</span>}
                    {showValue && (
                        <span className="shrink-0 tabular-nums text-foreground/80">
                            {valueLabel ?? `${Math.round(pct)}%`}
                        </span>
                    )}
                </div>
            )}
            <div
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
                <div
                    className={cn('h-full rounded-full', TONE_FILL[tone], barClassName)}
                    style={{ width: `${pct}%`, animation: 'bar-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both' }}
                />
            </div>
        </div>
    );
}
