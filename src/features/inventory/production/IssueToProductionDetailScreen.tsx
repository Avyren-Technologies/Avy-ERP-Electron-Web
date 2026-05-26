import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Factory } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useIssueToProductionDetail, useWipStock } from '@/features/inventory/api/use-inventory-queries';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { BomIssueCounter } from '@/features/inventory/shared/BomIssueCounter';
import { WipBalanceCard } from '@/features/inventory/shared/WipBalanceCard';
import { cn } from '@/lib/utils';

export function IssueToProductionDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useIssueToProductionDetail(id || '');
    const issue = data?.data;

    const { data: wipData } = useWipStock(
        issue?.workOrderId ? { workOrderId: issue.workOrderId } : undefined,
    );
    const wipItems = wipData?.data || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="flex-1 p-6 max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <Factory className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">Issue not found</p>
                    <button onClick={() => navigate('/app/inventory/production/issue')} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">Back to issues</button>
                </div>
            </div>
        );
    }

    const lineItems = issue.lineItems || issue.lines || [];

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/inventory/production/issue')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <ArrowLeft className="w-5 h-5 text-neutral-500" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {issue.issueNumber || issue.transactionNumber || 'Issue Detail'}
                        </h1>
                        <TransactionStatusBadge status={issue.status || 'DRAFT'} size="md" />
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5">WO: {issue.workOrderNumber || issue.workOrder?.woNumber || '--'}</p>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Work Order</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{issue.workOrderNumber || issue.workOrder?.woNumber || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Warehouse</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{issue.warehouse?.code || issue.warehouseCode || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Issue Type</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {issue.isPartialIssue ? (
                                <span className="text-amber-600">Partial Issue</span>
                            ) : (
                                <span className="text-emerald-600">Full Issue</span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {issue.createdAt ? fmt.dateTime(issue.createdAt) : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Line Items ({lineItems.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">BOM Req</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Issued</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cumulative</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Remaining</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lot</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Over-Issue</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-neutral-400">No line items</td>
                                </tr>
                            )}
                            {lineItems.map((li: any, idx: number) => {
                                const bomReq = Number(li.bomRequiredQty ?? 0);
                                const issued = Number(li.issuedQty ?? li.issueQty ?? li.quantity ?? 0);
                                const cumulative = Number(li.cumulativeIssuedQty ?? issued);
                                const remaining = Number(li.remainingQty ?? Math.max(0, bomReq - cumulative));
                                const isOverIssued = cumulative > bomReq && bomReq > 0;
                                return (
                                    <tr key={li.id || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{li.partNumber || li.part?.partNumber || '--'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[160px]">{li.partName || li.part?.name || ''}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{bomReq.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">{issued.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{cumulative.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={cn('font-medium', remaining > 0 ? 'text-neutral-700' : 'text-emerald-600')}>
                                                {remaining.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">{li.lotNumber || li.lot?.lotNumber || '--'}</td>
                                        <td className="px-4 py-3">
                                            {isOverIssued ? (
                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Yes</span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 min-w-[140px]">
                                            {bomReq > 0 && (
                                                <BomIssueCounter bomRequired={bomReq} cumulativeIssued={cumulative} remaining={remaining} compact />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* WIP Balance */}
            {wipItems.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">WIP Balance for this Work Order</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {wipItems.map((wip: any) => (
                            <WipBalanceCard
                                key={wip.partId || wip.id}
                                partName={wip.partName || wip.part?.name}
                                partNumber={wip.partNumber || wip.part?.partNumber}
                                items={[
                                    { label: 'Available in Store', qty: Number(wip.availableInStore ?? 0) },
                                    { label: 'In Production / WIP', qty: Number(wip.inProductionWip ?? wip.wipQty ?? 0) },
                                    { label: 'Reserved', qty: Number(wip.reserved ?? 0) },
                                ]}
                                totalQty={Number(wip.totalQty ?? 0)}
                                freeToAllocate={Number(wip.freeToAllocate ?? 0)}
                                uom={wip.uom}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
