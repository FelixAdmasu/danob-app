import { AlertTriangleIcon } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title = 'Something went wrong',
    description = 'An unexpected error occurred. Please try again.',
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
            <AlertTriangleIcon className="h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-100">
                {title}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {description}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
