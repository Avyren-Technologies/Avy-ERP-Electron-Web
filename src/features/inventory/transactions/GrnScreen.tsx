import { useState, useMemo } from 'react';
import { Loader2, Plus, Package, Search, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useGrns, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCreateGrn } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { TRANSACTION_STATUS_CONFIG } from '@/features/inventory/shared/inventory-status-colors';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function GrnScreen() {
    const navigate = useNavigate();
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        return p;
    }, [search, statusFilter, warehouseFilter, dateFrom, dateTo, page]);

    const { data, isLoading } = useGrns(params);
    const { data: whData } = useWarehouses();

    const items = data?.data || [];
    const meta = data?.meta;
    const warehouses = whData?.data || [];

    const hasFilters = search || statusFilter || warehouseFilter || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setStatusFilter(''); setWarehouseFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goods Receipt Notes</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage incoming goods against purchase orders</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New GRN
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search GRN or PO number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {Object.keys(TRANSACTION_STATUS_CONFIG).map(s => (
                        <option key={s} value={s}>{TRANSACTION_STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} placeholder="From" />
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} placeholder="To" />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">GRN #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">PO Reference</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Received At</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Discrepancies</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No GRNs found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => navigate(`/app/inventory/grn/${item.id}`)}
                                        className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.grnNumber || item.transactionNumber || '--'}</td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.poReference || item.poNumber || '--'}</td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.supplierName || item.supplier?.name || '--'}</td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.receivedAt ? fmt.dateTime(item.receivedAt) : item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                        <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'DRAFT'} /></td>
                                        <td className="px-4 py-3">
                                            {item.hasDiscrepancies || item.discrepancyCount > 0 ? (
                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    {item.discrepancyCount || 'Yes'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">None</span>
                                            )}
                                        </td>
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

            {showModal && <CreateGrnModal warehouses={warehouses} onClose={() => setShowModal(false)} />}
        </div>
    );
}

/* ── Create GRN Modal ── */

function CreateGrnModal({ warehouses, onClose }: { warehouses: any[]; onClose: () => void }) {
    const createMutation = useCreateGrn();
    const [form, setForm] = useState({
        warehouseId: '',
        poReference: '',
        supplierName: '',
        remarks: '',
    });
    const [lineItems, setLineItems] = useState([
        { partId: '', qty: 1, orderedQty: 0, uom: '', lotNumber: '', expiryDate: '', remarks: '' },
    ]);

    const addLine = () => setLineItems([...lineItems, { partId: '', qty: 1, orderedQty: 0, uom: '', lotNumber: '', expiryDate: '', remarks: '' }]);
    const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
    const updateLine = (idx: number, field: string, value: any) => {
        setLineItems(lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li));
    };

    const canSubmit = form.warehouseId && lineItems.length > 0 && lineItems.every(li => li.partId && li.qty > 0);

    const handleSubmit = () => {
        createMutation.mutate(
            {
                ...form,
                lineItems: lineItems.map(li => ({
                    partId: li.partId,
                    receivedQty: li.qty,
                    orderedQty: li.orderedQty || undefined,
                    uom: li.uom || undefined,
                    lotNumber: li.lotNumber || undefined,
                    expiryDate: li.expiryDate || undefined,
                    remarks: li.remarks || undefined,
                })),
            },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New Goods Receipt Note</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse *</label>
                        <select className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                            <option value="">Select warehouse</option>
                            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">PO Reference</label>
                        <input className={inputClass} value={form.poReference} onChange={(e) => setForm({ ...form, poReference: e.target.value })} placeholder="PO-00001" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Supplier Name</label>
                        <input className={inputClass} value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="Supplier" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-400">Line Items</label>
                        <button onClick={addLine} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 space-y-2">
                        {lineItems.map((li, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                                <div className="flex-1 grid grid-cols-5 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Part ID *</label>
                                        <input className={inputClass} value={li.partId} onChange={(e) => updateLine(idx, 'partId', e.target.value)} placeholder="Part ID" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Received Qty *</label>
                                        <input type="number" min={1} className={inputClass} value={li.qty} onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Ordered Qty</label>
                                        <input type="number" min={0} className={inputClass} value={li.orderedQty} onChange={(e) => updateLine(idx, 'orderedQty', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Lot #</label>
                                        <input className={inputClass} value={li.lotNumber} onChange={(e) => updateLine(idx, 'lotNumber', e.target.value)} placeholder="Lot" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Expiry</label>
                                        <input type="date" className={inputClass} value={li.expiryDate} onChange={(e) => updateLine(idx, 'expiryDate', e.target.value)} />
                                    </div>
                                </div>
                                {lineItems.length > 1 && (
                                    <button onClick={() => removeLine(idx)} className="mt-4 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create GRN'}
                    </button>
                </div>
            </div>
        </div>
    );
}
