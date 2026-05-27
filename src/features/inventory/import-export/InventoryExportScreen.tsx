import { useState } from 'react';
import { Download, FileSpreadsheet, Package, ArrowLeftRight, ClipboardCheck, SlidersHorizontal, Loader2, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImportJobs, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { inventoryApi } from '@/features/inventory/api/inventory-api';
import { inventoryKeys } from '@/features/inventory/api/inventory-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showApiError } from '@/lib/toast';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

const selectClass = 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none';

const EXPORT_TYPES = [
    { key: 'stock-on-hand', label: 'Stock on Hand', description: 'Current stock levels across all warehouses', icon: Package },
    { key: 'transactions', label: 'Transactions', description: 'Receipt, dispatch, transfer, and adjustment records', icon: ArrowLeftRight },
    { key: 'counts', label: 'Counts', description: 'Physical count records and variance data', icon: ClipboardCheck },
    { key: 'adjustments', label: 'Adjustments', description: 'Stock adjustment history with reasons', icon: SlidersHorizontal },
    { key: 'parts', label: 'Parts', description: 'Item master data with policies', icon: Boxes },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-neutral-100 text-neutral-600',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
};

export function InventoryExportScreen() {
    const fmt = useCompanyFormatter();
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [status, setStatus] = useState('');

    const { data: whData } = useWarehouses();
    const { data: jobsData, isLoading: jobsLoading } = useImportJobs({ type: 'export' });
    const warehouses = whData?.data || [];
    const jobs = jobsData?.data || [];

    const exportMutation = useMutation({
        mutationFn: (data: any) => inventoryApi.exportData(data),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory-${selectedType}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            showSuccess('Export downloaded successfully');
            queryClient.invalidateQueries({ queryKey: inventoryKeys.importJobs() });
            setSelectedType('');
        },
        onError: showApiError,
    });

    const handleExport = () => {
        exportMutation.mutate({
            exportType: selectedType,
            ...(dateFrom ? { dateFrom } : {}),
            ...(dateTo ? { dateTo } : {}),
            ...(warehouseId ? { warehouseId } : {}),
            ...(status ? { status } : {}),
        });
    };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Export Data</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Download inventory data as CSV files</p>
            </div>

            {/* Export Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXPORT_TYPES.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setSelectedType(t.key === selectedType ? '' : t.key)}
                        className={cn(
                            'text-left p-5 rounded-2xl border shadow-sm transition-all',
                            selectedType === t.key
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 ring-2 ring-primary-500/20'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 hover:shadow-md',
                        )}
                    >
                        <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                            selectedType === t.key ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800',
                        )}>
                            <t.icon className={cn('w-5 h-5', selectedType === t.key ? 'text-white' : 'text-neutral-500')} />
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t.label}</p>
                        <p className="text-xs text-neutral-500 mt-1">{t.description}</p>
                    </button>
                ))}
            </div>

            {/* Filter Panel */}
            {selectedType && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Filters</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">From</label>
                            <input type="date" className={selectClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">To</label>
                            <input type="date" className={selectClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Warehouse</label>
                            <select className={selectClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                                <option value="">All</option>
                                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Status</label>
                            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="BLOCKED">Blocked</option>
                                <option value="QUARANTINE">Quarantine</option>
                            </select>
                        </div>
                        <div className="pt-5">
                            <button
                                onClick={handleExport}
                                disabled={exportMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {exportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Exports */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Recent Exports</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Type</th>
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Rows</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {jobsLoading && (
                                <tr><td colSpan={4} className="px-5 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-500" /></td></tr>
                            )}
                            {!jobsLoading && jobs.length === 0 && (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-400">No exports yet</td></tr>
                            )}
                            {jobs.map((j: any) => (
                                <tr key={j.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">{j.entityType || j.exportType}</td>
                                    <td className="px-5 py-3">
                                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[j.status] || STATUS_COLORS.PENDING)}>
                                            {j.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-neutral-700 dark:text-neutral-300">{j.totalRows ?? '-'}</td>
                                    <td className="px-5 py-3 text-right text-neutral-500">{j.createdAt ? fmt.dateTime(j.createdAt) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
