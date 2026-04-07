import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Plus,
    Loader2,
    X,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    User,
    Calendar,
    FileText,
    MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceOverrides } from "@/features/company-admin/api/use-attendance-queries";
import {
    useCreateAttendanceOverride,
    useUpdateAttendanceOverride,
} from "@/features/company-admin/api/use-attendance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function TextareaField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "APPROVED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "REJECTED"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : s === "PENDING"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

/* ── Helpers ── */

const ISSUE_LABELS: Record<string, string> = {
    MISSING_PUNCH_IN: "Missing Punch-In",
    MISSING_PUNCH_OUT: "Missing Punch-Out",
    NO_PUNCH: "No Punch",
    LATE_OVERRIDE: "Late Override",
    ABSENT_OVERRIDE: "Absent Override",
    WRONG_TIME: "Wrong Time",
    SYSTEM_ERROR: "System Error",
    OTHER: "Other",
};

/** Normalize override record — extract nested employee/date info */
function normalizeOverride(o: any) {
    const rec = o.attendanceRecord ?? {};
    const emp = rec.employee ?? {};
    const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(" ");
    return {
        ...o,
        _employeeName: fullName || "Unknown",
        _employeeCode: emp.employeeId ?? "",
        _department: emp.department?.name ?? "",
        _date: rec.date,
        _recStatus: rec.status,
        _punchIn: rec.punchIn,
        _punchOut: rec.punchOut,
        _workedHours: rec.workedHours,
        _shiftId: rec.shiftId,
        _source: rec.source,
        _isLate: rec.isLate,
        _lateMinutes: rec.lateMinutes,
    };
}

/* ── Constants ── */

const TABS = ["All", "Pending", "Approved", "Rejected"] as const;
type TabValue = (typeof TABS)[number];

const ISSUE_TYPES = [
    { value: "MISSING_PUNCH_IN", label: "Missing Punch-In" },
    { value: "MISSING_PUNCH_OUT", label: "Missing Punch-Out" },
    { value: "NO_PUNCH", label: "No Punch" },
    { value: "LATE_OVERRIDE", label: "Late Override" },
    { value: "ABSENT_OVERRIDE", label: "Absent Override" },
];

const EMPTY_OVERRIDE = {
    attendanceRecordId: "",
    issueType: "",
    correctedPunchIn: "",
    correctedPunchOut: "",
    reason: "",
};

/* ── Screen ── */

export function AttendanceOverrideScreen() {
    const fmt = useCompanyFormatter();
    const [tab, setTab] = useState<TabValue>("All");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<any>(null);
    const [form, setForm] = useState({ ...EMPTY_OVERRIDE });

    const statusFilter = tab === "All" ? undefined : tab.toUpperCase();
    const { data, isLoading, isError } = useAttendanceOverrides({ status: statusFilter });
    const createMutation = useCreateAttendanceOverride();
    const updateMutation = useUpdateAttendanceOverride();

    const overrides: any[] = ((data as any)?.data ?? []).map(normalizeOverride);

    const filtered = overrides.filter((o: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            o._employeeName?.toLowerCase().includes(s) ||
            o._employeeCode?.toLowerCase().includes(s) ||
            o.issueType?.toLowerCase().includes(s) ||
            o.reason?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setForm({ ...EMPTY_OVERRIDE });
        setModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Override Created", "Attendance override request submitted.");
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
        try {
            await updateMutation.mutateAsync({ id, data: { status: action } });
            showSuccess(
                `Override ${action === "APPROVED" ? "Approved" : "Rejected"}`,
                `The attendance override has been ${action.toLowerCase()}.`
            );
        } catch (err) {
            showApiError(err);
        }
    };

    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Overrides</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Review and manage attendance correction requests</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    New Override
                </button>
            </div>

            {/* Tab Filter */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                            tab === t
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by employee, issue type, or reason..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load overrides. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Issue Type</th>
                                    <th className="py-4 px-6 font-bold">Corrected Times</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((o: any) => (
                                    <tr
                                        key={o.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{o._employeeName}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {o._employeeCode && (
                                                        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{o._employeeCode}</span>
                                                    )}
                                                    {o._department && (
                                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">· {o._department}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {o._date ? fmt.date(o._date) : "—"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                                                {ISSUE_LABELS[o.issueType] ?? o.issueType?.replace(/_/g, " ") ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
                                                {o.correctedPunchIn && <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-neutral-400 w-6">In:</span> {fmt.time(o.correctedPunchIn)}</div>}
                                                {o.correctedPunchOut && <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-neutral-400 w-6">Out:</span> {fmt.time(o.correctedPunchOut)}</div>}
                                                {!o.correctedPunchIn && !o.correctedPunchOut && <span className="text-neutral-400">N/A</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">{o.reason ?? "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={o.status ?? "PENDING"} />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setDetailRecord(o)}
                                                    className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {o.status?.toUpperCase() === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(o.id, "APPROVED")}
                                                            disabled={updateMutation.isPending}
                                                            className="p-1.5 text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 hover:bg-success-100 dark:hover:bg-success-900/40 rounded-lg border border-success-200 dark:border-success-800/50 transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(o.id, "REJECTED")}
                                                            disabled={updateMutation.isPending}
                                                            className="p-1.5 text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 hover:bg-danger-100 dark:hover:bg-danger-900/40 rounded-lg border border-danger-200 dark:border-danger-800/50 transition-colors disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={14} />
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
                                            <EmptyState
                                                icon="inbox"
                                                title="No overrides found"
                                                message={tab === "All" ? "No attendance override requests yet." : `No ${tab.toLowerCase()} overrides.`}
                                                action={tab === "All" ? { label: "New Override", onClick: openCreate } : undefined}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {detailRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailRecord(null)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">Override Details</h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {ISSUE_LABELS[detailRecord.issueType] ?? detailRecord.issueType?.replace(/_/g, " ")}
                                </p>
                            </div>
                            <button onClick={() => setDetailRecord(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Status */}
                            <div className="flex items-center gap-3">
                                <StatusBadge status={detailRecord.status ?? "PENDING"} />
                                {detailRecord.payrollImpact && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                        {detailRecord.payrollImpact}
                                    </span>
                                )}
                            </div>

                            {/* Employee Info */}
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <User size={14} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{detailRecord._employeeName}</p>
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{detailRecord._employeeCode}{detailRecord._department ? ` · ${detailRecord._department}` : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <Calendar size={12} />
                                    <span className="font-mono">{detailRecord._date ? fmt.date(detailRecord._date) : "—"}</span>
                                    {detailRecord._recStatus && (
                                        <>
                                            <span className="text-neutral-300 dark:text-neutral-600">·</span>
                                            <span className="font-semibold">Original: {detailRecord._recStatus.replace(/_/g, " ")}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Original Attendance */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Original Punch In</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white font-mono">{detailRecord._punchIn ? fmt.time(detailRecord._punchIn) : "—"}</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Original Punch Out</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white font-mono">{detailRecord._punchOut ? fmt.time(detailRecord._punchOut) : "—"}</p>
                                </div>
                            </div>

                            {/* Corrected Times */}
                            {(detailRecord.correctedPunchIn || detailRecord.correctedPunchOut) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {detailRecord.correctedPunchIn && (
                                        <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl p-3 border border-success-100 dark:border-success-800/30">
                                            <p className="text-[10px] font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Corrected In</p>
                                            <p className="text-sm font-bold text-success-700 dark:text-success-400 font-mono">{fmt.time(detailRecord.correctedPunchIn)}</p>
                                        </div>
                                    )}
                                    {detailRecord.correctedPunchOut && (
                                        <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl p-3 border border-success-100 dark:border-success-800/30">
                                            <p className="text-[10px] font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Corrected Out</p>
                                            <p className="text-sm font-bold text-success-700 dark:text-success-400 font-mono">{fmt.time(detailRecord.correctedPunchOut)}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Late info */}
                            {detailRecord._isLate && detailRecord._lateMinutes != null && (
                                <div className="bg-warning-50 dark:bg-warning-900/10 rounded-xl p-3 border border-warning-200 dark:border-warning-800/30">
                                    <p className="text-[10px] font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider mb-1">Late By</p>
                                    <p className="text-sm font-bold text-warning-700 dark:text-warning-400">{detailRecord._lateMinutes} minutes</p>
                                </div>
                            )}

                            {/* Reason */}
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={12} className="text-neutral-400" />
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reason</p>
                                </div>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{detailRecord.reason ?? "—"}</p>
                            </div>

                            {/* Timestamps */}
                            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 space-y-0.5">
                                <p>Created: {detailRecord.createdAt ? fmt.dateTime(detailRecord.createdAt) : "—"}</p>
                                {detailRecord.status?.toUpperCase() !== "PENDING" && detailRecord.updatedAt && (
                                    <p>Updated: {fmt.dateTime(detailRecord.updatedAt)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailRecord(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                            {detailRecord.status?.toUpperCase() === "PENDING" && (
                                <>
                                    <button
                                        onClick={() => { handleAction(detailRecord.id, "APPROVED"); setDetailRecord(null); }}
                                        disabled={updateMutation.isPending}
                                        className="flex-1 py-2.5 rounded-xl bg-success-500 hover:bg-success-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => { handleAction(detailRecord.id, "REJECTED"); setDetailRecord(null); }}
                                        disabled={updateMutation.isPending}
                                        className="flex-1 py-2.5 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Override Request</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Attendance Record ID" value={form.attendanceRecordId} onChange={(v) => updateField("attendanceRecordId", v)} placeholder="Record ID to override" />
                            <SelectField
                                label="Issue Type"
                                value={form.issueType}
                                onChange={(v) => updateField("issueType", v)}
                                options={ISSUE_TYPES}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Corrected Punch-In" value={form.correctedPunchIn} onChange={(v) => updateField("correctedPunchIn", v)} type="time" />
                                <FormField label="Corrected Punch-Out" value={form.correctedPunchOut} onChange={(v) => updateField("correctedPunchOut", v)} type="time" />
                            </div>
                            <TextareaField label="Reason" value={form.reason} onChange={(v) => updateField("reason", v)} placeholder="Explain the reason for the override..." />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !form.reason.trim() || !form.issueType} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
