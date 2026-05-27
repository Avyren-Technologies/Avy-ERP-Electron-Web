import { useState, useMemo } from 'react';
import { Loader2, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useToolBreakageReport } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

export function ToolBreakageScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [groupBy, setGroupBy] = useState<'none' | 'machine' | 'cause'>('none');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (groupBy !== 'none') p.groupBy = groupBy;
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        return p;
    }, [search, groupBy, dateFrom, dateTo, page]);

    const { data, isLoading } = useToolBreakageReport(params);
    const items = data?.data || [];
    const meta = data?.meta;

    const hasFilters = search || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Breakage & Unplanned Loss</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Analyze tool breakages, causes, and safety incidents</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search tool, machine, cause..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
                    <option value="none">No Grouping</option>
                    <option value="machine">Group by Machine</option>
                    <option value="cause">Group by Cause</option>
                </select>
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                {hasFilters && <button onClick={clearFilters} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Clear filters</button>}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Machine</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Operator</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Breakage Cause</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Safety</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Life at Breakage</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12"><AlertTriangle className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No breakage records found</p></td></tr>
                                )}
                                {items.map((item: any, idx: number) => {
                                    const isSafety = item.safetyIncidentFlag;
                                    return (
                                        <tr key={item.id || idx} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', isSafety && 'bg-red-50 dark:bg-red-900/20')}>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.machine?.name || item.breakageMachineName || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.operator?.name || item.operatorName || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate">{item.breakageCause || '--'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {isSafety ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                                                        <ShieldAlert className="w-3 h-3" /> Incident
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-neutral-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{item.remainingLifeAtBreakage != null ? Number(item.remainingLifeAtBreakage).toLocaleString() : '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{item.cost != null ? Number(item.cost).toLocaleString() : '--'}</td>
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
