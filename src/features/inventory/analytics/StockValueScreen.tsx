import { Loader2, Warehouse, AlertTriangle, Ban, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockValueByWarehouse } from '@/features/inventory/api/use-inventory-queries';

/* ── Summary Card ── */

function SummaryCard({ icon: Icon, label, value, color }: {
    icon: typeof Warehouse; label: string; value: number; color: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                        {value.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </p>
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );
}

/* ── Main Screen ── */

export function StockValueScreen() {
    const { data, isLoading } = useStockValueByWarehouse();
    const result = data?.data;
    const summary = result?.summary || {};
    const warehouses = result?.warehouses || [];

    const maxValue = Math.max(...warehouses.map((w: any) => Number(w.totalValue) || 0), 1);
    const grandTotal = Number(summary.totalInventoryValue) || warehouses.reduce((sum: number, w: any) => sum + (Number(w.totalValue) || 0), 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Stock Value Analysis</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Inventory value breakdown by warehouse</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Warehouse} label="Total Inventory Value" value={Number(summary.totalInventoryValue) || grandTotal} color="bg-indigo-600" />
                <SummaryCard icon={Ban} label="Blocked Stock Value" value={Number(summary.blockedStockValue) || 0} color="bg-red-600" />
                <SummaryCard icon={AlertTriangle} label="Expired Stock Value" value={Number(summary.expiredStockValue) || 0} color="bg-amber-600" />
                <SummaryCard icon={Cog} label="WIP Value" value={Number(summary.wipValue) || 0} color="bg-violet-600" />
            </div>

            {/* Value Distribution */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Value Distribution</h3>
                <div className="space-y-3">
                    {warehouses.length === 0 && <p className="text-sm text-neutral-400">No warehouse data available</p>}
                    {warehouses.map((w: any, i: number) => {
                        const val = Number(w.totalValue) || 0;
                        const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm text-neutral-700 dark:text-neutral-300 w-40 truncate">{w.name || w.warehouseName || `Warehouse ${i + 1}`}</span>
                                <div className="flex-1 h-7 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((val / maxValue) * 100, 100)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-200">
                                        {pct.toFixed(1)}%
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-neutral-900 dark:text-white w-28 text-right">
                                    {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">By Warehouse</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Warehouse</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Total Value</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Blocked Value</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Expired Value</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {warehouses.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No data available</td></tr>
                            )}
                            {warehouses.map((w: any, i: number) => {
                                const val = Number(w.totalValue) || 0;
                                const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
                                return (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">{w.name || w.warehouseName}</td>
                                        <td className="px-5 py-3 text-right text-neutral-700 dark:text-neutral-300">
                                            {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-5 py-3 text-right text-red-600">
                                            {(Number(w.blockedValue) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-5 py-3 text-right text-amber-600">
                                            {(Number(w.expiredValue) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300">{pct.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
