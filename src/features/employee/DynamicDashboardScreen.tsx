import { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Clock,
    CheckSquare,
    Target,
    Send,
    FileText,
    Eye,
    UserCircle,
    Users,
    ClipboardCheck,
    Landmark,
    GraduationCap,
    LogIn,
    LogOut,
    CheckCircle2,
    Loader2,
    Timer,
    ChevronRight,
    ChevronLeft,
    Megaphone,
    UserCheck,
    UserX,
    UserMinus,
    UserCog,
    MapPin,
    TrendingUp,
    TrendingDown,
    Coffee,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    AreaChart,
    Area,
    CartesianGrid,
    Legend,
} from "recharts";
import type { BarShapeProps } from "recharts";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { showSuccess, showApiError } from "@/lib/toast";
import { useAuthStore } from "@/store/useAuthStore";
import { checkPermission } from "@/lib/api/auth";
import { useDashboard, essKeys } from "@/features/company-admin/api/use-ess-queries";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
    DashboardData,
    DashboardLeaveBalanceItem,
    DashboardAttendanceDay,
    DashboardPendingApproval,
    DashboardHoliday,
    DashboardShiftInfo,
    DashboardAnnouncement,
    DashboardTeamSummary,
    DashboardShiftCalendarDay,
    DashboardWeeklyChartDay,
    DashboardLeaveDonutItem,
    DashboardMonthlyTrendItem,
} from "@/lib/api/ess";

/* ================================================================
   Helpers
   ================================================================ */

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatTodayDate(): string {
    return new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseWorkedHours(value: unknown): number | null {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = parseFloat(value.trim());
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function formatTimeShort(iso: string | null | undefined): string {
    if (!iso) return "--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const DEFAULT_DASHBOARD_STATS: DashboardData["stats"] = {
    leaveBalanceTotal: 0,
    attendancePercentage: 0,
    presentDays: 0,
    workingDays: 0,
    pendingApprovalsCount: 0,
    goals: {
        activeCount: 0,
        avgCompletion: 0,
    },
};

function normalizeDashboardData(data: DashboardData): DashboardData {
    return {
        announcements: data.announcements ?? [],
        shift: data.shift ?? null,
        stats: {
            ...DEFAULT_DASHBOARD_STATS,
            ...(data.stats ?? {}),
            goals: {
                ...DEFAULT_DASHBOARD_STATS.goals,
                ...(data.stats?.goals ?? {}),
            },
        },
        leaveBalances: data.leaveBalances ?? [],
        recentAttendance: data.recentAttendance ?? [],
        teamSummary: data.teamSummary ?? null,
        pendingApprovals: data.pendingApprovals ?? [],
        upcomingHolidays: data.upcomingHolidays ?? [],
        shiftCalendar: data.shiftCalendar ?? null,
        weeklyChart: data.weeklyChart ?? null,
        leaveDonut: data.leaveDonut ?? null,
        monthlyTrend: data.monthlyTrend ?? null,
    };
}

/* ================================================================
   Shared Card Shell — Premium Design
   ================================================================ */

function PremiumCard({
    children,
    className,
    gradientAccent = false,
    gradientFrom = "from-primary-500",
    gradientTo = "to-accent-500",
}: {
    children: React.ReactNode;
    className?: string;
    gradientAccent?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
}) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow duration-300",
                className
            )}
        >
            {gradientAccent && (
                <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r", gradientFrom, gradientTo)} />
            )}
            <div className="p-5 pt-6">{children}</div>
        </div>
    );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                {subtitle && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

/* ================================================================
   Skeleton Widgets
   ================================================================ */

function WidgetSkeleton({ className, height = 200 }: { className?: string; height?: number }) {
    return (
        <div
            className={cn(
                "rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden",
                className
            )}
        >
            <Skeleton height={height} borderRadius={0} />
        </div>
    );
}

/* ================================================================
   ROW 1: Welcome Header + Announcements
   ================================================================ */

function WelcomeHeader({
    firstName,
    announcements,
}: {
    firstName: string;
    announcements: DashboardAnnouncement[];
}) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (announcements.length <= 1) return;
        const id = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(id);
    }, [announcements.length]);

    const priorityColor = (p: DashboardAnnouncement["priority"]) => {
        if (p === "URGENT") return "border-danger-500/40 bg-danger-50/50 dark:bg-danger-900/10";
        if (p === "HIGH") return "border-warning-500/40 bg-warning-50/50 dark:bg-warning-900/10";
        return "border-primary-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-900";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left: Welcome */}
            <div className="lg:col-span-2 space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                    {getGreeting()}, {firstName}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatTodayDate()}</p>
            </div>

            {/* Right: Announcements */}
            <div className="lg:col-span-3">
                {announcements.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Megaphone className="w-4 h-4 text-accent-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                Announcements
                            </span>
                        </div>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">No recent announcements.</p>
                    </div>
                ) : (
                    <div
                        className={cn(
                            "rounded-2xl border shadow-sm p-5 transition-colors duration-500",
                            priorityColor(announcements[currentSlide]?.priority ?? "LOW")
                        )}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center">
                                <Megaphone className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                Announcements
                            </span>
                            {announcements[currentSlide]?.priority === "URGENT" && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-danger-500 text-white animate-pulse">
                                    Urgent
                                </span>
                            )}
                        </div>

                        <div className="relative overflow-hidden">
                            <div
                                className="transition-transform duration-500 ease-in-out flex"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {announcements.map((a) => (
                                    <div key={a.id} className="min-w-full flex-shrink-0 pr-4">
                                        <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                            {a.title}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                            {a.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {announcements.length > 1 && (
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex gap-1.5">
                                    {announcements.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentSlide(i)}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-all duration-300",
                                                i === currentSlide
                                                    ? "bg-primary-500 w-5"
                                                    : "bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() =>
                                            setCurrentSlide(
                                                (p) => (p - 1 + announcements.length) % announcements.length
                                            )
                                        }
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentSlide((p) => (p + 1) % announcements.length)
                                        }
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================================================================
   ROW 2: Shift Check-In Hero — Glassmorphic Mesh Gradient
   ================================================================ */

function ShiftCheckInHero({ shift }: { shift: DashboardShiftInfo | null }) {
    const queryClient = useQueryClient();

    // Live clock
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // GPS
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
                /* GPS optional */
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, []);

    // Elapsed timer
    const status = shift?.status ?? "NOT_CHECKED_IN";
    const startRef = useRef(Date.now());
    const baseRef = useRef(shift?.elapsedSeconds ?? 0);
    const [elapsed, setElapsed] = useState(shift?.elapsedSeconds ?? 0);

    useEffect(() => {
        baseRef.current = shift?.elapsedSeconds ?? 0;
        startRef.current = Date.now();
    }, [shift?.elapsedSeconds]);

    useEffect(() => {
        if (status !== "CHECKED_IN" || !shift?.punchIn) return;
        startRef.current = Date.now();
        baseRef.current = shift.elapsedSeconds ?? 0;
        const id = setInterval(() => {
            setElapsed(baseRef.current + Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [status, shift?.punchIn, shift?.elapsedSeconds]);

    // Mutations
    const checkInMutation = useMutation({
        mutationFn: async () => {
            const body: Record<string, number> = {};
            if (geo) {
                body.latitude = geo.lat;
                body.longitude = geo.lng;
            }
            const res = await client.post("/hr/attendance/check-in", body);
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Checked in successfully!");
            queryClient.invalidateQueries({ queryKey: ["attendance", "my-status"] });
            queryClient.invalidateQueries({ queryKey: essKeys.dashboard() });
        },
        onError: (err: unknown) => showApiError(err),
    });

    const checkOutMutation = useMutation({
        mutationFn: async () => {
            const body: Record<string, number> = {};
            if (geo) {
                body.latitude = geo.lat;
                body.longitude = geo.lng;
            }
            const res = await client.post("/hr/attendance/check-out", body);
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Checked out successfully!");
            queryClient.invalidateQueries({ queryKey: ["attendance", "my-status"] });
            queryClient.invalidateQueries({ queryKey: essKeys.dashboard() });
        },
        onError: (err: unknown) => showApiError(err),
    });

    const isMutating = checkInMutation.isPending || checkOutMutation.isPending;
    const isCheckedIn = status === "CHECKED_IN";
    const isCheckedOut = status === "CHECKED_OUT";
    const isNotCheckedIn = status === "NOT_CHECKED_IN";
    const workedHrs = parseWorkedHours(shift?.workedHours);

    const handleAction = useCallback(() => {
        if (isMutating || isCheckedOut) return;
        if (isNotCheckedIn) checkInMutation.mutate();
        else if (isCheckedIn) checkOutMutation.mutate();
    }, [isMutating, isCheckedOut, isNotCheckedIn, isCheckedIn, checkInMutation, checkOutMutation]);

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-primary-500/15 dark:shadow-primary-900/40">
            {/* Mesh gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-600 to-primary-800" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.4)_0%,_transparent_50%)]" />
            {/* Subtle noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 p-6 sm:p-8 text-white">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    {/* Left: shift info */}
                    <div className="text-center lg:text-left flex-1 min-w-0 space-y-2">
                        <p className="text-lg sm:text-xl font-bold tracking-tight">
                            {shift ? shift.shiftName : "No shift assigned"}
                        </p>
                        {shift ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 justify-center lg:justify-start">
                                    <Clock className="w-4 h-4 text-white/70" />
                                    <span className="text-sm text-white/90 font-medium tracking-wide">
                                        {shift.startTime} &mdash; {shift.endTime}
                                    </span>
                                </div>
                                {shift.locationName && (
                                    <div className="flex items-center gap-2 justify-center lg:justify-start">
                                        <MapPin className="w-3.5 h-3.5 text-white/50" />
                                        <span className="text-xs text-white/60">{shift.locationName}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-white/50">Contact your HR to assign a shift</p>
                        )}

                        {/* Status badge with glow */}
                        <div className="pt-1">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm border",
                                    isCheckedIn &&
                                        "bg-success-500/20 border-success-400/30 text-success-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
                                    isNotCheckedIn && "bg-white/10 border-white/20 text-white/80",
                                    isCheckedOut && "bg-white/10 border-white/20 text-white/70",
                                    status === "NOT_LINKED" && "bg-warning-500/20 border-warning-400/30 text-warning-200"
                                )}
                            >
                                {isCheckedIn && (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success-300" />
                                        </span>
                                        Checked In
                                    </>
                                )}
                                {isNotCheckedIn && (
                                    <>
                                        <Clock size={12} /> Not Checked In
                                    </>
                                )}
                                {isCheckedOut && (
                                    <>
                                        <CheckCircle2 size={12} /> Checked Out
                                    </>
                                )}
                                {status === "NOT_LINKED" && (
                                    <>
                                        <Clock size={12} /> Not Linked
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Center: Live digital clock */}
                    <div className="text-center flex-shrink-0">
                        <p
                            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wider tabular-nums"
                            style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" }}
                        >
                            {now.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                            })}
                        </p>
                        <p className="text-white/50 text-xs mt-1.5 font-medium">
                            {now.toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                            })}
                        </p>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-col items-center gap-3 flex-shrink-0 min-w-[160px]">
                        {isCheckedIn && (
                            <>
                                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md rounded-xl px-5 py-2.5 border border-white/10">
                                    <Timer className="w-4 h-4 text-white/70" />
                                    <span
                                        className="text-xl font-bold tabular-nums"
                                        style={{
                                            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                                        }}
                                    >
                                        {formatDuration(elapsed)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAction}
                                    disabled={isMutating}
                                    className="w-full px-8 py-3 rounded-xl font-bold text-sm bg-white/15 backdrop-blur-md border border-white/20 hover:bg-danger-500/80 hover:border-danger-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 disabled:opacity-60"
                                >
                                    {isMutating ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <LogOut className="w-4 h-4" /> Check Out
                                        </span>
                                    )}
                                </button>
                            </>
                        )}

                        {isNotCheckedIn && (
                            <button
                                onClick={handleAction}
                                disabled={isMutating}
                                className="px-10 py-4 rounded-xl font-bold text-base bg-white/15 backdrop-blur-md border-2 border-white/25 hover:bg-success-500/80 hover:border-success-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60"
                            >
                                {isMutating ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <LogIn className="w-5 h-5" /> Check In
                                    </span>
                                )}
                            </button>
                        )}

                        {isCheckedOut && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/20">
                                    <CheckCircle2 className="w-8 h-8 text-success-300" />
                                </div>
                                <span className="text-sm font-bold text-white/90">Shift Complete</span>
                                {workedHrs != null && (
                                    <span className="text-xs text-white/60 font-medium">
                                        {workedHrs.toFixed(1)} hrs worked
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom break schedule pills */}
                {shift && shift.status !== "NOT_LINKED" && (
                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">
                            Breaks
                        </span>
                        <span className="text-xs text-white/60 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/10">
                            <Coffee className="w-3 h-3 inline mr-1 -mt-px" />
                            Lunch 12:30 - 1:00
                        </span>
                        <span className="text-xs text-white/60 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/10">
                            <Coffee className="w-3 h-3 inline mr-1 -mt-px" />
                            Tea 3:30 - 3:45
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================================================================
   ROW 3: Shift Calendar — 14-Day Strip
   ================================================================ */

function shiftTypeColor(shiftType: string | null): string {
    if (!shiftType) return "bg-neutral-400";
    const t = shiftType.toUpperCase();
    if (t === "DAY" || t === "GENERAL" || t === "MORNING") return "bg-info-500";
    if (t === "NIGHT" || t === "EVENING") return "bg-primary-700";
    if (t === "FLEXIBLE" || t === "ROTATIONAL") return "bg-accent-500";
    return "bg-primary-500";
}

function ShiftCalendarStrip({ calendar }: { calendar: DashboardShiftCalendarDay[] | null }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to "today" on mount
    useEffect(() => {
        if (!scrollRef.current || !calendar) return;
        const todayIdx = calendar.findIndex((d) => d.isToday);
        if (todayIdx < 0) return;
        const container = scrollRef.current;
        const cardWidth = 96 + 12; // w-24 (96px) + gap-3 (12px)
        container.scrollLeft = Math.max(0, todayIdx * cardWidth - container.clientWidth / 2 + cardWidth / 2);
    }, [calendar]);

    if (!calendar || calendar.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-info-500">
                <CardHeader title="Shift Calendar" subtitle="14-day view" />
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">
                    No shift schedule available.
                </p>
            </PremiumCard>
        );
    }

    return (
        <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-info-500">
            <CardHeader title="Shift Calendar" subtitle="14-day view" />
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
                style={{ scrollbarWidth: "none" }}
            >
                {calendar.map((day) => {
                    const isToday = day.isToday;
                    const isHoliday = day.isHoliday;
                    const isWeekOff = day.isWeekOff;
                    const dateNum = new Date(day.date).getDate();

                    return (
                        <div
                            key={day.date}
                            className={cn(
                                "flex-shrink-0 w-24 rounded-xl border p-3 text-center transition-all duration-200",
                                isToday &&
                                    "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-900 border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20",
                                isHoliday &&
                                    !isToday &&
                                    "bg-gradient-to-b from-warning-50 to-warning-100/50 dark:from-warning-900/20 dark:to-warning-900/10 border-warning-200 dark:border-warning-800/50",
                                isWeekOff &&
                                    !isToday &&
                                    !isHoliday &&
                                    "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)]",
                                !isToday &&
                                    !isHoliday &&
                                    !isWeekOff &&
                                    "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-700"
                            )}
                        >
                            <p
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    isToday
                                        ? "text-primary-600 dark:text-primary-400"
                                        : "text-neutral-400 dark:text-neutral-500"
                                )}
                            >
                                {day.dayName}
                            </p>
                            <p
                                className={cn(
                                    "text-xl font-bold mt-0.5",
                                    isToday
                                        ? "text-primary-700 dark:text-primary-300"
                                        : "text-primary-950 dark:text-white"
                                )}
                            >
                                {dateNum}
                            </p>

                            {isToday && (
                                <span className="inline-block text-[8px] font-bold uppercase tracking-widest text-primary-500 mt-0.5">
                                    Today
                                </span>
                            )}

                            {isHoliday ? (
                                <div className="mt-1.5">
                                    <span className="text-[9px] font-bold text-warning-600 dark:text-warning-400 leading-tight line-clamp-2">
                                        {day.holidayName ?? "Holiday"}
                                    </span>
                                </div>
                            ) : isWeekOff ? (
                                <div className="mt-1.5">
                                    <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500">
                                        Week Off
                                    </span>
                                </div>
                            ) : day.shiftName ? (
                                <div className="mt-1.5 space-y-1">
                                    <div className={cn("h-1 w-full rounded-full", shiftTypeColor(day.shiftType))} />
                                    <p className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                                        {day.shiftName}
                                    </p>
                                    {day.startTime && day.endTime && (
                                        <p className="text-[8px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                                            {day.startTime} - {day.endTime}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-1.5">
                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500">--</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}

/* ================================================================
   ROW 4: Quick Stats — Premium Glassmorphic KPI Cards
   ================================================================ */

interface QuickStatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
    subtitle?: string;
    gradientFrom: string;
    gradientTo: string;
    iconBg: string;
    iconColor: string;
    trend?: { direction: "up" | "down"; value: string } | null;
}

function QuickStatCard({
    icon: Icon,
    value,
    label,
    subtitle,
    gradientFrom,
    gradientTo,
    iconBg,
    iconColor,
    trend,
}: QuickStatCardProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 group">
            {/* Subtle gradient background */}
            <div
                className={cn(
                    "absolute inset-0 opacity-[0.04] dark:opacity-[0.06] bg-gradient-to-br",
                    gradientFrom,
                    gradientTo
                )}
            />
            <div className="relative p-5">
                <div className="flex items-start justify-between">
                    <div
                        className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-sm",
                            iconBg
                        )}
                    >
                        <Icon className={cn("w-5 h-5", iconColor)} />
                    </div>
                    {trend && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                trend.direction === "up"
                                    ? "bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400"
                                    : "bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400"
                            )}
                        >
                            {trend.direction === "up" ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            {trend.value}
                        </div>
                    )}
                </div>
                <p className="text-2xl font-bold text-primary-950 dark:text-white tabular-nums mt-3">{value}</p>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
                {subtitle && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function QuickStatsRow({ data }: { data: DashboardData }) {
    const stats = data.stats;

    // Compute attendance trend from monthlyTrend if available
    const attendanceTrend = useMemo(() => {
        if (!data.monthlyTrend || data.monthlyTrend.length < 2) return null;
        const sorted = [...data.monthlyTrend].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];
            return months.indexOf(a.month) - months.indexOf(b.month);
        });
        const latest = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];
        if (!latest || !prev) return null;
        const diff = latest.attendancePercentage - prev.attendancePercentage;
        if (diff === 0) return null;
        return {
            direction: diff > 0 ? ("up" as const) : ("down" as const),
            value: `${Math.abs(diff).toFixed(1)}%`,
        };
    }, [data.monthlyTrend]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStatCard
                icon={Calendar}
                value={stats.leaveBalanceTotal.toString()}
                label="Leave Balance"
                subtitle="Remaining days"
                gradientFrom="from-primary-400"
                gradientTo="to-primary-600"
                iconBg="bg-primary-50 dark:bg-primary-900/20"
                iconColor="text-primary-600 dark:text-primary-400"
            />
            <QuickStatCard
                icon={Clock}
                value={`${stats.attendancePercentage}%`}
                label="Attendance"
                subtitle={`${stats.presentDays}/${stats.workingDays} days this month`}
                gradientFrom="from-success-400"
                gradientTo="to-success-600"
                iconBg="bg-success-50 dark:bg-success-900/20"
                iconColor="text-success-600 dark:text-success-400"
                trend={attendanceTrend}
            />
            <QuickStatCard
                icon={CheckSquare}
                value={stats.pendingApprovalsCount.toString()}
                label="Pending Approvals"
                subtitle={stats.pendingApprovalsCount > 0 ? "Awaiting your action" : "All caught up"}
                gradientFrom="from-warning-400"
                gradientTo="to-warning-600"
                iconBg={
                    stats.pendingApprovalsCount > 0
                        ? "bg-warning-50 dark:bg-warning-900/20"
                        : "bg-neutral-100 dark:bg-neutral-800"
                }
                iconColor={
                    stats.pendingApprovalsCount > 0
                        ? "text-warning-600 dark:text-warning-400"
                        : "text-neutral-400 dark:text-neutral-500"
                }
            />
            <QuickStatCard
                icon={Target}
                value={stats.goals.activeCount.toString()}
                label="Active Goals"
                subtitle={`Avg ${stats.goals.avgCompletion}% complete`}
                gradientFrom="from-accent-400"
                gradientTo="to-accent-600"
                iconBg="bg-accent-50 dark:bg-accent-900/20"
                iconColor="text-accent-600 dark:text-accent-400"
            />
        </div>
    );
}

/* ================================================================
   ROW 5: Analytics Charts — Weekly Bar + Leave Donut
   ================================================================ */

const CHART_COLORS = {
    present: "#10B981",
    absent: "#EF4444",
    holiday: "#3B82F6",
    weekoff: "#94A3B8",
    halfDay: "#F59E0B",
    late: "#D97706",
};

function getBarColor(status: string, isHoliday: boolean, isWeekOff: boolean): string {
    if (isHoliday) return CHART_COLORS.holiday;
    if (isWeekOff) return CHART_COLORS.weekoff;
    const lower = status.toLowerCase();
    if (lower === "present") return CHART_COLORS.present;
    if (lower === "absent") return CHART_COLORS.absent;
    if (lower.includes("half")) return CHART_COLORS.halfDay;
    if (lower === "late") return CHART_COLORS.late;
    return CHART_COLORS.present;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeeklyBarTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload as DashboardWeeklyChartDay;
    return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-primary-950 dark:text-white">{d.dayName}, {d.date}</p>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Hours: <span className="font-semibold text-primary-950 dark:text-white">{d.hoursWorked.toFixed(1)}</span>
            </p>
            <p className="text-neutral-500 dark:text-neutral-400">
                Status: <span className="font-semibold">{d.status}</span>
            </p>
        </div>
    );
}

function WeeklyAttendanceChart({ weeklyChart }: { weeklyChart: DashboardWeeklyChartDay[] | null }) {
    const chartId = useId();

    if (!weeklyChart || weeklyChart.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-success-500" gradientTo="to-info-500">
                <CardHeader title="Weekly Attendance" subtitle="Hours worked per day" />
                <div className="h-[260px] flex items-center justify-center">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No attendance data available.</p>
                </div>
            </PremiumCard>
        );
    }

    const chartData = weeklyChart.map((d) => ({
        ...d,
        fill: getBarColor(d.status, d.isHoliday, d.isWeekOff),
        shortDate: d.dayName.slice(0, 3),
    }));

    return (
        <PremiumCard gradientAccent gradientFrom="from-success-500" gradientTo="to-info-500">
            <CardHeader title="Weekly Attendance" subtitle="Hours worked per day" />
            <div className="h-[260px]" aria-labelledby={chartId}>
                <span id={chartId} className="sr-only">
                    Bar chart showing weekly attendance hours
                </span>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="currentColor"
                            className="text-neutral-100 dark:text-neutral-800"
                        />
                        <XAxis
                            dataKey="shortDate"
                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 12]}
                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v}h`}
                        />
                        <Tooltip content={<WeeklyBarTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                        <Bar
                            dataKey="hoursWorked"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={32}
                            shape={(props: BarShapeProps) => {
                                const { x, y, width, height, payload } = props;
                                const dataFill = payload?.fill ?? "#6366F1";
                                return (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={dataFill}
                                        rx={6}
                                        ry={6}
                                    />
                                );
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                {[
                    { color: CHART_COLORS.present, label: "Present" },
                    { color: CHART_COLORS.absent, label: "Absent" },
                    { color: CHART_COLORS.holiday, label: "Holiday" },
                    { color: CHART_COLORS.weekoff, label: "Week Off" },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </PremiumCard>
    );
}

const DONUT_COLORS: Record<string, string> = {
    PAID: "#6366F1",
    UNPAID: "#F59E0B",
    COMPENSATORY: "#8B5CF6",
    STATUTORY: "#10B981",
    EARNED: "#3B82F6",
    CASUAL: "#14B8A6",
    SICK: "#EF4444",
};

function getDonutColor(category: string, fallback: string): string {
    return DONUT_COLORS[category.toUpperCase()] ?? fallback;
}

function LeaveDonutChart({ leaveDonut }: { leaveDonut: DashboardLeaveDonutItem[] | null }) {
    const chartId = useId();

    if (!leaveDonut || leaveDonut.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-accent-500" gradientTo="to-primary-500">
                <CardHeader title="Leave Balance" subtitle="Category breakdown" />
                <div className="h-[260px] flex items-center justify-center">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No leave data available.</p>
                </div>
            </PremiumCard>
        );
    }

    const totalRemaining = leaveDonut.reduce((sum, d) => sum + d.remaining, 0);
    const chartData = leaveDonut.map((d) => ({
        name: d.category,
        value: d.remaining,
        used: d.used,
        total: d.totalEntitled,
        fill: getDonutColor(d.category, d.color),
    }));

    return (
        <PremiumCard gradientAccent gradientFrom="from-accent-500" gradientTo="to-primary-500">
            <CardHeader title="Leave Balance" subtitle="Category breakdown" />
            <div className="h-[260px] relative" aria-labelledby={chartId}>
                <span id={chartId} className="sr-only">
                    Donut chart showing leave balance by category
                </span>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={800}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-3 text-xs">
                                        <p className="font-bold text-primary-950 dark:text-white">{d.name}</p>
                                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                            Remaining: <span className="font-semibold">{d.value}</span> / {d.total} days
                                        </p>
                                        <p className="text-neutral-500 dark:text-neutral-400">
                                            Used: <span className="font-semibold">{d.used}</span> days
                                        </p>
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary-950 dark:text-white tabular-nums">
                            {totalRemaining}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">days left</p>
                    </div>
                </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                {chartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                            {d.name}
                        </span>
                        <span className="text-[10px] font-bold text-primary-950 dark:text-white tabular-nums ml-auto">
                            {d.used}/{d.total}
                        </span>
                    </div>
                ))}
            </div>
        </PremiumCard>
    );
}

/* ================================================================
   ROW 6: Quick Actions — Cards with gradient left border
   ================================================================ */

interface QuickAction {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    route: string;
    permission?: string;
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
    {
        id: "apply-leave",
        title: "Apply Leave",
        subtitle: "Submit a leave request",
        icon: Send,
        gradient: "from-primary-500 to-primary-600",
        route: "/app/company/hr/my-leave",
        permission: "ess:apply-leave",
    },
    {
        id: "payslips",
        title: "My Payslips",
        subtitle: "View salary slips",
        icon: FileText,
        gradient: "from-success-500 to-success-600",
        route: "/app/company/hr/my-payslips",
        permission: "ess:view-payslips",
    },
    {
        id: "attendance",
        title: "My Attendance",
        subtitle: "View attendance log",
        icon: Eye,
        gradient: "from-info-500 to-info-600",
        route: "/app/company/hr/my-attendance",
        permission: "ess:view-attendance",
    },
    {
        id: "profile",
        title: "My Profile",
        subtitle: "Update your details",
        icon: UserCircle,
        gradient: "from-warning-500 to-warning-600",
        route: "/app/company/hr/my-profile",
        permission: "ess:view-profile",
    },
    {
        id: "team-view",
        title: "Team View",
        subtitle: "Manage your team",
        icon: Users,
        gradient: "from-accent-500 to-accent-600",
        route: "/app/company/hr/team-view",
        permission: "hr:approve",
    },
    {
        id: "approvals",
        title: "Approvals",
        subtitle: "Pending requests",
        icon: ClipboardCheck,
        gradient: "from-danger-500 to-danger-600",
        route: "/app/company/hr/approval-requests",
        permission: "hr:approve",
    },
    {
        id: "it-declaration",
        title: "IT Declaration",
        subtitle: "Tax declarations",
        icon: Landmark,
        gradient: "from-primary-400 to-accent-500",
        route: "/app/company/hr/it-declarations",
        permission: "ess:it-declaration",
    },
    {
        id: "goals",
        title: "My Goals",
        subtitle: "Track your goals",
        icon: Target,
        gradient: "from-success-400 to-success-600",
        route: "/app/company/hr/my-goals",
        permission: "ess:view-goals",
    },
    {
        id: "training",
        title: "My Training",
        subtitle: "Enroll in programs",
        icon: GraduationCap,
        gradient: "from-info-400 to-info-600",
        route: "/app/company/hr/my-training",
        permission: "ess:enroll-training",
    },
];

function QuickActionsGrid({ permissions }: { permissions: string[] }) {
    const navigate = useNavigate();

    const visibleActions = useMemo(() => {
        return ALL_QUICK_ACTIONS.filter(
            (a) => !a.permission || checkPermission(permissions, a.permission)
        ).slice(0, 6);
    }, [permissions]);

    if (visibleActions.length === 0) return null;

    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleActions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.route)}
                        className="group flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left relative overflow-hidden"
                    >
                        {/* Gradient left border */}
                        <div
                            className={cn(
                                "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b rounded-l-2xl transition-all duration-300 group-hover:w-1.5 group-hover:shadow-lg",
                                action.gradient
                            )}
                        />
                        <div
                            className={cn(
                                "w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-sm flex-shrink-0 ml-2",
                                action.gradient
                            )}
                        >
                            <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {action.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                                {action.subtitle}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 ml-auto flex-shrink-0 group-hover:text-primary-400 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ================================================================
   ROW 7: Leave Balance + Recent Attendance (Two Column)
   ================================================================ */

const LEAVE_COLORS = [
    "bg-primary-500",
    "bg-success-500",
    "bg-accent-500",
    "bg-warning-500",
    "bg-info-500",
    "bg-danger-500",
];

const LEAVE_GRADIENT_COLORS = [
    "from-primary-400 to-primary-600",
    "from-success-400 to-success-600",
    "from-accent-400 to-accent-600",
    "from-warning-400 to-warning-600",
    "from-info-400 to-info-600",
    "from-danger-400 to-danger-600",
];

function LeaveBalanceBreakdown({ balances }: { balances: DashboardLeaveBalanceItem[] }) {
    if (balances.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-accent-500">
                <CardHeader title="Leave Balance" subtitle="Breakdown by type" />
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">
                    No leave types configured.
                </p>
            </PremiumCard>
        );
    }

    return (
        <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-accent-500">
            <CardHeader title="Leave Balance" subtitle="Breakdown by type" />
            <div className="space-y-4">
                {balances.map((lb, i) => {
                    const total = lb.allocated;
                    const used = lb.used;
                    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                    const gradientColor = LEAVE_GRADIENT_COLORS[i % LEAVE_GRADIENT_COLORS.length];
                    const dotColor = lb.color ?? LEAVE_COLORS[i % LEAVE_COLORS.length];

                    return (
                        <div key={lb.leaveTypeName}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", dotColor)}
                                    />
                                    <span className="text-sm font-medium text-primary-950 dark:text-white">
                                        {lb.leaveTypeName}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                                    {lb.remaining}/{total} days
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                                        gradientColor
                                    )}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}

function attendanceStatusColor(status: string): string {
    const lower = status.toLowerCase();
    if (lower === "present")
        return "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400 border-success-200 dark:border-success-800/50";
    if (lower === "half day")
        return "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400 border-warning-200 dark:border-warning-800/50";
    if (lower === "absent")
        return "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400 border-danger-200 dark:border-danger-800/50";
    if (lower === "on leave" || lower === "leave")
        return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400 border-info-200 dark:border-info-800/50";
    if (lower === "holiday" || lower === "week off")
        return "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400 border-accent-200 dark:border-accent-800/50";
    return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
}

function isLateAttendance(day: DashboardAttendanceDay): boolean {
    // Heuristic: if status includes "late"
    return day.status.toLowerCase().includes("late");
}

function RecentAttendanceList({ records }: { records: DashboardAttendanceDay[] }) {
    const last7 = records.slice(0, 7);

    if (last7.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-success-500" gradientTo="to-primary-500">
                <CardHeader title="Recent Attendance" subtitle="Last 7 days" />
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">
                    No attendance records found.
                </p>
            </PremiumCard>
        );
    }

    return (
        <PremiumCard gradientAccent gradientFrom="from-success-500" gradientTo="to-primary-500">
            <CardHeader title="Recent Attendance" subtitle="Last 7 days" />
            <div className="space-y-2">
                {last7.map((day, i) => {
                    const wh = parseWorkedHours(day.workedHours);
                    const isLate = isLateAttendance(day);
                    return (
                        <div
                            key={day.date + i}
                            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/30 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="text-center flex-shrink-0 w-10">
                                    <p className="text-xs font-bold text-primary-950 dark:text-white leading-none">
                                        {new Date(day.date).getDate()}
                                    </p>
                                    <p className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase font-medium">
                                        {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                        attendanceStatusColor(day.status)
                                    )}
                                >
                                    {day.status}
                                </span>
                                {isLate && (
                                    <span className="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0" title="Late" />
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                                    {formatTimeShort(day.punchIn)}
                                    {day.punchOut ? ` - ${formatTimeShort(day.punchOut)}` : ""}
                                </span>
                                <span className="text-xs font-bold text-primary-950 dark:text-white tabular-nums w-12 text-right bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded-lg">
                                    {wh != null ? `${wh.toFixed(1)}h` : "--"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}

/* ================================================================
   ROW 8: Monthly Trend Area Chart (Full Width)
   ================================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthlyTrendTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as DashboardMonthlyTrendItem;
    if (!d) return null;
    return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-primary-950 dark:text-white">
                {d.month} {d.year}
            </p>
            <div className="space-y-0.5 mt-1.5">
                <p className="text-neutral-500 dark:text-neutral-400">
                    Attendance: <span className="font-bold text-primary-600 dark:text-primary-400">{d.attendancePercentage}%</span>
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Working Days: <span className="font-semibold">{d.workingDays}</span>
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Present: <span className="font-semibold text-success-600">{d.presentDays}</span>
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Absent: <span className="font-semibold text-danger-600">{d.absentDays}</span>
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Late: <span className="font-semibold text-warning-600">{d.lateDays}</span>
                </p>
            </div>
        </div>
    );
}

function MonthlyTrendChart({ monthlyTrend }: { monthlyTrend: DashboardMonthlyTrendItem[] | null }) {
    const chartId = useId();

    if (!monthlyTrend || monthlyTrend.length === 0) return null;

    const chartData = monthlyTrend.map((d) => ({
        ...d,
        label: `${d.month.slice(0, 3)}`,
    }));

    return (
        <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-accent-500">
            <CardHeader title="Monthly Attendance Trend" subtitle="6-month overview" />
            <div className="h-[280px]" aria-labelledby={chartId}>
                <span id={chartId} className="sr-only">
                    Area chart showing monthly attendance trend
                </span>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                        <defs>
                            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="currentColor"
                            className="text-neutral-100 dark:text-neutral-800"
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip content={<MonthlyTrendTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="attendancePercentage"
                            stroke="#6366F1"
                            strokeWidth={2.5}
                            fill="url(#attendanceGradient)"
                            animationDuration={1000}
                            name="Attendance %"
                        />
                        <Area
                            type="monotone"
                            dataKey="presentDays"
                            stroke="#8B5CF6"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            fill="transparent"
                            animationDuration={1200}
                            name="Present Days"
                        />
                        <Legend
                            iconType="line"
                            wrapperStyle={{ fontSize: 11, color: "#94A3B8", paddingTop: 12 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </PremiumCard>
    );
}

/* ================================================================
   ROW 9: Manager Section — Team Summary + Pending Approvals
   ================================================================ */

function TeamSummaryWidget({ summary }: { summary: DashboardTeamSummary }) {
    const items = [
        {
            label: "Present",
            value: summary.present,
            total: summary.total,
            color: "text-success-600 dark:text-success-400",
            ringColor: "stroke-success-500",
            bgRing: "stroke-success-100 dark:stroke-success-900/30",
            icon: UserCheck,
        },
        {
            label: "Absent",
            value: summary.absent,
            total: summary.total,
            color: "text-danger-600 dark:text-danger-400",
            ringColor: "stroke-danger-500",
            bgRing: "stroke-danger-100 dark:stroke-danger-900/30",
            icon: UserX,
        },
        {
            label: "On Leave",
            value: summary.onLeave,
            total: summary.total,
            color: "text-info-600 dark:text-info-400",
            ringColor: "stroke-info-500",
            bgRing: "stroke-info-100 dark:stroke-info-900/30",
            icon: UserMinus,
        },
        {
            label: "Not In",
            value: summary.notCheckedIn,
            total: summary.total,
            color: "text-neutral-500 dark:text-neutral-400",
            ringColor: "stroke-neutral-400",
            bgRing: "stroke-neutral-200 dark:stroke-neutral-700",
            icon: UserCog,
        },
    ];

    return (
        <PremiumCard gradientAccent gradientFrom="from-info-500" gradientTo="to-primary-500">
            <CardHeader title="Team Summary" subtitle={`${summary.total} total members`} />
            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                    const circumference = 2 * Math.PI * 28;
                    const dashOffset = circumference - (circumference * pct) / 100;

                    return (
                        <div key={item.label} className="flex flex-col items-center text-center">
                            <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        strokeWidth="4"
                                        className={item.bgRing}
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        className={item.ringColor}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={cn("text-lg font-bold tabular-nums", item.color)}>
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mt-1.5">
                                {item.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}

function PendingApprovalsWidget({ approvals }: { approvals: DashboardPendingApproval[] }) {
    const navigate = useNavigate();
    const top3 = approvals.slice(0, 3);

    const typeColor = (type: string): string => {
        const lower = type.toLowerCase();
        if (lower.includes("leave"))
            return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400";
        if (lower.includes("attendance"))
            return "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400";
        return "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400";
    };

    return (
        <PremiumCard gradientAccent gradientFrom="from-warning-500" gradientTo="to-danger-500">
            <CardHeader title="Pending Approvals" subtitle={`${approvals.length} total`} />
            {top3.length === 0 ? (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-2">No pending approvals.</p>
            ) : (
                <div className="space-y-3">
                    {top3.map((item) => {
                        const initials = item.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                        return (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/30"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-white">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                        {item.employeeName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                typeColor(item.type)
                                            )}
                                        >
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            {item.description}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {approvals.length > 0 && (
                <button
                    onClick={() => navigate("/app/company/hr/approval-requests")}
                    className="w-full mt-4 py-2.5 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                >
                    View All Approvals
                </button>
            )}
        </PremiumCard>
    );
}

/* ================================================================
   ROW 10: Upcoming Holidays — Horizontal Scrollable Cards
   ================================================================ */

function holidayMonthIsCurrentMonth(dateStr: string): boolean {
    const now = new Date();
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function holidayTypeBadge(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes("national") || lower === "gazetted")
        return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400";
    if (lower.includes("company") || lower === "restricted")
        return "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400";
    if (lower.includes("optional"))
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
    return "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400";
}

function UpcomingHolidaysStrip({ holidays }: { holidays: DashboardHoliday[] }) {
    if (holidays.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-warning-500" gradientTo="to-accent-500">
                <CardHeader title="Upcoming Holidays" />
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">
                    No upcoming holidays.
                </p>
            </PremiumCard>
        );
    }

    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                Upcoming Holidays
            </h2>
            <div
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none" }}
            >
                {holidays.slice(0, 8).map((h) => {
                    const d = new Date(h.date);
                    const isThisMonth = holidayMonthIsCurrentMonth(h.date);

                    return (
                        <div
                            key={h.id}
                            className={cn(
                                "flex-shrink-0 w-52 rounded-2xl border shadow-sm p-4 transition-all duration-200 hover:shadow-md",
                                isThisMonth
                                    ? "border-primary-200 dark:border-primary-700 bg-gradient-to-br from-white to-primary-50/30 dark:from-neutral-900 dark:to-primary-900/10"
                                    : "border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
                                        isThisMonth
                                            ? "bg-gradient-to-br from-primary-500 to-accent-500 text-white"
                                            : "bg-primary-50 dark:bg-primary-900/20"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-lg font-bold leading-none",
                                            !isThisMonth && "text-primary-600 dark:text-primary-400"
                                        )}
                                    >
                                        {d.getDate()}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-[8px] font-bold uppercase",
                                            isThisMonth
                                                ? "text-white/80"
                                                : "text-primary-400 dark:text-primary-500"
                                        )}
                                    >
                                        {d.toLocaleDateString("en-IN", { month: "short" })}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                        {h.name}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                        {d.toLocaleDateString("en-IN", { weekday: "long" })}
                                    </p>
                                    <span
                                        className={cn(
                                            "inline-flex mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                            holidayTypeBadge(h.type)
                                        )}
                                    >
                                        {h.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ================================================================
   Loading State — Per-section Skeletons
   ================================================================ */

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Welcome row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-2">
                    <Skeleton width="280px" height={32} />
                    <Skeleton width="200px" height={16} />
                </div>
                <div className="lg:col-span-3">
                    <WidgetSkeleton height={100} />
                </div>
            </div>
            {/* Hero */}
            <Skeleton height={200} borderRadius={16} />
            {/* Calendar strip */}
            <WidgetSkeleton height={160} />
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <WidgetSkeleton key={i} height={130} />
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WidgetSkeleton height={340} />
                <WidgetSkeleton height={340} />
            </div>
            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <WidgetSkeleton key={i} height={72} />
                ))}
            </div>
            {/* Two column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WidgetSkeleton height={280} />
                <WidgetSkeleton height={280} />
            </div>
        </div>
    );
}

/* ================================================================
   Main Dashboard Component
   ================================================================ */

export function DynamicDashboardScreen() {
    const { data: dashboardResponse, isLoading } = useDashboard();
    const user = useAuthStore((s) => s.user);
    const permissions = useAuthStore((s) => s.permissions) || [];
    const firstName = user?.firstName ?? "there";

    const rawData = dashboardResponse?.data as DashboardData | undefined;

    if (isLoading || !rawData) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <DashboardSkeleton />
            </div>
        );
    }

    const data = normalizeDashboardData(rawData);

    const hasTeamData = data.teamSummary !== null;
    const hasPendingApprovals = data.pendingApprovals.length > 0;
    const showManagerRow = hasTeamData || hasPendingApprovals;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* ROW 1: Welcome + Announcements */}
            <WelcomeHeader firstName={firstName} announcements={data.announcements} />

            {/* ROW 2: Shift Check-In Hero */}
            <ShiftCheckInHero shift={data.shift} />

            {/* ROW 3: Shift Calendar (14-day strip) */}
            <ShiftCalendarStrip calendar={data.shiftCalendar} />

            {/* ROW 4: Quick Stats KPIs */}
            <QuickStatsRow data={data} />

            {/* ROW 5: Analytics Charts — Weekly Bar + Leave Donut */}
            {(data.weeklyChart || data.leaveDonut) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WeeklyAttendanceChart weeklyChart={data.weeklyChart} />
                    <LeaveDonutChart leaveDonut={data.leaveDonut} />
                </div>
            )}

            {/* ROW 6: Quick Actions */}
            <QuickActionsGrid permissions={permissions} />

            {/* ROW 7: Leave Balance + Recent Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeaveBalanceBreakdown balances={data.leaveBalances} />
                <RecentAttendanceList records={data.recentAttendance} />
            </div>

            {/* ROW 8: Monthly Trend Chart */}
            <MonthlyTrendChart monthlyTrend={data.monthlyTrend} />

            {/* ROW 9: Manager Section */}
            {showManagerRow && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {hasTeamData && <TeamSummaryWidget summary={data.teamSummary!} />}
                    {hasPendingApprovals && <PendingApprovalsWidget approvals={data.pendingApprovals} />}
                    {hasTeamData && !hasPendingApprovals && <div />}
                    {!hasTeamData && hasPendingApprovals && <div />}
                </div>
            )}

            {/* ROW 10: Upcoming Holidays */}
            <UpcomingHolidaysStrip holidays={data.upcomingHolidays} />
        </div>
    );
}
