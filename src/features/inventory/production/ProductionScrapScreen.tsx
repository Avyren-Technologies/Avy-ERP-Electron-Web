import { useState, useMemo } from 'react';
import { Loader2, Plus, Trash2, Search, X } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useProductionScraps } from '@/features/inventory/api/use-inventory-queries';
import { useCreateProductionScrap } from '@/features/inventory/api/use-inventory-mutations';
import { ScrapCategoryPicker } from '@/features/inventory/shared/ScrapCategoryPicker';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const DISPOSITION_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    LANDFILL: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Landfill / Dispose' },
    SALVAGE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Salvage' },
    REWORK_POSSIBLE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Rework Possible' },
};

export function ProductionScrapScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        return p;
    }, [search, dateFrom, dateTo, page]);

    const { data, isLoading } = useProductionScraps(params);
    const items = data?.data || [];
    const meta = data?.meta;

    const hasFilters = search || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Scrap</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Log and track production scrap for analysis</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Log Scrap
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search scrap or WO number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Clear filters</button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">WO</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Scrap Qty</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Machine</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Disposition</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12">
                                            <Trash2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No production scrap records found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => {
                                    const disposition = item.disposition || 'LANDFILL';
                                    const dispConfig = DISPOSITION_CONFIG[disposition] || DISPOSITION_CONFIG.LANDFILL;
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.workOrderNumber || item.workOrder?.woNumber || '--'}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.partNumber || item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500 truncate max-w-[120px]">{item.partName || item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">{Number(item.scrapQty ?? item.quantity ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.scrapCategory?.name || item.scrapCategoryName || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.machineName || item.machine?.name || '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', dispConfig.bg, dispConfig.text, dispConfig.border)}>
                                                    {dispConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
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

            {showModal && <CreateScrapModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

/* ── Create Scrap Modal ── */

function CreateScrapModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateProductionScrap();
    const [form, setForm] = useState({
        workOrderId: '',
        partId: '',
        scrapQty: 1,
        scrapCategoryId: '',
        operation: '',
        machineId: '',
        lotNumber: '',
        disposition: 'LANDFILL',
        remarks: '',
    });

    const canSubmit = form.workOrderId && form.partId && form.scrapQty > 0 && form.scrapCategoryId;

    const handleSubmit = () => {
        createMutation.mutate(
            {
                workOrderId: form.workOrderId,
                partId: form.partId,
                scrapQty: form.scrapQty,
                scrapCategoryId: form.scrapCategoryId,
                operation: form.operation || undefined,
                machineId: form.machineId || undefined,
                lotNumber: form.lotNumber || undefined,
                disposition: form.disposition,
                remarks: form.remarks || undefined,
            },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Log Production Scrap</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Work Order ID *</label>
                        <input className={inputClass} value={form.workOrderId} onChange={(e) => setForm({ ...form, workOrderId: e.target.value })} placeholder="Work Order ID" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Scrapped Part" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Scrap Qty *</label>
                        <input type="number" min={1} className={inputClass} value={form.scrapQty} onChange={(e) => setForm({ ...form, scrapQty: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Scrap Category *</label>
                        <ScrapCategoryPicker value={form.scrapCategoryId} onChange={(v) => setForm({ ...form, scrapCategoryId: v })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Operation</label>
                        <input className={inputClass} value={form.operation} onChange={(e) => setForm({ ...form, operation: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Machine ID</label>
                        <input className={inputClass} value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Lot Number</label>
                        <input className={inputClass} value={form.lotNumber} onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} placeholder="From issued lots" />
                    </div>
                </div>

                {/* Disposition */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Disposition *</label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(DISPOSITION_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setForm({ ...form, disposition: key })}
                                className={cn(
                                    'rounded-xl border-2 p-3 text-left transition-all',
                                    form.disposition === key
                                        ? `${config.bg} ${config.border}`
                                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300',
                                )}
                            >
                                <p className={cn('text-xs font-bold', form.disposition === key ? config.text : 'text-neutral-700 dark:text-neutral-300')}>
                                    {config.label}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                    <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Scrap'}
                    </button>
                </div>
            </div>
        </div>
    );
}
