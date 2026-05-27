import { useState, useMemo } from 'react';
import { Loader2, Plus, Package, Search, X, Lock, Eye } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { usePallets, usePallet } from '@/features/inventory/api/use-inventory-queries';
import { useCreatePallet, useAddPalletItems, useClosePallet } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const PALLET_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    OPEN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Open' },
    CLOSED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Closed' },
    IN_TRANSIT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Transit' },
    DISPATCHED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Dispatched' },
};

export function PalletManagementScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState('');
    const [showAddItemsModal, setShowAddItemsModal] = useState(false);
    const [addItemsPalletId, setAddItemsPalletId] = useState('');

    const closeMutation = useClosePallet();
    const [confirmCloseId, setConfirmCloseId] = useState('');

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        return p;
    }, [search, statusFilter, page]);

    const { data, isLoading } = usePallets(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pallet / LPN Management</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Create, track, and manage pallets and license plate numbers</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Create Pallet
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search LPN number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {Object.entries(PALLET_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">LPN Number</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Items</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-12"><Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No pallets found</p></td></tr>
                                )}
                                {items.map((item: any) => {
                                    const statusConfig = PALLET_STATUS_CONFIG[item.status] || PALLET_STATUS_CONFIG.OPEN;
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer" onClick={() => setSelectedPalletId(item.id)}>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.lpnNumber || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.warehouse?.name || '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusConfig.bg, statusConfig.text, statusConfig.border)}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-neutral-700 dark:text-neutral-300 text-xs">{item._count?.items ?? item.itemCount ?? 0}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setSelectedPalletId(item.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {item.status === 'OPEN' && canCreate && (
                                                        <>
                                                            <button onClick={() => { setAddItemsPalletId(item.id); setShowAddItemsModal(true); }} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-blue-600">
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setConfirmCloseId(item.id)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-emerald-600">
                                                                <Lock className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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

            {selectedPalletId && <PalletDetailModal palletId={selectedPalletId} onClose={() => setSelectedPalletId('')} />}
            {showCreateModal && <CreatePalletModal onClose={() => setShowCreateModal(false)} />}
            {showAddItemsModal && <AddItemsModal palletId={addItemsPalletId} onClose={() => setShowAddItemsModal(false)} />}
            {confirmCloseId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Close Pallet</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to close this pallet? No more items can be added after closing.</p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setConfirmCloseId('')} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={() => { closeMutation.mutate(confirmCloseId); setConfirmCloseId(''); }}
                                disabled={closeMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                {closeMutation.isPending ? 'Closing...' : 'Confirm Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PalletDetailModal({ palletId, onClose }: { palletId: string; onClose: () => void }) {
    const { data, isLoading } = usePallet(palletId);
    const fmt = useCompanyFormatter();
    const pallet = data?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Pallet Details</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
                ) : pallet ? (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-neutral-500">LPN Number</p>
                                <p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">{pallet.lpnNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500">Warehouse</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">{pallet.warehouse?.name || '--'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500">Status</p>
                                <p className="text-sm font-medium">{pallet.status}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Items on Pallet</h4>
                            {(pallet.items || []).length === 0 ? (
                                <p className="text-xs text-neutral-400">No items on this pallet</p>
                            ) : (
                                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-500">Part</th>
                                                <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-500">Lot</th>
                                                <th className="text-right px-3 py-2 text-xs font-semibold text-neutral-500">Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pallet.items.map((item: any, idx: number) => (
                                                <tr key={idx} className="border-b border-neutral-50 dark:border-neutral-800/50">
                                                    <td className="px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300">{item.part?.name || item.partId}</td>
                                                    <td className="px-3 py-2 text-xs text-neutral-500">{item.lotNumber || '--'}</td>
                                                    <td className="px-3 py-2 text-xs text-right font-medium">{Number(item.quantity).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-neutral-400">Pallet not found</p>
                )}
                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}

function CreatePalletModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreatePallet();
    const [form, setForm] = useState({ warehouseId: '', remarks: '' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Create Pallet</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse ID *</label>
                    <input className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} placeholder="Warehouse ID" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                    <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={() => createMutation.mutate({ warehouseId: form.warehouseId, remarks: form.remarks || undefined }, { onSuccess: () => onClose() })} disabled={!form.warehouseId || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddItemsModal({ palletId, onClose }: { palletId: string; onClose: () => void }) {
    const addMutation = useAddPalletItems();
    const [form, setForm] = useState({ partId: '', lotNumber: '', quantity: 1 });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Add Items to Pallet</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Part ID" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Lot Number</label>
                        <input className={inputClass} value={form.lotNumber} onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Quantity *</label>
                        <input type="number" min={1} className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={() => addMutation.mutate({ id: palletId, data: { items: [{ partId: form.partId, lotNumber: form.lotNumber || undefined, quantity: form.quantity }] } }, { onSuccess: () => onClose() })} disabled={!form.partId || form.quantity < 1 || addMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Items'}
                    </button>
                </div>
            </div>
        </div>
    );
}
