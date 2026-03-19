import { useNavigate } from "react-router-dom";
import {
    IndianRupee,
    TrendingUp,
    AlertCircle,
    Clock,
    Download,
    Eye,
    MoreVertical,
    ArrowUpRight,
    ChevronRight,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBillingSummary, useInvoices, useRevenueChart } from "@/features/super-admin/api/use-dashboard-queries";
import { SkeletonKPIGrid, SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// ============ Helpers ============

function formatCurrency(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonthLabel(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
}

function Spinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
    );
}

export function BillingOverviewScreen() {
    const navigate = useNavigate();
    const summaryQuery = useBillingSummary();
    const invoicesQuery = useInvoices({ page: 1, limit: 10 });
    const chartQuery = useRevenueChart();

    const summary = summaryQuery.data?.data;
    const invoiceData = invoicesQuery.data?.data;
    const invoices = invoiceData?.invoices ?? [];
    const chartData = chartQuery.data?.data ?? [];

    // Build KPI array from real data
    const KPIS = summary ? [
        { title: "Total MRR", value: formatCurrency(summary.mrr), trend: "", isUp: true, icon: TrendingUp, color: "success" },
        { title: "Annual Run Rate", value: formatCurrency(summary.arr), trend: "", isUp: true, icon: IndianRupee, color: "primary" },
        { title: "Overdue Amount", value: formatCurrency(summary.overdue?.amount ?? 0), trend: `${summary.overdue?.count ?? 0} Invoices`, isUp: false, icon: AlertCircle, color: "danger" },
        { title: "Pending Clearance", value: formatCurrency(summary.pending?.amount ?? 0), trend: `${summary.pending?.count ?? 0} Invoices`, isUp: null as boolean | null, icon: Clock, color: "warning" },
    ] : [];

    // Compute max revenue for chart scaling
    const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.revenue), 1) : 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Billing & Revenue</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Platform-wide financial metrics and invoices</p>
                </div>
                <button className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* KPI Row */}
            {summaryQuery.isLoading ? <SkeletonKPIGrid count={4} /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {KPIS.map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 transition-transform hover:-translate-y-1 duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center dark:bg-opacity-10",
                                    kpi.color === "success" ? "bg-success-50 text-success-600 dark:text-success-500" :
                                        kpi.color === "primary" ? "bg-primary-50 text-primary-600 dark:text-primary-500" :
                                            kpi.color === "danger" ? "bg-danger-50 text-danger-600 dark:text-danger-500" :
                                                "bg-warning-50 text-warning-600 dark:text-warning-500"
                                )}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                {kpi.trend && (
                                    <span className={cn(
                                        "text-[11px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                                        kpi.isUp === true ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400" :
                                            kpi.isUp === false ? "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400" :
                                                "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                    )}>
                                        {kpi.trend}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{kpi.value}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">{kpi.title}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart (CSS Based) */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-xl shadow-neutral-900/5">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">Revenue Trend (Last 6 Months)</h2>
                        <select className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500/20">
                            <option>MRR</option>
                            <option>ARR</option>
                            <option>Collections</option>
                        </select>
                    </div>

                    {chartQuery.isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
                            <Skeleton width="100%" height={200} borderRadius={8} />
                        </div>
                    ) : (
                        <div className="h-64 flex items-end gap-4 sm:gap-8 justify-between px-2 sm:px-6 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-40 z-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="border-b border-dashed border-neutral-400 dark:border-neutral-600 w-full" />
                                ))}
                            </div>

                            {chartData.map((data: any, i: number) => {
                                const pct = maxRevenue > 0 ? Math.max((data.revenue / maxRevenue) * 100, 2) : 2;
                                return (
                                    <div key={i} className="relative z-10 flex flex-col items-center flex-1 group">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-bold py-1 px-2 rounded whitespace-nowrap">
                                            {formatCurrency(data.revenue)}
                                        </div>
                                        {/* Bar */}
                                        <div className="w-full max-w-[48px] h-full flex items-end justify-center">
                                            <div
                                                className="w-full bg-gradient-to-t from-primary-600 to-accent-400 rounded-t-xl transition-all duration-700 hover:brightness-110"
                                                style={{ height: pct + '%' }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-4">
                                            {getMonthLabel(data.month)}
                                        </span>
                                    </div>
                                );
                            })}
                            {chartData.length === 0 && (
                                <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center w-full py-8">No revenue data available.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Small Action Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20 dark:shadow-none relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <h3 className="text-lg font-bold mb-2 pt-2">Generate Invoice</h3>
                        <p className="text-primary-100 text-sm mb-6 max-w-[90%]">Create a manual ad-hoc invoice for custom enterprise feature development.</p>
                        <button className="w-full py-2.5 bg-white text-primary-700 font-bold rounded-xl shadow-sm hover:bg-primary-50 transition-colors">
                            Create New
                        </button>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-4">Payment Gateways</h3>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 mb-3 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                                    <span className="text-[#635BFF] font-bold text-xs">ST</span>
                                </div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Stripe</span>
                            </div>
                            <span className="text-[10px] font-bold text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">RP</span>
                                </div>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Razorpay</span>
                            </div>
                            <span className="text-[10px] font-bold text-success-700 dark:text-success-400 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate('/app/billing/invoices')}
                    className="flex-1 flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 px-6 py-4 shadow-sm hover:shadow-md transition-all group"
                >
                    <span className="text-sm font-bold text-primary-950 dark:text-white">All Invoices</span>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </button>
                <button
                    onClick={() => navigate('/app/billing/payments')}
                    className="flex-1 flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 px-6 py-4 shadow-sm hover:shadow-md transition-all group"
                >
                    <span className="text-sm font-bold text-primary-950 dark:text-white">Payment History</span>
                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                </button>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                <div className="flex px-6 py-5 items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Recent Invoices</h2>
                    <button
                        onClick={() => navigate('/app/billing/invoices')}
                        className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                        View All <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                {invoicesQuery.isLoading ? <SkeletonTable rows={6} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Invoice ID</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold">Amount</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {invoices.map((inv: any) => {
                                    const companyName = inv.subscription?.tenant?.company?.displayName
                                        ?? inv.subscription?.tenant?.company?.name
                                        ?? '—';
                                    const statusLabel = (inv.status ?? '').charAt(0).toUpperCase() + (inv.status ?? '').slice(1).toLowerCase();
                                    return (
                                        <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{inv.invoiceNumber ?? inv.id}</td>
                                            <td className="py-4 px-6 font-semibold text-neutral-700 dark:text-neutral-300">{companyName}</td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400">{formatDate(inv.createdAt)}</td>
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{formatCurrency(inv.amount ?? 0)}</td>
                                            <td className="py-4 px-6">
                                                <span className={cn(
                                                    "inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                                    statusLabel === "Paid" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" :
                                                        statusLabel === "Pending" ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" :
                                                            "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
                                                )}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-neutral-400 dark:text-neutral-500">
                                                    <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                                                    <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                                    <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="inbox" title="No invoices yet" message="Invoices will appear here once billing begins." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
