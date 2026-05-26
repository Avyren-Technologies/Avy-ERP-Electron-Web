import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useCreatePMSchedule, useUpdatePMSchedule } from "@/features/maintenance/api/use-maintenance-mutations";
import { useJobPlans, usePMSchedule } from "@/features/maintenance/api/use-maintenance-queries";
import { AssetPicker } from "@/features/maintenance/shared/AssetPicker";
import {
    PM_STRATEGY_OPTIONS,
    PM_FREQUENCY_OPTIONS,
    PM_SCHEDULE_TYPE_OPTIONS,
    PM_METER_TYPE_OPTIONS,
    PM_AUTO_ASSIGN_RULE_OPTIONS,
    PM_MONTH_OPTIONS,
    defaultPMScheduleFormState,
    buildCreatePMSchedulePayload,
    buildUpdatePMSchedulePayload,
    pmScheduleToFormState,
    validatePMScheduleForm,
    type PMScheduleFormState,
    type PMFormStrategyKey,
} from "@/features/maintenance/pm-schedule/pm-schedule-form";
import { showSuccess, showApiError } from "@/lib/toast";

const inputClass =
    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all";

const selectClass = inputClass;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            {children}
            {required ? <span className="text-red-500"> *</span> : null}
        </label>
    );
}

function SectionCard({ title, children, tone }: { title: string; children: React.ReactNode; tone?: "blue" | "accent" | "emerald" | "danger" }) {
    const tones = {
        blue: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-800/30",
        accent: "bg-accent-50/50 dark:bg-accent-950/10 border-accent-100 dark:border-accent-800/30",
        emerald: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/30",
        danger: "bg-danger-50/50 dark:bg-danger-950/10 border-danger-100 dark:border-danger-800/30",
    };
    return (
        <div className={`p-4 rounded-xl border space-y-4 ${tone ? tones[tone] : ""}`}>
            <h3 className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">{title}</h3>
            {children}
        </div>
    );
}

export function PMScheduleCreateScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("editId") ?? "";
    const isEdit = Boolean(editId);

    const [form, setForm] = useState<PMScheduleFormState>(defaultPMScheduleFormState);
    const [formError, setFormError] = useState<string | null>(null);
    const [formHydrated, setFormHydrated] = useState(false);

    const createMutation = useCreatePMSchedule();
    const updateMutation = useUpdatePMSchedule();
    const { data: pmData, isLoading: pmLoading, isError: pmError } = usePMSchedule(editId);
    const { data: jobPlansData } = useJobPlans({ limit: 100 });
    const jobPlans: { id: string; name?: string }[] = jobPlansData?.data ?? [];

    useEffect(() => {
        if (!isEdit) {
            setFormHydrated(true);
            return;
        }
        const pm = pmData?.data;
        if (pm) {
            setForm(pmScheduleToFormState(pm as Record<string, unknown>));
            setFormHydrated(true);
        }
    }, [isEdit, pmData]);

    const setField = <K extends keyof PMScheduleFormState>(key: K, value: PMScheduleFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setFormError(null);
    };

    const strategy = form.strategyKey;

    const handleSubmit = async () => {
        const validationError = validatePMScheduleForm(form);
        if (validationError) {
            setFormError(validationError);
            return;
        }
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({
                    id: editId,
                    data: buildUpdatePMSchedulePayload(form),
                });
                showSuccess("PM Schedule Updated", "Preventive maintenance schedule saved.");
                navigate(`/app/maintenance/pm-schedules/${editId}`);
            } else {
                await createMutation.mutateAsync(buildCreatePMSchedulePayload(form));
                showSuccess("PM Schedule Created", "Preventive maintenance schedule created.");
                navigate("/app/maintenance/pm-schedules");
            }
        } catch (err) {
            showApiError(err);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (isEdit && (pmLoading || !formHydrated)) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (isEdit && pmError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-neutral-500 dark:text-neutral-400">PM schedule not found.</p>
                <button
                    type="button"
                    onClick={() => navigate("/app/maintenance/pm-schedules")}
                    className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline"
                >
                    Back to PM Schedules
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto pb-8">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/app/maintenance/pm-schedules")}
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">
                        {isEdit ? "Edit PM Schedule" : "New PM Schedule"}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
                        {isEdit ? "Update schedule settings" : "Create a preventive maintenance schedule"}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-6">
                <AssetPicker
                    label="Asset"
                    value={form.assetId}
                    onChange={(v) => setField("assetId", v)}
                    required
                    disabled={isEdit}
                    placeholder="Select the asset..."
                />
                {isEdit ? (
                    <p className="text-xs text-neutral-400 mt-1">Asset cannot be changed after creation.</p>
                ) : null}

                <div>
                    <FieldLabel required>Schedule Name</FieldLabel>
                    <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Monthly Lubrication Check" className={inputClass} />
                </div>

                <div>
                    <FieldLabel required>Strategy Type</FieldLabel>
                    <select
                        value={form.strategyKey}
                        onChange={(e) => setField("strategyKey", e.target.value as PMFormStrategyKey)}
                        className={selectClass}
                    >
                        {PM_STRATEGY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {strategy === "PREVENTIVE_CALENDAR" && (
                    <SectionCard title="Calendar settings" tone="blue">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel required>Frequency</FieldLabel>
                                <select value={form.frequency} onChange={(e) => setField("frequency", e.target.value)} className={selectClass}>
                                    {PM_FREQUENCY_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            {form.frequency === "CUSTOM_DAYS" && (
                                <div>
                                    <FieldLabel required>Custom interval (days)</FieldLabel>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.customIntervalDays}
                                        onChange={(e) => setField("customIntervalDays", e.target.value)}
                                        placeholder="e.g. 30"
                                        className={inputClass}
                                    />
                                </div>
                            )}
                            <div className={form.frequency === "CUSTOM_DAYS" ? "sm:col-span-2" : ""}>
                                <FieldLabel>Schedule type</FieldLabel>
                                <select value={form.scheduleType} onChange={(e) => setField("scheduleType", e.target.value)} className={selectClass}>
                                    {PM_SCHEDULE_TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </SectionCard>
                )}

                {strategy === "PREVENTIVE_METER" && (
                    <SectionCard title="Meter settings" tone="accent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel required>Meter type</FieldLabel>
                                <select value={form.meterType} onChange={(e) => setField("meterType", e.target.value)} className={selectClass}>
                                    {PM_METER_TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <FieldLabel required>Meter interval</FieldLabel>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.meterInterval}
                                    onChange={(e) => setField("meterInterval", e.target.value)}
                                    placeholder="e.g. 500"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </SectionCard>
                )}

                {strategy === "SEASONAL" && (
                    <SectionCard title="Seasonal settings" tone="emerald">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel>Season start month</FieldLabel>
                                <select
                                    value={form.seasonStartMonth}
                                    onChange={(e) => setField("seasonStartMonth", Number(e.target.value))}
                                    className={selectClass}
                                >
                                    {PM_MONTH_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Season end month</FieldLabel>
                                <select
                                    value={form.seasonEndMonth}
                                    onChange={(e) => setField("seasonEndMonth", Number(e.target.value))}
                                    className={selectClass}
                                >
                                    {PM_MONTH_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </SectionCard>
                )}

                {strategy === "STATUTORY" && (
                    <SectionCard title="Statutory settings" tone="danger">
                        <div>
                            <FieldLabel required>Statutory due date</FieldLabel>
                            <input
                                type="date"
                                value={form.statutoryDueDate}
                                onChange={(e) => setField("statutoryDueDate", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </SectionCard>
                )}

                <div>
                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Common settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <FieldLabel>Lead days</FieldLabel>
                            <input type="number" min={0} value={form.leadDays} onChange={(e) => setField("leadDays", e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <FieldLabel>Grace period (days)</FieldLabel>
                            <input type="number" min={0} value={form.gracePeriodDays} onChange={(e) => setField("gracePeriodDays", e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <FieldLabel>Next due date</FieldLabel>
                            <input type="date" value={form.nextDueDate} onChange={(e) => setField("nextDueDate", e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div>
                    <FieldLabel>Job plan</FieldLabel>
                    <select value={form.jobPlanId} onChange={(e) => setField("jobPlanId", e.target.value)} className={selectClass}>
                        <option value="">No job plan</option>
                        {jobPlans.map((jp) => (
                            <option key={jp.id} value={jp.id}>{jp.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <FieldLabel>Auto-assign rule</FieldLabel>
                        <select value={form.autoAssignRule} onChange={(e) => setField("autoAssignRule", e.target.value)} className={selectClass}>
                            {PM_AUTO_ASSIGN_RULE_OPTIONS.map((o) => (
                                <option key={o.value || "none"} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    {form.autoAssignRule ? (
                        <div>
                            <FieldLabel>Assign to (user ID)</FieldLabel>
                            <input
                                type="text"
                                value={form.autoAssignTo}
                                onChange={(e) => setField("autoAssignTo", e.target.value)}
                                placeholder="Technician user ID"
                                className={inputClass}
                            />
                        </div>
                    ) : null}
                </div>

                {formError ? <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            isEdit
                                ? `/app/maintenance/pm-schedules/${editId}`
                                : "/app/maintenance/pm-schedules",
                        )
                    }
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSaving || !form.assetId || !form.name.trim()}
                    className="px-6 py-2.5 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md shadow-primary-500/20"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isEdit ? "Update PM Schedule" : "Create PM Schedule"}
                </button>
            </div>
        </div>
    );
}
