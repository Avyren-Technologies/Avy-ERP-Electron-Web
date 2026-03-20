import { useState } from "react";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    Eye,
    X,
    Loader2,
    CalendarDays,
    Ban,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingApprovals, useApprovalRequests } from "@/features/company-admin/api/use-ess-queries";
import { useApproveRequest, useRejectRequest } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
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

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 capitalize">
            {(type ?? "").replace(/_/g, " ")}
        </span>
    );
}

function StepProgress({ steps, currentStep }: { steps: any[]; currentStep: number }) {
    return (
        <div className="flex items-center gap-1">
            {steps.map((_: any, i: number) => (
                <div key={i} className="flex items-center gap-1">
                    <div
                        className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                            i < currentStep
                                ? "bg-success-500 text-white"
                                : i === currentStep
                                ? "bg-primary-500 text-white"
                                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                        )}
                    >
                        {i < currentStep ? <CheckCircle2 size={10} /> : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={cn("w-4 h-0.5", i < currentStep ? "bg-success-300" : "bg-neutral-200 dark:bg-neutral-700")} />
                    )}
                </div>
            ))}
        </div>
    );
}

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
const TYPE_FILTERS = ["All", "leave_request", "attendance_regularization", "expense_claim", "salary_revision", "loan_request", "it_declaration", "profile_update"];

/* ── Screen ── */

export function ApprovalRequestScreen() {
    const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");

    const pendingQuery = usePendingApprovals();
    const allQuery = useApprovalRequests({
        status: statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
        type: typeFilter === "All" ? undefined : typeFilter,
    });

    const approveMutation = useApproveRequest();
    const rejectMutation = useRejectRequest();

    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [rejectNote, setRejectNote] = useState("");
    const [detailTarget, setDetailTarget] = useState<any>(null);

    const activeQuery = activeTab === "pending" ? pendingQuery : allQuery;
    const requests: any[] = activeQuery.data?.data ?? [];
    const isLoading = activeQuery.isLoading;
    const isError = activeQuery.isError;

    const filtered = requests.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.employeeName?.toLowerCase().includes(s) ||
            r.requestType?.toLowerCase().includes(s) ||
            r.description?.toLowerCase().includes(s)
        );
    });

    const handleApprove = async (req: any) => {
        try {
            await approveMutation.mutateAsync({ id: req.id });
            showSuccess("Request Approved", `Request from ${req.employeeName ?? "employee"} has been approved.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        try {
            await rejectMutation.mutateAsync({ id: rejectTarget.id, data: { note: rejectNote } });
            showSuccess("Request Rejected", "The request has been rejected.");
            setRejectTarget(null);
            setRejectNote("");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Approval Requests</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review and action pending approval requests across all workflows</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={cn(
                        "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "pending"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    <span className="flex items-center gap-2"><Clock size={14} />My Pending</span>
                </button>
                <button
                    onClick={() => setActiveTab("all")}
                    className={cn(
                        "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "all"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    <span className="flex items-center gap-2"><CalendarDays size={14} />All Requests</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by employee or type..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                {activeTab === "all" && (
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                                {STATUS_FILTERS.map((f) => (<option key={f} value={f}>{f}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Type:</span>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                                {TYPE_FILTERS.map((f) => (<option key={f} value={f}>{f === "All" ? "All Types" : f.replace(/_/g, " ")}</option>))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load approval requests.
                </div>
            )}

            {/* Pending Tab — Card Layout */}
            {activeTab === "pending" && (
                <div>
                    {isLoading ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                            <SkeletonTable rows={5} cols={5} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                            <EmptyState icon="list" title="No pending requests" message="All approval requests have been actioned." />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((req: any) => (
                                <div key={req.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary-950 dark:text-white text-sm">{req.employeeName ?? "Employee"}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{(req.requestType ?? "").replace(/_/g, " ")}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={req.status ?? "Pending"} />
                                    </div>
                                    {req.description && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">{req.description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                                        <div>
                                            <span className="text-neutral-400">Submitted</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{formatDate(req.createdAt)}</p>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400">Current Step</span>
                                            <p className="font-semibold text-primary-950 dark:text-white">{req.currentStepLabel ?? `Step ${(req.currentStep ?? 0) + 1}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectTarget(req)}
                                            className="flex-1 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle size={12} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => setDetailTarget(req)}
                                            className="py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <Eye size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* All Tab — Table Layout */}
            {activeTab === "all" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? (
                        <SkeletonTable rows={8} cols={7} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Type</th>
                                        <th className="py-4 px-6 font-bold">Submitted</th>
                                        <th className="py-4 px-6 font-bold text-center">Progress</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold">Approver</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filtered.map((req: any) => (
                                        <tr key={req.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                        {(req.employeeName ?? "E").charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{req.employeeName ?? "\u2014"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><TypeBadge type={req.requestType} /></td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(req.createdAt)}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <StepProgress steps={req.steps ?? [{ id: 1 }, { id: 2 }]} currentStep={req.currentStep ?? 0} />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center"><StatusBadge status={req.status ?? "Pending"} /></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{req.currentApprover ?? "\u2014"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setDetailTarget(req)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                                                        <Eye size={15} />
                                                    </button>
                                                    {req.status?.toLowerCase() === "pending" && (
                                                        <>
                                                            <button onClick={() => handleApprove(req)} disabled={approveMutation.isPending} className="p-2 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve">
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                            <button onClick={() => setRejectTarget(req)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Reject">
                                                                <XCircle size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && !isLoading && (
                                        <tr>
                                            <td colSpan={7}>
                                                <EmptyState icon="search" title="No requests found" message="Try adjusting your search or filters." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Reject Dialog ── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Reject Request?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                            Rejecting request from <strong>{rejectTarget.employeeName ?? "employee"}</strong>.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Rejection Note</label>
                            <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Request Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <StatusBadge status={detailTarget.status ?? "Pending"} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Employee</span>
                                    <p className="font-bold text-primary-950 dark:text-white">{detailTarget.employeeName ?? "\u2014"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Request Type</span>
                                    <p className="font-bold text-primary-950 dark:text-white capitalize">{(detailTarget.requestType ?? "").replace(/_/g, " ")}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Submitted</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{formatDate(detailTarget.createdAt)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Current Approver</span>
                                    <p className="font-semibold text-primary-950 dark:text-white">{detailTarget.currentApprover ?? "\u2014"}</p>
                                </div>
                            </div>
                            {detailTarget.description && (
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Description</span>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{detailTarget.description}</p>
                                </div>
                            )}
                            {(detailTarget.steps ?? []).length > 0 && (
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-2 uppercase font-semibold">Workflow Steps</span>
                                    <div className="space-y-2">
                                        {detailTarget.steps.map((step: any, i: number) => (
                                            <div key={i} className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg border text-xs",
                                                i < (detailTarget.currentStep ?? 0)
                                                    ? "bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800/50"
                                                    : i === (detailTarget.currentStep ?? 0)
                                                    ? "bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/50"
                                                    : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                            )}>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                                                    i < (detailTarget.currentStep ?? 0) ? "bg-success-500 text-white" : i === (detailTarget.currentStep ?? 0) ? "bg-primary-500 text-white" : "bg-neutral-300 dark:bg-neutral-600 text-white"
                                                )}>
                                                    {i < (detailTarget.currentStep ?? 0) ? <CheckCircle2 size={10} /> : i + 1}
                                                </div>
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{step.approverRole ?? `Step ${i + 1}`}</span>
                                                {step.actionedAt && <span className="ml-auto text-neutral-400">{formatDate(step.actionedAt)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
