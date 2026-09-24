import { Loader2Icon } from 'lucide-react';

interface LoadingStateProps {
    className?: string;
}

export function LoadingState({ className = '' }: LoadingStateProps) {
    return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
            <Loader2Icon className="h-8 w-8 animate-spin text-neutral-400 dark:text-[#9DAE8E]" />
        </div>
    );
}

export function LoadingCard() {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
            <div className="mb-4 h-4 w-24 rounded-full bg-neutral-200 animate-pulse dark:bg-[#33452A]" />
            <div className="space-y-3">
                <div className="h-3 w-full rounded bg-neutral-100 animate-pulse dark:bg-[#26331C]" />
                <div className="h-3 w-3/4 rounded bg-neutral-100 animate-pulse dark:bg-[#26331C]" />
                <div className="h-3 w-1/2 rounded bg-neutral-100 animate-pulse dark:bg-[#26331C]" />
            </div>
        </div>
    );
}
