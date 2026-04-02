import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useNavigate } from "react-router-dom";
import {
    CreditCard, ArrowLeft, ChevronLeft, ChevronRight, Wallet,
    Landmark, Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyPayments } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Helpers ──

const PAGE_SIZE = 10;

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

// formatDate moved inside component

function getMethodIcon(method?: string) {
    switch (method?.toLowerCase()) {
        case "upi":
            return Smartphone;
        case "bank_transfer":
        case "neft":
        case "rtgs":
        case "imps":
            return Landmark;
        case "card":
        case "credit_card":
        case "debit_card":
            return CreditCard;
        default:
            return Wallet;
    }
}

function getMethodLabel(method?: string): string {
    if (!method) return "—";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Status Badge ──

function PaymentStatusBadge({ status }: { status?: string }) {
    const s = (status ?? "").toLowerCase();
    const cfg: Record<string, { bg: string; text: string }> = {
        success: { bg: "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/50", text: "text-success-700 dark:text-success-400" },
        completed: { bg: "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/50", text: "text-success-700 dark:text-success-400" },
        pending: { bg: "bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400" },
        failed: { bg: "bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400" },
        refunded: { bg: "bg-info-50 border-info-200 dark:bg-info-900/20 dark:border-info-800/50", text: "text-info-700 dark:text-info-400" },
    };
    const c = cfg[s] ?? cfg.pending;
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", c.bg, c.text)}>
            {label || "—"}
        </span>
    );
}

// ── Main Screen ──

export function MyPaymentsScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useMyPayments({ page, limit: PAGE_SIZE });
    const paymentData = data?.data;
    const payments = paymentData?.payments ?? [];
    const total = paymentData?.total ?? 0;
    const limit = paymentData?.limit ?? PAGE_SIZE;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/app/company/billing")}
                    className="p-2 rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Payment History</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {total > 0 ? `${total} total payments` : "Track all your payments."}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={PAGE_SIZE} cols={6} />
                ) : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Invoice #</th>
                                    <th className="py-4 px-6 font-bold">Amount</th>
                                    <th className="py-4 px-6 font-bold">Method</th>
                                    <th className="py-4 px-6 font-bold">Reference</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {payments.map((pmt) => {
                                    const MethodIcon = getMethodIcon(pmt.method);
                                    return (
                                        <tr key={pmt.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-300 font-medium">{formatDate(pmt.paidAt ?? pmt.createdAt)}</td>
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{pmt.invoice?.invoiceNumber ?? pmt.invoiceId ?? "—"}</td>
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{formatCurrency(pmt.amount)}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                        <MethodIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                                                    </div>
                                                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">{getMethodLabel(pmt.method)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                                                {pmt.reference ?? "—"}
                                            </td>
                                            <td className="py-4 px-6">
                                                <PaymentStatusBadge status={pmt.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon="inbox" title="No payments yet" message="Payments will appear here once transactions are recorded." />
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
        </div>
    );
}
