import { useState, useMemo } from 'react';
import { Loader2, Plus, Search, CheckCircle, Wrench, Clock, AlertTriangle } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useReconditioning, useOverdueReconditioning } from '@/features/inventory/api/use-inventory-queries';
import { useInitiateReconditioning, useCompleteReconditioning } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const RECON_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    INITIATED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Initiated' },
    IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'In Progress' },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    OVERDUE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Overdue' },
};

export function ReconditioningScreen() {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [tab, setTab] = useState<'active' | 'completed' | 'overdue'>('active');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [completeItem, setCompleteItem] = useState<any>(null);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (tab === 'active') p.status = 'INITIATED,IN_PROGRESS';
        if (tab === 'completed') p.status = 'COMPLETED';
        return p;
    }, [search, page, tab]);

    const { data, isLoading } = useReconditioning(tab !== 'overdue' ? params : undefined);
    const { data: overdueData, isLoading: overdueLoading } = useOverdueReconditioning();

    const items = tab === 'overdue' ? (overdueData?.data || []) : (data?.data || []);
    const meta = tab !== 'overdue' ? data?.meta : undefined;
    const loading = tab === 'overdue' ? overdueLoading : isLoading;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reconditioning</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Track tool reconditioning, resharpening, and refurbishment</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowInitiateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Initiate Reconditioning
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    {[
                        { key: 'active' as const, label: 'Active', icon: Clock },
                        { key: 'completed' as const, label: 'Completed', icon: CheckCircle },
                        { key: 'overdue' as const, label: 'Overdue', icon: AlertTriangle },
                    ].map(t => (
                        <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.key ? 'bg-white dark:bg-neutral-700 text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}>
                            <t.icon className="w-4 h-4" /> {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Serial</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cycle #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vendor</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expected Return</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cost</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr><td colSpan={9} className="text-center py-12"><Wrench className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-400">No reconditioning records found</p></td></tr>
                                )}
                                {items.map((item: any) => {
                                    const statusKey = tab === 'overdue' ? 'OVERDUE' : (item.status || 'INITIATED');
                                    const statusConfig = RECON_STATUS_CONFIG[statusKey] || RECON_STATUS_CONFIG.INITIATED;
                                    return (
                                        <tr key={item.id} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', tab === 'overdue' && 'bg-red-50/30 dark:bg-red-900/10')}>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500">{item.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-600">{item.serialNumber || '--'}</td>
                                            <td className="px-4 py-3 text-center font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.cycleNumber ?? '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', item.reconType === 'EXTERNAL' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>
                                                    {item.reconType || '--'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.vendor?.name || item.vendorName || '--'}</td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusConfig.bg, statusConfig.text, statusConfig.border)}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">{item.expectedReturnDate ? fmt.date(item.expectedReturnDate) : '--'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">{item.cost != null ? Number(item.cost).toLocaleString() : '--'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {(item.status === 'INITIATED' || item.status === 'IN_PROGRESS') && canCreate && (
                                                    <button onClick={() => setCompleteItem(item)} className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                                        Complete
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

            {showInitiateModal && <InitiateReconditioningModal onClose={() => setShowInitiateModal(false)} />}
            {completeItem && <CompleteReconditioningModal item={completeItem} onClose={() => setCompleteItem(null)} />}
        </div>
    );
}

function InitiateReconditioningModal({ onClose }: { onClose: () => void }) {
    const initiateMutation = useInitiateReconditioning();
    const [form, setForm] = useState({
        partId: '',
        serialNumber: '',
        reconType: 'INTERNAL',
        vendorId: '',
        expectedReturnDate: '',
        remarks: '',
    });

    const handleSubmit = () => {
        initiateMutation.mutate({
            partId: form.partId,
            serialNumber: form.serialNumber || undefined,
            reconType: form.reconType,
            vendorId: form.reconType === 'EXTERNAL' ? form.vendorId : undefined,
            expectedReturnDate: form.expectedReturnDate || undefined,
            remarks: form.remarks || undefined,
        }, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Initiate Reconditioning</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Tool Part ID *</label>
                        <input className={inputClass} value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} placeholder="Tool to recondition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Serial Number</label>
                        <input className={inputClass} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="Optional" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Reconditioning Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['INTERNAL', 'EXTERNAL'].map(type => (
                                <button key={type} type="button" onClick={() => setForm({ ...form, reconType: type })} className={cn('rounded-xl border-2 p-3 text-left transition-all', form.reconType === type ? type === 'INTERNAL' ? 'border-blue-300 bg-blue-50' : 'border-violet-300 bg-violet-50' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300')}>
                                    <p className={cn('text-xs font-bold', form.reconType === type ? type === 'INTERNAL' ? 'text-blue-700' : 'text-violet-700' : 'text-neutral-700 dark:text-neutral-300')}>
                                        {type}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">{type === 'INTERNAL' ? 'In-house reconditioning' : 'Send to external vendor'}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.reconType === 'EXTERNAL' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Vendor ID</label>
                                <input className={inputClass} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} placeholder="External vendor" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Expected Return Date</label>
                                <input type="date" className={inputClass} value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!form.partId || initiateMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {initiateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CompleteReconditioningModal({ item, onClose }: { item: any; onClose: () => void }) {
    const completeMutation = useCompleteReconditioning();
    const [form, setForm] = useState({
        actualReturnDate: new Date().toISOString().split('T')[0],
        cost: 0,
        remarks: '',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Complete Reconditioning</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-xs text-neutral-500">Tool: <span className="font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || item.partId}</span></p>
                    <p className="text-xs text-neutral-500">Cycle: <span className="font-bold text-neutral-700 dark:text-neutral-300">#{item.cycleNumber}</span></p>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Actual Return Date *</label>
                        <input type="date" className={inputClass} value={form.actualReturnDate} onChange={(e) => setForm({ ...form, actualReturnDate: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Cost</label>
                        <input type="number" min={0} step={0.01} className={inputClass} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                        <input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={() => completeMutation.mutate({ id: item.id, data: { actualReturnDate: form.actualReturnDate, cost: form.cost, remarks: form.remarks || undefined } }, { onSuccess: () => onClose() })} disabled={completeMutation.isPending} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                        {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
