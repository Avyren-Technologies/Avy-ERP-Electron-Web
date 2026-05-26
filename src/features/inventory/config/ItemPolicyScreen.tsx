import { useState } from 'react';
import { Loader2, Search, Edit3, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useItemPolicies } from '@/features/inventory/api/use-inventory-queries';
import { useUpsertItemPolicy } from '@/features/inventory/api/use-inventory-mutations';

/* ── Constants ── */

const ISSUE_RULES = [
    { value: 'FIFO', label: 'FIFO' },
    { value: 'LIFO', label: 'LIFO' },
    { value: 'FEFO', label: 'FEFO' },
];

/* ── Main Screen ── */

export function ItemPolicyScreen() {
    const canEdit = useCanPerform('inventory.masters:create');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const { data, isLoading } = useItemPolicies({ search, page, limit: 25 });
    const upsertMutation = useUpsertItemPolicy();

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({
        lotTracking: false,
        serialTracking: false,
        expiryTracking: false,
        issueRule: 'FIFO',
        qcOnReceipt: false,
        reorderPoint: '',
        reorderQty: '',
        safetyStock: '',
        maxStock: '',
    });

    const items = data?.data || [];
    const meta = data?.meta;

    const openEdit = (item: any) => {
        setEditing(item);
        setForm({
            lotTracking: item.lotTracking ?? false,
            serialTracking: item.serialTracking ?? false,
            expiryTracking: item.expiryTracking ?? false,
            issueRule: item.issueRule || 'FIFO',
            qcOnReceipt: item.qcOnReceipt ?? false,
            reorderPoint: item.reorderPoint != null ? String(Number(item.reorderPoint)) : '',
            reorderQty: item.reorderQty != null ? String(Number(item.reorderQty)) : '',
            safetyStock: item.safetyStock != null ? String(Number(item.safetyStock)) : '',
            maxStock: item.maxStock != null ? String(Number(item.maxStock)) : '',
        });
        setShowModal(true);
    };

    const handleSave = () => {
        upsertMutation.mutate({
            partId: editing.partId || editing.id,
            lotTracking: form.lotTracking,
            serialTracking: form.serialTracking,
            expiryTracking: form.expiryTracking,
            issueRule: form.issueRule,
            qcOnReceipt: form.qcOnReceipt,
            reorderPoint: form.reorderPoint ? parseFloat(form.reorderPoint) : null,
            reorderQty: form.reorderQty ? parseFloat(form.reorderQty) : null,
            safetyStock: form.safetyStock ? parseFloat(form.safetyStock) : null,
            maxStock: form.maxStock ? parseFloat(form.maxStock) : null,
        }, { onSuccess: () => setShowModal(false) });
    };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    return (
        <div className="flex-1 p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Item Stock Policies</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure tracking, issue rules, and reorder points per part</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search by part number or name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lot</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serial</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expiry</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issue Rule</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">QC on Receipt</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reorder Pt</th>
                                {canEdit && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={8} className="text-center py-8 text-neutral-400">No item policies found</td></tr>
                            )}
                            {items.map((item: any) => (
                                <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                                <Package className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-white text-xs">{item.part?.partNumber || item.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || item.partName || '--'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center"><ToggleDot on={item.lotTracking} /></td>
                                    <td className="px-4 py-3 text-center"><ToggleDot on={item.serialTracking} /></td>
                                    <td className="px-4 py-3 text-center"><ToggleDot on={item.expiryTracking} /></td>
                                    <td className="px-4 py-3 text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">{item.issueRule || 'FIFO'}</td>
                                    <td className="px-4 py-3 text-center"><ToggleDot on={item.qcOnReceipt} /></td>
                                    <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{item.reorderPoint != null ? Number(item.reorderPoint).toLocaleString() : '--'}</td>
                                    {canEdit && (
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                                                <Edit3 className="w-3 h-3" /> Edit
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages} ({meta.total} items)</p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= meta.totalPages}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {showModal && editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Edit Policy: {editing.part?.partNumber || editing.partNumber || 'Part'}
                        </h3>
                        <div className="space-y-4">
                            {/* Tracking toggles */}
                            <div className="grid grid-cols-3 gap-3">
                                <ToggleField label="Lot Tracking" value={form.lotTracking} onChange={(v) => setForm({ ...form, lotTracking: v })} />
                                <ToggleField label="Serial Tracking" value={form.serialTracking} onChange={(v) => setForm({ ...form, serialTracking: v })} />
                                <ToggleField label="Expiry Tracking" value={form.expiryTracking} onChange={(v) => setForm({ ...form, expiryTracking: v })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Issue Rule</label>
                                    <select className={inputClass} value={form.issueRule} onChange={(e) => setForm({ ...form, issueRule: e.target.value })}>
                                        {ISSUE_RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <ToggleField label="QC on Receipt" value={form.qcOnReceipt} onChange={(v) => setForm({ ...form, qcOnReceipt: v })} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Reorder Point</label>
                                    <input type="number" className={inputClass} value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Reorder Qty</label>
                                    <input type="number" className={inputClass} value={form.reorderQty} onChange={(e) => setForm({ ...form, reorderQty: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Safety Stock</label>
                                    <input type="number" className={inputClass} value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Max Stock</label>
                                    <input type="number" className={inputClass} value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} placeholder="0" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={upsertMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Helpers ── */

function ToggleDot({ on }: { on?: boolean }) {
    return <span className={cn('inline-block w-2 h-2 rounded-full', on ? 'bg-emerald-500' : 'bg-neutral-300')} />;
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
            <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="rounded border-neutral-300" />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        </label>
    );
}
