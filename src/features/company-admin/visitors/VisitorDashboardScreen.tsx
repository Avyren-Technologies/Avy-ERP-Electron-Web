import { useState } from "react";
import {
    Users,
    UserCheck,
    Clock,
    AlertTriangle,
    Shield,
    LogIn,
    LogOut,
    Plus,
    QrCode,
    Search,
    Eye,
    RefreshCw,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardToday, useDashboardOnSite, useDashboardStats } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckOutVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

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
    icon: any;
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
        neutral: {
            bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
            icon: "text-neutral-500 dark:text-neutral-400",
            text: "text-neutral-700 dark:text-neutral-300",
        },
    };
    const c = colorClasses[color] ?? colorClasses.neutral;

    return (
        <div className={cn("rounded-2xl border p-5 transition-all hover:shadow-md", c.bg)}>
            <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 dark:bg-black/10")}>
                    <Icon className={cn("w-5 h-5", c.icon)} />
                </div>
            </div>
            <div className={cn("text-3xl font-black", c.text)}>{value}</div>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">{title}</div>
            {subtitle && <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</div>}
        </div>
    );
}

/* ── Screen ── */

export function VisitorDashboardScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const todayQuery = useDashboardToday();
    const onSiteQuery = useDashboardOnSite();
    const statsQuery = useDashboardStats();
    const checkInMutation = useCheckInVisit();
    const checkOutMutation = useCheckOutVisit();

    const [search, setSearch] = useState("");
    const [quickCheckInId, setQuickCheckInId] = useState<string | null>(null);
    const [quickCheckOutId, setQuickCheckOutId] = useState<string | null>(null);

    const todayData = todayQuery.data?.data ?? {};
    const onSiteVisitors: any[] = onSiteQuery.data?.data ?? [];
    const stats = statsQuery.data?.data ?? {};
    const todayVisitors: any[] = todayData.visitors ?? todayData.visits ?? [];
    const isLoading = todayQuery.isLoading || onSiteQuery.isLoading || statsQuery.isLoading;

    const filtered = todayVisitors.filter((v: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            v.visitorName?.toLowerCase().includes(s) ||
            v.visitorCompany?.toLowerCase().includes(s) ||
            v.hostName?.toLowerCase().includes(s) ||
            v.visitCode?.toLowerCase().includes(s)
        );
    });

    const handleQuickCheckIn = async (id: string) => {
        try {
            setQuickCheckInId(id);
            await checkInMutation.mutateAsync({ id });
            showSuccess("Checked In", "Visitor has been checked in successfully.");
        } catch (err) {
            showApiError(err);
        } finally {
            setQuickCheckInId(null);
        }
    };

    const handleQuickCheckOut = async (id: string) => {
        try {
            setQuickCheckOutId(id);
            await checkOutMutation.mutateAsync({ id });
            showSuccess("Checked Out", "Visitor has been checked out successfully.");
        } catch (err) {
            showApiError(err);
        } finally {
            setQuickCheckOutId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Visitor Dashboard</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Real-time overview of today's visitor activity</p>
                </div>
                <div className="flex items-center gap-3">
                    {canCreate && (
                        <>
                            <a
                                href="/app/company/visitors/pre-register"
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                            >
                                <Plus className="w-5 h-5" />
                                Pre-Register
                            </a>
                            <a
                                href="/app/company/visitors/gate-check-in"
                                className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-accent-500/20 transition-all dark:shadow-none"
                            >
                                <QrCode className="w-5 h-5" />
                                Gate Check-In
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                <StatCard title="Expected Today" value={stats.expectedToday ?? todayData.expectedCount ?? 0} icon={Users} color="primary" />
                <StatCard title="Checked In" value={stats.checkedInToday ?? todayData.checkedInCount ?? 0} icon={LogIn} color="success" />
                <StatCard title="On-Site Now" value={onSiteVisitors.length ?? stats.onSiteNow ?? 0} icon={UserCheck} color="info" />
                <StatCard title="Checked Out" value={stats.checkedOutToday ?? todayData.checkedOutCount ?? 0} icon={LogOut} color="neutral" />
                <StatCard title="Pending Approval" value={stats.pendingApproval ?? todayData.pendingCount ?? 0} icon={Clock} color="warning" />
                <StatCard title="Overstay" value={stats.overstayCount ?? 0} icon={AlertTriangle} color="danger" />
                <StatCard title="Denied" value={stats.deniedToday ?? 0} icon={Shield} color="danger" subtitle="Today" />
            </div>

            {/* On-Site Visitors Quick View */}
            {onSiteVisitors.length > 0 && (
                <div className="bg-success-50/50 dark:bg-success-900/10 border border-success-200 dark:border-success-800/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
                            <h2 className="text-sm font-bold text-success-700 dark:text-success-400">Currently On-Site ({onSiteVisitors.length})</h2>
                        </div>
                        <a href="/app/company/visitors/list?status=CHECKED_IN" className="text-xs font-bold text-success-600 dark:text-success-400 hover:underline flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {onSiteVisitors.slice(0, 12).map((v: any) => (
                            <div key={v.id} className="flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-lg px-3 py-1.5 border border-success-200 dark:border-success-800/50">
                                <div className="w-6 h-6 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-[10px] font-bold text-success-700 dark:text-success-400">
                                    {(v.visitorName || "?")[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-primary-950 dark:text-white">{v.visitorName}</span>
                                <span className="text-[10px] text-neutral-400">{v.visitorCompany}</span>
                            </div>
                        ))}
                        {onSiteVisitors.length > 12 && (
                            <div className="flex items-center px-3 py-1.5 text-xs font-bold text-success-600 dark:text-success-400">
                                +{onSiteVisitors.length - 12} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search visitors by name, company, host, or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => {
                            todayQuery.refetch();
                            onSiteQuery.refetch();
                            statsQuery.refetch();
                        }}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-500 dark:text-neutral-400"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Today's Visitors Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider">Today's Visitors</h2>
                </div>
                {isLoading ? (
                    <SkeletonTable rows={6} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Visitor</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Host</th>
                                    <th className="py-4 px-6 font-bold">Expected</th>
                                    <th className="py-4 px-6 font-bold">Check-In</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((v: any) => (
                                    <tr
                                        key={v.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">
                                                    {(v.visitorName || "?")[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white block">{v.visitorName}</span>
                                                    {v.visitCode && <span className="text-[10px] font-mono text-neutral-400">{v.visitCode}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.visitorCompany || "---"}</td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                {v.visitorType?.name || v.visitorTypeName || "Visitor"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{v.hostEmployee?.name || v.hostName || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {v.expectedArrival ? fmt.time(v.expectedArrival) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {v.checkInTime ? fmt.time(v.checkInTime) : "---"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <VisitStatusBadge status={v.status} />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {v.status === "PRE_REGISTERED" || v.status === "APPROVED" ? (
                                                    <button
                                                        onClick={() => handleQuickCheckIn(v.id)}
                                                        disabled={quickCheckInId === v.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50 dark:hover:bg-success-900/30 transition-colors disabled:opacity-50"
                                                        title="Check In"
                                                    >
                                                        {quickCheckInId === v.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
                                                        In
                                                    </button>
                                                ) : v.status === "CHECKED_IN" ? (
                                                    <button
                                                        onClick={() => handleQuickCheckOut(v.id)}
                                                        disabled={quickCheckOutId === v.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                                        title="Check Out"
                                                    >
                                                        {quickCheckOutId === v.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                                                        Out
                                                    </button>
                                                ) : null}
                                                <a
                                                    href={`/app/company/visitors/detail/${v.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View Detail"
                                                >
                                                    <Eye size={15} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No visitors for today" message="Pre-register a visitor or wait for walk-in arrivals." />
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
