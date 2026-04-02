import { useNavigate } from "react-router-dom";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    CreditCard, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle,
    ChevronRight, ArrowUpRight, IndianRupee, Loader2, Boxes, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMySubscription, useMyCostBreakdown, useMyInvoices } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonKPIGrid, SkeletonTable, Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Helpers ──

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

// formatDate moved inside component

function getStatusConfig(status?: string) {
    switch (status?.toLowerCase()) {
        case "active":
            return { color: "success", icon: CheckCircle, label: "Active" };
        case "trial":
            return { color: "info", icon: Clock, label: "Trial" };
        case "expired":
        case "cancelled":
            return { color: "danger", icon: AlertCircle, label: status };
        case "past_due":
        case "overdue":
            return { color: "warning", icon: AlertCircle, label: "Past Due" };
        default:
            return { color: "neutral", icon: CreditCard, label: status ?? "Unknown" };
    }
}

// ── Main Screen ──

export function BillingDashboardScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const navigate = useNavigate();
    const subQuery = useMySubscription();
    const costQuery = useMyCostBreakdown();
    const invoicesQuery = useMyInvoices({ page: 1, limit: 5 });

    const sub = subQuery.data?.data;
    const cost = costQuery.data?.data;
    const invoiceData = invoicesQuery.data?.data;
    const recentInvoices = invoiceData?.invoices ?? [];

    // Derive values from subscription response
    const activeModuleCount = sub?.modules ? Object.values(sub.modules).filter(Boolean).length : 0;
    const activeModuleNames = sub?.modules ? Object.entries(sub.modules).filter(([, v]) => v).map(([k]) => k) : [];
    const computedNextBilling = sub?.startDate && sub?.billingType
        ? (() => {
            const d = new Date(sub.startDate);
            if (sub.billingType === 'MONTHLY') d.setMonth(d.getMonth() + 1);
            else if (sub.billingType === 'ANNUAL' || sub.billingType === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
            else if (sub.billingType === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
            return d.toISOString();
        })()
        : undefined;

    const statusCfg = getStatusConfig(sub?.status);
    const StatusIcon = statusCfg.icon;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Billing</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your subscription, invoices, and payments.</p>
            </div>

            {/* Subscription Status Card */}
            {subQuery.isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : sub ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subscription Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20 dark:shadow-none relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Subscription</h2>
                                        <p className="text-primary-100 text-sm">{sub.tierLabel ?? sub.planId ?? "Standard"} Plan</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm",
                                    "bg-white/20 text-white"
                                )}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusCfg.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-primary-200 text-xs font-medium mb-1">Billing Cycle</p>
                                    <p className="font-bold text-lg capitalize">{sub.billingType?.toLowerCase() ?? "Monthly"}</p>
                                </div>
                                <div>
                                    <p className="text-primary-200 text-xs font-medium mb-1">Active Modules</p>
                                    <p className="font-bold text-lg">{activeModuleCount}</p>
                                </div>
                                <div>
                                    <p className="text-primary-200 text-xs font-medium mb-1">Pricing</p>
                                    <p className="font-bold text-lg">{formatCurrency(sub.tierPerUserPrice ?? 0)}<span className="text-sm font-normal text-primary-200">/user</span></p>
                                </div>
                                <div>
                                    <p className="text-primary-200 text-xs font-medium mb-1">Next Billing</p>
                                    <p className="font-bold text-lg">{formatDate(computedNextBilling)}</p>
                                </div>
                            </div>

                            {sub.trialEndsAt && (
                                <div className="mt-5 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary-200" />
                                        <p className="text-sm">
                                            Trial ends on <strong>{formatDate(sub.trialEndsAt)}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Monthly Total */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-xl shadow-neutral-900/5 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center mb-4">
                                <IndianRupee className="w-6 h-6 text-success-600 dark:text-success-400" />
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Monthly Total</p>
                            <h3 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight mt-1">
                                {formatCurrency(cost?.totals?.monthly ?? sub.tierBasePrice ?? 0)}
                            </h3>
                        </div>
                        {cost?.totals?.annual != null && cost.totals.annual > 0 && (
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4">
                                <p className="text-xs text-neutral-400 font-medium">Annual estimate</p>
                                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatCurrency(cost.totals.annual)}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Cost Breakdown */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Cost Breakdown</h2>
                </div>

                {costQuery.isLoading ? (
                    <SkeletonTable rows={5} cols={4} />
                ) : cost && cost.modules && cost.modules.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Module</th>
                                    <th className="py-4 px-6 font-bold">Catalogue Price</th>
                                    <th className="py-4 px-6 font-bold text-right">Custom Price</th>
                                    <th className="py-4 px-6 font-bold text-right">Effective Price</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {cost.modules.map((mod) => (
                                    <tr key={mod.moduleId} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                    <Boxes className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-semibold text-primary-950 dark:text-white">{mod.moduleName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">
                                            {formatCurrency(mod.cataloguePrice)}/mo
                                        </td>
                                        <td className="py-4 px-6 text-right text-neutral-600 dark:text-neutral-300">{mod.customPrice != null ? formatCurrency(mod.customPrice) : "—"}</td>
                                        <td className="py-4 px-6 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(mod.effectivePrice)}/mo</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-800">
                                    <td colSpan={3} className="py-3 px-6 text-sm font-bold text-neutral-600 dark:text-neutral-300 text-right">Tier ({cost.tier?.label})</td>
                                    <td className="py-3 px-6 text-right font-bold text-primary-950 dark:text-white">{formatCurrency(cost.tier?.basePrice ?? 0)} base + {formatCurrency(cost.tier?.perUserPrice ?? 0)}/user</td>
                                </tr>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <td colSpan={3} className="py-3 px-6 text-sm font-bold text-neutral-600 dark:text-neutral-300 text-right">Locations</td>
                                    <td className="py-3 px-6 text-right font-bold text-neutral-700 dark:text-neutral-300">{cost.totals?.locationCount ?? 0}</td>
                                </tr>
                                <tr className="bg-primary-50/50 dark:bg-primary-900/10">
                                    <td colSpan={3} className="py-4 px-6 text-base font-bold text-primary-950 dark:text-white text-right">Monthly Total</td>
                                    <td className="py-4 px-6 text-right text-lg font-bold text-primary-700 dark:text-primary-400">{formatCurrency(cost.totals?.monthly ?? 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon="inbox" title="No cost data available" message="Cost breakdown will appear once your subscription is active." />
                )}
            </div>

            {/* Quick Links */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate("/app/company/billing/invoices")}
                    className="flex-1 flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 px-6 py-4 shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span className="text-sm font-bold text-primary-950 dark:text-white">All Invoices</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </button>
                <button
                    onClick={() => navigate("/app/company/billing/payments")}
                    className="flex-1 flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 px-6 py-4 shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                        <span className="text-sm font-bold text-primary-950 dark:text-white">Payment History</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </button>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="flex px-6 py-5 items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Recent Invoices</h2>
                    <button
                        onClick={() => navigate("/app/company/billing/invoices")}
                        className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                        View All <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                {invoicesQuery.isLoading ? (
                    <SkeletonTable rows={5} cols={5} />
                ) : recentInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Invoice #</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Amount</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {recentInvoices.map((inv) => {
                                    const statusLabel = (inv.status ?? "").charAt(0).toUpperCase() + (inv.status ?? "").slice(1).toLowerCase();
                                    return (
                                        <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{inv.invoiceNumber ?? inv.id}</td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">{formatDate(inv.date ?? inv.createdAt)}</td>
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{formatCurrency(inv.totalAmount ?? inv.amount)}</td>
                                            <td className="py-4 px-6">
                                                <InvoiceStatusBadge status={statusLabel} />
                                            </td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">{formatDate(inv.dueDate)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState icon="inbox" title="No invoices yet" message="Invoices will appear here once billing begins." />
                )}
            </div>
        </div>
    );
}

// ── Invoice Status Badge ──

function InvoiceStatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { bg: string; text: string; dot: string }> = {
        Paid: { bg: "bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800/50", text: "text-success-700 dark:text-success-400", dot: "bg-success-500" },
        Pending: { bg: "bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/50", text: "text-warning-700 dark:text-warning-400", dot: "bg-warning-500" },
        Overdue: { bg: "bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800/50", text: "text-danger-700 dark:text-danger-400", dot: "bg-danger-500" },
    };
    const c = cfg[status] ?? cfg.Pending;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border", c.bg, c.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
            {status}
        </span>
    );
}
