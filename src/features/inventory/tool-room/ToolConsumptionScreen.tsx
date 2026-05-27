import { useState, useMemo } from 'react';
import { Loader2, Search, TrendingDown, AlertTriangle } from 'lucide-react';
import { useToolConsumptionReport } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

export function ToolConsumptionScreen() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = useToolConsumptionReport(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Consumption Rate</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Compare expected vs actual tool life and identify underperformers</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search tool type..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool Type</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expected Life</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Avg Actual Life</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance %</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Issued</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Condemned</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cost / 1000 Pcs</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Flag</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12"><TrendingDown className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No consumption data available</p></td></tr>
                                )}
                                {items.map((item: any, idx: number) => {
                                    const expectedLife = Number(item.expectedLife ?? 0);
                                    const avgActualLife = Number(item.avgActualLife ?? 0);
                                    const variancePct = expectedLife > 0 ? ((avgActualLife - expectedLife) / expectedLife) * 100 : 0;
                                    const isBelowExpected = avgActualLife < expectedLife * 0.8;
                                    return (
                                        <tr key={item.id || idx} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', isBelowExpected && 'bg-red-50/30 dark:bg-red-900/10')}>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || item.toolType || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{expectedLife.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{avgActualLife.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={cn('font-mono text-xs font-bold', variancePct >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                                                    {variancePct >= 0 ? '+' : ''}{variancePct.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{Number(item.totalIssued ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{Number(item.totalCondemned ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{item.costPer1000 != null ? Number(item.costPer1000).toLocaleString() : '--'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {isBelowExpected && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                                                        <AlertTriangle className="w-3 h-3" /> Below
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages} ({meta.total} records)</p>
                            <div className="flex gap-1">
                                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Previous</button>
                                <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
