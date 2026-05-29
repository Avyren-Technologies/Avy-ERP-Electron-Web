import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Filter,
    X,
    List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWOBoard } from "@/features/maintenance/api/use-maintenance-queries";
import { PriorityBadge } from "@/features/maintenance/shared/PriorityBadge";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { workOrderBoardHelp } from "@/features/maintenance/help";
import { SkeletonTable } from "@/components/ui/Skeleton";

/* ── Constants ── */

const BOARD_COLUMNS = [
    { key: "DRAFT", label: "Draft", color: "border-neutral-300 dark:border-neutral-600" },
    { key: "PLANNED", label: "Planned", color: "border-blue-400 dark:border-blue-600" },
    { key: "APPROVED", label: "Approved", color: "border-primary-400 dark:border-primary-600" },
    { key: "ASSIGNED", label: "Assigned", color: "border-accent-400 dark:border-accent-600" },
    { key: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 dark:border-blue-500" },
    { key: "ON_HOLD", label: "On Hold", color: "border-warning-400 dark:border-warning-600" },
    { key: "COMPLETED", label: "Completed", color: "border-success-400 dark:border-success-600" },
];

const STATUS_BG: Record<string, string> = {
    DRAFT: "bg-neutral-100 dark:bg-neutral-800",
    PLANNED: "bg-blue-50 dark:bg-blue-950/20",
    APPROVED: "bg-primary-50 dark:bg-primary-950/20",
    ASSIGNED: "bg-accent-50 dark:bg-accent-950/20",
    IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/30",
    ON_HOLD: "bg-warning-50 dark:bg-warning-950/20",
    COMPLETED: "bg-success-50 dark:bg-success-950/20",
};

/* ── Screen ── */

export function WorkOrderBoardScreen() {
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [techFilter, setTechFilter] = useState("");

    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (techFilter) params.technicianId = techFilter;

    const { data, isLoading, isError } = useWOBoard(params);
    const boardData: any = data?.data ?? {};

    // Group WOs by status
    const columns: Record<string, any[]> = {};
    for (const col of BOARD_COLUMNS) {
        columns[col.key] = [];
    }

    if (Array.isArray(boardData)) {
        for (const wo of boardData) {
            if (columns[wo.status]) {
                columns[wo.status].push(wo);
            }
        }
    } else if (boardData && typeof boardData === "object") {
        for (const col of BOARD_COLUMNS) {
            columns[col.key] = boardData[col.key] || [];
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/app/maintenance/work-orders"
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Work Order Board</h1>
                            <HelpDrawer help={workOrderBoardHelp} />
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Kanban view of active work orders</p>
                    </div>
                </div>
                <Link
                    to="/app/maintenance/work-orders"
                    className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                    <List className="w-4 h-4" />
                    List View
                </Link>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <input
                            type="text"
                            placeholder="Search WO number, asset..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-2.5 rounded-xl border transition-colors",
                            showFilters || techFilter
                                ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <Filter size={16} />
                    </button>
                    {techFilter && (
                        <button onClick={() => setTechFilter("")} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
                {showFilters && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="max-w-xs">
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Technician ID</label>
                            <input
                                type="text"
                                placeholder="Filter by technician..."
                                value={techFilter}
                                onChange={(e) => setTechFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load board data. Please try again.
                </div>
            )}

            {/* Board */}
            {isLoading ? (
                <SkeletonTable rows={6} cols={7} />
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {BOARD_COLUMNS.map((col) => (
                        <div key={col.key} className="flex-shrink-0 w-[260px]">
                            <div className={cn("rounded-t-xl border-t-4 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 shadow-sm rounded-b-xl", col.color)}>
                                <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{col.label}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                                        {(columns[col.key] || []).length}
                                    </span>
                                </div>
                                <div className="p-3 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                                    {(columns[col.key] || []).length === 0 ? (
                                        <p className="text-xs text-neutral-400 text-center py-6">No work orders</p>
                                    ) : (
                                        (columns[col.key] || []).map((wo: any) => (
                                            <Link
                                                key={wo.id}
                                                to={`/app/maintenance/work-orders/${wo.id}`}
                                                className={cn(
                                                    "block rounded-xl p-3 border border-neutral-200/60 dark:border-neutral-700/50 hover:shadow-md transition-all cursor-pointer",
                                                    STATUS_BG[col.key] || "bg-white dark:bg-neutral-900"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                                                        {wo.woNumber}
                                                    </span>
                                                    <PriorityBadge priority={wo.priority} />
                                                </div>
                                                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                                                    {wo.asset?.name || "No asset"}
                                                </p>
                                                {wo.leadTechnicianName && (
                                                    <p className="text-[10px] text-neutral-400 mt-1 truncate">
                                                        {wo.leadTechnicianName}
                                                    </p>
                                                )}
                                                {wo.pmScheduleId && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-1 inline-block">
                                                        PM
                                                    </span>
                                                )}
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
