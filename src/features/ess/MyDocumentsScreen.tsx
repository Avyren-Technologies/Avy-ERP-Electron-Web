import { useState, useEffect, useCallback } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useFileUpload } from '@/hooks/useFileUpload';
import { R2Link } from '@/components/R2Link';
import { FileUploadZone } from '@/components/FileUploadZone';
import { useMyDocuments, useUploadMyDocument, useDeleteMyDocument } from '@/features/company-admin/api';
import { Loader2, FileText, Plus, X, Trash2 } from 'lucide-react';
import { showSuccess, showApiError } from '@/lib/toast';

const DOC_TYPES = [
    'Aadhaar',
    'PAN',
    'Passport',
    'Driving License',
    'Voter ID',
    'Education Certificate',
    'Experience Letter',
    'Other',
];

const DOC_TYPE_COLORS: Record<string, string> = {
    Aadhaar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    PAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Passport: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'Driving License': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Voter ID': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'Education Certificate': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'Experience Letter': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Other: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const INPUT_CLASS =
    'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white';

export function MyDocumentsScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useMyDocuments();
    const documents = data?.data ?? [];

    const [showModal, setShowModal] = useState(false);
    const [documentType, setDocumentType] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [uploadedKey, setUploadedKey] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');

    const { upload, isUploading, error: uploadError, reset: resetUpload } = useFileUpload({
        category: 'employee-document',
        entityId: 'me',
    });

    const uploadMutation = useUploadMyDocument();
    const deleteMutation = useDeleteMyDocument();

    const closeModal = useCallback(() => {
        setShowModal(false);
        setDocumentType('');
        setDocumentNumber('');
        setExpiryDate('');
        setUploadedKey('');
        setUploadedFileName('');
        resetUpload();
    }, [resetUpload]);

    useEffect(() => {
        if (!showModal) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') closeModal();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showModal, closeModal]);

    async function handleFileSelected(file: File) {
        const key = await upload(file);
        if (key) {
            setUploadedKey(key);
            setUploadedFileName(file.name);
        }
    }

    function handleSubmit() {
        if (!documentType || !uploadedKey) return;
        uploadMutation.mutate(
            {
                documentType,
                documentNumber: documentNumber.trim() || undefined,
                expiryDate: expiryDate || undefined,
                fileUrl: uploadedKey,
                fileName: uploadedFileName,
            },
            {
                onSuccess: () => {
                    showSuccess('Document uploaded');
                    closeModal();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleDelete(id: string) {
        deleteMutation.mutate(id, {
            onSuccess: () => showSuccess('Document deleted'),
            onError: (err) => showApiError(err),
        });
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">My Documents</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your personal documents</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Upload Document
                </button>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Upload Document</h2>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Document Type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Document Type <span className="text-danger-500">*</span>
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    <option value="">Select Type</option>
                                    {DOC_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Document Number */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Document Number
                                </label>
                                <input
                                    type="text"
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                    placeholder="e.g. ABCDE1234F"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    File <span className="text-danger-500">*</span>
                                </label>
                                <FileUploadZone
                                    onFileSelected={handleFileSelected}
                                    isUploading={isUploading}
                                    uploadedFileName={uploadedKey ? uploadedFileName : null}
                                    accept="image/*,.pdf,.doc,.docx"
                                    maxSizeMB={10}
                                    label="Drop your document here or click to browse"
                                    error={uploadError}
                                    onClear={() => {
                                        setUploadedKey('');
                                        setUploadedFileName('');
                                        resetUpload();
                                    }}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!documentType || !uploadedKey || uploadMutation.isPending}
                                className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {uploadMutation.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                    </span>
                                ) : (
                                    'Upload'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {documents.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Documents</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
                        You haven&apos;t uploaded any documents yet.
                    </p>
                </div>
            ) : (
                /* Document Grid */
                <div className="grid gap-4 sm:grid-cols-2">
                    {documents.map((d: any) => (
                        <div
                            key={d.id}
                            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span
                                    className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${DOC_TYPE_COLORS[d.documentType] ?? DOC_TYPE_COLORS.Other}`}
                                >
                                    {d.documentType}
                                </span>
                                <button
                                    onClick={() => handleDelete(d.id)}
                                    disabled={deleteMutation.isPending}
                                    className="p-1.5 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors disabled:opacity-50"
                                    title="Delete document"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-1 mb-3">
                                {d.documentNumber && (
                                    <p className="text-sm font-medium text-primary-950 dark:text-white">
                                        No: {d.documentNumber}
                                    </p>
                                )}
                                {d.expiryDate && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Expires: {fmt.date(d.expiryDate)}
                                    </p>
                                )}
                            </div>

                            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{d.fileName}</p>

                            {d.fileUrl && (
                                <R2Link
                                    fileKey={d.fileUrl}
                                    className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                    View File
                                </R2Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
