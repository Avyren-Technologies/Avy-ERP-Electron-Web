import { useState } from "react";
import { BarChart3, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyLog, useReportSummary, useOverstayReport, useVisitorAnalytics } from "@/features/company-admin/api/use-visitor-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

type TabKey = "daily" | "summary" | "overstay" | "analytics";

export function VisitorReportsScreen() {
    const fmt = useCompanyFormatter();
    const [tab, setTab] = useState<TabKey>("daily");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = fmt.parseToZoned(new Date().toISOString());
        return now.toFormat('yyyy-MM-dd');
    });

    const dailyParams = { date: selectedDate };
    const rangeParams: Record<string, unknown> = {};
    if (dateFrom) rangeParams.dateFrom = dateFrom;
    if (dateTo) rangeParams.dateTo = dateTo;

    const dailyQuery = useDailyLog(tab === "daily" ? dailyParams : undefined);
    const summaryQuery = useReportSummary(tab === "summary" ? rangeParams : undefined);
    const overstayQuery = useOverstayReport(tab === "overstay" ? rangeParams : undefined);
    const analyticsQuery = useVisitorAnalytics(tab === "analytics" ? rangeParams : undefined);

    const dailyData: any[] = dailyQuery.data?.data ?? [];
    const summaryData = summaryQuery.data?.data;
    const overstayData: any[] = overstayQuery.data?.data ?? [];
    const analyticsData = analyticsQuery.data?.data;

    const tabs: { key: TabKey; label: string; icon: any }[] = [
        { key: "daily", label: "Daily Log", icon: FileText },
        { key: "summary", label: "Summary", icon: BarChart3 },
        { key: "overstay", label: "Overstay", icon: AlertTriangle },
        { key: "analytics", label: "Analytics", icon: TrendingUp },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Visitor Reports</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Reports, analytics, and insights</p>
                </div>
            </div>

            {/* Tabs + Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all", tab === t.key ? "bg-primary-600 text-white shadow-sm" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")}
                        >
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {tab === "daily" ? (
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Date</label>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">From</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">To</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Daily Log Tab */}
            {tab === "daily" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {dailyQuery.isLoading ? <SkeletonTable rows={8} cols={7} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Visitor</th>
                                        <th className="py-4 px-6 font-bold">Company</th>
                                        <th className="py-4 px-6 font-bold">Host</th>
                                        <th className="py-4 px-6 font-bold">Check-In</th>
                                        <th className="py-4 px-6 font-bold">Check-Out</th>
                                        <th className="py-4 px-6 font-bold">Duration</th>
                                        <th className="py-4 px-6 font-bold">Gate</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {dailyData.map((v: any, i: number) => {
                                        let duration = "---";
                                        if (v.checkInTime && v.checkOutTime) {
                                            const ms = new Date(v.checkOutTime).getTime() - new Date(v.checkInTime).getTime();
                                            const mins = Math.round(ms / 60000);
                                            duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
                                        }
                                        return (
                                            <tr key={v.id || i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-3 px-6 font-bold text-primary-950 dark:text-white">{v.visitorName}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.hostName || "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInTime ? fmt.time(v.checkInTime) : "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkOutTime ? fmt.time(v.checkOutTime) : "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs font-mono">{duration}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.gateName || v.gate?.name || "---"}</td>
                                            </tr>
                                        );
                                    })}
                                    {dailyData.length === 0 && !dailyQuery.isLoading && (
                                        <tr><td colSpan={7}><EmptyState icon="list" title="No entries for this date" message="Select a different date to view the daily log." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Tab */}
            {tab === "summary" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    {summaryQuery.isLoading ? (
                        <div className="flex items-center justify-center h-32"><div className="w-7 h-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" /></div>
                    ) : summaryData ? (
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">Visit Summary</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800/50 text-center">
                                    <div className="text-2xl font-black text-primary-700 dark:text-primary-400">{summaryData.totalVisits ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Total Visits</div>
                                </div>
                                <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800/50 text-center">
                                    <div className="text-2xl font-black text-success-700 dark:text-success-400">{summaryData.completedVisits ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Completed</div>
                                </div>
                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800/50 text-center">
                                    <div className="text-2xl font-black text-warning-700 dark:text-warning-400">{summaryData.avgDuration ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Avg Duration (min)</div>
                                </div>
                                <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-200 dark:border-danger-800/50 text-center">
                                    <div className="text-2xl font-black text-danger-700 dark:text-danger-400">{summaryData.deniedEntries ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Denied Entries</div>
                                </div>
                            </div>
                            {summaryData.byType && (
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">By Visitor Type</h3>
                                    <div className="space-y-2">
                                        {Object.entries(summaryData.byType).map(([type, count]: [string, any]) => (
                                            <div key={type} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                                <span className="text-sm font-medium text-primary-950 dark:text-white">{type}</span>
                                                <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState icon="list" title="No summary data" message="Select a date range to generate the report." />
                    )}
                </div>
            )}

            {/* Overstay Tab */}
            {tab === "overstay" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {overstayQuery.isLoading ? <SkeletonTable rows={5} cols={6} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Visitor</th>
                                        <th className="py-4 px-6 font-bold">Company</th>
                                        <th className="py-4 px-6 font-bold">Host</th>
                                        <th className="py-4 px-6 font-bold">Expected Checkout</th>
                                        <th className="py-4 px-6 font-bold">Actual Checkout</th>
                                        <th className="py-4 px-6 font-bold">Overstay (min)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {overstayData.map((v: any, i: number) => (
                                        <tr key={v.id || i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-3 px-6 font-bold text-primary-950 dark:text-white">{v.visitorName}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.hostName || "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.expectedCheckout ? fmt.dateTime(v.expectedCheckout) : "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.actualCheckout ? fmt.dateTime(v.actualCheckout) : "Still on-site"}</td>
                                            <td className="py-3 px-6">
                                                <span className="text-xs font-bold text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200">{v.overstayMinutes ?? "---"}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {overstayData.length === 0 && !overstayQuery.isLoading && (
                                        <tr><td colSpan={6}><EmptyState icon="list" title="No overstay records" message="No visitors exceeded their expected visit duration." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    {analyticsQuery.isLoading ? (
                        <div className="flex items-center justify-center h-32"><div className="w-7 h-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" /></div>
                    ) : analyticsData ? (
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">Visitor Analytics</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{analyticsData.peakHour ?? "---"}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Peak Hour</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{analyticsData.avgVisitsPerDay ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Avg Visits/Day</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{analyticsData.repeatVisitorPercent ?? 0}%</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Repeat Visitors</div>
                                </div>
                            </div>
                            {analyticsData.dailyTrend && analyticsData.dailyTrend.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Daily Trend</h3>
                                    <div className="flex items-end gap-1 h-32">
                                        {analyticsData.dailyTrend.map((d: any, i: number) => {
                                            const max = Math.max(...analyticsData.dailyTrend.map((x: any) => x.count || 0), 1);
                                            const height = ((d.count || 0) / max) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="w-full bg-primary-200 dark:bg-primary-800 rounded-t" style={{ height: `${height}%`, minHeight: 2 }} title={`${d.date}: ${d.count}`} />
                                                    <span className="text-[8px] text-neutral-400 rotate-[-45deg]">{d.date?.slice(5)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState icon="list" title="No analytics data" message="Select a date range to view analytics." />
                    )}
                </div>
            )}
        </div>
    );
}
