import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, AlertTriangle, Clock, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryDashboard } from '@/features/inventory/api/use-inventory-queries';
import { inventoryKeys } from '@/features/inventory/api/inventory-keys';

/* ── KPI Card ── */

function KpiCard({ icon: Icon, label, value, subtext, color }: {
    icon: typeof Package; label: string; value: string | number; subtext?: string; color: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
                    {subtext && <p className="text-xs text-neutral-400 mt-1">{subtext}</p>}
                </div>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );
}

/* ── Main Screen ── */

export function InventoryDashboardScreen() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useInventoryDashboard();
    const dashboard = data?.data;

    // Real-time Socket.io listeners for live dashboard updates
    // TODO: Connect to actual Socket.io client when infrastructure is ready
    useEffect(() => {
        const handleBalanceChanged = () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.stockOnHand() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
        };
        const handleApprovalPending = () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.pendingApprovals() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard() });
        };

        // Wire up when socket client is available:
        // socket.on('inventory:balance-changed', handleBalanceChanged);
        // socket.on('inventory:approval-pending', handleApprovalPending);

        return () => {
            // socket.off('inventory:balance-changed', handleBalanceChanged);
            // socket.off('inventory:approval-pending', handleApprovalPending);
        };
    }, [queryClient]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    const pending = dashboard?.pendingTasks || {};
    const risks = dashboard?.stockRisks || {};
    const activity = dashboard?.todayActivity || {};

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Inventory Dashboard</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Overview of warehouse operations and stock health</p>
            </div>

            {/* Pending Tasks */}
            <div>
                <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">Pending Tasks</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={ArrowDownToLine} label="Pending Put-Away" value={pending.pendingPutaway ?? 0} color="bg-blue-600" />
                    <KpiCard icon={ClipboardCheck} label="Pending Counts" value={pending.pendingCounts ?? 0} color="bg-amber-600" />
                    <KpiCard icon={ShieldCheck} label="Pending Approvals" value={pending.pendingApprovals ?? 0} color="bg-violet-600" />
                    <KpiCard icon={ArrowLeftRight} label="In-Transit Moves" value={pending.inTransitMoves ?? 0} color="bg-teal-600" />
                </div>
            </div>

            {/* Stock Risks */}
            <div>
                <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">Stock Risks</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={AlertTriangle} label="Near Expiry" value={risks.nearExpiry ?? 0} subtext="Items expiring soon" color="bg-orange-600" />
                    <KpiCard icon={Clock} label="Blocked Aging" value={risks.blockedAging ?? 0} subtext="Beyond aging threshold" color="bg-red-600" />
                    <KpiCard icon={Package} label="Below Reorder" value={risks.belowReorder ?? 0} subtext="Need reorder" color="bg-rose-600" />
                    <KpiCard icon={AlertTriangle} label="Zero Stock" value={risks.zeroStock ?? 0} subtext="No stock on hand" color="bg-neutral-600" />
                </div>
            </div>

            {/* Today's Activity */}
            <div>
                <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">Today's Activity</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={ArrowDownToLine} label="Receipts" value={activity.receipts ?? 0} color="bg-emerald-600" />
                    <KpiCard icon={ArrowUpFromLine} label="Dispatches" value={activity.dispatches ?? 0} color="bg-indigo-600" />
                    <KpiCard icon={ArrowLeftRight} label="Transfers" value={activity.transfers ?? 0} color="bg-cyan-600" />
                    <KpiCard icon={ClipboardCheck} label="Adjustments" value={activity.adjustments ?? 0} color="bg-purple-600" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Warehouse Summary */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-4">Warehouse Utilization</h3>
                    {dashboard?.warehouseSummary?.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.warehouseSummary.map((wh: any) => (
                                <div key={wh.id || wh.code} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{wh.name || wh.code}</p>
                                        <p className="text-xs text-neutral-500">{wh.zoneCount ?? 0} zones, {wh.binCount ?? 0} bins</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{Number(wh.totalQty ?? 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-neutral-400">items</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400">No warehouse data available</p>
                    )}
                </div>

                {/* Stock by Status */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-4">Stock Distribution by Status</h3>
                    {dashboard?.stockByStatus?.length > 0 ? (
                        <div className="space-y-2">
                            {dashboard.stockByStatus.map((s: any) => {
                                const total = dashboard.stockByStatus.reduce((sum: number, x: any) => sum + Number(x.qty || 0), 0);
                                const pct = total > 0 ? (Number(s.qty) / total) * 100 : 0;
                                return (
                                    <div key={s.status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{s.status?.replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-bold text-neutral-900 dark:text-white">{Number(s.qty).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400">No stock data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
