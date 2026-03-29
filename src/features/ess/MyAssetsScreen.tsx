import { useMyAssets } from '@/features/company-admin/api';
import { Loader2, Package } from 'lucide-react';

export function MyAssetsScreen() {
    const { data, isLoading } = useMyAssets();
    const assignments = data?.data ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Assets</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Company assets currently assigned to you</p>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-16">
                    <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Assets Assigned</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Assets will appear here when assigned to you.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {assignments.map((a: any) => (
                        <div key={a.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">{a.asset?.name ?? 'Asset'}</h3>
                                    <p className="text-xs text-neutral-500">{a.asset?.category?.name ?? ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                                {a.asset?.serialNumber && <span>S/N: {a.asset.serialNumber}</span>}
                                {a.asset?.condition && <span>Condition: {a.asset.condition}</span>}
                                {a.assignedDate && <span>Since: {new Date(a.assignedDate).toLocaleDateString()}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
