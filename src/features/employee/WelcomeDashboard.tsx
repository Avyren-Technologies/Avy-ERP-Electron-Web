// ============================================================
// WelcomeDashboard — Polished landing for users without ESS/HR permissions
// ============================================================
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Eye,
    ScanLine,
    List,
    UserPlus,
    Shield,
    Users,
    ClipboardList,
    FileText,
    Settings,
    BarChart3,
    Package,
    MapPin,
    Clock,
    Calendar,
    Target,
    Send,
    Briefcase,
    Bell,
    CheckCircle2,
    ArrowRight,
    type LucideIcon,
} from "lucide-react";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";

// ── Types ──

export interface WelcomeNavigationItem {
    id: string;
    label: string;
    path: string;
    icon: string;
    group: string;
}

export interface WelcomeDashboardProps {
    firstName: string;
    navigationItems: WelcomeNavigationItem[];
}

// ── Icon Lookup ──

const ICON_LOOKUP: Record<string, LucideIcon> = {
    "eye": Eye,
    "scan-line": ScanLine,
    "list": List,
    "user-plus": UserPlus,
    "shield": Shield,
    "users": Users,
    "clipboard-list": ClipboardList,
    "file-text": FileText,
    "settings": Settings,
    "bar-chart": BarChart3,
    "package": Package,
    "map-pin": MapPin,
    "clock": Clock,
    "calendar": Calendar,
    "target": Target,
    "send": Send,
    "briefcase": Briefcase,
    "bell": Bell,
    "check-square": CheckCircle2,
    "dashboard": LayoutDashboard,
};

function resolveIcon(iconName: string): LucideIcon {
    return ICON_LOOKUP[iconName] ?? LayoutDashboard;
}

// ── Helpers ──

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// ── Component ──

export function WelcomeDashboard({ firstName, navigationItems }: WelcomeDashboardProps) {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();

    const todayStr = fmt.date(new Date().toISOString());

    // Group items by their group field
    const grouped = useMemo(() => {
        const map = new Map<string, WelcomeNavigationItem[]>();
        for (const item of navigationItems) {
            const group = item.group || "General";
            if (!map.has(group)) map.set(group, []);
            map.get(group)!.push(item);
        }
        return Array.from(map.entries());
    }, [navigationItems]);

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Greeting Header */}
            <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white tracking-tight">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {todayStr}
                    </p>
                </div>
            </div>

            {/* Quick Links Card */}
            {navigationItems.length > 0 ? (
                <div className="space-y-6">
                    {grouped.map(([group, items]) => (
                        <div key={group}>
                            {/* Group Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-1 w-1 rounded-full bg-primary-500" />
                                <h2 className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                                    {group}
                                </h2>
                                <div className="flex-1 h-px bg-neutral-200/60 dark:bg-neutral-800" />
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((item) => {
                                    const Icon = resolveIcon(item.icon);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => navigate(item.path)}
                                            className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
                                                        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-neutral-800 dark:text-white truncate">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0 mt-1" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty state — no accessible screens */
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
                        Welcome to Avy ERP
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Use the sidebar to navigate to your assigned screens.
                    </p>
                </div>
            )}
        </div>
    );
}
