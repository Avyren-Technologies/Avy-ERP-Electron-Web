import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, Mail, Download, Ban, CheckCircle2,
    Loader2, X, Calendar, CreditCard, Building2, Receipt,
    IndianRupee, Clock, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useInvoiceDetail,
    useMarkAsPaid,
    useVoidInvoice,
    useSendInvoiceEmail,
} from '@/features/super-admin/api/use-invoice-queries';
import { invoiceApi } from '@/lib/api/invoice';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { showSuccess, showError, showApiError } from '@/lib/toast';

// ── Helpers ──

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// ── Status Badge ──

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; text: string; dot: string }> = {
        Paid: { bg: 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/50', text: 'text-success-700 dark:text-success-400', dot: 'bg-success-500' },
        Pending: { bg: 'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/50', text: 'text-warning-700 dark:text-warning-400', dot: 'bg-warning-500' },
        Overdue: { bg: 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800/50', text: 'text-danger-700 dark:text-danger-400', dot: 'bg-danger-500' },
        Cancelled: { bg: 'bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700', text: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400' },
        Void: { bg: 'bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700', text: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400' },
    };
    const c = cfg[status] ?? cfg.Pending;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border', c.bg, c.text)}>
            <span className={cn('w-2 h-2 rounded-full', c.dot)} />
            {status}
        </span>
    );
}

// ── Detail Field ──

function DetailField({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">{label}</p>
            <p className={cn(
                'text-sm font-semibold text-primary-950 dark:text-white',
                mono && 'font-mono bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-100 dark:border-neutral-800 text-xs inline-block',
                !value && 'text-neutral-300 dark:text-neutral-500 italic font-normal'
            )}>
                {value || '—'}
            </p>
        </div>
    );
}

// ── Mark as Paid Modal ──

function MarkAsPaidModal({
    open,
    onClose,
    invoiceId,
}: {
    open: boolean;
    onClose: () => void;
    invoiceId: string;
}) {
    const [method, setMethod] = useState('bank_transfer');
    const [reference, setReference] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const markPaidMutation = useMarkAsPaid();

    const handleSubmit = async () => {
        if (!paymentDate) {
            showError('Validation Error', 'Please select a payment date.');
            return;
        }
        try {
            await markPaidMutation.mutateAsync({
                invoiceId,
                payload: {
                    paymentMethod: method,
                    paymentReference: reference || undefined,
                    paymentDate,
                    notes: notes || undefined,
                },
            });
            showSuccess('Payment Recorded', 'Invoice has been marked as paid.');
            onClose();
        } catch (err) {
            showApiError(err);
        }
    };

    if (!open) return null;

    const PAYMENT_METHODS = [
        { value: 'bank_transfer', label: 'Bank Transfer / NEFT / RTGS' },
        { value: 'upi', label: 'UPI' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Credit / Debit Card' },
        { value: 'razorpay', label: 'Razorpay' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary-950 dark:text-white">Mark as Paid</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Record payment details for this invoice</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Payment Method *</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all appearance-none"
                            >
                                {PAYMENT_METHODS.map((pm) => (
                                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Payment Reference */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Payment Reference / Transaction ID</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g. UTR number, cheque number..."
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Payment Date *</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Any additional notes about this payment..."
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={markPaidMutation.isPending}
                        className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-success-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                    >
                        {markPaidMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Void Confirmation Modal ──

function VoidConfirmModal({
    open,
    onClose,
    onConfirm,
    isPending,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-7 h-7 text-danger-600 dark:text-danger-400" />
                    </div>
                    <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-2">Void Invoice?</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        This action cannot be undone. The invoice will be permanently voided and cannot be used for payment collection.
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-danger-600 hover:bg-danger-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-danger-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Ban className="w-4 h-4" />
                        )}
                        Void Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Screen ──

export function InvoiceDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading } = useInvoiceDetail(id ?? '');
    const invoice = data?.data;

    const [showPayModal, setShowPayModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const voidMutation = useVoidInvoice();
    const sendEmailMutation = useSendInvoiceEmail();

    const handleSendEmail = async () => {
        if (!id) return;
        setSendingEmail(true);
        try {
            await sendEmailMutation.mutateAsync(id);
            showSuccess('Email Sent', 'Invoice has been emailed to the tenant.');
        } catch (err) {
            showApiError(err);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!id) return;
        setDownloadingPdf(true);
        try {
            const blob = await invoiceApi.downloadPdf(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice?.invoiceNumber ?? id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('Download Started', 'PDF is being downloaded.');
        } catch (err) {
            showApiError(err);
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleVoid = async () => {
        if (!id) return;
        try {
            await voidMutation.mutateAsync(id);
            showSuccess('Invoice Voided', 'The invoice has been voided successfully.');
            setShowVoidModal(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const status = invoice?.status ?? 'Pending';
    const isPaid = status === 'Paid';
    const isVoided = status === 'Void' || status === 'Cancelled';

    // Line items
    const lineItems: any[] = invoice?.lineItems ?? invoice?.items ?? [];
    // Tax breakdown
    const subtotal = invoice?.subtotal ?? 0;
    const cgst = invoice?.cgst ?? invoice?.taxBreakdown?.cgst ?? 0;
    const sgst = invoice?.sgst ?? invoice?.taxBreakdown?.sgst ?? 0;
    const igst = invoice?.igst ?? invoice?.taxBreakdown?.igst ?? 0;
    const totalTax = invoice?.totalTax ?? (cgst + sgst + igst);
    const grandTotal = invoice?.grandTotal ?? invoice?.totalAmount ?? 0;

    // Payment history
    const payments: any[] = invoice?.payments ?? invoice?.paymentHistory ?? [];

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                    <div className="space-y-2">
                        <div className="w-48 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                        <div className="w-32 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                    </div>
                </div>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-4" />
                <h2 className="text-xl font-bold text-primary-950 dark:text-white mb-2">Invoice Not Found</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">The requested invoice could not be loaded.</p>
                <button
                    onClick={() => navigate('/app/billing/invoices')}
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Back + Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/billing/invoices')}
                        className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">
                                Invoice{' '}
                                <span className="font-mono text-xl">{invoice.invoiceNumber ?? id?.slice(0, 8)}</span>
                            </h1>
                            <StatusBadge status={status} />
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
                            {invoice.company?.displayName || invoice.company?.name || invoice.companyName || 'Unknown Tenant'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {!isPaid && !isVoided && (
                        <button
                            onClick={() => setShowPayModal(true)}
                            className="inline-flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-success-500/20 transition-all dark:shadow-none"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Send Email
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                        className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download PDF
                    </button>
                    {!isPaid && !isVoided && (
                        <button
                            onClick={() => setShowVoidModal(true)}
                            className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 border border-danger-200 dark:border-danger-800/50 text-danger-600 dark:text-danger-400 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                        >
                            <Ban className="w-4 h-4" />
                            Void
                        </button>
                    )}
                </div>
            </div>

            {/* Invoice Info Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Invoice Information</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <DetailField label="Tenant" value={invoice.company?.displayName || invoice.company?.name || invoice.companyName} />
                    <DetailField label="Invoice Type" value={invoice.invoiceType ?? invoice.type} />
                    <DetailField label="Billing Period" value={
                        invoice.billingPeriodStart && invoice.billingPeriodEnd
                            ? `${formatDate(invoice.billingPeriodStart)} - ${formatDate(invoice.billingPeriodEnd)}`
                            : invoice.billingPeriod ?? '—'
                    } />
                    <DetailField label="Issue Date" value={formatDate(invoice.issueDate ?? invoice.createdAt)} />
                    <DetailField label="Due Date" value={formatDate(invoice.dueDate)} />
                    <DetailField label="Invoice Number" value={invoice.invoiceNumber} mono />
                    <DetailField label="Location" value={invoice.location?.name ?? invoice.locationName} />
                    <DetailField label="Currency" value={invoice.currency ?? 'INR'} />
                </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden transition-colors">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Line Items</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-3.5 px-6 font-bold w-12">S.No</th>
                                <th className="py-3.5 px-6 font-bold">Description</th>
                                <th className="py-3.5 px-6 font-bold">Location</th>
                                <th className="py-3.5 px-6 font-bold text-right">Qty</th>
                                <th className="py-3.5 px-6 font-bold text-right">Unit Price</th>
                                <th className="py-3.5 px-6 font-bold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {lineItems.length > 0 ? lineItems.map((item: any, idx: number) => (
                                <tr
                                    key={item.id ?? idx}
                                    className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                >
                                    <td className="py-3.5 px-6 text-neutral-400 dark:text-neutral-500 font-medium">{idx + 1}</td>
                                    <td className="py-3.5 px-6 font-semibold text-primary-950 dark:text-white">{item.description ?? item.name ?? '—'}</td>
                                    <td className="py-3.5 px-6 text-neutral-600 dark:text-neutral-300">{item.locationName ?? item.location ?? '—'}</td>
                                    <td className="py-3.5 px-6 text-right font-medium text-neutral-700 dark:text-neutral-300">{item.quantity ?? item.qty ?? 1}</td>
                                    <td className="py-3.5 px-6 text-right font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(item.unitPrice ?? item.rate ?? 0)}</td>
                                    <td className="py-3.5 px-6 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(item.amount ?? item.total ?? 0)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                                        No line items available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tax Breakdown + Grand Total */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                    </div>
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Tax Breakdown</h2>
                </div>

                <div className="max-w-sm ml-auto space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">Subtotal</span>
                        <span className="font-semibold text-primary-950 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    {cgst > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">CGST</span>
                            <span className="font-semibold text-primary-950 dark:text-white">{formatCurrency(cgst)}</span>
                        </div>
                    )}
                    {sgst > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">SGST</span>
                            <span className="font-semibold text-primary-950 dark:text-white">{formatCurrency(sgst)}</span>
                        </div>
                    )}
                    {igst > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">IGST</span>
                            <span className="font-semibold text-primary-950 dark:text-white">{formatCurrency(igst)}</span>
                        </div>
                    )}
                    {totalTax > 0 && (
                        <div className="flex items-center justify-between text-sm border-t border-neutral-100 dark:border-neutral-800 pt-3">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Total Tax</span>
                            <span className="font-semibold text-primary-950 dark:text-white">{formatCurrency(totalTax)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t-2 border-primary-200 dark:border-primary-800 pt-4">
                        <span className="text-base font-bold text-primary-950 dark:text-white">Grand Total</span>
                        <span className="text-2xl font-black text-primary-700 dark:text-primary-400">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden transition-colors">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="w-9 h-9 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-success-600 dark:text-success-400" />
                        </div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">Payment History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3.5 px-6 font-bold">Date</th>
                                    <th className="py-3.5 px-6 font-bold">Amount</th>
                                    <th className="py-3.5 px-6 font-bold">Method</th>
                                    <th className="py-3.5 px-6 font-bold">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {payments.map((payment: any, idx: number) => (
                                    <tr
                                        key={payment.id ?? idx}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-3.5 px-6 font-medium text-neutral-700 dark:text-neutral-300">
                                            {formatDate(payment.paymentDate ?? payment.date ?? payment.createdAt)}
                                        </td>
                                        <td className="py-3.5 px-6 font-bold text-primary-950 dark:text-white">
                                            {formatCurrency(payment.amount ?? 0)}
                                        </td>
                                        <td className="py-3.5 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                                {payment.paymentMethod ?? payment.method ?? '—'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-6 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                            {payment.paymentReference ?? payment.reference ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <MarkAsPaidModal
                open={showPayModal}
                onClose={() => setShowPayModal(false)}
                invoiceId={id ?? ''}
            />
            <VoidConfirmModal
                open={showVoidModal}
                onClose={() => setShowVoidModal(false)}
                onConfirm={handleVoid}
                isPending={voidMutation.isPending}
            />
        </div>
    );
}
