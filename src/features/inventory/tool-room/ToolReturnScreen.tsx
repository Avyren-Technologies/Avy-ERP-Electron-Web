import { useState, useMemo } from 'react';
import { Loader2, Plus, Search, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Skull } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useToolsAtMachine } from '@/features/inventory/api/use-inventory-queries';
import { useCreateToolReturn } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const OUTCOME_OPTIONS = [
    { value: 'STILL_USABLE', label: 'Still Usable', desc: 'Tool still has remaining life', icon: CheckCircle2, color: 'emerald' },
    { value: 'NEEDS_RECONDITIONING', label: 'Needs Reconditioning', desc: 'Tool worn, send for resharpening', icon: RotateCcw, color: 'amber' },
    { value: 'CONDEMNED', label: 'Condemned', desc: 'End of life, write off permanently', icon: Skull, color: 'red' },
    { value: 'BROKEN', label: 'Broken', desc: 'Unexpected breakage/failure', icon: XCircle, color: 'red' },
] as const;

const OUTCOME_BADGE_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    STILL_USABLE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Still Usable' },
    NEEDS_RECONDITIONING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Needs Reconditioning' },
    CONDEMNED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Condemned' },
    BROKEN: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Broken' },
};

export function ToolReturnScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25, type: 'returns' };
        if (search) p.search = search;
        return p;
    }, [search, page]);

    const { data, isLoading } = useToolsAtMachine(params);
    const items = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Return Tool from Machine</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Record tool returns with usage data and outcome assessment</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Return Tool
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search returns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Machine</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actual Usage</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Outcome</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Life After</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12"><RotateCcw className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No tool returns found</p></td></tr>
                                )}
                                {items.map((item: any) => {
                                    const outcomeConfig = OUTCOME_BADGE_CONFIG[item.outcome] || OUTCOME_BADGE_CONFIG.STILL_USABLE;
                                    return (
                                        <tr key={item.id} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', item.outcome === 'BROKEN' && item.safetyIncidentFlag && 'bg-red-50/50 dark:bg-red-900/10')}>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.machine?.name || '--'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{Number(item.actualUsage ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', outcomeConfig.bg, outcomeConfig.text, outcomeConfig.border)}>
                                                    {outcomeConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-neutral-700 dark:text-neutral-300">{item.remainingLifeAfter != null ? Number(item.remainingLifeAfter).toLocaleString() : '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
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

            {showModal && <ReturnToolModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

function ReturnToolModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateToolReturn();
    const [form, setForm] = useState({
        toolAtMachineId: '',
        partId: '',
        machineId: '',
        actualUsage: 0,
        outcome: 'STILL_USABLE',
        breakageCause: '',
        breakageMachineId: '',
        breakageOperatorId: '',
        safetyIncidentFlag: false,
        remarks: '',
    });

    const handleSubmit = () => {
        const payload: any = {
            toolAtMachineId: form.toolAtMachineId || undefined,
            partId: form.partId || undefined,
            machineId: form.machineId || undefined,
            actualUsage: form.actualUsage,
            outcome: form.outcome,
            remarks: form.remarks || undefined,
        };
        if (form.outcome === 'BROKEN') {
            payload.breakageCause = form.breakageCause || undefined;
            payload.breakageMachineId = form.breakageMachineId || undefined;
            payload.breakageOperatorId = form.breakageOperatorId || undefined;
            payload.safetyIncidentFlag = form.safetyIncidentFlag;
        }
        createMutation.mutate(payload, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Return Tool from Machine</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Tool / Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Tool at machine" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Machine ID</label>
                        <input className={inputClass} value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} placeholder="From machine" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Actual Usage *</label>
                        <input type="number" min={0} className={inputClass} value={form.actualUsage} onChange={(e) => setForm({ ...form, actualUsage: Number(e.target.value) })} />
                    </div>
                </div>

                {/* Outcome Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Outcome *</label>
                    <div className="grid grid-cols-2 gap-3">
                        {OUTCOME_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const isSelected = form.outcome === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, outcome: opt.value })}
                                    className={cn(
                                        'rounded-xl border-2 p-3 text-left transition-all',
                                        isSelected
                                            ? opt.color === 'emerald' ? 'border-emerald-300 bg-emerald-50'
                                            : opt.color === 'amber' ? 'border-amber-300 bg-amber-50'
                                            : 'border-red-300 bg-red-50'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn('w-4 h-4', isSelected ? `text-${opt.color}-600` : 'text-neutral-400')} />
                                        <p className={cn('text-xs font-bold', isSelected ? `text-${opt.color}-700` : 'text-neutral-700 dark:text-neutral-300')}>{opt.label}</p>
                                    </div>
                                    <p className="text-[10px] text-neutral-500 mt-1">{opt.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {form.outcome === 'BROKEN' && (
                    <div className="space-y-3 p-3 rounded-xl bg-red-50/50 border border-red-200/50">
                        <div>
                            <label className="block text-sm font-medium text-red-700 mb-1">Breakage Cause</label>
                            <input className={inputClass} value={form.breakageCause} onChange={(e) => setForm({ ...form, breakageCause: e.target.value })} placeholder="Describe the cause" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-red-700 mb-1">Machine at Breakage</label>
                                <input className={inputClass} value={form.breakageMachineId} onChange={(e) => setForm({ ...form, breakageMachineId: e.target.value })} placeholder="Machine ID" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-red-700 mb-1">Operator ID</label>
                                <input className={inputClass} value={form.breakageOperatorId} onChange={(e) => setForm({ ...form, breakageOperatorId: e.target.value })} placeholder="Operator ID" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.safetyIncidentFlag} onChange={(e) => setForm({ ...form, safetyIncidentFlag: e.target.checked })} className="rounded border-red-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm font-medium text-red-700">Safety Incident</span>
                        </label>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                    <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!form.partId || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Return Tool'}
                    </button>
                </div>
            </div>
        </div>
    );
}
