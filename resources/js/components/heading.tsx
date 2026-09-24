import type { ReactNode } from 'react';

export default function Heading({
    title,
    description,
    eyebrow,
    actions,
    variant = 'default',
}: {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
    variant?: 'default' | 'small';
}) {
    if (variant === 'small') {
        return (
            <header className="space-y-0.5">
                <h2 className="font-serif text-xl font-semibold tracking-tight">
                    {title}
                </h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </header>
        );
    }

    return (
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
                {eyebrow && (
                    <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.3em] text-primary uppercase dark:text-[#7FB069]">
                        <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-serif text-[34px] leading-[1.1] font-medium tracking-tight md:text-[44px]">
                    {title}
                </h2>
                {description && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
            )}
        </header>
    );
}
