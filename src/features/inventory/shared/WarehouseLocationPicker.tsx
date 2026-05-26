import { useWarehouses, useZones, useBins } from '@/features/inventory/api/use-inventory-queries';

interface WarehouseLocationPickerProps {
    warehouseId: string;
    zoneId: string;
    binId: string;
    onWarehouseChange: (id: string) => void;
    onZoneChange: (id: string) => void;
    onBinChange: (id: string) => void;
    required?: boolean;
    disabled?: boolean;
    showBin?: boolean;
}

export function WarehouseLocationPicker({
    warehouseId,
    zoneId,
    binId,
    onWarehouseChange,
    onZoneChange,
    onBinChange,
    required = false,
    disabled = false,
    showBin = true,
}: WarehouseLocationPickerProps) {
    const { data: warehousesData, isLoading: loadingWarehouses } = useWarehouses();
    const { data: zonesData, isLoading: loadingZones } = useZones(
        warehouseId ? { warehouseId } : undefined,
    );
    const { data: binsData, isLoading: loadingBins } = useBins(
        zoneId ? { zoneId } : undefined,
    );

    const warehouses = warehousesData?.data || [];
    const zones = zonesData?.data || [];
    const bins = binsData?.data || [];

    const handleWarehouseChange = (val: string) => {
        onWarehouseChange(val);
        onZoneChange('');
        onBinChange('');
    };

    const handleZoneChange = (val: string) => {
        onZoneChange(val);
        onBinChange('');
    };

    const selectClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none disabled:opacity-50';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Warehouse */}
            <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Warehouse {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    className={selectClass}
                    value={warehouseId}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    disabled={disabled || loadingWarehouses}
                >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                    ))}
                </select>
            </div>

            {/* Zone */}
            <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Zone
                </label>
                <select
                    className={selectClass}
                    value={zoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    disabled={disabled || !warehouseId || loadingZones}
                >
                    <option value="">Select zone</option>
                    {zones.map((z: any) => (
                        <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                    ))}
                </select>
            </div>

            {/* Bin */}
            {showBin && (
                <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Bin
                    </label>
                    <select
                        className={selectClass}
                        value={binId}
                        onChange={(e) => onBinChange(e.target.value)}
                        disabled={disabled || !zoneId || loadingBins}
                    >
                        <option value="">Select bin</option>
                        {bins.map((b: any) => (
                            <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
