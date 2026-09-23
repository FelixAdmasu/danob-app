import { cn } from '@/lib/utils';

export type ChartDatum = {
    label: string;
    value: number;
    /** Readout shown on the right (e.g. a currency string); falls back to `value`. */
    displayValue?: string;
    /** Secondary line under the label (e.g. "12 orders"). */
    meta?: string;
    /** CSS color (hex or var()). Defaults to the `--chart-N` series rotation. */
    color?: string;
};

const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const seriesAt = (i: number) => SERIES[i % SERIES.length];

function totalOf(data: ChartDatum[]) {
    return data.reduce((sum, d) => sum + (Number.isFinite(d.value) ? d.value : 0), 0);
}

/**
 * Donut / ring chart in pure SVG (no chart library).
 *
 * Segments use `pathLength={100}` so dash math is percentage-based and
 * resolution-independent. Colors come from the theme's `--chart-*` tokens by
 * default (foundation green ramp in light, approved violet ramp in dark) or
 * from semantic `--viz-*` tokens passed per datum.
 */
export function DonutChart({
    data,
    size = 168,
    thickness = 22,
    centerValue,
    centerLabel,
    showLegend = true,
    emptyText = 'No data yet.',
    className,
}: {
    data: ChartDatum[];
    size?: number;
    thickness?: number;
    centerValue?: string | number;
    centerLabel?: string;
    showLegend?: boolean;
    emptyText?: string;
    className?: string;
}) {
    const total = totalOf(data);
    const r = (size - thickness) / 2;
    const visible = data.filter((d) => d.value > 0);

    if (total <= 0 || visible.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-2 py-6 text-sm text-muted-foreground', className)}>
                <div
                    className="rounded-full border-2 border-dashed border-border"
                    style={{ width: size * 0.6, height: size * 0.6 }}
                    aria-hidden="true"
                />
                <p>{emptyText}</p>
            </div>
        );
    }

    let offset = 0;
    const gap = 1; // percent units of breathing room between slices

    return (
        <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6', className)}>
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel ?? 'Chart'}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth={thickness}
                    />
                    <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                        {visible.map((d, i) => {
                            const pct = (d.value / total) * 100;
                            const segment = Math.max(pct - gap, 0.5);
                            const dashOffset = -offset;
                            offset += pct;
                            return (
                                <circle
                                    key={d.label}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    pathLength={100}
                                    stroke={d.color ?? seriesAt(i)}
                                    strokeWidth={thickness}
                                    strokeDasharray={`${segment} ${100 - segment}`}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="butt"
                                />
                            );
                        })}
                    </g>
                </svg>
                {(centerValue !== undefined || centerLabel) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        {centerValue !== undefined && (
                            <span className="font-serif text-2xl leading-none font-medium tracking-tight tabular-nums">
                                {centerValue}
                            </span>
                        )}
                        {centerLabel && (
                            <span className="mt-1.5 max-w-[80%] text-[9px] font-bold uppercase leading-3 tracking-[0.22em] text-muted-foreground">
                                {centerLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {showLegend && (
                <ul className="flex w-full min-w-0 flex-col gap-2.5">
                    {data.map((d, i) => (
                        <li key={d.label} className="flex items-center gap-2.5 text-xs">
                            <span
                                className="size-2.5 shrink-0 rounded-full ring-1 ring-border"
                                style={{ background: d.color ?? seriesAt(i) }}
                                aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
                            <span className="shrink-0 font-medium tabular-nums text-foreground">{d.displayValue ?? d.value}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * Horizontal ranked bars with label + value rows — used for top customers,
 * suppliers by spend, movement mixes, etc. Bars grow once on mount via the
 * shared `bar-grow` keyframe with a small per-row stagger.
 */
export function BarList({
    data,
    max,
    emptyText = 'No data yet.',
    className,
}: {
    data: ChartDatum[];
    max?: number;
    emptyText?: string;
    className?: string;
}) {
    const peak = max ?? Math.max(1, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));

    if (data.length === 0) {
        return <p className={cn('py-6 text-center text-sm text-muted-foreground', className)}>{emptyText}</p>;
    }

    return (
        <ul className={cn('flex flex-col gap-4', className)}>
            {data.map((d, i) => {
                const pct = peak > 0 ? Math.min(100, Math.max(0, ((Number.isFinite(d.value) ? d.value : 0) / peak) * 100)) : 0;
                return (
                    <li key={d.label} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="min-w-0 truncate font-medium text-foreground">
                                {d.label}
                                {d.meta && <span className="ml-2 font-normal text-muted-foreground">{d.meta}</span>}
                            </span>
                            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                                {d.displayValue ?? d.value}
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${pct}%`,
                                    background: d.color ?? seriesAt(i),
                                    animation: 'bar-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
                                    animationDelay: `${i * 60}ms`,
                                }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
