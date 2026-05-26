import { cn } from '@/lib/utils';

const WO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Draft', color: 'text-neutral-600 dark:text-neutral-300', bg: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' },
    PLANNED: { label: 'Planned', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
    APPROVED: { label: 'Approved', color: 'text-primary-700 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50' },
    ASSIGNED: { label: 'Assigned', color: 'text-accent-700 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50' },
    ACKNOWLEDGED: { label: 'Acknowledged', color: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/50' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
    ON_HOLD: { label: 'On Hold', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50' },
    COMPLETED: { label: 'Completed', color: 'text-success-700 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50' },
    QA_REVIEW: { label: 'QA Review', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
    QA_RELEASED: { label: 'QA Released', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
    CLOSED: { label: 'Closed', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700' },
    REJECTED: { label: 'Rejected', color: 'text-danger-700 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50' },
    CANCELLED: { label: 'Cancelled', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700' },
    DECLINED: { label: 'Declined', color: 'text-danger-700 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50' },
};

export function WOStatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
    const config = WO_STATUS_CONFIG[status];
    const sizeClass = size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5';
    if (config) {
        return (
            <span className={cn(sizeClass, 'font-bold rounded-full border capitalize', config.color, config.bg)}>
                {config.label}
            </span>
        );
    }
    return (
        <span className={cn(sizeClass, 'font-bold rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700')}>
            {(status || 'unknown').replace(/_/g, ' ').toLowerCase()}
        </span>
    );
}

export function WOTypeBadge({ type }: { type: string }) {
    const label = (type || '').replace(/_/g, ' ');
    const isPreventive = type === 'PREVENTIVE' || type === 'PM';
    const isCorrective = type === 'CORRECTIVE' || type === 'BREAKDOWN';
    return (
        <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize',
            isPreventive
                ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50'
                : isCorrective
                    ? 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50'
                    : 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50',
        )}>
            {label}
        </span>
    );
}
