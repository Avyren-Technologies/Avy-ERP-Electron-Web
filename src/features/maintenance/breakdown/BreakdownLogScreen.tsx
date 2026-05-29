import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useAssets } from "@/features/maintenance/api/use-maintenance-queries";
import { useLogBreakdown } from "@/features/maintenance/api/use-maintenance-mutations";
import { showSuccess, showApiError } from "@/lib/toast";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { breakdownLogHelp } from "@/features/maintenance/help";

const PRIORITY_OPTIONS = [
    { value: "EMERGENCY", label: "Emergency", color: "bg-danger-50 text-danger-700 border-danger-200" },
    { value: "HIGH", label: "High", color: "bg-warning-50 text-warning-700 border-warning-200" },
    { value: "MEDIUM", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "LOW", label: "Low", color: "bg-neutral-50 text-neutral-600 border-neutral-200" },
];

export function BreakdownLogScreen() {
    const navigate = useNavigate();

    const [assetId, setAssetId] = useState("");
    const [selectedAssetName, setSelectedAssetName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("EMERGENCY");
    const [safetyRisk, setSafetyRisk] = useState(false);
    const [assetSearch, setAssetSearch] = useState("");

    const { data: assetsData } = useAssets({ search: assetSearch || undefined, limit: 20 });
    const assets: any[] = assetsData?.data ?? [];

    const logMutation = useLogBreakdown();

    const handleSubmit = async () => {
        if (!assetId || !description.trim()) return;
        try {
            const result = await logMutation.mutateAsync({
                assetId,
                description,
                priority,
                safetyRisk,
            });
            showSuccess("Breakdown Logged", "Breakdown work order and downtime record created.");
            const woId = result?.data?.workOrderId ?? result?.data?.id;
            if (woId) {
                navigate(`/app/maintenance/work-orders/${woId}`);
            } else {
                navigate("/app/maintenance/breakdowns");
            }
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Log Breakdown</h1>
                        <HelpDrawer help={breakdownLogHelp} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Quick-log an equipment breakdown</p>
                </div>
            </div>

            {/* Emergency Banner */}
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-danger-700 dark:text-danger-400">This will instantly create a breakdown work order and start tracking downtime.</p>
                    <p className="text-xs text-danger-600/80 dark:text-danger-400/60 mt-1">The asset will be marked as down until the breakdown is resolved.</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 space-y-6">
                {/* Asset Picker */}
                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Asset <span className="text-danger-500">*</span></label>
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={assetId ? selectedAssetName : assetSearch}
                        onChange={(e) => {
                            setAssetSearch(e.target.value);
                            setAssetId("");
                            setSelectedAssetName("");
                        }}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                    {assetSearch && !assetId && assets.length > 0 && (
                        <div className="mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {assets.map((asset: any) => (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => {
                                        setAssetId(asset.id);
                                        setSelectedAssetName(`${asset.name} (${asset.assetNumber})`);
                                        setAssetSearch("");
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                                >
                                    <span className="font-bold text-primary-950 dark:text-white">{asset.name}</span>
                                    <span className="text-neutral-400 ml-2 text-xs">{asset.assetNumber}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Description <span className="text-danger-500">*</span></label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What happened? Describe the failure..."
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                    />
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Priority <InfoTooltip content={breakdownLogHelp.fields!.priority} /></label>
                    <div className="grid grid-cols-4 gap-2">
                        {PRIORITY_OPTIONS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPriority(p.value)}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                    priority === p.value
                                        ? `${p.color} ring-2 ring-primary-500/30`
                                        : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Safety Risk */}
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Safety Risk <InfoTooltip content={breakdownLogHelp.fields!.safetyRisk} /></span>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/60">Does this breakdown pose a safety risk?</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSafetyRisk(!safetyRisk)}
                        className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-danger-500/20 ${
                            safetyRisk ? "bg-danger-500" : "bg-neutral-300 dark:bg-neutral-600"
                        }`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            safetyRisk ? "translate-x-5" : "translate-x-0"
                        }`} />
                    </button>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!assetId || !description.trim() || logMutation.isPending}
                    className="w-full py-3 bg-danger-600 hover:bg-danger-700 text-white font-bold rounded-xl shadow-md shadow-danger-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {logMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <AlertTriangle size={18} />
                    )}
                    Log Breakdown Now
                </button>
            </div>
        </div>
    );
}
