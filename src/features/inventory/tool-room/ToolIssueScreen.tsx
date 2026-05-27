import { useState, useMemo } from 'react';
import { Loader2, Plus, Search, ArrowRight, AlertTriangle, XCircle } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useToolsAtMachine, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCreateToolIssue } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

function LifeProgressBar({ remainingPct }: { remainingPct: number }) {
    const color = remainingPct > 50 ? 'bg-emerald-500' : remainingPct > 20 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, remainingPct))}%` }} />
            </div>
            <span className={cn('text-[10px] font-bold', remainingPct > 50 ? 'text-emerald-600' : remainingPct > 20 ? 'text-amber-600' : 'text-red-600')}>
                {remainingPct.toFixed(0)}%
            </span>
        </div>
    );
}

export function ToolIssueScreen() {
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

    // Show recent tool issues via tools-at-machine with history
    const { data, isLoading } = useToolsAtMachine(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue Tool to Machine</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Issue consumable tools from inventory to machines on the shop floor</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Issue Tool
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search tools at machine..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool Part</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Machine</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Spindle</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Remaining Life</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issued</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-12"><ArrowRight className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No tool issues found</p></td></tr>
                                )}
                                {items.map((item: any) => {
                                    const remainingPct = item.remainingLifePct ?? (item.expectedLife ? (Number(item.remainingLife ?? 0) / Number(item.expectedLife)) * 100 : 0);
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || item.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500 truncate max-w-[120px]">{item.part?.name || item.partName || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.machine?.name || item.machineName || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-500">{item.spindleStation || '--'}</td>
                                            <td className="px-4 py-3 w-40">
                                                <LifeProgressBar remainingPct={remainingPct} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.issuedAt || item.createdAt ? fmt.dateTime(item.issuedAt || item.createdAt) : '--'}</td>
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

            {showModal && <IssueToolModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

function IssueToolModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateToolIssue();
    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    const [form, setForm] = useState({
        partId: '',
        machineId: '',
        spindleStation: '',
        warehouseId: '',
        zoneId: '',
        binId: '',
        quantity: 1,
        remarks: '',
    });

    // Simulate life check — in real usage the backend validates
    const [lifeWarning, setLifeWarning] = useState<string | null>(null);
    const [lifeExhausted, setLifeExhausted] = useState(false);

    const canSubmit = form.partId && form.machineId && !lifeExhausted;

    const handleSubmit = () => {
        createMutation.mutate({
            partId: form.partId,
            machineId: form.machineId,
            spindleStation: form.spindleStation || undefined,
            warehouseId: form.warehouseId || undefined,
            zoneId: form.zoneId || undefined,
            binId: form.binId || undefined,
            quantity: form.quantity,
            remarks: form.remarks || undefined,
        }, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Issue Tool to Machine</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><span className="sr-only">Close</span><svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                {lifeWarning && !lifeExhausted && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-medium">{lifeWarning}</p>
                    </div>
                )}

                {lifeExhausted && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <p className="text-xs font-medium">Cannot issue -- tool life exhausted</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Tool Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Consumable tool" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Machine ID *</label>
                        <input className={inputClass} value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} placeholder="Target machine" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Spindle / Station</label>
                        <input className={inputClass} value={form.spindleStation} onChange={(e) => setForm({ ...form, spindleStation: e.target.value })} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Quantity</label>
                        <input type="number" min={1} className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse</label>
                        <select className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
                            <option value="">Select source warehouse</option>
                            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Tool'}
                    </button>
                </div>
            </div>
        </div>
    );
}
