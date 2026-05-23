import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    X,
    CheckCircle,
    XCircle,
    ClipboardCheck,
    ArrowRight,
    Ban,
    AlertTriangle,
    History,
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkRequest } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useTriageWorkRequest,
    useApproveWorkRequest,
    useRejectWorkRequest,
    useConvertWorkRequest,
    useCancelWorkRequest,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Status Badge ── */

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
            <span className="text-xs font-bold px-3 py-1 rounded-full border capitalize bg-neutral-100 text-neutral-600 border-neutral-200">
                {(status || "unknown").replace(/_/g, " ").toLowerCase()}
            </span>
        );
    }
    return (
        <span className={cn("text-xs font-bold px-3 py-1 rounded-full border capitalize", config.color, config.bg)}>
            {config.label}
        </span>
    );
}

const PRIORITY_OPTIONS = [
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

/* ── Screen ── */

export function WorkRequestDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canApprove = useCanPerform("maintenance.work-orders:approve");

    // Modals
    const [triageModalOpen, setTriageModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [triageForm, setTriageForm] = useState({ triageNotes: "", assignedPriority: "" });
    const [rejectReason, setRejectReason] = useState("");

    // Queries
    const { data, isLoading, isError } = useWorkRequest(id!);
    const wr: any = data?.data ?? null;

    // Mutations
    const triageMutation = useTriageWorkRequest();
    const approveMutation = useApproveWorkRequest();
    const rejectMutation = useRejectWorkRequest();
    const convertMutation = useConvertWorkRequest();
    const cancelMutation = useCancelWorkRequest();

    const handleTriage = async () => {
        try {
            const payload: Record<string, any> = { triageNotes: triageForm.triageNotes };
            if (triageForm.assignedPriority) payload.assignedPriority = triageForm.assignedPriority;
            await triageMutation.mutateAsync({ id: id!, data: payload });
            showSuccess("Triaged", "Work request has been triaged.");
            setTriageModalOpen(false);
            setTriageForm({ triageNotes: "", assignedPriority: "" });
        } catch (err) {
            showApiError(err);
        }
    };

    const handleApprove = async () => {
        try {
            await approveMutation.mutateAsync({ id: id! });
            showSuccess("Approved", "Work request has been approved.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        try {
            await rejectMutation.mutateAsync({ id: id!, data: { rejectionReason: rejectReason } });
            showSuccess("Rejected", "Work request has been rejected.");
            setRejectModalOpen(false);
            setRejectReason("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleConvert = async () => {
        try {
            await convertMutation.mutateAsync({ id: id! });
            showSuccess("Converted", "Work request has been converted to a work order.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync({ id: id! });
            showSuccess("Cancelled", "Work request has been cancelled.");
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

    if (isError || !wr) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-neutral-500 dark:text-neutral-400">Work request not found.</p>
                <button onClick={() => navigate("/app/maintenance/work-requests")} className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">
                    Back to Work Requests
                </button>
            </div>
        );
    }

    const photos: string[] = wr.photos ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/app/maintenance/work-requests")}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                {wr.requestNumber}
                            </span>
                            <WRStatusBadge status={wr.status} />
                            <PriorityBadge priority={wr.assignedPriority || wr.priority} />
                            {wr.safetyRisk && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                    <AlertTriangle size={10} />
                                    Safety Risk
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">Work Request Detail</h1>
                    </div>
                </div>

                {/* Action Buttons */}
                {canApprove && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {wr.status === "SUBMITTED" && (
                            <button
                                onClick={() => setTriageModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                            >
                                <ClipboardCheck className="w-4 h-4" />
                                Triage
                            </button>
                        )}
                        {wr.status === "UNDER_REVIEW" && (
                            <>
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending}
                                    className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                >
                                    {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-danger-600 hover:bg-danger-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </>
                        )}
                        {wr.status === "APPROVED" && (
                            <button
                                onClick={handleConvert}
                                disabled={convertMutation.isPending}
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {convertMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Convert to WO
                            </button>
                        )}
                        {(wr.status === "SUBMITTED" || wr.status === "UNDER_REVIEW") && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelMutation.isPending}
                                className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Ban className="w-4 h-4" />}
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                            {wr.description || "No description provided."}
                        </p>
                        {wr.locationDetail && (
                            <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Location Detail</p>
                                <p className="text-sm text-neutral-800 dark:text-neutral-200">{wr.locationDetail}</p>
                            </div>
                        )}
                    </div>

                    {/* Photos */}
                    {photos.length > 0 && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                                <Camera size={14} className="inline mr-1" />
                                Photos ({photos.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {photos.map((url, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Triage & Rejection */}
                    {(wr.triageNotes || wr.rejectionReason) && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-4">
                            {wr.triageNotes && (
                                <div>
                                    <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">Triage Notes</h4>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200">{wr.triageNotes}</p>
                                    {wr.triagedAt && <p className="text-[10px] text-neutral-400 mt-1">Triaged: {fmt.dateTime(wr.triagedAt)}</p>}
                                </div>
                            )}
                            {wr.rejectionReason && (
                                <div>
                                    <h4 className="text-xs font-bold text-danger-700 dark:text-danger-400 uppercase tracking-wider mb-2">Rejection Reason</h4>
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200">{wr.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                            <History size={14} className="inline mr-1" />
                            Timeline
                        </h3>
                        <div className="space-y-3">
                            <TimelineItem label="Created" date={wr.requestedAt} by={wr.requestedByName || wr.requestedById} fmt={fmt} />
                            {wr.triagedAt && <TimelineItem label="Triaged" date={wr.triagedAt} by={wr.triagedByName || wr.triagedById} fmt={fmt} />}
                            {wr.approvedAt && <TimelineItem label="Approved" date={wr.approvedAt} by={wr.approvedByName || wr.approvedById} fmt={fmt} />}
                            {wr.rejectionReason && <TimelineItem label="Rejected" date={wr.updatedAt} fmt={fmt} />}
                            {wr.workOrderId && <TimelineItem label="Converted to WO" date={wr.updatedAt} fmt={fmt} />}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Asset Info */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Asset</h3>
                        {wr.asset ? (
                            <div className="space-y-2">
                                <a
                                    href={`/app/maintenance/assets/${wr.asset.id}`}
                                    className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline block"
                                >
                                    {wr.asset.name}
                                </a>
                                <p className="text-xs text-neutral-400">{wr.asset.assetNumber}</p>
                                <p className="text-xs text-neutral-400">{(wr.asset.assetClass || "").replace(/_/g, " ")}</p>
                                {wr.asset.location?.name && (
                                    <p className="text-xs text-neutral-400">Location: {wr.asset.location.name}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400">No asset linked.</p>
                        )}
                    </div>

                    {/* Request Details */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Details</h3>
                        <div className="space-y-3">
                            <DetailRow label="Request Type" value={(wr.requestType || "").replace(/_/g, " ")} />
                            <DetailRow label="Source" value={(wr.source || "").replace(/_/g, " ")} />
                            <DetailRow label="Priority" value={wr.priority} />
                            {wr.assignedPriority && <DetailRow label="Assigned Priority" value={wr.assignedPriority} />}
                            <DetailRow label="Safety Risk" value={wr.safetyRisk ? "Yes" : "No"} />
                            <DetailRow label="Requested By Date" value={wr.requestedByDate ? fmt.date(wr.requestedByDate) : "---"} />
                            <DetailRow label="Created" value={fmt.dateTime(wr.createdAt)} />
                            <DetailRow label="Updated" value={fmt.dateTime(wr.updatedAt)} />
                            {wr.workOrderId && <DetailRow label="Work Order" value={wr.workOrderId} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Triage Modal */}
            {triageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setTriageModalOpen(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Triage Work Request</h3>
                            <button onClick={() => setTriageModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Triage Notes</label>
                                <textarea
                                    value={triageForm.triageNotes}
                                    onChange={(e) => setTriageForm((p) => ({ ...p, triageNotes: e.target.value }))}
                                    placeholder="Assessment notes..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Assign Priority</label>
                                <select
                                    value={triageForm.assignedPriority}
                                    onChange={(e) => setTriageForm((p) => ({ ...p, assignedPriority: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Keep current priority</option>
                                    {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setTriageModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                <button
                                    onClick={handleTriage}
                                    disabled={triageMutation.isPending}
                                    className="px-6 py-2 text-sm font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {triageMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Triage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setRejectModalOpen(false); setRejectReason(""); }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Reject Work Request</h3>
                            <button onClick={() => { setRejectModalOpen(false); setRejectReason(""); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
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
                                <button onClick={() => { setRejectModalOpen(false); setRejectReason(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
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

/* ── Helpers ── */

function DetailRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">{value || "---"}</span>
        </div>
    );
}

function TimelineItem({ label, date, by, fmt }: { label: string; date: string; by?: string; fmt: any }) {
    return (
        <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
            <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{label}</p>
                <p className="text-[10px] text-neutral-400">
                    {date ? fmt.dateTime(date) : "---"}
                    {by && ` by ${by}`}
                </p>
            </div>
        </div>
    );
}
