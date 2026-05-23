import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Send,
} from "lucide-react";
import { useCreateWorkRequest } from "@/features/maintenance/api/use-maintenance-mutations";
import { maintenanceApi } from "@/features/maintenance/api/maintenance-api";
import { AssetPicker } from "@/features/maintenance/shared/AssetPicker";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const REQUEST_TYPE_OPTIONS = [
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "PLANNED_SERVICE", label: "Planned Service" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "REPLACEMENT", label: "Replacement" },
    { value: "SAFETY", label: "Safety" },
    { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS = [
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

/* ── Screen ── */

export function WorkRequestCreateScreen() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        assetId: "",
        requestType: "BREAKDOWN",
        priority: "MEDIUM",
        description: "",
        locationDetail: "",
        requestedByDate: "",
        safetyRisk: false,
    });

    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);

    const createMutation = useCreateWorkRequest();

    // Duplicate check when asset changes
    useEffect(() => {
        if (!form.assetId) {
            setDuplicateWarning(null);
            return;
        }

        let cancelled = false;
        const check = async () => {
            setCheckingDuplicate(true);
            try {
                const res = await maintenanceApi.checkDuplicateWR({ assetId: form.assetId });
                if (!cancelled) {
                    const duplicates = res?.data ?? [];
                    if (duplicates.length > 0) {
                        setDuplicateWarning(
                            `${duplicates.length} open work request(s) already exist for this asset. Consider reviewing them before creating a new one.`
                        );
                    } else {
                        setDuplicateWarning(null);
                    }
                }
            } catch {
                // Silently ignore duplicate check errors
                if (!cancelled) setDuplicateWarning(null);
            } finally {
                if (!cancelled) setCheckingDuplicate(false);
            }
        };
        check();
        return () => { cancelled = true; };
    }, [form.assetId]);

    const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (!form.assetId || !form.description.trim()) return;

        const payload: Record<string, any> = {
            assetId: form.assetId,
            requestType: form.requestType,
            priority: form.priority,
            description: form.description.trim(),
            safetyRisk: form.safetyRisk,
        };
        if (form.locationDetail.trim()) payload.locationDetail = form.locationDetail.trim();
        if (form.requestedByDate) payload.requestedByDate = form.requestedByDate;

        try {
            await createMutation.mutateAsync(payload);
            showSuccess("Work Request Created", "Your work request has been submitted successfully.");
            navigate("/app/maintenance/work-requests");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/work-requests")}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">New Work Request</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">Report a maintenance issue or request</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-6">
                {/* Asset Picker */}
                <div>
                    <AssetPicker
                        label="Asset"
                        value={form.assetId}
                        onChange={(v) => setField("assetId", v)}
                        required
                        placeholder="Search and select an asset..."
                    />
                    {checkingDuplicate && (
                        <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" />
                            Checking for duplicates...
                        </p>
                    )}
                </div>

                {/* Duplicate Warning */}
                {duplicateWarning && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Potential Duplicate</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{duplicateWarning}</p>
                        </div>
                    </div>
                )}

                {/* Type & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                            Request Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.requestType}
                            onChange={(e) => setField("requestType", e.target.value)}
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        >
                            {REQUEST_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.priority}
                            onChange={(e) => setField("priority", e.target.value)}
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        >
                            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Describe the issue or maintenance needed..."
                        rows={5}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                    />
                </div>

                {/* Location Detail */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Location Detail
                    </label>
                    <input
                        type="text"
                        value={form.locationDetail}
                        onChange={(e) => setField("locationDetail", e.target.value)}
                        placeholder="e.g. Near motor coupling, Section B"
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>

                {/* Requested By Date */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Requested By Date
                    </label>
                    <input
                        type="date"
                        value={form.requestedByDate}
                        onChange={(e) => setField("requestedByDate", e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    />
                </div>

                {/* Photos placeholder */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Photos
                    </label>
                    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center">
                        <p className="text-sm text-neutral-400">Photo upload coming soon</p>
                        <p className="text-[10px] text-neutral-400 mt-1">You can attach photos after creation via the detail page.</p>
                    </div>
                </div>

                {/* Safety Risk */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <input
                        type="checkbox"
                        checked={form.safetyRisk}
                        onChange={(e) => setField("safetyRisk", e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-danger-600 focus:ring-danger-500"
                    />
                    <div>
                        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Safety Risk</label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Check if this issue poses a safety risk to personnel</p>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/work-requests")}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !form.assetId || !form.description.trim()}
                    className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary-500/20"
                >
                    {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Work Request
                </button>
            </div>
        </div>
    );
}
