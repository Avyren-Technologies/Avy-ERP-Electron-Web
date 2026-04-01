import { useState } from "react";
import {
    UserCheck,
    UserX,
    Clock,
    CalendarOff,
    Search,
    Filter,
    ChevronDown,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    X,
    ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceRecords, useAttendanceSummary, useAttendanceOverrides } from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateAttendanceOverride, useCreateAttendanceOverride } from "@/features/company-admin/api/use-attendance-mutations";
import { SkeletonTable, SkeletonKPIGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── KPI Card ── */

interface KpiProps {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: "success" | "danger" | "warning" | "primary";
}

const colorMap = {
    success: {
        bg: "bg-success-50 dark:bg-success-900/20",
        border: "border-success-100 dark:border-success-800/50",
        icon: "text-success-600 dark:text-success-400",
        value: "text-success-700 dark:text-success-400",
    },
    danger: {
        bg: "bg-danger-50 dark:bg-danger-900/20",
        border: "border-danger-100 dark:border-danger-800/50",
        icon: "text-danger-600 dark:text-danger-400",
        value: "text-danger-700 dark:text-danger-400",
    },
    warning: {
        bg: "bg-warning-50 dark:bg-warning-900/20",
        border: "border-warning-100 dark:border-warning-800/50",
        icon: "text-warning-600 dark:text-warning-400",
        value: "text-warning-700 dark:text-warning-400",
    },
    primary: {
        bg: "bg-primary-50 dark:bg-primary-900/20",
        border: "border-primary-100 dark:border-primary-800/50",
        icon: "text-primary-600 dark:text-primary-400",
        value: "text-primary-700 dark:text-primary-400",
    },
};

function KpiCard({ label, value, icon: Icon, color }: KpiProps) {
    const c = colorMap[color];
    return (
        <div className={cn("rounded-2xl border p-5", c.bg, c.border)}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
                    <Icon size={16} className={c.icon} />
                </div>
            </div>
            <p className={cn("text-3xl font-extrabold", c.value)}>{value}</p>
        </div>
    );
}

/* ── Helpers ── */

function formatPunchTime(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function formatWorkedHrs(value: unknown): string {
    if (value == null || value === "") return "—";
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(1)} hrs`;
}

const SOURCE_LABELS: Record<string, string> = {
    MOBILE_GPS: "Mobile",
    WEB: "Web",
    BIOMETRIC: "Biometric",
    MANUAL: "Manual",
    SYSTEM: "System",
};

/* ── Status Badge ── */

const STATUS_STYLES: Record<string, string> = {
    present: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    absent: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    late: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    lop: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    half_day: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    incomplete: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    on_leave: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
    holiday: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
    week_off: "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
};

function StatusBadge({ status }: { status: string }) {
    const key = status?.toLowerCase().replace(/ /g, "_");
    const cls = STATUS_STYLES[key] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    const label = status?.replace(/_/g, " ");
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {label}
        </span>
    );
}

/* ── Source Badge ── */

function SourceBadge({ source }: { source: string }) {
    return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {SOURCE_LABELS[source] ?? source}
        </span>
    );
}

/** Normalize a backend attendance record into a flat shape for the table. */
function normalizeRecord(r: any) {
    const emp = r.employee ?? {};
    const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(" ");
    return {
        ...r,
        employeeName: (r.employeeName ?? fullName) || "—",
        employeeCode: r.employeeCode ?? emp.employeeId ?? "",
        department: r.department ?? emp.department?.name ?? "",
        designation: r.designation ?? emp.designation?.name ?? "",
        shiftName: r.shift?.name ?? "",
        shiftTime: r.shift ? `${r.shift.startTime} – ${r.shift.endTime}` : "",
    };
}

/* ── Department Breakdown ── */

function DepartmentBreakdown({ departments }: { departments: any[] }) {
    if (!departments || departments.length === 0) return null;
    const max = Math.max(...departments.map((d: any) => d.total || 1));
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <BarChart3 size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-sm font-bold text-primary-950 dark:text-white">Department Breakdown</h3>
            </div>
            <div className="space-y-3">
                {departments.map((dept: any) => (
                    <div key={dept.departmentId ?? dept.name ?? dept.departmentName}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{dept.departmentName ?? dept.name}</span>
                            <span className="text-xs font-bold text-primary-950 dark:text-white">
                                {dept.present}/{dept.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${((dept.present ?? 0) / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Screen ── */

export function AttendanceDashboardScreen() {
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");
    const [overrideModal, setOverrideModal] = useState(false);
    const [overrideForm, setOverrideForm] = useState({
        employeeId: '',
        attendanceRecordId: '',
        issueType: 'MISSING_PUNCH_IN' as string,
        correctedPunchIn: '',
        correctedPunchOut: '',
        reason: '',
    });

    const summaryQuery = useAttendanceSummary();
    const recordsQuery = useAttendanceRecords({ date, department: department || undefined });
    const overridesQuery = useAttendanceOverrides({ status: 'PENDING' });
    const processOverrideMutation = useUpdateAttendanceOverride();
    const createOverrideMutation = useCreateAttendanceOverride();

    const summaryRaw = (summaryQuery.data as any)?.data ?? {};
    // Backend wraps counts in a `summary` sub-object
    const summary = summaryRaw.summary ?? summaryRaw;
    const rawRecords: any[] = (recordsQuery.data as any)?.data ?? [];
    const records = rawRecords.map(normalizeRecord);
    const departmentBreakdown: any[] = summaryRaw.departmentBreakdown ?? summaryRaw.departments ?? [];
    const pendingOverrides: any[] = (overridesQuery.data as any)?.data ?? [];

    const filtered = records.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.employeeName?.toLowerCase().includes(s) ||
            r.employeeCode?.toLowerCase().includes(s) ||
            r.department?.toLowerCase().includes(s)
        );
    });

    const isLoading = summaryQuery.isLoading || recordsQuery.isLoading;

    const ISSUE_TYPES = [
        { value: 'MISSING_PUNCH_IN', label: 'Missing Punch In' },
        { value: 'MISSING_PUNCH_OUT', label: 'Missing Punch Out' },
        { value: 'ABSENT_OVERRIDE', label: 'Absent Override' },
        { value: 'LATE_OVERRIDE', label: 'Late Override' },
        { value: 'NO_PUNCH', label: 'No Punch' },
    ];

    const showPunchIn = ['MISSING_PUNCH_IN', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(overrideForm.issueType);
    const showPunchOut = ['MISSING_PUNCH_OUT', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(overrideForm.issueType);

    const handleApproveOverride = async (overrideId: string) => {
        try {
            await processOverrideMutation.mutateAsync({ id: overrideId, data: { status: 'APPROVED' } });
            showSuccess('Override Approved', 'Attendance record has been updated.');
        } catch (err) {
            showApiError(err);
        }
    };

    const handleRejectOverride = async (overrideId: string) => {
        try {
            await processOverrideMutation.mutateAsync({ id: overrideId, data: { status: 'REJECTED' } });
            showSuccess('Override Rejected', 'The request has been rejected.');
        } catch (err) {
            showApiError(err);
        }
    };

    const openOverrideModal = (record: any) => {
        setOverrideForm({
            employeeId: record.employeeId ?? '',
            attendanceRecordId: record.id ?? '',
            issueType: !record.punchIn ? 'MISSING_PUNCH_IN' : !record.punchOut ? 'MISSING_PUNCH_OUT' : 'ABSENT_OVERRIDE',
            correctedPunchIn: '',
            correctedPunchOut: '',
            reason: '',
        });
        setOverrideModal(true);
    };

    const handleCreateOverride = async () => {
        const payload: any = {
            attendanceRecordId: overrideForm.attendanceRecordId,
            issueType: overrideForm.issueType,
            reason: overrideForm.reason,
        };
        if (overrideForm.correctedPunchIn && showPunchIn) {
            payload.correctedPunchIn = `${date}T${overrideForm.correctedPunchIn}:00`;
        }
        if (overrideForm.correctedPunchOut && showPunchOut) {
            payload.correctedPunchOut = `${date}T${overrideForm.correctedPunchOut}:00`;
        }
        try {
            await createOverrideMutation.mutateAsync(payload);
            showSuccess('Override Created', 'Attendance override has been created.');
            setOverrideModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Daily attendance dashboard and records</p>
                </div>
            </div>

            {/* KPI Row */}
            {summaryQuery.isLoading ? (
                <SkeletonKPIGrid count={4} />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Present" value={summary.present ?? 0} icon={UserCheck} color="success" />
                    <KpiCard label="Absent" value={summary.absent ?? 0} icon={UserX} color="danger" />
                    <KpiCard label="Late" value={summary.late ?? 0} icon={Clock} color="warning" />
                    <KpiCard label="On Leave" value={summary.onLeave ?? 0} icon={CalendarOff} color="primary" />
                </div>
            )}

            {/* Department Breakdown */}
            <DepartmentBreakdown departments={departmentBreakdown} />

            {/* Pending Regularizations / Overrides */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-6 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center">
                        <ShieldAlert size={16} className="text-warning-600 dark:text-warning-400" />
                    </div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">Pending Regularizations</h3>
                    {pendingOverrides.length > 0 && (
                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400 border border-warning-200 dark:border-warning-800/50">
                            {pendingOverrides.length}
                        </span>
                    )}
                </div>
                {overridesQuery.isLoading ? (
                    <div className="px-6 pb-6"><SkeletonTable rows={3} cols={6} /></div>
                ) : pendingOverrides.length === 0 ? (
                    <div className="px-6 pb-6">
                        <EmptyState icon="list" title="No pending requests" message="All regularization requests have been processed." />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-6 font-bold">Employee</th>
                                    <th className="py-3 px-6 font-bold">Date</th>
                                    <th className="py-3 px-6 font-bold text-center">Issue Type</th>
                                    <th className="py-3 px-6 font-bold">Reason</th>
                                    <th className="py-3 px-6 font-bold">Corrected Times</th>
                                    <th className="py-3 px-6 font-bold text-center">Status</th>
                                    <th className="py-3 px-6 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {pendingOverrides.map((ov: any) => (
                                    <tr key={ov.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-3 px-6">
                                            <span className="font-bold text-primary-950 dark:text-white">{ov.employeeName ?? ov.employee?.name ?? "—"}</span>
                                        </td>
                                        <td className="py-3 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {ov.date ? new Date(ov.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                {ov.issueType?.replace(/_/g, ' ') ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">{ov.reason ?? "—"}</td>
                                        <td className="py-3 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {ov.correctedPunchIn && <div>In: {new Date(ov.correctedPunchIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>}
                                            {ov.correctedPunchOut && <div>Out: {new Date(ov.correctedPunchOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>}
                                            {!ov.correctedPunchIn && !ov.correctedPunchOut && "—"}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                                PENDING
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleApproveOverride(ov.id)}
                                                    disabled={processOverrideMutation.isPending}
                                                    className="p-1.5 rounded-lg bg-success-50 hover:bg-success-100 dark:bg-success-900/20 dark:hover:bg-success-900/40 text-success-600 dark:text-success-400 transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectOverride(ov.id)}
                                                    disabled={processOverrideMutation.isPending}
                                                    className="p-1.5 rounded-lg bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/20 dark:hover:bg-danger-900/40 text-danger-600 dark:text-danger-400 transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    />
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white appearance-none transition-all min-w-[160px]"
                        >
                            <option value="">All Departments</option>
                            {departmentBreakdown.map((d: any) => (
                                <option key={d.departmentId ?? d.name} value={d.departmentId ?? d.name}>{d.departmentName ?? d.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {recordsQuery.isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-5 font-bold">Employee</th>
                                    <th className="py-4 px-5 font-bold">Shift</th>
                                    <th className="py-4 px-5 font-bold">Punch In</th>
                                    <th className="py-4 px-5 font-bold">Punch Out</th>
                                    <th className="py-4 px-5 font-bold">Worked</th>
                                    <th className="py-4 px-5 font-bold text-center">Status</th>
                                    <th className="py-4 px-5 font-bold text-center">Late</th>
                                    <th className="py-4 px-5 font-bold text-center">Source</th>
                                    <th className="py-4 px-5 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((rec: any) => (
                                    <tr
                                        key={rec.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group"
                                    >
                                        <td className="py-3.5 px-5">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{rec.employeeName}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {rec.employeeCode && (
                                                        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{rec.employeeCode}</span>
                                                    )}
                                                    {rec.department && (
                                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">· {rec.department}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            {rec.shiftName ? (
                                                <div>
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{rec.shiftName}</span>
                                                    <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">{rec.shiftTime}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchIn)}</td>
                                        <td className="py-3.5 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchOut)}</td>
                                        <td className="py-3.5 px-5 font-semibold text-neutral-700 dark:text-neutral-300 text-sm">{formatWorkedHrs(rec.workedHours)}</td>
                                        <td className="py-3.5 px-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <StatusBadge status={rec.status ?? "Unknown"} />
                                                {rec.finalStatusReason && (
                                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 max-w-[140px] truncate" title={rec.finalStatusReason}>
                                                        {rec.finalStatusReason}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-center">
                                            {rec.isLate && rec.lateMinutes ? (
                                                <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">{rec.lateMinutes}m</span>
                                            ) : rec.isEarlyExit && rec.earlyMinutes ? (
                                                <span className="text-xs font-semibold text-danger-600 dark:text-danger-400">-{rec.earlyMinutes}m</span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-5 text-center">
                                            <SourceBadge source={rec.source ?? "Manual"} />
                                        </td>
                                        <td className="py-3.5 px-5 text-center">
                                            <button
                                                onClick={() => openOverrideModal(rec)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 transition-colors"
                                            >
                                                <AlertTriangle size={12} />
                                                Override
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !recordsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No attendance records" message="No records found for the selected date and filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Override Creation Modal ── */}
            {overrideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Create Attendance Override</h2>
                            <button onClick={() => setOverrideModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Issue Type */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Issue Type *</label>
                                <select
                                    value={overrideForm.issueType}
                                    onChange={(e) => setOverrideForm((p) => ({ ...p, issueType: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all appearance-none"
                                >
                                    {ISSUE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Corrected Time Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                {showPunchIn && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Corrected Check-In</label>
                                        <input type="time" value={overrideForm.correctedPunchIn} onChange={(e) => setOverrideForm((p) => ({ ...p, correctedPunchIn: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                )}
                                {showPunchOut && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Corrected Check-Out</label>
                                        <input type="time" value={overrideForm.correctedPunchOut} onChange={(e) => setOverrideForm((p) => ({ ...p, correctedPunchOut: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                )}
                            </div>
                            {overrideForm.issueType === 'LATE_OVERRIDE' && (
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No corrected times needed — this will clear the late flag.</p>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason *</label>
                                <textarea value={overrideForm.reason} onChange={(e) => setOverrideForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason for override..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setOverrideModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreateOverride} disabled={createOverrideMutation.isPending || !overrideForm.reason.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createOverrideMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createOverrideMutation.isPending ? "Creating..." : "Create Override"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
