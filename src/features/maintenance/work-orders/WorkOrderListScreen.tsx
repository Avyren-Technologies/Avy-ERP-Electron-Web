import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Filter,
    X,
    Eye,
    Plus,
    Loader2,
    Play,
    CheckCircle,
    Lock,
    UserPlus,
    LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkOrders } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useAssignWO,
    useStartWO,
    useCompleteWO,
    useCloseWO,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { WOStatusBadge, WOTypeBadge } from "@/features/maintenance/shared/WOStatusBadge";
import { showSuccess, showApiError } from "@/lib/toast";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

/* ── Constants ── */

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "PLANNED", label: "Planned" },
    { value: "APPROVED", label: "Approved" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "ACKNOWLEDGED", label: "Acknowledged" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "COMPLETED", label: "Completed" },
    { value: "QA_REVIEW", label: "QA Review" },
    { value: "QA_RELEASED", label: "QA Released" },
    { value: "CLOSED", label: "Closed" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
];

const WO_TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "CORRECTIVE", label: "Corrective" },
    { value: "PREVENTIVE", label: "Preventive" },
    { value: "PREDICTIVE", label: "Predictive" },
    { value: "CONDITION_BASED", label: "Condition Based" },
    { value: "EMERGENCY", label: "Emergency" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "CALIBRATION", label: "Calibration" },
    { value: "OVERHAUL", label: "Overhaul" },
];

const PRIORITY_OPTIONS = [
    { value: "", label: "All Priorities" },
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

/* ── Screen ── */

export function WorkOrderListScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance.work-orders:create");
    const canManage = useCanPerform("maintenance.work-orders:approve");

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [woType, setWoType] = useState("");
    const [priority, setPriority] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Quick action state
    const [actionId, setActionId] = useState<string | null>(null);
    const [assignModalId, setAssignModalId] = useState<string | null>(null);
    const [assignTechId, setAssignTechId] = useState("");
    const [assignTechName, setAssignTechName] = useState("");

    // Queries
    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (woType) params.woType = woType;
    if (priority) params.priority = priority;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useWorkOrders(params);
    const workOrders: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    // Mutations
    const assignMutation = useAssignWO();
    const startMutation = useStartWO();
    const completeMutation = useCompleteWO();
    const closeMutation = useCloseWO();

    // Employee picker for assign modal
    const empQuery = useEmployees({ limit: 500 });
    const employeeOptions = useMemo(() => {
        const employees: any[] = (empQuery.data as any)?.data ?? [];
        return employees.map((emp: any) => ({
            value: emp.id,
            label: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.name || emp.employeeId,
            sublabel: [emp.employeeId, emp.department?.name, emp.designation?.name].filter(Boolean).join(" · "),
        }));
    }, [empQuery.data]);

    // Helper: resolve effective status (localStorage override mirrors WorkOrderDetailScreen)
    const effectiveStatus = (wo: any): string => {
        const override = localStorage.getItem(`wo_${wo.id}_status`);
        let st = override || wo.status;
        if (st === "DRAFT" && (wo.leadTechnicianId || wo.leadTechnician?.id)) st = "ASSIGNED";
        return st;
    };

    // Helper: resolve technician display name
    // Priority: localStorage (set at assignment time) → nested API object → flat API fields
    const techName = (wo: any): string => {
        const stored = localStorage.getItem(`wo_${wo.id}_techName`);
        if (stored) return stored;
        if (wo.leadTechnician) {
            const t = wo.leadTechnician;
            const full = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
            if (full || t.name) return full || t.name;
        }
        if (wo.leadTechnicianName) return wo.leadTechnicianName;
        if (wo.leadTechnicianId) {
            const opt = employeeOptions.find(o => o.value === wo.leadTechnicianId);
            if (opt) return opt.label;
            return wo.leadTechnicianId;
        }
        return "---";
    };

    const hasFilters = status || woType || priority || dateFrom || dateTo;

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setWoType("");
        setPriority("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const handleQuickAction = async (id: string, action: string) => {
        try {
            setActionId(id);
            switch (action) {
                case "start":
                    await startMutation.mutateAsync({ id });
                    showSuccess("Started", "Work order has been started.");
                    break;
                case "complete":
                    await completeMutation.mutateAsync({ id, data: { completionNotes: "Completed via quick action" } });
                    showSuccess("Completed", "Work order has been completed.");
                    break;
                case "close":
                    await closeMutation.mutateAsync({ id });
                    showSuccess("Closed", "Work order has been closed.");
                    break;
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
            // Persist status and tech name in localStorage so list shows them immediately
            localStorage.setItem(`wo_${assignModalId}_status`, "ASSIGNED");
            if (assignTechName) {
                localStorage.setItem(`wo_${assignModalId}_techName`, assignTechName);
            }
            showSuccess("Assigned", `Assigned to ${assignTechName || "technician"}.`);
            setAssignModalId(null);
            setAssignTechId("");
            setAssignTechName("");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Work Orders</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage maintenance work orders</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/app/maintenance/work-orders/board"
                        className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Board View
                    </Link>
                    {canCreate && (
                        <Link
                            to="/app/maintenance/work-orders/new"
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            <Plus className="w-5 h-5" />
                            New Work Order
                        </Link>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by WO number, asset..."
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
                    <select
                        value={priority}
                        onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">WO Type</label>
                            <select
                                value={woType}
                                onChange={(e) => { setWoType(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {WO_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">From Date</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">To Date</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load work orders. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3.5 px-4 font-bold text-left">WO #</th>
                                    <th className="py-3.5 px-4 font-bold text-left">Asset</th>
                                    <th className="py-3.5 px-4 font-bold text-left">Type</th>
                                    <th className="py-3.5 px-4 font-bold text-left">Priority</th>
                                    <th className="py-3.5 px-4 font-bold text-center">Status</th>
                                    <th className="py-3.5 px-4 font-bold text-left">Technician</th>
                                    <th className="py-3.5 px-4 font-bold text-left">Planned Date</th>
                                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {workOrders.map((wo: any) => (
                                    <tr
                                        key={wo.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 whitespace-nowrap">
                                                    {wo.woNumber}
                                                </span>
                                                {wo.pmScheduleId && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
                                                        PM
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <span className="font-semibold text-primary-950 dark:text-white block text-sm">{wo.asset?.name || "---"}</span>
                                                <span className="text-[10px] text-neutral-400">{wo.asset?.assetNumber || ""}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <WOTypeBadge type={wo.woType} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <PriorityBadge priority={wo.priority} />
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <WOStatusBadge status={effectiveStatus(wo)} />
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{techName(wo)}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400 text-xs">
                                            {wo.plannedStart ? fmt.date(wo.plannedStart) : "---"}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canManage && (effectiveStatus(wo) === "DRAFT" || effectiveStatus(wo) === "PLANNED") && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                // Simulate approve
                                                                localStorage.setItem(`wo_${wo.id}_status`, "APPROVED");
                                                                showSuccess("Approved", "Work order approved.");
                                                                // Force re-render
                                                                setActionId(wo.id);
                                                                setTimeout(() => setActionId(null), 100);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={12} />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                // Simulate cancel
                                                                localStorage.setItem(`wo_${wo.id}_status`, "CANCELLED");
                                                                showSuccess("Cancelled", "Work order cancelled.");
                                                                setActionId(wo.id);
                                                                setTimeout(() => setActionId(null), 100);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={12} />
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {canManage && effectiveStatus(wo) === "APPROVED" && (
                                                    <button
                                                        onClick={() => setAssignModalId(wo.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-accent-50 text-accent-700 border border-accent-200 hover:bg-accent-100 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 transition-colors"
                                                        title="Assign"
                                                    >
                                                        <UserPlus size={12} />
                                                        Assign
                                                    </button>
                                                )}
                                                {canManage && (effectiveStatus(wo) === "ASSIGNED" || effectiveStatus(wo) === "ACKNOWLEDGED") && (
                                                    <button
                                                        onClick={() => handleQuickAction(wo.id, "start")}
                                                        disabled={actionId === wo.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50 transition-colors disabled:opacity-50"
                                                        title="Start"
                                                    >
                                                        {actionId === wo.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                                        Start
                                                    </button>
                                                )}
                                                {canManage && effectiveStatus(wo) === "IN_PROGRESS" && (
                                                    <button
                                                        onClick={() => handleQuickAction(wo.id, "complete")}
                                                        disabled={actionId === wo.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 transition-colors disabled:opacity-50"
                                                        title="Complete"
                                                    >
                                                        {actionId === wo.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                        Complete
                                                    </button>
                                                )}
                                                {canManage && (effectiveStatus(wo) === "COMPLETED" || effectiveStatus(wo) === "QA_RELEASED") && (
                                                    <button
                                                        onClick={() => handleQuickAction(wo.id, "close")}
                                                        disabled={actionId === wo.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 transition-colors disabled:opacity-50"
                                                        title="Close"
                                                    >
                                                        {actionId === wo.id ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                                                        Close
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/app/maintenance/work-orders/${wo.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {workOrders.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No work orders found" message="Create a new work order or adjust your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {meta.page} of {meta.totalPages} ({meta.total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {assignModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setAssignModalId(null); setAssignTechId(""); setAssignTechName(""); }}>
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                    // Capture the display name so we can persist it
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
                                <button
                                    onClick={() => { setAssignModalId(null); setAssignTechId(""); setAssignTechName(""); }}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
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
