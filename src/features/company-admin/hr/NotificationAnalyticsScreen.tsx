import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { client } from '@/lib/api/client';
import { DashboardShell, KPIGrid, TrendChart, ZeroDataState } from '@/components/analytics';
import type { KPICardData } from '@/components/analytics/KPIGrid';

// ── Types matching the backend analytics response shape ─────────────

interface SummaryResponse {
    rangeDays: number;
    totals: { sent: number; delivered: number; failed: number; skipped: number };
    byChannel: Record<string, { sent: number; delivered: number; failed: number }>;
    deliveryRate: number;
}

interface TrendResponse {
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
}

interface TopFailingResponse {
    templateId: string | null;
    templateName: string;
    failures: number;
}

interface EnvelopeShape<T> {
    success?: boolean;
    data?: T;
}

// ── Query helpers ───────────────────────────────────────────────────

const notificationAnalyticsKey = (days: number) =>
    ['notification-analytics', days] as const;

function useNotificationAnalytics(days: number) {
    const summary = useQuery({
        queryKey: [...notificationAnalyticsKey(days), 'summary'],
        queryFn: async () => {
            const r = await client.get<EnvelopeShape<SummaryResponse>>(
                `/notifications/analytics/summary?days=${days}`,
            );
            return r.data;
        },
        staleTime: 60_000,
    });
    const trend = useQuery({
        queryKey: [...notificationAnalyticsKey(days), 'trend'],
        queryFn: async () => {
            const r = await client.get<EnvelopeShape<TrendResponse[]>>(
                `/notifications/analytics/delivery-trend?days=${days}`,
            );
            return r.data;
        },
        staleTime: 60_000,
    });
    const topFailing = useQuery({
        queryKey: [...notificationAnalyticsKey(days), 'top-failing'],
        queryFn: async () => {
            const r = await client.get<EnvelopeShape<TopFailingResponse[]>>(
                `/notifications/analytics/top-failing?days=${days}&limit=10`,
            );
            return r.data;
        },
        staleTime: 60_000,
    });
    return { summary, trend, topFailing };
}

// ── Screen ──────────────────────────────────────────────────────────

export function NotificationAnalyticsScreen() {
    const [days, setDays] = useState<number>(30);
    const { summary, trend, topFailing } = useNotificationAnalytics(days);

    const summaryData = summary.data?.data;
    const trendData = trend.data?.data ?? [];
    const topFailingData = topFailing.data?.data ?? [];

    const kpis: KPICardData[] = useMemo(() => {
        if (!summaryData) return [];
        const t = summaryData.totals;
        return [
            {
                key: 'sent',
                label: 'Sent',
                value: t.sent.toLocaleString(),
                icon: Bell,
            },
            {
                key: 'delivered',
                label: 'Delivered',
                value: t.delivered.toLocaleString(),
                icon: CheckCircle2,
            },
            {
                key: 'failed',
                label: 'Failed',
                value: t.failed.toLocaleString(),
                icon: XCircle,
                trendDirection: t.failed > 0 ? 'down' : 'neutral',
            },
            {
                key: 'delivery_rate',
                label: 'Delivery rate',
                value: `${summaryData.deliveryRate}%`,
                icon: CheckCircle2,
                trendDirection: summaryData.deliveryRate >= 95 ? 'up' : 'down',
            },
            {
                key: 'skipped',
                label: 'Skipped',
                value: t.skipped.toLocaleString(),
                icon: SkipForward,
            },
        ];
    }, [summaryData]);

    const isLoading = summary.isLoading || trend.isLoading || topFailing.isLoading;
    const hasError = summary.isError || trend.isError || topFailing.isError;

    // Zero-data fallback: the aggregation cron hasn't run yet or no events exist
    if (!isLoading && !hasError && summaryData && summaryData.totals.sent === 0) {
        return (
            <ZeroDataState
                title="No notification data yet"
                description="Notification analytics aggregate overnight. Come back tomorrow, or trigger a test notification to seed the data."
                ctaLabel="Go to Notification Templates"
                ctaPath="/app/company/hr/notification-templates"
            />
        );
    }

    return (
        <DashboardShell
            title="Notification Analytics"
            headerSubtitle="Delivery rates, channel health, and top failing templates over the selected window."
            headerAside={
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
                                days === d
                                    ? 'bg-white text-indigo-600'
                                    : 'text-white/80 hover:text-white'
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            }
        >
            <div className="space-y-6 p-6">
                {hasError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                        Failed to load one or more analytics queries. Try refreshing the page.
                    </div>
                )}

                <KPIGrid kpis={kpis} />

                {/* Delivery trend */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Delivery trend
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Daily sent / delivered / failed / skipped counts over the selected window.
                        </p>
                    </div>
                    {trendData.length > 0 ? (
                        <TrendChart
                            data={trendData.map((row) => ({
                                date: row.date,
                                sent: row.sent,
                                delivered: row.delivered,
                                failed: row.failed,
                                skipped: row.skipped,
                            }))}
                            series={[
                                { key: 'sent', name: 'Sent', color: '#6366F1', type: 'area' },
                                { key: 'delivered', name: 'Delivered', color: '#10B981', type: 'area' },
                                { key: 'failed', name: 'Failed', color: '#EF4444', type: 'line' },
                                { key: 'skipped', name: 'Skipped', color: '#F59E0B', type: 'line' },
                            ]}
                            height={320}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-neutral-400">
                            {isLoading ? 'Loading…' : 'No trend data in range'}
                        </div>
                    )}
                </section>

                {/* By-channel breakdown */}
                {summaryData && Object.keys(summaryData.byChannel).length > 0 && (
                    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                By channel
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Delivery breakdown per channel across the window.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="text-left py-2 pr-4 font-medium text-neutral-700 dark:text-neutral-300">
                                            Channel
                                        </th>
                                        <th className="text-right py-2 px-2 font-medium text-neutral-700 dark:text-neutral-300">
                                            Sent
                                        </th>
                                        <th className="text-right py-2 px-2 font-medium text-neutral-700 dark:text-neutral-300">
                                            Delivered
                                        </th>
                                        <th className="text-right py-2 px-2 font-medium text-neutral-700 dark:text-neutral-300">
                                            Failed
                                        </th>
                                        <th className="text-right py-2 pl-2 font-medium text-neutral-700 dark:text-neutral-300">
                                            Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(summaryData.byChannel).map(([channel, stats]) => {
                                        const rate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0.0';
                                        return (
                                            <tr
                                                key={channel}
                                                className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                                            >
                                                <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                    {channel}
                                                </td>
                                                <td className="py-3 px-2 text-right tabular-nums">
                                                    {stats.sent.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                                                    {stats.delivered.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-2 text-right tabular-nums text-red-600 dark:text-red-400">
                                                    {stats.failed.toLocaleString()}
                                                </td>
                                                <td className="py-3 pl-2 text-right tabular-nums font-semibold">
                                                    {rate}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Top failing templates */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Top failing templates
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Templates with the most FAILED events — triage candidates for broken bodies or bad provider config.
                        </p>
                    </div>
                    {topFailingData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="text-left py-2 pr-4 font-medium text-neutral-700 dark:text-neutral-300">
                                            Template
                                        </th>
                                        <th className="text-right py-2 pl-4 font-medium text-neutral-700 dark:text-neutral-300">
                                            Failures
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topFailingData.map((row) => (
                                        <tr
                                            key={row.templateId ?? row.templateName}
                                            className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                                        >
                                            <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">
                                                {row.templateName}
                                            </td>
                                            <td className="py-3 pl-4 text-right tabular-nums text-red-600 dark:text-red-400">
                                                {row.failures.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-neutral-400">
                            {isLoading ? 'Loading…' : 'No failed deliveries in range — everything is healthy.'}
                        </div>
                    )}
                </section>
            </div>
        </DashboardShell>
    );
}

export default NotificationAnalyticsScreen;
