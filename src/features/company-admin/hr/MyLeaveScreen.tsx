import { useState } from "react";
import {
    CalendarOff,
    Plus,
    X,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    Ban,
    Palmtree,
    Stethoscope,
    Baby,
    Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useMyLeaveBalance } from "@/features/company-admin/api/use-ess-queries";
import { useLeaveRequests, useLeaveTypes, leaveKeys } from "@/features/company-admin/api/use-leave-queries";
import { useApplyLeave, useCancelLeave } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string }> = {
        pending: { icon: Clock, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        approved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        rejected: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
        cancelled: { icon: Ban, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700" },
    };
    const c = config[s] ?? config.pending;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

const BALANCE_ICONS: Record<string, typeof Palmtree> = {
    casual: Palmtree,
    sick: Stethoscope,
    earned: Briefcase,
    maternity: Baby,
};

const BALANCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    casual: { bg: "bg-primary-50 dark:bg-primary-900/20", text: "text-primary-700 dark:text-primary-400", icon: "text-primary-500" },
    sick: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", icon: "text-danger-500" },
    earned: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", icon: "text-success-500" },
    maternity: { bg: "bg-accent-50 dark:bg-accent-900/20", text: "text-accent-700 dark:text-accent-400", icon: "text-accent-500" },
};

const EMPTY_FORM = {
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    isHalfDay: false,
    halfDayType: "" as "" | "FIRST_HALF" | "SECOND_HALF",
    reason: "",
};

/* ── Screen ── */

export function MyLeaveScreen() {
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const queryClient = useQueryClient();
    const balanceQuery = useMyLeaveBalance();
    const leaveTypesQuery = useLeaveTypes();
    const requestsQuery = useLeaveRequests({ employeeId: "me" });
    const applyMutation = useApplyLeave();
    const cancelMutation = useCancelLeave();

    const balances: any[] = (balanceQuery.data?.data as any) ?? [];
    const leaveTypes: any[] = leaveTypesQuery.data?.data ?? [];
    const requests: any[] = requestsQuery.data?.data ?? [];

    const leaveTypeName = (id: string) => leaveTypes.find((lt: any) => lt.id === id)?.name ?? id;

    const computeDays = () => {
        if (!form.fromDate || !form.toDate) return 0;
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        const diffMs = to.getTime() - from.getTime();
        let days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
        if (form.isHalfDay) days = 0.5;
        return days;
    };

    const handleApply = async () => {
        try {
            const days = computeDays();
            const payload: any = {
                leaveTypeId: form.leaveTypeId,
                fromDate: form.fromDate,
                toDate: form.toDate,
                days,
                isHalfDay: form.isHalfDay,
                reason: form.reason,
            };
            if (form.isHalfDay && form.halfDayType) {
                payload.halfDayType = form.halfDayType;
            }
            await applyMutation.mutateAsync(payload);
            showSuccess("Leave Applied", "Your leave request has been submitted for approval.");
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const openApply = () => {
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const handleCancelLeave = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
        try {
            await cancelMutation.mutateAsync(requestId);
            queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
            showSuccess("Leave Cancelled", "Leave request cancelled successfully.");
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = applyMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Leave</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Check balances, apply for leave, and track requests</p>
                </div>
                <button
                    onClick={openApply}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Apply Leave
                </button>
            </div>

            {/* Balance Cards */}
            {balanceQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {balances.map((b: any) => {
                        const key = (b.leaveType ?? b.type ?? "").toLowerCase();
                        const colors = BALANCE_COLORS[key] ?? BALANCE_COLORS.casual;
                        const Icon = BALANCE_ICONS[key] ?? CalendarOff;
                        return (
                            <div key={b.id ?? b.leaveType} className={cn("rounded-2xl border p-5 shadow-sm", colors.bg, "border-neutral-200/60 dark:border-neutral-800")}>
                                <div className="flex items-center justify-between mb-3">
                                    <Icon size={20} className={colors.icon} />
                                    <span className={cn("text-2xl font-bold font-mono", colors.text)}>{b.balance ?? b.available ?? 0}</span>
                                </div>
                                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{b.leaveTypeName ?? b.leaveType ?? "Leave"}</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    {b.used ?? 0} used / {b.total ?? b.entitled ?? 0} entitled
                                </p>
                            </div>
                        );
                    })}
                    {balances.length === 0 && !balanceQuery.isLoading && (
                        <div className="col-span-full text-center py-8 text-sm text-neutral-400">No leave balances available.</div>
                    )}
                </div>
            )}

            {/* Requests Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">My Leave Requests</h3>
                </div>
                {requestsQuery.isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : requests.length === 0 ? (
                    <EmptyState icon="list" title="No leave requests" message="Apply for leave to see your requests here." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Leave Type</th>
                                    <th className="py-4 px-6 font-bold">From</th>
                                    <th className="py-4 px-6 font-bold">To</th>
                                    <th className="py-4 px-6 font-bold text-center">Days</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {requests.map((r: any) => (
                                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{leaveTypeName(r.leaveTypeId)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.fromDate ?? r.startDate)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.toDate ?? r.endDate)}</td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{r.days ?? "—"}</td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={r.status ?? "Pending"} /></td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs truncate max-w-[200px]">{r.reason || "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            {(r.status === "PENDING" || r.status === "APPROVED") && (
                                                <button
                                                    onClick={() => handleCancelLeave(r.id)}
                                                    disabled={cancelMutation.isPending}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Ban size={12} />
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Apply Leave Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Apply Leave</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Leave Type</label>
                                <select value={form.leaveTypeId} onChange={(e) => setForm((p) => ({ ...p, leaveTypeId: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select leave type...</option>
                                    {leaveTypes.map((lt: any) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">From Date</label>
                                    <input type="date" value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Date</label>
                                    <input type="date" value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm font-medium text-primary-950 dark:text-white">Half Day</span>
                                    <button type="button" onClick={() => setForm((p) => ({ ...p, isHalfDay: !p.isHalfDay, halfDayType: !p.isHalfDay ? "FIRST_HALF" : "" }))} className={cn("w-10 h-6 rounded-full transition-colors relative", form.isHalfDay ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                        <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.isHalfDay ? "left-5" : "left-1")} />
                                    </button>
                                </div>
                                {form.isHalfDay && (
                                    <div className="flex gap-2 pt-1">
                                        {[{ value: "FIRST_HALF", label: "First Half" }, { value: "SECOND_HALF", label: "Second Half" }].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setForm((p) => ({ ...p, halfDayType: opt.value as "FIRST_HALF" | "SECOND_HALF" }))}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-bold border transition-all text-center",
                                                    form.halfDayType === opt.value
                                                        ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                                        : "bg-white text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleApply} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
