import { useState, useMemo } from 'react';
import { Loader2, Plus, Pencil, Search, X, Wrench } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useToolLifePolicies } from '@/features/inventory/api/use-inventory-queries';
import { useUpsertToolLifePolicy } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';
const selectClass = inputClass;

const LIFE_UNITS = ['STROKES', 'HOURS', 'PIECES', 'METERS', 'CYCLES'];

export function ToolLifePolicyScreen() {
    const canConfigure = useCanPerform('inventory.config:configure');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = useToolLifePolicies(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Life Policies</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure expected life, warning thresholds, and reconditioning rules for consumable tools</p>
                </div>
                {canConfigure && (
                    <button onClick={() => { setEditItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Configure Tool
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search tool..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Life Unit</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expected Life</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warning %</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reconditionable</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Max Cycles</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serial Tracked</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12"><Wrench className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No tool life policies configured</p></td></tr>
                                )}
                                {items.map((item: any) => (
                                    <tr key={item.id || item.partId} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">{item.part?.name || ''}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.lifeUnit || '--'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{Number(item.expectedLife ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-xs text-neutral-700 dark:text-neutral-300">{Number(item.warningThresholdPct ?? 0)}%</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn('w-2 h-2 rounded-full inline-block', item.isReconditionable ? 'bg-emerald-500' : 'bg-neutral-300')} />
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs text-neutral-700 dark:text-neutral-300">{item.isReconditionable ? (item.maxReconditionCycles ?? '--') : '--'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={cn('w-2 h-2 rounded-full inline-block', item.trackSerialLevel ? 'bg-blue-500' : 'bg-neutral-300')} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canConfigure && (
                                                <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
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

            {showModal && <ToolLifePolicyModal editItem={editItem} onClose={() => setShowModal(false)} />}
        </div>
    );
}

function ToolLifePolicyModal({ editItem, onClose }: { editItem: any; onClose: () => void }) {
    const upsertMutation = useUpsertToolLifePolicy();
    const [form, setForm] = useState({
        partId: editItem?.partId || '',
        lifeUnit: editItem?.lifeUnit || 'STROKES',
        expectedLife: editItem?.expectedLife ?? 1000,
        warningThresholdPct: editItem?.warningThresholdPct ?? 20,
        isReconditionable: editItem?.isReconditionable ?? false,
        maxReconditionCycles: editItem?.maxReconditionCycles ?? 3,
        lifePerCycle: editItem?.lifePerCycle ?? 0,
        trackSerialLevel: editItem?.trackSerialLevel ?? false,
    });

    const handleSubmit = () => {
        upsertMutation.mutate({
            partId: form.partId,
            lifeUnit: form.lifeUnit,
            expectedLife: form.expectedLife,
            warningThresholdPct: form.warningThresholdPct,
            isReconditionable: form.isReconditionable,
            maxReconditionCycles: form.isReconditionable ? form.maxReconditionCycles : undefined,
            lifePerCycle: form.isReconditionable ? form.lifePerCycle : undefined,
            trackSerialLevel: form.trackSerialLevel,
        }, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editItem ? 'Edit' : 'Configure'} Tool Life Policy</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5 text-neutral-400" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Consumable tool part ID" disabled={!!editItem} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Life Unit *</label>
                            <select className={selectClass} value={form.lifeUnit} onChange={(e) => setForm({ ...form, lifeUnit: e.target.value })}>
                                {LIFE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Expected Life *</label>
                            <input type="number" min={1} className={inputClass} value={form.expectedLife} onChange={(e) => setForm({ ...form, expectedLife: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warning Threshold: {form.warningThresholdPct}%</label>
                        <input type="range" min={5} max={50} step={5} className="w-full accent-primary-600" value={form.warningThresholdPct} onChange={(e) => setForm({ ...form, warningThresholdPct: Number(e.target.value) })} />
                        <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>5%</span><span>50%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isReconditionable} onChange={(e) => setForm({ ...form, isReconditionable: e.target.checked })} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reconditionable</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.trackSerialLevel} onChange={(e) => setForm({ ...form, trackSerialLevel: e.target.checked })} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Track Serial Level</span>
                        </label>
                    </div>

                    {form.isReconditionable && (
                        <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50">
                            <div>
                                <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Max Reconditioning Cycles</label>
                                <input type="number" min={1} className={inputClass} value={form.maxReconditionCycles} onChange={(e) => setForm({ ...form, maxReconditionCycles: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Life per Cycle</label>
                                <input type="number" min={0} className={inputClass} value={form.lifePerCycle} onChange={(e) => setForm({ ...form, lifePerCycle: Number(e.target.value) })} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!form.partId || upsertMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Policy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
