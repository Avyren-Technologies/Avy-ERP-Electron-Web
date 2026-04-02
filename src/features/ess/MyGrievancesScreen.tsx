import { useState } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useMyGrievances, useFileGrievance } from '@/features/company-admin/api';
import { useGrievanceCategories } from '@/features/company-admin/api';
import { Loader2, AlertTriangle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    OPEN: 'bg-info-100 text-info-700',
    INVESTIGATING: 'bg-warning-100 text-warning-700',
    RESOLVED: 'bg-success-100 text-success-700',
    CLOSED: 'bg-neutral-100 text-neutral-500',
    ESCALATED: 'bg-danger-100 text-danger-600',
};

export function MyGrievancesScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useMyGrievances();
    const cases = data?.data ?? [];
    const [showForm, setShowForm] = useState(false);
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const fileMutation = useFileGrievance();
    const { data: catData } = useGrievanceCategories();
    const categories = catData?.data ?? [];

    function handleSubmit() {
        if (!categoryId || !description.trim()) return;
        fileMutation.mutate({ categoryId, description: description.trim(), isAnonymous }, {
            onSuccess: () => { showSuccess('Grievance filed'); setShowForm(false); setDescription(''); setCategoryId(''); setIsAnonymous(false); },
            onError: (err) => showApiError(err),
        });
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Grievances</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">File and track your grievances</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> File Grievance
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">New Grievance</h3>
                        <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm">
                            <option value="">Select Category</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your grievance..." className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm resize-none" />
                        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
                            File anonymously
                        </label>
                        <button onClick={handleSubmit} disabled={fileMutation.isPending || !categoryId || !description.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                            {fileMutation.isPending ? 'Filing...' : 'Submit Grievance'}
                        </button>
                    </div>
                </div>
            )}

            {cases.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <AlertTriangle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Grievances</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't filed any grievances yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cases.map((g: any) => (
                        <div key={g.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">{g.category?.name ?? 'General'}</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">{fmt.date(g.createdAt)}</p>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[g.status] ?? STATUS_STYLES.OPEN)}>{g.status}</span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{g.description}</p>
                            {g.resolution && <p className="text-sm text-success-600 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">Resolution: {g.resolution}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
