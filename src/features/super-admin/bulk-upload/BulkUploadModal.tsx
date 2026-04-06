// ============================================================
// Bulk Upload Modal — 3-step wizard (template → validate → import)
// ============================================================
import { useState, useRef } from 'react';
import {
    X,
    Download,
    Upload,
    CheckCircle,
    XCircle,
    Loader2,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';
import {
    downloadCompanyTemplate,
    useBulkValidateCompanies,
    useBulkImportCompanies,
} from '@/features/super-admin/api/use-tenant-queries';
import type {
    BulkValidationResult,
    ValidatedCompany,
    BulkImportResult,
} from './bulk-upload-utils';

interface BulkUploadModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const STEPS = ['Download Template', 'Upload & Validate', 'Import Results'];

export function BulkUploadModal({ onClose, onSuccess }: Readonly<BulkUploadModalProps>) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [validationResult, setValidationResult] = useState<BulkValidationResult | null>(null);
    const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
    const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateMutation = useBulkValidateCompanies();
    const importMutation = useBulkImportCompanies();

    const resetState = () => {
        setStep(1);
        setFile(null);
        setValidationResult(null);
        setImportResult(null);
        setExpandedErrors(new Set());
        setDragOver(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDone = () => {
        onSuccess?.();
        handleClose();
    };

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            await downloadCompanyTemplate();
            showSuccess('Template Downloaded', 'The Excel template has been downloaded.');
        } catch (err) {
            showApiError(err);
        } finally {
            setDownloading(false);
        }
    };

    const handleFileSelect = (selected: File | null) => {
        setFile(selected);
        setValidationResult(null);
        setExpandedErrors(new Set());
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0] ?? null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.name.endsWith('.xlsx')) {
            handleFileSelect(dropped);
        }
    };

    const handleValidate = () => {
        if (!file) return;
        validateMutation.mutate(file, {
            onSuccess: (result) => {
                const payload = result?.data as BulkValidationResult;
                setValidationResult(payload);
            },
            onError: (err) => showApiError(err),
        });
    };

    const handleReUpload = () => {
        setFile(null);
        setValidationResult(null);
        setExpandedErrors(new Set());
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = () => {
        if (!validationResult) return;
        const validCompanies = validationResult.companies
            .filter((c) => c.valid && c.payload)
            .map((c) => ({ name: c.name, payload: c.payload }));
        if (validCompanies.length === 0) return;

        setStep(3);
        importMutation.mutate(validCompanies, {
            onSuccess: (result) => {
                const payload = result?.data as BulkImportResult;
                setImportResult(payload);
                showSuccess('Import Complete', `${payload.successCount} company(ies) created successfully.`);
            },
            onError: (err) => showApiError(err),
        });
    };

    const toggleErrorExpand = (rowIndex: number) => {
        setExpandedErrors((prev) => {
            const next = new Set(prev);
            if (next.has(rowIndex)) next.delete(rowIndex);
            else next.add(rowIndex);
            return next;
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">Bulk Company Upload</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Onboard multiple companies from an Excel file
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                    {STEPS.map((label, i) => {
                        const stepNum = i + 1;
                        const isActive = step === stepNum;
                        const isCompleted = step > stepNum;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                {i > 0 && (
                                    <div className={cn(
                                        'w-8 h-px',
                                        isCompleted || isActive ? 'bg-primary-400' : 'bg-neutral-200 dark:bg-neutral-700'
                                    )} />
                                )}
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                        isActive
                                            ? 'bg-primary-600 text-white'
                                            : isCompleted
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                                                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                                    )}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            stepNum
                                        )}
                                    </span>
                                    <span className={cn(
                                        'text-xs font-medium hidden sm:inline',
                                        isActive
                                            ? 'text-primary-700 dark:text-primary-400'
                                            : 'text-neutral-400 dark:text-neutral-500'
                                    )}>
                                        {label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* ── Step 1: Download Template ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold text-primary-950 dark:text-white">
                                    Step 1: Download Template
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Download the Excel template, fill in your company data across all sheets, and proceed to upload.
                                    Each sheet corresponds to a step in the onboarding wizard.
                                </p>
                            </div>
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4 flex items-start gap-3">
                                <FileSpreadsheet className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-primary-700 dark:text-primary-300">
                                    <p className="font-semibold">Template includes:</p>
                                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-primary-600 dark:text-primary-400">
                                        <li>15 sheets matching the onboarding wizard steps</li>
                                        <li>Required fields marked with * and sample data in Row 2</li>
                                        <li>Display Name column links data across sheets for the same company</li>
                                    </ul>
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadTemplate}
                                disabled={downloading}
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                            >
                                {downloading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {downloading ? 'Downloading...' : 'Download Template'}
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Upload & Validate ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold text-primary-950 dark:text-white">
                                    Step 2: Upload & Validate
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    Upload your filled template and validate the data before importing.
                                </p>
                            </div>

                            {/* File Dropzone */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                                    Excel File (.xlsx)
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                                        dragOver
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : file
                                                ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/10'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileSpreadsheet className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-primary-950 dark:text-white">{file.name}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                                                Click to select or drag & drop your Excel file
                                            </p>
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                                Only .xlsx files are supported
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Validate Button */}
                            {!validationResult && (
                                <button
                                    onClick={handleValidate}
                                    disabled={!file || validateMutation.isPending}
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                                >
                                    {validateMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Validate
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Validation Results */}
                            {validationResult && (
                                <div className="space-y-4">
                                    {/* Summary Bar */}
                                    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                            <span className="text-success-600 dark:text-success-400">{validationResult.validCount} valid</span>
                                            {', '}
                                            <span className="text-danger-600 dark:text-danger-400">{validationResult.errorCount} errors</span>
                                            {' out of '}
                                            <span>{validationResult.totalCompanies} companies</span>
                                        </span>
                                    </div>

                                    {/* Company Cards */}
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {validationResult.companies.map((company: ValidatedCompany) => {
                                            const hasErrors = !company.valid && company.errors && company.errors.length > 0;
                                            const isExpanded = expandedErrors.has(company.rowIndex);

                                            return (
                                                <div
                                                    key={company.rowIndex}
                                                    className={cn(
                                                        'border rounded-xl overflow-hidden',
                                                        company.valid
                                                            ? 'border-success-200 dark:border-success-800/40'
                                                            : 'border-danger-200 dark:border-danger-800/50'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'flex items-center gap-3 px-4 py-3',
                                                            company.valid
                                                                ? 'bg-success-50 dark:bg-success-900/10'
                                                                : 'bg-danger-50 dark:bg-danger-900/10',
                                                            hasErrors && 'cursor-pointer hover:bg-danger-100 dark:hover:bg-danger-900/20 transition-colors'
                                                        )}
                                                        onClick={() => hasErrors && toggleErrorExpand(company.rowIndex)}
                                                    >
                                                        {company.valid ? (
                                                            <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 shrink-0" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-danger-600 dark:text-danger-400 shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-primary-950 dark:text-white truncate">
                                                                {company.name}
                                                            </p>
                                                            {hasErrors && (
                                                                <p className="text-xs text-danger-600 dark:text-danger-400">
                                                                    {company.errors!.length} error{company.errors!.length !== 1 ? 's' : ''} found
                                                                </p>
                                                            )}
                                                        </div>
                                                        {company.valid ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                                                                VALID
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400">
                                                                    ERRORS
                                                                </span>
                                                                {hasErrors && (
                                                                    isExpanded
                                                                        ? <ChevronUp className="w-4 h-4 text-neutral-400" />
                                                                        : <ChevronDown className="w-4 h-4 text-neutral-400" />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Expanded Error List */}
                                                    {hasErrors && isExpanded && (
                                                        <div className="px-4 py-3 bg-white dark:bg-neutral-900 space-y-1.5 max-h-48 overflow-y-auto border-t border-danger-100 dark:border-danger-800/30">
                                                            {company.errors!.map((err, errIdx) => (
                                                                <div key={`${err.sheet}-${err.field}-${errIdx}`} className="flex items-start gap-2 text-xs">
                                                                    <AlertTriangle className="w-3 h-3 text-danger-400 shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                                                            [{err.sheet}] {err.field}
                                                                        </span>
                                                                        <span className="text-danger-600 dark:text-danger-400"> — {err.message}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReUpload}
                                            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            Re-upload
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={validationResult.validCount === 0}
                                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Import {validationResult.validCount} Valid Compan{validationResult.validCount !== 1 ? 'ies' : 'y'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Import Results ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold text-primary-950 dark:text-white">
                                    Step 3: Import Results
                                </h3>
                            </div>

                            {importMutation.isPending && !importResult && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                        Creating companies...
                                    </p>
                                </div>
                            )}

                            {importResult && (
                                <div className="space-y-4">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-success-700 dark:text-success-400">
                                                {importResult.successCount}
                                            </p>
                                            <p className="text-sm font-medium text-success-600 dark:text-success-400 mt-0.5">
                                                Successfully Created
                                            </p>
                                        </div>
                                        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">
                                                {importResult.failureCount}
                                            </p>
                                            <p className="text-sm font-medium text-danger-600 dark:text-danger-400 mt-0.5">
                                                Failed
                                            </p>
                                        </div>
                                    </div>

                                    {/* Results List */}
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {importResult.results.map((result, idx) => (
                                            <div
                                                key={`result-${result.name}-${idx}`}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-xl px-4 py-3 border',
                                                    result.success
                                                        ? 'bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800/40'
                                                        : 'bg-danger-50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800/40'
                                                )}
                                            >
                                                {result.success ? (
                                                    <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-danger-600 dark:text-danger-400 shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white truncate">
                                                        {result.name}
                                                    </p>
                                                    {result.companyId && (
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                            ID: {result.companyId}
                                                        </p>
                                                    )}
                                                    {result.error && (
                                                        <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">
                                                            {result.error}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    'text-[10px] font-bold px-2 py-0.5 rounded',
                                                    result.success
                                                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                                        : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                                                )}>
                                                    {result.success ? 'CREATED' : 'FAILED'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {step === 3 && importResult ? 'Close' : 'Cancel'}
                    </button>
                    {step === 1 && (
                        <button
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            Next
                        </button>
                    )}
                    {step === 3 && importResult && (
                        <button
                            onClick={handleDone}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
