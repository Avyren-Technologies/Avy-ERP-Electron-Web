import { useState } from 'react';
import { Loader2, Package, MapPin, CheckCircle2 } from 'lucide-react';
import { usePendingPutaway } from '@/features/inventory/api/use-inventory-queries';
import { useConfirmPutaway } from '@/features/inventory/api/use-inventory-mutations';
import { WarehouseLocationPicker } from '@/features/inventory/shared/WarehouseLocationPicker';

export function PutAwayScreen() {
    const { data, isLoading } = usePendingPutaway();
    const items = data?.data || [];

    return (
        <div className="flex-1 p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Putaway</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Assign bin locations to received stock ({items.length} pending)
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">All items have been put away</p>
                    <p className="text-xs text-neutral-400 mt-1">New items will appear here after GRN processing</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item: any) => (
                        <PutawayCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PutawayCard({ item }: { item: any }) {
    const confirmMutation = useConfirmPutaway();
    const [warehouseId, setWarehouseId] = useState(item.warehouseId || '');
    const [zoneId, setZoneId] = useState(item.suggestedZoneId || '');
    const [binId, setBinId] = useState(item.suggestedBinId || '');

    const handleConfirm = () => {
        confirmMutation.mutate({
            stockBalanceId: item.id,
            warehouseId,
            zoneId: zoneId || undefined,
            binId: binId || undefined,
        });
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-5 space-y-4">
            {/* Part info */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                        {item.partNumber || item.part?.partNumber || '--'}
                    </p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">
                        {item.partName || item.part?.name || 'Unknown Part'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {Number(item.qty ?? item.quantity ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-neutral-400">{item.uom || item.part?.uom || 'pcs'}</p>
                </div>
            </div>

            {/* Lot info */}
            {(item.lotNumber || item.serialNumber) && (
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <Package className="w-3.5 h-3.5" />
                    <span>Lot: {item.lotNumber || '--'}</span>
                    {item.serialNumber && <span>Serial: {item.serialNumber}</span>}
                </div>
            )}

            {/* Suggested bin */}
            {item.suggestedBinCode && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    Suggested: {item.suggestedBinCode}
                </div>
            )}

            {/* Location Picker */}
            <WarehouseLocationPicker
                warehouseId={warehouseId}
                zoneId={zoneId}
                binId={binId}
                onWarehouseChange={setWarehouseId}
                onZoneChange={setZoneId}
                onBinChange={setBinId}
                required
            />

            {/* Confirm */}
            <button
                onClick={handleConfirm}
                disabled={!warehouseId || confirmMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
                {confirmMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Putaway
                    </>
                )}
            </button>
        </div>
    );
}
