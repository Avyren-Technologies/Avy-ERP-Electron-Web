import { useState, useEffect, useCallback, useRef } from "react";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import {
    Search,
    UserCheck,
    Clock,
    MapPin,
    Shield,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    ChevronDown,
    LogIn,
    LogOut,
    AlertTriangle,
    Briefcase,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { client } from "@/lib/api/client";
import { adminAttendanceApi, adminAttendanceKeys } from "@/lib/api/admin-attendance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showApiError } from "@/lib/toast";
import { useDepartments } from "@/features/company-admin/api/use-hr-queries";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

/* ── Types ── */

interface EmployeeSearchResult {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string | null;
    department?: { name: string } | null;
    designation?: { name: string } | null;
}

interface ShiftInfo {
    name: string;
    startTime: string;
    endTime: string;
}

interface GeofenceInfo {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
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

interface EmployeeStatus {
    status: "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT";
    record: {
        id: string;
        punchIn: string | null;
        punchOut: string | null;
        workedHours: number | string | null;
        status: string;
    } | null;
    currentShift?: ShiftInfo | null;
    resolvedPolicy?: ResolvedPolicy | null;
    location?: LocationInfo | null;
    assignedGeofence?: GeofenceInfo | null;
    employee?: {
        id: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        profilePhotoUrl?: string | null;
        department?: { name: string } | null;
        designation?: { name: string } | null;
    } | null;
}

interface TodayLogEntry {
    id: string;
    employeeCode: string;
    employeeName: string;
    action: "CHECK_IN" | "CHECK_OUT";
    timestamp: string;
    remarks?: string | null;
}

interface BulkMarkResult {
    succeeded: number;
    failed: number;
    details: Array<{ employeeId: string; employeeName: string; success: boolean; error?: string }>;
}

/* ── Helpers ── */

function isImageSrc(url: string | undefined | null): url is string {
    if (!url || typeof url !== "string") return false;
    return url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

function getInitials(firstName?: string, lastName?: string): string {
    const f = firstName?.charAt(0) ?? "";
    const l = lastName?.charAt(0) ?? "";
    return (f + l).toUpperCase() || "?";
}

/* ── Status Badge ── */

function AttendanceStatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        NOT_CHECKED_IN: { bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700", text: "text-neutral-600 dark:text-neutral-400", label: "Not Checked In" },
        CHECKED_IN: { bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50", text: "text-success-700 dark:text-success-400", label: "Checked In" },
        CHECKED_OUT: { bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50", text: "text-primary-700 dark:text-primary-400", label: "Checked Out" },
    };
    const cfg = map[status] ?? map.NOT_CHECKED_IN;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border", cfg.bg, cfg.text)}>
            {status === "CHECKED_IN" && <CheckCircle2 size={12} />}
            {status === "CHECKED_OUT" && <LogOut size={12} />}
            {status === "NOT_CHECKED_IN" && <Clock size={12} />}
            {cfg.label}
        </span>
    );
}

/* ── Policy Pill ── */

function PolicyPill({ label, active }: { label: string; active: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            active
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800/50"
                : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
        )}>
            {active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {label}
        </span>
    );
}

/* ── Main Screen ── */

export function AdminAttendanceScreen() {
    const fmt = useCompanyFormatter();
    const queryClient = useQueryClient();
    const isAdminMode = useCanPerform("hr:create");

    // Mode state
    const [bulkMode, setBulkMode] = useState(false);

    // Single mode state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [kioskSuccess, setKioskSuccess] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Bulk mode state
    const [bulkDeptFilter, setBulkDeptFilter] = useState("All");
    const [bulkPage, setBulkPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
    const [bulkRemarks, setBulkRemarks] = useState("");
    const [bulkResults, setBulkResults] = useState<BulkMarkResult | null>(null);

    // Today log state
    const [logPage, setLogPage] = useState(1);

    // GPS
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => { /* GPS optional for admin */ },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Employee search query
    const { data: searchResults, isFetching: isSearching } = useQuery({
        queryKey: ["employees", "search", debouncedSearch],
        queryFn: () => client.get("/hr/employees", { params: { search: debouncedSearch, limit: 10 } }).then(r => r.data),
        enabled: debouncedSearch.length >= 2,
    });
    const employees: EmployeeSearchResult[] = searchResults?.data ?? [];

    // Selected employee status
    const { data: empStatusData, isPending: isStatusLoading } = useQuery({
        queryKey: adminAttendanceKeys.employeeStatus(selectedEmployeeId!),
        queryFn: () => adminAttendanceApi.getEmployeeStatus(selectedEmployeeId!),
        enabled: !!selectedEmployeeId,
    });
    const empStatus: EmployeeStatus | null = empStatusData?.data ?? null;

    // Departments for bulk mode
    const departmentsQuery = useDepartments();
    const departments: Array<{ id: string; name: string }> = departmentsQuery.data?.data ?? [];

    // Bulk employee list
    const { data: bulkEmployeesData, isPending: isBulkLoading } = useQuery({
        queryKey: ["employees", "bulk-list", bulkDeptFilter, bulkPage],
        queryFn: () => client.get("/hr/employees", {
            params: {
                departmentId: bulkDeptFilter === "All" ? undefined : bulkDeptFilter,
                page: bulkPage,
                limit: 20,
                status: "active",
            }
        }).then(r => r.data),
        enabled: bulkMode,
    });
    const bulkEmployees: EmployeeSearchResult[] = bulkEmployeesData?.data ?? [];
    const bulkMeta = bulkEmployeesData?.meta;

    // Today log
    const { data: todayLogData, isPending: isLogLoading } = useQuery({
        queryKey: adminAttendanceKeys.todayLog({ page: logPage }),
        queryFn: () => adminAttendanceApi.getTodayLog({ page: logPage, limit: 10 }),
    });
    const todayLog: TodayLogEntry[] = todayLogData?.data ?? [];
    const logMeta = todayLogData?.meta;

    // Mark mutation
    const markMutation = useMutation({
        mutationFn: (data: { employeeId: string; action: "CHECK_IN" | "CHECK_OUT"; remarks?: string; latitude?: number; longitude?: number; skipValidation?: boolean }) =>
            adminAttendanceApi.mark(data),
        onSuccess: () => {
            showSuccess("Attendance marked successfully!");
            queryClient.invalidateQueries({ queryKey: adminAttendanceKeys.all });
            if (selectedEmployeeId) {
                queryClient.invalidateQueries({ queryKey: adminAttendanceKeys.employeeStatus(selectedEmployeeId) });
            }
            if (!isAdminMode) {
                // Kiosk auto-reset
                setKioskSuccess(true);
                setTimeout(() => {
                    setSelectedEmployeeId(null);
                    setSearchTerm("");
                    setRemarks("");
                    setKioskSuccess(false);
                }, 3000);
            } else {
                setRemarks("");
            }
        },
        onError: (err) => showApiError(err),
    });

    // Bulk mark mutation
    const bulkMarkMutation = useMutation({
        mutationFn: (data: { employeeIds: string[]; action: "CHECK_IN" | "CHECK_OUT"; remarks: string }) =>
            adminAttendanceApi.bulkMark(data),
        onSuccess: (res) => {
            const result = res?.data;
            setBulkResults(result ?? null);
            showSuccess(`Bulk action complete: ${result?.succeeded ?? 0} succeeded, ${result?.failed ?? 0} failed`);
            queryClient.invalidateQueries({ queryKey: adminAttendanceKeys.all });
            setSelectedIds(new Set());
            setBulkRemarks("");
        },
        onError: (err) => showApiError(err),
    });

    // Handlers
    const handleSelectEmployee = useCallback((emp: EmployeeSearchResult) => {
        setSelectedEmployeeId(emp.id);
        setSearchTerm(`${emp.firstName} ${emp.lastName} (${emp.employeeCode})`);
        setShowDropdown(false);
        setKioskSuccess(false);
    }, []);

    const handleMark = useCallback((action: "CHECK_IN" | "CHECK_OUT") => {
        if (!selectedEmployeeId) return;
        markMutation.mutate({
            employeeId: selectedEmployeeId,
            action,
            remarks: remarks || undefined,
            latitude: geo?.lat,
            longitude: geo?.lng,
            skipValidation: isAdminMode,
        });
    }, [selectedEmployeeId, remarks, geo, isAdminMode, markMutation]);

    const handleBulkExecute = useCallback(() => {
        if (selectedIds.size === 0) return;
        bulkMarkMutation.mutate({
            employeeIds: Array.from(selectedIds),
            action: bulkAction,
            remarks: bulkRemarks,
        });
    }, [selectedIds, bulkAction, bulkRemarks, bulkMarkMutation]);

    const toggleSelectAll = useCallback(() => {
        if (bulkEmployees.every(e => selectedIds.has(e.id))) {
            const next = new Set(selectedIds);
            bulkEmployees.forEach(e => next.delete(e.id));
            setSelectedIds(next);
        } else {
            const next = new Set(selectedIds);
            bulkEmployees.forEach(e => next.add(e.id));
            setSelectedIds(next);
        }
    }, [bulkEmployees, selectedIds]);

    const toggleEmployee = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Derived
    const attendanceStatus = empStatus?.status ?? "NOT_CHECKED_IN";
    const shiftInfo = empStatus?.currentShift ?? null;
    const locationInfo = empStatus?.location ?? null;
    const assignedGeofence = empStatus?.assignedGeofence ?? null;
    const resolvedPolicy = empStatus?.resolvedPolicy ?? null;
    const employeeInfo = empStatus?.employee ?? null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Mark Attendance</h1>
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                            isAdminMode
                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800/50"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
                        )}>
                            <Shield size={12} />
                            {isAdminMode ? "Admin Mode" : "Kiosk Mode"}
                        </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {fmt.date(new Date().toISOString())} — {isAdminMode ? "Mark attendance for any employee" : "Employee self-service check-in"}
                    </p>
                </div>

                {isAdminMode && (
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Bulk Mode</span>
                        <div
                            role="switch"
                            aria-checked={bulkMode}
                            onClick={() => { setBulkMode(!bulkMode); setBulkResults(null); }}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors cursor-pointer",
                                bulkMode ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-600"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                                bulkMode && "translate-x-5"
                            )} />
                        </div>
                        <Users size={18} className={cn(bulkMode ? "text-primary-600" : "text-neutral-400")} />
                    </label>
                )}
            </div>

            {/* Single Employee Mode */}
            {!bulkMode && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Search + Employee Card */}
                    <div className="space-y-6">
                        {/* Search */}
                        <div ref={searchRef} className="relative">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowDropdown(true);
                                        if (!e.target.value) {
                                            setSelectedEmployeeId(null);
                                            setKioskSuccess(false);
                                        }
                                    }}
                                    onFocus={() => debouncedSearch.length >= 2 && setShowDropdown(true)}
                                    placeholder="Search employee by name or code..."
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-primary-950 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                                />
                                {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />}
                            </div>

                            {/* Dropdown */}
                            {showDropdown && debouncedSearch.length >= 2 && (
                                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                                    {employees.length === 0 && !isSearching ? (
                                        <div className="px-4 py-6 text-center text-sm text-neutral-500">No employees found</div>
                                    ) : (
                                        employees.map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleSelectEmployee(emp)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {isImageSrc(emp.profilePhotoUrl) ? (
                                                        <img src={emp.profilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                                            {getInitials(emp.firstName, emp.lastName)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-primary-950 dark:text-white truncate">
                                                        {emp.firstName} {emp.lastName}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {emp.employeeCode}{emp.department ? ` - ${emp.department.name}` : ""}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Kiosk Success */}
                        {kioskSuccess && (
                            <div className="rounded-2xl border border-success-200 dark:border-success-800/50 bg-success-50 dark:bg-success-900/20 p-8 text-center animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 className="w-16 h-16 text-success-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-success-700 dark:text-success-400">Attendance Marked!</h3>
                                <p className="text-sm text-success-600 dark:text-success-400/80 mt-1">Resetting in 3 seconds...</p>
                            </div>
                        )}

                        {/* Employee Card */}
                        {selectedEmployeeId && !kioskSuccess && (
                            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                                {isStatusLoading ? (
                                    <div className="p-6 space-y-4">
                                        <Skeleton width="60%" height={24} />
                                        <Skeleton width="40%" height={16} />
                                        <Skeleton width="100%" height={80} />
                                    </div>
                                ) : empStatus ? (
                                    <div>
                                        {/* Employee header */}
                                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {isImageSrc(employeeInfo?.profilePhotoUrl) ? (
                                                        <img src={employeeInfo!.profilePhotoUrl!} alt="" className="w-full h-full rounded-2xl object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                                            {getInitials(employeeInfo?.firstName, employeeInfo?.lastName)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-primary-950 dark:text-white truncate">
                                                            {employeeInfo?.firstName} {employeeInfo?.lastName}
                                                        </h3>
                                                        <AttendanceStatusBadge status={attendanceStatus} />
                                                    </div>
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        {employeeInfo?.employeeCode}
                                                        {employeeInfo?.department ? ` - ${employeeInfo.department.name}` : ""}
                                                        {employeeInfo?.designation ? ` - ${employeeInfo.designation.name}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Shift info */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Shift</p>
                                                    <p className="text-sm font-semibold text-primary-950 dark:text-white">
                                                        {shiftInfo ? `${shiftInfo.name} (${fmt.shiftTime(shiftInfo.startTime)} - ${fmt.shiftTime(shiftInfo.endTime)})` : "No shift assigned"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Location info */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Location</p>
                                                    <p className="text-sm font-semibold text-primary-950 dark:text-white">
                                                        {locationInfo?.name ?? "No location assigned"}
                                                    </p>
                                                    {assignedGeofence && (
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                            Geofence: {assignedGeofence.name}
                                                        </p>
                                                    )}
                                                    {!assignedGeofence && locationInfo?.geofences && locationInfo.geofences.length > 0 && (
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                            {locationInfo.geofences.length} geofence(s) configured
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Policy pills */}
                                        {resolvedPolicy && (
                                            <div className="px-6 pb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <PolicyPill label={`Grace: ${resolvedPolicy.gracePeriodMinutes}min`} active={resolvedPolicy.gracePeriodMinutes > 0} />
                                                    <PolicyPill label="GPS Required" active={resolvedPolicy.gpsRequired} />
                                                    <PolicyPill label="Selfie Required" active={resolvedPolicy.selfieRequired} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Remarks */}
                                        <div className="px-6 pb-4">
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                                                Remarks {isAdminMode && <span className="text-danger-500">*</span>}
                                            </label>
                                            <textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder={isAdminMode ? "Remarks required for admin override..." : "Optional remarks..."}
                                                rows={2}
                                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm text-primary-950 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all"
                                            />
                                            {isAdminMode && !remarks.trim() && (
                                                <p className="text-xs text-danger-500 mt-1">Remarks are required in admin mode</p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="px-6 pb-6">
                                            {attendanceStatus === "NOT_CHECKED_IN" && (
                                                <button
                                                    onClick={() => handleMark("CHECK_IN")}
                                                    disabled={markMutation.isPending || (isAdminMode && !remarks.trim())}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all",
                                                        "bg-success-600 hover:bg-success-700 active:bg-success-800",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                                    )}
                                                >
                                                    {markMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                                    Check In
                                                </button>
                                            )}
                                            {attendanceStatus === "CHECKED_IN" && (
                                                <button
                                                    onClick={() => handleMark("CHECK_OUT")}
                                                    disabled={markMutation.isPending || (isAdminMode && !remarks.trim())}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all",
                                                        "bg-danger-600 hover:bg-danger-700 active:bg-danger-800",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                                    )}
                                                >
                                                    {markMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                                                    Check Out
                                                </button>
                                            )}
                                            {attendanceStatus === "CHECKED_OUT" && (
                                                <button
                                                    disabled
                                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Shift Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <AlertTriangle className="w-10 h-10 text-warning-500 mx-auto mb-2" />
                                        <p className="text-sm text-neutral-500">Failed to load employee status</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty state */}
                        {!selectedEmployeeId && !kioskSuccess && (
                            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 p-12 text-center">
                                <UserCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Search for an Employee</h3>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Type a name or employee code above to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Quick info or placeholder (visible on lg) */}
                    <div className="hidden lg:block">
                        {selectedEmployeeId && empStatus && !kioskSuccess && (
                            <div className="space-y-6">
                                {/* Punch record summary */}
                                {empStatus.record && (
                                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-success-600 dark:text-success-400" />
                                            </div>
                                            <h3 className="font-bold text-sm text-primary-950 dark:text-white">Today's Record</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Punch In</p>
                                                <p className="font-semibold text-primary-950 dark:text-white text-sm">
                                                    {empStatus.record.punchIn ? fmt.time(empStatus.record.punchIn) : "--:--"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-0.5">Punch Out</p>
                                                <p className="font-semibold text-primary-950 dark:text-white text-sm">
                                                    {empStatus.record.punchOut ? fmt.time(empStatus.record.punchOut) : "--:--"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk Mode */}
            {bulkMode && isAdminMode && (
                <div className="space-y-6">
                    {/* Filters + select */}
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Department filter */}
                                <div className="relative">
                                    <select
                                        value={bulkDeptFilter}
                                        onChange={(e) => { setBulkDeptFilter(e.target.value); setBulkPage(1); setSelectedIds(new Set()); }}
                                        className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                    >
                                        <option value="All">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                </div>

                                <div className="flex items-center gap-4 ml-auto">
                                    {/* Selected count */}
                                    {selectedIds.size > 0 && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
                                            <Users size={12} />
                                            {selectedIds.size} selected
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Employee list */}
                        <div className="overflow-x-auto">
                            {isBulkLoading ? (
                                <div className="p-6"><SkeletonTable rows={5} cols={4} /></div>
                            ) : bulkEmployees.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-500">No employees found</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-6 w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkEmployees.length > 0 && bulkEmployees.every(e => selectedIds.has(e.id))}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                                />
                                            </th>
                                            <th className="py-3 px-6 font-bold">Employee</th>
                                            <th className="py-3 px-6 font-bold">Code</th>
                                            <th className="py-3 px-6 font-bold">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {bulkEmployees.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                onClick={() => toggleEmployee(emp.id)}
                                                className={cn(
                                                    "border-b border-neutral-100 dark:border-neutral-800/50 cursor-pointer transition-colors",
                                                    selectedIds.has(emp.id)
                                                        ? "bg-primary-50/50 dark:bg-primary-900/10"
                                                        : "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
                                                )}
                                            >
                                                <td className="py-3 px-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(emp.id)}
                                                        onChange={() => toggleEmployee(emp.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {isImageSrc(emp.profilePhotoUrl) ? (
                                                                <img src={emp.profilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                                                    {getInitials(emp.firstName, emp.lastName)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-primary-950 dark:text-white">{emp.firstName} {emp.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">{emp.employeeCode}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-300">{emp.department?.name ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Bulk pagination */}
                        {bulkMeta && bulkMeta.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Page {bulkMeta.page} of {bulkMeta.totalPages} ({bulkMeta.total} employees)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setBulkPage(p => Math.max(1, p - 1))}
                                        disabled={bulkPage <= 1}
                                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setBulkPage(p => Math.min(bulkMeta.totalPages, p + 1))}
                                        disabled={bulkPage >= bulkMeta.totalPages}
                                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bulk Action Area */}
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6">
                        <h3 className="font-bold text-sm text-primary-950 dark:text-white mb-4">Bulk Action</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Action dropdown */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Action</label>
                                <select
                                    value={bulkAction}
                                    onChange={(e) => setBulkAction(e.target.value as "CHECK_IN" | "CHECK_OUT")}
                                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-primary-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                                >
                                    <option value="CHECK_IN">Check In</option>
                                    <option value="CHECK_OUT">Check Out</option>
                                </select>
                                <ChevronDown className="absolute right-3 bottom-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                            </div>

                            {/* Remarks */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                                    Remarks <span className="text-danger-500">*</span>
                                </label>
                                <textarea
                                    value={bulkRemarks}
                                    onChange={(e) => setBulkRemarks(e.target.value)}
                                    placeholder="Remarks for bulk action..."
                                    rows={1}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm text-primary-950 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-4">
                            <button
                                onClick={handleBulkExecute}
                                disabled={selectedIds.size === 0 || !bulkRemarks.trim() || bulkMarkMutation.isPending}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all",
                                    bulkAction === "CHECK_IN"
                                        ? "bg-success-600 hover:bg-success-700"
                                        : "bg-danger-600 hover:bg-danger-700",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {bulkMarkMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                                Execute ({selectedIds.size})
                            </button>

                            {!bulkRemarks.trim() && selectedIds.size > 0 && (
                                <p className="text-xs text-danger-500">Remarks are required for bulk actions</p>
                            )}
                        </div>
                    </div>

                    {/* Bulk Results */}
                    {bulkResults && (
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                                <h3 className="font-bold text-sm text-primary-950 dark:text-white">Results Summary</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-700 dark:text-success-400">
                                        <CheckCircle2 size={14} /> {bulkResults.succeeded} succeeded
                                    </span>
                                    {bulkResults.failed > 0 && (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger-700 dark:text-danger-400">
                                            <XCircle size={14} /> {bulkResults.failed} failed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {bulkResults.details && bulkResults.details.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                                <th className="py-3 px-6 font-bold">Employee</th>
                                                <th className="py-3 px-6 font-bold">Status</th>
                                                <th className="py-3 px-6 font-bold">Detail</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {bulkResults.details.map((d, i) => (
                                                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                    <td className="py-3 px-6 font-medium text-primary-950 dark:text-white">{d.employeeName}</td>
                                                    <td className="py-3 px-6">
                                                        {d.success ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-success-700 dark:text-success-400">
                                                                <CheckCircle2 size={12} /> Success
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-danger-700 dark:text-danger-400">
                                                                <XCircle size={12} /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-6 text-neutral-500 dark:text-neutral-400 text-xs">{d.error ?? "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Today's Activity Log */}
            <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Today's Activity Log</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Admin attendance actions</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLogLoading ? (
                        <div className="p-6"><SkeletonTable rows={5} cols={5} /></div>
                    ) : todayLog.length === 0 ? (
                        <div className="p-12 text-center">
                            <Clock className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No activity recorded today</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee Code</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Time</th>
                                    <th className="py-4 px-6 font-bold">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {todayLog.map((entry) => (
                                    <tr key={entry.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-300">{entry.employeeCode}</td>
                                        <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{entry.employeeName}</td>
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                entry.action === "CHECK_IN"
                                                    ? "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800/50"
                                                    : "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800/50"
                                            )}>
                                                {entry.action === "CHECK_IN" ? <LogIn size={10} /> : <LogOut size={10} />}
                                                {entry.action === "CHECK_IN" ? "IN" : "OUT"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-mono text-xs">{fmt.time(entry.timestamp)}</td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs max-w-[200px] truncate">{entry.remarks ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Log pagination */}
                {logMeta && logMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {logMeta.page} of {logMeta.totalPages} ({logMeta.total} entries)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                disabled={logPage <= 1}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setLogPage(p => Math.min(logMeta.totalPages, p + 1))}
                                disabled={logPage >= logMeta.totalPages}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
