import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { R2Link } from '@/components/R2Link';
import { useNavigate } from "react-router-dom";
import {
    FileText, Search, Filter, Download, Eye, X, ChevronLeft, ChevronRight,
    ArrowLeft, Loader2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyInvoices, useMyInvoiceDetail } from "@/features/company-admin/api/use-company-admin-queries";
import type { MyInvoice } from "@/lib/api/company-admin";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Constants & Helpers ──

const STATUS_FILTERS = ["All", "Pending", "Paid", "Overdue"];
const PAGE_SIZE = 10;

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

// formatDate moved inside component

// ── Status Badge ──

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; text: string; dot: string }> = {
        Paid: { bg: "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/50", text: "text-success-700 dark:text-success-400", dot: "bg-success-500" },
        Pending: { bg: "bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400", dot: "bg-warning-500" },
        Overdue: { bg: "bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400", dot: "bg-danger-500" },
        Cancelled: { bg: "bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700", text: "text-neutral-500 dark:text-neutral-400", dot: "bg-neutral-400" },
    };
    const c = cfg[status] ?? cfg.Pending;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border", c.bg, c.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
            {status}
        </span>
    );
}

// ── Invoice Detail Modal ──

function InvoiceDetailModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => (d ? fmt.date(d) : "—");
    const { data, isLoading } = useMyInvoiceDetail(invoiceId);
    const invoice = data?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-bold text-primary-950 dark:text-white">
                        Invoice {invoice?.invoiceNumber ?? invoiceId}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : invoice ? (
                        <div className="space-y-6">
                            {/* Summary Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Date</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{formatDate(invoice.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Due Date</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{formatDate(invoice.dueDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Status</p>
                                    <StatusBadge status={(invoice.status ?? "").charAt(0).toUpperCase() + (invoice.status ?? "").slice(1).toLowerCase()} />
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">Period</p>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">
                                        {invoice.billingPeriodStart && invoice.billingPeriodEnd
                                            ? `${formatDate(invoice.billingPeriodStart)} - ${formatDate(invoice.billingPeriodEnd)}`
                                            : "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Line Items */}
                            {invoice.lineItems && invoice.lineItems.length > 0 && (
                                <div className="bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest border-b border-neutral-200 dark:border-neutral-700">
                                                <th className="py-3 px-4 font-bold">Description</th>
                                                <th className="py-3 px-4 font-bold text-right">Qty</th>
                                                <th className="py-3 px-4 font-bold text-right">Rate</th>
                                                <th className="py-3 px-4 font-bold text-right">GST</th>
                                                <th className="py-3 px-4 font-bold text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {invoice.lineItems.map((item, i) => (
                                                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                    <td className="py-3 px-4 font-medium text-primary-950 dark:text-white">{item.description}</td>
                                                    <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-300">{item.quantity}</td>
                                                    <td className="py-3 px-4 text-right text-neutral-600 dark:text-neutral-300">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="py-3 px-4 text-right text-neutral-500 dark:text-neutral-400">{item.gst != null ? formatCurrency(item.gst) : "—"}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                                        <span className="font-bold text-primary-950 dark:text-white">{formatCurrency(invoice.subtotal ?? invoice.amount)}</span>
                                    </div>
                                    {invoice.totalTax != null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500 dark:text-neutral-400">Tax/GST</span>
                                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formatCurrency(invoice.totalTax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                        <span className="font-bold text-primary-950 dark:text-white">Total</span>
                                        <span className="font-bold text-primary-700 dark:text-primary-400">{formatCurrency(invoice.totalAmount ?? invoice.amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Link */}
                            {invoice.pdfUrl && (
                                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <R2Link
                                        fileKey={invoice.pdfUrl}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-xl font-bold text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </R2Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState icon="error" title="Invoice not found" message="Could not load invoice details." />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Screen ──

export function MyInvoicesScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("All");
    const [detailId, setDetailId] = useState<string | null>(null);

    const queryParams = {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter !== "All" ? { status: statusFilter.toLowerCase() } : {}),
    };

    const { data, isLoading } = useMyInvoices(queryParams);
    const invoiceData = data?.data;
    const invoices = invoiceData?.invoices ?? [];
    const total = invoiceData?.total ?? 0;
    const limit = invoiceData?.limit ?? PAGE_SIZE;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/app/company/billing")}
                        className="p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Invoices</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            {total > 0 ? `${total} total invoices` : "Your billing invoices"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                statusFilter === s
                                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700"
                                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-700"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={PAGE_SIZE} cols={6} />
                ) : invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Invoice #</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Amount</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Due Date</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {invoices.map((inv) => {
                                    const statusLabel = (inv.status ?? "").charAt(0).toUpperCase() + (inv.status ?? "").slice(1).toLowerCase();
                                    return (
                                        <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{inv.invoiceNumber ?? inv.id}</td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">{formatDate(inv.createdAt)}</td>
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{formatCurrency(inv.totalAmount ?? inv.amount)}</td>
                                            <td className="py-4 px-6"><StatusBadge status={statusLabel} /></td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">{formatDate(inv.dueDate)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-neutral-400 dark:text-neutral-500">
                                                    <button
                                                        onClick={() => setDetailId(inv.id)}
                                                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                                                        title="View details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {inv.pdfUrl && (
                                                        <R2Link
                                                            fileKey={inv.pdfUrl}
                                                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </R2Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon="inbox"
                        title="No invoices found"
                        message={statusFilter !== "All" ? `No ${statusFilter.toLowerCase()} invoices.` : "Invoices will appear here once billing begins."}
                    />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {page} of {totalPages}{total > 0 ? ` (${total} total)` : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailId && <InvoiceDetailModal invoiceId={detailId} onClose={() => setDetailId(null)} />}
        </div>
    );
}
