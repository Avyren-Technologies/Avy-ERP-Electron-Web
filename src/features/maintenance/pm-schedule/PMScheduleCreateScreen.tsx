import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Loader2,
    Send,
} from "lucide-react";
import { useCreatePMSchedule } from "@/features/maintenance/api/use-maintenance-mutations";
import { useJobPlans } from "@/features/maintenance/api/use-maintenance-queries";
import { AssetPicker } from "@/features/maintenance/shared/AssetPicker";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const STRATEGY_OPTIONS = [
    { value: "CALENDAR", label: "Calendar-Based" },
    { value: "METER", label: "Meter-Based" },
    { value: "SEASONAL", label: "Seasonal" },
    { value: "STATUTORY", label: "Statutory" },
    { value: "DUAL", label: "Dual (Calendar + Meter)" },
];

const FREQUENCY_UNIT_OPTIONS = [
    { value: "DAYS", label: "Days" },
    { value: "WEEKS", label: "Weeks" },
    { value: "MONTHS", label: "Months" },
    { value: "YEARS", label: "Years" },
];

const METER_TYPE_OPTIONS = [
    { value: "RUNTIME_HOURS", label: "Runtime Hours" },
    { value: "MILEAGE", label: "Mileage" },
    { value: "CYCLES", label: "Cycles" },
    { value: "PRODUCTION_COUNT", label: "Production Count" },
];

const FIXED_FLOATING_OPTIONS = [
    { value: "FIXED", label: "Fixed (from planned date)" },
    { value: "FLOATING", label: "Floating (from last completion)" },
];

const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

/* ── Screen ── */

export function PMScheduleCreateScreen() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        assetId: "",
        name: "",
        strategyType: "CALENDAR",
        // Calendar fields
        frequencyValue: "",
        frequencyUnit: "MONTHS",
        fixedOrFloating: "FIXED",
        // Meter fields
        meterType: "RUNTIME_HOURS",
        meterInterval: "",
        dualTrigger: false,
        // Seasonal fields
        seasonStartMonth: 1,
        seasonEndMonth: 3,
        // Statutory fields
        statutoryDueDate: "",
        // Common
        leadDays: "7",
        gracePeriod: "3",
        autoAssign: false,
        autoAssignTechnicianId: "",
        jobPlanId: "",
        nextDueDate: "",
    });

    const createMutation = useCreatePMSchedule();
    const { data: jobPlansData } = useJobPlans({ limit: 100 });
    const jobPlans: any[] = jobPlansData?.data ?? [];

    const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (!form.assetId || !form.name.trim()) return;

        const payload: Record<string, any> = {
            assetId: form.assetId,
            name: form.name.trim(),
            strategyType: form.strategyType,
            leadDays: Number(form.leadDays) || 0,
            gracePeriod: Number(form.gracePeriod) || 0,
            autoAssign: form.autoAssign,
        };

        if (form.jobPlanId) payload.jobPlanId = form.jobPlanId;
        if (form.autoAssignTechnicianId.trim()) payload.autoAssignTechnicianId = form.autoAssignTechnicianId.trim();
        if (form.nextDueDate) payload.nextDueDate = form.nextDueDate;

        // Strategy-specific fields
        if (form.strategyType === "CALENDAR" || form.strategyType === "DUAL") {
            payload.frequencyValue = Number(form.frequencyValue);
            payload.frequencyUnit = form.frequencyUnit;
            payload.fixedOrFloating = form.fixedOrFloating;
        }
        if (form.strategyType === "METER" || form.strategyType === "DUAL") {
            payload.meterType = form.meterType;
            payload.meterInterval = Number(form.meterInterval);
            if (form.strategyType === "DUAL") payload.dualTrigger = form.dualTrigger;
        }
        if (form.strategyType === "SEASONAL") {
            payload.seasonStartMonth = form.seasonStartMonth;
            payload.seasonEndMonth = form.seasonEndMonth;
        }
        if (form.strategyType === "STATUTORY") {
            if (form.statutoryDueDate) payload.statutoryDueDate = form.statutoryDueDate;
        }

        try {
            await createMutation.mutateAsync(payload);
            showSuccess("PM Schedule Created", "Preventive maintenance schedule created.");
            navigate("/app/maintenance/pm-schedules");
        } catch (err) {
            showApiError(err);
        }
    };

    const strategy = form.strategyType;
    const showCalendarFields = strategy === "CALENDAR" || strategy === "DUAL";
    const showMeterFields = strategy === "METER" || strategy === "DUAL";
    const showSeasonalFields = strategy === "SEASONAL";
    const showStatutoryFields = strategy === "STATUTORY";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/pm-schedules")}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">New PM Schedule</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">Create a preventive maintenance schedule</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-6">
                {/* Basic Info */}
                <div>
                    <AssetPicker
                        label="Asset"
                        value={form.assetId}
                        onChange={(v) => setField("assetId", v)}
                        required
                        placeholder="Select the asset..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Schedule Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="e.g. Monthly Lubrication Check"
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>

                {/* Strategy Type */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Strategy Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.strategyType}
                        onChange={(e) => setField("strategyType", e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {STRATEGY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                {/* Calendar Fields */}
                {showCalendarFields && (
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-800/30 space-y-4">
                        <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Calendar Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Frequency Value <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={form.frequencyValue}
                                    onChange={(e) => setField("frequencyValue", e.target.value)}
                                    placeholder="e.g. 3"
                                    min="1"
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Frequency Unit</label>
                                <select
                                    value={form.frequencyUnit}
                                    onChange={(e) => setField("frequencyUnit", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {FREQUENCY_UNIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Fixed / Floating</label>
                                <select
                                    value={form.fixedOrFloating}
                                    onChange={(e) => setField("fixedOrFloating", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {FIXED_FLOATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meter Fields */}
                {showMeterFields && (
                    <div className="p-4 rounded-xl bg-accent-50/50 dark:bg-accent-950/10 border border-accent-100 dark:border-accent-800/30 space-y-4">
                        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-400 uppercase tracking-wider">Meter Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Meter Type <span className="text-red-500">*</span></label>
                                <select
                                    value={form.meterType}
                                    onChange={(e) => setField("meterType", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {METER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Meter Interval <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={form.meterInterval}
                                    onChange={(e) => setField("meterInterval", e.target.value)}
                                    placeholder="e.g. 500"
                                    min="1"
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                        </div>
                        {strategy === "DUAL" && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                <input
                                    type="checkbox"
                                    checked={form.dualTrigger}
                                    onChange={(e) => setField("dualTrigger", e.target.checked)}
                                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-accent-600 focus:ring-accent-500"
                                />
                                <div>
                                    <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Dual Trigger</label>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Trigger when either calendar OR meter threshold is reached (whichever comes first)</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Seasonal Fields */}
                {showSeasonalFields && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/30 space-y-4">
                        <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Seasonal Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Season Start Month</label>
                                <select
                                    value={form.seasonStartMonth}
                                    onChange={(e) => setField("seasonStartMonth", Number(e.target.value))}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Season End Month</label>
                                <select
                                    value={form.seasonEndMonth}
                                    onChange={(e) => setField("seasonEndMonth", Number(e.target.value))}
                                    className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statutory Fields */}
                {showStatutoryFields && (
                    <div className="p-4 rounded-xl bg-danger-50/50 dark:bg-danger-950/10 border border-danger-100 dark:border-danger-800/30 space-y-4">
                        <h3 className="text-xs font-bold text-danger-700 dark:text-danger-400 uppercase tracking-wider">Statutory Settings</h3>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Statutory Due Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.statutoryDueDate}
                                onChange={(e) => setField("statutoryDueDate", e.target.value)}
                                className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">Cannot be changed once set.</p>
                        </div>
                    </div>
                )}

                {/* Common Fields */}
                <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Common Settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Lead Days</label>
                            <input
                                type="number"
                                value={form.leadDays}
                                onChange={(e) => setField("leadDays", e.target.value)}
                                placeholder="7"
                                min="0"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Grace Period (days)</label>
                            <input
                                type="number"
                                value={form.gracePeriod}
                                onChange={(e) => setField("gracePeriod", e.target.value)}
                                placeholder="3"
                                min="0"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Next Due Date</label>
                            <input
                                type="date"
                                value={form.nextDueDate}
                                onChange={(e) => setField("nextDueDate", e.target.value)}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Job Plan */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Job Plan</label>
                    <select
                        value={form.jobPlanId}
                        onChange={(e) => setField("jobPlanId", e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        <option value="">No job plan</option>
                        {jobPlans.map((jp: any) => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                    </select>
                </div>

                {/* Auto-Assign */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <input
                        type="checkbox"
                        checked={form.autoAssign}
                        onChange={(e) => setField("autoAssign", e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                        <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Auto-Assign Technician</label>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Automatically assign a technician when WO is generated</p>
                    </div>
                </div>

                {form.autoAssign && (
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Auto-Assign Technician ID</label>
                        <input
                            type="text"
                            value={form.autoAssignTechnicianId}
                            onChange={(e) => setField("autoAssignTechnicianId", e.target.value)}
                            placeholder="Enter technician user ID..."
                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => navigate("/app/maintenance/pm-schedules")}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !form.assetId || !form.name.trim()}
                    className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary-500/20"
                >
                    {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Create PM Schedule
                </button>
            </div>
        </div>
    );
}
