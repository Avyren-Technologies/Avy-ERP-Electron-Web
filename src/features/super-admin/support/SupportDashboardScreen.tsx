import { useState, useEffect, useMemo } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Search, Filter, X, Zap,
    ChevronLeft, ChevronRight, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformSupportTickets, usePlatformSupportStats } from '@/features/super-admin/api/use-support-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = ['All', 'OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;
const CATEGORY_OPTIONS = ['All', 'MODULE_CHANGE', 'BILLING', 'TECHNICAL', 'GENERAL'] as const;

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_ON_CUSTOMER: 'Waiting on Customer',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

const CATEGORY_LABELS: Record<string, string> = {
    MODULE_CHANGE: 'Module Change',
    BILLING: 'Billing',
    TECHNICAL: 'Technical',
    GENERAL: 'General',
};

function getStatusStyle(status: string): string {
    switch (status) {
        case 'OPEN':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        case 'IN_PROGRESS':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'WAITING_ON_CUSTOMER':
            return 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50';
        case 'RESOLVED':
            return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50';
        case 'CLOSED':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function getCategoryStyle(category: string): string {
    switch (category) {
        case 'MODULE_CHANGE':
            return 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50';
        case 'BILLING':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'TECHNICAL':
            return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
        case 'GENERAL':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function getPriorityStyle(priority: string): string {
    switch (priority) {
        case 'URGENT':
            return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
        case 'HIGH':
            return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
        case 'NORMAL':
            return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
        case 'LOW':
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        default:
            return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
}

function formatRelativeTime(ts: string, fmt: ReturnType<typeof useCompanyFormatter>): string {
    try {
        const now = Date.now();
        const diff = now - new Date(ts).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return fmt.date(ts);
    } catch {
        return ts;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SupportDashboardScreen() {
    const fmt = useCompanyFormatter();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const params = useMemo(() => ({
        page,
        limit,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        search: debouncedSearch || undefined,
    }), [page, limit, statusFilter, categoryFilter, debouncedSearch]);

    const { data: statsData } = usePlatformSupportStats();
    const { data, isLoading, isError } = usePlatformSupportTickets(params);

    const tickets: any[] = data?.data ?? [];
    const meta = data?.meta;
    const total = meta?.total ?? tickets.length;

    const stats = statsData?.data ?? {};

    const hasActiveFilters = statusFilter !== 'All' || categoryFilter !== 'All' || search.length > 0;

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('All');
        setCategoryFilter('All');
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50">
                            <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Support Dashboard</h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage support tickets from all companies</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Open', value: stats.open ?? 0, color: 'info' },
                    { label: 'In Progress', value: stats.inProgress ?? 0, color: 'warning' },
                    { label: 'Waiting on Customer', value: stats.waitingOnCustomer ?? 0, color: 'accent' },
                    { label: 'Resolved Today', value: stats.resolvedToday ?? 0, color: 'success' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 shadow-sm transition-colors"
                    >
                        <p className={cn('text-3xl font-bold', {
                            'text-info-600 dark:text-info-400': stat.color === 'info',
                            'text-warning-600 dark:text-warning-400': stat.color === 'warning',
                            'text-accent-600 dark:text-accent-400': stat.color === 'accent',
                            'text-success-600 dark:text-success-400': stat.color === 'success',
                        })}>
                            {stat.value}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col gap-4 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by company name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_LABELS[s] ?? s}</option>
                            ))}
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                        >
                            {CATEGORY_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c === 'All' ? 'All Categories' : CATEGORY_LABELS[c] ?? c}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors flex items-center gap-1.5"
                            >
                                <X className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load support tickets. Please try again.
                </div>
            )}

            {/* Ticket List */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                {isLoading ? <SkeletonTable rows={8} cols={6} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Subject</th>
                                    <th className="py-4 px-6 font-bold">Company</th>
                                    <th className="py-4 px-6 font-bold">Category</th>
                                    <th className="py-4 px-6 font-bold">Priority</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Created</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {tickets.map((ticket: any) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => navigate(`/app/support/ticket/${ticket.id}`)}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {ticket.category === 'MODULE_CHANGE' && (
                                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-primary-100 dark:bg-primary-900/30" title="Module Change Request">
                                                        <Zap className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                                    </span>
                                                )}
                                                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                                                    {ticket.subject}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                                {ticket.company?.name ?? ticket.companyName ?? '—'}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                                getCategoryStyle(ticket.category),
                                            )}>
                                                {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                                getPriorityStyle(ticket.priority),
                                            )}>
                                                {ticket.priority}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                                getStatusStyle(ticket.status),
                                            )}>
                                                {STATUS_LABELS[ticket.status] ?? ticket.status}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                                                {formatRelativeTime(ticket.createdAt, fmt)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {tickets.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="search" title="No tickets found" message="Try adjusting your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">
                        Showing {tickets.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={!meta || page >= (meta.totalPages ?? 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
