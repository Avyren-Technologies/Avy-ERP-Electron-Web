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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceRecords, useAttendanceSummary } from "@/features/company-admin/api/use-attendance-queries";
import { SkeletonTable, SkeletonKPIGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const cls =
        s === "present"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "absent"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : s === "late"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : s === "on leave" || s === "leave"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

/* ── Source Badge ── */

function SourceBadge({ source }: { source: string }) {
    return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            {source}
        </span>
    );
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
                    <div key={dept.name}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{dept.name}</span>
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

    const summaryQuery = useAttendanceSummary();
    const recordsQuery = useAttendanceRecords({ date, department: department || undefined });

    const summary = (summaryQuery.data as any)?.data ?? {};
    const records: any[] = (recordsQuery.data as any)?.data ?? [];
    const departmentBreakdown: any[] = summary.departments ?? [];

    const filtered = records.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            r.employeeName?.toLowerCase().includes(s) ||
            r.employeeCode?.toLowerCase().includes(s)
        );
    });

    const isLoading = summaryQuery.isLoading || recordsQuery.isLoading;

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
                                <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {recordsQuery.isLoading ? (
                    <SkeletonTable rows={8} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Punch In</th>
                                    <th className="py-4 px-6 font-bold">Punch Out</th>
                                    <th className="py-4 px-6 font-bold">Worked Hrs</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-center">Late</th>
                                    <th className="py-4 px-6 font-bold text-center">Source</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((rec: any) => (
                                    <tr
                                        key={rec.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white">{rec.employeeName ?? "—"}</span>
                                                {rec.employeeCode && (
                                                    <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">{rec.employeeCode}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{rec.punchIn ?? "—"}</td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{rec.punchOut ?? "—"}</td>
                                        <td className="py-4 px-6 font-semibold text-neutral-700 dark:text-neutral-300">{rec.workedHours ?? "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={rec.status ?? "Unknown"} />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {rec.lateMinutes ? (
                                                <span className="text-xs font-semibold text-warning-600 dark:text-warning-400">{rec.lateMinutes}m</span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <SourceBadge source={rec.source ?? "Manual"} />
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !recordsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No attendance records" message="No records found for the selected date and filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
