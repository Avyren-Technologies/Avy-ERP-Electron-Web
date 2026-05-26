import { useState, useMemo } from 'react';
import { Loader2, Plus, ClipboardList, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useCounts, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

const COUNT_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CREATED: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Created' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'In Progress' },
    VARIANCE_COMPUTED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Variance Computed' },
    PENDING_APPROVAL: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Pending Approval' },
    CLOSED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Closed' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Cancelled' },
};

const COUNT_TYPES = ['CYCLE', 'FULL', 'SPOT'];

function CountStatusBadge({ status }: { status: string }) {
    const config = COUNT_STATUS_CONFIG[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: status };
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-[10px]', config.bg, config.text, config.border)}>
            {config.label}
        </span>
    );
}

export function CountListScreen() {
    const navigate = useNavigate();
    const canCreate = useCanPerform('inventory.counts:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        if (typeFilter) p.type = typeFilter;
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        return p;
    }, [search, statusFilter, typeFilter, warehouseFilter, page]);

    const { data, isLoading } = useCounts(params);
    const { data: whData } = useWarehouses();

    const items = data?.data || [];
    const meta = data?.meta;
    const warehouses = whData?.data || [];

    const hasFilters = search || statusFilter || typeFilter || warehouseFilter;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Counts</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Cycle counts, full counts, and spot checks</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => navigate('/app/inventory/counts/new')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Count
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search count number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {Object.keys(COUNT_STATUS_CONFIG).map(s => (
                        <option key={s} value={s}>{COUNT_STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                    <option value="">All types</option>
                    {COUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                {hasFilters && (
                    <button onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setWarehouseFilter(''); setPage(1); }} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Clear filters</button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Count #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Scheduled</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <ClipboardList className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No stock counts found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => navigate(`/app/inventory/counts/${item.id}`)}
                                        className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.countNumber || '--'}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                {item.type || item.countType || '--'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.warehouse?.code || item.warehouseCode || '--'}</td>
                                        <td className="px-4 py-3"><CountStatusBadge status={item.status || 'CREATED'} /></td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.scheduledDate ? fmt.date(item.scheduledDate) : '--'}</td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.completedAt ? fmt.dateTime(item.completedAt) : '--'}</td>
                                    </tr>
                                ))}
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
