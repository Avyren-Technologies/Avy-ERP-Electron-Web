import { useState } from "react";
import {
    ClipboardList,
    Search,
    Filter,
    X,
    Eye,
    Loader2,
    CheckCircle,
    XCircle,
    ClipboardCheck,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkRequests } from "@/features/maintenance/api/use-maintenance-queries";
import { useCompanyUsers } from "@/features/company-admin/api/use-company-admin-queries";
import {
    useTriageWorkRequest,
    useApproveWorkRequest,
    useRejectWorkRequest,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { workRequestListHelp } from "@/features/maintenance/help";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "APPROVED", label: "Approved" },
    { value: "CONVERTED", label: "Converted" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
    { value: "", label: "All Priorities" },
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

const TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "PLANNED_SERVICE", label: "Planned Service" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "REPLACEMENT", label: "Replacement" },
    { value: "SAFETY", label: "Safety" },
    { value: "OTHER", label: "Other" },
];

const WR_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: "Draft", color: "text-neutral-600 dark:text-neutral-300", bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
    SUBMITTED: { label: "Submitted", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50" },
    UNDER_REVIEW: { label: "Under Review", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50" },
    APPROVED: { label: "Approved", color: "text-success-700 dark:text-success-400", bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50" },
    CONVERTED: { label: "Converted", color: "text-primary-700 dark:text-primary-400", bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50" },
    REJECTED: { label: "Rejected", color: "text-danger-700 dark:text-danger-400", bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50" },
    CANCELLED: { label: "Cancelled", color: "text-neutral-500 dark:text-neutral-400", bg: "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700" },
};

function WRStatusBadge({ status }: { status: string }) {
    const config = WR_STATUS_CONFIG[status];
    if (!config) {
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                {(status || "unknown").replace(/_/g, " ").toLowerCase()}
            </span>
        );
    }
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", config.color, config.bg)}>
            {config.label}
        </span>
    );
}

/* ── Screen ── */

export function WorkRequestListScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance.work-orders:create");
    const canApprove = useCanPerform("maintenance.work-orders:approve");

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [requestType, setRequestType] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Quick action state
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectModalId, setRejectModalId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Queries
    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (requestType) params.requestType = requestType;

    const { data, isLoading, isError } = useWorkRequests(params);
    const workRequests: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const { data: usersData } = useCompanyUsers({ limit: 1000 });
    const usersList = usersData?.data ?? [];
    const userMap = new Map<string, string>(
        usersList.map((u: any) => [
            u.id,
            [u.firstName, u.lastName].filter(Boolean).join(" ") || u.fullName || u.email || u.id,
        ])
    );

    // Mutations
    const triageMutation = useTriageWorkRequest();
    const approveMutation = useApproveWorkRequest();
    const rejectMutation = useRejectWorkRequest();

    const hasFilters = status || priority || requestType;

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        setRequestType("");
        setPage(1);
    };

    const handleTriage = async (id: string, currentPriority: string) => {
        try {
            setActionId(id);
            await triageMutation.mutateAsync({ id, data: { triageNotes: "Triaged via quick action", assignedPriority: currentPriority } });
            showSuccess("Triaged", "Work request has been triaged.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setActionId(id);
            await approveMutation.mutateAsync({ id });
            showSuccess("Approved", "Work request has been approved.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModalId || !rejectReason.trim()) return;
        try {
            await rejectMutation.mutateAsync({ id: rejectModalId, data: { rejectionReason: rejectReason } });
            showSuccess("Rejected", "Work request has been rejected.");
            setRejectModalId(null);
            setRejectReason("");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Work Requests</h1>
                        <HelpDrawer help={workRequestListHelp} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage maintenance work requests</p>
                </div>
                {canCreate && (
                    <a
                        href="/app/maintenance/work-requests/new"
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        New Work Request
                    </a>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by request number, asset..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                        value={priority}
                        onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Request Type</label>
                            <select
                                value={requestType}
                                onChange={(e) => { setRequestType(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load work requests. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Request #</th>
                                    <th className="py-4 px-6 font-bold">Asset</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Priority</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Requested By</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {workRequests.map((wr: any) => (
                                    <tr
                                        key={wr.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                {wr.requestNumber}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white block">{wr.asset?.name || "---"}</span>
                                                <span className="text-[10px] text-neutral-400">{wr.asset?.assetNumber || ""}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                {(wr.requestType || "").replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <PriorityBadge priority={wr.priority} />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <WRStatusBadge status={wr.status} />
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {wr.requestedByName || userMap.get(wr.requestedById) || wr.requestedById || "---"}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {wr.requestedAt ? fmt.date(wr.requestedAt) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Quick actions */}
                                                {canApprove && wr.status === "SUBMITTED" && (
                                                    <button
                                                        onClick={() => handleTriage(wr.id, wr.priority)}
                                                        disabled={actionId === wr.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50 transition-colors disabled:opacity-50"
                                                        title="Triage"
                                                    >
                                                        {actionId === wr.id ? <Loader2 size={12} className="animate-spin" /> : <ClipboardCheck size={12} />}
                                                        Triage
                                                    </button>
                                                )}
                                                {canApprove && wr.status === "UNDER_REVIEW" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(wr.id)}
                                                            disabled={actionId === wr.id}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            {actionId === wr.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModalId(wr.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={12} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <a
                                                    href={`/app/maintenance/work-requests/${wr.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={15} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {workRequests.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No work requests found" message="Create a new work request or adjust your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {meta.page} of {meta.totalPages} ({meta.total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setRejectModalId(null); setRejectReason(""); }}>
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Reject Work Request</h3>
                            <button onClick={() => { setRejectModalId(null); setRejectReason(""); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setRejectModalId(null); setRejectReason(""); }}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending || !rejectReason.trim()}
                                    className="px-6 py-2 text-sm font-bold rounded-xl bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {rejectMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
