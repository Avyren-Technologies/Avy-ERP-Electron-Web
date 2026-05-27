import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Filter, Package, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockOnHand, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { inventoryKeys } from '@/features/inventory/api/inventory-keys';
import { InventoryStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { STOCK_STATUS_CONFIG } from '@/features/inventory/shared/inventory-status-colors';

/* ── Main Screen ── */

export function StockExplorerScreen() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    // Real-time Socket.io listeners for live stock balance updates
    // TODO: Connect to actual Socket.io client when infrastructure is ready
    useEffect(() => {
        const handleBalanceChanged = () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.stockOnHand() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.netAvailable() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.stockByStatus() });
        };

        // Wire up when socket client is available:
        // socket.on('inventory:balance-changed', handleBalanceChanged);

        return () => {
            // socket.off('inventory:balance-changed', handleBalanceChanged);
        };
    }, [queryClient]);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (search) p.search = search;
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        if (statusFilter) p.status = statusFilter;
        return p;
    }, [search, warehouseFilter, statusFilter, page]);

    const { data, isLoading } = useStockOnHand(params);
    const { data: whData } = useWarehouses();

    const items = data?.data || [];
    const meta = data?.meta;
    const warehouses = whData?.data || [];

    const statusOptions = Object.keys(STOCK_STATUS_CONFIG);

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Stock Explorer</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">View real-time stock balances across all locations</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search part number or name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={warehouseFilter}
                    onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All statuses</option>
                    {statusOptions.map((s) => (
                        <option key={s} value={s}>{STOCK_STATUS_CONFIG[s].label}</option>
                    ))}
                </select>
                {(search || warehouseFilter || statusFilter) && (
                    <button
                        onClick={() => { setSearch(''); setWarehouseFilter(''); setStatusFilter(''); setPage(1); }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Zone / Bin</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lot / Serial</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">UoM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No stock records found</p>
                                            <p className="text-xs text-neutral-400 mt-1">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                )}
                                {items.map((item: any, idx: number) => (
                                    <tr key={item.id || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.partNumber || item.part?.partNumber || '--'}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[200px]">{item.partName || item.part?.name || ''}</p>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-xs">
                                            {item.warehouseCode || item.warehouse?.code || '--'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {[item.zoneCode || item.zone?.code, item.binCode || item.bin?.code].filter(Boolean).join(' / ') || '--'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <InventoryStatusBadge status={item.status || 'AVAILABLE'} />
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {item.lotNumber || item.serialNumber || '--'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-white">
                                            {Number(item.qty ?? item.quantity ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-500 text-xs">
                                            {item.uom || item.part?.uom || '--'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">
                                Page {meta.page} of {meta.totalPages} ({meta.total} records)
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= meta.totalPages}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
