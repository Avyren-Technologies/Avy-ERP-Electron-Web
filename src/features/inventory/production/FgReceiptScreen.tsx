import { useState, useMemo } from 'react';
import { Loader2, Plus, PackageCheck, Search, X } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useFgReceipts } from '@/features/inventory/api/use-inventory-queries';
import { useCreateFgReceipt } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const QC_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    PASSED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Passed' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending QC' },
    NOT_APPLICABLE: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'N/A' },
};

export function FgReceiptScreen() {
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

    const { data, isLoading } = useFgReceipts(params);
    const items = data?.data || [];
    const meta = data?.meta;

    const hasFilters = search || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FG Receipt</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive finished goods from production into inventory</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Receipt
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search receipt or WO number..."
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">WO Reference</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Declared</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Received</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">QC</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">WIP Cleared</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12">
                                            <PackageCheck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No FG receipts found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => {
                                    const declared = Number(item.declaredQty ?? 0);
                                    const received = Number(item.receivedQty ?? 0);
                                    const variance = received - declared;
                                    const qcStatus = item.qcStatus || 'NOT_APPLICABLE';
                                    const qcConfig = QC_STATUS_COLORS[qcStatus] || QC_STATUS_COLORS.NOT_APPLICABLE;
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.workOrderNumber || item.workOrder?.woNumber || '--'}</td>
                                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{declared.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">{received.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={cn('font-medium', variance === 0 ? 'text-emerald-600' : 'text-amber-600')}>
                                                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', qcConfig.bg, qcConfig.text)}>
                                                    {qcConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.wipCleared ? (
                                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Yes</span>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">No</span>
                                                )}
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

            {showModal && <CreateFgReceiptModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

/* ── Create FG Receipt Modal ── */

function CreateFgReceiptModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateFgReceipt();
    const [form, setForm] = useState({
        workOrderId: '',
        fgPartId: '',
        declaredQty: 0,
        receivedQty: 0,
        fgLotNumber: '',
        remarks: '',
    });

    const variance = form.receivedQty - form.declaredQty;
    const canSubmit = form.workOrderId && form.fgPartId && form.receivedQty > 0;

    const handleSubmit = () => {
        createMutation.mutate(
            {
                workOrderId: form.workOrderId,
                fgPartId: form.fgPartId,
                declaredQty: form.declaredQty,
                receivedQty: form.receivedQty,
                fgLotNumber: form.fgLotNumber || undefined,
                remarks: form.remarks || undefined,
            },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New FG Receipt</h3>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">FG Part ID *</label>
                        <input className={inputClass} value={form.fgPartId} onChange={(e) => setForm({ ...form, fgPartId: e.target.value })} placeholder="Finished Good Part" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Declared Qty (from Production)</label>
                        <input type="number" min={0} className={inputClass} value={form.declaredQty} onChange={(e) => setForm({ ...form, declaredQty: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Received Qty *</label>
                        <input type="number" min={1} className={inputClass} value={form.receivedQty} onChange={(e) => setForm({ ...form, receivedQty: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">FG Lot Number</label>
                        <input className={inputClass} value={form.fgLotNumber} onChange={(e) => setForm({ ...form, fgLotNumber: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                </div>

                {/* Variance display */}
                {form.declaredQty > 0 && form.receivedQty > 0 && variance !== 0 && (
                    <div className={cn(
                        'px-4 py-3 rounded-xl border text-xs font-medium',
                        'bg-amber-50 border-amber-200 text-amber-700',
                    )}>
                        Variance: {variance > 0 ? '+' : ''}{variance} ({variance > 0 ? 'over-receipt' : 'short receipt'})
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
}
