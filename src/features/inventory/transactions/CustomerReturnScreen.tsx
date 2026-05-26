import { useState, useMemo } from 'react';
import { Loader2, Plus, RotateCcw, Search, X, Trash2 } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useCustomerReturns } from '@/features/inventory/api/use-inventory-queries';
import { useCreateCustomerReturn, useInspectReturn } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const INSPECTION_RESULTS = [
    { value: 'GOOD', label: 'Good', color: 'text-emerald-600 bg-emerald-50' },
    { value: 'DAMAGED', label: 'Damaged', color: 'text-red-600 bg-red-50' },
    { value: 'REPAIRABLE', label: 'Repairable', color: 'text-amber-600 bg-amber-50' },
];

const DISPOSITIONS = [
    { value: 'RESTOCK', label: 'Restock' },
    { value: 'REJECT', label: 'Reject / Scrap' },
    { value: 'REPAIR', label: 'Send for Repair' },
];

export function CustomerReturnScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [inspectingItem, setInspectingItem] = useState<any>(null);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = useCustomerReturns(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Returns</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Process returned goods from customers</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Return
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search return number or SO..."
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">SO Reference</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Return Reason</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Inspection</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Disposition</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <RotateCcw className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No customer returns found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => {
                                    const inspResult = INSPECTION_RESULTS.find(r => r.value === item.inspectionResult);
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.soReference || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.returnReason || '--'}</td>
                                            <td className="px-4 py-3">
                                                {inspResult ? (
                                                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', inspResult.color)}>{inspResult.label}</span>
                                                ) : (
                                                    <span className="text-xs text-neutral-400">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.disposition || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {!item.inspectionResult && (
                                                    <button
                                                        onClick={() => setInspectingItem(item)}
                                                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                                    >
                                                        Inspect
                                                    </button>
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

            {showModal && <CreateReturnModal onClose={() => setShowModal(false)} />}
            {inspectingItem && <InspectReturnModal item={inspectingItem} onClose={() => setInspectingItem(null)} />}
        </div>
    );
}

function CreateReturnModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateCustomerReturn();
    const [soReference, setSoReference] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [remarks, setRemarks] = useState('');
    const [lineItems, setLineItems] = useState([{ partId: '', qty: 1, lotNumber: '' }]);

    const addLine = () => setLineItems([...lineItems, { partId: '', qty: 1, lotNumber: '' }]);
    const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
    const updateLine = (idx: number, field: string, value: any) => {
        setLineItems(lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li));
    };

    const canSubmit = returnReason && lineItems.every(li => li.partId && li.qty > 0);

    const handleSubmit = () => {
        createMutation.mutate({
            soReference: soReference || undefined,
            returnReason,
            remarks: remarks || undefined,
            lineItems: lineItems.map(li => ({ partId: li.partId, quantity: li.qty, lotNumber: li.lotNumber || undefined })),
        }, { onSuccess: () => onClose() });
    };

    const RETURN_REASONS = ['DEFECTIVE', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'QUALITY_ISSUE', 'CUSTOMER_CHANGE_OF_MIND', 'OTHER'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New Customer Return</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">SO Reference</label>
                        <input className={inputClass} value={soReference} onChange={(e) => setSoReference(e.target.value)} placeholder="SO-00001" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Return Reason *</label>
                        <select className={inputClass} value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                            <option value="">Select reason</option>
                            {RETURN_REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                    <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes" />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-400">Line Items</label>
                        <button onClick={addLine} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 space-y-2">
                        {lineItems.map((li, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Part ID *</label>
                                        <input className={inputClass} value={li.partId} onChange={(e) => updateLine(idx, 'partId', e.target.value)} placeholder="Part ID" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Qty *</label>
                                        <input type="number" min={1} className={inputClass} value={li.qty} onChange={(e) => updateLine(idx, 'qty', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Lot #</label>
                                        <input className={inputClass} value={li.lotNumber} onChange={(e) => updateLine(idx, 'lotNumber', e.target.value)} placeholder="Lot" />
                                    </div>
                                </div>
                                {lineItems.length > 1 && (
                                    <button onClick={() => removeLine(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Return'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InspectReturnModal({ item, onClose }: { item: any; onClose: () => void }) {
    const inspectMutation = useInspectReturn();
    const [result, setResult] = useState('');
    const [disposition, setDisposition] = useState('');
    const [remarks, setRemarks] = useState('');

    const canSubmit = result && disposition;

    const handleSubmit = () => {
        inspectMutation.mutate({
            id: item.id,
            data: { inspectionResult: result, disposition, remarks: remarks || undefined },
        }, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Inspect Return</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <p className="text-sm text-neutral-500">
                    Return: <span className="font-mono font-bold text-primary-600">{item.transactionNumber}</span>
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Inspection Result *</label>
                        <div className="flex gap-2">
                            {INSPECTION_RESULTS.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setResult(r.value)}
                                    className={cn(
                                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                                        result === r.value
                                            ? `${r.color} border-current ring-1 ring-current`
                                            : 'text-neutral-500 border-neutral-200 hover:border-neutral-300',
                                    )}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Disposition *</label>
                        <select className={inputClass} value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                            <option value="">Select disposition</option>
                            {DISPOSITIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Inspection notes" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || inspectMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {inspectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Inspection'}
                    </button>
                </div>
            </div>
        </div>
    );
}
