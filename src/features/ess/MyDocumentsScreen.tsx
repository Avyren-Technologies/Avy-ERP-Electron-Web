import { useState } from 'react';
import { useMyDocuments, useUploadMyDocument } from '@/features/company-admin/api';
import { Loader2, FileText, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function MyDocumentsScreen() {
    const { data, isLoading } = useMyDocuments();
    const documents = data?.data ?? [];
    const [showForm, setShowForm] = useState(false);
    const [documentType, setDocumentType] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const uploadMutation = useUploadMyDocument();

    function handleSubmit() {
        if (!documentType || !documentNumber.trim() || !fileName.trim()) return;
        uploadMutation.mutate(
            {
                documentType,
                documentNumber: documentNumber.trim(),
                expiryDate: expiryDate || undefined,
                fileUrl: fileUrl.trim() || undefined,
                fileName: fileName.trim(),
            },
            {
                onSuccess: () => { showSuccess('Document uploaded'); setShowForm(false); resetForm(); },
                onError: (err) => showApiError(err),
            },
        );
    }

    function resetForm() {
        setDocumentType('');
        setDocumentNumber('');
        setExpiryDate('');
        setFileUrl('');
        setFileName('');
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Documents</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your personal documents</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> Upload Document
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">Upload Document</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Document Type</label>
                            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm">
                                <option value="">Select Type</option>
                                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Document Number</label>
                            <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="e.g. ABCDE1234F" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Expiry Date (optional)</label>
                            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">File URL</label>
                            <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">File Name</label>
                            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="aadhaar-card.pdf" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <button onClick={handleSubmit} disabled={uploadMutation.isPending || !documentType || !documentNumber.trim() || !fileName.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>
            )}

            {documents.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Documents</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't uploaded any documents yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {documents.map((d: any) => (
                        <div key={d.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">{d.documentType}</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        No: {d.documentNumber}
                                        {d.expiryDate && <> &middot; Expires: {new Date(d.expiryDate).toLocaleDateString()}</>}
                                    </p>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', 'bg-info-100 text-info-700')}>
                                    {d.status ?? 'UPLOADED'}
                                </span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{d.fileName}</p>
                            {d.fileUrl && (
                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700">
                                    View File
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
