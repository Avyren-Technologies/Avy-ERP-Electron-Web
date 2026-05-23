import { useState, useMemo } from "react";
import { Activity, Filter, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReliabilityMetrics } from "@/features/maintenance/api/use-maintenance-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";

/* ── Summary Stat ── */

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
    const colorClasses: Record<string, { bg: string; text: string }> = {
        primary: { bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50", text: "text-primary-700 dark:text-primary-400" },
        success: { bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50", text: "text-success-700 dark:text-success-400" },
        warning: { bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400" },
        danger: { bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400" },
        info: { bg: "bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50", text: "text-info-700 dark:text-info-400" },
    };
    const c = colorClasses[color] ?? colorClasses.primary;

    return (
        <div className={cn("rounded-2xl border p-5", c.bg)}>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</div>
            <div className={cn("text-2xl font-black mt-1", c.text)}>{value}</div>
        </div>
    );
}

/* ── Filter Chip ── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                active
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-400",
            )}
        >
            {label}
        </button>
    );
}

/* ── Main Screen ── */

export function ReliabilityDashboardScreen() {
    const fmt = useCompanyFormatter();
    const [criticality, setCriticality] = useState<string>("ALL");
    const [assetClass, setAssetClass] = useState<string>("ALL");

    const { data, isLoading, refetch } = useReliabilityMetrics({ criticality: criticality !== "ALL" ? criticality : undefined, assetClass: assetClass !== "ALL" ? assetClass : undefined });
    const items: any[] = data?.data ?? [];

    // Compute summary stats
    const summary = useMemo(() => {
        if (items.length === 0) return { avgMTBF: "0.0", avgMTTR: "0.0", avgAvailability: "0.0", replacementCount: 0 };
        const avgMTBF = items.reduce((s: number, i: any) => s + Number(i.mtbf ?? 0), 0) / items.length;
        const avgMTTR = items.reduce((s: number, i: any) => s + Number(i.mttr ?? 0), 0) / items.length;
        const avgAvailability = items.reduce((s: number, i: any) => s + Number(i.availability ?? 0), 0) / items.length;
        const replacementCount = items.filter((i: any) => i.flaggedForReplacement).length;
        return { avgMTBF: avgMTBF.toFixed(1), avgMTTR: avgMTTR.toFixed(1), avgAvailability: avgAvailability.toFixed(1), replacementCount };
    }, [items]);

    // Unique asset classes for filter
    const assetClasses = useMemo(() => {
        const set = new Set<string>();
        for (const item of items) {
            if (item.assetClass) set.add(item.assetClass);
        }
        return ["ALL", ...Array.from(set).sort()];
    }, [items]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Reliability Dashboard
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Per-asset MTBF, MTTR, availability, and replacement flags
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="self-start p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
                    title="Refresh"
                >
                    <Activity size={16} />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryStat label="Avg MTBF (hrs)" value={summary.avgMTBF} color="success" />
                <SummaryStat label="Avg MTTR (hrs)" value={summary.avgMTTR} color="warning" />
                <SummaryStat label="Avg Availability" value={`${summary.avgAvailability}%`} color="primary" />
                <SummaryStat label="Flagged for Replacement" value={String(summary.replacementCount)} color={summary.replacementCount > 0 ? "danger" : "info"} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    <Filter className="w-3.5 h-3.5" /> Criticality:
                </div>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((c) => (
                    <FilterChip key={c} label={c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()} active={criticality === c} onClick={() => setCriticality(c)} />
                ))}
                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    Asset Class:
                </div>
                {assetClasses.slice(0, 6).map((c) => (
                    <FilterChip key={c} label={c === "ALL" ? "All" : c} active={assetClass === c} onClick={() => setAssetClass(c)} />
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={7} />
                ) : items.length === 0 ? (
                    <EmptyState icon="list" title="No reliability data" message="Asset reliability metrics will appear once breakdown and repair data is available." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-6 font-bold">Asset</th>
                                    <th className="py-3 px-6 font-bold">Class</th>
                                    <th className="py-3 px-6 font-bold">Criticality</th>
                                    <th className="py-3 px-6 font-bold text-right">MTBF (hrs)</th>
                                    <th className="py-3 px-6 font-bold text-right">MTTR (hrs)</th>
                                    <th className="py-3 px-6 font-bold text-right">Availability %</th>
                                    <th className="py-3 px-6 font-bold text-right">Failures</th>
                                    <th className="py-3 px-6 font-bold">Last Failure</th>
                                    <th className="py-3 px-6 font-bold text-center">Replace?</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {items.map((item: any, idx: number) => {
                                    const flagged = item.flaggedForReplacement;
                                    return (
                                        <tr
                                            key={idx}
                                            className={cn(
                                                "border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 transition-colors",
                                                flagged ? "bg-danger-50/50 dark:bg-danger-900/10 hover:bg-danger-50 dark:hover:bg-danger-900/20" : "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50",
                                            )}
                                        >
                                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white">{item.assetName ?? "Unknown"}</td>
                                            <td className="py-3 px-6 text-xs text-neutral-500 dark:text-neutral-400">{item.assetClass ?? "-"}</td>
                                            <td className="py-3 px-6">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
                                                    item.criticality === "CRITICAL" ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" :
                                                    item.criticality === "HIGH" ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" :
                                                    item.criticality === "MEDIUM" ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50" :
                                                    "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
                                                )}>
                                                    {(item.criticality ?? "N/A").toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-right font-bold text-success-700 dark:text-success-400">{Number(item.mtbf ?? 0).toFixed(1)}</td>
                                            <td className="py-3 px-6 text-right font-bold text-warning-700 dark:text-warning-400">{Number(item.mttr ?? 0).toFixed(1)}</td>
                                            <td className="py-3 px-6 text-right">
                                                <span className={cn("font-bold", Number(item.availability ?? 0) >= 90 ? "text-success-700 dark:text-success-400" : Number(item.availability ?? 0) >= 70 ? "text-warning-700 dark:text-warning-400" : "text-danger-700 dark:text-danger-400")}>
                                                    {Number(item.availability ?? 0).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-right text-danger-700 dark:text-danger-400 font-bold">{item.failureCount ?? 0}</td>
                                            <td className="py-3 px-6 text-xs text-neutral-500 dark:text-neutral-400">{item.lastFailure ? fmt.date(item.lastFailure) : "-"}</td>
                                            <td className="py-3 px-6 text-center">
                                                {flagged ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200 dark:border-danger-800/50">
                                                        <AlertTriangle className="w-3 h-3" /> Replace
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
