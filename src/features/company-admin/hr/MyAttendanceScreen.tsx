import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Clock,
    X,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Timer,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyAttendance } from "@/features/company-admin/api/use-ess-queries";
import { useRegularizeAttendance } from "@/features/company-admin/api/use-ess-mutations";
import { KPIGrid, type KPICardData } from "@/components/analytics/KPIGrid";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
    PRESENT: "bg-success-500",
    ABSENT: "bg-danger-500",
    HALF_DAY: "bg-warning-500",
    ON_LEAVE: "bg-primary-500",
    LATE: "bg-warning-400",
    HOLIDAY: "bg-accent-500",
    WEEKEND: "bg-neutral-300 dark:bg-neutral-700",
    REGULARIZED: "bg-success-300",
};

const STATUS_LABELS: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    HALF_DAY: "Half Day",
    ON_LEAVE: "On Leave",
    LATE: "Late",
    HOLIDAY: "Holiday",
    WEEKEND: "Weekend",
    REGULARIZED: "Regularized",
};

const formatTime = (t: string | null | undefined) => {
    if (!t) return "—";
    return t;
};

/* ── Calendar Helpers ── */

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

/* ── Premium Shared Wrappers ── */

function PremiumCard({ children, className, noPadding = false }: { children: React.ReactNode; className?: string; noPadding?: boolean }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5F8FF] via-white to-[#F0EDFF] dark:from-indigo-950/20 dark:via-neutral-900 dark:to-violet-950/20 border border-neutral-200/60 dark:border-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300",
                className
            )}
        >
            {!noPadding && <div className="p-5 sm:p-6">{children}</div>}
            {noPadding && children}
        </div>
    );
}

function CardHeader({ title, subtitle, icon: Icon, iconClass }: { title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>; iconClass?: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            {Icon && (
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", iconClass ?? "bg-indigo-100/60 dark:bg-indigo-900/40")}>
                    <Icon className={cn("w-4.5 h-4.5", "text-indigo-600 dark:text-indigo-400")} />
                </div>
            )}
            <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-white leading-tight">{title}</h3>
                {subtitle && <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

/* ── Screen ── */

export function MyAttendanceScreen() {
    const fmt = useCompanyFormatter();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [regularizeModal, setRegularizeModal] = useState(false);
    const [regularizeForm, setRegularizeForm] = useState({
        attendanceRecordId: '',
        issueType: 'MISSING_PUNCH_IN' as string,
        correctedPunchIn: '',
        correctedPunchOut: '',
        reason: '',
    });

    const { data, isLoading } = useMyAttendance({ month: currentMonth + 1, year: currentYear });
    const regularizeMutation = useRegularizeAttendance();

    const attendanceMap = useMemo(() => {
        const map: Record<string, any> = {};
        const records: any[] = (data?.data as any) ?? [];
        records.forEach((r: any) => {
            const dateKey = r.date?.split("T")[0] ?? r.date;
            map[dateKey] = r;
        });
        return map;
    }, [data]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
        else setCurrentMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
        else setCurrentMonth((m) => m + 1);
    };

    const selectedRecord = selectedDate ? attendanceMap[selectedDate] : null;

    const openRegularize = (record?: any) => {
        const rec = record ?? selectedRecord;
        // Auto-detect issue type from record state
        let issueType = 'ABSENT_OVERRIDE';
        if (rec) {
            if (!rec.punchIn && !rec.punchOut) issueType = 'NO_PUNCH';
            else if (!rec.punchIn) issueType = 'MISSING_PUNCH_IN';
            else if (!rec.punchOut) issueType = 'MISSING_PUNCH_OUT';
            else if (rec.isLate) issueType = 'LATE_OVERRIDE';
            else if (rec.status === 'ABSENT') issueType = 'ABSENT_OVERRIDE';
            else issueType = 'NO_PUNCH';
        }
        setRegularizeForm({
            attendanceRecordId: rec?.id ?? '',
            issueType,
            correctedPunchIn: '',
            correctedPunchOut: '',
            reason: '',
        });
        setRegularizeModal(true);
    };

    const ISSUE_TYPES = [
        { value: 'MISSING_PUNCH_IN', label: 'Missing Punch In' },
        { value: 'MISSING_PUNCH_OUT', label: 'Missing Punch Out' },
        { value: 'ABSENT_OVERRIDE', label: 'Absent Override' },
        { value: 'LATE_OVERRIDE', label: 'Late Override' },
        { value: 'NO_PUNCH', label: 'No Punch' },
    ];

    const showPunchIn = ['MISSING_PUNCH_IN', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(regularizeForm.issueType);
    const showPunchOut = ['MISSING_PUNCH_OUT', 'NO_PUNCH', 'ABSENT_OVERRIDE'].includes(regularizeForm.issueType);

    const handleRegularize = async () => {
        const payload: any = {
            issueType: regularizeForm.issueType,
            reason: regularizeForm.reason,
        };

        // Send either attendanceRecordId (if record exists) or date (for absent days)
        if (regularizeForm.attendanceRecordId) {
            payload.attendanceRecordId = regularizeForm.attendanceRecordId;
        } else if (selectedDate) {
            payload.date = selectedDate; // ISO date like "2026-03-30"
        }

        if (regularizeForm.correctedPunchIn && showPunchIn) {
            payload.correctedPunchIn = `${selectedDate}T${regularizeForm.correctedPunchIn}:00`;
        }
        if (regularizeForm.correctedPunchOut && showPunchOut) {
            payload.correctedPunchOut = `${selectedDate}T${regularizeForm.correctedPunchOut}:00`;
        }

        try {
            await regularizeMutation.mutateAsync(payload);
            showSuccess("Regularization Requested", "Your request has been submitted for approval.");
            setRegularizeModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // Summary stats
    const records: any[] = (data?.data as any) ?? [];
    const presentCount = records.filter((r: any) => r.status === "PRESENT" || r.status === "LATE" || r.status === "REGULARIZED").length;
    const absentCount = records.filter((r: any) => r.status === "ABSENT").length;
    const leaveCount = records.filter((r: any) => r.status === "ON_LEAVE").length;
    const avgHours = records.length > 0
        ? (records.reduce((sum: number, r: any) => sum + (Number(r.workedHours) || 0), 0) / Math.max(presentCount, 1)).toFixed(1)
        : "0.0";

    const kpis: KPICardData[] = [
        { key: "present", label: "Present", value: presentCount.toString(), icon: CheckCircle2 },
        { key: "absent", label: "Absent", value: absentCount.toString(), icon: XCircle },
        { key: "leave", label: "On Leave", value: leaveCount.toString(), icon: CalendarDays },
        { key: "avg", label: "Avg Hours", value: avgHours, icon: Timer },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Attendance</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">View your attendance records and request regularizations</p>
            </div>

            {/* Summary Stats */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            ) : (
                <KPIGrid kpis={kpis} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <PremiumCard>
                        <div className="flex items-center justify-between mb-2">
                            <CardHeader title="Attendance Calendar" subtitle={`${MONTHS[currentMonth]} ${currentYear}`} icon={CalendarDays} />
                            <div className="flex items-center gap-1.5 -mt-4">
                                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <ChevronLeft className="w-4 h-4 text-neutral-500" />
                                </button>
                                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                                </button>
                            </div>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {WEEKDAYS.map((wd) => (
                                <div key={wd} className="text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider py-1">
                                    {wd}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[44px]" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const record = attendanceMap[dateStr];
                                const status = record?.status ?? "";
                                const isSelected = selectedDate === dateStr;
                                const isToday = dateStr === today.toISOString().split("T")[0];
                                const dotColor = STATUS_COLORS[status] ?? "";

                                return (
                                    <div key={day} className="flex flex-col items-center justify-center py-[2px]">
                                        <button
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center rounded-full h-8 w-8 sm:h-[40px] sm:w-[40px] transition-all duration-300",
                                                isSelected
                                                    ? "border-[2px] border-indigo-600 bg-white shadow-[0_4px_12px_rgba(79,70,229,0.15)] dark:bg-primary-900/30"
                                                    : isToday
                                                    ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-transparent bg-primary-50 dark:bg-primary-900/20"
                                                    : "hover:bg-white/80 dark:hover:bg-neutral-800/50 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-[13px] font-bold leading-none select-none",
                                                isSelected ? "text-indigo-700 dark:text-indigo-400 mb-[2px]" : (isToday ? "text-primary-700 dark:text-primary-400" : "text-neutral-700 dark:text-neutral-300"),
                                                (dotColor && !isSelected) && "mb-1"
                                            )}>
                                                {day}
                                            </span>
                                            {dotColor && (
                                                <div className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full absolute bottom-1.5 sm:bottom-2", isSelected ? "bg-indigo-600 dark:bg-indigo-400" : dotColor)} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                    <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[key])} />
                                    <span className="text-[10px] font-medium tracking-wide text-neutral-500 dark:text-neutral-400 capitalize">{label}</span>
                                </div>
                            ))}
                        </div>
                    </PremiumCard>
                </div>

                {/* Selected Date Detail */}
                <div className="h-full">
                <PremiumCard className="h-full flex flex-col">
                    <CardHeader title="Day Details" subtitle={selectedDate ? fmt.date(selectedDate + "T00:00:00") : "Select a date"} icon={Clock} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />

                    {!selectedDate ? (
                        <div className="text-center py-8">
                            <CalendarDays size={32} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                            <p className="text-sm text-neutral-400">Click on a calendar date to view details.</p>
                        </div>
                    ) : selectedRecord ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[selectedRecord.status] ?? "bg-neutral-300")} />
                                <span className="text-sm font-bold capitalize text-primary-950 dark:text-white">
                                    {STATUS_LABELS[selectedRecord.status] ?? selectedRecord.status}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 dark:text-neutral-400">Check In</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{formatTime(selectedRecord.punchIn)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 dark:text-neutral-400">Check Out</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{formatTime(selectedRecord.punchOut)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 dark:text-neutral-400">Hours Worked</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{selectedRecord.workedHours ?? "—"}</span>
                                </div>
                                {selectedRecord.shift?.name && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Shift</span>
                                        <span className="font-semibold text-primary-950 dark:text-white">{selectedRecord.shift.name}</span>
                                    </div>
                                )}
                                {selectedRecord.isLate && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Late By</span>
                                        <span className="font-semibold text-warning-600 dark:text-warning-400">{selectedRecord.lateMinutes} min</span>
                                    </div>
                                )}
                            </div>
                            {(selectedRecord.status === "ABSENT" || selectedRecord.status === "HALF_DAY" || !selectedRecord.punchIn || !selectedRecord.punchOut || selectedRecord.isLate) && (
                                <button
                                    onClick={() => openRegularize(selectedRecord)}
                                    className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={14} />
                                    Regularize Request
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 flex-1 flex flex-col justify-center">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No attendance record for this date.</p>
                            <button
                                onClick={() => openRegularize()}
                                className="mt-4 mx-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-800 transition-colors"
                            >
                                <AlertTriangle size={12} />
                                Request Regularization
                            </button>
                        </div>
                    )}
                </PremiumCard>
                </div>
            </div>

            {/* ── Regularize Modal ── */}
            {regularizeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Regularize Attendance</h2>
                            <button onClick={() => setRegularizeModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Date (read-only display) */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Date</label>
                                <div className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-700 dark:text-neutral-300">
                                    {selectedDate ? fmt.date(selectedDate + "T00:00:00") : "—"}
                                </div>
                            </div>

                            {/* Issue Type */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Issue Type *</label>
                                <select
                                    value={regularizeForm.issueType}
                                    onChange={(e) => setRegularizeForm((p) => ({ ...p, issueType: e.target.value }))}
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
                                        <input type="time" value={regularizeForm.correctedPunchIn} onChange={(e) => setRegularizeForm((p) => ({ ...p, correctedPunchIn: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                )}
                                {showPunchOut && (
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Corrected Check-Out</label>
                                        <input type="time" value={regularizeForm.correctedPunchOut} onChange={(e) => setRegularizeForm((p) => ({ ...p, correctedPunchOut: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                )}
                            </div>
                            {regularizeForm.issueType === 'LATE_OVERRIDE' && (
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No corrected times needed — this will clear the late flag.</p>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason *</label>
                                <textarea value={regularizeForm.reason} onChange={(e) => setRegularizeForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason for regularization..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setRegularizeModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleRegularize} disabled={regularizeMutation.isPending || !regularizeForm.reason.trim()} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {regularizeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {regularizeMutation.isPending ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
