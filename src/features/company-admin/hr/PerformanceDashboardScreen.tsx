import { useState } from "react";
import {
    Activity,
    Target,
    Star,
    MessageSquare,
    Brain,
    TrendingUp,
    Users,
    CheckCircle2,
    Clock,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Loader2,
    RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformanceDashboard } from "@/features/company-admin/api/use-performance-queries";

/* ── Helpers ── */

function KpiCard({ title, value, subtitle, icon: Icon, color, trend }: {
    title: string; value: string | number; subtitle?: string; icon: any; color: string; trend?: { value: number; label: string };
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", `bg-${color}-50 dark:bg-${color}-900/30`)}>
                    <Icon className={cn("w-5 h-5", `text-${color}-600 dark:text-${color}-400`)} />
                </div>
                {trend && (
                    <div className={cn("flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full", trend.value > 0 ? "bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400" : trend.value < 0 ? "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400")}>
                        {trend.value > 0 ? <ArrowUpRight size={10} /> : trend.value < 0 ? <ArrowDownRight size={10} /> : <Minus size={10} />}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-primary-950 dark:text-white mt-0.5">{value}</p>
                {subtitle && <p className="text-[10px] text-neutral-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{Math.round(pct)}%</span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function ActivityItem({ icon: Icon, title, description, time, color }: {
    icon: any; title: string; description: string; time: string; color: string;
}) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", `bg-${color}-50 dark:bg-${color}-900/30`)}>
                <Icon className={cn("w-4 h-4", `text-${color}-600 dark:text-${color}-400`)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-950 dark:text-white">{title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium shrink-0">{time}</span>
        </div>
    );
}

/* ── Screen ── */

export function PerformanceDashboardScreen() {
    const { data, isLoading, isError, refetch } = usePerformanceDashboard();

    const raw = data?.data ?? data ?? {};
    // Handle both envelope shapes: { success, data: {...} } and direct payload
    const dashboard: any = raw?.cycleStats !== undefined ? raw : (raw?.data ?? raw);

    // Backend returns: { cycleStats, goals, skills, succession }
    const cs = dashboard.cycleStats ?? {};
    const goals = dashboard.goals ?? {};
    const skills = dashboard.skills ?? {};
    const succession = dashboard.succession ?? {};

    // Extract KPIs from nested structure
    const cycleCompletion = cs.completionPercent ?? 0;
    const avgRating = (() => {
        const dist = cs.ratingDistribution ?? {};
        const entries = Object.entries(dist) as [string, number][];
        const total = entries.reduce((s, [, c]) => s + (c as number), 0);
        if (total === 0) return 0;
        return entries.reduce((s, [r, c]) => s + Number(r) * (c as number), 0) / total;
    })();
    const feedbackCompletion = cs.selfReviewPercent ?? 0;
    const skillCoverage = skills.totalMappings > 0
        ? Math.round(((skills.totalMappings - skills.totalGaps) / skills.totalMappings) * 100)
        : 0;
    const totalEmployees = cs.totalEntries ?? 0;
    const totalGoals = goals.total ?? 0;
    const activeCycles = cs.cycle ? 1 : 0;
    const pendingReviews = (cs.pendingSelfReview ?? 0) + (cs.pendingManagerReview ?? 0);

    // Rating distribution: convert backend object { 1: count, 2: count, ... } to array
    const ratingDistribution = Object.entries(cs.ratingDistribution ?? {}).map(
        ([rating, count]) => ({ label: `${rating} Star${Number(rating) !== 1 ? 's' : ''}`, count: count as number })
    );

    // Goal status breakdown as array
    const goalStatus = [
        goals.active > 0 && { status: 'Active', count: goals.active },
        goals.completed > 0 && { status: 'Completed', count: goals.completed },
        (goals.total - goals.active - goals.completed) > 0 && { status: 'Other', count: goals.total - goals.active - goals.completed },
    ].filter(Boolean) as { status: string; count: number }[];

    // Top performers as recent activity
    const recentActivity = (cs.topPerformers ?? []).map((tp: any) => ({
        type: 'review_published',
        title: `${tp.employee?.firstName ?? ''} ${tp.employee?.lastName ?? ''}`.trim() || 'Employee',
        description: `Rating: ${Number(tp.finalRating).toFixed(1)}${tp.promotionRecommended ? ' — Promotion recommended' : ''} — ${tp.employee?.department?.name ?? ''}`,
        timeAgo: cs.cycle?.status ?? '',
    }));

    // Cycle progress stages
    const cycleProgress = cs.totalEntries > 0 ? [
        { stage: 'Pending Self Review', count: cs.pendingSelfReview ?? 0 },
        { stage: 'Manager Review Pending', count: (cs.totalEntries - (cs.pendingSelfReview ?? 0) - (cs.pendingManagerReview ?? 0) > 0 ? cs.totalEntries - (cs.pendingSelfReview ?? 0) - (cs.pendingManagerReview ?? 0) : 0) },
        { stage: 'Published', count: Math.round((cs.completionPercent / 100) * cs.totalEntries) },
    ].filter(item => item.count > 0) : [];

    // Department scores from top performers
    const departmentScores = (() => {
        const deptMap: Record<string, { totalRating: number; count: number }> = {};
        for (const tp of cs.topPerformers ?? []) {
            const dept = tp.employee?.department?.name ?? 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { totalRating: 0, count: 0 };
            deptMap[dept].totalRating += Number(tp.finalRating ?? 0);
            deptMap[dept].count += 1;
        }
        return Object.entries(deptMap).map(([department, { totalRating, count }]) => ({
            department,
            avgScore: totalRating / count,
        }));
    })();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                    <p className="text-sm text-neutral-400 font-medium">Loading performance data...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in fade-in duration-500">
                <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-danger-400" />
                </div>
                <h2 className="text-xl font-bold text-neutral-600 dark:text-neutral-400">Failed to load dashboard</h2>
                <button onClick={() => refetch()} className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm">
                    <RefreshCcw size={14} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Performance Dashboard</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Organization-wide performance metrics and insights</p>
                </div>
                <button onClick={() => refetch()} className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Cycle Completion"
                    value={`${Math.round(cycleCompletion)}%`}
                    subtitle={`${activeCycles} active cycle${activeCycles !== 1 ? "s" : ""}`}
                    icon={Target}
                    color="primary"
                    trend={dashboard.cycleCompletionTrend ? { value: dashboard.cycleCompletionTrend, label: "vs last cycle" } : undefined}
                />
                <KpiCard
                    title="Average Rating"
                    value={Number(avgRating).toFixed(1)}
                    subtitle={`${totalEmployees} employees rated`}
                    icon={Star}
                    color="warning"
                    trend={dashboard.ratingTrend ? { value: dashboard.ratingTrend, label: "vs last cycle" } : undefined}
                />
                <KpiCard
                    title="Feedback Completion"
                    value={`${Math.round(feedbackCompletion)}%`}
                    subtitle={`${pendingReviews} reviews pending`}
                    icon={MessageSquare}
                    color="accent"
                    trend={dashboard.feedbackTrend ? { value: dashboard.feedbackTrend, label: "vs last cycle" } : undefined}
                />
                <KpiCard
                    title="Skill Coverage"
                    value={`${Math.round(skillCoverage)}%`}
                    subtitle={`${totalGoals} active goals`}
                    icon={Brain}
                    color="success"
                    trend={dashboard.skillTrend ? { value: dashboard.skillTrend, label: "vs last quarter" } : undefined}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Rating Distribution */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-primary-950 dark:text-white mb-4">Rating Distribution</h3>
                    {ratingDistribution.length > 0 ? (
                        <div className="space-y-3">
                            {ratingDistribution.map((item: any, i: number) => {
                                const label = item.label ?? item.rating ?? `Rating ${i + 1}`;
                                const count = item.count ?? item.value ?? 0;
                                const total = ratingDistribution.reduce((sum: number, r: any) => sum + (r.count ?? r.value ?? 0), 0);
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                const colors = ["bg-danger-400", "bg-warning-400", "bg-primary-400", "bg-accent-400", "bg-success-400"];
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="text-warning-500 fill-warning-500" />
                                                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                                            </div>
                                            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{count} ({Math.round(pct)}%)</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-700", colors[i % colors.length])} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 space-y-2">
                            <BarChart3 className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-xs text-neutral-400">No rating data available yet</p>
                        </div>
                    )}
                </div>

                {/* Goal Status Breakdown */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-primary-950 dark:text-white mb-4">Goal Status</h3>
                    {goalStatus.length > 0 ? (
                        <div className="space-y-3">
                            {goalStatus.map((item: any, i: number) => {
                                const label = item.status ?? item.label ?? "Unknown";
                                const count = item.count ?? item.value ?? 0;
                                const total = goalStatus.reduce((sum: number, g: any) => sum + (g.count ?? g.value ?? 0), 0);
                                const colors: Record<string, string> = {
                                    draft: "bg-neutral-400",
                                    active: "bg-primary-400",
                                    completed: "bg-success-400",
                                    cancelled: "bg-danger-400",
                                    overdue: "bg-warning-400",
                                };
                                return (
                                    <ProgressBar
                                        key={i}
                                        label={`${label} (${count})`}
                                        value={count}
                                        max={total}
                                        color={colors[label.toLowerCase()] ?? "bg-primary-400"}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 space-y-2">
                            <Target className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-xs text-neutral-400">No goal data available yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Cycle Progress */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-primary-950 dark:text-white mb-4">Review Pipeline</h3>
                    {cycleProgress.length > 0 ? (
                        <div className="space-y-3">
                            {cycleProgress.map((stage: any, i: number) => {
                                const stageColors: Record<string, string> = {
                                    pending: "bg-neutral-400",
                                    self_review: "bg-info-400",
                                    manager_review: "bg-warning-400",
                                    calibration: "bg-accent-400",
                                    published: "bg-success-400",
                                };
                                const label = stage.stage ?? stage.label ?? "Unknown";
                                const count = stage.count ?? stage.value ?? 0;
                                const total = cycleProgress.reduce((s: number, st: any) => s + (st.count ?? st.value ?? 0), 0);
                                return (
                                    <ProgressBar
                                        key={i}
                                        label={`${label.replace("_", " ")} (${count})`}
                                        value={count}
                                        max={total}
                                        color={stageColors[label.toLowerCase().replace(/\s+/g, "_")] ?? "bg-primary-400"}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 space-y-2">
                            <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-xs text-neutral-400">No active review pipeline</p>
                        </div>
                    )}
                </div>

                {/* Department Performance */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-primary-950 dark:text-white mb-4">Department Scores</h3>
                    {departmentScores.length > 0 ? (
                        <div className="space-y-3">
                            {departmentScores.map((dept: any, i: number) => {
                                const name = dept.department ?? dept.name ?? "Unknown";
                                const score = dept.avgScore ?? dept.score ?? dept.avgRating ?? 0;
                                const maxScore = 5;
                                const pct = (score / maxScore) * 100;
                                const color = pct >= 80 ? "bg-success-400" : pct >= 60 ? "bg-primary-400" : pct >= 40 ? "bg-warning-400" : "bg-danger-400";
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-primary-950 dark:text-white">{name}</span>
                                            <div className="flex items-center gap-1">
                                                <Star size={10} className="text-warning-500 fill-warning-500" />
                                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{Number(score).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 space-y-2">
                            <Users className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-xs text-neutral-400">No department data available</p>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-primary-950 dark:text-white mb-4">Recent Activity</h3>
                    {recentActivity.length > 0 ? (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {recentActivity.slice(0, 8).map((item: any, i: number) => {
                                const typeConfig: Record<string, { icon: any; color: string }> = {
                                    review_submitted: { icon: CheckCircle2, color: "success" },
                                    review_published: { icon: Star, color: "warning" },
                                    goal_created: { icon: Target, color: "primary" },
                                    goal_completed: { icon: CheckCircle2, color: "success" },
                                    feedback_submitted: { icon: MessageSquare, color: "accent" },
                                    feedback_requested: { icon: MessageSquare, color: "info" },
                                    skill_mapped: { icon: Brain, color: "primary" },
                                    cycle_activated: { icon: Activity, color: "primary" },
                                    plan_created: { icon: TrendingUp, color: "accent" },
                                };
                                const config = typeConfig[item.type?.toLowerCase()] ?? { icon: Activity, color: "neutral" };
                                const timeAgo = item.timeAgo ?? item.time ?? item.createdAt ?? "";
                                return (
                                    <ActivityItem
                                        key={i}
                                        icon={config.icon}
                                        title={item.title ?? item.action ?? "Activity"}
                                        description={item.description ?? item.details ?? ""}
                                        time={timeAgo}
                                        color={config.color}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 space-y-2">
                            <Activity className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-xs text-neutral-400">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
