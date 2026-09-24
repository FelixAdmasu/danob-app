import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = InboxIcon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center dark:border-[#26331C] dark:bg-[#111B0A]">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 dark:border-[#26331C] dark:bg-[#18240F] dark:text-[#9DAE8E]">
                <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold text-neutral-900 dark:text-foreground">
                {title}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
