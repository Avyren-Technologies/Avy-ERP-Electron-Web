import { useState, useEffect } from "react";
import {
    Receipt,
    Loader2,
    Plus,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaxConfig } from "@/features/company-admin/api/use-payroll-queries";
import { useUpdateTaxConfig } from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared atoms ── */

function NumRow({ label, value, onChange, suffix, min, max }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number }) {
    return (
        <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
            <div className="flex items-center gap-2">
                <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step="any" className="w-24 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 w-6">{suffix}</span>}
            </div>
        </div>
    );
}

/* ── Screen ── */

export function TaxConfigScreen() {
    const { data, isLoading, isError } = useTaxConfig();
    const updateMutation = useUpdateTaxConfig();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverConfig = (data as any)?.data ?? {};

    useEffect(() => {
        if ((data as any)?.data) {
            setConfig({ ...serverConfig });
            setHasChanges(false);
        }
    }, [data]);

    const update = (key: string, value: any) => { setConfig((p) => ({ ...p, [key]: value })); setHasChanges(true); };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(config);
            showSuccess("Tax Config Saved", "Tax & TDS settings have been updated.");
            setHasChanges(false);
        } catch (err) { showApiError(err); }
    };

    const handleReset = () => { setConfig({ ...serverConfig }); setHasChanges(false); };

    // Slab helpers
    const oldSlabs: { from: number; to: number; rate: number }[] = config.oldRegimeSlabs ?? [
        { from: 0, to: 250000, rate: 0 },
        { from: 250001, to: 500000, rate: 5 },
        { from: 500001, to: 1000000, rate: 20 },
        { from: 1000001, to: 0, rate: 30 },
    ];
    const newSlabs: { from: number; to: number; rate: number }[] = config.newRegimeSlabs ?? [
        { from: 0, to: 300000, rate: 0 },
        { from: 300001, to: 700000, rate: 5 },
        { from: 700001, to: 1000000, rate: 10 },
        { from: 1000001, to: 1200000, rate: 15 },
        { from: 1200001, to: 1500000, rate: 20 },
        { from: 1500001, to: 0, rate: 30 },
    ];
    const surchargeSlabs: { threshold: number; rate: number }[] = config.surchargeSlabs ?? [
        { threshold: 5000000, rate: 10 },
        { threshold: 10000000, rate: 15 },
        { threshold: 20000000, rate: 25 },
        { threshold: 50000000, rate: 37 },
    ];

    const updateOldSlab = (i: number, key: string, value: number) => {
        const s = [...oldSlabs]; s[i] = { ...s[i], [key]: value };
        update("oldRegimeSlabs", s);
    };
    const addOldSlab = () => update("oldRegimeSlabs", [...oldSlabs, { from: 0, to: 0, rate: 0 }]);
    const removeOldSlab = (i: number) => update("oldRegimeSlabs", oldSlabs.filter((_, idx) => idx !== i));

    const updateNewSlab = (i: number, key: string, value: number) => {
        const s = [...newSlabs]; s[i] = { ...s[i], [key]: value };
        update("newRegimeSlabs", s);
    };
    const addNewSlab = () => update("newRegimeSlabs", [...newSlabs, { from: 0, to: 0, rate: 0 }]);
    const removeNewSlab = (i: number) => update("newRegimeSlabs", newSlabs.filter((_, idx) => idx !== i));

    const updateSurcharge = (i: number, key: string, value: number) => {
        const s = [...surchargeSlabs]; s[i] = { ...s[i], [key]: value };
        update("surchargeSlabs", s);
    };
    const addSurcharge = () => update("surchargeSlabs", [...surchargeSlabs, { threshold: 0, rate: 0 }]);
    const removeSurcharge = (i: number) => update("surchargeSlabs", surchargeSlabs.filter((_, idx) => idx !== i));

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Tax & TDS Configuration</h1></div>
                <div className="grid grid-cols-1 gap-6"><SkeletonCard /><SkeletonCard /></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load tax configuration</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Tax & TDS Configuration</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure income tax regimes, slabs, surcharge, and cess</p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Reset</button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50">
                            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Receipt size={16} className="text-primary-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">General Settings</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Default Tax Regime</p>
                            <div className="flex items-center gap-3">
                                {["old", "new"].map((regime) => (
                                    <button
                                        key={regime}
                                        onClick={() => update("defaultRegime", regime)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                            config.defaultRegime === regime
                                                ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                                : "bg-white text-neutral-500 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                        )}
                                    >
                                        {regime === "old" ? "Old Regime" : "New Regime"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Declaration Deadline</p>
                            <input type="date" value={config.declarationDeadline ?? ""} onChange={(e) => update("declarationDeadline", e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white transition-all" />
                        </div>
                        <NumRow label="Health & Education Cess" value={config.cessRate ?? 4} onChange={(v) => update("cessRate", v)} suffix="%" min={0} max={100} />
                    </div>
                </div>
            </div>

            {/* Old Regime Slabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Old Regime — Tax Slabs</h3>
                        <button onClick={addOldSlab} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"><Plus size={14} /> Add Slab</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-4 font-bold">From (₹)</th>
                                    <th className="py-3 px-4 font-bold">To (₹)</th>
                                    <th className="py-3 px-4 font-bold">Rate (%)</th>
                                    <th className="py-3 px-4 font-bold text-right">Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {oldSlabs.map((slab, i) => (
                                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                        <td className="py-2 px-4"><input type="number" value={slab.from} onChange={(e) => updateOldSlab(i, "from", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4"><input type="number" value={slab.to} onChange={(e) => updateOldSlab(i, "to", Number(e.target.value))} placeholder="0 = unlimited" className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white placeholder:text-neutral-400" /></td>
                                        <td className="py-2 px-4"><input type="number" value={slab.rate} onChange={(e) => updateOldSlab(i, "rate", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4 text-right"><button onClick={() => removeOldSlab(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* New Regime Slabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">New Regime — Tax Slabs</h3>
                        <button onClick={addNewSlab} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"><Plus size={14} /> Add Slab</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-4 font-bold">From (₹)</th>
                                    <th className="py-3 px-4 font-bold">To (₹)</th>
                                    <th className="py-3 px-4 font-bold">Rate (%)</th>
                                    <th className="py-3 px-4 font-bold text-right">Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newSlabs.map((slab, i) => (
                                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                        <td className="py-2 px-4"><input type="number" value={slab.from} onChange={(e) => updateNewSlab(i, "from", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4"><input type="number" value={slab.to} onChange={(e) => updateNewSlab(i, "to", Number(e.target.value))} placeholder="0 = unlimited" className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white placeholder:text-neutral-400" /></td>
                                        <td className="py-2 px-4"><input type="number" value={slab.rate} onChange={(e) => updateNewSlab(i, "rate", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4 text-right"><button onClick={() => removeNewSlab(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Surcharge Slabs */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Surcharge Slabs</h3>
                        <button onClick={addSurcharge} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"><Plus size={14} /> Add Slab</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-4 font-bold">Income Threshold (₹)</th>
                                    <th className="py-3 px-4 font-bold">Rate (%)</th>
                                    <th className="py-3 px-4 font-bold text-right">Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surchargeSlabs.map((slab, i) => (
                                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                        <td className="py-2 px-4"><input type="number" value={slab.threshold} onChange={(e) => updateSurcharge(i, "threshold", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4"><input type="number" value={slab.rate} onChange={(e) => updateSurcharge(i, "rate", Number(e.target.value))} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" /></td>
                                        <td className="py-2 px-4 text-right"><button onClick={() => removeSurcharge(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shadow-2xl shadow-neutral-900/10">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Discard</button>
                            <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
