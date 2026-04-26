import { useState } from "react";
import { useParams } from "react-router-dom";
import {
    ArrowLeft,
    User,
    Building2,
    Phone,
    Mail,
    Clock,
    MapPin,
    Shield,
    CheckCircle2,
    XCircle,
    LogIn,
    LogOut,
    FileText,
    Loader2,
    Car,
    Timer,
    Trash2,
    Pencil,
    BookCheck,
    BadgeCheck,
    ExternalLink,
    Hash,
} from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";
import { useVisit } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckOutVisit, useApproveVisit, useRejectVisit, useExtendVisit, useDeleteVisit, useCompleteInduction, useUpdateVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { showSuccess, showApiError } from "@/lib/toast";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined | null }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />
            <div>
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">{label}</span>
                <span className="text-sm font-medium text-primary-950 dark:text-white">{value || "---"}</span>
            </div>
        </div>
    );
}

/* ── Screen ── */

export function VisitorDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const fmt = useCompanyFormatter();
    const canApprove = useCanPerform("visitors:approve");
    const canCreate = useCanPerform("visitors:create");

    const { data, isLoading, isError } = useVisit(id || "");
    const checkInMutation = useCheckInVisit();
    const checkOutMutation = useCheckOutVisit();
    const approveMutation = useApproveVisit();
    const rejectMutation = useRejectVisit();
    const extendMutation = useExtendVisit();
    const cancelMutation = useDeleteVisit();
    const inductionMutation = useCompleteInduction();
    const updateMutation = useUpdateVisit();

    const [showExtend, setShowExtend] = useState(false);
    const [extendMinutes, setExtendMinutes] = useState("60");
    const [extendReason, setExtendReason] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({ visitorName: "", visitorMobile: "", expectedDate: "", purpose: "" });

    const visit = data?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-7 h-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    if (isError || !visit) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <a href="/app/company/visitors/list" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                    <ArrowLeft size={16} /> Back to Visits
                </a>
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-6 text-center">
                    <XCircle className="w-10 h-10 text-danger-400 mx-auto mb-3" />
                    <p className="text-sm text-danger-700 dark:text-danger-400 font-medium">Visit not found or an error occurred.</p>
                </div>
            </div>
        );
    }

    const handleCheckIn = async () => {
        try {
            const data: Record<string, unknown> = {};
            if (visit.gateId) data.checkInGateId = visit.gateId;
            else if (visit.checkInGateId) data.checkInGateId = visit.checkInGateId;
            const result = await checkInMutation.mutateAsync({ id: visit.id, data: Object.keys(data).length > 0 ? data : undefined });
            const badgeNo = result?.data?.badgeNumber;
            showSuccess("Checked In", badgeNo ? `${visit.visitorName} checked in. Badge: ${badgeNo}` : `${visit.visitorName} has been checked in.`);
        } catch (err) { showApiError(err); }
    };

    const handleCheckOut = async () => {
        try {
            await checkOutMutation.mutateAsync({ id: visit.id, data: { checkOutMethod: "SECURITY_DESK" } });
            showSuccess("Checked Out", `${visit.visitorName} has been checked out.`);
        } catch (err) { showApiError(err); }
    };

    const handleApprove = async () => {
        try {
            await approveMutation.mutateAsync({ id: visit.id });
            showSuccess("Approved", `Visit for ${visit.visitorName} has been approved.`);
        } catch (err) { showApiError(err); }
    };

    const handleReject = async () => {
        try {
            await rejectMutation.mutateAsync({ id: visit.id, data: { notes: rejectReason } });
            showSuccess("Rejected", `Visit for ${visit.visitorName} has been rejected.`);
            setShowReject(false);
        } catch (err) { showApiError(err); }
    };

    const handleExtend = async () => {
        try {
            await extendMutation.mutateAsync({ id: visit.id, data: { additionalMinutes: Number(extendMinutes), reason: extendReason || "Extended by host" } });
            showSuccess("Extended", `Visit has been extended by ${extendMinutes} minutes.`);
            setShowExtend(false);
            setExtendReason("");
        } catch (err) { showApiError(err); }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync(visit.id);
            showSuccess("Cancelled", `Visit for ${visit.visitorName} has been cancelled.`);
            setShowCancelConfirm(false);
        } catch (err) { showApiError(err); }
    };

    const handleCompleteInduction = async () => {
        try {
            await inductionMutation.mutateAsync({ id: visit.id, data: { passed: true } });
            showSuccess("Induction Complete", `Safety induction marked as complete for ${visit.visitorName}.`);
        } catch (err) { showApiError(err); }
    };

    const openEditModal = () => {
        setEditForm({
            visitorName: visit.visitorName || "",
            visitorMobile: visit.visitorMobile || "",
            expectedDate: visit.expectedDate ? visit.expectedDate.slice(0, 10) : "",
            purpose: visit.purpose || "",
        });
        setShowEdit(true);
    };

    const handleUpdate = async () => {
        try {
            await updateMutation.mutateAsync({
                id: visit.id,
                data: {
                    visitorName: editForm.visitorName,
                    visitorMobile: editForm.visitorMobile,
                    expectedDate: editForm.expectedDate || undefined,
                    purpose: editForm.purpose,
                },
            });
            showSuccess("Updated", `Visit for ${editForm.visitorName} has been updated.`);
            setShowEdit(false);
        } catch (err) { showApiError(err); }
    };

    const timeline: { time: string; label: string; icon: any; color: string }[] = [];
    if (visit.createdAt) timeline.push({ time: fmt.dateTime(visit.createdAt), label: "Visit Created", icon: FileText, color: "primary" });
    if (visit.approvalTimestamp && visit.approvalStatus === "APPROVED") timeline.push({ time: fmt.dateTime(visit.approvalTimestamp), label: "Approved", icon: CheckCircle2, color: "success" });
    if (visit.approvalTimestamp && visit.approvalStatus === "REJECTED") timeline.push({ time: fmt.dateTime(visit.approvalTimestamp), label: "Rejected", icon: XCircle, color: "danger" });
    if (visit.checkInTime) timeline.push({ time: fmt.dateTime(visit.checkInTime), label: "Checked In", icon: LogIn, color: "success" });
    if (visit.safetyInductionTimestamp) timeline.push({ time: fmt.dateTime(visit.safetyInductionTimestamp), label: "Induction Completed", icon: Shield, color: "info" });
    if (visit.checkOutTime) timeline.push({ time: fmt.dateTime(visit.checkOutTime), label: "Checked Out", icon: LogOut, color: "neutral" });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <a
                        href="/app/company/visitors/list"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </a>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">{visit.visitorName}</h1>
                            <VisitStatusBadge status={visit.status} />
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 text-sm">
                            {visit.visitCode && <span className="font-mono">{visit.visitCode}</span>}
                            {visit.visitorCompany && <span> -- {visit.visitorCompany}</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {visit.approvalStatus === "PENDING" && canApprove && (
                        <>
                            <button
                                onClick={handleApprove}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {approveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Approve
                            </button>
                            <button
                                onClick={() => setShowReject(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors"
                            >
                                <XCircle size={14} /> Reject
                            </button>
                        </>
                    )}
                    {(visit.status === "EXPECTED" || visit.status === "ARRIVED") && visit.approvalStatus !== "PENDING" && visit.approvalStatus !== "REJECTED" && canCreate && (
                        <button
                            onClick={handleCheckIn}
                            disabled={checkInMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {checkInMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                            Check In
                        </button>
                    )}
                    {visit.status === "CHECKED_IN" && canCreate && (
                        <>
                            <button
                                onClick={handleCheckOut}
                                disabled={checkOutMutation.isPending}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-600 hover:bg-neutral-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {checkOutMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                Check Out
                            </button>
                            <button
                                onClick={() => setShowExtend(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 text-sm font-bold transition-colors hover:bg-warning-100"
                            >
                                <Timer size={14} /> Extend
                            </button>
                        </>
                    )}
                    {visit.safetyInductionStatus === "PENDING" && canCreate && (
                        <button
                            onClick={handleCompleteInduction}
                            disabled={inductionMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-info-600 hover:bg-info-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {inductionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BookCheck size={14} />}
                            Mark Induction Complete
                        </button>
                    )}
                    {(visit.status === "EXPECTED" || visit.status === "ARRIVED") && canCreate && (
                        <button
                            onClick={openEditModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-bold transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                    )}
                    {(visit.status === "EXPECTED" || visit.status === "ARRIVED") && canCreate && (
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={cancelMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {cancelMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Cancel Visit
                        </button>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visitor Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Visitor Information</h2>
                        {visit.visitorPhoto && (
                            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-100 dark:border-neutral-800">
                                <img src={visit.visitorPhoto} alt={visit.visitorName} className="w-20 h-20 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700 shadow-md" />
                                <div>
                                    <p className="text-lg font-bold text-primary-950 dark:text-white">{visit.visitorName}</p>
                                    {visit.visitorCompany && <p className="text-sm text-neutral-500 dark:text-neutral-400">{visit.visitorCompany}</p>}
                                    {visit.visitorDesignation && <p className="text-xs text-neutral-400">{visit.visitorDesignation}</p>}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <InfoRow icon={User} label="Name" value={visit.visitorName} />
                            <InfoRow icon={Phone} label="Mobile" value={visit.visitorMobile} />
                            <InfoRow icon={Mail} label="Email" value={visit.visitorEmail} />
                            <InfoRow icon={Building2} label="Company" value={visit.visitorCompany} />
                            <InfoRow icon={Shield} label="Type" value={visit.visitorType?.name || visit.visitorTypeName} />
                            <InfoRow icon={FileText} label="Purpose" value={visit.purpose} />
                            <InfoRow icon={Car} label="Vehicle" value={visit.vehicleRegNumber} />
                            <InfoRow icon={FileText} label="ID Type" value={visit.governmentIdType} />
                            {visit.governmentIdNumber && <InfoRow icon={FileText} label="ID Number" value={visit.governmentIdNumber} />}
                        </div>
                        {visit.idDocumentPhoto && (
                            <div className="mt-4">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">ID Document</p>
                                <img src={visit.idDocumentPhoto} alt="ID Document" className="max-w-xs rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm" />
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Visit Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <InfoRow icon={User} label="Host" value={visit.hostEmployeeName ?? visit.hostEmployeeId} />
                            <InfoRow icon={MapPin} label="Gate" value={visit.assignedGate?.name || visit.checkInGate?.name} />
                            <InfoRow icon={MapPin} label="Plant" value={visit.plantId} />
                            <InfoRow icon={Clock} label="Expected Date" value={visit.expectedDate ? fmt.date(visit.expectedDate) : undefined} />
                            <InfoRow icon={LogIn} label="Check-In Time" value={visit.checkInTime ? fmt.dateTime(visit.checkInTime) : undefined} />
                            <InfoRow icon={LogOut} label="Check-Out Time" value={visit.checkOutTime ? fmt.dateTime(visit.checkOutTime) : undefined} />
                            <InfoRow icon={Hash} label="Badge Number" value={visit.badgeNumber} />
                            <InfoRow icon={BadgeCheck} label="Badge Format" value={visit.badgeFormat} />
                        </div>
                        {visit.specialInstructions && (
                            <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Instructions</span>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{visit.specialInstructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Digital Badge Link */}
                    {visit.status === "CHECKED_IN" && visit.badgeNumber && visit.visitCode && (
                        <div className="bg-success-50 dark:bg-success-900/10 rounded-2xl border border-success-200 dark:border-success-800/50 shadow-xl shadow-neutral-900/5 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
                                <div>
                                    <span className="text-sm font-bold text-success-700 dark:text-success-400 block">Digital Badge Active</span>
                                    <span className="text-xs text-success-600 dark:text-success-500 font-mono">{visit.badgeNumber}</span>
                                </div>
                            </div>
                            <a
                                href={`/visit/${visit.visitCode}/badge`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold transition-colors"
                            >
                                <ExternalLink size={12} />
                                View Badge
                            </a>
                        </div>
                    )}

                    {/* Safety Compliance */}
                    {(visit.safetyInductionStatus !== undefined || visit.ndaSigned !== undefined || visit.ppeIssued !== undefined) && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                            <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Safety & Compliance</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={cn("p-3 rounded-xl border text-center", visit.safetyInductionStatus === "COMPLETED" ? "bg-success-50 border-success-200 dark:bg-success-900/10 dark:border-success-800/50" : "bg-neutral-50 border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700")}>
                                    <Shield className={cn("w-5 h-5 mx-auto mb-1", visit.safetyInductionStatus === "COMPLETED" ? "text-success-600" : "text-neutral-400")} />
                                    <span className={cn("text-xs font-bold", visit.safetyInductionStatus === "COMPLETED" ? "text-success-700 dark:text-success-400" : "text-neutral-500")}>
                                        Induction {visit.safetyInductionStatus === "COMPLETED" ? "Complete" : visit.safetyInductionStatus === "NOT_REQUIRED" ? "N/A" : "Pending"}
                                    </span>
                                </div>
                                <div className={cn("p-3 rounded-xl border text-center", visit.ndaSigned ? "bg-success-50 border-success-200 dark:bg-success-900/10 dark:border-success-800/50" : "bg-neutral-50 border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700")}>
                                    <FileText className={cn("w-5 h-5 mx-auto mb-1", visit.ndaSigned ? "text-success-600" : "text-neutral-400")} />
                                    <span className={cn("text-xs font-bold", visit.ndaSigned ? "text-success-700 dark:text-success-400" : "text-neutral-500")}>
                                        NDA {visit.ndaSigned ? "Signed" : "N/A"}
                                    </span>
                                </div>
                                <div className={cn("p-3 rounded-xl border text-center", visit.ppeIssued ? "bg-success-50 border-success-200 dark:bg-success-900/10 dark:border-success-800/50" : "bg-neutral-50 border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700")}>
                                    <Shield className={cn("w-5 h-5 mx-auto mb-1", visit.ppeIssued ? "text-success-600" : "text-neutral-400")} />
                                    <span className={cn("text-xs font-bold", visit.ppeIssued ? "text-success-700 dark:text-success-400" : "text-neutral-500")}>
                                        PPE {visit.ppeIssued ? "Issued" : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Timeline</h2>
                        {timeline.length > 0 ? (
                            <div className="space-y-4">
                                {timeline.map((event, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", {
                                            "bg-primary-50 dark:bg-primary-900/30": event.color === "primary",
                                            "bg-success-50 dark:bg-success-900/30": event.color === "success",
                                            "bg-danger-50 dark:bg-danger-900/30": event.color === "danger",
                                            "bg-info-50 dark:bg-info-900/30": event.color === "info",
                                            "bg-neutral-100 dark:bg-neutral-800": event.color === "neutral",
                                        })}>
                                            <event.icon className={cn("w-4 h-4", {
                                                "text-primary-600 dark:text-primary-400": event.color === "primary",
                                                "text-success-600 dark:text-success-400": event.color === "success",
                                                "text-danger-600 dark:text-danger-400": event.color === "danger",
                                                "text-info-600 dark:text-info-400": event.color === "info",
                                                "text-neutral-500 dark:text-neutral-400": event.color === "neutral",
                                            })} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-primary-950 dark:text-white block">{event.label}</span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{event.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 dark:text-neutral-500">No timeline events yet.</p>
                        )}
                    </div>

                    {/* Visit QR Code */}
                    {visit?.visitCode && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                            <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Visit QR Code</h2>
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-white p-4 rounded-xl">
                                    <QRCode value={visit.visitCode} size={180} />
                                </div>
                                <p className="text-sm font-mono text-neutral-600 dark:text-neutral-300">{visit.visitCode}</p>
                            </div>
                        </div>
                    )}

                    {/* Approval Trail */}
                    {visit.approvalTrail && visit.approvalTrail.length > 0 && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                            <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-4">Approval Trail</h2>
                            <div className="space-y-3">
                                {visit.approvalTrail.map((entry: any, i: number) => (
                                    <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-primary-950 dark:text-white">{entry.approverName || "System"}</span>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", entry.action === "APPROVED" ? "bg-success-50 text-success-700 border-success-200" : "bg-danger-50 text-danger-700 border-danger-200")}>
                                                {entry.action}
                                            </span>
                                        </div>
                                        {entry.reason && <p className="text-xs text-neutral-500">{entry.reason}</p>}
                                        <span className="text-[10px] text-neutral-400">{entry.timestamp ? fmt.dateTime(entry.timestamp) : ""}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Extend Modal */}
            {showExtend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-4">Extend Visit</h2>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Additional Minutes</label>
                            <input
                                type="number"
                                value={extendMinutes}
                                onChange={(e) => setExtendMinutes(e.target.value)}
                                min={15}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason <span className="text-danger-500">*</span></label>
                            <textarea
                                value={extendReason}
                                onChange={(e) => setExtendReason(e.target.value)}
                                placeholder="Reason for extension..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowExtend(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleExtend} disabled={extendMutation.isPending} className="flex-1 py-3 rounded-xl bg-warning-600 hover:bg-warning-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {extendMutation.isPending ? "Extending..." : "Extend"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-4">Reject Visit</h2>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowReject(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Visit Confirm Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Cancel Visit</h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                            Are you sure you want to cancel the visit for <span className="font-bold text-primary-950 dark:text-white">{visit.visitorName}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Keep Visit</button>
                            <button onClick={handleCancel} disabled={cancelMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {cancelMutation.isPending ? "Cancelling..." : "Cancel Visit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Visit Modal */}
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Edit Visit</h2>
                            <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <XCircle size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Visitor Name</label>
                                <input
                                    type="text"
                                    value={editForm.visitorName}
                                    onChange={(e) => setEditForm((p) => ({ ...p, visitorName: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                <input
                                    type="text"
                                    value={editForm.visitorMobile}
                                    onChange={(e) => setEditForm((p) => ({ ...p, visitorMobile: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Expected Date</label>
                                <input
                                    type="date"
                                    value={editForm.expectedDate}
                                    onChange={(e) => setEditForm((p) => ({ ...p, expectedDate: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purpose</label>
                                <input
                                    type="text"
                                    value={editForm.purpose}
                                    onChange={(e) => setEditForm((p) => ({ ...p, purpose: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleUpdate} disabled={updateMutation.isPending || !editForm.visitorName} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
