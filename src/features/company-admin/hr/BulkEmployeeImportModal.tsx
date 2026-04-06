import { useState, useRef } from 'react';
import {
    X,
    Download,
    Upload,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Loader2,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';
import { downloadBulkEmployeeTemplate } from '@/features/company-admin/api/use-hr-queries';
import { useBulkValidateEmployees, useBulkImportEmployees } from '@/features/company-admin/api/use-hr-mutations';

interface BulkEmployeeImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ValidationRow {
    rowNum: number;
    valid: boolean;
    data?: Record<string, unknown>;
    errors?: string[];
}

interface ValidationResult {
    totalRows: number;
    validCount: number;
    errorCount: number;
    rows: ValidationRow[];
}

interface ImportResultRow {
    rowNum: number;
    success: boolean;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    accountCreated?: boolean;
    error?: string;
}

interface ImportResult {
    total: number;
    successCount: number;
    failureCount: number;
    results: ImportResultRow[];
}

const STEPS = ['Download Template', 'Upload & Validate', 'Import Results'];

export default function BulkEmployeeImportModal({ isOpen, onClose }: BulkEmployeeImportModalProps) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [defaultPassword, setDefaultPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateMutation = useBulkValidateEmployees();
    const importMutation = useBulkImportEmployees();

    const resetState = () => {
        setStep(1);
        setFile(null);
        setDefaultPassword('');
        setShowPassword(false);
        setValidationResult(null);
        setImportResult(null);
        setExpandedErrors(new Set());
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            await downloadBulkEmployeeTemplate();
            showSuccess('Template Downloaded', 'The Excel template has been downloaded.');
        } catch (err) {
            showApiError(err);
        } finally {
            setDownloading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;
        setFile(selected);
        setValidationResult(null);
        setExpandedErrors(new Set());
    };

    const handleValidate = () => {
        if (!file || defaultPassword.length < 6) return;
        validateMutation.mutate(
            { file, defaultPassword },
            {
                onSuccess: (result) => {
                    const payload = result?.data as ValidationResult;
                    setValidationResult(payload);
                },
                onError: (err) => showApiError(err),
            }
        );
    };

    const handleReUpload = () => {
        setFile(null);
        setValidationResult(null);
        setExpandedErrors(new Set());
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImport = () => {
        if (!validationResult) return;
        const validRows = validationResult.rows
            .filter((r) => r.valid && r.data)
            .map((r) => r.data as Record<string, unknown>);
        if (validRows.length === 0) return;

        setStep(3);
        importMutation.mutate(
            { rows: validRows, defaultPassword },
            {
                onSuccess: (result) => {
                    const payload = result?.data as ImportResult;
                    setImportResult(payload);
                    showSuccess('Import Complete', `${payload.successCount} employee(s) created successfully.`);
                },
                onError: (err) => showApiError(err),
            }
        );
    };

    const toggleErrorExpand = (rowNum: number) => {
        setExpandedErrors((prev) => {
            const next = new Set(prev);
            if (next.has(rowNum)) next.delete(rowNum);
            else next.add(rowNum);
            return next;
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">Bulk Employee Import</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Import multiple employees from an Excel file
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
                                    Download the Excel template, fill in your employee data, and proceed to upload.
                                    The template contains all required and optional fields with sample data and instructions.
                                </p>
                            </div>
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-4 flex items-start gap-3">
                                <FileSpreadsheet className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-primary-700 dark:text-primary-300">
                                    <p className="font-semibold">Template includes:</p>
                                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-primary-600 dark:text-primary-400">
                                        <li>Required fields: First Name, Last Name, Email, Department, Designation, etc.</li>
                                        <li>Optional fields: Middle Name, Phone, Address, Bank details, etc.</li>
                                        <li>Instructions sheet with field descriptions and valid values</li>
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

                            {/* File Input */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                                    Excel File (.xlsx)
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                                        file
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
                                                Click to select your Excel file
                                            </p>
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                                Only .xlsx files are supported
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                                    Default Password for New Accounts
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={defaultPassword}
                                        onChange={(e) => setDefaultPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-4 py-2.5 pr-11 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                    This password will be used for all employee login accounts. Employees should change it on first login.
                                </p>
                            </div>

                            {/* Validate Button */}
                            {!validationResult && (
                                <button
                                    onClick={handleValidate}
                                    disabled={!file || defaultPassword.length < 6 || validateMutation.isPending}
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
                                            <span>{validationResult.totalRows} rows</span>
                                        </span>
                                    </div>

                                    {/* Rows Table */}
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                    <th className="py-2.5 px-4 font-bold">Row #</th>
                                                    <th className="py-2.5 px-4 font-bold">Name</th>
                                                    <th className="py-2.5 px-4 font-bold">Status</th>
                                                    <th className="py-2.5 px-4 font-bold">Errors</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {validationResult.rows.map((row) => {
                                                    const name = row.data
                                                        ? [row.data.firstName, row.data.lastName].filter(Boolean).join(' ') || `Row ${row.rowNum}`
                                                        : `Row ${row.rowNum}`;
                                                    const hasErrors = !row.valid && row.errors && row.errors.length > 0;
                                                    const isExpanded = expandedErrors.has(row.rowNum);

                                                    return (
                                                        <tr
                                                            key={row.rowNum}
                                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0"
                                                        >
                                                            <td className="py-2.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                                {row.rowNum}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                                                                {name}
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                {row.valid ? (
                                                                    <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                {hasErrors ? (
                                                                    <div>
                                                                        <button
                                                                            onClick={() => toggleErrorExpand(row.rowNum)}
                                                                            className="flex items-center gap-1 text-xs text-danger-600 dark:text-danger-400 hover:underline"
                                                                        >
                                                                            {row.errors!.length} error{row.errors!.length !== 1 ? 's' : ''}
                                                                            {isExpanded ? (
                                                                                <ChevronUp className="w-3 h-3" />
                                                                            ) : (
                                                                                <ChevronDown className="w-3 h-3" />
                                                                            )}
                                                                        </button>
                                                                        {isExpanded && (
                                                                            <ul className="mt-1 space-y-0.5 text-xs text-danger-600 dark:text-danger-400">
                                                                                {row.errors!.map((err, idx) => (
                                                                                    <li key={idx} className="flex items-start gap-1">
                                                                                        <span className="shrink-0 mt-0.5">-</span>
                                                                                        <span>{err}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-neutral-400">--</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
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
                                            Import {validationResult.validCount} Valid Row{validationResult.validCount !== 1 ? 's' : ''}
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
                                        Creating employees...
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

                                    {/* Results Table */}
                                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                    <th className="py-2.5 px-4 font-bold">Row #</th>
                                                    <th className="py-2.5 px-4 font-bold">Employee ID</th>
                                                    <th className="py-2.5 px-4 font-bold">Name</th>
                                                    <th className="py-2.5 px-4 font-bold">Account</th>
                                                    <th className="py-2.5 px-4 font-bold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importResult.results.map((row) => {
                                                    const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || `Row ${row.rowNum}`;
                                                    return (
                                                        <tr
                                                            key={row.rowNum}
                                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0"
                                                        >
                                                            <td className="py-2.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                                {row.rowNum}
                                                            </td>
                                                            <td className="py-2.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                                {row.employeeId || '--'}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                                                                {name}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-xs">
                                                                {row.success ? (
                                                                    <span className={cn(
                                                                        'inline-flex items-center px-2 py-0.5 rounded-md font-semibold',
                                                                        row.accountCreated
                                                                            ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                                                                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                                                    )}>
                                                                        {row.accountCreated ? 'Yes' : 'No'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-neutral-400">--</span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-4">
                                                                {row.success ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-600 dark:text-success-400">
                                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                                        Created
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-danger-600 dark:text-danger-400" title={row.error}>
                                                                        <span className="inline-flex items-center gap-1 font-semibold">
                                                                            <XCircle className="w-3.5 h-3.5" />
                                                                            Failed
                                                                        </span>
                                                                        {row.error && (
                                                                            <span className="block mt-0.5 text-danger-500 dark:text-danger-400">
                                                                                {row.error}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
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
                        {step === 3 && importResult ? 'Done' : 'Cancel'}
                    </button>
                    {step === 1 && (
                        <button
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
