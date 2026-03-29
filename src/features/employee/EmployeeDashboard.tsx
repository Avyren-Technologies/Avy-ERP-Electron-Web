import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    CalendarCheck,
    Clock,
    Bell,
    ArrowUpRight,
    FileText,
    Fingerprint,
    Eye,
    UserCircle,
    MessageCircle,
    Gift,
    CheckCircle2,
    AlertCircle,
    Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, getDisplayName } from "@/store/useAuthStore";

// ── Greeting helper ──
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatDate(): string {
    return new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ── Placeholder data (to be replaced with ESS hooks) ──
const PLACEHOLDER_STATS = {
    leaveBalance: 12,
    attendancePresent: 18,
    attendanceTotal: 22,
    pendingRequests: 2,
    nextHoliday: "Holi - Mar 31",
};

const QUICK_ACTIONS = [
    {
        id: "apply-leave",
        title: "Apply Leave",
        description: "Submit a new leave request",
        icon: Send,
        gradient: "from-primary-500 to-primary-600",
        route: "/app/company/hr/my-leave",
    },
    {
        id: "payslips",
        title: "View Payslips",
        description: "Download monthly payslips",
        icon: FileText,
        gradient: "from-success-500 to-success-600",
        route: "/app/company/hr/my-payslips",
    },
    {
        id: "check-in",
        title: "Mark Attendance",
        description: "Shift check-in / check-out",
        icon: Fingerprint,
        gradient: "from-accent-500 to-accent-600",
        route: "/app/company/hr/shift-check-in",
    },
    {
        id: "attendance",
        title: "View Attendance",
        description: "Monthly attendance log",
        icon: Eye,
        gradient: "from-info-500 to-info-600",
        route: "/app/company/hr/my-attendance",
    },
    {
        id: "profile",
        title: "My Profile",
        description: "View & update your details",
        icon: UserCircle,
        gradient: "from-warning-500 to-warning-600",
        route: "/app/company/hr/my-profile",
    },
    {
        id: "chatbot",
        title: "HR Chatbot",
        description: "Ask HR anything",
        icon: MessageCircle,
        gradient: "from-danger-500 to-danger-600",
        route: "/app/company/hr/chatbot",
    },
];

const RECENT_ACTIVITY = [
    {
        id: 1,
        icon: CheckCircle2,
        iconColor: "text-success-500",
        iconBg: "bg-success-50 dark:bg-success-900/30",
        title: "Leave approved",
        description: "Your casual leave for Mar 25 was approved by your manager.",
        time: "2 hours ago",
    },
    {
        id: 2,
        icon: FileText,
        iconColor: "text-primary-500",
        iconBg: "bg-primary-50 dark:bg-primary-900/30",
        title: "Payslip generated",
        description: "February 2026 payslip is now available for download.",
        time: "1 day ago",
    },
    {
        id: 3,
        icon: AlertCircle,
        iconColor: "text-warning-500",
        iconBg: "bg-warning-50 dark:bg-warning-900/30",
        title: "Regularization pending",
        description: "Attendance regularization for Mar 20 is pending approval.",
        time: "2 days ago",
    },
    {
        id: 4,
        icon: Gift,
        iconColor: "text-accent-500",
        iconBg: "bg-accent-50 dark:bg-accent-900/30",
        title: "Holiday announced",
        description: "Holi on Mar 31 has been marked as a company holiday.",
        time: "3 days ago",
    },
];

// ── KPI Card ──
interface KPICardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
}

function KPICard({ title, value, subtitle, icon: Icon, iconBg, iconColor }: KPICardProps) {
    return (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
                    <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">{title}</p>
            {subtitle && (
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>
            )}
        </div>
    );
}

// ── Main Dashboard ──
export function RoleBasedDashboardScreen() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const userRole = useAuthStore((s) => s.userRole);
    const displayName = getDisplayName(user);
    const firstName = user?.firstName ?? "there";

    const stats = PLACEHOLDER_STATS;

    return (
        <div className="min-h-full bg-neutral-50/50 dark:bg-neutral-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* ── Welcome Header ── */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {getGreeting()}, {firstName}!
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {formatDate()}
                            </p>
                        </div>
                        <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            Employee
                        </span>
                    </div>
                </div>

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Leave Balance"
                        value={stats.leaveBalance.toString()}
                        subtitle="Remaining across all types"
                        icon={CalendarDays}
                        iconBg="bg-primary-50 dark:bg-primary-900/30"
                        iconColor="text-primary-600 dark:text-primary-400"
                    />
                    <KPICard
                        title="Attendance This Month"
                        value={`${stats.attendancePresent}/${stats.attendanceTotal}`}
                        subtitle="Present / working days"
                        icon={CalendarCheck}
                        iconBg="bg-success-50 dark:bg-success-900/30"
                        iconColor="text-success-600 dark:text-success-400"
                    />
                    <KPICard
                        title="Pending Requests"
                        value={stats.pendingRequests.toString()}
                        subtitle="Leave + regularization"
                        icon={Clock}
                        iconBg="bg-warning-50 dark:bg-warning-900/30"
                        iconColor="text-warning-600 dark:text-warning-400"
                    />
                    <KPICard
                        title="Next Holiday"
                        value={stats.nextHoliday}
                        icon={Bell}
                        iconBg="bg-accent-50 dark:bg-accent-900/30"
                        iconColor="text-accent-600 dark:text-accent-400"
                    />
                </div>

                {/* ── Quick Actions ── */}
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {QUICK_ACTIONS.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => navigate(action.route)}
                                className={cn(
                                    "group relative flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800",
                                    "bg-white dark:bg-neutral-900 hover:shadow-md transition-all duration-200",
                                    "text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                                )}
                            >
                                <div className={cn(
                                    "w-11 h-11 rounded-xl bg-gradient-to-tr flex items-center justify-center flex-shrink-0 shadow-sm",
                                    action.gradient
                                )}>
                                    <action.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {action.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                                        {action.description}
                                    </p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Recent Activity ── */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                        Recent Activity
                    </h2>
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
                        {RECENT_ACTIVITY.map((item) => (
                            <div key={item.id} className="flex items-start gap-3.5 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", item.iconBg)}>
                                    <item.icon className={cn("w-4.5 h-4.5", item.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap flex-shrink-0 mt-1">
                                    {item.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
