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
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
                {eyebrow && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground dark:text-primary">
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-serif text-[32px] leading-tight font-medium tracking-tight md:text-[40px]">
                    {title}
                </h2>
                {description && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
            )}
        </header>
    );
}
