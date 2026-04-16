import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Clock,
    Plus,
    Loader2,
    CheckCircle2,
    XCircle,
    Banknote,
    Gift,
    Zap,
    User,
    Paperclip,
    ChevronLeft,
    ChevronRight,
    Timer,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
    useMyOvertimeRequests,
    useMyOvertimeSummary,
} from "@/features/ess/use-overtime-queries";
import { ClaimOvertimeDialog } from "@/features/ess/ClaimOvertimeDialog";
import { OvertimeRequestDetail } from "@/features/ess/OvertimeRequestDetail";
import { EmptyState } from "@/components/ui/EmptyState";
import type {
    OvertimeRequestStatus,
    OvertimeRequestSource,
    OvertimeRequestListItem,
    OvertimeSummary,
} from "@/lib/api/ess";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const PAGE_SIZE = 10;

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string }> = {
        pending: {
            icon: Clock,
            cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        },
        approved: {
            icon: CheckCircle2,
            cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        },
        rejected: {
            icon: XCircle,
            cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        },
        paid: {
            icon: Banknote,
            cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        },
        comp_off_accrued: {
            icon: Gift,
            cls: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        },
    };
    const c = config[s] ?? config.pending;
    const Icon = c.icon;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize",
                c.cls,
            )}
        >
            <Icon size={10} />
            {status?.replace(/_/g, " ")}
        </span>
    );
}

/* ── Summary Cards ── */

function SummaryCards({
    summary,
    onCompOffClick,
}: {
    summary: OvertimeSummary | null;
    onCompOffClick: () => void;
}) {
    if (!summary) return null;

    const compOff = summary.compOff;
    const compOffLabel = compOff?.expiresAt
        ? `exp: ${new Date(compOff.expiresAt).toLocaleDateString("en-IN", { month: "short" })}`
        : "balance";

    const cards = [
        {
            label: "OT Hours",
            sublabel: "this month",
            value: `${summary.totalOtHours.toFixed(1)}h`,
            cls: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50",
            icon: Timer,
        },
        {
            label: "Pending",
            sublabel: "requests",
            value: String(summary.pendingCount),
            cls: "text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50",
            icon: AlertCircle,
        },
        {
            label: "Approved",
            sublabel: "amount",
            value: INR.format(summary.approvedAmount),
            cls: "text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50",
            icon: CheckCircle2,
        },
        {
            label: "Comp-Off",
            sublabel: compOffLabel,
            value: compOff ? `${compOff.balance} days` : "0 days",
            cls: "text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50",
            icon: Gift,
            clickable: !!compOff?.leaveTypeId,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => {
                const Icon = c.icon;
                return (
                    <div
                        key={c.label}
                        onClick={c.clickable ? onCompOffClick : undefined}
                        className={cn(
                            "rounded-xl border p-4 transition-all",
                            c.cls,
                            c.clickable && "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 opacity-60" />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                                {c.label}
                            </span>
                        </div>
                        <div className="text-2xl font-bold">{c.value}</div>
                        <div className="text-[10px] font-medium opacity-60 mt-0.5">{c.sublabel}</div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Filter Bar ── */

const STATUS_OPTIONS: { value: OvertimeRequestStatus | ""; label: string }[] = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PAID", label: "Paid" },
    { value: "COMP_OFF_ACCRUED", label: "Comp-Off" },
];

const SOURCE_OPTIONS: { value: OvertimeRequestSource | ""; label: string }[] = [
    { value: "", label: "All Sources" },
    { value: "AUTO", label: "Auto" },
    { value: "MANUAL", label: "Manual" },
];

const SELECT_CLASS =
    "rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent focus:outline-none transition-all";

const DATE_INPUT_CLASS =
    "rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent focus:outline-none transition-all";

/* ── Main Screen ── */

export function MyOvertimeScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const canClaim = useCanPerform("ess:claim-overtime");

    // Filters
    const [status, setStatus] = useState<OvertimeRequestStatus | "">("");
    const [source, setSource] = useState<OvertimeRequestSource | "">("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    // Dialogs
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Data
    const { data: summaryData } = useMyOvertimeSummary();
    const summary: OvertimeSummary | null = summaryData?.data ?? null;

    const queryParams = {
        ...(status ? { status: status as OvertimeRequestStatus } : {}),
        ...(source ? { source: source as OvertimeRequestSource } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        page,
        limit: PAGE_SIZE,
    };
    const { data: listData, isLoading } = useMyOvertimeRequests(queryParams);
    const requests: OvertimeRequestListItem[] = listData?.data ?? [];
    const meta = listData?.meta;
    const totalPages = meta?.totalPages ?? 1;

    function handleCompOffClick() {
        if (summary?.compOff?.leaveTypeId) {
            navigate("/app/company/hr/apply-leave", {
                state: { preselectedLeaveType: summary.compOff.leaveTypeId },
            });
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        My Overtime
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 ml-[46px]">
                        Track and claim overtime hours
                    </p>
                </div>
                {canClaim && (
                    <button
                        onClick={() => setShowClaimDialog(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-sm font-bold hover:from-primary-700 hover:to-accent-700 transition-all shadow-md shadow-primary-200 dark:shadow-primary-900/30 active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" /> Claim OT
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <SummaryCards summary={summary} onCompOffClick={handleCompOffClick} />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value as OvertimeRequestStatus | "");
                        setPage(1);
                    }}
                    className={SELECT_CLASS}
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <select
                    value={source}
                    onChange={(e) => {
                        setSource(e.target.value as OvertimeRequestSource | "");
                        setPage(1);
                    }}
                    className={SELECT_CLASS}
                >
                    {SOURCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                    }}
                    placeholder="From"
                    className={DATE_INPUT_CLASS}
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                    }}
                    placeholder="To"
                    className={DATE_INPUT_CLASS}
                />
                {(status || source || dateFrom || dateTo) && (
                    <button
                        onClick={() => {
                            setStatus("");
                            setSource("");
                            setDateFrom("");
                            setDateTo("");
                            setPage(1);
                        }}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : requests.length === 0 ? (
                <EmptyState
                    icon="inbox"
                    title="No Overtime Records"
                    message="No overtime records found. Auto-detected overtime will appear here, or you can submit a manual claim."
                />
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Hours
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {requests.map((r) => (
                                    <tr
                                        key={r.id}
                                        onClick={() => setSelectedId(r.id)}
                                        className="hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                            {fmt.date(r.date)}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                            <span className="font-semibold">{r.requestedHours}</span>
                                            <span className="text-neutral-400 ml-0.5">h</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-300">
                                                {r.multiplierSource?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    r.source === "AUTO"
                                                        ? "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400"
                                                        : "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400",
                                                )}
                                            >
                                                {r.source === "AUTO" ? (
                                                    <Zap className="w-3 h-3" />
                                                ) : (
                                                    <User className="w-3 h-3" />
                                                )}
                                                {r.source}
                                            </span>
                                            {r.source === "MANUAL" && r.reason && (
                                                <span className="ml-1.5" title={r.reason}>
                                                    <AlertCircle className="w-3 h-3 text-neutral-400 inline" />
                                                </span>
                                            )}
                                            {r.attachments && r.attachments.length > 0 && (
                                                <span className="ml-1" title={`${r.attachments.length} attachment(s)`}>
                                                    <Paperclip className="w-3 h-3 text-neutral-400 inline" />
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">
                                            {r.calculatedAmount != null
                                                ? INR.format(r.calculatedAmount)
                                                : <span className="text-neutral-300 dark:text-neutral-600">&mdash;</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <StatusBadge status={r.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Page {page} of {totalPages}
                                {meta?.total != null && (
                                    <span className="ml-1">({meta.total} records)</span>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Claim Dialog */}
            <ClaimOvertimeDialog open={showClaimDialog} onClose={() => setShowClaimDialog(false)} />

            {/* Detail Slide-Over */}
            {selectedId && (
                <OvertimeRequestDetail id={selectedId} onClose={() => setSelectedId(null)} />
            )}
        </div>
    );
}
