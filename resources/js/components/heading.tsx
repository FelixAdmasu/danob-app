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
                    <p className="text-muted-foreground text-sm">
                        {description}
                    </p>
                )}
            </header>
        );
    }

    return (
        <header className="border-border flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5">
                {eyebrow && (
                    <p className="text-muted-foreground dark:text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-serif text-[28px] leading-tight font-medium tracking-tight md:text-[32px]">
                    {title}
                </h2>
                {description && (
                    <p className="text-muted-foreground max-w-2xl text-sm">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
