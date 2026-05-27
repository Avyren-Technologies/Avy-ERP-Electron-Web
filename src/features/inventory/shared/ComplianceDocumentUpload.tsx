import { useState } from 'react';
import { Loader2, Plus, Trash2, ExternalLink, FileCheck, X, AlertCircle } from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useComplianceByPart, useComplianceByLot } from '@/features/inventory/api/use-inventory-queries';
import { useCreateComplianceDocument, useDeleteComplianceDocument } from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

interface ComplianceDocumentUploadProps {
    partId?: string;
    lotId?: string;
}

const DOC_TYPE_COLORS: Record<string, string> = {
    COA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    MSDS: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MILL_CERT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ALLERGEN_CERT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ESD_CERT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    COLD_CHAIN_CERT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    WARRANTY_CERT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    OTHER: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const DOC_TYPES = [
    { value: 'COA', label: 'Certificate of Analysis' },
    { value: 'MSDS', label: 'Material Safety Data Sheet' },
    { value: 'MILL_CERT', label: 'Mill Certificate' },
    { value: 'ALLERGEN_CERT', label: 'Allergen Certificate' },
    { value: 'ESD_CERT', label: 'ESD Certificate' },
    { value: 'COLD_CHAIN_CERT', label: 'Cold Chain Certificate' },
    { value: 'WARRANTY_CERT', label: 'Warranty Certificate' },
    { value: 'OTHER', label: 'Other' },
];

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';
const selectClass = inputClass;

export function ComplianceDocumentUpload({ partId, lotId }: ComplianceDocumentUploadProps) {
    const canCreate = useCanPerform('inventory.transactions:create');
    const fmt = useCompanyFormatter();
    const [showUpload, setShowUpload] = useState(false);
    const [form, setForm] = useState({ documentType: 'COA', documentName: '', documentUrl: '', expiryDate: '' });

    const { data: partData, isLoading: partLoading } = useComplianceByPart(partId || '');
    const { data: lotData, isLoading: lotLoading } = useComplianceByLot(lotId || '');

    const createMutation = useCreateComplianceDocument();
    const deleteMutation = useDeleteComplianceDocument();

    const isLoading = partId ? partLoading : lotLoading;
    const rawDocs = partId ? partData?.data : lotData?.data;
    const documents: any[] = rawDocs || [];

    const handleUpload = () => {
        if (!form.documentName.trim() || !form.documentUrl.trim()) return;
        const payload: any = { ...form };
        if (partId) payload.partId = partId;
        if (lotId) payload.lotId = lotId;
        if (!form.expiryDate) delete payload.expiryDate;
        createMutation.mutate(payload, {
            onSuccess: () => {
                setShowUpload(false);
                setForm({ documentType: 'COA', documentName: '', documentUrl: '', expiryDate: '' });
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary-500" />
                    Compliance Documents
                    {documents.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 rounded">{documents.length}</span>
                    )}
                </h3>
                {canCreate && (
                    <button
                        onClick={() => setShowUpload(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Upload
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : documents.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                    <FileCheck className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">No compliance documents</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Document</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expiry</th>
                                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Uploaded By</th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc: any) => {
                                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                return (
                                    <tr key={doc.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-2.5">
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded', DOC_TYPE_COLORS[doc.documentType] || DOC_TYPE_COLORS.OTHER)}>
                                                {doc.documentType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200">{doc.documentName}</td>
                                        <td className="px-4 py-2.5">
                                            {doc.expiryDate ? (
                                                <span className={cn('text-xs', isExpired ? 'text-red-600 font-semibold' : 'text-neutral-600 dark:text-neutral-400')}>
                                                    {isExpired && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                                    {fmt.date(doc.expiryDate)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">--</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-neutral-500">{doc.uploadedBy?.name || '--'}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {doc.documentUrl && (
                                                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-600 transition-colors">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {canCreate && (
                                                    <button
                                                        onClick={() => deleteMutation.mutate(doc.id)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Upload Compliance Document</h3>
                            <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 mb-1">Document Type *</label>
                                <select className={selectClass} value={form.documentType} onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}>
                                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 mb-1">Document Name *</label>
                                <input className={inputClass} value={form.documentName} onChange={e => setForm(p => ({ ...p, documentName: e.target.value }))} placeholder="e.g., COA - Batch 2024-001" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 mb-1">Document URL *</label>
                                <input className={inputClass} value={form.documentUrl} onChange={e => setForm(p => ({ ...p, documentUrl: e.target.value }))} placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 mb-1">Expiry Date</label>
                                <input type="date" className={inputClass} value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800">Cancel</button>
                            <button
                                onClick={handleUpload}
                                disabled={createMutation.isPending || !form.documentName.trim() || !form.documentUrl.trim()}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                            >
                                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
