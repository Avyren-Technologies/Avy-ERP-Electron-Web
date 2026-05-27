import { useState, useMemo } from 'react';
import { Loader2, Search, Cog, Cpu } from 'lucide-react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useToolsAtMachineReport, useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { cn } from '@/lib/utils';

function LifeProgressBar({ remainingPct }: { remainingPct: number }) {
    const color = remainingPct > 50 ? 'bg-emerald-500' : remainingPct > 20 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden min-w-[50px]">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, remainingPct))}%` }} />
            </div>
            <span className={cn('text-[10px] font-bold', remainingPct > 50 ? 'text-emerald-600' : remainingPct > 20 ? 'text-amber-600' : 'text-red-600')}>
                {remainingPct.toFixed(0)}%
            </span>
        </div>
    );
}

export function ToolsAtMachineScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');

    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    const params = useMemo(() => {
        const p: Record<string, unknown> = {};
        if (search) p.search = search;
        if (warehouseFilter) p.warehouseId = warehouseFilter;
        return p;
    }, [search, warehouseFilter]);

    const { data, isLoading } = useToolsAtMachineReport(params);
    const rawItems = data?.data || [];

    // Group by machine
    const machineGroups = useMemo(() => {
        const groups: Record<string, { machine: any; tools: any[] }> = {};
        for (const item of rawItems) {
            const machineKey = item.machineId || item.machine?.id || 'unassigned';
            if (!groups[machineKey]) {
                groups[machineKey] = { machine: item.machine || { name: machineKey }, tools: [] };
            }
            groups[machineKey].tools.push(item);
        }
        return Object.values(groups);
    }, [rawItems]);

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tools at Machine</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">View tools currently assigned to each machine</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" placeholder="Search machine or tool..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
                    <option value="">All Warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : machineGroups.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-12 text-center">
                    <Cpu className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-400">No tools currently at any machine</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {machineGroups.map((group, gIdx) => (
                        <div key={gIdx} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                <div className="flex items-center gap-2">
                                    <Cog className="w-4 h-4 text-primary-500" />
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{group.machine?.name || 'Unknown Machine'}</h3>
                                    <span className="text-[10px] text-neutral-500 font-mono">{group.machine?.code || ''}</span>
                                    <span className="ml-auto text-xs text-neutral-500">{group.tools.length} tool(s)</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Tool Part</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Serial</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Spindle</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Remaining Life</th>
                                            <th className="text-left px-4 py-2 text-xs font-semibold text-neutral-500">Issued</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.tools.map((tool: any, tIdx: number) => {
                                            const pct = tool.remainingLifePct ?? (tool.expectedLife ? (Number(tool.remainingLife ?? 0) / Number(tool.expectedLife)) * 100 : 0);
                                            return (
                                                <tr key={tIdx} className="border-b border-neutral-50 dark:border-neutral-800/50">
                                                    <td className="px-4 py-2">
                                                        <p className="font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{tool.part?.partNumber || '--'}</p>
                                                        <p className="text-[10px] text-neutral-500">{tool.part?.name || ''}</p>
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs text-neutral-600">{tool.serialNumber || '--'}</td>
                                                    <td className="px-4 py-2 text-xs text-neutral-600">{tool.spindleStation || '--'}</td>
                                                    <td className="px-4 py-2 w-36"><LifeProgressBar remainingPct={pct} /></td>
                                                    <td className="px-4 py-2 text-xs text-neutral-600">{tool.issuedAt ? fmt.date(tool.issuedAt) : '--'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
