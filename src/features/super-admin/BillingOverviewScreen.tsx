import {
    IndianRupee,
    TrendingUp,
    AlertCircle,
    Clock,
    Download,
    Eye,
    MoreVertical,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============ MOCK DATA ============
const KPIS = [
    { title: "Total MRR", value: "₹4,25,000", trend: "+12.5%", isUp: true, icon: TrendingUp, color: "success" },
    { title: "Annual Run Rate", value: "₹51.0L", trend: "+10.2%", isUp: true, icon: IndianRupee, color: "primary" },
    { title: "Overdue Amount", value: "₹45,200", trend: "3 Invoices", isUp: false, icon: AlertCircle, color: "danger" },
    { title: "Pending Clearance", value: "₹18,500", trend: "4 Invoices", isUp: null, icon: Clock, color: "warning" },
];

const RECENT_INVOICES = [
    { id: "INV-2026-081", company: "Apex Manufacturing", amount: "₹18,500", date: "Oct 12, 2026", status: "Paid" },
    { id: "INV-2026-080", company: "Steel Dynamics", amount: "₹12,000", date: "Oct 10, 2026", status: "Overdue" },
    { id: "INV-2026-079", company: "Rathi Automotive", amount: "₹0", date: "Oct 09, 2026", status: "Paid" },
    { id: "INV-2026-078", company: "Indo Metals Corp", amount: "₹32,000", date: "Oct 05, 2026", status: "Pending" },
    { id: "INV-2026-077", company: "Global Textiles Ltd", amount: "₹45,000", date: "Oct 01, 2026", status: "Overdue" },
];

const CHART_DATA = [
    { month: "May", rev: 60 },
    { month: "Jun", rev: 65 },
    { month: "Jul", rev: 72 },
    { month: "Aug", rev: 85 },
    { month: "Sep", rev: 80 },
    { month: "Oct", rev: 100 },
];

export function BillingOverviewScreen() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Billing & Revenue</h1>
                    <p className="text-neutral-500 mt-1">Platform-wide financial metrics and invoices</p>
                </div>
                <button className="flex items-center gap-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {KPIS.map((kpi, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-xl shadow-neutral-200/30">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                kpi.color === "success" ? "bg-success-50 text-success-600" :
                                    kpi.color === "primary" ? "bg-primary-50 text-primary-600" :
                                        kpi.color === "danger" ? "bg-danger-50 text-danger-600" :
                                            "bg-warning-50 text-warning-600"
                            )}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-xs font-bold px-2 py-1 rounded-full",
                                kpi.isUp === true ? "bg-success-50 text-success-700" :
                                    kpi.isUp === false ? "bg-danger-50 text-danger-700" :
                                        "bg-neutral-100 text-neutral-600"
                            )}>
                                {kpi.trend}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{kpi.value}</h3>
                        <p className="text-sm text-neutral-500 font-medium mt-1">{kpi.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Chart (CSS Based) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6 shadow-xl shadow-neutral-200/30">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-neutral-900">Revenue Trend (Last 6 Months)</h2>
                        <select className="bg-neutral-50 border border-neutral-200 text-sm font-medium rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500/20">
                            <option>MRR</option>
                            <option>ARR</option>
                            <option>Collections</option>
                        </select>
                    </div>

                    <div className="h-64 flex items-end gap-4 sm:gap-8 justify-between px-2 sm:px-6 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="border-b border-dashed border-neutral-400 w-full" />
                            ))}
                        </div>

                        {CHART_DATA.map((data, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center flex-1 group">
                                {/* Tooltip */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-xs font-bold py-1 px-2 rounded whitespace-nowrap">
                                    ₹{data.rev * 5000}
                                </div>
                                {/* Bar */}
                                <div className="w-full max-w-[48px] h-full flex items-end justify-center">
                                    <div
                                        className="w-full bg-gradient-to-t from-primary-600 to-accent-400 rounded-t-xl transition-all duration-700 hover:brightness-110"
                                        style={{ height: data.rev + '%' }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-neutral-500 mt-4">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Small Action Cards */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <h3 className="text-lg font-bold mb-2">Generate Invoice</h3>
                        <p className="text-primary-100 text-sm mb-6">Create a manual ad-hoc invoice for custom enterprise feature development.</p>
                        <button className="w-full py-2.5 bg-white text-primary-700 font-bold rounded-xl shadow-sm hover:bg-primary-50 transition-colors">
                            Create New
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">Payment Gateways</h3>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                                    <span className="text-[#635BFF] font-bold text-xs">ST</span>
                                </div>
                                <span className="font-semibold text-neutral-800">Stripe</span>
                            </div>
                            <span className="text-[10px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-xs">RP</span>
                                </div>
                                <span className="font-semibold text-neutral-800">Razorpay</span>
                            </div>
                            <span className="text-[10px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-200/30 overflow-hidden">
                <div className="flex px-6 py-5 items-center justify-between border-b border-neutral-100">
                    <h2 className="text-lg font-bold text-neutral-900">Recent Invoices</h2>
                    <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        View All <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                                <th className="py-3 px-6">Invoice ID</th>
                                <th className="py-3 px-6">Company</th>
                                <th className="py-3 px-6">Date</th>
                                <th className="py-3 px-6">Amount</th>
                                <th className="py-3 px-6">Status</th>
                                <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {RECENT_INVOICES.map((inv) => (
                                <tr key={inv.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                                    <td className="py-4 px-6 font-bold text-neutral-900">{inv.id}</td>
                                    <td className="py-4 px-6 font-semibold text-neutral-700">{inv.company}</td>
                                    <td className="py-4 px-6 text-neutral-500">{inv.date}</td>
                                    <td className="py-4 px-6 font-bold text-neutral-900">{inv.amount}</td>
                                    <td className="py-4 px-6">
                                        <span className={cn(
                                            "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            inv.status === "Paid" ? "bg-success-50 text-success-700 border-success-200" :
                                                inv.status === "Pending" ? "bg-warning-50 text-warning-700 border-warning-200" :
                                                    "bg-danger-50 text-danger-700 border-danger-200"
                                        )}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-neutral-400">
                                            <button className="p-1.5 hover:bg-neutral-100 hover:text-primary-600 rounded-md transition-colors"><Download className="w-4 h-4" /></button>
                                            <button className="p-1.5 hover:bg-neutral-100 hover:text-primary-600 rounded-md transition-colors"><Eye className="w-4 h-4" /></button>
                                            <button className="p-1.5 hover:bg-neutral-100 hover:text-neutral-700 rounded-md transition-colors"><MoreVertical className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
