import { useState, useMemo } from 'react';
import { Loader2, Download, FileSpreadsheet, ArrowRightLeft, SlidersHorizontal, ClipboardList } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { inventoryApi } from '@/features/inventory/api/inventory-api';
import { TransactionStatusBadge } from '@/features/inventory/shared/InventoryStatusBadge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { inventoryKeys } from '@/features/inventory/api/inventory-keys';

const TABS = [
    { key: 'transaction-register', label: 'Transaction Register', icon: FileSpreadsheet },
    { key: 'count-variance', label: 'Count Variance', icon: ClipboardList },
    { key: 'adjustment-register', label: 'Adjustment Register', icon: SlidersHorizontal },
    { key: 'transfer-log', label: 'Transfer Log', icon: ArrowRightLeft },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const selectClass = 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none';

export function InventoryReportsScreen() {
    const [tab, setTab] = useState<TabKey>('transaction-register');

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Reports</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">View and export inventory transaction reports</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 overflow-x-auto">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                            tab === t.key
                                ? 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900',
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'transaction-register' && <TransactionRegisterTab />}
            {tab === 'count-variance' && <CountVarianceTab />}
            {tab === 'adjustment-register' && <AdjustmentRegisterTab />}
            {tab === 'transfer-log' && <TransferLogTab />}
        </div>
    );
}

/* ── Shared Filter Bar ── */

function ReportFilters({
    dateFrom, setDateFrom, dateTo, setDateTo,
    warehouseId, setWarehouseId,
    onExport, isExporting,
    children,
}: {
    dateFrom: string; setDateFrom: (v: string) => void;
    dateTo: string; setDateTo: (v: string) => void;
    warehouseId: string; setWarehouseId: (v: string) => void;
    onExport: () => void; isExporting: boolean;
    children?: React.ReactNode;
}) {
    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <input type="date" className={selectClass} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-xs text-neutral-400">to</span>
            <input type="date" className={selectClass} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <select className={selectClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">All warehouses</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
            </select>
            {children}
            <div className="flex-1" />
            <button
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
            </button>
        </div>
    );
}

/* ── Transaction Register ── */

function TransactionRegisterTab() {
    const fmt = useCompanyFormatter();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        if (warehouseId) p.warehouseId = warehouseId;
        if (typeFilter) p.type = typeFilter;
        return p;
    }, [dateFrom, dateTo, warehouseId, typeFilter, page]);

    const { data, isLoading } = useQuery({
        queryKey: [...inventoryKeys.all, 'report-transaction-register', params],
        queryFn: () => inventoryApi.getTransactionRegister(params),
    });

    const items = data?.data || [];
    const meta = data?.meta;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportParams = { ...params, export: 'csv' };
            await inventoryApi.getTransactionRegister(exportParams);
        } finally {
            setIsExporting(false);
        }
    };

    const TX_TYPES = ['RECEIVE_STOCK', 'GRN', 'MOVE_STOCK', 'ADJUST_STOCK', 'PICK_ITEMS', 'DISPATCH', 'CUSTOMER_RETURN', 'VENDOR_RETURN'];

    return (
        <div className="space-y-4">
            <ReportFilters dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} warehouseId={warehouseId} setWarehouseId={setWarehouseId} onExport={handleExport} isExporting={isExporting}>
                <select className={selectClass} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                    <option value="">All types</option>
                    {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
            </ReportFilters>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-neutral-400">No transactions found</td></tr>}
                                {items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{item.transactionNumber || '--'}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{(item.type || '').replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{item.warehouseCode || item.warehouse?.code || '--'}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-700">{item.partNumber || item.part?.partNumber || '--'}</td>
                                        <td className="px-4 py-3 text-right font-medium">{item.quantity != null ? Number(item.quantity).toLocaleString() : '--'}</td>
                                        <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'POSTED'} /></td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                    </tr>
                                ))}
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

/* ── Count Variance ── */

function CountVarianceTab() {
    const fmt = useCompanyFormatter();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        if (warehouseId) p.warehouseId = warehouseId;
        return p;
    }, [dateFrom, dateTo, warehouseId, page]);

    const { data, isLoading } = useQuery({
        queryKey: [...inventoryKeys.all, 'report-count-variance', params],
        queryFn: () => inventoryApi.getCountVariance(params),
    });

    const items = data?.data || [];
    const meta = data?.meta;

    const handleExport = async () => {
        setIsExporting(true);
        try { await inventoryApi.getCountVariance({ ...params, export: 'csv' }); } finally { setIsExporting(false); }
    };

    return (
        <div className="space-y-4">
            <ReportFilters dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} warehouseId={warehouseId} setWarehouseId={setWarehouseId} onExport={handleExport} isExporting={isExporting} />

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Count #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">System Qty</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Physical Qty</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Variance %</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-neutral-400">No variance data found</td></tr>}
                                {items.map((item: any, idx: number) => {
                                    const variance = Number(item.variance ?? 0);
                                    return (
                                        <tr key={item.id || idx} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">{item.countNumber || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700">{item.partNumber || '--'}</td>
                                            <td className="px-4 py-3 text-right text-neutral-600">{Number(item.systemQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium">{Number(item.physicalQty ?? 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                                                    {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-neutral-500">{item.variancePct != null ? `${Number(item.variancePct).toFixed(1)}%` : '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">{item.createdAt ? fmt.date(item.createdAt) : '--'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages}</p>
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

/* ── Adjustment Register ── */

function AdjustmentRegisterTab() {
    const fmt = useCompanyFormatter();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        if (warehouseId) p.warehouseId = warehouseId;
        return p;
    }, [dateFrom, dateTo, warehouseId, page]);

    const { data, isLoading } = useQuery({
        queryKey: [...inventoryKeys.all, 'report-adjustment-register', params],
        queryFn: () => inventoryApi.getAdjustmentRegister(params),
    });

    const items = data?.data || [];
    const meta = data?.meta;

    const handleExport = async () => {
        setIsExporting(true);
        try { await inventoryApi.getAdjustmentRegister({ ...params, export: 'csv' }); } finally { setIsExporting(false); }
    };

    return (
        <div className="space-y-4">
            <ReportFilters dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} warehouseId={warehouseId} setWarehouseId={setWarehouseId} onExport={handleExport} isExporting={isExporting} />

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty Change</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reason</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-neutral-400">No adjustments found</td></tr>}
                                {items.map((item: any) => {
                                    const qty = Number(item.quantity ?? 0);
                                    return (
                                        <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">{item.transactionNumber || '--'}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-700">{item.partNumber || '--'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {qty > 0 ? '+' : ''}{qty.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">{item.reasonCode || '--'}</td>
                                            <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'POSTED'} /></td>
                                            <td className="px-4 py-3 text-xs text-neutral-600">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages}</p>
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

/* ── Transfer Log ── */

function TransferLogTab() {
    const fmt = useCompanyFormatter();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, unknown> = { page, limit: 25 };
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo) p.dateTo = dateTo;
        if (warehouseId) p.warehouseId = warehouseId;
        return p;
    }, [dateFrom, dateTo, warehouseId, page]);

    const { data, isLoading } = useQuery({
        queryKey: [...inventoryKeys.all, 'report-transfer-log', params],
        queryFn: () => inventoryApi.getTransferLog(params),
    });

    const items = data?.data || [];
    const meta = data?.meta;

    const handleExport = async () => {
        setIsExporting(true);
        try { await inventoryApi.getTransferLog({ ...params, export: 'csv' }); } finally { setIsExporting(false); }
    };

    return (
        <div className="space-y-4">
            <ReportFilters dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} warehouseId={warehouseId} setWarehouseId={setWarehouseId} onExport={handleExport} isExporting={isExporting} />

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction #</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">From</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">To</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Part</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-neutral-400">No transfers found</td></tr>}
                                {items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">{item.transactionNumber || '--'}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{item.fromWarehouseCode || item.fromWarehouse?.code || '--'}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{item.toWarehouseCode || item.toWarehouse?.code || '--'}</td>
                                        <td className="px-4 py-3 text-xs text-neutral-700">{item.partNumber || '--'}</td>
                                        <td className="px-4 py-3 text-right font-medium">{item.quantity != null ? Number(item.quantity).toLocaleString() : '--'}</td>
                                        <td className="px-4 py-3"><TransactionStatusBadge status={item.status || 'POSTED'} /></td>
                                        <td className="px-4 py-3 text-xs text-neutral-600">{item.createdAt ? fmt.dateTime(item.createdAt) : '--'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500">Page {meta.page} of {meta.totalPages}</p>
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
