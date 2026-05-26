import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useWarehouses } from '@/features/inventory/api/use-inventory-queries';
import { useCreateCount } from '@/features/inventory/api/use-inventory-mutations';

const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

const COUNT_TYPES = [
    { value: 'CYCLE', label: 'Cycle Count', description: 'Count a subset of items on a rotating schedule' },
    { value: 'FULL', label: 'Full Count', description: 'Complete physical inventory of all items in the warehouse' },
    { value: 'SPOT', label: 'Spot Check', description: 'Quick check of specific items or locations' },
];

export function CountCreateScreen() {
    const navigate = useNavigate();
    const createMutation = useCreateCount();
    const { data: whData } = useWarehouses();
    const warehouses = whData?.data || [];

    const [countType, setCountType] = useState('CYCLE');
    const [warehouseId, setWarehouseId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [remarks, setRemarks] = useState('');

    const canSubmit = countType && warehouseId;

    const handleSubmit = () => {
        createMutation.mutate(
            {
                type: countType,
                warehouseId,
                scheduledDate: scheduledDate || undefined,
                remarks: remarks || undefined,
            },
            {
                onSuccess: () => navigate('/app/inventory/counts'),
            },
        );
    };

    return (
        <div className="flex-1 p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/app/inventory/counts')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <ArrowLeft className="w-5 h-5 text-neutral-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Stock Count</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Create a new physical inventory count</p>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-5">
                {/* Count Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Count Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                        {COUNT_TYPES.map(ct => (
                            <button
                                key={ct.value}
                                onClick={() => setCountType(ct.value)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    countType === ct.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                                }`}
                            >
                                <p className={`text-sm font-semibold ${countType === ct.value ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-900 dark:text-white'}`}>
                                    {ct.label}
                                </p>
                                <p className="text-[10px] text-neutral-500 mt-1">{ct.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Warehouse */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Warehouse *</label>
                    <select className={inputClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                        <option value="">Select warehouse</option>
                        {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                    </select>
                </div>

                {/* Scheduled Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Scheduled Date</label>
                    <input type="date" className={inputClass} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                    <p className="text-[10px] text-neutral-400 mt-0.5">Optional. Leave blank to start immediately.</p>
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-1">Remarks</label>
                    <textarea className={inputClass} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes about this count" />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => navigate('/app/inventory/counts')} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || createMutation.isPending}
                        className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Count'}
                    </button>
                </div>
            </div>
        </div>
    );
}
