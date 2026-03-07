import {
    Building2,
    Users,
    IndianRupee,
    Blocks,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============ MOCK DATA ============

const KPIS = [
    {
        title: "Active Companies",
        value: "148",
        change: "+12",
        trend: "up",
        icon: Building2,
        gradient: "from-primary-500 to-primary-600",
        bg: "bg-primary-50",
        text: "text-primary-600",
    },
    {
        title: "Total Users",
        value: "12.4k",
        change: "+842",
        trend: "up",
        icon: Users,
        gradient: "from-info-500 to-info-600",
        bg: "bg-info-50",
        text: "text-info-600",
    },
    {
        title: "Monthly Revenue",
        value: "₹18.5L",
        change: "+15%",
        trend: "up",
        icon: IndianRupee,
        gradient: "from-success-500 to-success-600",
        bg: "bg-success-50",
        text: "text-success-600",
    },
    {
        title: "Active Modules",
        value: "8/10",
        change: "Avg per tenant",
        trend: "neutral",
        icon: Blocks,
        gradient: "from-accent-500 to-accent-600",
        bg: "bg-accent-50",
        text: "text-accent-600",
    },
];

const TENANTS = [
    { id: 1, name: "Apex Manufacturing", users: 156, status: "Active", revenue: "₹24,500" },
    { id: 2, name: "Steel Dynamics", users: 89, status: "Active", revenue: "₹18,000" },
    { id: 3, name: "Rathi Automotive", users: 45, status: "Trial", revenue: "₹0" },
    { id: 4, name: "Indo Metals Corp", users: 210, status: "Suspended", revenue: "₹32,000" },
    { id: 5, name: "Precision CNC", users: 12, status: "Active", revenue: "₹5,500" },
];

const ACTIVITY = [
    { id: 1, text: "Apex Manufacturing upgraded to Enterprise tier", time: "2 hours ago" },
    { id: 2, text: "Rathi Automotive started 14-day trial", time: "5 hours ago" },
    { id: 3, text: "System maintenance completed successfully", time: "1 day ago" },
    { id: 4, text: "Indo Metals Corp account suspended — past due", time: "2 days ago" },
];

export function DashboardScreen() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Super Admin Overview</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Platform metrics and tenant health</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {KPIS.map((kpi, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 transition-transform hover:-translate-y-1 duration-300"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bg, "dark:bg-opacity-10 dark:text-opacity-90")}>
                                <kpi.icon className={cn("w-6 h-6", kpi.text)} />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider",
                                kpi.trend === "up" ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400" :
                                    kpi.trend === "down" ? "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400" :
                                        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            )}>
                                {kpi.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                                {kpi.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                                {kpi.change}
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{kpi.value}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">{kpi.title}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tenant Table */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Recent Tenants</h2>
                        <button className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="pb-3 font-bold">Company</th>
                                    <th className="pb-3 font-bold text-center">Users</th>
                                    <th className="pb-3 font-bold">Status</th>
                                    <th className="pb-3 font-bold text-right">MRR</th>
                                    <th className="pb-3 px-2"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {TENANTS.map((tenant) => (
                                    <tr key={tenant.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 overflow-hidden">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                                                    <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white truncate">{tenant.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-medium text-neutral-600 dark:text-neutral-400">{tenant.users}</td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                                tenant.status === "Active" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800" :
                                                    tenant.status === "Trial" ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800" :
                                                        "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800"
                                            )}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-bold text-primary-950 dark:text-white">{tenant.revenue}</td>
                                        <td className="py-4 text-right">
                                            <button className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Activity Log</h2>
                        <Activity className="w-5 h-5 text-neutral-400" />
                    </div>

                    <div className="flex-1 space-y-6">
                        {ACTIVITY.map((item, i) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/30 z-10" />
                                    {i !== ACTIVITY.length - 1 && (
                                        <div className="absolute top-3 bottom-[-24px] w-px bg-neutral-200 dark:bg-neutral-800" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{item.text}</p>
                                    <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-3 mt-6 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
