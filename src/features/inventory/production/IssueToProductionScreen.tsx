import { useState, useMemo } from 'react';
import { Loader2, Plus, Factory, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useIssueToProduction } from '@/features/inventory/api/use-inventory-queries';
import { useCreateIssueToProduction } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { BomIssueCounter } from '@/features/inventory/shared/BomIssueCounter';
import { TRANSACTION_STATUS_CONFIG } from '@/features/inventory/shared/inventory-status-colors';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function IssueToProductionScreen() {
    const navigate = useNavigate();
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (statusFilter) p.status = statusFilter;
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        return p;
    }, [search, statusFilter, dateFrom, dateTo, page]);

    const { data, isLoading } = useIssueToProduction(params);
    const items = data?.data || [];
    const meta = data?.meta;

    const hasFilters = search || statusFilter || dateFrom || dateTo;
    const clearFilters = () => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue to Production</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Issue raw materials to work orders for production</p>
                </div>
                {canCreate && (
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Issue
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search issue or WO number..."
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
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issue #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">WO Reference</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Parts</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12">
                                            <Factory className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No issues found</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => navigate(`/app/inventory/production/issue/${item.id}`)}
                                        className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.issueNumber || item.transactionNumber || '--'}</td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.workOrderNumber || item.workOrder?.woNumber || '--'}</td>
                                        <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300 text-xs">{item.lineItems?.length || item.partCount || 0}</td>
                                        <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'DRAFT'} /></td>
                                        <td className="px-4 py-3">
                                            {item.isPartialIssue ? (
                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Partial</span>
                                            ) : (
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Full</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
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

            {showModal && <CreateIssueModal onClose={() => setShowModal(false)} />}
        </div>
    );
}

/* ── Create Issue Modal ── */

function CreateIssueModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateIssueToProduction();
    const [workOrderId, setWorkOrderId] = useState('');
    const [lineItems, setLineItems] = useState([
        { partId: '', bomRequiredQty: 0, issueQty: 1, lotId: '', serialIds: '', overIssueReason: '' },
    ]);
    const [hasOverIssue, setHasOverIssue] = useState(false);

    const addLine = () => setLineItems([...lineItems, { partId: '', bomRequiredQty: 0, issueQty: 1, lotId: '', serialIds: '', overIssueReason: '' }]);
    const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
    const updateLine = (idx: number, field: string, value: any) => {
        const updated = lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li);
        setLineItems(updated);
        setHasOverIssue(updated.some(li => li.issueQty > li.bomRequiredQty && li.bomRequiredQty > 0));
    };

    const canSubmit = workOrderId && lineItems.length > 0 && lineItems.every(li => li.partId && li.issueQty > 0);

    const handleSubmit = () => {
        createMutation.mutate(
            {
                workOrderId,
                lineItems: lineItems.map(li => ({
                    partId: li.partId,
                    issueQty: li.issueQty,
                    bomRequiredQty: li.bomRequiredQty || undefined,
                    lotId: li.lotId || undefined,
                    serialIds: li.serialIds ? li.serialIds.split(',').map((s: string) => s.trim()) : undefined,
                    overIssueReason: li.overIssueReason || undefined,
                })),
            },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-5xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">New Issue to Production</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Work Order ID *</label>
                        <input className={inputClass} value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} placeholder="Work Order ID" />
                    </div>
                </div>

                {hasOverIssue && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs font-medium">Some items exceed BOM required quantity. Please provide an over-issue reason for those lines.</p>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-neutral-400">Line Items</label>
                        <button onClick={addLine} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 space-y-2">
                        {lineItems.map((li, idx) => {
                            const isOverIssued = li.issueQty > li.bomRequiredQty && li.bomRequiredQty > 0;
                            return (
                                <div key={idx} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 grid grid-cols-4 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Part ID *</label>
                                                <input className={inputClass} value={li.partId} onChange={(e) => updateLine(idx, 'partId', e.target.value)} placeholder="Part ID" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">BOM Required</label>
                                                <input type="number" min={0} className={inputClass} value={li.bomRequiredQty} onChange={(e) => updateLine(idx, 'bomRequiredQty', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Issue Qty *</label>
                                                <input type="number" min={1} className={inputClass} value={li.issueQty} onChange={(e) => updateLine(idx, 'issueQty', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-neutral-500 mb-0.5">Lot ID</label>
                                                <input className={inputClass} value={li.lotId} onChange={(e) => updateLine(idx, 'lotId', e.target.value)} placeholder="Auto (FEFO/FIFO)" />
                                            </div>
                                        </div>
                                        {lineItems.length > 1 && (
                                            <button onClick={() => removeLine(idx)} className="mt-4 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                    {li.bomRequiredQty > 0 && (
                                        <BomIssueCounter bomRequired={li.bomRequiredQty} cumulativeIssued={li.issueQty} remaining={Math.max(0, li.bomRequiredQty - li.issueQty)} compact />
                                    )}
                                    {isOverIssued && (
                                        <div>
                                            <label className="block text-[10px] font-medium text-amber-600 mb-0.5">Over-issue Reason *</label>
                                            <input className={inputClass} value={li.overIssueReason} onChange={(e) => updateLine(idx, 'overIssueReason', e.target.value)} placeholder="Reason for exceeding BOM qty" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue to Production'}
                    </button>
                </div>
            </div>
        </div>
    );
}
