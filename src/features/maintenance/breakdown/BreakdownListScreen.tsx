import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Filter,
    X,
    Plus,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Clock,
    RotateCcw,
    Eye,
    UserPlus,
    Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreakdowns, useRecurringFailures, useActionCodes } from "@/features/maintenance/api/use-maintenance-queries";
import { useResolveBreakdown, useAssignWO, useAcknowledgeWO, useStartWO } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { showSuccess, showApiError } from "@/lib/toast";
import { breakdownListHelp } from "@/features/maintenance/help";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

/* ── Status badge ── */

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    OPEN: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400", label: "Open" },
    DRAFT: { bg: "bg-neutral-50 dark:bg-neutral-850", text: "text-neutral-600 dark:text-neutral-400", label: "Draft" },
    APPROVED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", label: "Approved" },
    ASSIGNED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Assigned" },
    ACKNOWLEDGED: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", label: "Acknowledged" },
    IN_PROGRESS: { bg: "bg-warning-50 dark:bg-warning-900/20", text: "text-warning-700 dark:text-warning-400", label: "In Progress" },
    RESOLVED: { bg: "bg-success-50 dark:bg-success-900/20", text: "text-success-700 dark:text-success-400", label: "Resolved" },
    CLOSED: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", label: "Closed" },
};

function BreakdownStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.OPEN;
    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>
            {cfg.label}
        </span>
    );
}

/* ── Live timer ── */

function LiveDowntimeTimer({ startedAt }: { startedAt: string }) {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        const start = new Date(startedAt).getTime();
        const tick = () => {
            const diff = Date.now() - start;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setElapsed(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400 text-[10px] font-bold animate-pulse">
            <Clock size={10} />
            {elapsed}
        </span>
    );
}

function getDowntimeDuration(bd: any): string {
    const start = bd.downtimeStart || bd.reportedAt || bd.createdAt;
    const end = bd.downtimeEnd || bd.actualEnd || bd.closedAt;
    if (!start || !end) return "---";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return "0s";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
}

function formatDowntimeMs(ms: number): string {
    if (!ms || ms <= 0) return "---";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
}

/* ── Constants ── */

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "OPEN", label: "Open" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
];

/* ── Screen ── */

export function BreakdownListScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const canCreate = useCanPerform("maintenance.work-orders:create");
    const canManage = useCanPerform("maintenance.work-orders:approve");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [activeTab, setActiveTab] = useState<"list" | "recurring">("list");

    const [resolveId, setResolveId] = useState<string | null>(null);
    const [actionDescription, setActionDescription] = useState("");
    const [actionTaken, setActionTaken] = useState("");
    const [rootCause, setRootCause] = useState("");

    const [actionId, setActionId] = useState<string | null>(null);
    const [assignModalId, setAssignModalId] = useState<string | null>(null);
    const [assignTechId, setAssignTechId] = useState("");
    const [assignTechName, setAssignTechName] = useState("");

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useBreakdowns(params);
    const breakdowns: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const { data: recurringData, isLoading: recurringLoading } = useRecurringFailures();
    const recurringFailures: any[] = recurringData?.data ?? [];

    const { data: closedRes } = useBreakdowns({ status: "CLOSED", limit: 200 });
    const closedBreakdowns = useMemo(() => {
        const raw = closedRes?.data ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [closedRes]);

    const enrichedRecurringFailures = useMemo(() => {
        return recurringFailures.map((rf: any) => {
            const matches = closedBreakdowns.filter(
                (bd: any) =>
                    bd.assetId === rf.assetId &&
                    (bd.rootCauseCode === rf.rootCauseCode || bd.rootCause === rf.rootCauseCode)
            );

            let lastOccurred: string | null = null;
            let totalDowntimeMs = 0;

            for (const bd of matches) {
                const dateVal = bd.closedAt || bd.actualEnd || bd.createdAt;
                if (dateVal && (!lastOccurred || new Date(dateVal) > new Date(lastOccurred))) {
                    lastOccurred = dateVal;
                }

                const start = bd.downtimeStart || bd.reportedAt || bd.createdAt;
                const end = bd.downtimeEnd || bd.actualEnd || bd.closedAt;
                if (start && end) {
                    const diff = new Date(end).getTime() - new Date(start).getTime();
                    if (diff > 0) {
                        totalDowntimeMs += diff;
                    }
                }
            }

            return {
                ...rf,
                lastOccurred: lastOccurred || rf.lastOccurred || null,
                totalDowntimeMs: totalDowntimeMs || 0,
            };
        });
    }, [recurringFailures, closedBreakdowns]);

    const { data: actionCodesData } = useActionCodes();
    const actionCodes: any[] = actionCodesData?.data ?? [];

    const resolveMutation = useResolveBreakdown();
    const assignMutation = useAssignWO();
    const acknowledgeMutation = useAcknowledgeWO();
    const startMutation = useStartWO();

    const empQuery = useEmployees({ limit: 500 });
    const employeeOptions = useMemo(() => {
        const employees: any[] = (empQuery.data as any)?.data ?? [];
        return employees.map((emp: any) => ({
            value: emp.id,
            label: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || emp.employeeId,
            sublabel: [emp.employeeId, emp.department?.name, emp.designation?.name].filter(Boolean).join(" · "),
        }));
    }, [empQuery.data]);

    const resolveTechName = (bd: any): string => {
        const leadTech = bd.leadTechnician ?? bd.workOrder?.leadTechnician;
        if (leadTech) {
            const full = `${leadTech.firstName ?? ""} ${leadTech.lastName ?? ""}`.trim();
            if (full || leadTech.name) return full || leadTech.name;
        }
        const name = bd.leadTechnicianName ?? bd.workOrder?.leadTechnicianName ?? bd.assignedTechnicianName;
        if (name) return name;
        const id = bd.leadTechnicianId ?? bd.workOrder?.leadTechnicianId;
        if (id) {
            const opt = employeeOptions.find(o => o.value === id);
            if (opt) return opt.label;
            return id;
        }
        return "---";
    };

    const hasFilters = status || priority || dateFrom || dateTo;

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const handleQuickAction = async (id: string, action: string) => {
        try {
            setActionId(id);
            if (action === "acknowledge") {
                await acknowledgeMutation.mutateAsync({ id });
                showSuccess("Acknowledged", "Breakdown has been acknowledged.");
            } else if (action === "start") {
                await startMutation.mutateAsync({ id });
                showSuccess("Started", "Breakdown work has started.");
            }
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleAssign = async () => {
        if (!assignModalId || !assignTechId.trim()) return;
        try {
            await assignMutation.mutateAsync({ id: assignModalId, data: { leadTechnicianId: assignTechId } });
            showSuccess("Assigned", `Assigned to ${assignTechName || "technician"}.`);
            setAssignModalId(null);
            setAssignTechId("");
            setAssignTechName("");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleResolve = async () => {
        if (!resolveId) return;
        try {
            await resolveMutation.mutateAsync({
                id: resolveId,
                data: {
                    rootCauseCode: rootCause,
                    actionTakenCode: actionTaken,
                    actionDescription: actionDescription,
                }
            });
            showSuccess("Resolved", "Breakdown has been resolved.");
            setResolveId(null);
            setActionDescription("");
            setActionTaken("");
            setRootCause("");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Breakdowns</h1>
                        <HelpDrawer help={breakdownListHelp} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track and resolve equipment breakdowns</p>
                </div>
                {canCreate && (
                    <Link
                        to="/app/maintenance/breakdowns/log"
                        className="inline-flex items-center gap-2 bg-danger-600 hover:bg-danger-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-danger-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Log Breakdown
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("list")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "list"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                    )}
                >
                    <AlertTriangle size={14} className="inline mr-1.5" />
                    Active Breakdowns
                </button>
                <button
                    onClick={() => setActiveTab("recurring")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "recurring"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                    )}
                >
                    <RotateCcw size={14} className="inline mr-1.5" />
                    Recurring Failures
                </button>
            </div>

            {activeTab === "list" && (
                <>
                    {/* Toolbar */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search breakdowns..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "p-2.5 rounded-xl border transition-colors",
                                    showFilters || hasFilters
                                        ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                )}
                            >
                                <Filter size={16} />
                            </button>
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1">
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="EMERGENCY">Emergency</option>
                                        <option value="HIGH">High</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LOW">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">From Date</label>
                                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Date</label>
                                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                        )}
                    </div>

                    {isError && (
                        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                            Failed to load breakdowns. Please try again.
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {isLoading ? (
                            <SkeletonTable rows={8} cols={8} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1100px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">WO #</th>
                                            <th className="py-4 px-6 font-bold">Asset</th>
                                            <th className="py-4 px-6 font-bold">Priority</th>
                                            <th className="py-4 px-6 font-bold text-center">Status</th>
                                            <th className="py-4 px-6 font-bold">Downtime</th>
                                            <th className="py-4 px-6 font-bold">Root Cause</th>
                                            <th className="py-4 px-6 font-bold">Technician</th>
                                            <th className="py-4 px-6 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {breakdowns.map((bd: any) => (
                                            <tr
                                                key={bd.id}
                                                className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                                        {bd.workOrder?.woNumber ?? bd.woNumber ?? "---"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white block">{bd.asset?.name ?? "---"}</span>
                                                        <span className="text-[10px] text-neutral-400">{bd.asset?.assetNumber ?? ""}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <PriorityBadge priority={bd.priority ?? "EMERGENCY"} />
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <BreakdownStatusBadge status={bd.status ?? "OPEN"} />
                                                </td>
                                                <td className="py-4 px-6">
                                                    {(bd.status === "OPEN" || bd.status === "IN_PROGRESS" || bd.status === "ASSIGNED") && bd.reportedAt ? (
                                                        <LiveDowntimeTimer startedAt={bd.reportedAt} />
                                                    ) : (
                                                        <span className="text-xs text-neutral-500">{getDowntimeDuration(bd)}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs max-w-[150px] truncate">
                                                    {bd.rootCauseCode ?? bd.rootCause ?? "---"}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                                    {resolveTechName(bd)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canManage && (
                                                            <>
                                                                {(bd.status === "OPEN" || bd.status === "DRAFT" || bd.status === "APPROVED") && (
                                                                    <button
                                                                        onClick={() => setAssignModalId(bd.workOrder?.id ?? bd.id)}
                                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-accent-50 text-accent-700 border border-accent-200 hover:bg-accent-100 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 transition-colors"
                                                                        title="Assign Technician"
                                                                    >
                                                                        <UserPlus size={12} />
                                                                        Assign
                                                                    </button>
                                                                )}
                                                                {bd.status === "ASSIGNED" && (
                                                                    <button
                                                                        onClick={() => handleQuickAction(bd.workOrder?.id ?? bd.id, "acknowledge")}
                                                                        disabled={actionId === (bd.workOrder?.id ?? bd.id)}
                                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800/50 transition-colors disabled:opacity-50"
                                                                        title="Acknowledge Assignment"
                                                                    >
                                                                        {actionId === (bd.workOrder?.id ?? bd.id) ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle size={12} />
                                                                        )}
                                                                        Acknowledge
                                                                    </button>
                                                                )}
                                                                {bd.status === "ACKNOWLEDGED" && (
                                                                    <button
                                                                        onClick={() => handleQuickAction(bd.workOrder?.id ?? bd.id, "start")}
                                                                        disabled={actionId === (bd.workOrder?.id ?? bd.id)}
                                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 transition-colors disabled:opacity-50"
                                                                        title="Start Job"
                                                                    >
                                                                        {actionId === (bd.workOrder?.id ?? bd.id) ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <Play size={12} />
                                                                        )}
                                                                        Start
                                                                    </button>
                                                                )}
                                                                {bd.status === "IN_PROGRESS" && (
                                                                    <button
                                                                        onClick={() => setResolveId(bd.id)}
                                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 transition-colors"
                                                                        title="Resolve Breakdown"
                                                                    >
                                                                        <CheckCircle size={12} />
                                                                        Resolve
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {bd.workOrder?.id && (
                                                            <Link
                                                                to={`/app/maintenance/work-orders/${bd.workOrder.id}`}
                                                                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                                title="View WO"
                                                            >
                                                                <Eye size={15} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {breakdowns.length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={8}>
                                                    <EmptyState icon="list" title="No breakdowns found" message="No active breakdowns. Log a new breakdown when one occurs." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {meta.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                                </span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Previous</button>
                                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Recurring Failures Tab */}
            {activeTab === "recurring" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {recurringLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Asset</th>
                                        <th className="py-4 px-6 font-bold">Failure Mode</th>
                                        <th className="py-4 px-6 font-bold text-center">Count</th>
                                        <th className="py-4 px-6 font-bold">Total Downtime</th>
                                        <th className="py-4 px-6 font-bold">Last Occurred</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {enrichedRecurringFailures.map((rf: any, idx: number) => (
                                        <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white block">{rf.asset?.name ?? "---"}</span>
                                                    <span className="text-[10px] text-neutral-400">{rf.asset?.assetNumber ?? ""}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{rf.rootCauseCode ?? "---"}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
                                                    {rf.count ?? 0}x
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                                {formatDowntimeMs(rf.totalDowntimeMs)}
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{rf.lastOccurred ? fmt.date(rf.lastOccurred) : "---"}</td>
                                        </tr>
                                    ))}
                                    {enrichedRecurringFailures.length === 0 && (
                                        <tr>
                                            <td colSpan={5}>
                                                <EmptyState icon="list" title="No recurring failures" message="No assets with repeated breakdown patterns detected." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Resolve Modal */}
            {resolveId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setResolveId(null); setActionDescription(""); setActionTaken(""); setRootCause(""); }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Resolve Breakdown</h3>
                            <button onClick={() => { setResolveId(null); setActionDescription(""); setActionTaken(""); setRootCause(""); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Root Cause Code <span className="text-red-500">*</span></label>
                                <select
                                    value={rootCause}
                                    onChange={(e) => setRootCause(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select root cause...</option>
                                    {actionCodes.map((ac) => (
                                        <option key={ac.id} value={ac.code ?? ac.name}>
                                            {ac.code ?? ac.name} - {ac.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Action Code <span className="text-red-500">*</span></label>
                                <select
                                    value={actionTaken}
                                    onChange={(e) => setActionTaken(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select action code...</option>
                                    {actionCodes.map((ac) => (
                                        <option key={ac.id} value={ac.code ?? ac.name}>
                                            {ac.code ?? ac.name} - {ac.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">Action Description (Notes) <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={actionDescription}
                                    onChange={(e) => setActionDescription(e.target.value)}
                                    placeholder="Describe the action taken to resolve the issue..."
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setResolveId(null); setActionDescription(""); setActionTaken(""); setRootCause(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                <button
                                    onClick={handleResolve}
                                    disabled={resolveMutation.isPending || !rootCause || !actionTaken || !actionDescription.trim()}
                                    className="px-6 py-2 text-sm font-bold rounded-xl bg-success-600 text-white hover:bg-success-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {resolveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {assignModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setAssignModalId(null); setAssignTechId(""); setAssignTechName(""); }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Assign Work Order</h3>
                            <button onClick={() => { setAssignModalId(null); setAssignTechId(""); setAssignTechName(""); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <SearchableSelect
                                label="Lead Technician"
                                required
                                value={assignTechId}
                                onChange={(v) => {
                                    setAssignTechId(v);
                                    const opt = employeeOptions.find(o => o.value === v);
                                    setAssignTechName(opt?.label ?? "");
                                }}
                                options={employeeOptions}
                                placeholder="Search by name, ID or department..."
                                isLoading={empQuery.isLoading}
                            />
                            {assignTechId && (() => {
                                const sel = employeeOptions.find(o => o.value === assignTechId);
                                return sel ? <p className="text-xs text-neutral-400">{sel.sublabel}</p> : null;
                            })()}
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setAssignModalId(null); setAssignTechId(""); setAssignTechName(""); }} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                <button
                                    onClick={handleAssign}
                                    disabled={assignMutation.isPending || !assignTechId.trim()}
                                    className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
