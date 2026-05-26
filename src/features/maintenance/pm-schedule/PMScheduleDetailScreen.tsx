import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    X,
    CalendarClock,
    SkipForward,
    Wrench,
    Edit,
    Clock,
    History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePMSchedule } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useReschedulePM,
    useSkipPM,
    useGenerateWOFromPM,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { showSuccess, showApiError } from "@/lib/toast";
import {
    formatPMFrequencyDisplay,
    formatPMScheduleTypeLabel,
    formatPMStrategyLabel,
    formatPMRescheduleReason,
    getPMRescheduleNewDate,
    getPMRescheduleOldDate,
    getPMRescheduleTimestamp,
    type PMRescheduleHistoryEntry,
} from "@/features/maintenance/pm-schedule/pm-schedule-form";
import { resolveMaintenanceAssetNumber } from "@/features/maintenance/shared/maintenance-asset-display";

/* ── Screen ── */

export function PMScheduleDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canManage = useCanPerform("maintenance.pm-schedule:update");

    const [modal, setModal] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [skipReason, setSkipReason] = useState("");

    const { data, isLoading, isError } = usePMSchedule(id!);
    const pm: any = data?.data ?? null;

    const rescheduleMutation = useReschedulePM();
    const skipMutation = useSkipPM();
    const generateMutation = useGenerateWOFromPM();

    const handleReschedule = async () => {
        if (!rescheduleDate) return;
        try {
            await rescheduleMutation.mutateAsync({ id: id!, data: { newDueDate: rescheduleDate, reasonCode: "OTHER" } });
            showSuccess("Rescheduled", "PM schedule rescheduled.");
            setModal(null);
            setRescheduleDate("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSkip = async () => {
        if (!skipReason.trim()) return;
        try {
            await skipMutation.mutateAsync({ id: id!, data: { reason: skipReason.trim() } });
            showSuccess("Skipped", "PM occurrence skipped.");
            setModal(null);
            setSkipReason("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleGenerateWO = async () => {
        try {
            await generateMutation.mutateAsync({ id: id! });
            showSuccess("Generated", "Work order generated from PM schedule.");
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (isError || !pm) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-neutral-500 dark:text-neutral-400">PM schedule not found.</p>
                <button onClick={() => navigate("/app/maintenance/pm-schedules")} className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">
                    Back to PM Schedules
                </button>
            </div>
        );
    }

    const isOverdue = pm.nextDueDate && new Date(pm.nextDueDate) < new Date();
    const daysUntilDue = pm.nextDueDate
        ? Math.ceil((new Date(pm.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const recentWOs: any[] = pm.workOrders ?? [];
    const rescheduleHistory: any[] = pm.rescheduleHistory ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => navigate("/app/maintenance/pm-schedules")}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors mt-1"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn(
                                "text-xs font-bold px-3 py-1 rounded-full border capitalize",
                                isOverdue
                                    ? "text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50"
                                    : pm.status === "SUSPENDED"
                                        ? "text-neutral-500 bg-neutral-100 border-neutral-200 dark:text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700"
                                        : "text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50"
                            )}>
                                {isOverdue ? "Overdue" : pm.status || "Active"}
                            </span>
                            <StrategyBadge type={pm.strategyType} />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">{pm.name}</h1>
                    </div>
                </div>

                {/* Actions */}
                {canManage && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setModal("reschedule")} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
                            <CalendarClock className="w-4 h-4" /> Reschedule
                        </button>
                        <button onClick={() => setModal("skip")} className="inline-flex items-center gap-2 bg-warning-500 hover:bg-warning-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
                            <SkipForward className="w-4 h-4" /> Skip
                        </button>
                        <button onClick={handleGenerateWO} disabled={generateMutation.isPending} className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                            {generateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Wrench className="w-4 h-4" />}
                            Generate WO
                        </button>
                        <Link
                            to={`/app/maintenance/pm-schedules/new?editId=${id}`}
                            className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </Link>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Next Due Countdown */}
                    <div className={cn(
                        "rounded-2xl border p-6",
                        isOverdue
                            ? "bg-danger-50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800/50"
                            : "bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800"
                    )}>
                        <div className="flex items-center gap-3 mb-2">
                            <Clock size={20} className={isOverdue ? "text-danger-600" : "text-primary-600"} />
                            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Next Due</h3>
                        </div>
                        <p className={cn("text-3xl font-bold", isOverdue ? "text-danger-600 dark:text-danger-400" : "text-primary-950 dark:text-white")}>
                            {pm.nextDueDate ? fmt.date(pm.nextDueDate) : "Not scheduled"}
                        </p>
                        {daysUntilDue !== null && (
                            <p className={cn("text-sm mt-1", isOverdue ? "text-danger-600 dark:text-danger-400" : "text-neutral-500 dark:text-neutral-400")}>
                                {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days from now`}
                            </p>
                        )}
                    </div>

                    {/* Recent Work Orders */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Recent Work Orders</h3>
                        {recentWOs.length === 0 ? (
                            <p className="text-sm text-neutral-400 py-4 text-center">No work orders generated yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {recentWOs.map((wo: any) => (
                                    <Link
                                        key={wo.id}
                                        to={`/app/maintenance/work-orders/${wo.id}`}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-neutral-100 dark:border-neutral-800"
                                    >
                                        <div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                {wo.woNumber}
                                            </span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">{wo.status?.replace(/_/g, " ")}</span>
                                        </div>
                                        <span className="text-xs text-neutral-400">{wo.createdAt ? fmt.date(wo.createdAt) : "---"}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reschedule History */}
                    {rescheduleHistory.length > 0 ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                                <History size={14} className="inline mr-1" />
                                Reschedule History
                            </h3>
                            <div className="space-y-3">
                                {rescheduleHistory.map((entry: PMRescheduleHistoryEntry, idx: number) => {
                                    const oldDate = getPMRescheduleOldDate(entry);
                                    const newDate = getPMRescheduleNewDate(entry);
                                    const reason = formatPMRescheduleReason(entry);
                                    const when = getPMRescheduleTimestamp(entry);
                                    return (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                    {oldDate ? fmt.date(oldDate) : "---"} → {newDate ? fmt.date(newDate) : "---"}
                                                </p>
                                                {reason ? <p className="text-xs text-neutral-400 mt-0.5">{reason}</p> : null}
                                                {when ? <p className="text-[10px] text-neutral-400 mt-0.5">{fmt.dateTime(when)}</p> : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Asset */}
                    <SideCard title="Asset">
                        {pm.asset ? (
                            <div className="space-y-2">
                                <a href={`/app/maintenance/assets/${pm.asset.id}`} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline block">
                                    {pm.asset.name}
                                </a>
                                <p className="text-xs text-neutral-400">{resolveMaintenanceAssetNumber(pm.asset)}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400">No asset linked.</p>
                        )}
                    </SideCard>

                    {/* Schedule Info */}
                    <SideCard title="Schedule Info">
                        <div className="space-y-3">
                            <DetailRow label="Strategy" value={formatPMStrategyLabel(pm.strategyType)} />
                            {(pm.frequency || pm.meterInterval) && (
                                <DetailRow label="Frequency" value={formatPMFrequencyDisplay(pm)} />
                            )}
                            {pm.scheduleType && <DetailRow label="Schedule Type" value={formatPMScheduleTypeLabel(pm.scheduleType)} />}
                            <DetailRow label="Next Due" value={pm.nextDueDate ? fmt.date(pm.nextDueDate) : "---"} />
                            <DetailRow label="Lead Days" value={pm.leadDays ?? "---"} />
                            <DetailRow label="Grace Period" value={pm.gracePeriodDays ? `${pm.gracePeriodDays} days` : "---"} />
                            <DetailRow label="Auto-Assign" value={pm.autoAssignRule ? "Yes" : "No"} />
                            {pm.autoAssignTo && <DetailRow label="Auto Technician" value={pm.autoAssignTo} />}
                        </div>
                    </SideCard>

                    {/* Job Plan */}
                    {pm.jobPlan && (
                        <SideCard title="Job Plan">
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">{pm.jobPlan.name}</p>
                            {pm.jobPlan.description && <p className="text-xs text-neutral-400 mt-1">{pm.jobPlan.description}</p>}
                        </SideCard>
                    )}

                    <SideCard title="Dates">
                        <div className="space-y-3">
                            <DetailRow label="Last Completed" value={pm.lastCompletedDate ? fmt.date(pm.lastCompletedDate) : "---"} />
                            <DetailRow label="Created" value={fmt.dateTime(pm.createdAt)} />
                            <DetailRow label="Updated" value={fmt.dateTime(pm.updatedAt)} />
                        </div>
                    </SideCard>
                </div>
            </div>

            {/* Reschedule Modal */}
            {modal === "reschedule" && (
                <ModalOverlay onClose={() => { setModal(null); setRescheduleDate(""); }}>
                    <ModalHeader title="Reschedule PM" onClose={() => { setModal(null); setRescheduleDate(""); }} />
                    <div className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">New Due Date <span className="text-red-500">*</span></label>
                            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setModal(null); setRescheduleDate(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReschedule} disabled={rescheduleMutation.isPending || !rescheduleDate} className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {rescheduleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Reschedule
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Skip Modal */}
            {modal === "skip" && (
                <ModalOverlay onClose={() => { setModal(null); setSkipReason(""); }}>
                    <ModalHeader title="Skip PM Occurrence" onClose={() => { setModal(null); setSkipReason(""); }} />
                    <div className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reason</label>
                            <textarea value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Reason for skipping..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setModal(null); setSkipReason(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSkip} disabled={skipMutation.isPending} className="px-6 py-2 text-sm font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {skipMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Skip
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

/* ── Helpers ── */

function StrategyBadge({ type }: { type: string }) {
    const configs: Record<string, string> = {
        PREVENTIVE_CALENDAR: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800/50",
        PREVENTIVE_METER: "text-accent-700 bg-accent-50 border-accent-200 dark:text-accent-400 dark:bg-accent-900/20 dark:border-accent-800/50",
        SEASONAL: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/50",
        STATUTORY: "text-danger-700 bg-danger-50 border-danger-200 dark:text-danger-400 dark:bg-danger-900/20 dark:border-danger-800/50",
    };
    return (
        <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", configs[type] || "text-neutral-600 bg-neutral-100 border-neutral-200")}>
            {formatPMStrategyLabel(type)}
        </span>
    );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{title}</h3>
            {children}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">{value ?? "---"}</span>
        </div>
    );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                <X size={18} />
            </button>
        </div>
    );
}
