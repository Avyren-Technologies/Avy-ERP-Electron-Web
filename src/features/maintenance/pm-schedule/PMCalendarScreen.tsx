import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Loader2,
    List,
    Eye,
} from "lucide-react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { usePMCalendar } from "@/features/maintenance/api/use-maintenance-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { formatPMStrategyLabel } from "@/features/maintenance/pm-schedule/pm-schedule-form";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { pmCalendarHelp } from "@/features/maintenance/help";

/* ── Helpers ── */

function getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Pad start to Monday
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        days.push(d);
    }

    // Days of month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }

    // Pad end to fill week
    while (days.length % 7 !== 0) {
        const next = new Date(days[days.length - 1]);
        next.setDate(next.getDate() + 1);
        days.push(next);
    }

    return days;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Screen ── */

export function PMCalendarScreen() {
    const fmt = useCompanyFormatter();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const apiMonth = month + 1;
    const startDate = `${year}-${String(apiMonth).padStart(2, "0")}-01`;
    const endDate = DateTime.fromObject({ year, month: apiMonth }).endOf("month").toISODate()!;
    const params = { startDate, endDate };
    const { data, isLoading } = usePMCalendar(params);
    const calendarData: any = data?.data ?? {};

    // Build lookup: "YYYY-MM-DD" -> PM[]
    const pmByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        if (Array.isArray(calendarData)) {
            for (const item of calendarData) {
                const dateKey = item.date || item.nextDueDate?.split("T")[0];
                if (dateKey) {
                    if (!map[dateKey]) map[dateKey] = [];
                    map[dateKey].push(item);
                }
            }
        } else if (calendarData && typeof calendarData === "object") {
            for (const [dateKey, items] of Object.entries(calendarData)) {
                map[dateKey] = Array.isArray(items) ? items : [items];
            }
        }
        return map;
    }, [calendarData]);

    const days = getDaysInMonth(year, month);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(year - 1); }
        else setMonth(month - 1);
        setSelectedDate(null);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(year + 1); }
        else setMonth(month + 1);
        setSelectedDate(null);
    };

    const selectedPMs = selectedDate ? pmByDate[selectedDate] || [] : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/app/maintenance/pm-schedules"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">PM Calendar</h1>
                            <HelpDrawer help={pmCalendarHelp} />
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">View preventive maintenance schedule</p>
                    </div>
                </div>
                <Link
                    to="/app/maintenance/pm-schedules"
                    className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                    <List className="w-4 h-4" />
                    List View
                </Link>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <ChevronLeft size={20} className="text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <ChevronRight size={20} className="text-neutral-600 dark:text-neutral-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 size={32} className="animate-spin text-primary-500" />
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {WEEKDAYS.map((d) => (
                                <div key={d} className="text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider py-2">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, idx) => {
                                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                                const isCurrentMonth = day.getMonth() === month;
                                const isToday = dateStr === todayStr;
                                const isSelected = dateStr === selectedDate;
                                const pms = pmByDate[dateStr] || [];
                                const count = pms.length;
                                const hasOverdue = pms.some((p: any) => p.isOverdue || (p.nextDueDate && new Date(p.nextDueDate) < today));

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={cn(
                                            "relative flex min-h-[80px] items-center justify-center rounded-xl border p-2 transition-all",
                                            isCurrentMonth ? "bg-white dark:bg-neutral-900" : "bg-neutral-50/50 dark:bg-neutral-800/30",
                                            isSelected ? "border-primary-400 dark:border-primary-600 ring-2 ring-primary-500/20" : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600",
                                            isToday && "ring-2 ring-primary-500/30"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-sm font-bold leading-none",
                                            isCurrentMonth ? "text-neutral-900 dark:text-white" : "text-neutral-300 dark:text-neutral-600",
                                            isToday && "text-primary-600 dark:text-primary-400"
                                        )}>
                                            {day.getDate()}
                                        </span>
                                        {count > 0 && (
                                            <div className={cn(
                                                "absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-md text-center",
                                                hasOverdue
                                                    ? "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                                                    : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                            )}>
                                                {count} PM{count > 1 ? "s" : ""}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                        PMs for {fmt.date(selectedDate)}
                    </h3>
                    {selectedPMs.length === 0 ? (
                        <p className="text-sm text-neutral-400 text-center py-6">No PMs scheduled for this day.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedPMs.map((pm: any, idx: number) => (
                                <div key={pm.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{pm.name || pm.scheduleName || "PM Schedule"}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{pm.asset?.name || pm.assetName || "---"} | {formatPMStrategyLabel(pm.strategyType)}</p>
                                    </div>
                                    {pm.id && (
                                        <Link to={`/app/maintenance/pm-schedules/${pm.id || pm.scheduleId}`} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                            <Eye size={15} />
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
