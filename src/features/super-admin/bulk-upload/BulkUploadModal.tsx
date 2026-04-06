// ============================================================
// Bulk Upload Modal — Excel upload, validation & submission
// ============================================================
import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { showError } from '@/lib/toast';
import {
    X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
    ChevronDown, ChevronRight, Loader2, Building2, AlertTriangle, RotateCcw,
} from 'lucide-react';
import {
    downloadTemplate,
    parseAndValidateBulkUpload,
    type ParsedCompany,
} from './bulk-upload-utils';
import { useOnboardTenant } from '@/features/super-admin/api/use-tenant-queries';

type UploadStage = 'upload' | 'review' | 'submitting' | 'done';

interface BulkUploadModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export function BulkUploadModal({ onClose, onSuccess }: Readonly<BulkUploadModalProps>) {
    const [stage, setStage] = useState<UploadStage>('upload');
    const [parsedCompanies, setParsedCompanies] = useState<ParsedCompany[]>([]);
    const [fileName, setFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [submissionResults, setSubmissionResults] = useState<{ name: string; success: boolean; error?: string }[]>([]);
    const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
    const fileRef = useRef<HTMLInputElement>(null);
    const onboardMutation = useOnboardTenant();

    const handleFile = useCallback(async (file: File) => {
        if (!(/\.(xlsx|xls)$/i).exec(file.name)) {
            showError('Invalid file type', 'Please upload an Excel file (.xlsx or .xls).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showError('File too large', 'Maximum allowed size is 10 MB.');
            return;
        }
        try {
            setFileName(file.name);
            const buffer = await file.arrayBuffer();
            const results = parseAndValidateBulkUpload(buffer);
            setParsedCompanies(results);
            setStage('review');
        } catch (err) {
            console.error('BulkUpload: failed to parse workbook', err);
            showError('Failed to parse file', 'The file may be corrupted or in an unsupported format.');
        }
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const toggleErrors = (idx: number) => {
        setExpandedErrors(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const validCompanies = parsedCompanies.filter(c => c.errors.length === 0);
    const invalidCompanies = parsedCompanies.filter(c => c.errors.length > 0);

    const handleSubmit = async () => {
        if (validCompanies.length === 0) return;
        setStage('submitting');
        const results: { name: string; success: boolean; error?: string }[] = [];

        for (const company of validCompanies) {
            const name = company.payload?.identity?.displayName || `Company ${company.rowIndex + 1}`;
            try {
                await onboardMutation.mutateAsync(company.payload);
                results.push({ name, success: true });
            } catch (e: any) {
                const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Unknown error';
                results.push({ name, success: false, error: msg });
            }
        }

        setSubmissionResults(results);
        setStage('done');
    };

    const handleReset = () => {
        setStage('upload');
        setParsedCompanies([]);
        setFileName('');
        setSubmissionResults([]);
        setExpandedErrors(new Set());
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-upload-title"
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            >

                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                            <FileSpreadsheet size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 id="bulk-upload-title" className="text-lg font-bold text-primary-950 dark:text-white">Bulk Upload Companies</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload an Excel file to onboard multiple companies at once</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-7 py-6">

                    {/* ---- STAGE: UPLOAD ---- */}
                    {stage === 'upload' && (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-2xl px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <Download size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-primary-800 dark:text-primary-300">Download Template First</p>
                                        <p className="text-xs text-primary-700 dark:text-primary-400 mt-1 leading-relaxed">
                                            Download the Excel template, fill in the company details across all 15 sheets,
                                            then upload it here. Each sheet corresponds to a step in the onboarding wizard.
                                            Fields marked with * are required.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={downloadTemplate}
                                            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 shadow-sm shadow-primary-500/20 transition-all"
                                        >
                                            <Download size={14} />
                                            Download Template (.xlsx)
                                        </button>
                                    </div>
                                </div>
                            </div>                            {/* Upload Area */}
                             <button
                                type="button"
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileRef.current?.click()}
                                className={cn(
                                    'w-full border-2 border-dashed rounded-2xl px-8 py-12 text-center cursor-pointer transition-all duration-200',
                                    dragOver
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-primary-300 dark:hover:border-primary-700'
                                )}
                            >
                                <Upload size={32} className={cn('mx-auto mb-4', dragOver ? 'text-primary-500' : 'text-neutral-300 dark:text-neutral-500')} />
                                <p className="text-sm font-bold text-primary-950 dark:text-white">
                                    {dragOver ? 'Drop your Excel file here' : 'Click to upload or drag & drop'}
                                </p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                                    Supports .xlsx and .xls files. Max size: 10 MB.
                                </p>
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={onFileChange}
                            />

                            {/* Instructions */}
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl px-5 py-4 border border-neutral-100 dark:border-neutral-800">
                                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-3">How it works:</p>
                                <div className="space-y-2">
                                    {[
                                        'Download the template — it has 15 sheets matching the onboarding steps',
                                        'Row 1 = Column headers, Row 2 = Hints/examples, Row 3+ = Your data',
                                        'The "Display Name" column links data across sheets for the same company',
                                        'Fill multiple rows in a sheet for multiple items (locations, contacts, shifts, etc.)',
                                        'Upload the filled Excel — errors are highlighted before submission',
                                        'Only error-free companies are submitted. Fix errors and re-upload the rest.',
                                    ].map((step, i) => (
                                        <div key={`step-${step.slice(0, 20)}`} className="flex items-start gap-2">
                                            <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400">{i + 1}</span>
                                            </span>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-4">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---- STAGE: REVIEW ---- */}
                    {stage === 'review' && (
                        <div className="space-y-5">
                            {/* File info */}
                            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-800">
                                <FileSpreadsheet size={18} className="text-primary-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{fileName}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {parsedCompanies.length} compan{parsedCompanies.length === 1 ? 'y' : 'ies'} found
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <RotateCcw size={11} />
                                    Re-upload
                                </button>
                            </div>

                            {/* Summary bars */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 rounded-xl px-4 py-3">
                                    <p className="text-2xl font-bold text-success-700 dark:text-success-400">{validCompanies.length}</p>
                                    <p className="text-xs font-semibold text-success-600 dark:text-success-400">Ready to create</p>
                                </div>
                                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl px-4 py-3">
                                    <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">{invalidCompanies.length}</p>
                                    <p className="text-xs font-semibold text-danger-600 dark:text-danger-400">Have errors</p>
                                </div>
                            </div>

                            {/* Valid companies */}
                            {validCompanies.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-success-600 uppercase tracking-wider mb-2">
                                        Valid Companies ({validCompanies.length})
                                    </p>
                                    <div className="space-y-2">
                                        {validCompanies.map((c) => (
                                            <div key={c.payload?.identity?.displayName ?? `valid-${c.rowIndex}`} className="flex items-center gap-3 bg-success-50 dark:bg-success-900/10 rounded-xl px-4 py-3 border border-success-100 dark:border-success-800/40">
                                                <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-primary-950 dark:text-white">
                                                        {c.payload?.identity?.displayName || `Company ${c.rowIndex + 1}`}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {c.payload?.identity?.industry} · {c.payload?.identity?.businessType}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">VALID</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invalid companies with errors */}
                            {invalidCompanies.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-danger-600 uppercase tracking-wider mb-2">
                                        Companies with Errors ({invalidCompanies.length})
                                    </p>
                                    <div className="space-y-2">
                                        {invalidCompanies.map((c, idx) => {
                                            const isExpanded = expandedErrors.has(idx);
                                            const displayName = c.payload?.identity?.displayName
                                                || (c.errors[0]?.row === 0 ? 'File Error' : `Company Row ${c.rowIndex + 1}`);

                                            return (
                                                <div key={c.payload?.identity?.displayName ?? `invalid-${c.rowIndex}`} className="border border-danger-200 dark:border-danger-800/50 rounded-xl overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleErrors(idx)}
                                                        className="w-full flex items-center gap-3 bg-danger-50 dark:bg-danger-900/10 px-4 py-3 text-left hover:bg-danger-100 dark:hover:bg-danger-900/20 transition-colors"
                                                    >
                                                        <AlertCircle size={16} className="text-danger-500 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{displayName}</p>
                                                            <p className="text-xs text-danger-600 dark:text-danger-400">
                                                                {c.errors.length} error{c.errors.length === 1 ? '' : 's'} found
                                                            </p>
                                                        </div>
                                                        {isExpanded ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-4 py-3 bg-white dark:bg-neutral-900 space-y-1.5 max-h-60 overflow-y-auto">
                                                            {c.errors.map((err, errIdx) => (
                                                                <div key={`${err.sheet}-${err.field}-${errIdx}`} className="flex items-start gap-2 text-xs">
                                                                    <AlertTriangle size={12} className="text-danger-400 flex-shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                                                            [{err.sheet}] {err.field}
                                                                        </span>
                                                                        {err.row > 0 && <span className="text-neutral-400 dark:text-neutral-500"> (Row {err.row})</span>}
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
                                </div>
                            )}

                            {invalidCompanies.length > 0 && validCompanies.length > 0 && (
                                <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 rounded-xl px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-warning-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-warning-700 dark:text-warning-400">
                                            Only the <strong>{validCompanies.length} valid</strong> compan{validCompanies.length === 1 ? 'y' : 'ies'} will be created.
                                            Fix the errors in the Excel file and re-upload for the remaining {invalidCompanies.length} compan{invalidCompanies.length === 1 ? 'y' : 'ies'}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ---- STAGE: SUBMITTING ---- */}
                    {stage === 'submitting' && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <Loader2 size={40} className="text-primary-500 animate-spin" />
                            <p className="text-sm font-bold text-primary-950 dark:text-white">Creating companies...</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Processing {validCompanies.length} compan{validCompanies.length === 1 ? 'y' : 'ies'}. Please wait.
                            </p>
                        </div>
                    )}

                    {/* ---- STAGE: DONE ---- */}
                    {stage === 'done' && (
                        <div className="space-y-5">
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mx-auto mb-4">
                                    <Building2 size={28} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">Bulk Upload Complete</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                    {submissionResults.filter(r => r.success).length} of {submissionResults.length} companies created successfully
                                </p>
                            </div>

                            <div className="space-y-2">
                                {submissionResults.map((result) => (
                                    <div
                                        key={`result-${result.name}`}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl px-4 py-3 border',
                                            result.success
                                                ? 'bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800/40'
                                                : 'bg-danger-50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800/40'
                                        )}
                                    >
                                        {result.success
                                            ? <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                                            : <AlertCircle size={16} className="text-danger-500 flex-shrink-0" />
                                        }
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{result.name}</p>
                                            {result.error && (
                                                <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">{result.error}</p>
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

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    {stage === 'upload' && (
                        <>
                            <div />
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}

                    {stage === 'review' && (
                        <>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={validCompanies.length === 0}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                                    validCompanies.length > 0
                                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20'
                                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                )}
                            >
                                <Building2 size={15} />
                                Create {validCompanies.length} Compan{validCompanies.length === 1 ? 'y' : 'ies'}
                            </button>
                        </>
                    )}

                    {stage === 'submitting' && (
                        <div className="w-full text-center text-xs text-neutral-400 dark:text-neutral-500">
                            Do not close this window while companies are being created...
                        </div>
                    )}

                    {stage === 'done' && (
                        <>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <RotateCcw size={13} />
                                Upload More
                            </button>
                            <button
                                type="button"
                                onClick={() => { onSuccess?.(); onClose(); }}
                                className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 shadow-sm shadow-primary-500/20 transition-all"
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
