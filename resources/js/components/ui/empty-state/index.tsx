import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = InboxIcon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
            <Icon className="h-12 w-12 text-neutral-400 dark:text-neutral-600" />
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                {title}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
