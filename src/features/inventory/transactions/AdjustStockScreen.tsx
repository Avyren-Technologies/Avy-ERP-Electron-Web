import { useState, useMemo } from 'react';
import { Loader2, Plus, SlidersHorizontal, Search, X } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useAdjustments, useWarehouses, useReasonCodes } from '@/features/inventory/api/use-inventory-queries';
import { useCreateAdjustStock } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { WarehouseLocationPicker } from '@/features/inventory/shared/WarehouseLocationPicker';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function AdjustStockScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = useAdjustments(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Adjustments</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Record quantity adjustments with reason codes</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Adjustment
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search transaction number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty Change</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reason Code</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Approver</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <SlidersHorizontal className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No adjustments found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => {
                                    const qty = Number(item.quantity ?? item.qty ?? 0);
                                    const isPositive = qty > 0;
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-medium text-neutral-900 dark:text-white">{item.partNumber || item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.partName || item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {isPositive ? '+' : ''}{qty.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.reasonCode || item.reason?.code || '--'}</td>
                                            <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'DRAFT'} /></td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">{item.approver?.name || item.approverName || '--'}</td>
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

            {showModal && <CreateAdjustmentModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

function CreateAdjustmentModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateAdjustStock();
    const { data: rcData } = useReasonCodes({ type: 'ADJUSTMENT' });
    const reasonCodes = rcData?.data || [];

    const [partId, setPartId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reasonCodeId, setReasonCodeId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [zoneId, setZoneId] = useState('');
    const [binId, setBinId] = useState('');

    const canSubmit = partId && quantity && Number(quantity) !== 0 && reasonCodeId && warehouseId;

    const handleSubmit = () => {
        createMutation.mutate({
            partId,
            quantity: Number(quantity),
            reasonCodeId,
            warehouseId,
            zoneId: zoneId || undefined,
            binId: binId || undefined,
            remarks: remarks || undefined,
        }, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New Stock Adjustment</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID *</label>
                        <input className={inputClass} value={partId} onChange={(e) => setPartId(e.target.value)} placeholder="Enter part ID" />
                    </div>

                    <WarehouseLocationPicker
                        warehouseId={warehouseId} zoneId={zoneId} binId={binId}
                        onWarehouseChange={setWarehouseId} onZoneChange={setZoneId} onBinChange={setBinId}
                        required
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Quantity Change *</label>
                            <input type="number" className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="+10 or -5" />
                            <p className="text-[10px] text-neutral-400 mt-0.5">Positive to add, negative to remove</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Reason Code *</label>
                            <select className={inputClass} value={reasonCodeId} onChange={(e) => setReasonCodeId(e.target.value)}>
                                <option value="">Select reason</option>
                                {reasonCodes.map((rc: any) => <option key={rc.id} value={rc.id}>{rc.code} - {rc.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Adjustment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
