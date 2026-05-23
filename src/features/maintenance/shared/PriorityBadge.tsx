import { cn } from '@/lib/utils';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    EMERGENCY: { label: 'Emergency', color: 'text-danger-700 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50' },
    HIGH: { label: 'High', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50' },
    MEDIUM: { label: 'Medium', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
    LOW: { label: 'Low', color: 'text-neutral-600 dark:text-neutral-300', bg: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' },
};

export function PriorityBadge({ priority }: { priority: string }) {
    const config = PRIORITY_CONFIG[priority];
    if (config) {
        return (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', config.color, config.bg)}>
                {config.label}
            </span>
        );
    }
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
            {(priority || 'unknown').replace(/_/g, ' ').toLowerCase()}
        </span>
    );
}
