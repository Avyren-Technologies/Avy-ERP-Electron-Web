import { useNavigate } from "react-router-dom";
import {
    Users,
    MapPin,
    Blocks,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Clock,
    Phone,
    FileText,
    Settings,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyAdminStats } from "@/features/super-admin/api/use-dashboard-queries";
import {
    useCompanyProfile,
    useCompanyActivity,
} from "@/features/company-admin/api/use-company-admin-queries";
import { useAuthStore, getDisplayName } from "@/store/useAuthStore";
import type { CompanyAdminStats, CompanyProfile, ActivityItem } from "@/lib/api/company-admin";
import { SkeletonKPIGrid, SkeletonTable, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

interface KPI {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
    route: string;
}

const QUICK_ACTIONS = [
    {
        id: "users",
        title: "Manage Users",
        description: "View and manage user accounts",
        icon: Users,
        gradient: "from-primary-500 to-primary-600",
        route: "/app/company/users",
    },
    {
        id: "shifts",
        title: "Shift Management",
        description: "Configure shifts and schedules",
        icon: Clock,
        gradient: "from-success-500 to-success-600",
        route: "/app/company/shifts",
    },
    {
        id: "contacts",
        title: "Key Contacts",
        description: "Manage company contacts",
        icon: Phone,
        gradient: "from-accent-500 to-accent-600",
        route: "/app/company/contacts",
    },
    {
        id: "audit",
        title: "Audit Logs",
        description: "Review activity history",
        icon: FileText,
        gradient: "from-info-500 to-info-600",
        route: "/app/reports/audit",
    },
];

export function CompanyAdminDashboard() {
    const navigate = useNavigate();
    const { data: statsData, isLoading: statsLoading } = useCompanyAdminStats();
    const { data: profileData, isLoading: profileLoading } = useCompanyProfile();
    const { data: activityData, isLoading: activityLoading } = useCompanyActivity(5);
    const user = useAuthStore((s) => s.user);
    const displayName = getDisplayName(user);

    const stats = statsData?.data as CompanyAdminStats | undefined;
    const profile = profileData?.data as CompanyProfile | undefined;
    const activities: ActivityItem[] = activityData?.data ?? [];

    const kpis: KPI[] = [
        {
            title: "Total Users",
            value: stats?.totalUsers?.toString() ?? stats?.totalEmployees?.toString() ?? "—",
            change: stats?.activeUsers ? `${stats.activeUsers} active` : "",
            trend: "up",
            icon: Users,
            bg: "bg-primary-50",
            text: "text-primary-600",
            route: "/app/company/users",
        },
        {
            title: "Locations",
            value: stats?.totalLocations?.toString() ?? "—",
            change: stats?.activeLocations ? `${stats.activeLocations} active` : "",
            trend: "neutral",
            icon: MapPin,
            bg: "bg-success-50",
            text: "text-success-600",
            route: "/app/company/locations",
        },
        {
            title: "Active Modules",
            value: stats?.activeModules?.toString() ?? "—",
            change: "Configured",
            trend: "neutral",
            icon: Blocks,
            bg: "bg-accent-50",
            text: "text-accent-600",
            route: "/app/modules",
        },
        {
            title: "Company Status",
            value: stats?.companyStatus ?? profile?.wizardStatus ?? "—",
            change: stats?.companyStatus === "Active" ? "Operational" : "",
            trend: stats?.companyStatus === "Active" ? "up" : "neutral",
            icon: CheckCircle2,
            bg: "bg-info-50",
            text: "text-info-600",
            route: "/app/company/profile",
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
            {statsLoading ? (
                <SkeletonKPIGrid count={4} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.title}
                            onClick={() => navigate(kpi.route)}
                            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 transition-transform hover:-translate-y-1 duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        kpi.bg,
                                        "dark:bg-opacity-10"
                                    )}
                                >
                                    <kpi.icon className={cn("w-6 h-6", kpi.text)} />
                                </div>
                                {kpi.change && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider",
                                            kpi.trend === "up"
                                                ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                                                : kpi.trend === "down"
                                                  ? "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
                                                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                        )}
                                    >
                                        {kpi.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                                        {kpi.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                                        {kpi.change}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                                {kpi.value}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                                {kpi.title}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-primary-950 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => navigate(action.route)}
                            className="group bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/60 dark:border-neutral-800 shadow-md shadow-neutral-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                        >
                            <div
                                className={cn(
                                    "w-11 h-11 rounded-xl bg-gradient-to-tr flex items-center justify-center mb-3 shadow-lg",
                                    action.gradient
                                )}
                            >
                                <action.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">{action.title}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {action.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Company Overview */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Company Overview</h2>
                        <button
                            onClick={() => navigate("/app/company/profile")}
                            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                            View Profile
                        </button>
                    </div>

                    {profileLoading ? (
                        <SkeletonTable rows={4} cols={2} />
                    ) : profile ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: "Company Name", value: profile.displayName || profile.name },
                                    { label: "Legal Name", value: profile.legalName },
                                    { label: "Industry", value: profile.industry },
                                    { label: "Business Type", value: profile.businessType },
                                    { label: "Company Code", value: profile.companyCode, mono: true },
                                    { label: "Status", value: profile.wizardStatus },
                                ].map((field) => (
                                    <div key={field.label} className="flex items-start gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-800">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
                                                {field.label}
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-semibold text-primary-950 dark:text-white truncate",
                                                    field.mono && "font-mono"
                                                )}
                                            >
                                                {field.value || "—"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <EmptyState icon="list" title="No profile data" message="Company profile has not been configured yet." />
                    )}
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">Recent Activity</h2>
                        <Activity className="w-5 h-5 text-neutral-400" />
                    </div>

                    {activityLoading ? (
                        <div className="flex-1 flex flex-col gap-4">
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                        </div>
                    ) : (
                        <div className="flex-1 space-y-6">
                            {activities.map((item, i) => (
                                <div key={item.id ?? i} className="flex gap-4">
                                    <div className="relative flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/30 z-10" />
                                        {i !== activities.length - 1 && (
                                            <div className="absolute top-3 bottom-[-24px] w-px bg-neutral-200 dark:bg-neutral-800" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary-950 dark:text-white">
                                            {item.action ?? item.text ?? item.description ?? `${item.entityType}: ${item.action}`}
                                        </p>
                                        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider">
                                            {item.timestamp ? timeAgo(item.timestamp) : item.time ?? ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <EmptyState icon="inbox" title="No recent activity" />
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/app/reports/audit")}
                        className="w-full py-3 mt-6 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                    >
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
