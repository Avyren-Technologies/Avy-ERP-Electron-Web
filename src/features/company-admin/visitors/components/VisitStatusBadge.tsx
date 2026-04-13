import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PRE_REGISTERED: { label: "Pre-Registered", color: "text-info-700 dark:text-info-400", bg: "bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50" },
    APPROVED: { label: "Approved", color: "text-primary-700 dark:text-primary-400", bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50" },
    EXPECTED: { label: "Expected", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50" },
    ARRIVED: { label: "Arrived", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50" },
    CHECKED_IN: { label: "Checked In", color: "text-success-700 dark:text-success-400", bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50" },
    CHECKED_OUT: { label: "Checked Out", color: "text-neutral-600 dark:text-neutral-300", bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
    NO_SHOW: { label: "No Show", color: "text-neutral-500", bg: "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700" },
    CANCELLED: { label: "Cancelled", color: "text-neutral-500", bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
    REJECTED: { label: "Rejected", color: "text-danger-700 dark:text-danger-400", bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50" },
    AUTO_CHECKED_OUT: { label: "Auto Checked Out", color: "text-neutral-600 dark:text-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
    OVERSTAY: { label: "Overstay", color: "text-warning-700 dark:text-warning-400", bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50" },
    PENDING_APPROVAL: { label: "Pending Approval", color: "text-warning-700 dark:text-warning-400", bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50" },
};

export function VisitStatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status];
    if (config) {
        return (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", config.color, config.bg)}>
                {config.label.toLowerCase()}
            </span>
        );
    }
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
            {(status || "unknown").replace(/_/g, " ").toLowerCase()}
        </span>
    );
}
