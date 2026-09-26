import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}

/**
 * Friendly empty state with sage-themed styling.
 * Centered illustration, clear heading, description, and optional CTA.
 */
export function EmptyState({ icon: Icon = InboxIcon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#26331C] bg-[#111B0A] p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#26331C] bg-[#18240F] text-[#9DAE8E]">
                <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-serif text-lg font-semibold text-foreground">
                {title}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-[#9DAE8E] leading-relaxed">
                {description}
            </p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
