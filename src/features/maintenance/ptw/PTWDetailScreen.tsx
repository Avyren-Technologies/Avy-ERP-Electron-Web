import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, X, ShieldAlert, Clock, CheckCircle, AlertTriangle, Ban, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePTW } from "@/features/maintenance/api/use-maintenance-queries";
import { useReviewPTW, useIssuePTW, useClosePTW, useRevokePTW } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Class badge ── */

const CLASS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    HOT_WORK: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Hot Work" },
    CONFINED_SPACE: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", label: "Confined Space" },
    ELECTRICAL_ISOLATION: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "Electrical Isolation" },
    PRESSURE_RELEASE: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", label: "Pressure Release" },
    GENERAL_WORK: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "General Work" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
    REQUESTED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Requested", icon: Clock },
    UNDER_REVIEW: { bg: "bg-warning-50 dark:bg-warning-900/20", text: "text-warning-700 dark:text-warning-400", label: "Under Review", icon: FileCheck },
    ISSUED: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", label: "Issued", icon: CheckCircle },
    ACTIVE: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Active", icon: ShieldAlert },
    CLOSED: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: "Closed", icon: CheckCircle },
    EXPIRED: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-500 dark:text-neutral-500", label: "Expired", icon: Clock },
    REVOKED: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Revoked", icon: Ban },
};

/* ── Timeline event ── */

const TIMELINE_EVENTS: Record<string, { label: string; color: string }> = {
    REQUESTED: { label: "Permit Requested", color: "bg-blue-500" },
    UNDER_REVIEW: { label: "Sent for Review", color: "bg-warning-500" },
    ISSUED: { label: "Permit Issued", color: "bg-success-500" },
    ACTIVE: { label: "Work Started", color: "bg-emerald-500" },
    CLOSED: { label: "Permit Closed", color: "bg-neutral-500" },
    EXPIRED: { label: "Permit Expired", color: "bg-neutral-400" },
    REVOKED: { label: "Permit Revoked", color: "bg-danger-500" },
};

/* ── Screen ── */

export function PTWDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canApprove = useCanPerform("maintenance:approve");

    const { data, isLoading } = usePTW(id ?? "");
    const permit: any = data?.data ?? {};

    const reviewMutation = useReviewPTW();
    const issueMutation = useIssuePTW();
    const closeMutation = useClosePTW();
    const revokeMutation = useRevokePTW();

    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");

    const handleAction = async (action: "review" | "issue" | "close") => {
        if (!id) return;
        try {
            if (action === "review") await reviewMutation.mutateAsync({ id });
            else if (action === "issue") await issueMutation.mutateAsync({ id });
            else await closeMutation.mutateAsync({ id });
            showSuccess("Updated", `Permit ${action === "review" ? "sent for review" : action === "issue" ? "issued" : "closed"} successfully.`);
        } catch (err) { showApiError(err); }
    };

    const handleRevoke = async () => {
        if (!id || !revokeReason.trim()) return;
        try {
            await revokeMutation.mutateAsync({ id, data: { revokeReason } });
            showSuccess("Revoked", "Permit revoked.");
            setShowRevokeModal(false);
            setRevokeReason("");
        } catch (err) { showApiError(err); }
    };

    const isPending = reviewMutation.isPending || issueMutation.isPending || closeMutation.isPending;
    const statusCfg = STATUS_COLORS[permit.status] ?? STATUS_COLORS.REQUESTED;
    const classCfg = CLASS_COLORS[permit.ptwClass] ?? CLASS_COLORS.GENERAL_WORK;

    // Build timeline from audit trail or status
    const timeline: { status: string; date: string; by?: string }[] = permit.auditTrail ?? [];
    // Fallback: show current status
    if (timeline.length === 0 && permit.status) {
        timeline.push({ status: permit.status, date: permit.createdAt ?? new Date().toISOString() });
    }

    if (isLoading) return <SkeletonTable rows={6} cols={3} />;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><ArrowLeft size={18} /></button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white flex items-center gap-2">
                        <ShieldAlert size={22} className="text-primary-600" />
                        {permit.permitNumber ?? `PTW-${id?.slice(0, 6)}`}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", classCfg.bg, classCfg.text)}>{classCfg.label}</span>
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", statusCfg.bg, statusCfg.text)}>
                            <statusCfg.icon size={11} /> {statusCfg.label}
                        </span>
                    </div>
                </div>
                {/* Action buttons */}
                {canApprove && (
                    <div className="flex items-center gap-2">
                        {permit.status === "REQUESTED" && (
                            <button onClick={() => handleAction("review")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-warning-600 text-white rounded-xl text-sm font-semibold hover:bg-warning-700 disabled:opacity-60">
                                {isPending && <Loader2 size={14} className="animate-spin" />} Review
                            </button>
                        )}
                        {permit.status === "UNDER_REVIEW" && (
                            <button onClick={() => handleAction("issue")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-xl text-sm font-semibold hover:bg-success-700 disabled:opacity-60">
                                {isPending && <Loader2 size={14} className="animate-spin" />} Issue Permit
                            </button>
                        )}
                        {(permit.status === "ISSUED" || permit.status === "ACTIVE") && (
                            <>
                                <button onClick={() => handleAction("close")} disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-xl text-sm font-semibold hover:bg-neutral-700 disabled:opacity-60">
                                    {isPending && <Loader2 size={14} className="animate-spin" />} Close
                                </button>
                                <button onClick={() => setShowRevokeModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-xl text-sm font-semibold hover:bg-danger-700">
                                    Revoke
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Asset", value: permit.asset?.name ?? permit.assetName ?? "---" },
                            { label: "Requested By", value: permit.requestedBy?.name ?? permit.requestedByName ?? "---" },
                            { label: "Requested", value: permit.createdAt ? fmt.date(permit.createdAt) : "---" },
                            { label: "Issued", value: permit.issuedAt ? fmt.dateTime(permit.issuedAt) : "---" },
                        ].map((c) => (
                            <div key={c.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">{c.label}</p>
                                <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{c.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {permit.description && (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Description</h3>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{permit.description}</p>
                        </div>
                    )}

                    {/* Hazards & Precautions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permit.hazards && (
                            <div className="bg-danger-50/50 dark:bg-danger-900/10 border border-danger-100 dark:border-danger-900/30 rounded-xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-danger-600 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Hazards</h3>
                                <p className="text-sm text-danger-800 dark:text-danger-300 whitespace-pre-wrap">{permit.hazards}</p>
                            </div>
                        )}
                        {permit.precautions && (
                            <div className="bg-success-50/50 dark:bg-success-900/10 border border-success-100 dark:border-success-900/30 rounded-xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-success-600 mb-2 flex items-center gap-1"><ShieldAlert size={12} /> Precautions</h3>
                                <p className="text-sm text-success-800 dark:text-success-300 whitespace-pre-wrap">{permit.precautions}</p>
                            </div>
                        )}
                    </div>

                    {/* Emergency & Isolation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permit.emergencyContact && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Emergency Contact</h3>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{permit.emergencyContact}</p>
                            </div>
                        )}
                        {permit.isolationDetails && (
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Isolation Details</h3>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{permit.isolationDetails}</p>
                            </div>
                        )}
                    </div>

                    {/* Revoke reason */}
                    {permit.status === "REVOKED" && permit.revokeReason && (
                        <div className="bg-danger-50/50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-900/30 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-danger-600 mb-2 flex items-center gap-1"><Ban size={12} /> Revocation Reason</h3>
                            <p className="text-sm text-danger-800 dark:text-danger-300">{permit.revokeReason}</p>
                        </div>
                    )}
                </div>

                {/* Right: Timeline */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Status Timeline</h3>
                    <div className="space-y-4">
                        {timeline.map((event, idx) => {
                            const evt = TIMELINE_EVENTS[event.status] ?? { label: event.status, color: "bg-neutral-400" };
                            return (
                                <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={cn("w-3 h-3 rounded-full", evt.color)} />
                                        {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 mt-1" />}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm font-semibold text-primary-950 dark:text-white">{evt.label}</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">{event.date ? fmt.dateTime(event.date) : ""}</p>
                                        {event.by && <p className="text-xs text-neutral-400 mt-0.5">by {event.by}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Revoke Modal */}
            {showRevokeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRevokeModal(false)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-danger-700">Revoke Permit</h2>
                            <button onClick={() => setShowRevokeModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">This will immediately revoke the permit. Please provide a reason.</p>
                        <textarea
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none"
                            placeholder="Reason for revoking..."
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowRevokeModal(false)} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium">Cancel</button>
                            <button onClick={handleRevoke} disabled={!revokeReason.trim() || revokeMutation.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-danger-600 text-white rounded-xl text-sm font-semibold hover:bg-danger-700 disabled:opacity-60">
                                {revokeMutation.isPending && <Loader2 size={14} className="animate-spin" />} Revoke
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
