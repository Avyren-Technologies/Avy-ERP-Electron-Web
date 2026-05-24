import { useNavigate } from "react-router-dom";
import {
    Wrench,
    ClipboardList,
    Cog,
    AlertTriangle,
    Plus,
    ServerCog,
    RefreshCw,
    CalendarClock,
    ArrowRight,
    Loader2,
    Package,
    TrendingUp,
    DollarSign,
    Shield,
    Users,
    Clock,
    BarChart3,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useAssets,
    useWorkRequests,
    useManagerDashboard,
    usePlannerDashboard,
    useFinanceDashboard,
} from "@/features/maintenance/api/use-maintenance-queries";
import { useSyncMachines } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useAuthStore } from "@/store/useAuthStore";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Stat Card ── */

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
}: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    subtitle?: string;
}) {
    const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
        primary: {
            bg: "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50",
            icon: "text-primary-600 dark:text-primary-400",
            text: "text-primary-700 dark:text-primary-400",
        },
        success: {
            bg: "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50",
            icon: "text-success-600 dark:text-success-400",
            text: "text-success-700 dark:text-success-400",
        },
        warning: {
            bg: "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50",
            icon: "text-warning-600 dark:text-warning-400",
            text: "text-warning-700 dark:text-warning-400",
        },
        danger: {
            bg: "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50",
            icon: "text-danger-600 dark:text-danger-400",
            text: "text-danger-700 dark:text-danger-400",
        },
        info: {
            bg: "bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50",
            icon: "text-info-600 dark:text-info-400",
            text: "text-info-700 dark:text-info-400",
        },
        accent: {
            bg: "bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/50",
            icon: "text-accent-600 dark:text-accent-400",
            text: "text-accent-700 dark:text-accent-400",
        },
    };
    const c = colorClasses[color] ?? colorClasses.primary;

    return (
        <div className={cn("rounded-2xl border p-5 transition-all hover:shadow-md", c.bg)}>
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/10">
                    <Icon className={cn("w-5 h-5", c.icon)} />
                </div>
            </div>
            <div className={cn("text-3xl font-black", c.text)}>{value}</div>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">{title}</div>
            {subtitle && <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</div>}
        </div>
    );
}

/* ── Quick Action Card ── */

function QuickActionCard({
    title,
    description,
    icon: Icon,
    onClick,
    loading,
    color = "primary",
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    onClick: () => void;
    loading?: boolean;
    color?: string;
}) {
    const colorClasses: Record<string, string> = {
        primary: "bg-primary-600 hover:bg-primary-700 shadow-primary-500/20",
        accent: "bg-accent-600 hover:bg-accent-700 shadow-accent-500/20",
        success: "bg-success-600 hover:bg-success-700 shadow-success-500/20",
        info: "bg-info-600 hover:bg-info-700 shadow-info-500/20",
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={cn(
                "flex flex-col items-start gap-3 p-5 rounded-2xl text-white text-left transition-all shadow-md dark:shadow-none disabled:opacity-60",
                colorClasses[color] ?? colorClasses.primary,
            )}
        >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
            </div>
            <div>
                <div className="text-sm font-bold">{title}</div>
                <div className="text-xs text-white/70 mt-0.5">{description}</div>
            </div>
        </button>
    );
}

/* ── Work Request Status Badge ── */

const WR_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    OPEN: { label: "Open", cls: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50" },
    TRIAGED: { label: "Triaged", cls: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50" },
    APPROVED: { label: "Approved", cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
    REJECTED: { label: "Rejected", cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
    CONVERTED: { label: "Converted", cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50" },
    CANCELLED: { label: "Cancelled", cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700" },
};

function WRStatusBadge({ status }: { status: string }) {
    const cfg = WR_STATUS_CONFIG[status];
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cfg?.cls ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700")}>
            {cfg?.label ?? status?.replace(/_/g, " ").toLowerCase() ?? "unknown"}
        </span>
    );
}

/* ── Criticality Badge ── */

const CRITICALITY_COLORS: Record<string, { dot: string; text: string }> = {
    CRITICAL: { dot: "bg-danger-500", text: "text-danger-700 dark:text-danger-400" },
    HIGH: { dot: "bg-warning-500", text: "text-warning-700 dark:text-warning-400" },
    MEDIUM: { dot: "bg-info-500", text: "text-info-700 dark:text-info-400" },
    LOW: { dot: "bg-success-500", text: "text-success-700 dark:text-success-400" },
    NONE: { dot: "bg-neutral-400", text: "text-neutral-600 dark:text-neutral-400" },
};

/* ── Screen ── */

/* ── Role-Based Widget Card ── */

function WidgetCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">
                    {title}
                </h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function WidgetMetric({ label, value, trend }: { label: string; value: string | number; trend?: "up" | "down" | "neutral" }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                trend === "up" ? "text-success-600 dark:text-success-400" :
                trend === "down" ? "text-danger-600 dark:text-danger-400" :
                "text-primary-950 dark:text-white",
            )}>
                {value}
            </span>
        </div>
    );
}

export function MaintenanceDashboardScreen() {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const syncMachines = useSyncMachines();
    const user = useAuthStore((s) => s.user);
    const userRole = user?.role ?? "user";

    // Role-based dashboard queries
    const managerDash = useManagerDashboard();
    const plannerDash = usePlannerDashboard();
    const financeDash = useFinanceDashboard();
    const mgrData: any = managerDash.data?.data ?? {};
    const plnData: any = plannerDash.data?.data ?? {};
    const finData: any = financeDash.data?.data ?? {};

    // Fetch summary counts via list endpoints with limit=1
    const assetsQuery = useAssets({ limit: 1 });
    const openWRQuery = useWorkRequests({ limit: 1, status: "SUBMITTED" });
    const activeWOQuery = useWorkRequests({ limit: 1, status: "APPROVED" });
    const recentWRQuery = useWorkRequests({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

    // Extract totals from pagination meta
    const totalAssets = assetsQuery.data?.meta?.total ?? assetsQuery.data?.data?.length ?? 0;
    const openWRCount = openWRQuery.data?.meta?.total ?? openWRQuery.data?.data?.length ?? 0;
    const activeWOCount = activeWOQuery.data?.meta?.total ?? activeWOQuery.data?.data?.length ?? 0;
    const recentWorkRequests: any[] = recentWRQuery.data?.data ?? [];

    // Group assets by criticality
    const allAssetsQuery = useAssets({ limit: 1000 });
    const allAssets: any[] = allAssetsQuery.data?.data ?? [];
    const criticalityCounts = allAssets.reduce<Record<string, number>>((acc, a) => {
        const c = a.criticality || "NONE";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {});

    const isLoading = assetsQuery.isLoading || openWRQuery.isLoading || activeWOQuery.isLoading;

    const handleSyncMachines = async () => {
        try {
            await syncMachines.mutateAsync();
            showSuccess("Sync Complete", "Machines have been synced from production registry.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Maintenance Dashboard
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Overview of assets, work requests, and maintenance activity
                    </p>
                </div>
                <button
                    onClick={() => {
                        assetsQuery.refetch();
                        openWRQuery.refetch();
                        activeWOQuery.refetch();
                        recentWRQuery.refetch();
                        allAssetsQuery.refetch();
                    }}
                    className="self-start p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
                    title="Refresh"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Row 1 — Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Assets"
                    value={isLoading ? "..." : totalAssets}
                    icon={Package}
                    color="primary"
                    subtitle="Registered in system"
                />
                <StatCard
                    title="Open Work Requests"
                    value={isLoading ? "..." : openWRCount}
                    icon={ClipboardList}
                    color="warning"
                    subtitle="Awaiting triage"
                />
                <StatCard
                    title="Active Work Orders"
                    value={isLoading ? "..." : activeWOCount}
                    icon={Cog}
                    color="info"
                    subtitle="Approved / in progress"
                />
                <StatCard
                    title="PM Due / Overdue"
                    value={isLoading ? "..." : "0"}
                    icon={AlertTriangle}
                    color="danger"
                    subtitle="Preventive maintenance pending"
                />
            </div>

            {/* Row 2 — Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-3">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard
                        title="Raise Work Request"
                        description="Submit a new maintenance request"
                        icon={Plus}
                        onClick={() => navigate("/app/maintenance/work-requests/new")}
                        color="primary"
                    />
                    <QuickActionCard
                        title="Register New Asset"
                        description="Add a new asset to the registry"
                        icon={Wrench}
                        onClick={() => navigate("/app/maintenance/assets?new=true")}
                        color="accent"
                    />
                    <QuickActionCard
                        title="Sync Machines"
                        description="Import machines from production"
                        icon={ServerCog}
                        onClick={handleSyncMachines}
                        loading={syncMachines.isPending}
                        color="success"
                    />
                    <QuickActionCard
                        title="View PM Calendar"
                        description="Preventive maintenance schedule"
                        icon={CalendarClock}
                        onClick={() => navigate("/app/maintenance/pm-calendar")}
                        color="info"
                    />
                </div>
            </div>

            {/* Row 3 — Recent Activity + Criticality Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Work Requests */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">
                            Recent Work Requests
                        </h2>
                        <a
                            href="/app/maintenance/orders"
                            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                            View All <ArrowRight size={12} />
                        </a>
                    </div>
                    {recentWRQuery.isLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : recentWorkRequests.length === 0 ? (
                        <EmptyState
                            icon="list"
                            title="No work requests yet"
                            message="Raise a work request to get started with maintenance tracking."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-3 px-6 font-bold">Code</th>
                                        <th className="py-3 px-6 font-bold">Summary</th>
                                        <th className="py-3 px-6 font-bold">Priority</th>
                                        <th className="py-3 px-6 font-bold text-center">Status</th>
                                        <th className="py-3 px-6 font-bold">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recentWorkRequests.map((wr: any) => (
                                        <tr
                                            key={wr.id}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/app/maintenance/orders`)}
                                        >
                                            <td className="py-3 px-6">
                                                <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-400">
                                                    {wr.requestNumber || wr.code || "---"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 font-semibold text-primary-950 dark:text-white truncate max-w-[200px]">
                                                {wr.summary || wr.description || "---"}
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize",
                                                    wr.priority === "CRITICAL" || wr.priority === "EMERGENCY"
                                                        ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
                                                        : wr.priority === "HIGH"
                                                            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                                                            : wr.priority === "MEDIUM"
                                                                ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50"
                                                                : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
                                                )}>
                                                    {(wr.priority || "normal").toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                                <WRStatusBadge status={wr.status} />
                                            </td>
                                            <td className="py-3 px-6 text-xs text-neutral-500 dark:text-neutral-400">
                                                {wr.createdAt ? fmt.date(wr.createdAt) : "---"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Assets by Criticality */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">
                            Assets by Criticality
                        </h2>
                    </div>
                    {allAssetsQuery.isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : allAssets.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-sm text-neutral-400 dark:text-neutral-500">No assets registered</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"] as const).map((level) => {
                                const count = criticalityCounts[level] || 0;
                                if (count === 0 && level === "NONE") return null;
                                const pct = totalAssets > 0 ? (count / Number(totalAssets)) * 100 : 0;
                                const colors = CRITICALITY_COLORS[level] ?? CRITICALITY_COLORS.NONE;
                                return (
                                    <div key={level}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                                                <span className={cn("text-xs font-bold capitalize", colors.text)}>
                                                    {level.toLowerCase()}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                                {count}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500", colors.dot)}
                                                style={{ width: `${Math.max(pct, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 4 — Role-Based Widgets */}
            <div>
                <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider mb-3">
                    Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Manager / Plant Head widgets */}
                    {(userRole === "company-admin" || userRole === "super-admin") && (
                        <>
                            <WidgetCard title="Asset Health Summary" icon={Activity}>
                                <WidgetMetric label="Average Availability" value={`${Number(mgrData.avgAvailability ?? 0).toFixed(1)}%`} trend="up" />
                                <WidgetMetric label="Backlog WOs" value={mgrData.backlogWOCount ?? 0} trend={Number(mgrData.backlogWOCount ?? 0) > 10 ? "down" : "neutral"} />
                                <WidgetMetric label="Critical Assets Down" value={mgrData.criticalAssetsDown ?? 0} trend={Number(mgrData.criticalAssetsDown ?? 0) > 0 ? "down" : "up"} />
                                <WidgetMetric label="Avg MTTR (hrs)" value={Number(mgrData.avgMTTR ?? 0).toFixed(1)} />
                            </WidgetCard>

                            <WidgetCard title="Cost Overview" icon={DollarSign}>
                                <WidgetMetric label="YTD Maintenance Cost" value={`$${Number(finData.ytdCost ?? 0).toLocaleString()}`} />
                                <WidgetMetric label="Parts Cost" value={`$${Number(finData.partsCost ?? 0).toLocaleString()}`} />
                                <WidgetMetric label="Labour Cost" value={`$${Number(finData.labourCost ?? 0).toLocaleString()}`} />
                                <WidgetMetric label="Vendor Cost" value={`$${Number(finData.vendorCost ?? 0).toLocaleString()}`} />
                            </WidgetCard>

                            <WidgetCard title="Vendor SLA Compliance" icon={Shield}>
                                <WidgetMetric label="On-Time Completion" value={`${Number(mgrData.vendorSLACompliance ?? 0).toFixed(0)}%`} trend={Number(mgrData.vendorSLACompliance ?? 0) > 80 ? "up" : "down"} />
                                <WidgetMetric label="Pending Vendor WOs" value={mgrData.pendingVendorWOs ?? 0} />
                                <WidgetMetric label="Repair vs Replace" value={mgrData.repairVsReplaceRatio ?? "N/A"} />
                            </WidgetCard>
                        </>
                    )}

                    {/* Planner widgets */}
                    <WidgetCard title="PM Schedule Status" icon={CalendarClock}>
                        <WidgetMetric label="PM Due This Week" value={plnData.pmDueThisWeek ?? 0} />
                        <WidgetMetric label="Overdue PMs" value={plnData.overduePMs ?? 0} trend={Number(plnData.overduePMs ?? 0) > 0 ? "down" : "up"} />
                        <WidgetMetric label="Parts Ready" value={`${Number(plnData.partsReadyPct ?? 0).toFixed(0)}%`} />
                        <WidgetMetric label="Upcoming Shutdowns" value={plnData.upcomingShutdowns ?? 0} />
                    </WidgetCard>

                    <WidgetCard title="Technician Availability" icon={Users}>
                        <WidgetMetric label="Available Technicians" value={plnData.availableTechnicians ?? 0} />
                        <WidgetMetric label="Assigned WOs" value={plnData.assignedWOs ?? 0} />
                        <WidgetMetric label="Avg WOs per Tech" value={Number(plnData.avgWOsPerTech ?? 0).toFixed(1)} />
                    </WidgetCard>

                    <WidgetCard title="Quick Links" icon={BarChart3}>
                        <div className="space-y-2">
                            <button onClick={() => navigate("/app/maintenance/analytics")} className="w-full text-left text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 py-1">
                                <TrendingUp className="w-3 h-3" /> Analytics Dashboard <ArrowRight className="w-3 h-3 ml-auto" />
                            </button>
                            <button onClick={() => navigate("/app/maintenance/reliability")} className="w-full text-left text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 py-1">
                                <Activity className="w-3 h-3" /> Reliability Metrics <ArrowRight className="w-3 h-3 ml-auto" />
                            </button>
                            <button onClick={() => navigate("/app/maintenance/reports")} className="w-full text-left text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 py-1">
                                <BarChart3 className="w-3 h-3" /> Reports Center <ArrowRight className="w-3 h-3 ml-auto" />
                            </button>
                            <button onClick={() => navigate("/app/maintenance/breakdowns")} className="w-full text-left text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 py-1">
                                <Clock className="w-3 h-3" /> Breakdown Log <ArrowRight className="w-3 h-3 ml-auto" />
                            </button>
                        </div>
                    </WidgetCard>
                </div>
            </div>
        </div>
    );
}
