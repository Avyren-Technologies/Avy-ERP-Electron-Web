import { useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, Search, X, TestTube2 } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { usePutawayRules, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCreatePutawayRule, useUpdatePutawayRule, useDeletePutawayRule, useSuggestBin } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/lib/toast';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';
const selectClass = inputClass;

const RULE_TYPES = [
    { value: 'FIXED_BIN', label: 'Fixed Bin' },
    { value: 'ZONE_BY_CATEGORY', label: 'Zone by Category' },
    { value: 'FIRST_EMPTY', label: 'First Empty Bin' },
    { value: 'NEAREST_DOCK', label: 'Nearest to Dock' },
];

const RULE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    FIXED_BIN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ZONE_BY_CATEGORY: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    FIRST_EMPTY: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    NEAREST_DOCK: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export function PutawayRulesScreen() {
    const canConfigure = useCanPerform('inventory.config:configure');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [showTestModal, setShowTestModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = usePutawayRules(params);
    const deleteMutation = useDeletePutawayRule();
    const items = data?.data || [];
    const meta = data?.meta;

    const handleDelete = (id: string) => {
        if (confirm('Delete this putaway rule?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Putaway Rules</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure automatic bin assignment for incoming stock</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowTestModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <TestTube2 className="w-4 h-4" /> Test Rule
                    </button>
                    {canConfigure && (
                        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" /> Add Rule
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search rules..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rule Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Zone / Bin</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part / Category</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12"><p className="text-sm text-neutral-400">No putaway rules configured</p></td></tr>
                                )}
                                {items.map((item: any) => {
                                    const typeConfig = RULE_TYPE_COLORS[item.ruleType] || RULE_TYPE_COLORS.FIXED_BIN;
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', typeConfig.bg, typeConfig.text, typeConfig.border)}>
                                                    {RULE_TYPES.find(r => r.value === item.ruleType)?.label || item.ruleType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.warehouse?.name || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                                {item.zone?.name || item.bin?.code || '--'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                                {item.part?.name || item.category?.name || '--'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.priority ?? '--'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn('w-2 h-2 rounded-full inline-block', item.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {canConfigure && (
                                                        <>
                                                            <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-500 hover:text-red-600">
                                                                <Trash2 className="w-3.5 h-3.5" />
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

            {showModal && <PutawayRuleModal editItem={editItem} onClose={() => setShowModal(false)} />}
            {showTestModal && <TestRuleModal onClose={() => setShowTestModal(false)} />}
        </div>
    );
}

function PutawayRuleModal({ editItem, onClose }: { editItem: any; onClose: () => void }) {
    const createMutation = useCreatePutawayRule();
    const updateMutation = useUpdatePutawayRule();
    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    const [form, setForm] = useState({
        ruleType: editItem?.ruleType || 'FIXED_BIN',
        warehouseId: editItem?.warehouseId || '',
        zoneId: editItem?.zoneId || '',
        binId: editItem?.binId || '',
        partId: editItem?.partId || '',
        categoryId: editItem?.categoryId || '',
        priority: editItem?.priority ?? 10,
        isActive: editItem?.isActive ?? true,
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = () => {
        const payload: any = {
            ruleType: form.ruleType,
            warehouseId: form.warehouseId || undefined,
            priority: form.priority,
            isActive: form.isActive,
        };
        if (form.ruleType === 'FIXED_BIN') {
            payload.partId = form.partId || undefined;
            payload.binId = form.binId || undefined;
        }
        if (form.ruleType === 'ZONE_BY_CATEGORY') {
            payload.categoryId = form.categoryId || undefined;
            payload.zoneId = form.zoneId || undefined;
        }

        if (editItem) {
            updateMutation.mutate({ id: editItem.id, data: payload }, { onSuccess: () => onClose() });
        } else {
            createMutation.mutate(payload, { onSuccess: () => onClose() });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editItem ? 'Edit' : 'Add'} Putaway Rule</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Rule Type *</label>
                        <select className={selectClass} value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value })}>
                            {RULE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse</label>
                        <select className={selectClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                            <option value="">Select warehouse</option>
                            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>

                    {form.ruleType === 'FIXED_BIN' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID</label>
                                <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Part ID for fixed bin assignment" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Bin ID</label>
                                <input className={inputClass} value={form.binId} onChange={(e) => setForm({ ...form, binId: e.target.value })} placeholder="Target bin" />
                            </div>
                        </>
                    )}

                    {form.ruleType === 'ZONE_BY_CATEGORY' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Category ID</label>
                                <input className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} placeholder="Part category" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Zone ID</label>
                                <input className={inputClass} value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} placeholder="Target zone" />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Priority</label>
                            <input type="number" min={1} className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editItem ? 'Update Rule' : 'Create Rule'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TestRuleModal({ onClose }: { onClose: () => void }) {
    const suggestMutation = useSuggestBin();
    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];
    const [partId, setPartId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');

    const result = suggestMutation.data?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Test Putaway Rule</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID *</label>
                        <input className={inputClass} value={partId} onChange={(e) => setPartId(e.target.value)} placeholder="Enter Part ID" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse *</label>
                        <select className={selectClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                            <option value="">Select warehouse</option>
                            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => suggestMutation.mutate({ partId, warehouseId })}
                    disabled={!partId || !warehouseId || suggestMutation.isPending}
                    className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                    {suggestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Suggest Bin'}
                </button>

                {result && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Suggested Location</p>
                        <p className="text-sm font-bold text-emerald-800">
                            {result.bin?.code || result.zone?.name || 'No suggestion found'}
                        </p>
                        {result.ruleType && <p className="text-xs text-emerald-600 mt-1">Matched rule: {result.ruleType}</p>}
                    </div>
                )}

                {suggestMutation.isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs text-red-600">No matching rule found for this part and warehouse.</p>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}
