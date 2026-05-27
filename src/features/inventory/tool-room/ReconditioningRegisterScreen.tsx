import { useState, useMemo } from 'react';
import { Loader2, Search, Wrench } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useReconditioningRegister } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

const RECON_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    INITIATED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Initiated' },
    IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Progress' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
};

export function ReconditioningRegisterScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [reconTypeFilter, setReconTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        if (reconTypeFilter) p.reconType = reconTypeFilter;
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        return p;
    }, [search, statusFilter, reconTypeFilter, dateFrom, dateTo, page]);

    const { data, isLoading } = useReconditioningRegister(params);
    const items = data?.data || [];
    const meta = data?.meta;
    const summary = data?.summary;

    const hasFilters = search || statusFilter || reconTypeFilter || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setStatusFilter(''); setReconTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reconditioning Register</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Complete register of all reconditioning activities with cost tracking</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {Object.entries(RECON_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={reconTypeFilter} onChange={(e) => { setReconTypeFilter(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serial</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cycle #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vendor</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expected</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actual</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={9} className="text-center py-12"><Wrench className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No reconditioning records</p></td></tr>
                                )}
                                {items.map((item: any, idx: number) => {
                                    const statusConfig = RECON_STATUS_CONFIG[item.status] || RECON_STATUS_CONFIG.INITIATED;
                                    return (
                                        <tr key={item.id || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-600">{item.serialNumber || '--'}</td>
                                            <td className="px-4 py-3 text-center font-mono text-xs font-bold">{item.cycleNumber ?? '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', item.reconType === 'EXTERNAL' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>
                                                    {item.reconType || '--'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.vendor?.name || item.vendorName || '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusConfig.bg, statusConfig.text, statusConfig.border)}>{statusConfig.label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.expectedReturnDate ? fmt.date(item.expectedReturnDate) : '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.actualReturnDate ? fmt.date(item.actualReturnDate) : '--'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{item.cost != null ? Number(item.cost).toLocaleString() : '--'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Cost Summary */}
                    {(summary?.totalCost != null || items.length > 0) && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Total Cost: <span className="font-mono text-primary-600">{Number(summary?.totalCost ?? items.reduce((s: number, i: any) => s + Number(i.cost ?? 0), 0)).toLocaleString()}</span>
                            </p>
                        </div>
                    )}

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
