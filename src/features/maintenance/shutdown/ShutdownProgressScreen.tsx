import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Wrench, CheckCircle, Clock, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShutdown, useShutdownProgress } from "@/features/maintenance/api/use-maintenance-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";

/* ── Status colors ── */

const WO_STATUS_COLORS: Record<string, { bar: string; label: string }> = {
    DRAFT: { bar: "bg-neutral-300 dark:bg-neutral-600", label: "Draft" },
    PLANNED: { bar: "bg-blue-400 dark:bg-blue-600", label: "Planned" },
    APPROVED: { bar: "bg-blue-500 dark:bg-blue-500", label: "Approved" },
    ASSIGNED: { bar: "bg-indigo-400 dark:bg-indigo-600", label: "Assigned" },
    ACKNOWLEDGED: { bar: "bg-indigo-500 dark:bg-indigo-500", label: "Acknowledged" },
    IN_PROGRESS: { bar: "bg-warning-400 dark:bg-warning-600", label: "In Progress" },
    ON_HOLD: { bar: "bg-amber-400 dark:bg-amber-600", label: "On Hold" },
    COMPLETED: { bar: "bg-success-400 dark:bg-success-600", label: "Completed" },
    AWAITING_QA: { bar: "bg-violet-400 dark:bg-violet-600", label: "Awaiting QA" },
    CLOSED: { bar: "bg-neutral-400 dark:bg-neutral-500", label: "Closed" },
    REJECTED: { bar: "bg-danger-400 dark:bg-danger-600", label: "Rejected" },
    CANCELLED: { bar: "bg-danger-300 dark:bg-danger-700", label: "Cancelled" },
};

/* ── Screen ── */

export function ShutdownProgressScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();

    const { data, isLoading } = useShutdown(id ?? "");
    const shutdown: any = data?.data ?? {};

    const { data: progressData, isLoading: progressLoading } = useShutdownProgress(id ?? "");
    const progress: any = progressData?.data ?? {};

    const shutdownWOs: any[] = shutdown.workOrders ?? shutdown.shutdownWorkOrders ?? [];

    // Calculate stats
    const statusCounts: Record<string, number> = {};
    shutdownWOs.forEach((wo: any) => {
        const s = (wo.workOrder ?? wo).status ?? "UNKNOWN";
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    });

    const total = shutdownWOs.length || 1;
    const completedCount = (statusCounts["COMPLETED"] ?? 0) + (statusCounts["CLOSED"] ?? 0);
    const completionPct = progress.completionPct ?? Math.round((completedCount / total) * 100);
    const budget = shutdown.estimatedBudget ? Number(shutdown.estimatedBudget) : 0;
    const actual = shutdown.actualCost ? Number(shutdown.actualCost) : progress.actualCost ? Number(progress.actualCost) : 0;
    const budgetPct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0;

    if (isLoading || progressLoading) return <SkeletonTable rows={6} cols={3} />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><ArrowLeft size={18} /></button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white flex items-center gap-2">
                        <BarChart3 size={22} className="text-primary-600" />
                        Progress - {shutdown.name ?? "Shutdown"}
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {shutdown.plannedStart ? fmt.date(shutdown.plannedStart) : ""} - {shutdown.plannedEnd ? fmt.date(shutdown.plannedEnd) : ""}
                    </p>
                </div>
                <Link to={`/app/maintenance/shutdown/${id}`} className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    Back to Detail
                </Link>
            </div>

            {/* Completion Ring */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-4">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-200 dark:text-neutral-700" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${completionPct} ${100 - completionPct}`} strokeLinecap="round" className="text-primary-600" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary-950 dark:text-white">{completionPct}%</span>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Overall Completion</p>
                    <p className="text-xs text-neutral-400 mt-1">{completedCount} / {shutdownWOs.length} work orders done</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1"><Wrench size={12} /> WO Status Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(statusCounts).sort(([, a], [, b]) => b - a).map(([s, count]) => {
                            const cfg = WO_STATUS_COLORS[s] ?? { bar: "bg-neutral-400", label: s };
                            return (
                                <div key={s}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{cfg.label}</span>
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{count} ({Math.round((count / total) * 100)}%)</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                        <div className={cn("h-2 rounded-full transition-all", cfg.bar)} style={{ width: `${(count / total) * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Budget vs Actual */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1"><DollarSign size={12} /> Budget vs Actual</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-neutral-500">Budget</span>
                                    <span className="text-sm font-bold text-primary-950 dark:text-white">{budget ? budget.toLocaleString() : "---"}</span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-primary-500" style={{ width: "100%" }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-neutral-500">Actual</span>
                                    <span className={cn("text-sm font-bold", budgetPct > 100 ? "text-danger-600" : "text-success-600")}>{actual ? actual.toLocaleString() : "---"}</span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                    <div className={cn("h-2 rounded-full transition-all", budgetPct > 100 ? "bg-danger-500" : "bg-success-500")} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                        {budgetPct > 100 && (
                            <p className="text-xs text-danger-600 mt-2 font-medium">Over budget by {(budgetPct - 100)}%</p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1"><Clock size={12} /> Timeline</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-neutral-500">Planned Start</span><span className="font-medium text-neutral-700 dark:text-neutral-300">{shutdown.plannedStart ? fmt.date(shutdown.plannedStart) : "---"}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">Planned End</span><span className="font-medium text-neutral-700 dark:text-neutral-300">{shutdown.plannedEnd ? fmt.date(shutdown.plannedEnd) : "---"}</span></div>
                            {shutdown.actualStart && <div className="flex justify-between"><span className="text-neutral-500">Actual Start</span><span className="font-medium text-success-600">{fmt.date(shutdown.actualStart)}</span></div>}
                            {shutdown.actualEnd && <div className="flex justify-between"><span className="text-neutral-500">Actual End</span><span className="font-medium text-success-600">{fmt.date(shutdown.actualEnd)}</span></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
