import { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImportJobs } from '@/features/inventory/api/use-inventory-queries';
import { inventoryApi } from '@/features/inventory/api/inventory-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryKeys } from '@/features/inventory/api/inventory-keys';
import { showSuccess, showApiError } from '@/lib/toast';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

const ENTITY_TYPES = [
    { key: 'opening-stock', label: 'Opening Stock', description: 'Import initial stock balances' },
    { key: 'item-master', label: 'Item Master', description: 'Import parts / items' },
    { key: 'warehouse', label: 'Warehouse', description: 'Import warehouse definitions' },
];

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-neutral-100 text-neutral-600',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
};

export function InventoryImportScreen() {
    const fmt = useCompanyFormatter();
    const queryClient = useQueryClient();
    const [entityType, setEntityType] = useState('opening-stock');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [previewData, setPreviewData] = useState<any>(null);
    const [jobId, setJobId] = useState('');

    const { data: jobsData, isLoading: jobsLoading } = useImportJobs();
    const jobs = jobsData?.data || [];

    const previewMutation = useMutation({
        mutationFn: (formData: any) => inventoryApi.previewImport(formData),
        onSuccess: (res) => {
            setPreviewData(res.data);
            setJobId(res.data?.jobId || '');
            setStep(2);
        },
        onError: showApiError,
    });

    const commitMutation = useMutation({
        mutationFn: (id: string) => inventoryApi.commitImport(id),
        onSuccess: () => {
            showSuccess('Import committed successfully');
            setStep(3);
            queryClient.invalidateQueries({ queryKey: inventoryKeys.importJobs() });
        },
        onError: showApiError,
    });

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        previewMutation.mutate(formData as any);
    }, [entityType, previewMutation]);

    const handleReset = () => {
        setStep(1);
        setPreviewData(null);
        setJobId('');
    };

    const rows = previewData?.rows || [];
    const validCount = rows.filter((r: any) => !r.errors?.length).length;
    const errorCount = rows.filter((r: any) => r.errors?.length > 0).length;

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Import Data</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Upload CSV files to import inventory data</p>
                </div>
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={entityType}
                    onChange={(e) => { setEntityType(e.target.value); handleReset(); }}
                >
                    {ENTITY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                            step >= s ? 'bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500',
                        )}>
                            {s}
                        </div>
                        <span className={cn('text-sm font-medium', step >= s ? 'text-neutral-900 dark:text-white' : 'text-neutral-400')}>
                            {s === 1 ? 'Upload' : s === 2 ? 'Preview' : 'Done'}
                        </span>
                        {s < 3 && <div className={cn('w-12 h-0.5', step > s ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700')} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-8">
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-12 text-center hover:border-primary-400 transition-colors">
                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-700 dark:text-neutral-300 font-medium mb-2">
                            Drop your CSV file here or click to browse
                        </p>
                        <p className="text-sm text-neutral-400 mb-4">
                            Supported: .csv, .xlsx (max 10MB)
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer transition-colors">
                            <FileSpreadsheet className="w-4 h-4" />
                            Choose File
                            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
                        </label>
                        {previewMutation.isPending && (
                            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary-600">
                                <Loader2 className="w-4 h-4 animate-spin" /> Processing file...
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
                            <Download className="w-4 h-4" /> Download Template
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && previewData && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium text-emerald-700">{validCount} valid</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-red-700">{errorCount} errors</span>
                        </div>
                        <span className="text-sm text-neutral-400">{rows.length} total rows</span>
                        <div className="flex-1" />
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-800"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Re-upload
                        </button>
                        <button
                            onClick={() => commitMutation.mutate(jobId)}
                            disabled={errorCount > 0 || commitMutation.isPending}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                errorCount > 0
                                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-700',
                            )}
                        >
                            {commitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Commit Import'}
                        </button>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/50 z-10">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-neutral-500 w-10">#</th>
                                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                                        {(previewData.columns || []).map((col: string) => (
                                            <th key={col} className="text-left px-4 py-3 font-medium text-neutral-500">{col}</th>
                                        ))}
                                        <th className="text-left px-4 py-3 font-medium text-neutral-500">Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {rows.map((row: any, i: number) => {
                                        const hasError = row.errors?.length > 0;
                                        return (
                                            <tr key={i} className={cn(hasError ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500')}>
                                                <td className="px-4 py-2 text-neutral-400">{i + 1}</td>
                                                <td className="px-4 py-2">
                                                    {hasError
                                                        ? <XCircle className="w-4 h-4 text-red-500" />
                                                        : <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    }
                                                </td>
                                                {(previewData.columns || []).map((col: string) => (
                                                    <td key={col} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 max-w-[200px] truncate">
                                                        {row.data?.[col] ?? '-'}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-2 text-xs text-red-600 max-w-[250px]">
                                                    {(row.errors || []).join('; ')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Import Complete</h2>
                    <p className="text-neutral-500 mb-6">{validCount} records imported successfully</p>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                    >
                        Import More
                    </button>
                </div>
            )}

            {/* Recent Jobs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Recent Import Jobs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Entity</th>
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">File</th>
                                <th className="text-left px-5 py-3 font-medium text-neutral-500">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Rows</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Errors</th>
                                <th className="text-right px-5 py-3 font-medium text-neutral-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {jobsLoading && (
                                <tr><td colSpan={6} className="px-5 py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-500" /></td></tr>
                            )}
                            {!jobsLoading && jobs.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-neutral-400">No import jobs yet</td></tr>
                            )}
                            {jobs.map((j: any) => (
                                <tr key={j.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-white">{j.entityType}</td>
                                    <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">{j.fileName || '-'}</td>
                                    <td className="px-5 py-3">
                                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[j.status] || STATUS_COLORS.PENDING)}>
                                            {j.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-neutral-700 dark:text-neutral-300">{j.totalRows ?? '-'}</td>
                                    <td className="px-5 py-3 text-right text-red-600">{j.errorCount ?? 0}</td>
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
