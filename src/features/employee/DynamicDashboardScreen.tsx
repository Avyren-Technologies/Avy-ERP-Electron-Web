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
    Bell,
    BarChart3,
    CalendarDays,
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
    Cell, // eslint-disable-line deprecation/deprecation
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

/** Returns how many days from now until the given date string */
function daysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Check if a holiday falls within the current week */
function isThisWeek(dateStr: string): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const target = new Date(dateStr);
    return target >= startOfWeek && target <= endOfWeek;
}

/* ================================================================
   Empty State Component
   ================================================================ */

function EmptyState({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
            </div>
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[240px]">{subtitle}</p>
        </div>
    );
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
   Marquee Ticker Keyframes (injected once)
   ================================================================ */

const marqueeStyleId = "marquee-ticker-style";

function ensureMarqueeStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(marqueeStyleId)) return;
    const style = document.createElement("style");
    style.id = marqueeStyleId;
    style.textContent = `
        @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .marquee-track {
            animation: marquee-scroll var(--marquee-duration, 30s) linear infinite;
        }
        .marquee-track:hover {
            animation-play-state: paused;
        }
    `;
    document.head.appendChild(style);
}

/* ================================================================
   ROW 1: Welcome Header + Marquee Announcements
   ================================================================ */

function announcementPriorityClasses(p: DashboardAnnouncement["priority"]): string {
    if (p === "URGENT") return "bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300";
    if (p === "HIGH") return "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300";
    return "bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-300";
}

function WelcomeHeader({
    firstName,
    announcements,
}: {
    firstName: string;
    announcements: DashboardAnnouncement[];
}) {
    const navigate = useNavigate();

    useEffect(() => {
        ensureMarqueeStyles();
    }, []);

    const tickerContent = useMemo(() => {
        if (announcements.length === 0) return null;
        return announcements.map((a) => (
            <span
                key={a.id}
                className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium mr-6 whitespace-nowrap transition-opacity",
                    announcementPriorityClasses(a.priority)
                )}
            >
                {a.priority === "URGENT" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse flex-shrink-0" />
                )}
                {a.priority === "HIGH" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                )}
                <span className="font-semibold">{a.title}</span>
                <span className="opacity-60">—</span>
                <span className="opacity-80 max-w-xs truncate">{a.body}</span>
            </span>
        ));
    }, [announcements]);

    // Estimate duration based on content count
    const marqueeDuration = Math.max(20, announcements.length * 10);

    return (
        <div className="space-y-3">
            {/* Welcome Row */}
            <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 dark:text-white tracking-tight truncate">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatTodayDate()}</p>
                </div>
                <button
                    onClick={() => navigate("/app/notifications")}
                    className="relative ml-4 w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                    title="Notifications"
                >
                    <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
            </div>

            {/* Marquee Ticker */}
            {announcements.length > 0 && (
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center">
                        {/* Left: Announcement icon */}
                        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-r border-neutral-100 dark:border-neutral-800">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center">
                                <Megaphone className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {/* Scrolling ticker area */}
                        <div className="flex-1 overflow-hidden py-2">
                            <div
                                className="marquee-track flex items-center"
                                style={{ "--marquee-duration": `${marqueeDuration}s` } as React.CSSProperties}
                            >
                                {/* Duplicate content for seamless loop */}
                                {tickerContent}
                                {tickerContent}
                            </div>
                        </div>

                        {/* Right: View All link */}
                        <button
                            onClick={() => navigate("/app/announcements")}
                            className="flex-shrink-0 px-3 py-2 border-l border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors whitespace-nowrap"
                        >
                            View All &rarr;
                        </button>
                    </div>
                </div>
            )}
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
   ROW 3: Shift Calendar — Proper Month Calendar
   ================================================================ */

function shiftTypeColor(shiftType: string | null): string {
    if (!shiftType) return "bg-neutral-400";
    const t = shiftType.toUpperCase();
    if (t === "DAY" || t === "GENERAL" || t === "MORNING") return "bg-info-500";
    if (t === "NIGHT" || t === "EVENING") return "bg-primary-700";
    if (t === "FLEXIBLE" || t === "ROTATIONAL") return "bg-accent-500";
    return "bg-primary-500";
}

function shiftTypeDotColor(shiftType: string | null): string {
    if (!shiftType) return "#94A3B8";
    const t = shiftType.toUpperCase();
    if (t === "DAY" || t === "GENERAL" || t === "MORNING") return "#3B82F6";
    if (t === "NIGHT" || t === "EVENING") return "#4338CA";
    if (t === "FLEXIBLE" || t === "ROTATIONAL") return "#8B5CF6";
    return "#6366F1";
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ShiftCalendarMonth({ calendar }: { calendar: DashboardShiftCalendarDay[] | null }) {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Build a map from the API data
    const calendarMap = useMemo(() => {
        const map = new Map<string, DashboardShiftCalendarDay>();
        if (calendar) {
            for (const day of calendar) {
                map.set(day.date, day);
            }
        }
        return map;
    }, [calendar]);

    // Build the month grid
    const monthGrid = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get the day of week of the 1st (0=Sun, convert to Mon-start)
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;

        const cells: Array<{
            date: number;
            dateStr: string;
            inMonth: boolean;
            data: DashboardShiftCalendarDay | null;
        }> = [];

        // Fill leading blanks
        for (let i = 0; i < startDow; i++) {
            const prevDate = new Date(viewYear, viewMonth, -(startDow - 1 - i));
            cells.push({
                date: prevDate.getDate(),
                dateStr: prevDate.toISOString().split("T")[0],
                inMonth: false,
                data: null,
            });
        }

        // Fill month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({
                date: d,
                dateStr,
                inMonth: true,
                data: calendarMap.get(dateStr) ?? null,
            });
        }

        // Fill trailing blanks to complete the grid
        const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
        for (let i = 1; i <= remaining; i++) {
            const nextDate = new Date(viewYear, viewMonth + 1, i);
            cells.push({
                date: nextDate.getDate(),
                dateStr: nextDate.toISOString().split("T")[0],
                inMonth: false,
                data: null,
            });
        }

        return cells;
    }, [viewYear, viewMonth, calendarMap]);

    const selectedDayData = selectedDate ? calendarMap.get(selectedDate) : null;

    const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
        setSelectedDate(null);
    };

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return (
        <PremiumCard gradientAccent gradientFrom="from-primary-500" gradientTo="to-info-500">
            <CardHeader title="Shift Calendar" subtitle={monthName} />

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPrevMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </button>
                <span className="text-sm font-bold text-primary-950 dark:text-white">{monthName}</span>
                <button
                    onClick={goToNextMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((cell, idx) => {
                    const isToday = cell.dateStr === todayStr;
                    const isSelected = cell.dateStr === selectedDate;
                    const isHoliday = cell.data?.isHoliday ?? false;
                    const isWeekOff = cell.data?.isWeekOff ?? false;
                    const hasShift = !!cell.data?.shiftName;

                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                if (cell.inMonth) {
                                    setSelectedDate(isSelected ? null : cell.dateStr);
                                }
                            }}
                            className={cn(
                                "relative flex flex-col items-center justify-center rounded-lg py-1.5 min-h-[40px] transition-all duration-200",
                                !cell.inMonth && "opacity-30 cursor-default",
                                cell.inMonth && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                                isToday && "ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-neutral-900",
                                isSelected && cell.inMonth && "bg-primary-50 dark:bg-primary-900/20",
                                isHoliday && cell.inMonth && !isSelected && "bg-amber-50/60 dark:bg-amber-900/10",
                                isWeekOff && cell.inMonth && !isHoliday && !isSelected && "bg-neutral-50 dark:bg-neutral-800/30"
                            )}
                        >
                            <span
                                className={cn(
                                    "text-xs font-semibold leading-none",
                                    !cell.inMonth && "text-neutral-300 dark:text-neutral-600",
                                    cell.inMonth && "text-primary-950 dark:text-white",
                                    isToday && "text-primary-600 dark:text-primary-400 font-bold"
                                )}
                            >
                                {cell.date}
                            </span>
                            {/* Colored dot for shift type */}
                            {cell.inMonth && hasShift && !isHoliday && !isWeekOff && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full mt-0.5"
                                    style={{ backgroundColor: shiftTypeDotColor(cell.data!.shiftType) }}
                                />
                            )}
                            {cell.inMonth && isHoliday && (
                                <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-amber-500" />
                            )}
                            {cell.inMonth && isWeekOff && !isHoliday && (
                                <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-neutral-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected date detail panel */}
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    {selectedDayData ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-primary-950 dark:text-white">
                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                                {selectedDayData.isHoliday && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                        Holiday
                                    </span>
                                )}
                                {selectedDayData.isWeekOff && !selectedDayData.isHoliday && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                        Week Off
                                    </span>
                                )}
                            </div>
                            {selectedDayData.isHoliday && selectedDayData.holidayName && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    {selectedDayData.holidayName}
                                </p>
                            )}
                            {selectedDayData.shiftName && (
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-8 rounded-full", shiftTypeColor(selectedDayData.shiftType))} />
                                    <div>
                                        <p className="text-sm font-semibold text-primary-950 dark:text-white">
                                            {selectedDayData.shiftName}
                                        </p>
                                        {selectedDayData.startTime && selectedDayData.endTime && (
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                                                {selectedDayData.startTime} - {selectedDayData.endTime}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!selectedDayData.shiftName && !selectedDayData.isHoliday && !selectedDayData.isWeekOff && (
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">No shift assigned</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                            })}
                            {" "}&mdash; No schedule data available
                        </p>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-info-500" />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Day/General</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-700" />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Night/Evening</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Week Off</span>
                </div>
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
                <EmptyState icon={BarChart3} title="No attendance data" subtitle="Attendance data will appear once you start checking in." />
            </PremiumCard>
        );
    }

    const chartData = weeklyChart.map((d) => ({
        ...d,
        fill: getBarColor(d.status, d.isHoliday, d.isWeekOff),
        shortDate: d.dayName.slice(0, 3),
    }));

    // Dynamic Y-axis max: auto-calculate from data
    const maxHours = Math.max(...weeklyChart.map((d) => d.hoursWorked), 0);
    const yMax = Math.max(Math.ceil(maxHours * 1.2), 4); // at least 4, with 20% headroom

    // Dynamic X-axis: show every Nth label to avoid clutter
    const labelInterval = weeklyChart.length > 14 ? Math.floor(weeklyChart.length / 7) - 1 : 0;

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
                            interval={labelInterval}
                        />
                        <YAxis
                            domain={[0, yMax]}
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
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    if (!leaveDonut || leaveDonut.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-accent-500" gradientTo="to-primary-500">
                <CardHeader title="Leave Balance" subtitle="Category breakdown" />
                <EmptyState icon={Calendar} title="No leave data" subtitle="Leave balance will appear once leave types are configured." />
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
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={entry.fill}
                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    style={{
                                        transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                                        transformOrigin: "center",
                                        transition: "transform 200ms ease, opacity 200ms ease",
                                    }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.[0]) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-3 text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                                            <p className="font-bold text-primary-950 dark:text-white">{d.name}</p>
                                        </div>
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
                <EmptyState icon={Calendar} title="No leave types" subtitle="Leave types will appear once configured by your HR team." />
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
    return day.status.toLowerCase().includes("late");
}

function RecentAttendanceList({ records }: { records: DashboardAttendanceDay[] }) {
    const last7 = records.slice(0, 7);

    if (last7.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-success-500" gradientTo="to-primary-500">
                <CardHeader title="Recent Attendance" subtitle="Last 7 days" />
                <EmptyState icon={Clock} title="No attendance records" subtitle="Your attendance history will appear here once you start checking in." />
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
                            activeDot={{ r: 6, strokeWidth: 2, stroke: "#6366F1", fill: "#fff" }}
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
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "#8B5CF6", fill: "#fff" }}
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
                <EmptyState icon={CheckSquare} title="No pending approvals" subtitle="All approval requests have been handled." />
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
   ROW 10: Upcoming Holidays — Vertical List
   ================================================================ */

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

function UpcomingHolidaysList({ holidays }: { holidays: DashboardHoliday[] }) {
    if (holidays.length === 0) {
        return (
            <PremiumCard gradientAccent gradientFrom="from-warning-500" gradientTo="to-accent-500">
                <CardHeader title="Upcoming Holidays" />
                <EmptyState icon={CalendarDays} title="No upcoming holidays" subtitle="Holiday calendar will be updated by your HR team." />
            </PremiumCard>
        );
    }

    return (
        <PremiumCard gradientAccent gradientFrom="from-warning-500" gradientTo="to-accent-500">
            <CardHeader title="Upcoming Holidays" subtitle={`${holidays.length} upcoming`} />
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {holidays.slice(0, 8).map((h) => {
                    const d = new Date(h.date);
                    const thisWeek = isThisWeek(h.date);
                    const daysLeft = daysUntil(h.date);
                    const daysLabel =
                        daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `in ${daysLeft} days`;

                    return (
                        <div
                            key={h.id}
                            className={cn(
                                "flex items-center gap-4 py-3 first:pt-0 last:pb-0 transition-all",
                                thisWeek && "pl-3 border-l-[3px] border-l-transparent bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent -ml-1 rounded-r-lg",
                                thisWeek && "border-l-primary-500"
                            )}
                        >
                            {/* Date badge */}
                            <div
                                className={cn(
                                    "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
                                    thisWeek
                                        ? "bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm"
                                        : "bg-primary-50 dark:bg-primary-900/20"
                                )}
                            >
                                <span
                                    className={cn(
                                        "text-lg font-bold leading-none",
                                        !thisWeek && "text-primary-600 dark:text-primary-400"
                                    )}
                                >
                                    {d.getDate()}
                                </span>
                                <span
                                    className={cn(
                                        "text-[8px] font-bold uppercase mt-0.5",
                                        thisWeek
                                            ? "text-white/80"
                                            : "text-primary-400 dark:text-primary-500"
                                    )}
                                >
                                    {d.toLocaleDateString("en-IN", { month: "short" })}
                                </span>
                            </div>

                            {/* Name + weekday + days until */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                    {h.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {d.toLocaleDateString("en-IN", { weekday: "long" })}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                        {daysLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Type badge */}
                            <span
                                className={cn(
                                    "flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded-full",
                                    holidayTypeBadge(h.type)
                                )}
                            >
                                {h.type}
                            </span>
                        </div>
                    );
                })}
            </div>
        </PremiumCard>
    );
}

/* ================================================================
   Loading State — Per-section Skeletons
   ================================================================ */

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Welcome row */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton width="280px" height={32} />
                    <Skeleton width="200px" height={16} />
                </div>
                <Skeleton width={40} height={40} borderRadius={12} />
            </div>
            {/* Ticker */}
            <Skeleton height={44} borderRadius={12} />
            {/* Hero */}
            <Skeleton height={200} borderRadius={16} />
            {/* Calendar */}
            <WidgetSkeleton height={360} />
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
            {/* ROW 1: Welcome + Marquee Announcements */}
            <WelcomeHeader firstName={firstName} announcements={data.announcements} />

            {/* ROW 2: Shift Check-In Hero */}
            <ShiftCheckInHero shift={data.shift} />

            {/* ROW 3: Shift Calendar (Proper Month View) */}
            <ShiftCalendarMonth calendar={data.shiftCalendar} />

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

            {/* ROW 10: Upcoming Holidays (Vertical List) */}
            <UpcomingHolidaysList holidays={data.upcomingHolidays} />
        </div>
    );
}
