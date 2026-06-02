import { AlertTriangle, CheckCircle2, Check, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayrollEntries } from "@/features/company-admin/api/use-payroll-run-queries";
import { useOverridePayrollEntry } from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; badge: string; border: string; bg: string }> = {
    critical: { label: "Critical", badge: "bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800", border: "border-danger-200 dark:border-danger-800", bg: "bg-danger-50/50 dark:bg-danger-900/10" },
    warning: { label: "Warning", badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800", border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50/50 dark:bg-amber-900/10" },
    info: { label: "Info", badge: "bg-info-100 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800", border: "border-info-200 dark:border-info-800", bg: "bg-info-50/50 dark:bg-info-900/10" },
};

function categorizeException(exc: any): string {
    const type = (exc.exceptionType ?? exc.category ?? "").toLowerCase();
    if (type.includes("critical") || type.includes("missing") || type.includes("error")) return "critical";
    if (type.includes("warning") || type.includes("mismatch") || type.includes("late")) return "warning";
    return "info";
}

export function Step2PayrollExceptions({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const entriesQuery = usePayrollEntries(runId);
    const overrideMutation = useOverridePayrollEntry();

    const entries: any[] = entriesQuery.data?.data ?? [];
    const exceptions = entries.filter((e: any) => e.isException);

    // Also pull from runDetail.exceptions if available
    const allExceptions = runDetail?.exceptions?.length ? runDetail.exceptions : exceptions;

    // Group by category
    const grouped: Record<string, any[]> = { critical: [], warning: [], info: [] };
    allExceptions.forEach((exc: any) => {
        const cat = categorizeException(exc);
        grouped[cat].push(exc);
    });

    const counts = {
        critical: grouped.critical.length,
        warning: grouped.warning.length,
        info: grouped.info.length,
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-warning-600 dark:text-warning-400" />
                </div>
                <div>
                    <h3 className="font-bold text-primary-950 dark:text-white">Step 2: Review Exceptions</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Review and resolve attendance exceptions before computing salaries</p>
                </div>
            </div>

            {entriesQuery.isLoading ? (
                <SkeletonTable rows={5} cols={5} />
            ) : allExceptions.length === 0 ? (
                <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl p-6 border border-success-100 dark:border-success-800/50 text-center">
                    <Check size={24} className="text-success-600 dark:text-success-400 mx-auto mb-2" />
                    <p className="font-bold text-success-700 dark:text-success-400">No exceptions found</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">All attendance records are clean</p>
                </div>
            ) : (
                <>
                    {/* Summary counts bar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {counts.critical > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800">
                                {counts.critical} Critical
                            </span>
                        )}
                        {counts.warning > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                {counts.warning} Warning
                            </span>
                        )}
                        {counts.info > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-info-100 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800">
                                {counts.info} Info
                            </span>
                        )}
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                            {allExceptions.length} total exception(s)
                        </span>
                    </div>

                    {/* Exception cards grouped by category */}
                    {(["critical", "warning", "info"] as const).map((cat) => {
                        const items = grouped[cat];
                        if (items.length === 0) return null;
                        const config = CATEGORY_CONFIG[cat];
                        return (
                            <div key={cat} className="space-y-2">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{config.label}</h4>
                                <div className={cn("rounded-xl border divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden", config.border, config.bg)}>
                                    {items.map((exc: any, idx: number) => {
                                        const excType = (exc.exceptionType ?? exc.type ?? "Exception").replace(/_/g, " ");
                                        const excDescription = exc.description ?? exc.note ?? null;
                                        const empName = exc.employeeName ?? [exc.employee?.firstName, exc.employee?.lastName].filter(Boolean).join(" ") ?? null;
                                        return (
                                        <div key={exc.id ?? idx} className="flex items-center justify-between px-4 py-3 gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", config.badge)}>
                                                        {excType}
                                                    </span>
                                                    {empName && (
                                                        <span className="text-xs font-bold text-primary-950 dark:text-white">{empName}</span>
                                                    )}
                                                </div>
                                                {excDescription ? (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{excDescription}</p>
                                                ) : exc.daysAffected ? (
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{exc.daysAffected} day(s) affected</p>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {cat === "critical" && !exc.resolved && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-600 dark:text-danger-400 cursor-pointer hover:underline">
                                                        <ExternalLink size={10} />
                                                        Resolve
                                                    </span>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await overrideMutation.mutateAsync({ runId, entryId: exc.id, data: { action: "accept" } });
                                                            showSuccess("Exception Resolved", "Exception has been accepted.");
                                                        } catch (err) { showApiError(err); }
                                                    }}
                                                    disabled={exc.resolved || overrideMutation.isPending}
                                                    className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                                                >
                                                    {exc.resolved ? "Resolved" : "Accept"}
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {completedStep === 1 && (() => {
                const unresolvedCritical = grouped.critical.filter((e: any) => !e.resolved).length;
                return (
                    <div className="mt-4 flex items-center gap-3">
                        <div className="relative group">
                            <button onClick={onStepAction} disabled={anyMutating} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Mark All Reviewed
                            </button>
                            {unresolvedCritical > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-danger-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                    {unresolvedCritical} unresolved critical exception{unresolvedCritical > 1 ? "s" : ""}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-danger-900" />
                                </div>
                            )}
                        </div>
                        {unresolvedCritical > 0 && (
                            <span className="text-xs font-semibold text-danger-600 dark:text-danger-400">
                                <AlertTriangle size={12} className="inline mr-1" />
                                {unresolvedCritical} critical exception{unresolvedCritical > 1 ? "s" : ""} unresolved
                            </span>
                        )}
                    </div>
                );
            })()}
            {completedStep > 1 && (
                <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                    <Check size={16} />
                    <span className="text-sm font-bold">Exceptions reviewed</span>
                </div>
            )}
        </div>
    );
}
