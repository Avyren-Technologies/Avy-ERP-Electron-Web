import { useMemo, useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Users,
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
    CalendarDays,
    List,
    LayoutGrid,
    TrendingUp,
    RotateCcw,
    Timer,
    Percent,
    PieChart as PieChartIcon,
    Calendar as CalendarIcon,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend as RechartsLegend,
    LineChart,
    Line,
    ComposedChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { cn } from "@/lib/utils";
import {
    useAttendanceRecords,
    useAttendanceSummary,
    useAttendanceOverrides,
    useWeeklyReview,
    useWeeklyReviewSummary,
    useAttendanceRangeSummary,
    useAttendanceCalendar,
} from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateAttendanceOverride, useCreateAttendanceOverride, useMarkReviewed } from "@/features/company-admin/api/use-attendance-mutations";
import { useDepartments, useDesignations, useEmployeeTypes } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations, useCompanyShifts } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable, SkeletonKPIGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmployeePicker } from "@/components/ui/EmployeePicker";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── KPI Card ── */

interface KpiProps {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: "success" | "danger" | "warning" | "primary" | "accent";
}

const colorMap = {
    accent: {
        bg: "bg-accent-50 dark:bg-accent-900/20",
        border: "border-accent-100 dark:border-accent-800/50",
        icon: "text-accent-600 dark:text-accent-400",
        value: "text-accent-700 dark:text-accent-400",
    },
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
        <div className={cn("rounded-2xl border p-4", c.bg, c.border)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", c.bg)}>
                    <Icon size={14} className={c.icon} />
                </div>
            </div>
            <p className={cn("text-2xl font-extrabold", c.value)}>{value}</p>
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

/* ── Flexible KPI (string/number values) ── */

interface KpiFlexProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: 'success' | 'danger' | 'warning' | 'primary' | 'accent';
    suffix?: string;
}

function KpiCardFlex({ label, value, icon: Icon, color, suffix }: KpiFlexProps) {
    const c = colorMap[color];
    return (
        <div className={cn('rounded-2xl border p-4', c.bg, c.border)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', c.bg)}>
                    <Icon size={14} className={c.icon} />
                </div>
            </div>
            <p className={cn('text-2xl font-extrabold', c.value)}>
                {value}
                {suffix ? <span className="text-sm font-bold ml-1 opacity-70">{suffix}</span> : null}
            </p>
        </div>
    );
}

/* ── Date helpers (range / month) ── */

function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseISODate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
}

function getMonthBounds(year: number, monthIdx: number): { from: string; to: string } {
    const start = new Date(year, monthIdx, 1);
    const end = new Date(year, monthIdx + 1, 0);
    return { from: toISODate(start), to: toISODate(end) };
}

function diffDays(from: string, to: string): number {
    const a = parseISODate(from).getTime();
    const b = parseISODate(to).getTime();
    return Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1;
}

function getLast30Days(): { from: string; to: string } {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 29);
    return { from: toISODate(past), to: toISODate(today) };
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ── Calendar status pill ── */

const CALENDAR_STATUS: Record<string, { letter: string; bg: string; text: string; border: string; label: string }> = {
    present: { letter: 'P', bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300', border: 'border-success-200 dark:border-success-800/50', label: 'Present' },
    absent: { letter: 'A', bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-300', border: 'border-danger-200 dark:border-danger-800/50', label: 'Absent' },
    late: { letter: 'L', bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', border: 'border-warning-200 dark:border-warning-800/50', label: 'Late' },
    half_day: { letter: 'Hd', bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', border: 'border-warning-200 dark:border-warning-800/50', label: 'Half-Day' },
    on_leave: { letter: 'Lv', bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300', border: 'border-primary-200 dark:border-primary-800/50', label: 'On Leave' },
    holiday: { letter: 'H', bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300', border: 'border-primary-200 dark:border-primary-800/50', label: 'Holiday' },
    week_off: { letter: 'W', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700', label: 'Week Off' },
    lop: { letter: 'LOP', bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-300', border: 'border-danger-200 dark:border-danger-800/50', label: 'LOP' },
    incomplete: { letter: '?', bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-warning-700 dark:text-warning-400', border: 'border-warning-200 dark:border-warning-800/50', label: 'Incomplete' },
};

function CalendarLegend() {
    const keys: string[] = ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'week_off', 'lop'];
    return (
        <div className="flex flex-wrap items-center gap-2">
            {keys.map((k) => {
                const cfg = CALENDAR_STATUS[k];
                if (!cfg) return null;
                return (
                    <div key={k} className="flex items-center gap-1.5">
                        <span
                            className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-extrabold border', cfg.bg, cfg.text, cfg.border)}
                            aria-label={cfg.label}
                        >
                            {cfg.letter}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{cfg.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Trend Charts (Recharts: granularity toggle + multiple chart types) ── */

interface TrendDay {
    date: string;
    present: number;
    absent: number;
    late: number;
    onLeave?: number;
    holiday?: number;
    weekOff?: number;
    total: number;
}

type TrendGranularity = 'daily' | 'weekly' | 'monthly';
type TrendChartType = 'bar' | 'line' | 'area';

/** Tailwind palette anchors used by the charts (resolved at runtime via CSS vars would be nicer,
 *  but keeping hex constants here keeps recharts SSR-safe and works in both light/dark modes). */
const CHART_COLORS = {
    present: '#22c55e',   // success-500
    absent: '#ef4444',    // danger-500
    late: '#f59e0b',      // warning-500
    onLeave: '#6366f1',   // primary-500
    holiday: '#8b5cf6',   // accent-500
    weekOff: '#94a3b8',   // neutral-400
    attendance: '#6366f1',
    grid: '#e5e7eb',      // neutral-200
};

/** Get ISO week (Mon..Sun) start as YYYY-MM-DD. */
function getISOWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun..6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toISODate(d);
}

/** Get YYYY-MM key for the month containing this date. */
function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Aggregate raw daily trend into buckets keyed by week-start or month. */
function aggregateTrend(days: TrendDay[], granularity: TrendGranularity): TrendDay[] {
    if (granularity === 'daily') return days;
    const buckets = new Map<string, TrendDay>();
    for (const d of days) {
        const dt = parseISODate(d.date);
        const key = granularity === 'weekly' ? getISOWeekStart(dt) : getMonthKey(dt);
        const existing = buckets.get(key);
        if (existing) {
            existing.present += d.present;
            existing.absent += d.absent;
            existing.late += d.late;
            existing.onLeave = (existing.onLeave ?? 0) + (d.onLeave ?? 0);
            existing.holiday = (existing.holiday ?? 0) + (d.holiday ?? 0);
            existing.weekOff = (existing.weekOff ?? 0) + (d.weekOff ?? 0);
            existing.total += d.total;
        } else {
            buckets.set(key, { ...d, date: key });
        }
    }
    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Format the X-axis label per granularity. */
function formatBucketLabel(key: string, granularity: TrendGranularity, fmt: ReturnType<typeof useCompanyFormatter>): string {
    if (granularity === 'monthly') {
        const [y, m] = key.split('-');
        const d = new Date(Number(y), Number(m) - 1, 1);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    if (granularity === 'weekly') {
        // Week starting <date>
        const d = parseISODate(key);
        return `W ${d.getDate()}/${d.getMonth() + 1}`;
    }
    // Daily
    return String(parseISODate(key).getDate());
}

/** Compose chart rows with derived attendance% and friendly labels. */
function buildTrendRows(
    days: TrendDay[],
    granularity: TrendGranularity,
    fmt: ReturnType<typeof useCompanyFormatter>,
) {
    return days.map((d) => {
        const denom = d.present + d.absent;
        const attendancePct = denom > 0 ? Math.round((d.present / denom) * 100) : 0;
        return {
            ...d,
            label: formatBucketLabel(d.date, granularity, fmt),
            attendancePct,
        };
    });
}

/* ── Tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg px-3 py-2 text-xs">
            <div className="font-bold text-primary-950 dark:text-white mb-1">{label}</div>
            <div className="space-y-0.5">
                {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color || p.stroke || p.fill }} />
                        <span className="text-neutral-500 dark:text-neutral-400 capitalize">{String(p.name).replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 ml-auto">
                            {p.dataKey === 'attendancePct' ? `${p.value}%` : p.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main TrendChart with granularity + chart-type controls ── */
function TrendChart({ days, fmt, defaultGranularity = 'daily' }: { days: TrendDay[]; fmt: ReturnType<typeof useCompanyFormatter>; defaultGranularity?: TrendGranularity }) {
    const [granularity, setGranularity] = useState<TrendGranularity>(defaultGranularity);
    const [chartType, setChartType] = useState<TrendChartType>('bar');

    const aggregated = useMemo(() => aggregateTrend(days, granularity), [days, granularity]);
    const rows = useMemo(() => buildTrendRows(aggregated, granularity, fmt), [aggregated, granularity, fmt]);

    if (!days || days.length === 0) {
        return <EmptyState icon="list" title="No trend data" message="No attendance recorded in this range." />;
    }

    return (
        <div className="space-y-3">
            {/* Toolbar: granularity + chart type */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5">
                    {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setGranularity(g)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize',
                                granularity === g
                                    ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                            )}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5">
                    {([
                        { key: 'bar' as const, label: 'Bar', icon: BarChart3 },
                        { key: 'line' as const, label: 'Line', icon: TrendingUp },
                        { key: 'area' as const, label: 'Area', icon: LayoutGrid },
                    ]).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setChartType(key)}
                            className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer',
                                chartType === key
                                    ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                            )}
                        >
                            <Icon size={13} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 4" stroke={CHART_COLORS.grid} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} interval="preserveStartEnd" />
                            <YAxis yAxisId="count" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                            <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={36} domain={[0, 100]} unit="%" />
                            <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                            <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
                            <Bar yAxisId="count" dataKey="present" stackId="att" fill={CHART_COLORS.present} radius={[4, 4, 0, 0]} name="Present" />
                            <Bar yAxisId="count" dataKey="absent" stackId="att" fill={CHART_COLORS.absent} radius={[0, 0, 0, 0]} name="Absent" />
                            <Bar yAxisId="count" dataKey="late" stackId="att" fill={CHART_COLORS.late} radius={[0, 0, 0, 0]} name="Late" />
                            <Bar yAxisId="count" dataKey="onLeave" stackId="att" fill={CHART_COLORS.onLeave} radius={[0, 0, 0, 0]} name="On Leave" />
                            <Line yAxisId="pct" type="monotone" dataKey="attendancePct" stroke={CHART_COLORS.attendance} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.attendance }} activeDot={{ r: 5 }} name="Attendance %" />
                        </ComposedChart>
                    ) : chartType === 'line' ? (
                        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 4" stroke={CHART_COLORS.grid} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                            <RechartsTooltip content={<ChartTooltip />} />
                            <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
                            <Line type="monotone" dataKey="present" stroke={CHART_COLORS.present} strokeWidth={2.5} dot={{ r: 3 }} name="Present" />
                            <Line type="monotone" dataKey="absent" stroke={CHART_COLORS.absent} strokeWidth={2.5} dot={{ r: 3 }} name="Absent" />
                            <Line type="monotone" dataKey="late" stroke={CHART_COLORS.late} strokeWidth={2.5} dot={{ r: 3 }} name="Late" />
                            <Line type="monotone" dataKey="onLeave" stroke={CHART_COLORS.onLeave} strokeWidth={2.5} dot={{ r: 3 }} name="On Leave" />
                        </LineChart>
                    ) : (
                        <ComposedChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <defs>
                                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={CHART_COLORS.present} stopOpacity={0.45} />
                                    <stop offset="100%" stopColor={CHART_COLORS.present} stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={CHART_COLORS.absent} stopOpacity={0.45} />
                                    <stop offset="100%" stopColor={CHART_COLORS.absent} stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={CHART_COLORS.late} stopOpacity={0.45} />
                                    <stop offset="100%" stopColor={CHART_COLORS.late} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 4" stroke={CHART_COLORS.grid} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                            <RechartsTooltip content={<ChartTooltip />} />
                            <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
                            <Area type="monotone" dataKey="present" stroke={CHART_COLORS.present} fill="url(#presentGrad)" strokeWidth={2} name="Present" />
                            <Area type="monotone" dataKey="absent" stroke={CHART_COLORS.absent} fill="url(#absentGrad)" strokeWidth={2} name="Absent" />
                            <Area type="monotone" dataKey="late" stroke={CHART_COLORS.late} fill="url(#lateGrad)" strokeWidth={2} name="Late" />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/* ── Status Distribution Donut ── */
function StatusDistributionChart({ summary }: { summary: any }) {
    const data = useMemo(() => {
        const slices = [
            { name: 'Present', value: Number(summary?.present ?? 0), color: CHART_COLORS.present },
            { name: 'Absent', value: Number(summary?.absent ?? 0), color: CHART_COLORS.absent },
            { name: 'Late', value: Number(summary?.late ?? 0), color: CHART_COLORS.late },
            { name: 'On Leave', value: Number(summary?.onLeave ?? 0), color: CHART_COLORS.onLeave },
            { name: 'Holiday', value: Number(summary?.holiday ?? 0), color: CHART_COLORS.holiday },
            { name: 'Week Off', value: Number(summary?.weekOff ?? 0), color: CHART_COLORS.weekOff },
        ];
        return slices.filter((s) => s.value > 0);
    }, [summary]);

    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
        return <EmptyState icon="list" title="No status data" message="No attendance recorded yet." />;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        stroke="none"
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0];
                            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
                            return (
                                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg px-3 py-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.payload.color }} />
                                        <span className="font-bold text-primary-950 dark:text-white">{p.name}</span>
                                    </div>
                                    <div className="mt-1 text-neutral-500 dark:text-neutral-400">{p.value} records · {pct}%</div>
                                </div>
                            );
                        }}
                    />
                    <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Department Comparison Bar Chart ── */
function DepartmentComparisonChart({ departments }: { departments: any[] }) {
    const data = useMemo(() => {
        return (departments ?? [])
            .map((d) => {
                const present = Number(d.present ?? 0);
                const absent = Number(d.absent ?? 0);
                const onLeave = Number(d.onLeave ?? 0);
                const total = Number(d.total ?? present + absent + onLeave);
                const denom = present + absent || total || 1;
                const attendancePct = Math.round((present / denom) * 100);
                return {
                    name: d.departmentName ?? d.name ?? '—',
                    present,
                    absent,
                    onLeave,
                    attendancePct,
                };
            })
            .sort((a, b) => b.attendancePct - a.attendancePct)
            .slice(0, 12);
    }, [departments]);

    if (data.length === 0) {
        return <EmptyState icon="list" title="No department data" message="No attendance recorded by department yet." />;
    }

    return (
        <div className="w-full" style={{ height: Math.max(220, data.length * 28 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 4" stroke={CHART_COLORS.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                    <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" />
                    <Bar dataKey="present" stackId="d" fill={CHART_COLORS.present} name="Present" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" stackId="d" fill={CHART_COLORS.absent} name="Absent" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="onLeave" stackId="d" fill={CHART_COLORS.onLeave} name="On Leave" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Composite "Analytics" card: 3 charts in a responsive grid ── */
interface AttendanceChartsProps {
    days: TrendDay[];
    summary: any;
    departments: any[];
    fmt: ReturnType<typeof useCompanyFormatter>;
    loading?: boolean;
    title?: string;
    defaultGranularity?: TrendGranularity;
}

function AttendanceCharts({ days, summary, departments, fmt, loading, title = 'Trends & Analytics', defaultGranularity }: AttendanceChartsProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                <SkeletonTable rows={4} cols={10} />
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {/* Trend (full-width) */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                        <TrendingUp size={16} className="text-accent-600 dark:text-accent-400" />
                    </div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                </div>
                <TrendChart days={days} fmt={fmt} defaultGranularity={defaultGranularity ?? 'daily'} />
            </div>

            {/* Status distribution + Department comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                            <PieChartIcon size={16} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Status Distribution</h3>
                    </div>
                    <StatusDistributionChart summary={summary} />
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center">
                            <BarChart3 size={16} className="text-success-600 dark:text-success-400" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">By Department</h3>
                    </div>
                    <DepartmentComparisonChart departments={departments} />
                </div>
            </div>
        </div>
    );
}

/* ── Filter Bar (Department, Location, Designation, EmpType, Shift, Status, Source, Search) ── */

export interface RangeFilters {
    employeeId: string;
    departmentId: string;
    locationId: string;
    designationId: string;
    employeeTypeId: string;
    shiftId: string;
    status: string;
    source: string;
}

export const DEFAULT_RANGE_FILTERS: RangeFilters = {
    employeeId: '',
    departmentId: '',
    locationId: '',
    designationId: '',
    employeeTypeId: '',
    shiftId: '',
    status: '',
    source: '',
};

const STATUS_FILTER_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'week_off', label: 'Week Off' },
    { value: 'lop', label: 'LOP' },
];

const SOURCE_FILTER_OPTIONS = [
    { value: '', label: 'All Sources' },
    { value: 'MOBILE_GPS', label: 'Mobile' },
    { value: 'WEB', label: 'Web' },
    { value: 'BIOMETRIC', label: 'Biometric' },
    { value: 'MANUAL', label: 'Manual' },
    { value: 'SYSTEM', label: 'System' },
    { value: 'HR_BOOK', label: 'HR Book' },
    { value: 'WEB_PORTAL', label: 'Web Portal' },
    { value: 'FACE_RECOGNITION', label: 'Face' },
    { value: 'IOT', label: 'IoT' },
    { value: 'SMART_CARD', label: 'Smart Card' },
];

interface FilterBarProps {
    filters: RangeFilters;
    onChange: (f: RangeFilters) => void;
    onReset: () => void;
    show: boolean;
    onToggle: () => void;
}

function RangeFilterBar({ filters, onChange, onReset, show, onToggle }: FilterBarProps) {
    const departmentsQuery = useDepartments();
    const locationsQuery = useCompanyLocations();
    const designationsQuery = useDesignations();
    const employeeTypesQuery = useEmployeeTypes();
    const shiftsQuery = useCompanyShifts();

    const departments: any[] = (departmentsQuery.data as any)?.data ?? [];
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];
    const designations: any[] = (designationsQuery.data as any)?.data ?? [];
    const employeeTypes: any[] = (employeeTypesQuery.data as any)?.data ?? [];
    const shifts: any[] = (shiftsQuery.data as any)?.data ?? [];

    const activeCount = (Object.keys(filters) as (keyof RangeFilters)[]).filter(k => filters[k]).length;

    const set = (patch: Partial<RangeFilters>) => onChange({ ...filters, ...patch });

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <button
                    type="button"
                    onClick={onToggle}
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary-950 dark:text-white hover:text-primary-700 dark:hover:text-primary-400 transition-colors cursor-pointer"
                    aria-expanded={show}
                >
                    <Filter size={15} />
                    {show ? 'Hide Filters' : 'Show Filters'}
                    {activeCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
                            {activeCount}
                        </span>
                    )}
                    <ChevronDown size={14} className={cn('transition-transform', show && 'rotate-180')} />
                </button>
                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors cursor-pointer"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                )}
            </div>
            {show && (
                <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Employee search — server-driven dropdown */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Employee</label>
                        <EmployeePicker
                            value={filters.employeeId || null}
                            onChange={(id) => set({ employeeId: id ?? '' })}
                            placeholder="Search employees by name or code..."
                        />
                    </div>
                    {/* Department */}
                    <SelectFilter label="Department" value={filters.departmentId} onChange={(v) => set({ departmentId: v })} options={[{ value: '', label: 'All Departments' }, ...departments.map((d: any) => ({ value: d.id ?? d.departmentId, label: d.name ?? d.departmentName }))]} />
                    {/* Location */}
                    <SelectFilter label="Location" value={filters.locationId} onChange={(v) => set({ locationId: v })} options={[{ value: '', label: 'All Locations' }, ...locations.map((l: any) => ({ value: l.id, label: l.name }))]} />
                    {/* Designation */}
                    <SelectFilter label="Designation" value={filters.designationId} onChange={(v) => set({ designationId: v })} options={[{ value: '', label: 'All Designations' }, ...designations.map((d: any) => ({ value: d.id, label: d.name }))]} />
                    {/* Employee Type */}
                    <SelectFilter label="Employee Type" value={filters.employeeTypeId} onChange={(v) => set({ employeeTypeId: v })} options={[{ value: '', label: 'All Types' }, ...employeeTypes.map((t: any) => ({ value: t.id, label: t.name }))]} />
                    {/* Shift */}
                    <SelectFilter label="Shift" value={filters.shiftId} onChange={(v) => set({ shiftId: v })} options={[{ value: '', label: 'All Shifts' }, ...shifts.map((s: any) => ({ value: s.id, label: s.name }))]} />
                    {/* Status */}
                    <SelectFilter label="Status" value={filters.status} onChange={(v) => set({ status: v })} options={STATUS_FILTER_OPTIONS} />
                    {/* Source */}
                    <SelectFilter label="Source" value={filters.source} onChange={(v) => set({ source: v })} options={SOURCE_FILTER_OPTIONS} />
                </div>
            )}
        </div>
    );
}

interface SelectFilterProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}

function SelectFilter({ label, value, onChange, options }: SelectFilterProps) {
    return (
        <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white appearance-none transition-all cursor-pointer"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
        </div>
    );
}

/* ── Range KPIs (shared by Monthly + Custom) ── */

function RangeKPIs({ summary, loading }: { summary: any; loading: boolean }) {
    if (loading) return <SkeletonKPIGrid count={8} />;
    const fmtNum = (n: any) => Number(n ?? 0).toLocaleString();
    const fmt1 = (n: any) => {
        const v = Number(n ?? 0);
        return Number.isFinite(v) ? v.toFixed(1) : '0.0';
    };
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCardFlex label="Total Employees" value={fmtNum(summary?.totalEmployees)} icon={Users} color="accent" />
            <KpiCardFlex label="Avg Attendance" value={fmt1(summary?.avgAttendancePct)} icon={Percent} color="primary" suffix="%" />
            <KpiCardFlex label="Present" value={fmtNum(summary?.present)} icon={UserCheck} color="success" />
            <KpiCardFlex label="Absent" value={fmtNum(summary?.absent)} icon={UserX} color="danger" />
            <KpiCardFlex label="On Leave" value={fmtNum(summary?.onLeave)} icon={CalendarOff} color="primary" />
            <KpiCardFlex label="Late" value={fmtNum(summary?.late)} icon={Clock} color="warning" />
            <KpiCardFlex label="Total OT" value={fmt1(summary?.overtimeHours)} icon={Timer} color="success" suffix="h" />
            <KpiCardFlex label="Avg Hrs/Day" value={fmt1(summary?.avgWorkedHours)} icon={TrendingUp} color="accent" suffix="h" />
        </div>
    );
}

/* ── Calendar Grid (multi-employee × multi-day) ── */

interface CalendarGridProps {
    data: any;
    loading: boolean;
    page: number;
    limit: number;
    onPageChange: (p: number) => void;
    onCellClick: (employee: any, day: any) => void;
    fmt: ReturnType<typeof useCompanyFormatter>;
}

function CalendarGrid({ data, loading, page, limit, onPageChange, onCellClick, fmt }: CalendarGridProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                <SkeletonTable rows={10} cols={8} />
            </div>
        );
    }
    const dates: string[] = data?.range?.dates ?? [];
    const employees: any[] = data?.employees ?? [];
    const meta = data?.meta ?? { page: 1, limit, total: 0, totalPages: 1 };

    if (employees.length === 0) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <EmptyState icon="list" title="No employees" message="No attendance data for the selected filters." />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-primary-950 dark:text-white flex items-center gap-2">
                    <LayoutGrid size={14} className="text-primary-500" /> Attendance Calendar
                </h3>
                <CalendarLegend />
            </div>
            <div className="overflow-x-auto relative">
                <table className="border-collapse text-xs" style={{ minWidth: 220 + dates.length * 36 + 240 }}>
                    <thead>
                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800">
                            <th className="sticky left-0 z-20 bg-neutral-50/50 dark:bg-neutral-800/30 px-3 py-3 text-left font-bold text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[220px] min-w-[220px] border-r border-neutral-200 dark:border-neutral-800">
                                Employee
                            </th>
                            {dates.map((d) => {
                                const dt = parseISODate(d);
                                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                                return (
                                    <th
                                        key={d}
                                        className={cn(
                                            'w-9 min-w-[36px] px-0 py-2 text-center font-bold text-[10px] uppercase tracking-wider border-r border-neutral-100 dark:border-neutral-800/50',
                                            isWeekend ? 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'
                                        )}
                                        title={fmt.date(d)}
                                    >
                                        <div className="text-[9px] opacity-70">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][dt.getDay()]}</div>
                                        <div className="text-[11px]">{dt.getDate()}</div>
                                    </th>
                                );
                            })}
                            <th className="px-3 py-3 text-center font-bold text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[240px] border-l border-neutral-200 dark:border-neutral-800">
                                Totals
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp: any) => {
                            const name = [emp.firstName, emp.lastName].filter(Boolean).join(' ') || '—';
                            return (
                                <tr key={emp.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/30 dark:hover:bg-neutral-800/20 transition-colors">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-neutral-900 px-3 py-2 border-r border-neutral-200 dark:border-neutral-800 w-[220px] min-w-[220px]">
                                        <div className="font-bold text-primary-950 dark:text-white text-sm leading-tight">{name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {emp.employeeId && <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">{emp.employeeId}</span>}
                                            {emp.departmentName && <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 truncate max-w-[120px]">· {emp.departmentName}</span>}
                                        </div>
                                    </td>
                                    {dates.map((d) => {
                                        const day = (emp.days ?? []).find((x: any) => x.date === d);
                                        const status = (day?.status ?? '').toLowerCase().replace(/ /g, '_');
                                        const cfg = CALENDAR_STATUS[status];
                                        const dt = parseISODate(d);
                                        const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                                        if (!day || !cfg) {
                                            return (
                                                <td key={d} className={cn('w-9 h-9 min-w-[36px] p-0 border-r border-neutral-100 dark:border-neutral-800/50 text-center', isWeekend && 'bg-neutral-50/50 dark:bg-neutral-800/30')}>
                                                    <span className="text-neutral-300 dark:text-neutral-600 text-[10px]">—</span>
                                                </td>
                                            );
                                        }
                                        const tooltip = `${fmt.date(d)} · ${cfg.label}${day.punchIn ? ` · In ${fmt.time(day.punchIn)}` : ''}${day.punchOut ? ` · Out ${fmt.time(day.punchOut)}` : ''}${day.workedHours ? ` · ${Number(day.workedHours).toFixed(1)}h` : ''}`;
                                        return (
                                            <td key={d} className={cn('w-9 h-9 min-w-[36px] p-0.5 border-r border-neutral-100 dark:border-neutral-800/50', isWeekend && 'bg-neutral-50/40 dark:bg-neutral-800/20')}>
                                                <button
                                                    type="button"
                                                    onClick={() => onCellClick(emp, day)}
                                                    title={tooltip}
                                                    aria-label={tooltip}
                                                    className={cn(
                                                        'w-full h-full inline-flex items-center justify-center rounded text-[10px] font-extrabold border transition-all cursor-pointer hover:scale-110 hover:shadow focus:outline-none focus:ring-2 focus:ring-primary-500/40',
                                                        cfg.bg, cfg.text, cfg.border
                                                    )}
                                                >
                                                    {cfg.letter}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-2 border-l border-neutral-200 dark:border-neutral-800 min-w-[240px]">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                                            <span className="text-success-600 dark:text-success-400 font-bold">P {emp.totals?.present ?? 0}</span>
                                            <span className="text-danger-600 dark:text-danger-400 font-bold">A {emp.totals?.absent ?? 0}</span>
                                            <span className="text-warning-600 dark:text-warning-400 font-bold">L {emp.totals?.late ?? 0}</span>
                                            <span className="text-primary-600 dark:text-primary-400 font-bold">Lv {emp.totals?.onLeave ?? 0}</span>
                                            <span className="text-neutral-500 dark:text-neutral-400 font-bold">W {emp.totals?.weekOff ?? 0}</span>
                                            <span className="text-primary-600 dark:text-primary-400 font-bold">H {emp.totals?.holiday ?? 0}</span>
                                        </div>
                                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-semibold">
                                            {Number(emp.totals?.attendancePct ?? 0).toFixed(1)}% · {Number(emp.totals?.totalWorkedHours ?? 0).toFixed(1)}h worked
                                            {emp.totals?.totalOvertimeHours ? ` · ${Number(emp.totals.totalOvertimeHours).toFixed(1)}h OT` : ''}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Employee pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Showing employees <span className="font-bold text-neutral-700 dark:text-neutral-300">{(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)}</span> of <span className="font-bold text-neutral-700 dark:text-neutral-300">{meta.total}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 px-3">
                            Page {page} / {meta.totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                            disabled={page >= meta.totalPages}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Range List View (paginated multi-day records table) ── */

interface RangeListProps {
    records: any[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    loading: boolean;
    page: number;
    onPageChange: (p: number) => void;
    onViewRecord: (rec: any) => void;
    onOverrideRecord: (rec: any) => void;
    fmt: ReturnType<typeof useCompanyFormatter>;
}

function RangeListView({ records, meta, loading, page, onPageChange, onViewRecord, onOverrideRecord, fmt }: RangeListProps) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
            {loading ? (
                <SkeletonTable rows={8} cols={11} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1400px]">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-4 px-5 font-bold">Date</th>
                                <th className="py-4 px-5 font-bold">Employee</th>
                                <th className="py-4 px-5 font-bold">Shift</th>
                                <th className="py-4 px-5 font-bold">Punch In</th>
                                <th className="py-4 px-5 font-bold">Punch Out</th>
                                <th className="py-4 px-5 font-bold">Worked</th>
                                <th className="py-4 px-5 font-bold text-center">Status</th>
                                <th className="py-4 px-5 font-bold text-center">OT</th>
                                <th className="py-4 px-5 font-bold text-center">Late</th>
                                <th className="py-4 px-5 font-bold text-center">Source</th>
                                <th className="py-4 px-5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {records.map((rec: any) => (
                                <tr key={rec.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="py-3 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{rec.date ? fmt.date(rec.date) : '—'}</td>
                                    <td className="py-3 px-5">
                                        <div>
                                            <span className="font-bold text-primary-950 dark:text-white">{rec.employeeName}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {rec.employeeCode && <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{rec.employeeCode}</span>}
                                                {rec.department && <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">· {rec.department}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-5">
                                        {rec.shiftName ? (
                                            <div>
                                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{rec.shiftName}</span>
                                                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">{rec.shiftTime}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-neutral-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchIn, fmt)}</td>
                                    <td className="py-3 px-5 font-mono text-xs text-neutral-600 dark:text-neutral-400">{formatPunchTime(rec.punchOut, fmt)}</td>
                                    <td className="py-3 px-5 font-semibold text-neutral-700 dark:text-neutral-300 text-sm">{formatWorkedHrs(rec.workedHours)}</td>
                                    <td className="py-3 px-5 text-center">
                                        <StatusBadge status={rec.status ?? 'Unknown'} />
                                    </td>
                                    <td className="py-3 px-5 text-center">
                                        {rec.overtimeHours != null && Number(rec.overtimeHours) > 0 ? (
                                            <span className="text-xs font-semibold text-success-600 dark:text-success-400">{Number(rec.overtimeHours).toFixed(1)}h</span>
                                        ) : (
                                            <span className="text-xs text-neutral-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-5 text-center">
                                        {rec.isLate && rec.lateMinutes ? (
                                            <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">{formatMinutes(rec.lateMinutes)}</span>
                                        ) : (
                                            <span className="text-xs text-neutral-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-5 text-center">
                                        <SourceBadge source={rec.source ?? 'Manual'} />
                                    </td>
                                    <td className="py-3 px-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onViewRecord(rec)}
                                                className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800/50 transition-colors cursor-pointer"
                                                title="View Details"
                                                aria-label="View details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onOverrideRecord(rec)}
                                                className="p-1.5 rounded-lg text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 hover:bg-warning-100 dark:hover:bg-warning-900/40 border border-warning-200 dark:border-warning-800/50 transition-colors cursor-pointer"
                                                title="Override"
                                                aria-label="Create override"
                                            >
                                                <AlertTriangle size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={11}>
                                        <EmptyState icon="list" title="No attendance records" message="No records found for the selected range and filters." />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Showing <span className="font-bold text-neutral-700 dark:text-neutral-300">{(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)}</span> of <span className="font-bold text-neutral-700 dark:text-neutral-300">{meta.total}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 px-3">Page {page} / {meta.totalPages}</span>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                            disabled={page >= meta.totalPages}
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Screen ── */

function formatMinutes(mins: number): string {
    if (mins < 60) return `${mins} Min`;
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    const remaining = mins % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} Hr`);
    if (remaining > 0) parts.push(`${remaining} Min`);
    return parts.join(' ');
}

type DashTab = 'daily' | 'weekly' | 'monthly' | 'custom';
type ViewMode = 'list' | 'calendar';

export function AttendanceDashboardScreen() {
    const fmt = useCompanyFormatter();
    const [activeTab, setActiveTab] = useState<DashTab>('daily');

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

    // ── Monthly tab state ──
    const today = new Date();
    const [monthYear, setMonthYear] = useState(today.getFullYear());
    const [monthIdx, setMonthIdx] = useState(today.getMonth()); // 0-11
    const [monthlyView, setMonthlyView] = useState<ViewMode>('list');
    const [monthlyShowFilters, setMonthlyShowFilters] = useState(false);
    const [monthlyFilters, setMonthlyFilters] = useState<RangeFilters>(DEFAULT_RANGE_FILTERS);
    const [monthlyListPage, setMonthlyListPage] = useState(1);
    const [monthlyCalPage, setMonthlyCalPage] = useState(1);

    const monthBounds = useMemo(() => getMonthBounds(monthYear, monthIdx), [monthYear, monthIdx]);

    const monthlyRangeQuery = useAttendanceRangeSummary({
        dateFrom: monthBounds.from,
        dateTo: monthBounds.to,
        departmentId: monthlyFilters.departmentId || undefined,
        locationId: monthlyFilters.locationId || undefined,
        designationId: monthlyFilters.designationId || undefined,
        employeeTypeId: monthlyFilters.employeeTypeId || undefined,
        shiftId: monthlyFilters.shiftId || undefined,
    });

    const monthlyListQuery = useAttendanceRecords({
        dateFrom: monthBounds.from,
        dateTo: monthBounds.to,
        employeeId: monthlyFilters.employeeId || undefined,
        departmentId: monthlyFilters.departmentId || undefined,
        locationId: monthlyFilters.locationId || undefined,
        designationId: monthlyFilters.designationId || undefined,
        employeeTypeId: monthlyFilters.employeeTypeId || undefined,
        shiftId: monthlyFilters.shiftId || undefined,
        status: monthlyFilters.status || undefined,
        source: monthlyFilters.source || undefined,
        page: monthlyListPage,
        limit: 25,
    });

    const monthlyCalendarQuery = useAttendanceCalendar({
        dateFrom: monthBounds.from,
        dateTo: monthBounds.to,
        employeeIds: monthlyFilters.employeeId ? [monthlyFilters.employeeId] : undefined,
        departmentId: monthlyFilters.departmentId || undefined,
        locationId: monthlyFilters.locationId || undefined,
        designationId: monthlyFilters.designationId || undefined,
        employeeTypeId: monthlyFilters.employeeTypeId || undefined,
        shiftId: monthlyFilters.shiftId || undefined,
        page: monthlyCalPage,
        limit: 20,
    });

    // ── Custom Range tab state ──
    const initialCustom = useMemo(() => getLast30Days(), []);
    const [customFrom, setCustomFrom] = useState(initialCustom.from);
    const [customTo, setCustomTo] = useState(initialCustom.to);
    const [customView, setCustomView] = useState<ViewMode>('list');
    const [customShowFilters, setCustomShowFilters] = useState(false);
    const [customFilters, setCustomFilters] = useState<RangeFilters>(DEFAULT_RANGE_FILTERS);
    const [customListPage, setCustomListPage] = useState(1);
    const [customCalPage, setCustomCalPage] = useState(1);

    const customDateValid = !!customFrom && !!customTo && customFrom <= customTo;
    const customDays = customDateValid ? diffDays(customFrom, customTo) : 0;
    const customRangeWarn = customDays > 90;

    const customRangeQuery = useAttendanceRangeSummary({
        dateFrom: customDateValid ? customFrom : '',
        dateTo: customDateValid ? customTo : '',
        departmentId: customFilters.departmentId || undefined,
        locationId: customFilters.locationId || undefined,
        designationId: customFilters.designationId || undefined,
        employeeTypeId: customFilters.employeeTypeId || undefined,
        shiftId: customFilters.shiftId || undefined,
    });

    const customListQuery = useAttendanceRecords({
        dateFrom: customDateValid ? customFrom : undefined,
        dateTo: customDateValid ? customTo : undefined,
        employeeId: customFilters.employeeId || undefined,
        departmentId: customFilters.departmentId || undefined,
        locationId: customFilters.locationId || undefined,
        designationId: customFilters.designationId || undefined,
        employeeTypeId: customFilters.employeeTypeId || undefined,
        shiftId: customFilters.shiftId || undefined,
        status: customFilters.status || undefined,
        source: customFilters.source || undefined,
        page: customListPage,
        limit: 25,
    });

    const customCalendarQuery = useAttendanceCalendar({
        dateFrom: customDateValid ? customFrom : '',
        dateTo: customDateValid ? customTo : '',
        employeeIds: customFilters.employeeId ? [customFilters.employeeId] : undefined,
        departmentId: customFilters.departmentId || undefined,
        locationId: customFilters.locationId || undefined,
        designationId: customFilters.designationId || undefined,
        employeeTypeId: customFilters.employeeTypeId || undefined,
        shiftId: customFilters.shiftId || undefined,
        page: customCalPage,
        limit: 20,
    });

    // Derive range summary results
    const monthlyRangeData: any = (monthlyRangeQuery.data as any)?.data ?? {};
    const monthlyRangeSummary = monthlyRangeData.summary ?? {};
    const monthlyDeptBreakdown: any[] = monthlyRangeData.departmentBreakdown ?? [];
    const monthlyDailyTrend: TrendDay[] = monthlyRangeData.dailyTrend ?? [];

    const customRangeData: any = (customRangeQuery.data as any)?.data ?? {};
    const customRangeSummary = customRangeData.summary ?? {};
    const customDeptBreakdown: any[] = customRangeData.departmentBreakdown ?? [];
    const customDailyTrend: TrendDay[] = customRangeData.dailyTrend ?? [];

    // List view: normalize records
    const monthlyListResp = monthlyListQuery.data as any;
    const monthlyListRecordsRaw: any[] = monthlyListResp?.data ?? [];
    const monthlyListMeta = monthlyListResp?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 };
    const monthlyListRecords = monthlyListRecordsRaw.map((r: any) => normalizeRecord(r, fmt));

    const customListResp = customListQuery.data as any;
    const customListRecordsRaw: any[] = customListResp?.data ?? [];
    const customListMeta = customListResp?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 };
    const customListRecords = customListRecordsRaw.map((r: any) => normalizeRecord(r, fmt));

    const monthlyCalendarData: any = (monthlyCalendarQuery.data as any)?.data ?? null;
    const customCalendarData: any = (customCalendarQuery.data as any)?.data ?? null;

    // Calendar cell click → open detail modal with a synthetic record
    const openCalendarCell = (employee: any, day: any) => {
        const synthetic = {
            id: day.recordId ?? `${employee.id}-${day.date}`,
            employeeId: employee.id,
            employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(' '),
            employeeCode: employee.employeeId,
            department: employee.departmentName,
            designation: employee.designationName,
            date: day.date,
            status: day.status,
            punchIn: day.punchIn,
            punchOut: day.punchOut,
            workedHours: day.workedHours,
            overtimeHours: day.overtimeHours,
            isLate: day.isLate,
            lateMinutes: day.lateMinutes,
            shiftName: day.shiftName,
            shiftTime: '',
            source: 'SYSTEM',
            finalStatusReason: day.leaveTypeName ?? undefined,
        };
        setDetailRecord(synthetic);
    };

    const monthLabel = `${MONTH_NAMES[monthIdx]} ${monthYear}`;
    const yearRange = useMemo(() => {
        const cur = new Date().getFullYear();
        const arr: number[] = [];
        for (let y = cur - 5; y <= cur + 1; y++) arr.push(y);
        return arr;
    }, []);

    const prevMonth = () => {
        if (monthIdx === 0) { setMonthIdx(11); setMonthYear((y) => y - 1); }
        else setMonthIdx((m) => m - 1);
        setMonthlyListPage(1); setMonthlyCalPage(1);
    };
    const nextMonth = () => {
        if (monthIdx === 11) { setMonthIdx(0); setMonthYear((y) => y + 1); }
        else setMonthIdx((m) => m + 1);
        setMonthlyListPage(1); setMonthlyCalPage(1);
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
                        {activeTab === 'daily'
                            ? 'Daily attendance dashboard and records'
                            : activeTab === 'weekly'
                                ? 'Weekly review of flagged attendance records'
                                : activeTab === 'monthly'
                                    ? 'Monthly attendance analytics, calendar and list views'
                                    : 'Custom range attendance analytics, calendar and list views'}
                    </p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
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
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
                        activeTab === 'weekly'
                            ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                >
                    <CalendarRange size={15} />
                    Weekly Review
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
                        activeTab === 'monthly'
                            ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                >
                    <CalendarDays size={15} />
                    Monthly
                </button>
                <button
                    onClick={() => setActiveTab('custom')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer',
                        activeTab === 'custom'
                            ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                >
                    <CalendarIcon size={15} />
                    Custom Range
                </button>
            </div>

            {/* ══════════ DAILY TAB ══════════ */}
            {activeTab === 'daily' && (<>

            {/* KPI Row */}
            {summaryQuery.isLoading ? (
                <SkeletonKPIGrid count={5} />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <KpiCard label="Total Employees" value={summary.total ?? 0} icon={Users} color="accent" />
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
                    <SkeletonTable rows={8} cols={12} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1400px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-5 font-bold">Employee</th>
                                    <th className="py-4 px-5 font-bold">Shift</th>
                                    <th className="py-4 px-5 font-bold text-center">1st Half</th>
                                    <th className="py-4 px-5 font-bold text-center">2nd Half</th>
                                    <th className="py-4 px-5 font-bold">Punch In</th>
                                    <th className="py-4 px-5 font-bold">Punch Out</th>
                                    <th className="py-4 px-5 font-bold">Worked</th>
                                    <th className="py-4 px-5 font-bold text-center">Status</th>
                                    <th className="py-4 px-5 font-bold text-center">OT</th>
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
                                        {/* 1st Half */}
                                        <td className="py-3.5 px-5 text-center">
                                            {(() => {
                                                const h = rec.halves?.find((h: any) => h.half === 'FIRST_HALF');
                                                if (!h) return <span className="text-xs text-neutral-400">—</span>;
                                                return (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <StatusBadge status={h.status} />
                                                        {h.leaveType?.name && <span className="text-[9px] text-neutral-400 truncate max-w-[80px]" title={h.leaveType.name}>{h.leaveType.name}</span>}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        {/* 2nd Half */}
                                        <td className="py-3.5 px-5 text-center">
                                            {(() => {
                                                const h = rec.halves?.find((h: any) => h.half === 'SECOND_HALF');
                                                if (!h) return <span className="text-xs text-neutral-400">—</span>;
                                                return (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <StatusBadge status={h.status} />
                                                        {h.leaveType?.name && <span className="text-[9px] text-neutral-400 truncate max-w-[80px]" title={h.leaveType.name}>{h.leaveType.name}</span>}
                                                    </div>
                                                );
                                            })()}
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
                                        {/* OT Hours */}
                                        <td className="py-3.5 px-5 text-center">
                                            {rec.overtimeHours != null && Number(rec.overtimeHours) > 0 ? (
                                                <span className="text-xs font-semibold text-success-600 dark:text-success-400">{Number(rec.overtimeHours).toFixed(1)}h</span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-5 text-center">
                                            {rec.isLate && rec.lateMinutes ? (
                                                <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">{formatMinutes(rec.lateMinutes)}</span>
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
                                        <td colSpan={12}>
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

            {/* ══════════ MONTHLY TAB ══════════ */}
            {activeTab === 'monthly' && (<>

            {/* Month/Year selector + view toggle */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        <select
                            value={monthIdx}
                            onChange={(e) => { setMonthIdx(Number(e.target.value)); setMonthlyListPage(1); setMonthlyCalPage(1); }}
                            className="bg-transparent text-sm font-bold text-primary-950 dark:text-white focus:outline-none cursor-pointer"
                        >
                            {MONTH_NAMES.map((m, i) => (<option key={m} value={i}>{m}</option>))}
                        </select>
                        <select
                            value={monthYear}
                            onChange={(e) => { setMonthYear(Number(e.target.value)); setMonthlyListPage(1); setMonthlyCalPage(1); }}
                            className="bg-transparent text-sm font-bold text-primary-950 dark:text-white focus:outline-none cursor-pointer"
                        >
                            {yearRange.map((y) => (<option key={y} value={y}>{y}</option>))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <span className="ml-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:inline">
                        {monthBounds.from} → {monthBounds.to}
                    </span>
                </div>
                {/* View toggle */}
                <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setMonthlyView('list')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            monthlyView === 'list'
                                ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        )}
                        aria-pressed={monthlyView === 'list'}
                    >
                        <List size={13} /> List View
                    </button>
                    <button
                        type="button"
                        onClick={() => setMonthlyView('calendar')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            monthlyView === 'calendar'
                                ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        )}
                        aria-pressed={monthlyView === 'calendar'}
                    >
                        <LayoutGrid size={13} /> Calendar View
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <RangeFilterBar
                filters={monthlyFilters}
                onChange={(f) => { setMonthlyFilters(f); setMonthlyListPage(1); setMonthlyCalPage(1); }}
                onReset={() => { setMonthlyFilters(DEFAULT_RANGE_FILTERS); setMonthlyListPage(1); setMonthlyCalPage(1); }}
                show={monthlyShowFilters}
                onToggle={() => setMonthlyShowFilters((s) => !s)}
            />

            {/* KPI Row */}
            <RangeKPIs summary={monthlyRangeSummary} loading={monthlyRangeQuery.isLoading} />

            {/* Department Breakdown */}
            <DepartmentBreakdown departments={monthlyDeptBreakdown} />

            {/* Charts & Analytics */}
            <AttendanceCharts
                days={monthlyDailyTrend}
                summary={monthlyRangeSummary}
                departments={monthlyDeptBreakdown}
                fmt={fmt}
                loading={monthlyRangeQuery.isLoading}
                title={`Attendance Analytics — ${monthLabel}`}
                defaultGranularity="daily"
            />

            {/* List or Calendar */}
            {monthlyView === 'list' ? (
                <RangeListView
                    records={monthlyListRecords}
                    meta={monthlyListMeta}
                    loading={monthlyListQuery.isLoading}
                    page={monthlyListPage}
                    onPageChange={setMonthlyListPage}
                    onViewRecord={(r) => setDetailRecord(r)}
                    onOverrideRecord={(r) => openOverrideModal(r)}
                    fmt={fmt}
                />
            ) : (
                <CalendarGrid
                    data={monthlyCalendarData}
                    loading={monthlyCalendarQuery.isLoading}
                    page={monthlyCalPage}
                    limit={20}
                    onPageChange={setMonthlyCalPage}
                    onCellClick={openCalendarCell}
                    fmt={fmt}
                />
            )}

            </>)}

            {/* ══════════ CUSTOM RANGE TAB ══════════ */}
            {activeTab === 'custom' && (<>

            {/* Date range pickers + view toggle */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">From</label>
                        <input
                            type="date"
                            value={customFrom}
                            onChange={(e) => { setCustomFrom(e.target.value); setCustomListPage(1); setCustomCalPage(1); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">To</label>
                        <input
                            type="date"
                            value={customTo}
                            onChange={(e) => { setCustomTo(e.target.value); setCustomListPage(1); setCustomCalPage(1); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        />
                    </div>
                    {customDateValid && (
                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 pb-3">
                            {customDays} day{customDays !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
                <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setCustomView('list')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            customView === 'list'
                                ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        )}
                        aria-pressed={customView === 'list'}
                    >
                        <List size={13} /> List View
                    </button>
                    <button
                        type="button"
                        onClick={() => setCustomView('calendar')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                            customView === 'calendar'
                                ? 'bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        )}
                        aria-pressed={customView === 'calendar'}
                    >
                        <LayoutGrid size={13} /> Calendar View
                    </button>
                </div>
            </div>

            {!customDateValid && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-2xl p-4 flex items-center gap-3 text-sm text-danger-700 dark:text-danger-400">
                    <AlertTriangle size={16} />
                    <span className="font-bold">Invalid date range —</span>
                    <span>Start date must be on or before end date.</span>
                </div>
            )}

            {customDateValid && customRangeWarn && (
                <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-2xl p-4 flex items-center gap-3 text-sm text-warning-700 dark:text-warning-400">
                    <AlertTriangle size={16} />
                    <span className="font-bold">Large range:</span>
                    <span>{customDays} days selected — queries may be slow.</span>
                </div>
            )}

            {customDateValid && (<>
                {/* Filter Bar */}
                <RangeFilterBar
                    filters={customFilters}
                    onChange={(f) => { setCustomFilters(f); setCustomListPage(1); setCustomCalPage(1); }}
                    onReset={() => { setCustomFilters(DEFAULT_RANGE_FILTERS); setCustomListPage(1); setCustomCalPage(1); }}
                    show={customShowFilters}
                    onToggle={() => setCustomShowFilters((s) => !s)}
                />

                {/* KPI Row */}
                <RangeKPIs summary={customRangeSummary} loading={customRangeQuery.isLoading} />

                {/* Department Breakdown */}
                <DepartmentBreakdown departments={customDeptBreakdown} />

                {/* Charts & Analytics — pick default granularity from range size */}
                <AttendanceCharts
                    days={customDailyTrend}
                    summary={customRangeSummary}
                    departments={customDeptBreakdown}
                    fmt={fmt}
                    loading={customRangeQuery.isLoading}
                    title="Attendance Analytics"
                    defaultGranularity={customDays > 90 ? 'monthly' : customDays > 31 ? 'weekly' : 'daily'}
                />

                {/* List or Calendar */}
                {customView === 'list' ? (
                    <RangeListView
                        records={customListRecords}
                        meta={customListMeta}
                        loading={customListQuery.isLoading}
                        page={customListPage}
                        onPageChange={setCustomListPage}
                        onViewRecord={(r) => setDetailRecord(r)}
                        onOverrideRecord={(r) => openOverrideModal(r)}
                        fmt={fmt}
                    />
                ) : (
                    <CalendarGrid
                        data={customCalendarData}
                        loading={customCalendarQuery.isLoading}
                        page={customCalPage}
                        limit={20}
                        onPageChange={setCustomCalPage}
                        onCellClick={openCalendarCell}
                        fmt={fmt}
                    />
                )}
            </>)}

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

                            {/* Half-Day Details */}
                            {detailRecord.halves && detailRecord.halves.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {detailRecord.halves
                                        .sort((a: any, b: any) => a.half === 'FIRST_HALF' ? -1 : 1)
                                        .map((h: any) => (
                                        <div key={h.id || h.half} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                                {h.half === 'FIRST_HALF' ? '1st Half' : '2nd Half'}
                                            </p>
                                            <StatusBadge status={h.status} />
                                            {h.leaveType?.name && (
                                                <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 font-semibold">{h.leaveType.name}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Shift */}
                            {detailRecord.shiftName && (
                                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl p-3 border border-primary-100 dark:border-primary-800/30">
                                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">Shift</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{detailRecord.shiftName} <span className="font-mono text-xs text-neutral-500 ml-1">{detailRecord.shiftTime}</span></p>
                                </div>
                            )}

                            {/* Late / Early Exit / Overtime Row */}
                            <div className="grid grid-cols-3 gap-3">
                                {detailRecord.isLate && detailRecord.lateMinutes != null ? (
                                    <div className="bg-warning-50 dark:bg-warning-900/10 rounded-xl p-3 border border-warning-200 dark:border-warning-800/30">
                                        <p className="text-[10px] font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider mb-1">Late By</p>
                                        <p className="text-sm font-bold text-warning-700 dark:text-warning-400">{formatMinutes(detailRecord.lateMinutes!)}</p>
                                    </div>
                                ) : (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Late</p>
                                        <p className="text-sm font-bold text-success-600 dark:text-success-400">On Time</p>
                                    </div>
                                )}
                                {detailRecord.isEarlyExit && detailRecord.earlyMinutes != null ? (
                                    <div className="bg-danger-50 dark:bg-danger-900/10 rounded-xl p-3 border border-danger-200 dark:border-danger-800/30">
                                        <p className="text-[10px] font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider mb-1">Early Exit</p>
                                        <p className="text-sm font-bold text-danger-700 dark:text-danger-400">{detailRecord.earlyMinutes} min</p>
                                    </div>
                                ) : (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                                        <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Early Exit</p>
                                        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">—</p>
                                    </div>
                                )}
                                <div className={cn(
                                    "rounded-xl p-3 border",
                                    detailRecord.overtimeHours != null && Number(detailRecord.overtimeHours) > 0
                                        ? "bg-success-50/50 dark:bg-success-900/10 border-success-100 dark:border-success-800/30"
                                        : "bg-neutral-50 dark:bg-neutral-800 border-transparent"
                                )}>
                                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">OT Hours</p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        detailRecord.overtimeHours != null && Number(detailRecord.overtimeHours) > 0
                                            ? "text-success-700 dark:text-success-400"
                                            : "text-neutral-500 dark:text-neutral-400"
                                    )}>
                                        {detailRecord.overtimeHours != null && Number(detailRecord.overtimeHours) > 0
                                            ? `${Number(detailRecord.overtimeHours).toFixed(1)} hrs`
                                            : '—'}
                                    </p>
                                </div>
                            </div>

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
