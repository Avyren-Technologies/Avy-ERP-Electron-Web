import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, X, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDowntimeList, useOEEFeed } from "@/features/maintenance/api/use-maintenance-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { downtimeHistoryHelp } from "@/features/maintenance/help";

/* ── Category Badge ── */

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    BREAKDOWN: { bg: "bg-danger-50 dark:bg-danger-900/20", text: "text-danger-700 dark:text-danger-400" },
    PLANNED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400" },
    CHANGEOVER: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400" },
    SETUP: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400" },
    IDLE: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400" },
    EXTERNAL: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400" },
};

function CategoryBadge({ category }: { category: string }) {
    const cfg = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.IDLE;
    const label = (category ?? "UNKNOWN").replace(/_/g, " ");
    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>
            {label}
        </span>
    );
}

/* ── Constants ── */

const CATEGORY_OPTIONS = [
    { value: "", label: "All Categories" },
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "PLANNED", label: "Planned" },
    { value: "CHANGEOVER", label: "Changeover" },
    { value: "SETUP", label: "Setup" },
    { value: "IDLE", label: "Idle" },
    { value: "EXTERNAL", label: "External" },
];

/* ── Screen ── */

export function DowntimeHistoryScreen() {
    const fmt = useCompanyFormatter();

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [activeTab, setActiveTab] = useState<"history" | "oee">("history");

    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const { data, isLoading, isError } = useDowntimeList(params);
    const records: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};

    const { data: oeeData, isLoading: oeeLoading } = useOEEFeed();
    const oeeRecords: any[] = oeeData?.data ?? [];

    const hasFilters = category || dateFrom || dateTo;

    const clearFilters = () => {
        setSearch("");
        setCategory("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const formatDuration = (minutes: number | string | null) => {
        if (!minutes) return "---";
        const m = Number(minutes);
        if (isNaN(m)) return String(minutes);
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Downtime History</h1>
                    <HelpDrawer help={downtimeHistoryHelp} />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track all asset downtime events and OEE metrics</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "history"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                    )}
                >
                    <Clock size={14} className="inline mr-1.5" />
                    Downtime Log
                </button>
                <button
                    onClick={() => setActiveTab("oee")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        activeTab === "oee"
                            ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700"
                    )}
                >
                    <Activity size={14} className="inline mr-1.5" />
                    OEE Feed
                </button>
            </div>

            {activeTab === "history" && (
                <>
                    {/* Toolbar */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                                <input
                                    type="text"
                                    placeholder="Search by asset..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <select
                                value={category}
                                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
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
                            Failed to load downtime records.
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {isLoading ? (
                            <SkeletonTable rows={8} cols={8} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Asset</th>
                                            <th className="py-4 px-6 font-bold">Start</th>
                                            <th className="py-4 px-6 font-bold">End</th>
                                            <th className="py-4 px-6 font-bold">Duration</th>
                                            <th className="py-4 px-6 font-bold">Category</th>
                                            <th className="py-4 px-6 font-bold">Root Cause</th>
                                            <th className="py-4 px-6 font-bold">WO Link</th>
                                            <th className="py-4 px-6 font-bold">Prod. Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {records.map((r: any) => (
                                            <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className="font-bold text-primary-950 dark:text-white">{r.asset?.name ?? "---"}</span>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{r.startTime ? fmt.dateTime(r.startTime) : "---"}</td>
                                                <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{r.endTime ? fmt.dateTime(r.endTime) : <span className="text-danger-500 font-bold">Ongoing</span>}</td>
                                                <td className="py-4 px-6 text-xs font-bold text-neutral-700 dark:text-neutral-300">{formatDuration(r.durationMinutes)}</td>
                                                <td className="py-4 px-6"><CategoryBadge category={r.category ?? "IDLE"} /></td>
                                                <td className="py-4 px-6 text-xs text-neutral-500 max-w-[150px] truncate">{r.rootCause ?? "---"}</td>
                                                <td className="py-4 px-6">
                                                    {r.workOrderId ? (
                                                        <Link to={`/app/maintenance/work-orders/${r.workOrderId}`} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                                            {r.workOrder?.woNumber ?? "View WO"}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">---</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{r.productionLoss ?? "---"}</td>
                                            </tr>
                                        ))}
                                        {records.length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={8}>
                                                    <EmptyState icon="list" title="No downtime records" message="No downtime events recorded yet." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {meta.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Previous</button>
                                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* OEE Feed Tab */}
            {activeTab === "oee" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {oeeLoading ? (
                        <SkeletonTable rows={5} cols={4} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Asset</th>
                                        <th className="py-4 px-6 font-bold text-center">Availability %</th>
                                        <th className="py-4 px-6 font-bold text-center">Total Downtime</th>
                                        <th className="py-4 px-6 font-bold text-center">Events</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {oeeRecords.map((r: any, idx: number) => {
                                        const avail = Number(r.availabilityPct ?? 0);
                                        const barColor = avail >= 90 ? "bg-success-500" : avail >= 70 ? "bg-warning-500" : "bg-danger-500";
                                        return (
                                            <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{r.assetName ?? "---"}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                            <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(100, avail)}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 w-12 text-right">{avail.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center text-xs text-neutral-600 dark:text-neutral-400">{formatDuration(r.totalDowntimeMinutes)}</td>
                                                <td className="py-4 px-6 text-center text-xs font-bold text-neutral-700 dark:text-neutral-300">{r.eventCount ?? 0}</td>
                                            </tr>
                                        );
                                    })}
                                    {oeeRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={4}>
                                                <EmptyState icon="list" title="No OEE data" message="OEE metrics will appear once downtime events are recorded." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
