import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
    Megaphone,
    ChevronLeft,
    CalendarDays,
    UserCheck,
    UserX,
    UserMinus,
    UserCog,
} from "lucide-react";
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

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatHolidayDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function formatTimeShort(iso: string | null | undefined): string {
    if (!iso) return "--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/* ================================================================
   Skeleton Widgets
   ================================================================ */

function WidgetSkeleton({ className, height = 200 }: { className?: string; height?: number }) {
    return (
        <div className={cn("rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden", className)}>
            <Skeleton height={height} borderRadius={0} />
        </div>
    );
}

/* ================================================================
   ROW 1: Welcome + Announcements
   ================================================================ */

function WelcomeAnnouncements({ firstName, announcements }: { firstName: string; announcements: DashboardAnnouncement[] }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-scroll announcements every 5s
    useEffect(() => {
        if (announcements.length <= 1) return;
        const id = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(id);
    }, [announcements.length]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Welcome */}
            <div className="lg:col-span-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                    {getGreeting()}, {firstName}!
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
                    {formatTodayDate()}
                </p>
            </div>

            {/* Announcements */}
            <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm p-5 min-h-[100px]">
                <div className="flex items-center gap-2 mb-3">
                    <Megaphone className="w-4 h-4 text-accent-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Announcements</h3>
                </div>

                {announcements.length === 0 ? (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No recent announcements.</p>
                ) : (
                    <div className="relative">
                        <div className="overflow-hidden">
                            <div
                                className="transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentSlide * 100}%)`, display: "flex" }}
                            >
                                {announcements.map((a) => (
                                    <div key={a.id} className="min-w-full flex-shrink-0 pr-4">
                                        <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{a.title}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{a.body}</p>
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
                                                "w-2 h-2 rounded-full transition-colors",
                                                i === currentSlide
                                                    ? "bg-primary-500"
                                                    : "bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentSlide((p) => (p - 1 + announcements.length) % announcements.length)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentSlide((p) => (p + 1) % announcements.length)}
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
   ROW 2: Shift Check-In Hero Card
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
            () => { /* GPS optional */ },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, []);

    // Elapsed timer — use ref + functional setState to avoid sync setState in effect body
    const status = shift?.status ?? "NOT_CHECKED_IN";
    const startRef = useRef(Date.now());
    const baseRef = useRef(shift?.elapsedSeconds ?? 0);
    const [elapsed, setElapsed] = useState(shift?.elapsedSeconds ?? 0);

    // When base changes from server refetch, reset refs
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
            if (geo) { body.latitude = geo.lat; body.longitude = geo.lng; }
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
            if (geo) { body.latitude = geo.lat; body.longitude = geo.lng; }
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
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-primary-500/20 dark:shadow-primary-900/40 relative overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Left: shift info */}
                <div className="text-center lg:text-left flex-1 min-w-0">
                    <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-1">
                        {shift ? shift.shiftName : "No shift assigned"}
                    </p>
                    {shift ? (
                        <p className="text-primary-100 text-sm mb-2">
                            {shift.startTime} - {shift.endTime}
                            {shift.locationName && <span className="text-primary-300 ml-2">@ {shift.locationName}</span>}
                        </p>
                    ) : (
                        <p className="text-primary-300 text-sm mb-2">Contact your HR to assign a shift</p>
                    )}

                    {/* Status text */}
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold",
                        isCheckedIn && "bg-success-500/20 text-success-200",
                        isNotCheckedIn && "bg-white/10 text-primary-200",
                        isCheckedOut && "bg-primary-400/20 text-primary-200",
                        status === "NOT_LINKED" && "bg-warning-500/20 text-warning-200",
                    )}>
                        {isCheckedIn && <><CheckCircle2 size={12} /> Checked In</>}
                        {isNotCheckedIn && <><Clock size={12} /> Not Checked In</>}
                        {isCheckedOut && <><LogOut size={12} /> Checked Out</>}
                        {status === "NOT_LINKED" && <><Clock size={12} /> Not Linked</>}
                    </span>
                </div>

                {/* Center: Live clock */}
                <div className="text-center flex-shrink-0">
                    <p className="text-5xl sm:text-6xl font-mono font-bold tracking-wider tabular-nums">
                        {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                    </p>
                    <p className="text-primary-200 text-xs mt-1">
                        {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                    </p>
                </div>

                {/* Right: action */}
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    {isCheckedIn && (
                        <>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                                <Timer className="w-4 h-4 text-primary-200" />
                                <span className="text-xl font-mono font-bold tabular-nums">{formatDuration(elapsed)}</span>
                            </div>
                            <button
                                onClick={handleAction}
                                disabled={isMutating}
                                className="w-full px-8 py-3 rounded-xl font-bold text-sm bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-danger-500 hover:border-danger-400 transition-all duration-300 disabled:opacity-60"
                            >
                                {isMutating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Check Out"}
                            </button>
                        </>
                    )}

                    {isNotCheckedIn && (
                        <button
                            onClick={handleAction}
                            disabled={isMutating}
                            className="px-10 py-4 rounded-xl font-bold text-base bg-white/20 backdrop-blur-sm border-2 border-white/30 hover:bg-success-500 hover:border-success-400 hover:shadow-2xl hover:shadow-success-500/30 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60"
                        >
                            {isMutating ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center gap-2"><LogIn className="w-5 h-5" /> Check In</span>
                            )}
                        </button>
                    )}

                    {isCheckedOut && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                                <CheckCircle2 className="w-8 h-8 text-primary-200" />
                            </div>
                            <span className="text-sm font-semibold text-primary-200">Shift Complete</span>
                            {workedHrs != null && (
                                <span className="text-xs text-primary-300">{workedHrs.toFixed(1)} hrs worked</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   ROW 3: Quick Stats (4 KPI Cards)
   ================================================================ */

interface QuickStatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
    subtitle?: string;
    iconBg: string;
    iconColor: string;
}

function QuickStatCard({ icon: Icon, value, label, subtitle, iconBg, iconColor }: QuickStatCardProps) {
    return (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", iconBg)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <p className="text-2xl font-bold text-primary-950 dark:text-white tabular-nums">{value}</p>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
            {subtitle && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
    );
}

function QuickStatsRow({ data }: { data: DashboardData }) {
    const stats = data.stats;
    const hasPendingApprovals = stats.pendingApprovalsCount > 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStatCard
                icon={Calendar}
                value={stats.leaveBalanceTotal.toString()}
                label="Leave Balance"
                subtitle="Remaining days"
                iconBg="bg-primary-50 dark:bg-primary-900/20"
                iconColor="text-primary-600 dark:text-primary-400"
            />
            <QuickStatCard
                icon={Clock}
                value={`${stats.attendancePercentage}%`}
                label="Attendance"
                subtitle={`${stats.presentDays}/${stats.workingDays} days this month`}
                iconBg="bg-success-50 dark:bg-success-900/20"
                iconColor="text-success-600 dark:text-success-400"
            />
            {hasPendingApprovals ? (
                <QuickStatCard
                    icon={CheckSquare}
                    value={stats.pendingApprovalsCount.toString()}
                    label="Pending Approvals"
                    subtitle="Awaiting your action"
                    iconBg="bg-warning-50 dark:bg-warning-900/20"
                    iconColor="text-warning-600 dark:text-warning-400"
                />
            ) : (
                <QuickStatCard
                    icon={CheckSquare}
                    value="0"
                    label="Pending Approvals"
                    subtitle="All caught up"
                    iconBg="bg-neutral-100 dark:bg-neutral-800"
                    iconColor="text-neutral-400 dark:text-neutral-500"
                />
            )}
            <QuickStatCard
                icon={Target}
                value={stats.goals.activeCount.toString()}
                label="Active Goals"
                subtitle={`Avg ${stats.goals.avgCompletion}% complete`}
                iconBg="bg-accent-50 dark:bg-accent-900/20"
                iconColor="text-accent-600 dark:text-accent-400"
            />
        </div>
    );
}

/* ================================================================
   ROW 4: Quick Actions
   ================================================================ */

interface QuickAction {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    route: string;
    permission?: string;
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
    { id: "apply-leave", title: "Apply Leave", icon: Send, gradient: "from-primary-500 to-primary-600", route: "/app/company/hr/my-leave", permission: "ess:apply-leave" },
    { id: "payslips", title: "My Payslips", icon: FileText, gradient: "from-success-500 to-success-600", route: "/app/company/hr/my-payslips", permission: "ess:view-payslips" },
    { id: "attendance", title: "My Attendance", icon: Eye, gradient: "from-info-500 to-info-600", route: "/app/company/hr/my-attendance", permission: "ess:view-attendance" },
    { id: "profile", title: "My Profile", icon: UserCircle, gradient: "from-warning-500 to-warning-600", route: "/app/company/hr/my-profile", permission: "ess:view-profile" },
    { id: "team-view", title: "Team View", icon: Users, gradient: "from-accent-500 to-accent-600", route: "/app/company/hr/team-view", permission: "hr:approve" },
    { id: "approvals", title: "Approvals", icon: ClipboardCheck, gradient: "from-danger-500 to-danger-600", route: "/app/company/hr/approval-requests", permission: "hr:approve" },
    { id: "it-declaration", title: "IT Declaration", icon: Landmark, gradient: "from-primary-400 to-accent-500", route: "/app/company/hr/it-declarations", permission: "ess:it-declaration" },
    { id: "goals", title: "My Goals", icon: Target, gradient: "from-success-400 to-success-600", route: "/app/company/hr/my-goals", permission: "ess:view-goals" },
    { id: "training", title: "My Training", icon: GraduationCap, gradient: "from-info-400 to-info-600", route: "/app/company/hr/my-training", permission: "ess:enroll-training" },
];

function QuickActionsRow({ permissions }: { permissions: string[] }) {
    const navigate = useNavigate();

    const visibleActions = useMemo(() => {
        return ALL_QUICK_ACTIONS
            .filter((a) => !a.permission || checkPermission(permissions, a.permission))
            .slice(0, 6);
    }, [permissions]);

    if (visibleActions.length === 0) return null;

    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {visibleActions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.route)}
                        className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center"
                    >
                        <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-sm", action.gradient)}>
                            <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-primary-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {action.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ================================================================
   ROW 5: Leave Balance + Recent Attendance
   ================================================================ */

const LEAVE_COLORS = [
    "bg-primary-500",
    "bg-success-500",
    "bg-accent-500",
    "bg-warning-500",
    "bg-info-500",
    "bg-danger-500",
];

function LeaveBalanceBreakdown({ balances }: { balances: DashboardLeaveBalanceItem[] }) {
    if (balances.length === 0) {
        return (
            <CardShell title="Leave Balance">
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">No leave types configured.</p>
            </CardShell>
        );
    }

    return (
        <CardShell title="Leave Balance">
            <div className="space-y-4">
                {balances.map((lb, i) => {
                    const total = lb.allocated;
                    const used = lb.used;
                    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                    const color = lb.color ?? LEAVE_COLORS[i % LEAVE_COLORS.length];

                    return (
                        <div key={lb.leaveTypeName}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">{lb.leaveTypeName}</span>
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                                    {lb.remaining}/{total} days
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", color)}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardShell>
    );
}

function attendanceStatusColor(status: string): string {
    const lower = status.toLowerCase();
    if (lower === "present") return "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400 border-success-200 dark:border-success-800/50";
    if (lower === "half day") return "bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400 border-warning-200 dark:border-warning-800/50";
    if (lower === "absent") return "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400 border-danger-200 dark:border-danger-800/50";
    if (lower === "on leave" || lower === "leave") return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400 border-info-200 dark:border-info-800/50";
    if (lower === "holiday" || lower === "week off") return "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400 border-accent-200 dark:border-accent-800/50";
    return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
}

function RecentAttendanceList({ records }: { records: DashboardAttendanceDay[] }) {
    const last7 = records.slice(0, 7);

    if (last7.length === 0) {
        return (
            <CardShell title="Recent Attendance">
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">No attendance records found.</p>
            </CardShell>
        );
    }

    return (
        <CardShell title="Recent Attendance">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {last7.map((day, i) => {
                    const wh = parseWorkedHours(day.workedHours);
                    return (
                        <div key={day.date + i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 w-24 flex-shrink-0">
                                    {formatShortDate(day.date)}
                                </span>
                                <span className={cn(
                                    "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    attendanceStatusColor(day.status)
                                )}>
                                    {day.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                    {formatTimeShort(day.punchIn)}
                                </span>
                                <span className="text-xs font-semibold text-primary-950 dark:text-white tabular-nums w-12 text-right">
                                    {wh != null ? `${wh.toFixed(1)}h` : "--"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardShell>
    );
}

/* ================================================================
   ROW 6: Team Summary + Pending Approvals (Manager)
   ================================================================ */

function TeamSummaryWidget({ summary }: { summary: DashboardTeamSummary }) {
    const items = [
        { label: "Present", value: summary.present, color: "text-success-600 dark:text-success-400", bg: "bg-success-50 dark:bg-success-900/20", icon: UserCheck },
        { label: "Absent", value: summary.absent, color: "text-danger-600 dark:text-danger-400", bg: "bg-danger-50 dark:bg-danger-900/20", icon: UserX },
        { label: "On Leave", value: summary.onLeave, color: "text-info-600 dark:text-info-400", bg: "bg-info-50 dark:bg-info-900/20", icon: UserMinus },
        { label: "Not Checked In", value: summary.notCheckedIn, color: "text-neutral-500 dark:text-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-800", icon: UserCog },
    ];

    return (
        <CardShell title="Team Summary" subtitle={`${summary.total} total members`}>
            <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                    <div key={item.label} className={cn("rounded-xl p-3", item.bg)}>
                        <div className="flex items-center gap-2 mb-1">
                            <item.icon className={cn("w-4 h-4", item.color)} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{item.label}</span>
                        </div>
                        <p className={cn("text-xl font-bold tabular-nums", item.color)}>{item.value}</p>
                    </div>
                ))}
            </div>
        </CardShell>
    );
}

function PendingApprovalsWidget({ approvals }: { approvals: DashboardPendingApproval[] }) {
    const navigate = useNavigate();
    const top3 = approvals.slice(0, 3);

    return (
        <CardShell title="Pending Approvals" subtitle={`${approvals.length} total`}>
            {top3.length === 0 ? (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-2">No pending approvals.</p>
            ) : (
                <div className="space-y-3">
                    {top3.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                            <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center flex-shrink-0">
                                <ClipboardCheck className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{item.employeeName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400">
                                        {item.type}
                                    </span>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.description}</span>
                                </div>
                            </div>
                        </div>
                    ))}
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
        </CardShell>
    );
}

/* ================================================================
   ROW 7: Upcoming Holidays
   ================================================================ */

function holidayTypeBadge(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes("national") || lower === "gazetted") return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400 border-info-200 dark:border-info-800/50";
    if (lower.includes("company") || lower === "restricted") return "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 border-primary-200 dark:border-primary-800/50";
    if (lower.includes("optional")) return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
    return "bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400 border-accent-200 dark:border-accent-800/50";
}

function UpcomingHolidaysList({ holidays }: { holidays: DashboardHoliday[] }) {
    const next5 = holidays.slice(0, 5);

    if (next5.length === 0) {
        return (
            <CardShell title="Upcoming Holidays">
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4">No upcoming holidays.</p>
            </CardShell>
        );
    }

    return (
        <CardShell title="Upcoming Holidays">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {next5.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                <CalendarDays className="w-5 h-5 text-primary-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">{h.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatHolidayDate(h.date)}</p>
                            </div>
                        </div>
                        <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0", holidayTypeBadge(h.type))}>
                            {h.type}
                        </span>
                    </div>
                ))}
            </div>
        </CardShell>
    );
}

/* ================================================================
   Shared Card Shell
   ================================================================ */

function CardShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                    {subtitle && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

/* ================================================================
   Loading State
   ================================================================ */

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome row */}
            <div className="flex flex-col gap-2">
                <Skeleton width="280px" height={32} />
                <Skeleton width="200px" height={16} />
            </div>
            {/* Hero */}
            <Skeleton height={200} borderRadius={16} />
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <WidgetSkeleton key={i} height={120} />)}
            </div>
            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <WidgetSkeleton key={i} height={100} />)}
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

    const data = dashboardResponse?.data as DashboardData | undefined;

    if (isLoading || !data) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <DashboardSkeleton />
            </div>
        );
    }

    const hasTeamData = data.teamSummary !== null;
    const hasPendingApprovals = data.pendingApprovals.length > 0;
    const showManagerRow = hasTeamData || hasPendingApprovals;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ROW 1: Welcome + Announcements */}
            <WelcomeAnnouncements firstName={firstName} announcements={data.announcements} />

            {/* ROW 2: Shift Check-In Hero */}
            <ShiftCheckInHero shift={data.shift} />

            {/* ROW 3: Quick Stats */}
            <QuickStatsRow data={data} />

            {/* ROW 4: Quick Actions */}
            <QuickActionsRow permissions={permissions} />

            {/* ROW 5: Leave Balance + Recent Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeaveBalanceBreakdown balances={data.leaveBalances} />
                <RecentAttendanceList records={data.recentAttendance} />
            </div>

            {/* ROW 6: Manager Section */}
            {showManagerRow && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {hasTeamData && <TeamSummaryWidget summary={data.teamSummary!} />}
                    {hasPendingApprovals && <PendingApprovalsWidget approvals={data.pendingApprovals} />}
                    {/* If only one column has data, fill the gap */}
                    {hasTeamData && !hasPendingApprovals && <div />}
                    {!hasTeamData && hasPendingApprovals && <div />}
                </div>
            )}

            {/* ROW 7: Upcoming Holidays */}
            <UpcomingHolidaysList holidays={data.upcomingHolidays} />
        </div>
    );
}
