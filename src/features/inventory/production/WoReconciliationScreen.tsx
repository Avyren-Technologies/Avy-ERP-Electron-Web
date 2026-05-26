import { useState } from 'react';
import { Loader2, ClipboardList, RefreshCw, Search } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useWoReconciliation } from '@/features/inventory/api/use-inventory-queries';
import { useGenerateWoReconciliation } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function WoReconciliationScreen() {
    const fmt = useCompanyFormatter();
    const [workOrderId, setWorkOrderId] = useState('');
    const [selectedWo, setSelectedWo] = useState('');

    const { data, isLoading, isFetching } = useWoReconciliation(selectedWo);
    const generateMutation = useGenerateWoReconciliation();

    const reconciliation = data?.data;
    const lines = reconciliation?.lines || reconciliation?.items || [];
    const hasData = lines.length > 0;

    const handleSearch = () => {
        if (workOrderId.trim()) {
            setSelectedWo(workOrderId.trim());
        }
    };

    const handleGenerate = () => {
        if (selectedWo) {
            generateMutation.mutate(selectedWo);
        }
    };

    // Compute summary totals
    const totals = lines.reduce(
        (acc: any, li: any) => ({
            bomRequired: acc.bomRequired + Number(li.bomRequiredQty ?? 0),
            totalIssued: acc.totalIssued + Number(li.totalIssuedQty ?? 0),
            returned: acc.returned + Number(li.returnedQty ?? 0),
            scrapped: acc.scrapped + Number(li.scrappedQty ?? 0),
            consumedInFg: acc.consumedInFg + Number(li.consumedInFgQty ?? 0),
            variance: acc.variance + Number(li.varianceQty ?? 0),
        }),
        { bomRequired: 0, totalIssued: 0, returned: 0, scrapped: 0, consumedInFg: 0, variance: 0 },
    );

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WO Material Reconciliation</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Reconcile material usage against BOM requirements for a work order</p>
            </div>

            {/* WO Selector */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Enter Work Order ID..."
                        value={workOrderId}
                        onChange={(e) => setWorkOrderId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button onClick={handleSearch} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                    Load
                </button>
                {selectedWo && (
                    <button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {hasData ? 'Refresh Reconciliation' : 'Generate Reconciliation'}
                    </button>
                )}
            </div>

            {/* Content */}
            {!selectedWo ? (
                <div className="text-center py-20">
                    <ClipboardList className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm">Enter a Work Order ID to view material reconciliation</p>
                </div>
            ) : isLoading || isFetching ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : !hasData ? (
                <div className="text-center py-20">
                    <ClipboardList className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm mb-3">No reconciliation data available for this work order</p>
                    <button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                        Generate Reconciliation
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    {/* WO Info */}
                    {reconciliation?.workOrder && (
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold text-neutral-900 dark:text-white">
                                    {reconciliation.workOrder.woNumber || selectedWo}
                                </span>
                                {reconciliation.workOrder.fgPartName && (
                                    <span className="text-neutral-500">FG: {reconciliation.workOrder.fgPartName}</span>
                                )}
                                {reconciliation.generatedAt && (
                                    <span className="text-neutral-400 text-xs ml-auto">Generated: {fmt.dateTime(reconciliation.generatedAt)}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">BOM Required</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Issued</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Returned</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Scrapped</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Consumed in FG</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((li: any, idx: number) => {
                                    const variance = Number(li.varianceQty ?? 0);
                                    return (
                                        <tr key={li.partId || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{li.partNumber || li.part?.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500 truncate max-w-[160px]">{li.partName || li.part?.name || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{Number(li.bomRequiredQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-white">{Number(li.totalIssuedQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-blue-600">{Number(li.returnedQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-red-600">{Number(li.scrappedQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-emerald-600">{Number(li.consumedInFgQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={cn(
                                                    'font-bold',
                                                    variance === 0 ? 'text-emerald-600' : variance > 0 ? 'text-amber-600' : 'text-red-600',
                                                )}>
                                                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Summary row */}
                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold">
                                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400 uppercase">Totals</td>
                                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{totals.bomRequired.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-neutral-900 dark:text-white">{totals.totalIssued.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-blue-600">{totals.returned.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-red-600">{totals.scrapped.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">{totals.consumedInFg.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn(
                                            'font-bold',
                                            totals.variance === 0 ? 'text-emerald-600' : totals.variance > 0 ? 'text-amber-600' : 'text-red-600',
                                        )}>
                                            {totals.variance > 0 ? '+' : ''}{totals.variance.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
