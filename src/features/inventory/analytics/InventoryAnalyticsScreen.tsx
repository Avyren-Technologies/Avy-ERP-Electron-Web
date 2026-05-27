import { useState, useMemo } from 'react';
import { Loader2, TrendingUp, TrendingDown, BarChart3, Activity, Target, Clock, AlertTriangle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentKpis, useDailyAnalytics, useKpiSnapshots, useTrendData, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

const selectClass = 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none';

/* ── KPI Card ── */

function KpiCard({ label, value, unit, trend, trendLabel, color }: {
    label: string; value: string | number; unit?: string; trend?: number; trendLabel?: string; color: string;
}) {
    const isPositive = (trend ?? 0) >= 0;
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
            <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
                {unit && <span className="text-sm text-neutral-400 mb-1">{unit}</span>}
            </div>
            {trend !== undefined && (
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
                    {trendLabel && <span className="text-neutral-400 ml-1">{trendLabel}</span>}
                </div>
            )}
            <div className={cn('h-1 rounded-full mt-3', color)} />
        </div>
    );
}

/* ── Horizontal Bar ── */

function HorizontalBar({ label, value, max, color, suffix }: {
    label: string; value: number; max: number; color: string; suffix?: string;
}) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-700 dark:text-neutral-300 w-36 truncate">{label}</span>
            <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white w-24 text-right">
                {typeof value === 'number' ? value.toLocaleString() : value}{suffix || ''}
            </span>
        </div>
    );
}

/* ── Main Screen ── */

export function InventoryAnalyticsScreen() {
    const fmt = useCompanyFormatter();
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
    const [warehouseId, setWarehouseId] = useState('');

    const params = useMemo(() => ({
        dateFrom, dateTo, ...(warehouseId ? { warehouseId } : {}),
    }), [dateFrom, dateTo, warehouseId]);

    const { data: kpiData, isLoading: kpiLoading } = useCurrentKpis();
    const { data: dailyData, isLoading: dailyLoading } = useDailyAnalytics(params);
    const { data: snapshotsData } = useKpiSnapshots(params);
    const { data: trendDataRes } = useTrendData(params);
    const { data: whData } = useWarehouses();

    const kpis = kpiData?.data;
    const daily = dailyData?.data || [];
    const snapshots = snapshotsData?.data || [];
    const trends = trendDataRes?.data;
    const warehouses = whData?.data || [];

    const isLoading = kpiLoading || dailyLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    // Trend data for charts
    const receiptTrend = trends?.receiptVsDispatch || [];
    const maxReceipt = Math.max(...receiptTrend.map((d: any) => Math.max(d.receipts || 0, d.dispatches || 0)), 1);

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory Analytics</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">KPI trends and performance metrics</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <input type="date" className={selectClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span className="text-xs text-neutral-400">to</span>
                    <input type="date" className={selectClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <select className={selectClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                        <option value="">All Warehouses</option>
                        {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Inventory Turnover"
                    value={Number(kpis?.inventoryTurnover ?? 0).toFixed(2)}
                    trend={kpis?.turnoverTrend}
                    trendLabel="vs last period"
                    color="bg-indigo-500"
                />
                <KpiCard
                    label="Fill Rate"
                    value={Number(kpis?.fillRate ?? 0).toFixed(1)}
                    unit="%"
                    trend={kpis?.fillRateTrend}
                    trendLabel="vs last period"
                    color="bg-emerald-500"
                />
                <KpiCard
                    label="Stock Accuracy"
                    value={Number(kpis?.stockAccuracy ?? 0).toFixed(1)}
                    unit="%"
                    trend={kpis?.accuracyTrend}
                    trendLabel="vs last period"
                    color="bg-violet-500"
                />
                <KpiCard
                    label="Receipt Turnaround"
                    value={Number(kpis?.receiptTurnaround ?? 0).toFixed(1)}
                    unit="hrs"
                    trend={kpis?.turnaroundTrend}
                    trendLabel="vs last period"
                    color="bg-amber-500"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receipt vs Dispatch Trend */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Receipt vs Dispatch Trend</h3>
                    <div className="space-y-3">
                        {receiptTrend.length === 0 && <p className="text-sm text-neutral-400">No trend data available</p>}
                        {receiptTrend.slice(-8).map((d: any, i: number) => (
                            <div key={i} className="space-y-1">
                                <p className="text-xs text-neutral-500">{d.date ? fmt.date(d.date) : `Period ${i + 1}`}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-emerald-600 w-14">Receipts</span>
                                    <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(d.receipts / maxReceipt) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-medium w-10 text-right">{d.receipts}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-blue-600 w-14">Dispatch</span>
                                    <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.dispatches / maxReceipt) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-medium w-10 text-right">{d.dispatches}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Value by Warehouse */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Stock Value by Warehouse</h3>
                    <div className="space-y-3">
                        {(trends?.stockValueByWarehouse || []).length === 0 && <p className="text-sm text-neutral-400">No data available</p>}
                        {(trends?.stockValueByWarehouse || []).map((w: any, i: number) => {
                            const maxVal = Math.max(...(trends?.stockValueByWarehouse || []).map((x: any) => Number(x.totalValue) || 0), 1);
                            return (
                                <HorizontalBar
                                    key={i}
                                    label={w.warehouseName || w.name || `WH ${i + 1}`}
                                    value={Number(w.totalValue) || 0}
                                    max={maxVal}
                                    color="bg-indigo-500"
                                    suffix=""
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Adjustment Rate Trend */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Adjustment Rate Trend</h3>
                    <div className="space-y-2">
                        {(trends?.adjustmentRate || []).length === 0 && <p className="text-sm text-neutral-400">No trend data available</p>}
                        {(trends?.adjustmentRate || []).slice(-8).map((d: any, i: number) => (
                            <HorizontalBar
                                key={i}
                                label={d.date ? fmt.date(d.date) : `Period ${i + 1}`}
                                value={Number(d.rate) || 0}
                                max={100}
                                color={Number(d.rate) > 5 ? 'bg-red-500' : Number(d.rate) > 2 ? 'bg-amber-500' : 'bg-emerald-500'}
                                suffix="%"
                            />
                        ))}
                    </div>
                </div>

                {/* Near-Expiry Items Over Time */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Near-Expiry Items</h3>
                    <div className="space-y-2">
                        {(trends?.nearExpiry || []).length === 0 && <p className="text-sm text-neutral-400">No trend data available</p>}
                        {(trends?.nearExpiry || []).slice(-8).map((d: any, i: number) => {
                            const maxExp = Math.max(...(trends?.nearExpiry || []).map((x: any) => Number(x.count) || 0), 1);
                            return (
                                <HorizontalBar
                                    key={i}
                                    label={d.date ? fmt.date(d.date) : `Period ${i + 1}`}
                                    value={Number(d.count) || 0}
                                    max={maxExp}
                                    color="bg-orange-500"
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Monthly KPI Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Monthly KPI Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Month</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Turnover</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Fill Rate</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Accuracy</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Turnaround (hrs)</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Adj. Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {snapshots.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-400">No monthly data available</td></tr>
                            )}
                            {snapshots.map((s: any, i: number) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">{s.month || s.period}</td>
                                    <td className="px-5 py-3 text-right text-neutral-700 dark:text-neutral-300">{Number(s.inventoryTurnover ?? 0).toFixed(2)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={cn('font-medium', Number(s.fillRate) >= 95 ? 'text-emerald-600' : Number(s.fillRate) >= 80 ? 'text-amber-600' : 'text-red-600')}>
                                            {Number(s.fillRate ?? 0).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={cn('font-medium', Number(s.stockAccuracy) >= 98 ? 'text-emerald-600' : Number(s.stockAccuracy) >= 90 ? 'text-amber-600' : 'text-red-600')}>
                                            {Number(s.stockAccuracy ?? 0).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-neutral-700 dark:text-neutral-300">{Number(s.receiptTurnaround ?? 0).toFixed(1)}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={cn('font-medium', Number(s.adjustmentRate) <= 2 ? 'text-emerald-600' : Number(s.adjustmentRate) <= 5 ? 'text-amber-600' : 'text-red-600')}>
                                            {Number(s.adjustmentRate ?? 0).toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
