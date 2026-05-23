import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Send,
} from "lucide-react";
import { useCreateWorkOrder } from "@/features/maintenance/api/use-maintenance-mutations";
import { useJobPlans } from "@/features/maintenance/api/use-maintenance-queries";
import { AssetPicker } from "@/features/maintenance/shared/AssetPicker";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const WO_TYPE_OPTIONS = [
    { value: "CORRECTIVE", label: "Corrective" },
    { value: "PREVENTIVE", label: "Preventive" },
    { value: "PREDICTIVE", label: "Predictive" },
    { value: "CONDITION_BASED", label: "Condition Based" },
    { value: "EMERGENCY", label: "Emergency" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "CALIBRATION", label: "Calibration" },
    { value: "OVERHAUL", label: "Overhaul" },
];

const PRIORITY_OPTIONS = [
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

/* ── Screen ── */

export function WorkOrderCreateScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const pmScheduleId = searchParams.get("pmScheduleId") || "";

    const [form, setForm] = useState({
        assetId: "",
        woType: "CORRECTIVE",
        priority: "MEDIUM",
        description: "",
        jobPlanId: "",
        plannedStart: "",
        plannedEnd: "",
        estimatedHours: "",
        leadTechnicianId: "",
        pmScheduleId,
    });

    const createMutation = useCreateWorkOrder();
    const { data: jobPlansData } = useJobPlans({ limit: 100 });
    const jobPlans: any[] = jobPlansData?.data ?? [];

    const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (!form.assetId) return;

        const payload: Record<string, any> = {
            assetId: form.assetId,
            woType: form.woType,
            priority: form.priority,
        };
        if (form.description.trim()) payload.description = form.description.trim();
        if (form.jobPlanId) payload.jobPlanId = form.jobPlanId;
        if (form.plannedStart) payload.plannedStart = form.plannedStart;
        if (form.plannedEnd) payload.plannedEnd = form.plannedEnd;
        if (form.estimatedHours) payload.estimatedHours = Number(form.estimatedHours);
        if (form.leadTechnicianId.trim()) payload.leadTechnicianId = form.leadTechnicianId.trim();
        if (form.pmScheduleId) payload.pmScheduleId = form.pmScheduleId;

        try {
            await createMutation.mutateAsync(payload);
            showSuccess("Work Order Created", "Work order has been created successfully.");
            navigate("/app/maintenance/work-orders");
        } catch (err) {
            showApiError(err);
        }
    };

    const selectedJobPlan = jobPlans.find((jp: any) => jp.id === form.jobPlanId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/work-orders")}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">New Work Order</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">Create a maintenance work order</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-6">
                {/* Asset Picker */}
                <AssetPicker
                    label="Asset"
                    value={form.assetId}
                    onChange={(v) => setField("assetId", v)}
                    required
                    placeholder="Search and select an asset..."
                />

                {/* Type & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                            Work Order Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.woType}
                            onChange={(e) => setField("woType", e.target.value)}
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                        >
                            {WO_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

                {/* Job Plan */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Job Plan
                    </label>
                    <select
                        value={form.jobPlanId}
                        onChange={(e) => setField("jobPlanId", e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        <option value="">No job plan</option>
                        {jobPlans.map((jp: any) => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                    </select>
                    {selectedJobPlan?.checklistTemplate && (
                        <div className="mt-2 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                            <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-1">Checklist Template</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400/80">{selectedJobPlan.checklistTemplate.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                                {selectedJobPlan.checklistTemplate.fields?.length || 0} items
                            </p>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Description
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Describe the work to be done..."
                        rows={4}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                    />
                </div>

                {/* Scheduling */}
                <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Scheduling</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Planned Start</label>
                            <input
                                type="datetime-local"
                                value={form.plannedStart}
                                onChange={(e) => setField("plannedStart", e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Planned End</label>
                            <input
                                type="datetime-local"
                                value={form.plannedEnd}
                                onChange={(e) => setField("plannedEnd", e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Estimated Hours</label>
                            <input
                                type="number"
                                value={form.estimatedHours}
                                onChange={(e) => setField("estimatedHours", e.target.value)}
                                placeholder="e.g. 4"
                                min="0"
                                step="0.5"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Assignment */}
                <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Assignment</h3>
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Lead Technician ID</label>
                        <input
                            type="text"
                            value={form.leadTechnicianId}
                            onChange={(e) => setField("leadTechnicianId", e.target.value)}
                            placeholder="Enter technician user ID..."
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                </div>

                {/* PM Link */}
                {form.pmScheduleId && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Linked to PM Schedule</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">{form.pmScheduleId}</p>
                    </div>
                )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/work-orders")}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !form.assetId}
                    className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary-500/20"
                >
                    {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Create Work Order
                </button>
            </div>
        </div>
    );
}
