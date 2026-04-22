import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    UserCheck,
    UserX,
    Clock,
    CalendarOff,
    Search,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    X,
    ShieldAlert,
    Eye,
    MapPin,
    Camera,
    CalendarRange,
    Flag,
    ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceRecords, useAttendanceSummary, useAttendanceOverrides, useWeeklyReview, useWeeklyReviewSummary } from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateAttendanceOverride, useCreateAttendanceOverride, useMarkReviewed } from "@/features/company-admin/api/use-attendance-mutations";
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

function formatPunchTime(iso: string | null | undefined, fmt: ReturnType<typeof useCompanyFormatter>): string {
    if (!iso) return "—";
    return fmt.timeWithSeconds(iso);
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
    HR_BOOK: "HR Book",
    WEB_PORTAL: "Web Portal",
    FACE_RECOGNITION: "Face",
    IOT: "IoT",
    SMART_CARD: "Smart Card",
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
function normalizeRecord(r: any, fmt: ReturnType<typeof useCompanyFormatter>) {
    const emp = r.employee ?? {};
    const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(" ");
    return {
        ...r,
        employeeName: (r.employeeName ?? fullName) || "—",
        employeeCode: r.employeeCode ?? emp.employeeId ?? "",
        department: r.department ?? emp.department?.name ?? "",
        designation: r.designation ?? emp.designation?.name ?? "",
        shiftName: r.shift?.name ?? "",
        shiftTime: r.shift ? `${fmt.shiftTime(r.shift.startTime)} – ${fmt.shiftTime(r.shift.endTime)}` : "",
    };
}

/* ── Department Breakdown ── */

const DEPT_GRADIENTS = [
    { from: '#6366f1', to: '#8b5cf6' },  // indigo → violet
    { from: '#3b82f6', to: '#6366f1' },  // blue → indigo
    { from: '#8b5cf6', to: '#a78bfa' },  // violet → violet-light
    { from: '#6366f1', to: '#3b82f6' },  // indigo → blue
    { from: '#7c3aed', to: '#6366f1' },  // purple → indigo
    { from: '#4f46e5', to: '#7c3aed' },  // indigo-dark → purple
    { from: '#2563eb', to: '#4f46e5' },  // blue-dark → indigo-dark
    { from: '#818cf8', to: '#c084fc' },  // indigo-light → purple-light
    { from: '#6366f1', to: '#ec4899' },  // indigo → pink
    { from: '#3b82f6', to: '#06b6d4' },  // blue → cyan
];

function DeptRing({ present, total, gradient, size = 56 }: { present: number; total: number; gradient: { from: string; to: string }; size?: number }) {
    const pct = total > 0 ? (present / total) * 100 : 0;
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (circ * pct) / 100;
    const gradId = `g-${gradient.from.slice(1)}-${gradient.to.slice(1)}`;

    return (
        <svg width={size} height={size} className="shrink-0">
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={gradient.from} />
                    <stop offset="100%" stopColor={gradient.to} />
                </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-neutral-100 dark:text-neutral-800" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={`url(#${gradId})`} strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-700 ease-out"
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-primary-950 dark:fill-white">
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

function DepartmentBreakdown({ departments }: { departments: any[] }) {
    if (!departments || departments.length === 0) return null;
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <BarChart3 size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-sm font-bold text-primary-950 dark:text-white">Department Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {departments.map((dept: any, i: number) => {
                    const gradient = DEPT_GRADIENTS[i % DEPT_GRADIENTS.length]!;
                    const pct = dept.total > 0 ? Math.round(((dept.present ?? 0) / dept.total) * 100) : 0;
                    return (
                        <div
                            key={dept.departmentId ?? dept.name ?? dept.departmentName}
                            className="relative group rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            {/* Subtle gradient background glow */}
                            <div
                                className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity rounded-xl"
                                style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                            />
                            <div className="relative flex flex-col items-center text-center gap-2.5">
                                <DeptRing present={dept.present ?? 0} total={dept.total ?? 0} gradient={gradient} />
                                <div>
                                    <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 leading-tight line-clamp-2">
                                        {dept.departmentName ?? dept.name}
                                    </p>
                                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: gradient.from }}>
                                        {dept.present}/{dept.total} present
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Review Flag Helpers ── */

const FLAG_LABELS: Record<string, string> = {
    MISSING_PUNCH: 'Missing Punch',
    AUTO_MAPPED: 'Auto-Mapped',
    WORKED_ON_LEAVE: 'Worked on Leave',
    LATE_BEYOND_THRESHOLD: 'Late Anomaly',
    MULTIPLE_SHIFT_ANOMALY: 'Multi-Shift',
    OT_ANOMALY: 'OT Anomaly',
};

const FLAG_STYLES: Record<string, string> = {
    MISSING_PUNCH: 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
    AUTO_MAPPED: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
    WORKED_ON_LEAVE: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
    LATE_BEYOND_THRESHOLD: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
    MULTIPLE_SHIFT_ANOMALY: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
    OT_ANOMALY: 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
};

function ReviewFlagBadge({ flag }: { flag: string }) {
    const cls = FLAG_STYLES[flag] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
    return (
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cls)}>
            {FLAG_LABELS[flag] ?? flag}
        </span>
    );
}

/** Get the Monday of the current ISO week */
function getCurrentWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0]!;
}

/** Get the Sunday of the current ISO week */
function getCurrentWeekEnd(): string {
    const start = getCurrentWeekStart();
    const d = new Date(start);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0]!;
}

/* ── Screen ── */

export function AttendanceDashboardScreen() {
    const fmt = useCompanyFormatter();
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

    // ── Daily tab state ──
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [overrideModal, setOverrideModal] = useState(false);
    const [detailRecord, setDetailRecord] = useState<any>(null);
    const [overrideForm, setOverrideForm] = useState({
        employeeId: '',
        attendanceRecordId: '',
        issueType: 'MISSING_PUNCH_IN' as string,
        correctedPunchIn: '',
        correctedPunchOut: '',
        reason: '',
    });

    const summaryQuery = useAttendanceSummary();
    const recordsQuery = useAttendanceRecords({ dateFrom: date, dateTo: date, departmentId: department || undefined, page, limit: 25 });
    const overridesQuery = useAttendanceOverrides({ status: 'PENDING' });
    const processOverrideMutation = useUpdateAttendanceOverride();
    const createOverrideMutation = useCreateAttendanceOverride();

    const summaryRaw = (summaryQuery.data as any)?.data ?? {};
    // Backend wraps counts in a `summary` sub-object
    const summary = summaryRaw.summary ?? summaryRaw;
    const recordsResponse = recordsQuery.data as any;
    const rawRecords: any[] = recordsResponse?.data ?? [];
    const meta = recordsResponse?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 };
    const records = rawRecords.map((r: any) => normalizeRecord(r, fmt));
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

    // ── Weekly Review tab state ──
    const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
    const [weekEnd, setWeekEnd] = useState(getCurrentWeekEnd);
    const [weeklyFlag, setWeeklyFlag] = useState<string>('');
    const [weeklyPage, setWeeklyPage] = useState(1);
    const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());

    const weeklyReviewQuery = useWeeklyReview({ weekStart, weekEnd, flag: weeklyFlag || undefined, page: weeklyPage, limit: 25 });
    const weeklyReviewSummaryQuery = useWeeklyReviewSummary({ weekStart, weekEnd });
    const markReviewedMutation = useMarkReviewed();

    const weeklySummaryRaw = (weeklyReviewSummaryQuery.data as any)?.data ?? {};
    const weeklySummary = { ...weeklySummaryRaw, ...(weeklySummaryRaw.flagCounts ?? {}) };
    const weeklyResponse = weeklyReviewQuery.data as any;
    const weeklyRecords: any[] = weeklyResponse?.data?.records ?? [];
    const weeklyMeta = weeklyResponse?.data?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 };
    const weeklyNormalized = weeklyRecords.map((r: any) => normalizeRecord(r, fmt));

    const FLAG_OPTIONS: { value: string; label: string }[] = [
        { value: '', label: 'All Flags' },
        { value: 'MISSING_PUNCH', label: 'Missing Punch' },
        { value: 'AUTO_MAPPED', label: 'Auto-Mapped' },
        { value: 'WORKED_ON_LEAVE', label: 'Worked on Leave' },
        { value: 'LATE_BEYOND_THRESHOLD', label: 'Late Anomaly' },
        { value: 'MULTIPLE_SHIFT_ANOMALY', label: 'Multi-Shift' },
        { value: 'OT_ANOMALY', label: 'OT Anomaly' },
    ];

    const toggleReviewId = (id: string) => {
        setSelectedReviewIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllReviewIds = () => {
        if (selectedReviewIds.size === weeklyNormalized.filter((r: any) => !r.isReviewed).length) {
            setSelectedReviewIds(new Set());
        } else {
            setSelectedReviewIds(new Set(weeklyNormalized.filter((r: any) => !r.isReviewed).map((r: any) => r.id)));
        }
    };

    const handleMarkReviewed = async () => {
        if (selectedReviewIds.size === 0) return;
        try {
            await markReviewedMutation.mutateAsync({ recordIds: Array.from(selectedReviewIds) });
            showSuccess('Marked Reviewed', `${selectedReviewIds.size} record(s) marked as reviewed.`);
            setSelectedReviewIds(new Set());
        } catch (err) {
            showApiError(err);
        }
    };

    const ISSUE_TYPES = [
        { value: 'MISSING_PUNCH_IN', label: 'Missing Punch In' },
        { value: 'MISSING_PUNCH_OUT', label: 'Missing Punch Out' },
        { value: 'ABSENT_OVERRIDE', label: 'Absent Override' },
        { value: 'LATE_OVERRIDE', label: 'Late Override' },
        { value: 'NO_PUNCH', label: 'No Punch' },
    ];

    const showPunchIn = ['MISSING_PUNCH_IN', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(overrideForm.issueType);
    const showPunchOut = ['MISSING_PUNCH_OUT', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(overrideForm.issueType);

    const handleDateChange = (newDate: string) => { setDate(newDate); setPage(1); };
    const handleDeptChange = (newDept: string) => { setDepartment(newDept); setPage(1); };

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
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {activeTab === 'daily' ? 'Daily attendance dashboard and records' : 'Weekly review of flagged attendance records'}
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                        activeTab === 'daily'
                            ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                >
                    <Clock size={15} />
                    Daily View
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all',
                        activeTab === 'weekly'
                            ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                >
                    <CalendarRange size={15} />
                    Weekly Review
                </button>
            </div>

            {/* ══════════ DAILY TAB ══════════ */}
            {activeTab === 'daily' && (<>

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
                                {pendingOverrides.map((ov: any) => {
                                    const ovEmp = ov.attendanceRecord?.employee ?? ov.employee ?? {};
                                    const ovName = [ovEmp.firstName, ovEmp.lastName].filter(Boolean).join(' ') || ov.employeeName || '—';
                                    const ovDate = ov.attendanceRecord?.date ?? ov.date;
                                    return (
                                    <tr key={ov.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-3 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{ovName}</span>
                                                {ovEmp.employeeId && <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">{ovEmp.employeeId}</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {ovDate ? fmt.date(ovDate) : "—"}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                {ov.issueType?.replace(/_/g, ' ') ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">{ov.reason ?? "—"}</td>
                                        <td className="py-3 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {ov.correctedPunchIn && <div>In: {fmt.time(ov.correctedPunchIn)}</div>}
                                            {ov.correctedPunchOut && <div>Out: {fmt.time(ov.correctedPunchOut)}</div>}
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
                                    );
                                })}
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
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    />
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <select
                            value={department}
                            onChange={(e) => handleDeptChange(e.target.value)}
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
                                        <td className="py-3.5 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchIn, fmt)}</td>
                                        <td className="py-3.5 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchOut, fmt)}</td>
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
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => setDetailRecord(rec)}
                                                    className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openOverrideModal(rec)}
                                                    className="p-1.5 rounded-lg text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 hover:bg-warning-100 dark:hover:bg-warning-900/40 border border-warning-200 dark:border-warning-800/50 transition-colors"
                                                    title="Override"
                                                >
                                                    <AlertTriangle size={14} />
                                                </button>
                                            </div>
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
                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Showing <span className="font-bold text-neutral-700 dark:text-neutral-300">{(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)}</span> of <span className="font-bold text-neutral-700 dark:text-neutral-300">{meta.total}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                                let p: number;
                                if (meta.totalPages <= 5) p = i + 1;
                                else if (page <= 3) p = i + 1;
                                else if (page >= meta.totalPages - 2) p = meta.totalPages - 4 + i;
                                else p = page - 2 + i;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                                            p === page
                                                ? "bg-primary-600 text-white"
                                                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                        )}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {meta.totalPages > 5 && page < meta.totalPages - 2 && (
                                <>
                                    <span className="text-neutral-400 text-xs px-1">...</span>
                                    <button onClick={() => setPage(meta.totalPages)} className="w-8 h-8 rounded-lg text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">{meta.totalPages}</button>
                                </>
                            )}
                            <button
                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                disabled={page >= meta.totalPages}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            </>)}

            {/* ══════════ WEEKLY REVIEW TAB ══════════ */}
            {activeTab === 'weekly' && (<>

            {/* Week Picker + Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Week Start</label>
                        <input
                            type="date"
                            value={weekStart}
                            onChange={(e) => { setWeekStart(e.target.value); setWeeklyPage(1); setSelectedReviewIds(new Set()); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Week End</label>
                        <input
                            type="date"
                            value={weekEnd}
                            onChange={(e) => { setWeekEnd(e.target.value); setWeeklyPage(1); setSelectedReviewIds(new Set()); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        />
                    </div>
                </div>
                {/* Flag Filter Chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {FLAG_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setWeeklyFlag(opt.value); setWeeklyPage(1); setSelectedReviewIds(new Set()); }}
                            className={cn(
                                'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors',
                                weeklyFlag === opt.value
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weekly Review Summary KPI Cards */}
            {weeklyReviewSummaryQuery.isLoading ? (
                <SkeletonKPIGrid count={6} />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Total Flagged" value={weeklySummary.totalRecords ?? 0} icon={Flag} color="primary" />
                    <KpiCard label="Missing Punch" value={weeklySummary.MISSING_PUNCH ?? 0} icon={AlertTriangle} color="danger" />
                    <KpiCard label="Auto-Mapped" value={weeklySummary.AUTO_MAPPED ?? 0} icon={ClipboardCheck} color="primary" />
                    <KpiCard label="Worked on Leave" value={weeklySummary.WORKED_ON_LEAVE ?? 0} icon={CalendarOff} color="warning" />
                    <KpiCard label="Late Anomaly" value={weeklySummary.LATE_BEYOND_THRESHOLD ?? 0} icon={Clock} color="warning" />
                    <KpiCard label="OT Anomaly" value={weeklySummary.OT_ANOMALY ?? 0} icon={BarChart3} color="danger" />
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedReviewIds.size > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                        {selectedReviewIds.size} record(s) selected
                    </span>
                    <button
                        onClick={handleMarkReviewed}
                        disabled={markReviewedMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        {markReviewedMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                        {markReviewedMutation.isPending ? 'Processing...' : 'Mark Selected as Reviewed'}
                    </button>
                </div>
            )}

            {/* Weekly Review Records Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {weeklyReviewQuery.isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-4 font-bold w-10">
                                        <input
                                            type="checkbox"
                                            checked={weeklyNormalized.filter((r: any) => !r.isReviewed).length > 0 && selectedReviewIds.size === weeklyNormalized.filter((r: any) => !r.isReviewed).length}
                                            onChange={toggleAllReviewIds}
                                            className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                                        />
                                    </th>
                                    <th className="py-4 px-4 font-bold">Employee</th>
                                    <th className="py-4 px-4 font-bold">Date</th>
                                    <th className="py-4 px-4 font-bold">Shift</th>
                                    <th className="py-4 px-4 font-bold">Punch In</th>
                                    <th className="py-4 px-4 font-bold">Punch Out</th>
                                    <th className="py-4 px-4 font-bold text-center">Status</th>
                                    <th className="py-4 px-4 font-bold">Flags</th>
                                    <th className="py-4 px-4 font-bold text-center">Reviewed</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {weeklyNormalized.map((rec: any) => (
                                    <tr
                                        key={rec.id}
                                        className={cn(
                                            'border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors',
                                            rec.isReviewed && 'opacity-60'
                                        )}
                                    >
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedReviewIds.has(rec.id)}
                                                onChange={() => toggleReviewId(rec.id)}
                                                disabled={rec.isReviewed}
                                                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{rec.employeeName}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {rec.employeeCode && <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{rec.employeeCode}</span>}
                                                    {rec.department && <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">. {rec.department}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {rec.date ? fmt.date(rec.date) : '--'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {rec.shiftName ? (
                                                <div>
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{rec.shiftName}</span>
                                                    <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">{rec.shiftTime}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400">--</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchIn, fmt)}</td>
                                        <td className="py-3 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchOut, fmt)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <StatusBadge status={rec.status ?? 'Unknown'} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(rec.reviewFlags ?? []).map((f: string) => (
                                                    <ReviewFlagBadge key={f} flag={f} />
                                                ))}
                                                {(!rec.reviewFlags || rec.reviewFlags.length === 0) && (
                                                    <span className="text-xs text-neutral-400">--</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {rec.isReviewed ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
                                                    <CheckCircle2 size={12} />
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {weeklyNormalized.length === 0 && !weeklyReviewQuery.isLoading && (
                                    <tr>
                                        <td colSpan={9}>
                                            <EmptyState icon="list" title="No flagged records" message="No records requiring review for this week." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Pagination */}
                {weeklyMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Showing <span className="font-bold text-neutral-700 dark:text-neutral-300">{(weeklyPage - 1) * weeklyMeta.limit + 1}--{Math.min(weeklyPage * weeklyMeta.limit, weeklyMeta.total)}</span> of <span className="font-bold text-neutral-700 dark:text-neutral-300">{weeklyMeta.total}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setWeeklyPage((p) => Math.max(1, p - 1))}
                                disabled={weeklyPage <= 1}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, weeklyMeta.totalPages) }, (_, i) => {
                                let p: number;
                                if (weeklyMeta.totalPages <= 5) p = i + 1;
                                else if (weeklyPage <= 3) p = i + 1;
                                else if (weeklyPage >= weeklyMeta.totalPages - 2) p = weeklyMeta.totalPages - 4 + i;
                                else p = weeklyPage - 2 + i;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setWeeklyPage(p)}
                                        className={cn(
                                            'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                                            p === weeklyPage
                                                ? 'bg-primary-600 text-white'
                                                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setWeeklyPage((p) => Math.min(weeklyMeta.totalPages, p + 1))}
                                disabled={weeklyPage >= weeklyMeta.totalPages}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            </>)}

            {/* ── Attendance Detail Modal ── */}
            {detailRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailRecord(null)}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white">{detailRecord.employeeName}</h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{detailRecord.employeeCode} · {detailRecord.department} · {detailRecord.designation}</p>
                            </div>
                            <button onClick={() => setDetailRecord(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Status + Date */}
                            <div className="flex items-center gap-3">
                                <StatusBadge status={detailRecord.status ?? 'Unknown'} />
                                <span className="text-sm font-mono text-neutral-600 dark:text-neutral-400">{fmt.date(detailRecord.date)}</span>
                                {detailRecord.isRegularized && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200">REGULARIZED</span>}
                            </div>

                            {/* Time Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Punch In</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white font-mono">{formatPunchTime(detailRecord.punchIn, fmt)}</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Punch Out</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white font-mono">{formatPunchTime(detailRecord.punchOut, fmt)}</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Worked Hours</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{formatWorkedHrs(detailRecord.workedHours)}</p>
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Source</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{SOURCE_LABELS[detailRecord.source] ?? detailRecord.source ?? '—'}</p>
                                </div>
                            </div>

                            {/* Shift */}
                            {detailRecord.shiftName && (
                                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl p-3 border border-primary-100 dark:border-primary-800/30">
                                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Shift</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{detailRecord.shiftName} <span className="font-mono text-xs text-neutral-500 ml-1">{detailRecord.shiftTime}</span></p>
                                </div>
                            )}

                            {/* Late / Early Exit */}
                            {(detailRecord.isLate || detailRecord.isEarlyExit) && (
                                <div className="flex gap-3">
                                    {detailRecord.isLate && detailRecord.lateMinutes != null && (
                                        <div className="flex-1 bg-warning-50 dark:bg-warning-900/10 rounded-xl p-3 border border-warning-200 dark:border-warning-800/30">
                                            <p className="text-[10px] font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider mb-1">Late By</p>
                                            <p className="text-sm font-bold text-warning-700 dark:text-warning-400">{detailRecord.lateMinutes} minutes</p>
                                        </div>
                                    )}
                                    {detailRecord.isEarlyExit && detailRecord.earlyMinutes != null && (
                                        <div className="flex-1 bg-danger-50 dark:bg-danger-900/10 rounded-xl p-3 border border-danger-200 dark:border-danger-800/30">
                                            <p className="text-[10px] font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider mb-1">Early Exit By</p>
                                            <p className="text-sm font-bold text-danger-700 dark:text-danger-400">{detailRecord.earlyMinutes} minutes</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Overtime */}
                            {detailRecord.overtimeHours != null && Number(detailRecord.overtimeHours) > 0 && (
                                <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl p-3 border border-success-100 dark:border-success-800/30">
                                    <p className="text-[10px] font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Overtime</p>
                                    <p className="text-sm font-bold text-success-700 dark:text-success-400">{Number(detailRecord.overtimeHours).toFixed(1)} hours</p>
                                </div>
                            )}

                            {/* Location */}
                            {detailRecord.location?.name && (
                                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <MapPin size={13} />
                                    <span className="font-semibold">{detailRecord.location.name}</span>
                                </div>
                            )}

                            {/* Geo coordinates */}
                            {(detailRecord.checkInLatitude || detailRecord.checkOutLatitude) && (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Geo Location</p>
                                    {detailRecord.checkInLatitude && <p className="text-xs text-neutral-600 dark:text-neutral-400">Check-in: {detailRecord.checkInLatitude}, {detailRecord.checkInLongitude}</p>}
                                    {detailRecord.checkOutLatitude && <p className="text-xs text-neutral-600 dark:text-neutral-400">Check-out: {detailRecord.checkOutLatitude}, {detailRecord.checkOutLongitude}</p>}
                                </div>
                            )}

                            {/* Geofence Status */}
                            {detailRecord.geoStatus && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Geofence:</span>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-full",
                                        detailRecord.geoStatus === 'INSIDE_GEOFENCE' && "bg-success-50 text-success-700",
                                        detailRecord.geoStatus === 'OUTSIDE_GEOFENCE' && "bg-danger-50 text-danger-700",
                                        detailRecord.geoStatus === 'NO_LOCATION' && "bg-neutral-100 text-neutral-500",
                                    )}>
                                        {detailRecord.geoStatus === 'INSIDE_GEOFENCE' ? 'Inside Geofence' :
                                         detailRecord.geoStatus === 'OUTSIDE_GEOFENCE' ? 'Outside Geofence' : 'No Location'}
                                    </span>
                                </div>
                            )}

                            {/* Break Deduction */}
                            {detailRecord.appliedBreakDeductionMinutes > 0 && (
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-neutral-500 dark:text-neutral-400">Break Deduction</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{detailRecord.appliedBreakDeductionMinutes} min</span>
                                </div>
                            )}

                            {/* Resolution Trace (admin) */}
                            {detailRecord.resolutionTrace && (
                                <details className="mt-3 border-t border-neutral-100 dark:border-neutral-800 pt-2">
                                    <summary className="text-xs font-medium text-neutral-500 dark:text-neutral-400 cursor-pointer">Policy Applied</summary>
                                    <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
                                        {Object.entries(typeof detailRecord.resolutionTrace === 'string' ? JSON.parse(detailRecord.resolutionTrace) : detailRecord.resolutionTrace).map(([key, value]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <span className="font-mono">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {/* Remarks / Reason */}
                            {detailRecord.remarks && (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Remarks</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{detailRecord.remarks}</p>
                                </div>
                            )}
                            {detailRecord.finalStatusReason && (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Status Reason</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{detailRecord.finalStatusReason}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailRecord(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                            <button onClick={() => { openOverrideModal(detailRecord); setDetailRecord(null); }} className="flex-1 py-2.5 rounded-xl bg-warning-500 hover:bg-warning-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                <AlertTriangle size={14} />
                                Create Override
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
