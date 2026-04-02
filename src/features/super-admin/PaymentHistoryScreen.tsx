import { useState, useEffect } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    CreditCard,
    Search,
    Filter,
    Plus,
    ChevronLeft,
    ChevronRight,
    X,
    Link as LinkIcon,
    Calendar,
    FileText,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePaymentList, useRecordPayment } from '@/features/super-admin/api/use-payment-queries';
import type { PaymentMethod, RecordPaymentPayload, PaymentRecord } from '@/lib/api/payment';

// ============ CONSTANTS ============

const METHOD_FILTERS = ['All', 'BANK_TRANSFER', 'CHEQUE', 'CASH', 'RAZORPAY', 'UPI', 'OTHER'] as const;

const METHOD_BADGE_STYLES: Record<string, string> = {
    BANK_TRANSFER: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CHEQUE: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    CASH: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    RAZORPAY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    UPI: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    OTHER: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const FORM_METHODS: PaymentMethod[] = [
    'BANK_TRANSFER',
    'CHEQUE',
    'CASH',
    'RAZORPAY',
    'UPI',
    'OTHER',
];

function formatMethodLabel(method: string): string {
    return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// formatDate moved inside component

// ============ RECORD PAYMENT MODAL ============

function RecordPaymentModal({
    open,
    onClose,
    onSubmit,
    isSubmitting,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: RecordPaymentPayload) => void;
    isSubmitting: boolean;
}) {
    const [invoiceId, setInvoiceId] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
    const [reference, setReference] = useState('');
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceId.trim() || !amount.trim()) return;
        onSubmit({
            invoiceId: invoiceId.trim(),
            amount: parseFloat(amount),
            method,
            transactionReference: reference.trim() || undefined,
            paidAt: new Date(paidAt).toISOString(),
            notes: notes.trim() || undefined,
        });
    };

    const handleClose = () => {
        setInvoiceId('');
        setAmount('');
        setMethod('BANK_TRANSFER');
        setReference('');
        setPaidAt(new Date().toISOString().split('T')[0]);
        setNotes('');
        onClose();
    };

    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/60 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200/60 dark:border-neutral-800">
                    <h2 id="record-payment-title" className="text-xl font-bold text-primary-950 dark:text-white">
                        Record Payment
                    </h2>
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <X className="w-4 h-4 text-neutral-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Invoice ID */}
                    <div>
                        <label htmlFor="record-invoice-id" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Invoice ID *
                        </label>
                        <input
                            id="record-invoice-id"
                            type="text"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            placeholder="Enter invoice ID"
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400"
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label htmlFor="record-amount" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Amount (INR) *
                        </label>
                        <input
                            id="record-amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Payment Method
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FORM_METHODS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                                        method === m
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700',
                                    )}
                                >
                                    {formatMethodLabel(m)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                        <label htmlFor="record-transaction-reference" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Transaction Reference
                        </label>
                        <input
                            id="record-transaction-reference"
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g., TXN-2024-001"
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400"
                        />
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label htmlFor="record-payment-date" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Payment Date
                        </label>
                        <input
                            id="record-payment-date"
                            type="date"
                            value={paidAt}
                            onChange={(e) => setPaidAt(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="record-notes" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Notes
                        </label>
                        <textarea
                            id="record-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !invoiceId.trim() || !amount.trim()}
                        className={cn(
                            'w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all',
                            isSubmitting || !invoiceId.trim() || !amount.trim()
                                ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 dark:shadow-none',
                        )}
                    >
                        {isSubmitting ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Recording...
                            </span>
                        ) : (
                            'Record Payment'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ============ MAIN COMPONENT ============

export function PaymentHistoryScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string) => d ? fmt.date(d) : '—';
    const [methodFilter, setMethodFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const limit = 25;

    const { data, isLoading, isError, refetch } = usePaymentList({
        page,
        limit,
        method: methodFilter === 'All' ? undefined : methodFilter,
    });

    const payments: PaymentRecord[] = data?.data ?? [];
    const meta = (data as any)?.meta;
    const total = meta?.total ?? payments.length;
    const totalPages = meta?.totalPages ?? 1;

    const recordPayment = useRecordPayment();

    const handleRecordPayment = (formData: RecordPaymentPayload) => {
        recordPayment.mutate(formData, {
            onSuccess: () => {
                setShowRecordModal(false);
            },
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Payment History
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {total} payments recorded
                    </p>
                </div>
                <button
                    onClick={() => setShowRecordModal(true)}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Record Payment
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                    <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 mr-2 shrink-0">
                        <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {METHOD_FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                setMethodFilter(f);
                                setPage(1);
                            }}
                            className={cn(
                                'px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                                methodFilter === f
                                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30 dark:shadow-none'
                                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                            )}
                        >
                            {f === 'All' ? 'All' : formatMethodLabel(f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden transition-colors">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={6} />
                ) : isError ? (
                    <div className="py-16">
                        <EmptyState
                            icon="error"
                            title="Failed to load payments"
                            message="Check your connection and try again."
                            action={{ label: 'Retry', onClick: () => refetch() }}
                        />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="py-16">
                        <EmptyState
                            icon="search"
                            title="No payments found"
                            message={
                                methodFilter !== 'All'
                                    ? 'Try changing the method filter.'
                                    : 'No payment records yet.'
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-neutral-200/60 dark:border-neutral-800">
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Invoice #
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        Reference
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                                {payments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                                {formatDate(payment.paidAt)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-primary-700 dark:text-primary-400 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" />
                                                {payment.invoiceNumber ?? payment.invoiceId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                            {payment.tenantName ?? 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white text-right whitespace-nowrap">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold',
                                                    METHOD_BADGE_STYLES[payment.method] ?? METHOD_BADGE_STYLES.OTHER,
                                                )}
                                            >
                                                {formatMethodLabel(payment.method)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                            {payment.transactionReference ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {payment.transactionReference}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">
                                                    --
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && payments.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200/60 dark:border-neutral-800">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Page {page} of {totalPages} ({total} total)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                                    page <= 1
                                        ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className={cn(
                                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                                    page >= totalPages
                                        ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                )}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Record Payment Modal */}
            <RecordPaymentModal
                open={showRecordModal}
                onClose={() => setShowRecordModal(false)}
                onSubmit={handleRecordPayment}
                isSubmitting={recordPayment.isPending}
            />
        </div>
    );
}
