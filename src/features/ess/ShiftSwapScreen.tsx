import { useState } from 'react';
import { useMyShiftSwaps, useCreateShiftSwap, useCancelShiftSwap } from '@/features/company-admin/api';
import { Loader2, ArrowLeftRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-warning-100 text-warning-700',
    APPROVED: 'bg-success-100 text-success-700',
    REJECTED: 'bg-danger-100 text-danger-600',
    CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export function ShiftSwapScreen() {
    const { data, isLoading } = useMyShiftSwaps();
    const swaps = data?.data ?? [];
    const [showForm, setShowForm] = useState(false);
    const [currentShiftId, setCurrentShiftId] = useState('');
    const [requestedShiftId, setRequestedShiftId] = useState('');
    const [swapDate, setSwapDate] = useState('');
    const [reason, setReason] = useState('');
    const createMutation = useCreateShiftSwap();
    const cancelMutation = useCancelShiftSwap();

    function handleSubmit() {
        if (!currentShiftId.trim() || !requestedShiftId.trim() || !swapDate || !reason.trim()) return;
        createMutation.mutate(
            { currentShiftId: currentShiftId.trim(), requestedShiftId: requestedShiftId.trim(), swapDate, reason: reason.trim() },
            {
                onSuccess: () => { showSuccess('Shift swap request submitted'); setShowForm(false); resetForm(); },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleCancel(id: string) {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        cancelMutation.mutate(id, {
            onSuccess: () => showSuccess('Shift swap request cancelled'),
            onError: (err) => showApiError(err),
        });
    }

    function resetForm() {
        setCurrentShiftId('');
        setRequestedShiftId('');
        setSwapDate('');
        setReason('');
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">Shift Swap Requests</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Request and track shift swap changes</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">New Shift Swap Request</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Current Shift</label>
                            <input type="text" value={currentShiftId} onChange={(e) => setCurrentShiftId(e.target.value)} placeholder="Enter current shift name or ID" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Requested Shift</label>
                            <input type="text" value={requestedShiftId} onChange={(e) => setRequestedShiftId(e.target.value)} placeholder="Enter requested shift name or ID" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Swap Date</label>
                            <input type="date" value={swapDate} onChange={(e) => setSwapDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why do you need this shift swap?" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm resize-none" />
                        </div>
                        <button onClick={handleSubmit} disabled={createMutation.isPending || !currentShiftId.trim() || !requestedShiftId.trim() || !swapDate || !reason.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            )}

            {swaps.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <ArrowLeftRight className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Shift Swap Requests</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't submitted any shift swap requests yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {swaps.map((s: any) => (
                        <div key={s.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">
                                        {s.currentShift?.name ?? s.currentShiftId} &rarr; {s.requestedShift?.name ?? s.requestedShiftId}
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Swap Date: {new Date(s.swapDate).toLocaleDateString()} &middot; Filed: {new Date(s.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[s.status] ?? STATUS_STYLES.PENDING)}>{s.status}</span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{s.reason}</p>
                            {s.status === 'PENDING' && (
                                <button onClick={() => handleCancel(s.id)} disabled={cancelMutation.isPending} className="mt-3 px-3 py-1.5 text-xs font-semibold text-danger-600 border border-danger-200 rounded-lg hover:bg-danger-50 disabled:opacity-50">
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
