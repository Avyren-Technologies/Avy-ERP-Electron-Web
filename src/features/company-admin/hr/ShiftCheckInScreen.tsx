import { useState, useEffect, useCallback, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Clock,
    MapPin,
    Loader2,
    CheckCircle2,
    LogIn,
    LogOut,
    Timer,
    AlertTriangle,
    Shield,
    Briefcase,
    CalendarDays,
    Activity,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { client } from "@/lib/api/client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showApiError } from "@/lib/toast";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

/* ── Types ── */

interface AttendanceRecord {
    id: string;
    punchIn: string | null;
    punchOut: string | null;
    /** API may send a number or string (e.g. Prisma Decimal JSON). */
    workedHours: number | string | null;
    status: string;
    geoStatus: string | null;
    checkInLatitude: number | null;
    checkInLongitude: number | null;
    checkOutLatitude: number | null;
    checkOutLongitude: number | null;
    shift?: { name: string; startTime: string; endTime: string; breaks?: ShiftBreakInfo[] } | null;
    location?: { name: string } | null;
}

interface ShiftBreakInfo {
    id: string;
    name: string;
    startTime: string | null;
    duration: number;
    type: string;
    isPaid: boolean;
}

interface GeofenceInfo {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    isDefault?: boolean;
}

interface LocationInfo {
    id: string;
    name: string;
    geoEnabled?: boolean;
    geofences?: GeofenceInfo[];
}

interface ResolvedPolicy {
    gracePeriodMinutes: number;
    selfieRequired: boolean;
    gpsRequired: boolean;
    [key: string]: unknown;
}

interface RecentAttendanceRecord {
    id: string;
    date: string;
    punchIn: string | null;
    punchOut: string | null;
    workedHours: number | null;
    status: string;
    overtimeHours: number | null;
    geoStatus: string | null;
    source: string | null;
    shiftName: string | null;
}

interface StatusResponse {
    status: "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT" | "NOT_LINKED";
    record: AttendanceRecord | null;
    currentShift?: { name: string; startTime: string; endTime: string; breaks?: ShiftBreakInfo[] } | null;
    elapsedSeconds?: number;
    resolvedPolicy?: ResolvedPolicy | null;
    location?: LocationInfo | null;
    assignedGeofence?: GeofenceInfo | null;
    recentAttendance?: RecentAttendanceRecord[];
}

/* ── Helpers ── */

// formatTime and formatTimeShort now use fmt from useCompanyFormatter (passed inline)

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// formatDateShort now uses fmt from useCompanyFormatter (passed inline)

/** Backend may serialize Decimal as string; coerce before `.toFixed`. */
function parseWorkedHours(value: unknown): number | null {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = parseFloat(value.trim());
        return Number.isFinite(n) ? n : null;
    }
    if (typeof value === "object" && value !== null && "toString" in value) {
        const n = parseFloat(String(value));
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function formatWorkedHoursLabel(value: unknown, mode: "long" | "short"): string {
    const n = parseWorkedHours(value);
    if (n == null) return mode === "long" ? "--:--" : "--";
    return mode === "long" ? `${n.toFixed(1)} hrs` : `${n.toFixed(1)}h`;
}

function geolocationUserMessage(code: number): string {
    switch (code) {
        case 1:
            return "Location permission denied. Check-in can continue without GPS.";
        case 2:
            return "Could not determine position (e.g. indoors / Wi-Fi only). Check-in can continue without GPS.";
        case 3:
            return "Location request timed out. Check-in can continue without GPS.";
        default:
            return "Location unavailable. Check-in can continue without GPS.";
    }
}

/* ── Status Badge ── */

function AttendanceStatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        NOT_CHECKED_IN: { bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700", text: "text-neutral-600 dark:text-neutral-400", label: "Not Checked In" },
        CHECKED_IN: { bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50", text: "text-success-700 dark:text-success-400", label: "Checked In" },
        CHECKED_OUT: { bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50", text: "text-primary-700 dark:text-primary-400", label: "Checked Out" },
        NOT_LINKED: { bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400", label: "Not Linked" },
    };
    const cfg = map[status] ?? map.NOT_CHECKED_IN;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border", cfg.bg, cfg.text)}>
            {status === "CHECKED_IN" && <CheckCircle2 size={12} />}
            {status === "CHECKED_OUT" && <LogOut size={12} />}
            {status === "NOT_CHECKED_IN" && <Clock size={12} />}
            {status === "NOT_LINKED" && <XCircle size={12} />}
            {cfg.label}
        </span>
    );
}

/* ── Record Status Badge (for attendance record statuses like PRESENT, ABSENT, LATE, etc.) ── */

function RecordStatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string }> = {
        PRESENT: { bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50", text: "text-success-700 dark:text-success-400" },
        ABSENT: { bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400" },
        LATE: { bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400" },
        HALF_DAY: { bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50", text: "text-warning-600 dark:text-warning-400" },
        EARLY_EXIT: { bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400" },
        ON_LEAVE: { bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50", text: "text-primary-700 dark:text-primary-400" },
        HOLIDAY: { bg: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50", text: "text-accent-700 dark:text-accent-400" },
        WEEK_OFF: { bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700", text: "text-neutral-600 dark:text-neutral-400" },
        INCOMPLETE: { bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50", text: "text-danger-600 dark:text-danger-400" },
        LOP: { bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400" },
    };
    const cfg = map[status] ?? { bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700", text: "text-neutral-600 dark:text-neutral-400" };
    return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.bg, cfg.text)}>
            {status?.replace(/_/g, " ")}
        </span>
    );
}

/* ── Info Card ── */

function InfoCard({ icon: Icon, iconColor, title, children, className }: {
    icon: typeof Clock;
    iconColor: string;
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5", className)}>
            <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor)}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-primary-950 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

/* ── Main Screen ── */

export function ShiftCheckInScreen() {
    const fmt = useCompanyFormatter();
    const queryClient = useQueryClient();

    // Live clock
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // GPS
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    useEffect(() => {
        if (!navigator.geolocation) {
            const t = window.setTimeout(() => setGeoError("Geolocation not supported"), 0);
            return () => clearTimeout(t);
        }

        const onSuccess = (pos: GeolocationPosition) => {
            setGeoError(null);
            setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        };

        const optsHigh: PositionOptions = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };
        const optsLow: PositionOptions = { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 };

        navigator.geolocation.getCurrentPosition(
            onSuccess,
            (err) => {
                // POSITION_UNAVAILABLE / TIMEOUT: retry with lower accuracy (reduces CoreLocation "unknown" noise on desktop)
                if (err.code === 2 || err.code === 3) {
                    navigator.geolocation.getCurrentPosition(
                        onSuccess,
                        (e) => setGeoError(geolocationUserMessage(e.code)),
                        optsLow,
                    );
                } else {
                    setGeoError(geolocationUserMessage(err.code));
                }
            },
            optsHigh,
        );
    }, []);

    // API: status query — background polling keeps previous data visible (no skeleton flash on refetch)
    const { data: statusData, isPending } = useQuery<StatusResponse>({
        queryKey: ["attendance", "my-status"],
        queryFn: async () => {
            const res = await client.get("/hr/attendance/my-status");
            return res.data.data;
        },
        placeholderData: keepPreviousData,
        refetchInterval: 30000,
        refetchOnWindowFocus: false,
    });

    const attendanceStatus = statusData?.status ?? "NOT_CHECKED_IN";
    const record = statusData?.record ?? null;
    // Shift info: from attendance record if checked in, or from currentShift if not yet checked in
    const shiftInfo = record?.shift ?? statusData?.currentShift ?? null;

    // Live elapsed
    const [elapsed, setElapsed] = useState(statusData?.elapsedSeconds ?? 0);
    useEffect(() => {
        if (attendanceStatus !== "CHECKED_IN" || !record?.punchIn) return;
        const base = statusData?.elapsedSeconds ?? 0;
        const start = Date.now();
        const boot = window.setTimeout(() => setElapsed(base), 0);
        const id = setInterval(() => {
            setElapsed(base + Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => {
            clearTimeout(boot);
            clearInterval(id);
        };
    }, [attendanceStatus, record?.punchIn, statusData?.elapsedSeconds]);

    // Check-in mutation
    const checkInMutation = useMutation({
        mutationFn: async () => {
            const body: any = {};
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
            queryClient.invalidateQueries({ queryKey: ["ess", "dashboard"] });
        },
        onError: (err: any) => showApiError(err),
    });

    // Check-out mutation
    const checkOutMutation = useMutation({
        mutationFn: async () => {
            const body: any = {};
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
            queryClient.invalidateQueries({ queryKey: ["ess", "dashboard"] });
        },
        onError: (err: any) => showApiError(err),
    });

    const canStartNewShift = (statusData as any)?.canStartNewShift === true;
    const completedShifts = (statusData as any)?.completedShifts ?? 0;
    const isCheckIn = attendanceStatus === "NOT_CHECKED_IN" || (attendanceStatus === "CHECKED_OUT" && canStartNewShift);
    const isCheckedIn = attendanceStatus === "CHECKED_IN";
    const isDone = attendanceStatus === "CHECKED_OUT" && !canStartNewShift;
    const isMutating = checkInMutation.isPending || checkOutMutation.isPending;

    const handleAction = useCallback(() => {
        if (isDone || isMutating) return;
        if (isCheckIn) checkInMutation.mutate();
        else if (isCheckedIn) checkOutMutation.mutate();
    }, [isDone, isMutating, isCheckIn, isCheckedIn, checkInMutation, checkOutMutation]);

    // Location & geofence info — available both before and after check-in
    const locationInfo = record?.location ?? statusData?.location ?? null;
    const activeGeofence = statusData?.assignedGeofence ?? null;
    const locationGeofences = statusData?.location?.geofences ?? [];
    const hasGeofenceConfig = !!activeGeofence || locationGeofences.length > 0 || !!locationInfo;

    // Geo status display
    const geoStatusInfo = useMemo(() => {
        const s = record?.geoStatus;
        if (s === "INSIDE_GEOFENCE") return { text: "Inside geofence", color: "text-success-600 dark:text-success-400", bgColor: "bg-success-50 dark:bg-success-900/20", icon: Shield };
        if (s === "OUTSIDE_GEOFENCE") return { text: "Outside geofence", color: "text-warning-600 dark:text-warning-400", bgColor: "bg-warning-50 dark:bg-warning-900/20", icon: AlertTriangle };
        // NOT_CHECKED_IN state — show geofence info from status response
        if (activeGeofence) return { text: `Geofence: ${activeGeofence.name}`, color: "text-primary-600 dark:text-primary-400", bgColor: "bg-primary-50 dark:bg-primary-900/20", icon: Shield };
        if (locationGeofences.length > 0) return { text: `${locationGeofences.length} geofence(s) configured`, color: "text-primary-600 dark:text-primary-400", bgColor: "bg-primary-50 dark:bg-primary-900/20", icon: Shield };
        if (!hasGeofenceConfig) return { text: "No geofence configured", color: "text-neutral-500 dark:text-neutral-400", bgColor: "bg-neutral-100 dark:bg-neutral-800", icon: MapPin };
        return { text: "Geofence ready", color: "text-neutral-500 dark:text-neutral-400", bgColor: "bg-neutral-100 dark:bg-neutral-800", icon: MapPin };
    }, [record?.geoStatus, activeGeofence, locationGeofences.length, hasGeofenceConfig]);

    const GeoIcon = geoStatusInfo.icon;

    // Initial load only — background refetches keep showing the last successful data
    if (isPending) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <Skeleton width="200px" height={32} />
                    <Skeleton width="300px" height={16} style={{ marginTop: 8 }} />
                </div>
                <Skeleton height={240} borderRadius={16} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    {fmt.date(now.toISOString())}
                </p>
            </div>

            {/* Hero Status Card */}
            <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-8 text-white shadow-xl shadow-primary-500/20 dark:shadow-none relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        {/* Clock + Status */}
                        <div className="text-center lg:text-left">
                            <div className="flex items-center gap-4 justify-center lg:justify-start mb-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Live Clock</h2>
                                    <p className="text-primary-100 text-sm">Current time</p>
                                </div>
                            </div>

                            <p className="text-6xl font-mono font-bold tracking-wider tabular-nums mb-3">
                                {fmt.timeWithSeconds(now.toISOString())}
                            </p>

                            <p className="text-primary-100 text-sm mb-4">
                                {fmt.date(now.toISOString())}
                            </p>

                            <div className="inline-flex items-center gap-4">
                                <AttendanceStatusBadge status={attendanceStatus} />

                                {/* Elapsed timer for checked-in state */}
                                {isCheckedIn && (
                                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl inline-flex items-center gap-3">
                                        <Timer className="w-5 h-5 text-primary-200" />
                                        <span className="text-2xl font-mono font-bold tabular-nums">{formatDuration(elapsed)}</span>
                                        <span className="text-primary-200 text-sm">elapsed</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex flex-col items-center gap-3">
                            {isCheckIn && (
                                <div className="flex flex-col items-center gap-3">
                                    {completedShifts > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                                            <CheckCircle2 className="w-4 h-4 text-primary-200" />
                                            <span className="text-sm font-semibold text-primary-200">
                                                {completedShifts} shift{completedShifts > 1 ? "s" : ""} completed
                                            </span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleAction}
                                        disabled={isMutating}
                                        className={cn(
                                            "group relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300",
                                            "bg-white/20 backdrop-blur-sm border-4 border-white/30",
                                            "hover:bg-success-500 hover:border-success-400 hover:shadow-2xl hover:shadow-success-500/30 hover:scale-105",
                                            "active:scale-95",
                                            isMutating && "opacity-70 cursor-wait"
                                        )}
                                    >
                                        {isMutating ? (
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                        ) : (
                                            <>
                                                <LogIn className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                                <span className="text-lg font-bold">{completedShifts > 0 ? "Start New Shift" : "Check In"}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {isCheckedIn && (
                                <button
                                    onClick={handleAction}
                                    disabled={isMutating}
                                    className={cn(
                                        "group relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300",
                                        "bg-white/20 backdrop-blur-sm border-4 border-white/30",
                                        "hover:bg-danger-500 hover:border-danger-400 hover:shadow-2xl hover:shadow-danger-500/30 hover:scale-105",
                                        "active:scale-95",
                                        isMutating && "opacity-70 cursor-wait"
                                    )}
                                >
                                    {isMutating ? (
                                        <Loader2 className="w-10 h-10 animate-spin" />
                                    ) : (
                                        <>
                                            <LogOut className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                            <span className="text-lg font-bold">Check Out</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {isDone && (
                                <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-4 border-white/20">
                                    <CheckCircle2 className="w-10 h-10 text-primary-200" />
                                    <span className="text-lg font-bold text-primary-200">Shift Complete</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <InfoCard
                    icon={Briefcase}
                    iconColor="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    title="Today's Schedule"
                >
                    {shiftInfo ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Shift</p>
                                <p className="font-semibold text-primary-950 dark:text-white">{shiftInfo.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Start</p>
                                    <p className="font-semibold text-primary-950 dark:text-white text-sm">{fmt.shiftTime(shiftInfo.startTime)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">End</p>
                                    <p className="font-semibold text-primary-950 dark:text-white text-sm">{fmt.shiftTime(shiftInfo.endTime)}</p>
                                </div>
                            </div>
                            {shiftInfo.breaks && shiftInfo.breaks.length > 0 && (
                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Breaks</p>
                                    {shiftInfo.breaks.map((b) => (
                                        <div key={b.id} className="flex items-center gap-2 text-xs">
                                            <span className={cn("w-1.5 h-1.5 rounded-full", b.isPaid ? "bg-success-500" : "bg-warning-500")} />
                                            <span className="text-neutral-600 dark:text-neutral-300">
                                                {b.name}{b.startTime ? ` at ${fmt.shiftTime(b.startTime)}` : ""} — {b.duration}min{b.isPaid ? " (paid)" : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">No shift assigned</p>
                    )}
                </InfoCard>

                {/* Location & Geofence */}
                <InfoCard
                    icon={MapPin}
                    iconColor="bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400"
                    title="Location"
                >
                    <div className="space-y-3">
                        {locationInfo && (
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Office</p>
                                <p className="font-semibold text-primary-950 dark:text-white text-sm">{locationInfo.name}</p>
                            </div>
                        )}

                        {/* Geofence status */}
                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium", geoStatusInfo.bgColor, geoStatusInfo.color)}>
                            <GeoIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{geoStatusInfo.text}</span>
                        </div>

                        {/* Coordinates */}
                        {geo ? (
                            <div className="flex gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                <span>{geo.lat.toFixed(6)}</span>
                                <span>{geo.lng.toFixed(6)}</span>
                            </div>
                        ) : geoError ? (
                            <div className="flex items-center gap-2 text-xs text-warning-600 dark:text-warning-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{geoError}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Acquiring GPS...</span>
                            </div>
                        )}
                    </div>
                </InfoCard>

                {/* Work Summary */}
                <InfoCard
                    icon={Activity}
                    iconColor="bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400"
                    title="Work Summary"
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Check In</p>
                                <p className="font-semibold text-primary-950 dark:text-white text-sm">{record?.punchIn ? fmt.timeWithSeconds(record.punchIn) : "--:--"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Check Out</p>
                                <p className="font-semibold text-primary-950 dark:text-white text-sm">{record?.punchOut ? fmt.timeWithSeconds(record.punchOut) : "--:--"}</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Total Hours</p>
                            <p className="font-bold text-xl text-primary-950 dark:text-white tabular-nums">
                                {isCheckedIn
                                    ? formatDuration(elapsed)
                                    : formatWorkedHoursLabel(record?.workedHours, "long")}
                            </p>
                        </div>
                        {record?.status && (
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Status</p>
                                <span className={cn(
                                    "inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border",
                                    record.status === "Present" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                        : record.status === "Half Day" ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                                        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
                                )}>
                                    {record.status}
                                </span>
                            </div>
                        )}
                    </div>
                </InfoCard>
            </div>

            {/* Recent Attendance History */}
            <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Recent Attendance</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Last 7 days</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[480px]">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold">Date</th>
                                <th className="py-4 px-6 font-bold">Check In</th>
                                <th className="py-4 px-6 font-bold">Check Out</th>
                                <th className="py-4 px-6 font-bold text-right">Hours</th>
                                <th className="py-4 px-6 font-bold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {/* Current day always shown */}
                            <tr className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 bg-primary-50/30 dark:bg-primary-900/10">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                        <span className="font-semibold text-primary-950 dark:text-white">Today</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">{record?.punchIn ? fmt.time(record.punchIn) : "--:--"}</td>
                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">{record?.punchOut ? fmt.time(record.punchOut) : "--:--"}</td>
                                <td className="py-4 px-6 text-right font-bold text-primary-950 dark:text-white font-mono text-xs">
                                    {isCheckedIn ? formatDuration(elapsed) : formatWorkedHoursLabel(record?.workedHours, "short")}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <AttendanceStatusBadge status={attendanceStatus} />
                                </td>
                            </tr>
                            {/* Recent Days */}
                            {(statusData?.recentAttendance ?? []).map((rec) => (
                                <tr key={rec.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{fmt.date(rec.date)}</span>
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">
                                        {rec.punchIn ? fmt.time(rec.punchIn) : '--:--'}
                                    </td>
                                    <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">
                                        {rec.punchOut ? fmt.time(rec.punchOut) : '--:--'}
                                    </td>
                                    <td className="py-4 px-6 text-right text-neutral-600 dark:text-neutral-300 font-mono text-xs">
                                        {rec.workedHours != null ? `${rec.workedHours.toFixed(1)}h` : '--'}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <RecordStatusBadge status={rec.status} />
                                    </td>
                                </tr>
                            ))}
                            {(!statusData?.recentAttendance || statusData.recentAttendance.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
                                        No recent attendance records
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
