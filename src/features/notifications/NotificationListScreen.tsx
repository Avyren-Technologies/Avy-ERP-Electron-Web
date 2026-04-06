import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notifications';
import { showApiError } from '@/lib/toast';
import { DateTime } from 'luxon';
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationKeys = {
    all: ['notifications'] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
    list: (params?: Record<string, unknown>) =>
        params ? [...notificationKeys.all, 'list', params] as const : [...notificationKeys.all, 'list'] as const,
};

const typeColors: Record<string, string> = {
    info: 'bg-info-50 text-info-600 dark:bg-info-900/40',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/40',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/40',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/40',
};

const typeIcons: Record<string, string> = {
    info: 'i',
    success: '\u2713',
    warning: '!',
    danger: '\u2717',
};

function formatDate(dateStr: string): string {
    const dt = DateTime.fromISO(dateStr);
    const now = DateTime.now();
    const diffMs = now.toMillis() - dt.toMillis();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return dt.toFormat('dd/MM/yyyy HH:mm');
}

const PAGE_LIMIT = 20;

export function NotificationListScreen() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: notificationKeys.list({ page, limit: PAGE_LIMIT }),
        queryFn: () => notificationApi.listNotifications({ page, limit: PAGE_LIMIT }),
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
        onError: (err) => showApiError(err),
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
        onError: (err) => showApiError(err),
    });

    const notifications = data?.data ?? [];
    const meta = data?.meta;
    const totalPages = meta?.totalPages ?? 1;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white">Notifications</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {meta?.total != null ? `${meta.total} total notifications` : 'Your notification history'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl transition-colors disabled:opacity-50"
                >
                    <CheckCheck className="w-4 h-4" />
                    Mark all as read
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="px-6 py-16 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                        <p className="text-sm text-neutral-500 mt-3">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Bell className="mx-auto mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-neutral-600 dark:text-neutral-300">No notifications</p>
                        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                            You&apos;re all caught up. New alerts will show here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {notifications.map((n: Record<string, unknown>) => {
                            const id = n.id as string;
                            const title = n.title as string;
                            const body = n.body as string;
                            const type = (n.type as string) ?? 'info';
                            const readAt = n.readAt as string | null;
                            const createdAt = n.createdAt as string;
                            return (
                                <div
                                    key={id}
                                    onClick={() => {
                                        if (!readAt) markAsReadMutation.mutate(id);
                                    }}
                                    className={cn(
                                        'flex items-start gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors',
                                        !readAt && 'bg-primary-50/60 dark:bg-primary-900/10'
                                    )}
                                >
                                    <div className={cn(
                                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
                                        typeColors[type] ?? typeColors.info
                                    )}>
                                        {typeIcons[type] ?? 'i'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-sm text-primary-950 dark:text-white',
                                            !readAt ? 'font-semibold' : 'font-medium text-neutral-700 dark:text-neutral-300'
                                        )}>
                                            {title}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-5">
                                            {body}
                                        </p>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-medium">
                                            {formatDate(createdAt)}
                                        </p>
                                    </div>
                                    {!readAt && <span className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-2" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
