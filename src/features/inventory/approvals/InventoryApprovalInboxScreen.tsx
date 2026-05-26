import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, MessageSquare, Inbox, History } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { usePendingApprovals, useApprovalHistory } from '@/features/inventory/api/use-inventory-queries';
import { useApproveTransaction, useRejectTransaction } from '@/features/inventory/api/use-inventory-mutations';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { cn } from '@/lib/utils';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

export function InventoryApprovalInboxScreen() {
    const [tab, setTab] = useState<'pending' | 'history'>('pending');

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Review and approve inventory transactions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('pending')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        tab === 'pending'
                            ? 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900',
                    )}
                >
                    <Inbox className="w-4 h-4" /> Pending
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        tab === 'history'
                            ? 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900',
                    )}
                >
                    <History className="w-4 h-4" /> History
                </button>
            </div>

            {tab === 'pending' && <PendingTab />}
            {tab === 'history' && <HistoryTab />}
        </div>
    );
}

function PendingTab() {
    const fmt = useCompanyFormatter();
    const approveMutation = useApproveTransaction();
    const rejectMutation = useRejectTransaction();
    const { data, isLoading } = usePendingApprovals();
    const items = data?.data || [];
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const handleReject = (id: string) => {
        rejectMutation.mutate({ id, data: { reason: rejectReason } }, {
            onSuccess: () => { setRejectingId(null); setRejectReason(''); },
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-16">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No pending approvals</p>
                <p className="text-xs text-neutral-400 mt-1">All caught up!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{items.length}</span>
                <span className="text-sm text-neutral-500">items need your attention</span>
            </div>

            {items.map((item: any) => (
                <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    {item.transactionType || item.type || 'Transaction'}
                                </span>
                                <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                                    {item.transactionNumber || item.referenceNumber || '--'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 mt-2">
                                <span>Submitted by: <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.submittedBy?.name || item.createdByName || '--'}</span></span>
                                <span>{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</span>
                            </div>
                            {/* Key details */}
                            <div className="flex items-center gap-4 mt-2">
                                {item.quantity != null && (
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Qty: <span className="font-bold">{Number(item.quantity).toLocaleString()}</span>
                                    </span>
                                )}
                                {item.reasonCode && (
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Reason: <span className="font-medium">{item.reasonCode}</span>
                                    </span>
                                )}
                                {item.value != null && (
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                        Value: <span className="font-bold">{Number(item.value).toLocaleString()}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => handleApprove(item.id)}
                                disabled={approveMutation.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                                onClick={() => setRejectingId(item.id)}
                                disabled={rejectMutation.isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                        </div>
                    </div>

                    {/* Reject reason input */}
                    {rejectingId === item.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-medium text-neutral-500 mb-1">Rejection reason *</label>
                                <input
                                    className={inputClass}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => handleReject(item.id)}
                                disabled={!rejectReason || rejectMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Reject'}
                            </button>
                            <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-2 text-xs text-neutral-500 hover:text-neutral-700">Cancel</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function HistoryTab() {
    const fmt = useCompanyFormatter();
    const [page, setPage] = useState(1);
    const { data, isLoading } = useApprovalHistory({ page, limit: 25 });
    const items = data?.data || [];
    const meta = data?.meta;

    if (isLoading) {
        return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reference</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">By</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-12 text-neutral-400"><History className="w-6 h-6 mx-auto mb-2 text-neutral-300" />No approval history</td></tr>
                        )}
                        {items.map((item: any) => (
                            <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 text-xs text-neutral-500 uppercase">{item.transactionType || item.type || '--'}</td>
                                <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || item.referenceNumber || '--'}</td>
                                <td className="px-4 py-3"><TransactionStatusBadge status={item.action || item.status || 'APPROVED'} /></td>
                                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.approver?.name || item.approverName || '--'}</td>
                                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages} ({meta.total} records)</p>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Previous</button>
                        <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
