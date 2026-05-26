import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    X,
    Eye,
    Plus,
    Loader2,
    Calendar,
    Trash2,
    SkipForward,
    CalendarClock,
    Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePMSchedules } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useDeletePMSchedule,
    useReschedulePM,
    useSkipPM,
    useGenerateWOFromPM,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import {
    formatPMFrequencyDisplay,
    formatPMStrategyLabel,
    PM_STRATEGY_FILTER_OPTIONS,
} from "@/features/maintenance/pm-schedule/pm-schedule-form";

/* ── Constants ── */

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "INACTIVE", label: "Inactive" },
];

const STRATEGY_BADGE: Record<string, { color: string; bg: string }> = {
    PREVENTIVE_CALENDAR: { color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50" },
    PREVENTIVE_METER: { color: "text-accent-700 dark:text-accent-400", bg: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50" },
    SEASONAL: { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50" },
    STATUTORY: { color: "text-danger-700 dark:text-danger-400", bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50" },
};

function StrategyBadge({ type }: { type: string }) {
    const config = STRATEGY_BADGE[type];
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", config?.color || "text-neutral-600", config?.bg || "bg-neutral-100 border-neutral-200")}>
            {formatPMStrategyLabel(type)}
        </span>
    );
}

function PMStatusBadge({ status, nextDue }: { status: string; nextDue?: string }) {
    const isOverdue = status === "OVERDUE" || (nextDue && new Date(nextDue) < new Date());
    if (isOverdue) {
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50">
                Overdue
            </span>
        );
    }
    if (status === "INACTIVE") {
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700">
                Inactive
            </span>
        );
    }
    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50">
            Active
        </span>
    );
}

/* ── Screen ── */

export function PMScheduleListScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance.pm-schedule:create");
    const canManage = useCanPerform("maintenance.pm-schedule:update");

    const [search, setSearch] = useState("");
    const [strategy, setStrategy] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [rescheduleId, setRescheduleId] = useState<string | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [skipId, setSkipId] = useState<string | null>(null);
    const [skipReason, setSkipReason] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (strategy) params.strategyType = strategy;
    if (statusFilter === "ACTIVE") params.isActive = true;
    if (statusFilter === "OVERDUE") params.isOverdue = true;
    if (statusFilter === "INACTIVE") params.isActive = false;

    const { data, isLoading, isError } = usePMSchedules(params);
    const schedules: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const deleteMutation = useDeletePMSchedule();
    const rescheduleMutation = useReschedulePM();
    const skipMutation = useSkipPM();
    const generateMutation = useGenerateWOFromPM();

    const hasFilters = strategy || statusFilter;

    const clearFilters = () => {
        setSearch("");
        setStrategy("");
        setStatusFilter("");
        setPage(1);
    };

    const handleReschedule = async () => {
        if (!rescheduleId || !rescheduleDate) return;
        try {
            await rescheduleMutation.mutateAsync({ id: rescheduleId, data: { newDueDate: rescheduleDate, reasonCode: "OTHER" } });
            showSuccess("Rescheduled", "PM schedule rescheduled.");
            setRescheduleId(null);
            setRescheduleDate("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSkip = async () => {
        if (!skipId || !skipReason.trim()) return;
        try {
            await skipMutation.mutateAsync({ id: skipId, data: { reason: skipReason.trim() } });
            showSuccess("Skipped", "PM occurrence skipped.");
            setSkipId(null);
            setSkipReason("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleGenerateWO = async (id: string) => {
        try {
            await generateMutation.mutateAsync({ id });
            showSuccess("Generated", "Work order generated from PM schedule.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync(deleteId);
            showSuccess("Deleted", "PM schedule deleted.");
            setDeleteId(null);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">PM Schedules</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Preventive maintenance schedules</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/app/maintenance/pm-calendar"
                        className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                        <Calendar className="w-4 h-4" />
                        Calendar
                    </Link>
                    {canCreate && (
                        <Link
                            to="/app/maintenance/pm-schedules/new"
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            <Plus className="w-5 h-5" />
                            New PM Schedule
                        </Link>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, asset..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <select
                        value={strategy}
                        onChange={(e) => { setStrategy(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {PM_STRATEGY_FILTER_OPTIONS.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-2.5 rounded-xl border transition-colors",
                            showFilters || hasFilters
                                ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <Filter size={16} />
                    </button>
                    {hasFilters && (
                        <button onClick={clearFilters} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
                {showFilters && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="max-w-xs">
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load PM schedules. Please try again.
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Asset</th>
                                    <th className="py-4 px-6 font-bold">Strategy</th>
                                    <th className="py-4 px-6 font-bold">Frequency</th>
                                    <th className="py-4 px-6 font-bold">Next Due</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Last Completed</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {schedules.map((pm: any) => (
                                    <tr
                                        key={pm.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{pm.name}</td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-medium text-neutral-900 dark:text-white block">{pm.asset?.name || "---"}</span>
                                                <span className="text-[10px] text-neutral-400">{pm.asset?.assetNumber || ""}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StrategyBadge type={pm.strategyType} />
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {formatPMFrequencyDisplay(pm)}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {pm.nextDueDate ? fmt.date(pm.nextDueDate) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <PMStatusBadge status={pm.status || "ACTIVE"} nextDue={pm.nextDueDate} />
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {pm.lastCompletedDate ? fmt.date(pm.lastCompletedDate) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => setRescheduleId(pm.id)}
                                                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Reschedule"
                                                        >
                                                            <CalendarClock size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSkipId(pm.id)}
                                                            className="p-1.5 text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/30 rounded-lg transition-colors"
                                                            title="Skip"
                                                        >
                                                            <SkipForward size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleGenerateWO(pm.id)}
                                                            disabled={generateMutation.isPending}
                                                            className="p-1.5 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Generate WO"
                                                        >
                                                            {generateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(pm.id)}
                                                            className="p-1.5 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    to={`/app/maintenance/pm-schedules/${pm.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {schedules.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No PM schedules found" message="Create a new PM schedule or adjust your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Previous</button>
                            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleId && (
                <ModalOverlay onClose={() => { setRescheduleId(null); setRescheduleDate(""); }}>
                    <ModalHeader title="Reschedule PM" onClose={() => { setRescheduleId(null); setRescheduleDate(""); }} />
                    <div className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">New Due Date <span className="text-red-500">*</span></label>
                            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setRescheduleId(null); setRescheduleDate(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReschedule} disabled={rescheduleMutation.isPending || !rescheduleDate} className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {rescheduleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Reschedule
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Skip Modal */}
            {skipId && (
                <ModalOverlay onClose={() => { setSkipId(null); setSkipReason(""); }}>
                    <ModalHeader title="Skip PM Occurrence" onClose={() => { setSkipId(null); setSkipReason(""); }} />
                    <div className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reason</label>
                            <textarea value={skipReason} onChange={(e) => setSkipReason(e.target.value)} placeholder="Reason for skipping (optional)..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setSkipId(null); setSkipReason(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSkip} disabled={skipMutation.isPending} className="px-6 py-2 text-sm font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {skipMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Skip
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <ModalOverlay onClose={() => setDeleteId(null)}>
                    <ModalHeader title="Delete PM Schedule" onClose={() => setDeleteId(null)} />
                    <div className="px-6 py-4 space-y-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to delete this PM schedule? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-6 py-2 text-sm font-bold rounded-xl bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

/* ── Modal Helpers ── */

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
