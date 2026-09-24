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
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2.5">
                {eyebrow && (
                    <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.3em] text-primary uppercase dark:text-[#8FBF74]">
                        <span
                            aria-hidden="true"
                            className="h-px w-7 shrink-0 bg-primary/45 dark:bg-[#7FB069]/40"
                        />
                        {eyebrow}
                    </p>
                )}
                <h2 className="font-serif text-[32px] leading-[1.12] font-semibold tracking-tight md:text-[40px]">
                    {title}
                </h2>
                {description && (
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
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
