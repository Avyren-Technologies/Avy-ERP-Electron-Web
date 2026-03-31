import { useState, useEffect } from 'react';
import { useMyWfhRequests, useCreateWfhRequest, useCancelWfhRequest } from '@/features/company-admin/api';
import { Loader2, Home, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-warning-100 text-warning-700',
    APPROVED: 'bg-success-100 text-success-700',
    REJECTED: 'bg-danger-100 text-danger-600',
    CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export function WfhRequestScreen() {
    const { data, isLoading } = useMyWfhRequests();
    const requests = data?.data ?? [];
    const [showForm, setShowForm] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [days, setDays] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const createMutation = useCreateWfhRequest();
    const cancelMutation = useCancelWfhRequest();

    // Auto-calculate days when dates change
    useEffect(() => {
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (diff > 0) setDays(diff);
        }
    }, [fromDate, toDate]);

    function handleSubmit() {
        if (!fromDate || !toDate || !days || !reason.trim()) return;
        createMutation.mutate(
            { fromDate, toDate, days: Number(days), reason: reason.trim() },
            {
                onSuccess: () => { showSuccess('WFH request submitted'); setShowForm(false); resetForm(); },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleCancel(id: string) {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        cancelMutation.mutate(id, {
            onSuccess: () => showSuccess('WFH request cancelled'),
            onError: (err) => showApiError(err),
        });
    }

    function resetForm() {
        setFromDate('');
        setToDate('');
        setDays('');
        setReason('');
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">WFH Requests</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Request and track work from home days</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">New WFH Request</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">From Date</label>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">To Date</label>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Days</label>
                            <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for working from home..." className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm resize-none" />
                        </div>
                        <button onClick={handleSubmit} disabled={createMutation.isPending || !fromDate || !toDate || !days || !reason.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            )}

            {requests.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <Home className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No WFH Requests</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't submitted any work from home requests yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((r: any) => (
                        <div key={r.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">
                                        {new Date(r.fromDate).toLocaleDateString()} &ndash; {new Date(r.toDate).toLocaleDateString()}
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {r.days} day{r.days !== 1 ? 's' : ''} &middot; Filed: {new Date(r.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING)}>{r.status}</span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{r.reason}</p>
                            {r.status === 'PENDING' && (
                                <button onClick={() => handleCancel(r.id)} disabled={cancelMutation.isPending} className="mt-3 px-3 py-1.5 text-xs font-semibold text-danger-600 border border-danger-200 rounded-lg hover:bg-danger-50 disabled:opacity-50">
                                    Cancel Request
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
