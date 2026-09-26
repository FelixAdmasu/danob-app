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
            <header className="space-y-1">
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
        <header className="border-border flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
                {eyebrow && (
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.24em] uppercase dark:text-[#7FB069]">
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-serif text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">
                    {title}
                </h2>
                {description && (
                    <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
                    {actions}
                </div>
            )}
        </header>
    );
}
