import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useCount } from '@/features/inventory/api/use-inventory-queries';
import { useEnterCount, useSubmitCount, useApproveCount } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const COUNT_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CREATED: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Created' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'In Progress' },
    VARIANCE_COMPUTED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Variance Computed' },
    PENDING_APPROVAL: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Pending Approval' },
    CLOSED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Closed' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Cancelled' },
};

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function CountDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canApprove = useCanPerform('inventory.counts:approve');
    const { data, isLoading } = useCount(id || '');
    const enterCountMutation = useEnterCount();
    const submitMutation = useSubmitCount();
    const approveMutation = useApproveCount();

    const count = data?.data;
    const status = count?.status || 'CREATED';
    const lineItems = count?.lineItems || count?.lines || [];
    const isEditable = status === 'CREATED' || status === 'IN_PROGRESS';
    const showVariance = status === 'VARIANCE_COMPUTED' || status === 'PENDING_APPROVAL' || status === 'CLOSED';

    const [physicalQtys, setPhysicalQtys] = useState<Record<string, number>>({});

    const updatePhysicalQty = (lineId: string, value: number) => {
        setPhysicalQtys(prev => ({ ...prev, [lineId]: value }));
    };

    const handleSaveEntries = () => {
        if (!id) return;
        const entries = Object.entries(physicalQtys).map(([lineItemId, physicalQty]) => ({
            lineItemId,
            physicalQty,
        }));
        if (entries.length > 0) {
            enterCountMutation.mutate({ id, data: { entries } });
        }
    };

    const handleSubmit = () => {
        if (!id) return;
        submitMutation.mutate(id);
    };

    const handleApprove = () => {
        if (!id) return;
        approveMutation.mutate({ id });
    };

    const handleReject = () => {
        if (!id) return;
        approveMutation.mutate({ id, data: { action: 'REJECT' } });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }

    if (!count) {
        return (
            <div className="flex-1 p-6 max-w-5xl mx-auto text-center py-20">
                <ClipboardList className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">Count not found</p>
                <button onClick={() => navigate('/app/inventory/counts')} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">Back to counts</button>
            </div>
        );
    }

    const statusConfig = COUNT_STATUS_CONFIG[status] || COUNT_STATUS_CONFIG.CREATED;

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/inventory/counts')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <ArrowLeft className="w-5 h-5 text-neutral-500" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {count.countNumber || 'Count Detail'}
                        </h1>
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-xs', statusConfig.bg, statusConfig.text, statusConfig.border)}>
                            {statusConfig.label}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditable && (
                        <>
                            <button
                                onClick={handleSaveEntries}
                                disabled={enterCountMutation.isPending || Object.keys(physicalQtys).length === 0}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 disabled:opacity-50 transition-colors"
                            >
                                {enterCountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Entries'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Count'}
                            </button>
                        </>
                    )}
                    {status === 'PENDING_APPROVAL' && canApprove && (
                        <>
                            <button
                                onClick={handleApprove}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Type</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{count.type || count.countType || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Warehouse</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{count.warehouse?.code || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Scheduled</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{count.scheduledDate ? fmt.date(count.scheduledDate) : '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{count.completedAt ? fmt.dateTime(count.completedAt) : '--'}</p>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Count Items ({lineItems.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                {showVariance && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">System Qty</th>}
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {isEditable ? 'Physical Qty' : 'Physical Qty'}
                                </th>
                                {showVariance && (
                                    <>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tolerance</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.length === 0 && (
                                <tr><td colSpan={showVariance ? 5 : 2} className="text-center py-8 text-neutral-400">No items in this count</td></tr>
                            )}
                            {lineItems.map((li: any) => {
                                const systemQty = Number(li.systemQty ?? li.expectedQty ?? 0);
                                const physicalQty = physicalQtys[li.id] ?? li.physicalQty ?? li.countedQty;
                                const variance = physicalQty != null ? Number(physicalQty) - systemQty : null;
                                const tolerancePct = li.tolerancePct ?? 5;
                                const withinTolerance = variance != null ? Math.abs(variance) <= (systemQty * tolerancePct / 100) : null;

                                return (
                                    <tr key={li.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{li.partNumber || li.part?.partNumber || '--'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[200px]">{li.partName || li.part?.name || ''}</p>
                                        </td>
                                        {showVariance && (
                                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{systemQty.toLocaleString()}</td>
                                        )}
                                        <td className="px-4 py-3 text-right">
                                            {isEditable ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-24 ml-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm text-right text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                                                    value={physicalQtys[li.id] ?? (li.physicalQty ?? li.countedQty ?? '')}
                                                    onChange={(e) => updatePhysicalQty(li.id, Number(e.target.value))}
                                                    placeholder="--"
                                                />
                                            ) : (
                                                <span className="font-medium text-neutral-900 dark:text-white">
                                                    {physicalQty != null ? Number(physicalQty).toLocaleString() : '--'}
                                                </span>
                                            )}
                                        </td>
                                        {showVariance && (
                                            <>
                                                <td className="px-4 py-3 text-right">
                                                    {variance != null ? (
                                                        <span className={`font-bold ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                                                            {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                                        </span>
                                                    ) : '--'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {withinTolerance != null && (
                                                        <span className={cn(
                                                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                                            withinTolerance ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
                                                        )}>
                                                            {withinTolerance ? 'Within' : 'Above'}
                                                        </span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
