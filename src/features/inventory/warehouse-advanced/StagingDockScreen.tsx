import { useState, useMemo } from 'react';
import { Loader2, ArrowDownToLine, ArrowUpFromLine, Package, Clock } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useStagingInbound, useStagingOutbound, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

export function StagingDockScreen() {
    const fmt = useCompanyFormatter();
    const [tab, setTab] = useState<'inbound' | 'outbound'>('inbound');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    const inboundParams = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        return p;
    }, [warehouseFilter, page]);

    const outboundParams = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        return p;
    }, [warehouseFilter, page]);

    const { data: inboundData, isLoading: inboundLoading } = useStagingInbound(tab === 'inbound' ? inboundParams : undefined);
    const { data: outboundData, isLoading: outboundLoading } = useStagingOutbound(tab === 'outbound' ? outboundParams : undefined);

    const isLoading = tab === 'inbound' ? inboundLoading : outboundLoading;
    const items = tab === 'inbound' ? (inboundData?.data || []) : (outboundData?.data || []);
    const meta = tab === 'inbound' ? inboundData?.meta : outboundData?.meta;

    const getTimeSinceReceipt = (dateStr: string) => {
        if (!dateStr) return '--';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staging & Dock Management</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Track inbound and outbound staging areas</p>
            </div>

            {/* Tabs + Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <button onClick={() => { setTab('inbound'); setPage(1); }} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'inbound' ? 'bg-white dark:bg-neutral-700 text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}>
                        <ArrowDownToLine className="w-4 h-4" /> Inbound Staging
                    </button>
                    <button onClick={() => { setTab('outbound'); setPage(1); }} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'outbound' ? 'bg-white dark:bg-neutral-700 text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}>
                        <ArrowUpFromLine className="w-4 h-4" /> Outbound Staging
                    </button>
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
                    <option value="">All Warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : items.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-12 text-center">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-400">No items in {tab} staging area</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lot</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        {tab === 'inbound' ? 'Time in Staging' : 'Order Reference'}
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        {tab === 'inbound' ? 'Received At' : 'Staged At'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any, idx: number) => {
                                    const timeInStaging = getTimeSinceReceipt(item.receivedAt || item.stagedAt || item.createdAt);
                                    const isOverdue = tab === 'inbound' && (Date.now() - new Date(item.receivedAt || item.createdAt).getTime()) > 24 * 60 * 60 * 1000;
                                    return (
                                        <tr key={item.id || idx} className={cn('border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30', isOverdue && 'bg-amber-50/50 dark:bg-amber-900/10')}>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.part?.partNumber || item.partNumber || '--'}</p>
                                                <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">{item.part?.name || item.partName || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-neutral-700 dark:text-neutral-300 text-xs">{Number(item.quantity ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-neutral-500 text-xs font-mono">{item.lotNumber || '--'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">{item.warehouse?.name || '--'}</td>
                                            <td className="px-4 py-3">
                                                {tab === 'inbound' ? (
                                                    <span className={cn('flex items-center gap-1 text-xs font-medium', isOverdue ? 'text-amber-600' : 'text-neutral-600')}>
                                                        <Clock className="w-3 h-3" /> {timeInStaging}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-neutral-700 dark:text-neutral-300">{item.orderReference || item.pickListNumber || '--'}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                                {fmt.dateTime(item.receivedAt || item.stagedAt || item.createdAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages} ({meta.total} records)</p>
                            <div className="flex gap-1">
                                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Previous</button>
                                <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
