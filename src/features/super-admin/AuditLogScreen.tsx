import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuditLogs, useAuditFilterOptions } from '@/features/super-admin/api/use-audit-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

function getActionBadgeStyle(action: string): string {
    const upper = action.toUpperCase();
    if (upper.startsWith('CREATE') || upper.startsWith('REGISTER'))
        return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50';
    if (upper.startsWith('UPDATE') || upper.startsWith('EDIT') || upper.startsWith('CHANGE'))
        return 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50';
    if (upper.startsWith('DELETE') || upper.startsWith('REMOVE'))
        return 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50';
    if (upper.startsWith('LOGIN') || upper.startsWith('AUTH') || upper.startsWith('LOGOUT'))
        return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50';
    return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
}

function formatTimestamp(ts: string): string {
    try {
        const date = new Date(ts);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } catch {
        return ts;
    }
}

export function AuditLogScreen() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeAction, setActiveAction] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const limit = 25;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: filterData } = useAuditFilterOptions();
    const actionTypes: string[] = filterData?.data?.actionTypes ?? [];

    const params = useMemo(() => ({
        page,
        limit,
        search: debouncedSearch || undefined,
        action: activeAction === 'All' ? undefined : activeAction,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    }), [page, limit, debouncedSearch, activeAction, dateFrom, dateTo]);

    const { data, isLoading, isError } = useAuditLogs(params);

    const logs: any[] = data?.data ?? [];
    const meta = data?.meta;
    const total = meta?.total ?? logs.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/50">
                            <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Audit Log</h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track all platform actions and changes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col gap-4 transition-colors">

                {/* Search + Date Range Row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by user, entity, or IP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 ml-auto">
                        <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                            placeholder="From"
                        />
                        <span className="text-neutral-400 text-sm">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white transition-all"
                            placeholder="To"
                        />
                    </div>
                </div>

                {/* Action Type Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 mr-2 shrink-0">
                        <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {['All', ...actionTypes].map((action) => (
                        <button
                            key={action}
                            onClick={() => { setActiveAction(action); setPage(1); }}
                            className={cn(
                                'px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                                activeAction === action
                                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30 dark:shadow-none'
                                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            )}
                        >
                            {action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load audit logs. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                {isLoading ? <SkeletonTable rows={10} cols={6} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Timestamp</th>
                                    <th className="py-4 px-6 font-bold">Action</th>
                                    <th className="py-4 px-6 font-bold">Entity Type</th>
                                    <th className="py-4 px-6 font-bold">Entity ID</th>
                                    <th className="py-4 px-6 font-bold">User</th>
                                    <th className="py-4 px-6 font-bold">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {logs.map((log: any) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium text-xs">
                                                {formatTimestamp(log.createdAt ?? log.timestamp)}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border',
                                                getActionBadgeStyle(log.action ?? '')
                                            )}>
                                                {log.action}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                                                {log.entityType}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                                                {log.entityId ? (log.entityId.length > 12 ? `${log.entityId.slice(0, 12)}...` : log.entityId) : '—'}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium text-sm">
                                                {log.userName ?? log.userEmail ?? log.userId ?? '—'}
                                            </span>
                                            {log.userName && log.userEmail && (
                                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{log.userEmail}</p>
                                            )}
                                        </td>

                                        <td className="py-4 px-6">
                                            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                                                {log.ipAddress ?? '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {logs.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState icon="search" title="No audit logs found" message="Try adjusting your filters." />
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
                        Showing {logs.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
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
