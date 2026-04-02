import { useState } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Search, Filter, Plus, ArrowRight, Loader2, X,
    Calendar, Building2, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvoiceList, useGenerateInvoice } from '@/features/super-admin/api/use-invoice-queries';
import { useTenantList } from '@/features/super-admin/api/use-tenant-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showSuccess, showError, showApiError } from '@/lib/toast';

// ── Constants ──

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Overdue', 'Cancelled'];
const TYPE_FILTERS = ['All', 'Subscription', 'One-Time', 'AMC'];

const INVOICE_TYPE_OPTIONS = [
    { value: 'subscription', label: 'Subscription' },
    { value: 'one-time', label: 'One-Time' },
    { value: 'amc', label: 'AMC' },
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// formatDate moved inside component

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
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border', c.bg, c.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
            {status}
        </span>
    );
}

// ── Type Badge ──

function TypeBadge({ type }: { type: string }) {
    const normalised = type?.toLowerCase().replace(/[\s-_]/g, '') ?? '';
    const cfg: Record<string, string> = {
        subscription: 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50',
        onetime: 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50',
        amc: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
    };
    const classes = cfg[normalised] ?? cfg.subscription;
    return (
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border', classes)}>
            {type}
        </span>
    );
}

// ── Generate Invoice Modal ──

function GenerateInvoiceModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [companyId, setCompanyId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [invoiceType, setInvoiceType] = useState('subscription');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    const { data: companiesData } = useTenantList({ limit: 200 });
    const companies: any[] = companiesData?.data ?? [];

    const generateMutation = useGenerateInvoice();

    const handleSubmit = async () => {
        if (!companyId) {
            showError('Validation Error', 'Please select a company.');
            return;
        }
        try {
            await generateMutation.mutateAsync({
                companyId,
                locationId: locationId || undefined,
                invoiceType,
                billingPeriodStart: periodStart || undefined,
                billingPeriodEnd: periodEnd || undefined,
            });
            showSuccess('Invoice Generated', 'The invoice has been created successfully.');
            onClose();
            setCompanyId('');
            setLocationId('');
            setInvoiceType('subscription');
            setPeriodStart('');
            setPeriodEnd('');
        } catch (err) {
            showApiError(err);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary-950 dark:text-white">Generate Invoice</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Create a new invoice for a tenant</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Company */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Company *</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <select
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all appearance-none"
                            >
                                <option value="">Select a company...</option>
                                {companies.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.displayName || c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location (optional) */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location (optional)</label>
                        <input
                            type="text"
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            placeholder="Location ID (leave empty for all)"
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>

                    {/* Invoice Type */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Invoice Type *</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <select
                                value={invoiceType}
                                onChange={(e) => setInvoiceType(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all appearance-none"
                            >
                                {INVOICE_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Billing Period */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Period Start</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="date"
                                    value={periodStart}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Period End</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="date"
                                    value={periodEnd}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>
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
                        disabled={generateMutation.isPending}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 dark:shadow-none"
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Screen ──

export function InvoiceListScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const formatDate = (dateStr: string) => dateStr ? fmt.date(dateStr) : '—';
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const limit = 25;

    const { data, isLoading, isError } = useInvoiceList({
        search: search || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase(),
        invoiceType: typeFilter === 'All' ? undefined : typeFilter.toLowerCase().replace(/[\s-]/g, '-'),
        page,
        limit,
    });

    const invoices: any[] = data?.data ?? [];
    const meta = (data as any)?.meta;
    const total = meta?.total ?? invoices.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Invoices</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage billing invoices across all tenants</p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Generate Invoice
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-4 transition-colors">

                {/* Search */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by invoice #, company name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
                    />
                </div>

                {/* Filter rows */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Status filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                        <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 mr-1 shrink-0">
                            <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-1">Status:</span>
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => { setStatusFilter(f); setPage(1); }}
                                className={cn(
                                    'px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                                    statusFilter === f
                                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30 dark:shadow-none'
                                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

                    {/* Type filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-1">Type:</span>
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => { setTypeFilter(f); setPage(1); }}
                                className={cn(
                                    'px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                                    typeFilter === f
                                        ? 'bg-accent-600 text-white shadow-sm shadow-accent-500/30 dark:shadow-none'
                                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load invoices. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                {isLoading ? <SkeletonTable rows={8} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Invoice #</th>
                                    <th className="py-4 px-6 font-bold">Tenant</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Amount</th>
                                    <th className="py-4 px-6 font-bold">Due Date</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {invoices.map((inv: any) => (
                                    <tr
                                        key={inv.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="font-mono text-xs font-bold text-primary-950 dark:text-white bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-700">
                                                {inv.invoiceNumber ?? inv.id?.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                                                    <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-semibold text-primary-950 dark:text-white text-sm truncate max-w-[200px]">
                                                    {inv.company?.displayName || inv.company?.name || inv.companyName || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <TypeBadge type={inv.invoiceType ?? inv.type ?? 'Subscription'} />
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-primary-950 dark:text-white">
                                                {formatCurrency(inv.totalAmount ?? inv.grandTotal ?? inv.amount ?? 0)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                                                {formatDate(inv.dueDate)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={inv.status ?? 'Pending'} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => navigate(`/app/billing/invoices/${inv.id}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            >
                                                View
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {invoices.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="search" title="No invoices found" message="Try adjusting your search or filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">
                        Showing {invoices.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={!meta || page >= (meta.totalPages ?? 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Generate Modal */}
            <GenerateInvoiceModal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} />
        </div>
    );
}
