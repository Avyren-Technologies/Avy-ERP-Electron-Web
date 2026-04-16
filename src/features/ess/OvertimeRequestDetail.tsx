import {
    X,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    Banknote,
    Gift,
    CalendarDays,
    User,
    Paperclip,
    FileText,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useMyOvertimeDetail } from "@/features/ess/use-overtime-queries";
import type { OvertimeRequestStatus } from "@/lib/api/ess";

interface OvertimeRequestDetailProps {
    id: string | null;
    onClose: () => void;
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const STATUS_CONFIG: Record<
    string,
    { icon: typeof Clock; label: string; cls: string; bgCls: string }
> = {
    pending: {
        icon: Clock,
        label: "Pending",
        cls: "text-warning-700 dark:text-warning-400",
        bgCls: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50",
    },
    approved: {
        icon: CheckCircle2,
        label: "Approved",
        cls: "text-success-700 dark:text-success-400",
        bgCls: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50",
    },
    rejected: {
        icon: XCircle,
        label: "Rejected",
        cls: "text-danger-700 dark:text-danger-400",
        bgCls: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50",
    },
    paid: {
        icon: Banknote,
        label: "Paid",
        cls: "text-primary-700 dark:text-primary-400",
        bgCls: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50",
    },
    comp_off_accrued: {
        icon: Gift,
        label: "Comp-Off Accrued",
        cls: "text-accent-700 dark:text-accent-400",
        bgCls: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50",
    },
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider shrink-0 w-32">
                {label}
            </span>
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 text-right">
                {children}
            </div>
        </div>
    );
}

export function OvertimeRequestDetail({ id, onClose }: OvertimeRequestDetailProps) {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useMyOvertimeDetail(id ?? "");

    if (!id) return null;

    const detail = data?.data;
    const statusKey = detail?.status?.toLowerCase() ?? "pending";
    const sc = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
    const StatusIcon = sc.icon;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Overtime Detail
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : !detail ? (
                        <div className="text-center py-12 text-neutral-500">
                            Request not found
                        </div>
                    ) : (
                        <>
                            {/* Status Banner */}
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl border",
                                    sc.bgCls,
                                )}
                            >
                                <StatusIcon className={cn("w-5 h-5", sc.cls)} />
                                <span className={cn("text-sm font-bold capitalize", sc.cls)}>
                                    {sc.label}
                                </span>
                            </div>

                            {/* Core Details */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                    Request Info
                                </h4>
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4">
                                    <DetailRow label="Date">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                                            {fmt.date(detail.date)}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Hours">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                            {detail.requestedHours}h
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Type">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] font-bold uppercase">
                                            {detail.multiplierSource?.replace(/_/g, " ")}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Source">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                detail.source === "AUTO"
                                                    ? "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400"
                                                    : "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400",
                                            )}
                                        >
                                            {detail.source === "AUTO" ? (
                                                <Zap className="w-3 h-3" />
                                            ) : (
                                                <User className="w-3 h-3" />
                                            )}
                                            {detail.source}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Multiplier">
                                        {detail.appliedMultiplier}x
                                    </DetailRow>
                                    {detail.calculatedAmount != null && (
                                        <DetailRow label="Amount">
                                            <span className="text-success-600 dark:text-success-400 font-bold">
                                                {INR.format(detail.calculatedAmount)}
                                            </span>
                                        </DetailRow>
                                    )}
                                    {detail.compOffGranted && (
                                        <DetailRow label="Comp-Off">
                                            <span className="inline-flex items-center gap-1 text-accent-600 dark:text-accent-400">
                                                <Gift className="w-3.5 h-3.5" />
                                                Granted
                                            </span>
                                        </DetailRow>
                                    )}
                                </div>
                            </div>

                            {/* Reason */}
                            {detail.reason && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                        Reason
                                    </h4>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 py-3">
                                        {detail.reason}
                                    </p>
                                </div>
                            )}

                            {/* Attendance Info */}
                            {detail.attendanceRecord && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                        Attendance Record
                                    </h4>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4">
                                        {detail.attendanceRecord.shiftName && (
                                            <DetailRow label="Shift">
                                                {detail.attendanceRecord.shiftName}
                                            </DetailRow>
                                        )}
                                        {detail.attendanceRecord.punchIn && (
                                            <DetailRow label="Punch In">
                                                {fmt.time(detail.attendanceRecord.punchIn)}
                                            </DetailRow>
                                        )}
                                        {detail.attendanceRecord.punchOut && (
                                            <DetailRow label="Punch Out">
                                                {fmt.time(detail.attendanceRecord.punchOut)}
                                            </DetailRow>
                                        )}
                                        {detail.attendanceRecord.workedHours != null && (
                                            <DetailRow label="Worked">
                                                {Number(detail.attendanceRecord.workedHours).toFixed(1)}h
                                            </DetailRow>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Approval Info */}
                            {(detail.approvedByName || detail.approvalNotes || detail.approvedAt) && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                        Approval
                                    </h4>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4">
                                        {detail.approvedByName && (
                                            <DetailRow label="Approved By">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-neutral-400" />
                                                    {detail.approvedByName}
                                                </span>
                                            </DetailRow>
                                        )}
                                        {detail.approvedAt && (
                                            <DetailRow label="Approved At">
                                                {fmt.dateTime(detail.approvedAt)}
                                            </DetailRow>
                                        )}
                                        {detail.approvalNotes && (
                                            <DetailRow label="Notes">
                                                {detail.approvalNotes}
                                            </DetailRow>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Attachments */}
                            {detail.attachments && detail.attachments.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                        Attachments
                                    </h4>
                                    <div className="space-y-2">
                                        {detail.attachments.map((url: string, idx: number) => {
                                            const fileName = url.split("/").pop() ?? `Attachment ${idx + 1}`;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                        <Paperclip className="w-4 h-4 text-primary-500" />
                                                    </div>
                                                    <span className="flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                                        {fileName}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                Created {fmt.dateTime(detail.createdAt)}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
