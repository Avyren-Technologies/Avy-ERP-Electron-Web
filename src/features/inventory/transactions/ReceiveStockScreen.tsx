import { useState, useMemo } from 'react';
import { Loader2, Plus, Package, Search, X, Trash2 } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useReceiveStock, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCreateReceiveStock } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';
const selectClass = inputClass;

interface LineItem {
    partId: string;
    partName: string;
    qty: number;
    uom: string;
    remarks: string;
}

export function ReceiveStockScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        return p;
    }, [search, warehouseFilter, page]);

    const { data, isLoading } = useReceiveStock(params);
    const { data: whData } = useWarehouses();

    const items = data?.data || [];
    const meta = data?.meta;
    const warehouses = whData?.data || [];

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receive Stock</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Record incoming stock receipts</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                    >
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
                        placeholder="Search transaction number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={warehouseFilter}
                    onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                {(search || warehouseFilter) && (
                    <button
                        onClick={() => { setSearch(''); setWarehouseFilter(''); setPage(1); }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Items</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No stock receipts found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                                            {item.transactionNumber || '--'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                            {item.createdAt ? fmt.dateTime(item.createdAt) : '--'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                            {item.warehouse?.code || item.warehouseCode || '--'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">
                                            {item.lineItems?.length || item.itemCount || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <TransactionStatusBadge status={item.status || 'DRAFT'} />
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {item.createdBy?.name || item.createdByName || '--'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">
                                Page {meta.page} of {meta.totalPages} ({meta.total} records)
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= meta.totalPages}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showModal && <CreateReceiveStockModal warehouses={warehouses} onClose={() => setShowModal(false)} />}
        </div>
    );
}

/* ── Create Modal ── */

function CreateReceiveStockModal({ warehouses, onClose }: { warehouses: any[]; onClose: () => void }) {
    const createMutation = useCreateReceiveStock();
    const [warehouseId, setWarehouseId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { partId: '', partName: '', qty: 1, uom: '', remarks: '' },
    ]);

    const addLine = () => setLineItems([...lineItems, { partId: '', partName: '', qty: 1, uom: '', remarks: '' }]);
    const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
    const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
        setLineItems(lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li));
    };

    const canSubmit = warehouseId && lineItems.length > 0 && lineItems.every(li => li.partId && li.qty > 0);

    const handleSubmit = () => {
        createMutation.mutate(
            {
                warehouseId,
                remarks: remarks || undefined,
                lineItems: lineItems.map(li => ({
                    partId: li.partId,
                    quantity: li.qty,
                    uom: li.uom || undefined,
                    remarks: li.remarks || undefined,
                })),
            },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New Stock Receipt</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse *</label>
                            <select className={selectClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                                <option value="">Select warehouse</option>
                                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                            <input className={inputClass} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-neutral-400">Line Items</label>
                            <button onClick={addLine} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 space-y-2">
                            {lineItems.map((li, idx) => (
                                <div key={idx} className="flex items-start gap-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                                    <div className="flex-1 grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Part ID *</label>
                                            <input className={inputClass} value={li.partId} onChange={(e) => updateLine(idx, 'partId', e.target.value)} placeholder="Part ID" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Part Name</label>
                                            <input className={inputClass} value={li.partName} onChange={(e) => updateLine(idx, 'partName', e.target.value)} placeholder="Name" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Qty *</label>
                                            <input type="number" min={1} className={inputClass} value={li.qty} onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">UOM</label>
                                            <input className={inputClass} value={li.uom} onChange={(e) => updateLine(idx, 'uom', e.target.value)} placeholder="pcs" />
                                        </div>
                                    </div>
                                    {lineItems.length > 1 && (
                                        <button onClick={() => removeLine(idx)} className="mt-4 p-1 text-red-400 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || createMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
}
