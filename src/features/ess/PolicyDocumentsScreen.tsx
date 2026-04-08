import { useState, useEffect, useCallback } from 'react';
import { usePolicyDocuments, useCreatePolicyDocument, useDeletePolicyDocument } from '@/features/company-admin/api';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCanPerform } from '@/hooks/useCanPerform';
import { R2Link } from '@/components/R2Link';
import { FileUploadZone } from '@/components/FileUploadZone';
import { Loader2, BookOpen, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { showSuccess, showApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, string> = {
    HR: 'bg-primary-100 text-primary-700',
    COMPLIANCE: 'bg-warning-100 text-warning-700',
    SAFETY: 'bg-danger-100 text-danger-600',
    FINANCE: 'bg-success-100 text-success-700',
    IT: 'bg-info-100 text-info-700',
    GENERAL: 'bg-neutral-100 text-neutral-600',
};

const POLICY_CATEGORIES = [
    { value: 'HR_POLICY', label: 'HR Policy' },
    { value: 'LEAVE_POLICY', label: 'Leave Policy' },
    { value: 'ATTENDANCE_POLICY', label: 'Attendance Policy' },
    { value: 'CODE_OF_CONDUCT', label: 'Code of Conduct' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'TRAVEL', label: 'Travel' },
    { value: 'IT_POLICY', label: 'IT Policy' },
    { value: 'OTHER', label: 'Other' },
];

const INPUT_CLASS =
    'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white';

export function PolicyDocumentsScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = usePolicyDocuments();
    const policies = data?.data ?? [];

    const canCreate = useCanPerform('hr:create');
    const canDelete = useCanPerform('hr:delete');

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('HR_POLICY');
    const [description, setDescription] = useState('');
    const [version, setVersion] = useState('1.0');
    const [uploadedKey, setUploadedKey] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');

    const createMutation = useCreatePolicyDocument();
    const deleteMutation = useDeletePolicyDocument();
    const { upload, isUploading, error: uploadError, reset: resetUpload } = useFileUpload({
        category: 'policy-document',
        entityId: 'policy',
    });

    const closeModal = useCallback(() => {
        setShowModal(false);
        setTitle('');
        setCategory('HR_POLICY');
        setDescription('');
        setVersion('1.0');
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
        if (!title.trim() || !uploadedKey) return;
        createMutation.mutate(
            {
                title: title.trim(),
                category,
                description: description.trim() || undefined,
                version: version.trim() || '1.0',
                fileUrl: uploadedKey,
                fileName: uploadedFileName,
            },
            {
                onSuccess: () => {
                    showSuccess('Policy document uploaded');
                    closeModal();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleDelete(id: string) {
        deleteMutation.mutate(id, {
            onSuccess: () => showSuccess('Policy deleted'),
            onError: (err) => showApiError(err),
        });
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">Policy Documents</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Company policies and guidelines</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Upload Policy
                    </button>
                )}
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Upload Policy Document</h2>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Title <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Leave Policy 2026"
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    {POLICY_CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of this policy..."
                                    rows={3}
                                    className={INPUT_CLASS}
                                />
                            </div>

                            {/* Version */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Version
                                </label>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="e.g. 1.0"
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
                                    accept=".pdf"
                                    maxSizeMB={10}
                                    label="Drop your PDF here or click to browse"
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
                                disabled={!title.trim() || !uploadedKey || createMutation.isPending}
                                className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {createMutation.isPending ? (
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

            {/* Content */}
            {policies.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Policy Documents</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">No policy documents have been published yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {policies.map((p: any) => (
                        <div key={p.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-primary-950 dark:text-white">{p.title}</h3>
                                        {p.category && (
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', CATEGORY_STYLES[p.category?.toUpperCase()] ?? CATEGORY_STYLES.GENERAL)}>
                                                {p.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {p.version && <>v{p.version} &middot; </>}
                                        Published: {fmt.date(p.publishedAt ?? p.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.fileUrl && (
                                        <R2Link fileKey={p.fileUrl} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                                            <ExternalLink className="w-3.5 h-3.5" /> View
                                        </R2Link>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete policy"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {p.description && <p className="text-sm text-neutral-600 dark:text-neutral-400">{p.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
