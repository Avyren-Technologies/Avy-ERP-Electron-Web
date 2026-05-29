import { useMemo, useState } from "react";
import { TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import {
    useAvailabilityTrend,
    useCostAnalytics,
    usePlannedVsUnplanned,
} from "@/features/maintenance/api/use-maintenance-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { analyticsHelp } from "@/features/maintenance/help";

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? value : [];
}

const COST_TYPE_LABELS: Record<string, string> = {
    LABOUR: "Labour",
    SPARE_PART: "Parts",
    VENDOR_SERVICE: "Vendor Service",
    OVERHEAD: "Overhead",
    CONTRACTOR: "Contractor",
    WARRANTY_RECOVERY: "Warranty Recovery",
    AMC_RECOVERY: "AMC Recovery",
};

/* ── Tabs ── */

const TABS = [
    { key: "availability", label: "Availability", icon: TrendingUp },
    { key: "cost", label: "Cost Analysis", icon: DollarSign },
    { key: "planned-vs-unplanned", label: "Planned vs Unplanned", icon: BarChart3 },
    { key: "mtbf-mttr", label: "MTBF / MTTR", icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
    const snapshots = asArray<any>(data?.data);

    const items = useMemo(() => {
        const byMonth = new Map<string, { period: string; availability: number; mtbf: number; mttr: number; count: number }>();
        for (const s of snapshots) {
            const dateKey = s.date ? DateTime.fromISO(String(s.date)).toFormat("yyyy-MM") : "unknown";
            const availability = Number(s.availabilityPct ?? s.availability ?? 0);
            const existing = byMonth.get(dateKey) ?? { period: dateKey, availability: 0, mtbf: 0, mttr: 0, count: 0 };
            existing.availability += availability;
            existing.mtbf += Number(s.mtbfHours ?? s.mtbf ?? 0);
            existing.mttr += Number(s.mttrHours ?? s.mttr ?? 0);
            existing.count += 1;
            byMonth.set(dateKey, existing);
        }
        return Array.from(byMonth.values()).map((row) => ({
            period: row.period === "unknown" ? "Unknown" : DateTime.fromFormat(row.period, "yyyy-MM").toFormat("MMM yyyy"),
            availability: row.count > 0 ? row.availability / row.count : 0,
            mtbf: row.count > 0 ? row.mtbf / row.count : 0,
            mttr: row.count > 0 ? row.mttr / row.count : 0,
        }));
    }, [snapshots]);

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (items.length === 0) return <EmptyState icon="list" title="No availability data" message="Availability data will appear once KPI snapshots are recorded." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        <th className="py-3 px-6 font-bold">Period</th>
                        <th className="py-3 px-6 font-bold">Avg Availability %</th>
                        <th className="py-3 px-6 font-bold text-right">Avg MTBF (hrs)</th>
                        <th className="py-3 px-6 font-bold text-right">Avg MTTR (hrs)</th>
                        <th className="py-3 px-6 font-bold w-48">Bar</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.period}</td>
                            <td className="py-3 px-6 font-bold text-primary-700 dark:text-primary-400">{item.availability.toFixed(1)}%</td>
                            <td className="py-3 px-6 text-right text-success-700 dark:text-success-400">{item.mtbf.toFixed(1)}</td>
                            <td className="py-3 px-6 text-right text-warning-700 dark:text-warning-400">{item.mttr.toFixed(1)}</td>
                            <td className="py-3 px-6"><ProgressBar value={item.availability} color={item.availability >= 90 ? "success" : item.availability >= 70 ? "warning" : "danger"} /></td>
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
    const payload = data?.data;
    const byType = asArray<any>(payload && typeof payload === "object" && "byType" in payload ? payload.byType : payload);
    const byAsset = asArray<any>(payload && typeof payload === "object" && "byAsset" in payload ? payload.byAsset : []);

    const sumTypes = (types: string[]) =>
        byType.filter((t) => types.includes(t.transactionType)).reduce((s, t) => s + Number(t.totalCost ?? 0), 0);

    const totalCost = byType.reduce((s, t) => s + Number(t.totalCost ?? 0), 0);
    const partsCost = sumTypes(["SPARE_PART"]);
    const labourCost = sumTypes(["LABOUR"]);
    const vendorCost = sumTypes(["VENDOR_SERVICE", "CONTRACTOR"]);

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (byType.length === 0 && byAsset.length === 0) {
        return <EmptyState icon="list" title="No cost data" message="Cost data will appear once maintenance cost transactions are recorded." />;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Total Cost</div>
                    <div className="text-xl font-black mt-1 text-primary-700 dark:text-primary-400">${totalCost.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border p-4 bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Parts Cost</div>
                    <div className="text-xl font-black mt-1 text-info-700 dark:text-info-400">${partsCost.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border p-4 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Labour Cost</div>
                    <div className="text-xl font-black mt-1 text-success-700 dark:text-success-400">${labourCost.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border p-4 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Vendor Cost</div>
                    <div className="text-xl font-black mt-1 text-warning-700 dark:text-warning-400">${vendorCost.toLocaleString()}</div>
                </div>
            </div>

            {byType.length > 0 && (
                <div className="overflow-x-auto">
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 pt-2 pb-3">By transaction type</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-3 px-6 font-bold">Type</th>
                                <th className="py-3 px-6 font-bold text-right">Count</th>
                                <th className="py-3 px-6 font-bold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {byType.map((item, idx) => (
                                <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">
                                        {COST_TYPE_LABELS[item.transactionType] ?? item.transactionType ?? "Other"}
                                    </td>
                                    <td className="py-3 px-6 text-right">{Number(item.count ?? 0).toLocaleString()}</td>
                                    <td className="py-3 px-6 text-right font-bold text-primary-700 dark:text-primary-400">${Number(item.totalCost ?? 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {byAsset.length > 0 && (
                <div className="overflow-x-auto">
                    <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-6 pt-2 pb-3">Top assets by cost</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-3 px-6 font-bold">Asset</th>
                                <th className="py-3 px-6 font-bold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {byAsset.map((item, idx) => (
                                <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.assetName ?? item.assetId ?? "Unknown"}</td>
                                    <td className="py-3 px-6 text-right font-bold text-primary-700 dark:text-primary-400">${Number(item.totalCost ?? 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ── Planned vs Unplanned Tab ── */

function PlannedVsUnplannedTab() {
    const { data, isLoading } = usePlannedVsUnplanned();
    const summary = data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : null;

    if (isLoading) return <SkeletonTable rows={6} cols={5} />;
    if (!summary) return <EmptyState icon="list" title="No work order data" message="Data will appear once PM and breakdown work orders are logged." />;

    const planned = Number(summary.planned ?? summary.plannedCount ?? 0);
    const unplanned = Number(summary.unplanned ?? summary.unplannedCount ?? 0);
    const total = Number(summary.total ?? planned + unplanned);
    const pct = total > 0 ? (planned / total) * 100 : Number(summary.plannedPct ?? 0);

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-success-200 dark:border-success-800/50 bg-success-50 dark:bg-success-900/20 p-4 text-center">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Planned (PM)</div>
                    <div className="text-2xl font-black text-success-700 dark:text-success-400 mt-1">{planned}</div>
                </div>
                <div className="rounded-xl border border-danger-200 dark:border-danger-800/50 bg-danger-50 dark:bg-danger-900/20 p-4 text-center">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Unplanned (BD)</div>
                    <div className="text-2xl font-black text-danger-700 dark:text-danger-400 mt-1">{unplanned}</div>
                </div>
                <div className="rounded-xl border border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-900/20 p-4 text-center">
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Planned %</div>
                    <div className="text-2xl font-black text-primary-700 dark:text-primary-400 mt-1">{pct.toFixed(0)}%</div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                    <span>Planned</span>
                    <span>Unplanned</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-success-500 h-full transition-all" style={{ width: `${pct}%` }} />
                    <div className="bg-danger-400 h-full transition-all" style={{ width: `${100 - pct}%` }} />
                </div>
                <p className="text-xs text-neutral-400 mt-2 text-center">{total} work orders in selected period</p>
            </div>
        </div>
    );
}

/* ── MTBF/MTTR Tab ── */

function MTBFMTTRTab() {
    const { data, isLoading } = useAvailabilityTrend();
    const snapshots = asArray<any>(data?.data);

    const items = useMemo(() => {
        const byAsset = new Map<string, any>();
        for (const s of snapshots) {
            const key = s.assetId ?? "unknown";
            byAsset.set(key, s);
        }
        return Array.from(byAsset.values()).map((s) => ({
            assetId: s.assetId,
            assetName: s.assetName ?? s.assetId ?? "Unknown",
            mtbf: Number(s.mtbfHours ?? s.mtbf ?? 0),
            mttr: Number(s.mttrHours ?? s.mttr ?? 0),
            availability: Number(s.availabilityPct ?? s.availability ?? 0),
            failureRate: Number(s.failureRate ?? s.failureCount ?? 0),
        }));
    }, [snapshots]);

    if (isLoading) return <SkeletonTable rows={6} cols={6} />;
    if (items.length === 0) return <EmptyState icon="list" title="No reliability data" message="Reliability metrics will appear once KPI snapshots are recorded per asset." />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        <th className="py-3 px-6 font-bold">Asset</th>
                        <th className="py-3 px-6 font-bold text-right">MTBF (hrs)</th>
                        <th className="py-3 px-6 font-bold text-right">MTTR (hrs)</th>
                        <th className="py-3 px-6 font-bold text-right">Availability %</th>
                        <th className="py-3 px-6 font-bold text-right">Failure rate</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item, idx) => (
                        <tr key={item.assetId ?? idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.assetName}</td>
                            <td className="py-3 px-6 text-right font-bold text-success-700 dark:text-success-400">{item.mtbf.toFixed(1)}</td>
                            <td className="py-3 px-6 text-right font-bold text-warning-700 dark:text-warning-400">{item.mttr.toFixed(1)}</td>
                            <td className="py-3 px-6 text-right">
                                <span className={cn("font-bold", item.availability >= 90 ? "text-success-700 dark:text-success-400" : item.availability >= 70 ? "text-warning-700 dark:text-warning-400" : "text-danger-700 dark:text-danger-400")}>
                                    {item.availability.toFixed(1)}%
                                </span>
                            </td>
                            <td className="py-3 px-6 text-right text-danger-700 dark:text-danger-400 font-bold">{item.failureRate.toFixed(2)}</td>
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
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                            Maintenance Analytics
                        </h1>
                        <HelpDrawer help={analyticsHelp} />
                    </div>
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
