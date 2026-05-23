import { cn } from '@/lib/utils';

const OPERATIONAL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    RUNNING: { label: 'Running', color: 'text-success-700 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50' },
    IDLE: { label: 'Idle', color: 'text-neutral-600 dark:text-neutral-300', bg: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' },
    BREAKDOWN: { label: 'Breakdown', color: 'text-danger-700 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50' },
    SHUTDOWN: { label: 'Shutdown', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50' },
    INACTIVE: { label: 'Inactive', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700' },
    RETIRED: { label: 'Retired', color: 'text-neutral-500 dark:text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700' },
};

const MAINTENANCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    NO_ACTION: { label: 'No Action', color: 'text-neutral-600 dark:text-neutral-300', bg: 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' },
    PM_DUE: { label: 'PM Due', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
    WAITING_PARTS: { label: 'Waiting Parts', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50' },
    CLOSED: { label: 'Closed', color: 'text-success-700 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50' },
};

function StatusBadge({ status, configMap }: { status: string; configMap: Record<string, { label: string; color: string; bg: string }> }) {
    const config = configMap[status];
    if (config) {
        return (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', config.color, config.bg)}>
                {config.label}
            </span>
        );
    }
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
            {(status || 'unknown').replace(/_/g, ' ').toLowerCase()}
        </span>
    );
}

export function AssetOperationalBadge({ status }: { status: string }) {
    return <StatusBadge status={status} configMap={OPERATIONAL_CONFIG} />;
}

export function AssetMaintenanceBadge({ status }: { status: string }) {
    return <StatusBadge status={status} configMap={MAINTENANCE_CONFIG} />;
}

export function AssetStatusBadge({ operationalStatus, maintenanceStatus }: { operationalStatus: string; maintenanceStatus?: string }) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <AssetOperationalBadge status={operationalStatus} />
            {maintenanceStatus && <AssetMaintenanceBadge status={maintenanceStatus} />}
        </div>
    );
}
