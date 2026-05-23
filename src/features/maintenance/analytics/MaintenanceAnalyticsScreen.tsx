import { useState } from "react";
import { TrendingUp, DollarSign, BarChart3, Activity, RefreshCw, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useAvailabilityTrend,
    useCostAnalytics,
    usePlannedVsUnplanned,
    useReliabilityMetrics,
} from "@/features/maintenance/api/use-maintenance-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Tabs ── */

const TABS = [
    { key: "availability", label: "Availability", icon: TrendingUp },
    { key: "cost", label: "Cost Analysis", icon: DollarSign },
    { key: "planned-vs-unplanned", label: "Planned vs Unplanned", icon: BarChart3 },
    { key: "mtbf-mttr", label: "MTBF / MTTR", icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── Trend Indicator ── */

function TrendIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
    if (value > 0) return <span className="inline-flex items-center gap-0.5 text-xs font-bold text-success-600 dark:text-success-400"><ArrowUp className="w-3 h-3" />+{value.toFixed(1)}{suffix}</span>;
    if (value < 0) return <span className="inline-flex items-center gap-0.5 text-xs font-bold text-danger-600 dark:text-danger-400"><ArrowDown className="w-3 h-3" />{value.toFixed(1)}{suffix}</span>;
    return <span className="inline-flex items-center gap-0.5 text-xs font-bold text-neutral-400"><Minus className="w-3 h-3" />0{suffix}</span>;
}

/* ── Progress Bar ── */

function ProgressBar({ value, max = 100, color = "primary" }: { value: number; max?: number; color?: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const colorMap: Record<string, string> = {
        primary: "bg-primary-500",
        success: "bg-success-500",
        warning: "bg-warning-500",
        danger: "bg-danger-500",
        info: "bg-info-500",
    };
    return (
        <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", colorMap[color] ?? colorMap.primary)} style={{ width: `${Math.max(pct, 1)}%` }} />
        </div>
    );
}

/* ── Availability Tab ── */

function AvailabilityTab() {
    const { data, isLoading } = useAvailabilityTrend();
    const items: any[] = data?.data ?? [];

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (items.length === 0) return <EmptyState icon="list" title="No availability data" message="Availability data will appear once assets have downtime records." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        <th className="py-3 px-6 font-bold">Period</th>
                        <th className="py-3 px-6 font-bold">Avg Availability %</th>
                        <th className="py-3 px-6 font-bold">Trend</th>
                        <th className="py-3 px-6 font-bold">Uptime Hours</th>
                        <th className="py-3 px-6 font-bold">Downtime Hours</th>
                        <th className="py-3 px-6 font-bold w-48">Bar</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.period ?? `Month ${idx + 1}`}</td>
                            <td className="py-3 px-6 font-bold text-primary-700 dark:text-primary-400">{Number(item.availability ?? 0).toFixed(1)}%</td>
                            <td className="py-3 px-6"><TrendIndicator value={Number(item.trend ?? 0)} /></td>
                            <td className="py-3 px-6 text-success-700 dark:text-success-400">{Number(item.uptimeHours ?? 0).toLocaleString()}</td>
                            <td className="py-3 px-6 text-danger-700 dark:text-danger-400">{Number(item.downtimeHours ?? 0).toLocaleString()}</td>
                            <td className="py-3 px-6"><ProgressBar value={Number(item.availability ?? 0)} color={Number(item.availability ?? 0) >= 90 ? "success" : Number(item.availability ?? 0) >= 70 ? "warning" : "danger"} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Cost Tab ── */

function CostTab() {
    const { data, isLoading } = useCostAnalytics();
    const items: any[] = data?.data ?? [];

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (items.length === 0) return <EmptyState icon="list" title="No cost data" message="Cost data will appear once work orders with costs are recorded." />;

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Cost", value: items.reduce((s: number, i: any) => s + Number(i.totalCost ?? 0), 0), color: "primary" },
                    { label: "Parts Cost", value: items.reduce((s: number, i: any) => s + Number(i.partsCost ?? 0), 0), color: "info" },
                    { label: "Labour Cost", value: items.reduce((s: number, i: any) => s + Number(i.labourCost ?? 0), 0), color: "success" },
                    { label: "Vendor Cost", value: items.reduce((s: number, i: any) => s + Number(i.vendorCost ?? 0), 0), color: "warning" },
                ].map((c) => (
                    <div key={c.label} className={cn("rounded-xl border p-4", `bg-${c.color}-50 dark:bg-${c.color}-900/20 border-${c.color}-200 dark:border-${c.color}-800/50`)}>
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{c.label}</div>
                        <div className={cn("text-xl font-black mt-1", `text-${c.color}-700 dark:text-${c.color}-400`)}>${c.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {/* Detail table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                            <th className="py-3 px-6 font-bold">Asset Class</th>
                            <th className="py-3 px-6 font-bold text-right">Parts</th>
                            <th className="py-3 px-6 font-bold text-right">Labour</th>
                            <th className="py-3 px-6 font-bold text-right">Vendor</th>
                            <th className="py-3 px-6 font-bold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.assetClass ?? item.category ?? "Uncategorized"}</td>
                                <td className="py-3 px-6 text-right">${Number(item.partsCost ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-6 text-right">${Number(item.labourCost ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-6 text-right">${Number(item.vendorCost ?? 0).toLocaleString()}</td>
                                <td className="py-3 px-6 text-right font-bold text-primary-700 dark:text-primary-400">${Number(item.totalCost ?? 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Planned vs Unplanned Tab ── */

function PlannedVsUnplannedTab() {
    const { data, isLoading } = usePlannedVsUnplanned();
    const items: any[] = data?.data ?? [];

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (items.length === 0) return <EmptyState icon="list" title="No work order data" message="Data will appear once PM and breakdown work orders are logged." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        <th className="py-3 px-6 font-bold">Period</th>
                        <th className="py-3 px-6 font-bold text-center">Planned (PM)</th>
                        <th className="py-3 px-6 font-bold text-center">Unplanned (BD)</th>
                        <th className="py-3 px-6 font-bold text-center">Total</th>
                        <th className="py-3 px-6 font-bold text-center">Planned %</th>
                        <th className="py-3 px-6 font-bold w-48">Ratio</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item: any, idx: number) => {
                        const planned = Number(item.plannedCount ?? 0);
                        const unplanned = Number(item.unplannedCount ?? 0);
                        const total = planned + unplanned;
                        const pct = total > 0 ? (planned / total) * 100 : 0;
                        return (
                            <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.period ?? `Month ${idx + 1}`}</td>
                                <td className="py-3 px-6 text-center text-success-700 dark:text-success-400 font-bold">{planned}</td>
                                <td className="py-3 px-6 text-center text-danger-700 dark:text-danger-400 font-bold">{unplanned}</td>
                                <td className="py-3 px-6 text-center font-bold">{total}</td>
                                <td className="py-3 px-6 text-center font-bold">{pct.toFixed(0)}%</td>
                                <td className="py-3 px-6">
                                    <div className="flex h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-success-500 h-full transition-all" style={{ width: `${pct}%` }} />
                                        <div className="bg-danger-400 h-full transition-all" style={{ width: `${100 - pct}%` }} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ── MTBF/MTTR Tab ── */

function MTBFMTTRTab() {
    const { data, isLoading } = useReliabilityMetrics();
    const items: any[] = data?.data ?? [];

    if (isLoading) return <SkeletonTable rows={6} cols={6} />;
    if (items.length === 0) return <EmptyState icon="list" title="No reliability data" message="Reliability metrics will appear once breakdown and repair records are available." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        <th className="py-3 px-6 font-bold">Asset</th>
                        <th className="py-3 px-6 font-bold">Class</th>
                        <th className="py-3 px-6 font-bold text-right">MTBF (hrs)</th>
                        <th className="py-3 px-6 font-bold text-right">MTTR (hrs)</th>
                        <th className="py-3 px-6 font-bold text-right">Availability %</th>
                        <th className="py-3 px-6 font-bold text-right">Failures</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.assetName ?? "Unknown"}</td>
                            <td className="py-3 px-6 text-xs text-neutral-500 dark:text-neutral-400">{item.assetClass ?? "-"}</td>
                            <td className="py-3 px-6 text-right font-bold text-success-700 dark:text-success-400">{Number(item.mtbf ?? 0).toFixed(1)}</td>
                            <td className="py-3 px-6 text-right font-bold text-warning-700 dark:text-warning-400">{Number(item.mttr ?? 0).toFixed(1)}</td>
                            <td className="py-3 px-6 text-right">
                                <span className={cn("font-bold", Number(item.availability ?? 0) >= 90 ? "text-success-700 dark:text-success-400" : Number(item.availability ?? 0) >= 70 ? "text-warning-700 dark:text-warning-400" : "text-danger-700 dark:text-danger-400")}>
                                    {Number(item.availability ?? 0).toFixed(1)}%
                                </span>
                            </td>
                            <td className="py-3 px-6 text-right text-danger-700 dark:text-danger-400 font-bold">{item.failureCount ?? 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Main Screen ── */

export function MaintenanceAnalyticsScreen() {
    const [activeTab, setActiveTab] = useState<TabKey>("availability");

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Maintenance Analytics
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Asset performance, cost trends, and reliability insights
                    </p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === tab.key
                                    ? "bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm"
                                    : "text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-300",
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {activeTab === "availability" && <AvailabilityTab />}
                {activeTab === "cost" && <CostTab />}
                {activeTab === "planned-vs-unplanned" && <PlannedVsUnplannedTab />}
                {activeTab === "mtbf-mttr" && <MTBFMTTRTab />}
            </div>
        </div>
    );
}
