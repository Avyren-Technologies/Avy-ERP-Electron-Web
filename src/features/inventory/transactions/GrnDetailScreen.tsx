import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Package } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useGrn } from '@/features/inventory/api/use-inventory-queries';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { cn } from '@/lib/utils';

const DISCREPANCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    OVER_RECEIPT: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Over Receipt' },
    SHORT_DELIVERY: { bg: 'bg-red-50', text: 'text-red-700', label: 'Short Delivery' },
    NONE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'None' },
};

export function GrnDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useGrn(id || '');

    const grn = data?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!grn) {
        return (
            <div className="flex-1 p-6 max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">GRN not found</p>
                    <button onClick={() => navigate('/app/inventory/grn')} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">Back to GRN list</button>
                </div>
            </div>
        );
    }

    const lineItems = grn.lineItems || grn.lines || [];

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/inventory/grn')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <ArrowLeft className="w-5 h-5 text-neutral-500" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {grn.grnNumber || grn.transactionNumber || 'GRN Detail'}
                        </h1>
                        <TransactionStatusBadge status={grn.status || 'DRAFT'} size="md" />
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">PO Reference</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{grn.poReference || grn.poNumber || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Supplier</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{grn.supplierName || grn.supplier?.name || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Warehouse</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{grn.warehouse?.code || grn.warehouseCode || '--'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Received At</p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {grn.receivedAt ? fmt.dateTime(grn.receivedAt) : grn.createdAt ? fmt.dateTime(grn.createdAt) : '--'}
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
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ordered</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Received</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Accepted</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rejected</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Short</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lot / Expiry</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Discrepancy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-neutral-400">No line items</td>
                                </tr>
                            )}
                            {lineItems.map((li: any, idx: number) => {
                                const discrepancy = li.discrepancyType || li.discrepancy || 'NONE';
                                const dConfig = DISCREPANCY_COLORS[discrepancy] || DISCREPANCY_COLORS.NONE;
                                return (
                                    <tr key={li.id || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{li.partNumber || li.part?.partNumber || '--'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[180px]">{li.partName || li.part?.name || ''}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{Number(li.orderedQty ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">{Number(li.receivedQty ?? li.quantity ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600">{Number(li.acceptedQty ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{Number(li.rejectedQty ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-amber-600">{Number(li.shortQty ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {li.lotNumber || '--'}
                                            {li.expiryDate && <span className="ml-1 text-neutral-400">/ {fmt.date(li.expiryDate)}</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', dConfig.bg, dConfig.text)}>
                                                {dConfig.label}
                                            </span>
                                        </td>
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
