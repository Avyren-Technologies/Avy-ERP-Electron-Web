import {
    Building2,
    Users,
    IndianRupee,
    Blocks,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Activity,
    Loader2
} from "lucide-react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSuperAdminStats, useRecentActivity } from "@/features/super-admin/api/use-dashboard-queries";
import { useTenantList } from "@/features/super-admin/api/use-tenant-queries";
import { SkeletonKPIGrid, SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// ============ Helpers ============

function formatCurrency(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

function formatCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// ============ Spinner ============

function Spinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
    );
}

export function DashboardScreen() {
    const navigate = useNavigate();
    const statsQuery = useSuperAdminStats();
    const activityQuery = useRecentActivity(10);
    const tenantsQuery = useTenantList({ page: 1, limit: 5 });

    const stats = statsQuery.data?.data;
    const activities = activityQuery.data?.data ?? [];
    const tenants = tenantsQuery.data?.data ?? [];

    // Build KPI cards from real stats
    const KPIS: Array<{
        title: string;
        value: string;
        change: string;
        trend: "up" | "down" | "neutral";
        icon: React.ComponentType<{ className?: string }>;
        bg: string;
        text: string;
        route: string;
    }> = [
        {
            title: "Active Companies",
            value: stats ? String(stats.activeCompanies) : "—",
            change: stats ? `${stats.tenantOverview?.trial ?? 0} trial` : "—",
            trend: "up" as const,
            icon: Building2,
            bg: "bg-primary-50",
            text: "text-primary-600",
            route: "/app/companies",
        },
        {
            title: "Total Users",
            value: stats ? formatCount(stats.totalUsers) : "—",
            change: "",
            trend: "neutral" as const,
            icon: Users,
            bg: "bg-info-50",
            text: "text-info-600",
            route: "/app/companies",
        },
        {
            title: "Monthly Revenue",
            value: stats ? formatCurrency(stats.monthlyRevenue) : "—",
            change: "",
            trend: "up" as const,
            icon: IndianRupee,
            bg: "bg-success-50",
            text: "text-success-600",
            route: "/app/billing",
        },
        {
            title: "Active Modules",
            value: stats ? `${stats.activeModules}/10` : "—",
            change: "Unique across platform",
            trend: "neutral" as const,
            icon: Blocks,
            bg: "bg-accent-50",
            text: "text-accent-600",
            route: "/app/companies",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Super Admin Overview</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Platform metrics and tenant health</p>
            </div>

            {/* KPI Grid */}
            {statsQuery.isLoading ? <SkeletonKPIGrid count={4} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {KPIS.map((kpi, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(kpi.route)}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 transition-transform hover:-translate-y-1 duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bg, "dark:bg-opacity-10 dark:text-opacity-90")}>
                                    <kpi.icon className={cn("w-6 h-6", kpi.text)} />
                                </div>
                                {kpi.change && (
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
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">{kpi.value}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">{kpi.title}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tenant Table */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Recent Tenants</h2>
                        <button onClick={() => navigate('/app/companies')} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">View All</button>
                    </div>

                    {tenantsQuery.isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="pb-3 font-bold">Company</th>
                                        <th className="pb-3 font-bold text-center">Users</th>
                                        <th className="pb-3 font-bold">Status</th>
                                        <th className="pb-3 px-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {tenants.map((tenant: any) => (
                                        <tr key={tenant.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 overflow-hidden">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                                                        <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white truncate">{tenant.displayName || tenant.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center font-medium text-neutral-600 dark:text-neutral-400">{tenant._count?.users ?? 0}</td>
                                            <td className="py-4">
                                                <span className={cn(
                                                    "inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                                    tenant.wizardStatus === "Active" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800" :
                                                        tenant.wizardStatus === "Pilot" || tenant.wizardStatus === "Draft" ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800" :
                                                            "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800"
                                                )}>
                                                    {tenant.wizardStatus}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.length === 0 && (
                                        <tr>
                                            <td colSpan={4}>
                                                <EmptyState icon="list" title="No tenants yet" message="Create your first company to get started." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Activity Log</h2>
                        <Activity className="w-5 h-5 text-neutral-400" />
                    </div>

                    {activityQuery.isLoading ? (
                        <div className="flex-1 flex flex-col gap-4">
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                        </div>
                    ) : (
                        <div className="flex-1 space-y-6">
                            {activities.map((item: any, i: number) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/30 z-10" />
                                        {i !== activities.length - 1 && (
                                            <div className="absolute top-3 bottom-[-24px] w-px bg-neutral-200 dark:bg-neutral-800" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">
                                            {item.action ?? item.text ?? `${item.entityType}: ${item.action}`}
                                        </p>
                                        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider">
                                            {item.timestamp ? timeAgo(item.timestamp) : item.time ?? ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <EmptyState icon="inbox" title="No recent activity" />
                            )}
                        </div>
                    )}

                    <button onClick={() => navigate('/app/reports/audit')} className="w-full py-3 mt-6 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
