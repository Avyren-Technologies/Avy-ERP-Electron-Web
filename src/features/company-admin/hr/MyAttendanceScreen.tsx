import { useState, useMemo } from "react";
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
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
    present: "bg-success-500",
    absent: "bg-danger-500",
    half_day: "bg-warning-500",
    leave: "bg-primary-500",
    holiday: "bg-accent-500",
    weekend: "bg-neutral-300 dark:bg-neutral-700",
    regularized: "bg-success-300",
};

const STATUS_LABELS: Record<string, string> = {
    present: "Present",
    absent: "Absent",
    half_day: "Half Day",
    leave: "On Leave",
    holiday: "Holiday",
    weekend: "Weekend",
    regularized: "Regularized",
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

/* ── Screen ── */

export function MyAttendanceScreen() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [regularizeModal, setRegularizeModal] = useState(false);
    const [regularizeForm, setRegularizeForm] = useState({ date: "", checkIn: "", checkOut: "", reason: "" });

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

    const openRegularize = () => {
        setRegularizeForm({
            date: selectedDate ?? "",
            checkIn: "",
            checkOut: "",
            reason: "",
        });
        setRegularizeModal(true);
    };

    const handleRegularize = async () => {
        try {
            await regularizeMutation.mutateAsync(regularizeForm);
            showSuccess("Regularization Requested", "Your attendance regularization request has been submitted.");
            setRegularizeModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    // Summary stats
    const records: any[] = (data?.data as any) ?? [];
    const presentCount = records.filter((r: any) => r.status === "present" || r.status === "regularized").length;
    const absentCount = records.filter((r: any) => r.status === "absent").length;
    const leaveCount = records.filter((r: any) => r.status === "leave").length;
    const avgHours = records.length > 0
        ? (records.reduce((sum: number, r: any) => sum + (Number(r.hoursWorked) || 0), 0) / Math.max(presentCount, 1)).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Attendance</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">View your attendance records and request regularizations</p>
            </div>

            {/* Summary Stats */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={16} className="text-success-500" />
                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Present</span>
                        </div>
                        <p className="text-2xl font-bold text-success-700 dark:text-success-400">{presentCount}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle size={16} className="text-danger-500" />
                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Absent</span>
                        </div>
                        <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">{absentCount}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarDays size={16} className="text-primary-500" />
                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">On Leave</span>
                        </div>
                        <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{leaveCount}</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer size={16} className="text-accent-500" />
                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Avg Hours</span>
                        </div>
                        <p className="text-2xl font-bold text-accent-700 dark:text-accent-400">{avgHours}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <ChevronLeft size={18} className="text-neutral-500" />
                        </button>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            <ChevronRight size={18} className="text-neutral-500" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAYS.map((wd) => (
                            <div key={wd} className="text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase py-1">
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
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
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={cn(
                                        "aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all relative",
                                        isSelected
                                            ? "bg-primary-600 text-white shadow-md"
                                            : isToday
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 ring-1 ring-primary-300 dark:ring-primary-700"
                                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    )}
                                >
                                    {day}
                                    {dotColor && (
                                        <div className={cn("w-1.5 h-1.5 rounded-full absolute bottom-1", isSelected ? "bg-white" : dotColor)} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <div className={cn("w-2.5 h-2.5 rounded-full", STATUS_COLORS[key])} />
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Date Detail */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white mb-4">
                        {selectedDate
                            ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
                            : "Select a date"}
                    </h3>

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
                                    <span className="font-semibold text-primary-950 dark:text-white">{formatTime(selectedRecord.checkIn)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 dark:text-neutral-400">Check Out</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{formatTime(selectedRecord.checkOut)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 dark:text-neutral-400">Hours Worked</span>
                                    <span className="font-semibold text-primary-950 dark:text-white">{selectedRecord.hoursWorked ?? "—"}</span>
                                </div>
                                {selectedRecord.shift && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Shift</span>
                                        <span className="font-semibold text-primary-950 dark:text-white">{selectedRecord.shift}</span>
                                    </div>
                                )}
                                {selectedRecord.lateBy && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Late By</span>
                                        <span className="font-semibold text-warning-600 dark:text-warning-400">{selectedRecord.lateBy}</span>
                                    </div>
                                )}
                            </div>
                            {(selectedRecord.status === "absent" || selectedRecord.status === "half_day") && (
                                <button
                                    onClick={openRegularize}
                                    className="w-full mt-3 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={14} />
                                    Regularize
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-neutral-400">No attendance record for this date.</p>
                            <button
                                onClick={openRegularize}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                            >
                                <AlertTriangle size={12} />
                                Request Regularization
                            </button>
                        </div>
                    )}
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
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Date</label>
                                <input type="date" value={regularizeForm.date} onChange={(e) => setRegularizeForm((p) => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Check In Time</label>
                                    <input type="time" value={regularizeForm.checkIn} onChange={(e) => setRegularizeForm((p) => ({ ...p, checkIn: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Check Out Time</label>
                                    <input type="time" value={regularizeForm.checkOut} onChange={(e) => setRegularizeForm((p) => ({ ...p, checkOut: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea value={regularizeForm.reason} onChange={(e) => setRegularizeForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason for regularization..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setRegularizeModal(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleRegularize} disabled={regularizeMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
