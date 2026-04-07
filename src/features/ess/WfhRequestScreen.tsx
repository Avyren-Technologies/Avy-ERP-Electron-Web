import { useState, useEffect } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useMyWfhRequests, useCreateWfhRequest, useCancelWfhRequest } from '@/features/company-admin/api';
import {
    Loader2, Home, Plus, X, Calendar, AlignLeft, Clock,
    CheckCircle2, XCircle, AlertCircle, Ban, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';
import { Skeleton } from '@/components/ui/Skeleton';

/* ── Status config ── */

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; pill: string; badge: string }> = {
    PENDING: {
        label: 'Pending',
        icon: Clock,
        pill: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border border-warning-200 dark:border-warning-800/50',
        badge: 'bg-warning-500',
    },
    APPROVED: {
        label: 'Approved',
        icon: CheckCircle2,
        pill: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50',
        badge: 'bg-success-500',
    },
    REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        pill: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50',
        badge: 'bg-danger-500',
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: Ban,
        pill: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700',
        badge: 'bg-neutral-400',
    },
};

const getStatus = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.PENDING;

/* ── Input helper ── */

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2.5 text-sm text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-all";

/* ── WFH Request Modal ── */

function WfhModal({
    open,
    onClose,
    onSubmit,
    isPending,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: { fromDate: string; toDate: string; days: number; reason: string }) => void;
    isPending: boolean;
}) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [days, setDays] = useState<number | ''>('');
    const [reason, setReason] = useState('');

    // Auto-calc working days (Mon–Fri only)
    useEffect(() => {
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            if (to >= from) {
                let count = 0;
                const cur = new Date(from);
                while (cur <= to) {
                    const dow = cur.getDay();
                    if (dow !== 0 && dow !== 6) count++;
                    cur.setDate(cur.getDate() + 1);
                }
                setDays(count > 0 ? count : 1);
            } else {
                setDays('');
            }
        } else {
            setDays('');
        }
    }, [fromDate, toDate]);

    function reset() {
        setFromDate(''); setToDate(''); setDays(''); setReason('');
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit() {
        if (!fromDate || !toDate || !days || !reason.trim()) return;
        onSubmit({ fromDate, toDate, days: Number(days), reason: reason.trim() });
    }

    const today = new Date().toISOString().split('T')[0];
    const isValid = fromDate && toDate && !!days && reason.trim().length > 5;

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden border border-neutral-200/60 dark:border-neutral-800">
                {/* Modal header */}
                <div className="relative px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    {/* Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 rounded-t-3xl" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-sm">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-neutral-800 dark:text-white">New WFH Request</h2>
                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Submit a work from home request</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Modal body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Date range */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="From Date" required>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={fromDate}
                                    min={today}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className={cn(inputCls, 'pl-9')}
                                />
                            </div>
                        </Field>
                        <Field label="To Date" required>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || today}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className={cn(inputCls, 'pl-9')}
                                />
                            </div>
                        </Field>
                    </div>

                    {/* Days auto-calculated indicator */}
                    {fromDate && toDate && days !== '' && (
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200/60 dark:border-primary-800/40">
                            <Clock className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                            <p className="text-sm text-primary-700 dark:text-primary-300">
                                <span className="font-bold">{days} working day{Number(days) !== 1 ? 's' : ''}</span>
                                <span className="text-primary-500 dark:text-primary-400"> automatically calculated (Mon–Fri)</span>
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <Field label="Reason" required>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                placeholder="Briefly describe why you need to work from home (e.g. home renovation, family emergency, connectivity issues)..."
                                className={cn(inputCls, 'pl-9 resize-none leading-relaxed')}
                            />
                        </div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">{reason.length} chars · min 6</p>
                    </Field>

                    {/* Info note */}
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700">
                        <AlertCircle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            WFH requests are subject to manager approval. Please submit at least 24 hours in advance where possible.
                        </p>
                    </div>
                </div>

                {/* Modal footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !isValid}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        ) : (
                            <><Plus className="w-4 h-4" /> Submit Request</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Request Card ── */

function WfhCard({ request, onCancel, isCancelling }: { request: any; onCancel: (id: string) => void; isCancelling: boolean }) {
    const fmt = useCompanyFormatter();
    const cfg = getStatus(request.status);
    const StatusIcon = cfg.icon;

    return (
        <div className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Top accent stripe by status */}
            <div className={cn('h-1 w-full', cfg.badge)} />

            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    {/* Left: Date range & meta */}
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                            <Home className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-sm font-bold text-neutral-800 dark:text-white">
                                    {fmt.date(request.fromDate)}
                                    {request.fromDate !== request.toDate && (
                                        <span className="text-neutral-400 dark:text-neutral-500 font-normal mx-1">→</span>
                                    )}
                                    {request.fromDate !== request.toDate && fmt.date(request.toDate)}
                                </p>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                                    {request.days} day{request.days !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                Filed {fmt.date(request.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Right: Status pill */}
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0', cfg.pill)}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                    </span>
                </div>

                {/* Reason */}
                {request.reason && (
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pl-[52px]">
                        {request.reason}
                    </p>
                )}

                {/* Approval note */}
                {request.status === 'APPROVED' && request.approvedBy && (
                    <div className="mt-3 pl-[52px] flex items-center gap-1.5 text-[11px] text-success-600 dark:text-success-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved by {request.approvedBy}
                    </div>
                )}
                {request.status === 'REJECTED' && request.rejectionReason && (
                    <div className="mt-3 pl-[52px] text-[11px] text-danger-600 dark:text-danger-400 font-medium">
                        Reason: {request.rejectionReason}
                    </div>
                )}

                {/* Cancel button */}
                {request.status === 'PENDING' && (
                    <div className="mt-4 pl-[52px]">
                        <button
                            onClick={() => onCancel(request.id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors disabled:opacity-50"
                        >
                            {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Cancel Request
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main Screen ── */

export function WfhRequestScreen() {
    const { data, isLoading } = useMyWfhRequests();
    const requests: any[] = data?.data ?? [];
    const [showModal, setShowModal] = useState(false);
    const createMutation = useCreateWfhRequest();
    const cancelMutation = useCancelWfhRequest();

    function handleSubmit(payload: { fromDate: string; toDate: string; days: number; reason: string }) {
        createMutation.mutate(payload, {
            onSuccess: () => {
                showSuccess('WFH request submitted successfully!');
                setShowModal(false);
            },
            onError: (err) => showApiError(err),
        });
    }

    function handleCancel(id: string) {
        if (!window.confirm('Cancel this WFH request?')) return;
        cancelMutation.mutate(id, {
            onSuccess: () => showSuccess('WFH request cancelled'),
            onError: (err) => showApiError(err),
        });
    }

    // Split by status for counts
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">WFH Requests</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Request and track your work from home days</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New Request
                </button>
            </div>

            {/* Quick stats */}
            {requests.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total', value: requests.length, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' },
                        { label: 'Pending', value: pending, color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400' },
                        { label: 'Approved', value: approved, color: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400' },
                    ].map((s) => (
                        <div key={s.label} className={cn('rounded-2xl p-4 text-center', s.color, 'border border-transparent')}>
                            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                            <p className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} borderRadius={16} />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 flex items-center justify-center mx-auto mb-4 border border-primary-100 dark:border-primary-800/30">
                        <Home className="w-8 h-8 text-primary-400 dark:text-primary-500" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">No WFH Requests Yet</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1 max-w-xs mx-auto">
                        You haven't submitted any work from home requests. Click the button above to get started.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New WFH Request
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((r: any) => (
                        <WfhCard
                            key={r.id}
                            request={r}
                            onCancel={handleCancel}
                            isCancelling={cancelMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <WfhModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                isPending={createMutation.isPending}
            />
        </div>
    );
}
