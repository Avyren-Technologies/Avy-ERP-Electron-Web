import { useState, useMemo } from 'react';
import { Loader2, Search, Activity } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useToolStatusReport } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

function LifeProgressBar({ remainingPct }: { remainingPct: number }) {
    const color = remainingPct > 50 ? 'bg-emerald-500' : remainingPct > 20 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden min-w-[60px]">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, remainingPct))}%` }} />
            </div>
            <span className={cn('text-[10px] font-bold whitespace-nowrap', remainingPct > 50 ? 'text-emerald-600' : remainingPct > 20 ? 'text-amber-600' : 'text-red-600')}>
                {remainingPct.toFixed(0)}%
            </span>
        </div>
    );
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    AVAILABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Available' },
    IN_USE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'In Use' },
    RECONDITIONING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Reconditioning' },
    CONDEMNED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Condemned' },
};

export function ToolStatusReportScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        return p;
    }, [search, statusFilter, page]);

    const { data, isLoading } = useToolStatusReport(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Status & Life Report</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">View remaining life and status of all tracked tools</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search tools..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool Part</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serial</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Remaining</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Unit</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Life %</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Last Machine</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Last Issued</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12"><Activity className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No tool status data available</p></td></tr>
                                )}
                                {items.map((item: any, idx: number) => {
                                    const pct = item.remainingLifePct ?? (item.expectedLife ? (Number(item.remainingLife ?? 0) / Number(item.expectedLife)) * 100 : 0);
                                    const statusKey = item.status || 'AVAILABLE';
                                    const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.AVAILABLE;
                                    return (
                                        <tr key={item.id || idx} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', statusKey === 'CONDEMNED' && 'opacity-60')}>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-600">{item.serialNumber || '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusConfig.bg, statusConfig.text, statusConfig.border)}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{Number(item.remainingLife ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-500">{item.lifeUnit || '--'}</td>
                                            <td className="px-4 py-3 w-32"><LifeProgressBar remainingPct={pct} /></td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.lastMachine?.name || item.lastMachineName || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.lastIssuedAt ? fmt.date(item.lastIssuedAt) : '--'}</td>
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
