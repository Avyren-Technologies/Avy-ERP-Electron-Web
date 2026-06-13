import { useState } from "react";
import { BarChart3, FileText, AlertTriangle, TrendingUp, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyLog, useReportSummary, useOverstayReport, useVisitorAnalytics } from "@/features/company-admin/api/use-visitor-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

type TabKey = "daily" | "summary" | "overstay" | "analytics";

interface CsvColumn {
    header: string;
    // Accessor returns the raw cell value; formatting/escaping is handled
    // centrally inside writeCsv so each column stays declarative.
    accessor: (row: any) => unknown;
}

// Excel/Sheets treat a leading =, +, -, @, TAB or CR as a formula. Prefix
// with a single quote to neutralise CSV-injection payloads while keeping the
// value visually identical when opened.
const FORMULA_INJECTION_CHARS = /^[=+\-@\t\r]/;

function escapeCsvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    let str: string;
    if (value instanceof Date) {
        str = value.toISOString();
    } else if (typeof value === 'object') {
        // Avoid the dreaded "[object Object]" by JSON-serialising. Most
        // accessors will pre-flatten, this is just a safety net.
        try { str = JSON.stringify(value); } catch { str = String(value); }
    } else {
        str = String(value);
    }
    if (FORMULA_INJECTION_CHARS.test(str)) str = `'${str}`;
    // Per RFC 4180: wrap in quotes, double any embedded quotes. Preserve
    // newlines (Excel handles them inside quoted fields).
    return `"${str.replace(/"/g, '""')}"`;
}

function buildCsv(rows: any[], columns: CsvColumn[]): string {
    const header = columns.map(c => escapeCsvCell(c.header)).join(',');
    const body = rows.map(row =>
        columns.map(c => escapeCsvCell(c.accessor(row))).join(',')
    );
    // RFC 4180 line endings → CRLF for max Excel compatibility.
    return [header, ...body].join('\r\n');
}

function downloadCsv(csv: string, filename: string) {
    // BOM ensures Excel auto-detects UTF-8 and renders accents/Unicode correctly.
    const BOM = '﻿';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportToCSV(rows: any[], filename: string, columns: CsvColumn[]) {
    if (!rows || rows.length === 0 || !columns || columns.length === 0) return;
    const csv = buildCsv(rows, columns);
    downloadCsv(csv, filename);
}

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
    if (dateFrom) rangeParams.fromDate = dateFrom;
    if (dateTo) rangeParams.toDate = dateTo;

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
                    <div className="ml-auto self-end">
                        <button
                            onClick={() => {
                                // Per-tab column definitions keep CSV output aligned with the
                                // on-screen table — no nested objects, no surprise columns.
                                const dailyColumns: CsvColumn[] = [
                                    { header: 'Visitor', accessor: r => r.visitorName ?? '' },
                                    { header: 'Company', accessor: r => r.visitorCompany ?? '' },
                                    { header: 'Mobile', accessor: r => r.visitorMobile ?? '' },
                                    { header: 'Visitor Type', accessor: r => r.visitorType?.name ?? '' },
                                    { header: 'Host Employee', accessor: r => r.hostEmployeeId ?? '' },
                                    { header: 'Check-In Time', accessor: r => r.checkInTime ? fmt.dateTime(r.checkInTime) : '' },
                                    { header: 'Check-In Gate', accessor: r => r.checkInGate?.name ?? '' },
                                    { header: 'Check-Out Time', accessor: r => r.checkOutTime ? fmt.dateTime(r.checkOutTime) : '' },
                                    { header: 'Check-Out Gate', accessor: r => r.checkOutGate?.name ?? '' },
                                    { header: 'Duration (min)', accessor: r => r.visitDurationMinutes ?? '' },
                                    { header: 'Status', accessor: r => r.status ?? '' },
                                    { header: 'Badge Number', accessor: r => r.badgeNumber ?? '' },
                                ];
                                const overstayColumns: CsvColumn[] = [
                                    { header: 'Visitor', accessor: r => r.visitorName ?? '' },
                                    { header: 'Company', accessor: r => r.visitorCompany ?? '' },
                                    { header: 'Visitor Type', accessor: r => r.visitorType?.name ?? '' },
                                    { header: 'Check-In Time', accessor: r => r.checkInTime ? fmt.dateTime(r.checkInTime) : '' },
                                    { header: 'Check-Out Time', accessor: r => r.checkOutTime ? fmt.dateTime(r.checkOutTime) : '' },
                                    { header: 'Expected (min)', accessor: r => r.expectedDurationMinutes ?? '' },
                                    { header: 'Actual (min)', accessor: r => r.visitDurationMinutes ?? '' },
                                    { header: 'Overstay (min)', accessor: r => (r.visitDurationMinutes ?? 0) - (r.expectedDurationMinutes ?? 0) },
                                ];
                                const summaryColumns: CsvColumn[] = [
                                    { header: 'Metric', accessor: r => r.metric ?? '' },
                                    { header: 'Value', accessor: r => r.value ?? '' },
                                ];
                                const analyticsColumns: CsvColumn[] = [
                                    { header: 'Metric', accessor: r => r.metric ?? '' },
                                    { header: 'Value', accessor: r => r.value ?? '' },
                                ];

                                // Flatten summary/analytics objects into Metric/Value rows for CSV.
                                const flattenKeyValue = (obj: any): { metric: string; value: unknown }[] => {
                                    if (!obj || typeof obj !== 'object') return [];
                                    const rows: { metric: string; value: unknown }[] = [];
                                    for (const [k, v] of Object.entries(obj)) {
                                        if (v && typeof v === 'object' && !Array.isArray(v)) {
                                            // groupBy results — emit one row per sub-entry
                                            for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
                                                rows.push({ metric: `${k}.${sk}`, value: sv as unknown });
                                            }
                                        } else if (Array.isArray(v)) {
                                            for (const item of v) {
                                                if (item && typeof item === 'object') {
                                                    const label = (item as any)._id ?? (item as any).id ?? JSON.stringify(item);
                                                    rows.push({ metric: `${k}.${label}`, value: (item as any)._count ?? (item as any).count ?? '' });
                                                } else {
                                                    rows.push({ metric: k, value: item });
                                                }
                                            }
                                        } else {
                                            rows.push({ metric: k, value: v });
                                        }
                                    }
                                    return rows;
                                };

                                if (tab === 'daily') {
                                    const rows = dailyQuery.data?.data ?? [];
                                    if (rows.length) exportToCSV(rows, `visitor-daily-log-${selectedDate}`, dailyColumns);
                                } else if (tab === 'overstay') {
                                    const rows = overstayQuery.data?.data ?? [];
                                    if (rows.length) exportToCSV(rows, `visitor-overstay-${dateFrom || 'all'}-${dateTo || 'all'}`, overstayColumns);
                                } else if (tab === 'summary') {
                                    const rows = flattenKeyValue(summaryQuery.data?.data);
                                    if (rows.length) exportToCSV(rows, `visitor-summary-${dateFrom || 'all'}-${dateTo || 'all'}`, summaryColumns);
                                } else if (tab === 'analytics') {
                                    const rows = flattenKeyValue(analyticsQuery.data?.data);
                                    if (rows.length) exportToCSV(rows, `visitor-analytics-${dateFrom || 'all'}-${dateTo || 'all'}`, analyticsColumns);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-bold transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
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
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.hostEmployeeId || "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInTime ? fmt.time(v.checkInTime) : "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkOutTime ? fmt.time(v.checkOutTime) : "---"}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs font-mono">{duration}</td>
                                                <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInGate?.name || "---"}</td>
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
                                    <div className="text-2xl font-black text-success-700 dark:text-success-400">{Math.round(summaryData.avgDurationMinutes ?? 0)}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Avg Duration (min)</div>
                                </div>
                                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800/50 text-center">
                                    <div className="text-2xl font-black text-warning-700 dark:text-warning-400">{summaryData.byMethod?.length ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Reg. Methods</div>
                                </div>
                                <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-200 dark:border-danger-800/50 text-center">
                                    <div className="text-2xl font-black text-danger-700 dark:text-danger-400">{summaryData.byStatus?.length ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Status Types</div>
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
                                        <th className="py-4 px-6 font-bold">Check-In</th>
                                        <th className="py-4 px-6 font-bold">Expected (min)</th>
                                        <th className="py-4 px-6 font-bold">Actual (min)</th>
                                        <th className="py-4 px-6 font-bold">Overstay (min)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {overstayData.map((v: any, i: number) => {
                                        const overstayMins = (v.visitDurationMinutes ?? 0) - (v.expectedDurationMinutes ?? 0);
                                        return (
                                        <tr key={v.id || i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-3 px-6 font-bold text-primary-950 dark:text-white">{v.visitorName}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.checkInTime ? fmt.time(v.checkInTime) : "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.expectedDurationMinutes ?? "---"}</td>
                                            <td className="py-3 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{v.visitDurationMinutes ?? "---"}</td>
                                            <td className="py-3 px-6">
                                                <span className="text-xs font-bold text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200">+{overstayMins}</span>
                                            </td>
                                        </tr>
                                        );
                                    })}
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
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{analyticsData.totalVisits ?? 0}</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Total Visits</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{Math.round(analyticsData.avgDurationMinutes ?? 0)} min</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Avg Duration</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-primary-950 dark:text-white">{analyticsData.preRegisteredPercent ?? 0}%</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Pre-Registered</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-danger-600 dark:text-danger-400">{analyticsData.overstayRatePercent ?? 0}%</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Overstay Rate</div>
                                </div>
                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-center">
                                    <div className="text-2xl font-black text-success-600 dark:text-success-400">{analyticsData.safetyInductionCompletionPercent ?? 0}%</div>
                                    <div className="text-xs font-bold text-neutral-500 mt-1">Induction Rate</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon="list" title="No analytics data" message="Select a date range to view analytics." />
                    )}
                </div>
            )}
        </div>
    );
}
