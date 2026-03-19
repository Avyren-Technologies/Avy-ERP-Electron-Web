import {
    Users,
    UserCheck,
    CalendarOff,
    ClipboardCheck,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    BarChart3,
    Calendar,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyAdminStats } from "@/features/super-admin/api/use-dashboard-queries";
import { useAuthStore, getDisplayName } from "@/store/useAuthStore";

// ============ TYPES ============

interface KPI {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
}

// ============ MOCK / FALLBACK DATA ============

const QUICK_ACTIONS = [
    {
        id: "employees",
        title: "Manage Employees",
        description: "View and manage your workforce",
        icon: Users,
        gradient: "from-primary-500 to-primary-600",
    },
    {
        id: "attendance",
        title: "Attendance",
        description: "Track daily attendance records",
        icon: UserCheck,
        gradient: "from-success-500 to-success-600",
    },
    {
        id: "leave",
        title: "Leave Requests",
        description: "Review pending leave applications",
        icon: Calendar,
        gradient: "from-accent-500 to-accent-600",
    },
    {
        id: "reports",
        title: "Reports",
        description: "Generate and view analytics",
        icon: BarChart3,
        gradient: "from-info-500 to-info-600",
    },
];

const RECENT_ACTIVITY = [
    { id: 1, text: "Rahul Sharma onboarded to Engineering team", time: "30 minutes ago" },
    { id: 2, text: "Priya Patel's casual leave approved (2 days)", time: "1 hour ago" },
    { id: 3, text: "3 employees marked late today", time: "2 hours ago" },
    { id: 4, text: "March 2026 payroll batch processed", time: "1 day ago" },
];

const MODULE_USAGE = [
    { name: "HR Management", usage: 92 },
    { name: "Attendance", usage: 87 },
    { name: "Payroll", usage: 78 },
    { name: "Inventory", usage: 45 },
    { name: "Production", usage: 32 },
];

// ============ MAIN COMPONENT ============

export function CompanyAdminDashboard() {
    const { data, isLoading } = useCompanyAdminStats();
    const user = useAuthStore((s) => s.user);
    const displayName = getDisplayName(user);

    const stats = data?.data as any;

    const kpis: KPI[] = [
        {
            title: "Total Employees",
            value: stats?.totalEmployees?.toString() ?? "\u2014",
            change: stats?.employeeChange ? `+${stats.employeeChange}` : "\u2014",
            trend: "up",
            icon: Users,
            bg: "bg-primary-50",
            text: "text-primary-600",
        },
        {
            title: "Active Today",
            value: stats?.activeToday?.toString() ?? "\u2014",
            change: stats?.activePercent ? `${stats.activePercent}%` : "\u2014",
            trend: "up",
            icon: UserCheck,
            bg: "bg-success-50",
            text: "text-success-600",
        },
        {
            title: "On Leave",
            value: stats?.onLeave?.toString() ?? "\u2014",
            change: "Today",
            trend: "neutral",
            icon: CalendarOff,
            bg: "bg-warning-50",
            text: "text-warning-600",
        },
        {
            title: "Pending Approvals",
            value: stats?.pendingApprovals?.toString() ?? "\u2014",
            change: stats?.pendingApprovals && stats.pendingApprovals > 0 ? "Action needed" : "\u2014",
            trend: stats?.pendingApprovals && stats.pendingApprovals > 0 ? "down" : "neutral",
            icon: ClipboardCheck,
            bg: "bg-info-50",
            text: "text-info-600",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                    Welcome, {displayName}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Company dashboard overview and quick actions
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 transition-transform hover:-translate-y-1 duration-300",
                            isLoading && "animate-pulse"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bg, "dark:bg-opacity-10")}>
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

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-primary-950 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            className="group bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/60 dark:border-neutral-800 shadow-md shadow-neutral-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                        >
                            <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-tr flex items-center justify-center mb-3 shadow-lg", action.gradient)}>
                                <action.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">{action.title}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{action.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Module Usage */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Module Usage</h2>
                        <FileText className="w-5 h-5 text-neutral-400" />
                    </div>

                    <div className="space-y-4">
                        {MODULE_USAGE.map((mod) => (
                            <div key={mod.name} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-primary-950 dark:text-white w-36 truncate">{mod.name}</span>
                                <div className="flex-1 h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            mod.usage >= 80 ? "bg-success-500" :
                                                mod.usage >= 50 ? "bg-warning-500" :
                                                    "bg-neutral-400"
                                        )}
                                        style={{ width: `${mod.usage}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 w-10 text-right">{mod.usage}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Recent Activity</h2>
                        <Activity className="w-5 h-5 text-neutral-400" />
                    </div>

                    <div className="flex-1 space-y-6">
                        {RECENT_ACTIVITY.map((item, i) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/30 z-10" />
                                    {i !== RECENT_ACTIVITY.length - 1 && (
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
