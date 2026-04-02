import { useState, useMemo } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/features/company-admin/api/use-ess-queries";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardData, DashboardAnnouncement } from "@/lib/api/ess";

/* ================================================================
   Priority Helpers
   ================================================================ */

type Priority = DashboardAnnouncement["priority"];

const PRIORITY_ORDER: Record<Priority, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

function priorityBadgeClasses(p: Priority): string {
    switch (p) {
        case "URGENT":
            return "bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400 border-danger-200 dark:border-danger-800/50";
        case "HIGH":
            return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
        case "MEDIUM":
            return "bg-info-50 text-info-700 dark:bg-info-900/20 dark:text-info-400 border-info-200 dark:border-info-800/50";
        case "LOW":
            return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
    }
}

function priorityCardAccent(p: Priority): string {
    switch (p) {
        case "URGENT":
            return "border-l-danger-500";
        case "HIGH":
            return "border-l-amber-500";
        case "MEDIUM":
            return "border-l-info-500";
        case "LOW":
            return "border-l-neutral-300 dark:border-l-neutral-600";
    }
}

const ALL_PRIORITIES: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

/* ================================================================
   Main Screen
   ================================================================ */

export function AnnouncementsScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();
    const { data: dashboardResponse, isLoading } = useDashboard();
    const rawData = dashboardResponse?.data as DashboardData | undefined;
    const announcements = rawData?.announcements ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");
    const [showFilters, setShowFilters] = useState(false);

    const filtered = useMemo(() => {
        let result = [...announcements];

        // Priority filter
        if (priorityFilter !== "ALL") {
            result = result.filter((a) => a.priority === priorityFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (a) =>
                    a.title.toLowerCase().includes(q) ||
                    a.body.toLowerCase().includes(q)
            );
        }

        // Sort by priority then by date
        result.sort((a, b) => {
            const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            if (pDiff !== 0) return pDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }, [announcements, searchQuery, priorityFilter]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <Skeleton width={200} height={32} />
                <Skeleton height={48} borderRadius={12} />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} height={120} borderRadius={16} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Announcements
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {announcements.length} total announcement{announcements.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search announcements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-primary-950 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-600"
                            >
                                <X className="w-3 h-3 text-neutral-500" />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                            showFilters || priorityFilter !== "ALL"
                                ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                                : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {/* Priority filter pills */}
                {showFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setPriorityFilter("ALL")}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                priorityFilter === "ALL"
                                    ? "bg-primary-500 text-white border-primary-500"
                                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-300"
                            )}
                        >
                            All
                        </button>
                        {ALL_PRIORITIES.map((p) => (
                            <button
                                key={p}
                                onClick={() => setPriorityFilter(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    priorityFilter === p
                                        ? "bg-primary-500 text-white border-primary-500"
                                        : cn(
                                              "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-primary-300",
                                              priorityBadgeClasses(p).split(" ").filter(c => c.startsWith("text-")).join(" ")
                                          )
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Announcements list */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                        <Megaphone className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-lg font-semibold text-neutral-500 dark:text-neutral-400">
                        No announcements found
                    </p>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">
                        {searchQuery || priorityFilter !== "ALL"
                            ? "Try adjusting your search or filters."
                            : "There are no announcements at this time."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((a) => (
                        <div
                            key={a.id}
                            className={cn(
                                "rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-l-4",
                                priorityCardAccent(a.priority)
                            )}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-sm font-bold text-primary-950 dark:text-white leading-snug">
                                        {a.title}
                                    </h3>
                                    <span
                                        className={cn(
                                            "flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                            priorityBadgeClasses(a.priority)
                                        )}
                                    >
                                        {a.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                    {a.body}
                                </p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-3">
                                    {fmt.date(a.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
