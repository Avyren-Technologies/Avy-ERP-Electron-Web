import { useState, useEffect } from "react";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    UserCheck,
    DollarSign,
    Gauge,
    Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOvertimeRules } from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateOvertimeRules } from "@/features/company-admin/api/use-attendance-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Toggle ── */

interface ToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
    return (
        <div className={cn(
            "flex items-center justify-between px-5 py-4 rounded-xl border transition-colors",
            checked
                ? "bg-success-50 dark:bg-success-900/10 border-success-100 dark:border-success-800/50"
                : "bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-800"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {checked
                    ? <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />}
                <div>
                    <p className={cn("text-sm font-semibold", checked ? "text-success-800 dark:text-success-400" : "text-neutral-500 dark:text-neutral-400")}>{label}</p>
                    {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                    checked ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", checked ? "left-[22px]" : "left-[3px]")} />
            </button>
        </div>
    );
}

/* ── Number Field ── */

function NumberField({
    label,
    value,
    onChange,
    suffix,
    min,
    max,
    step,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    className="w-20 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">{suffix}</span>}
            </div>
        </div>
    );
}

/* ── Sections ── */

interface OTSection {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    fields: Array<{
        key: string;
        label: string;
        description?: string;
        type: "toggle" | "number";
        suffix?: string;
        min?: number;
        max?: number;
        step?: number;
    }>;
}

const SECTIONS: OTSection[] = [
    {
        title: "Eligibility",
        icon: UserCheck,
        fields: [
            { key: "otEnabled", label: "Overtime Enabled", description: "Allow overtime tracking for employees", type: "toggle" },
            { key: "requireApproval", label: "Require Approval", description: "Manager must approve overtime before payroll", type: "toggle" },
            { key: "minOvertimeMinutes", label: "Minimum OT Threshold", type: "number", suffix: "min", min: 0, max: 120 },
            { key: "autoDetect", label: "Auto-Detect Overtime", description: "Automatically detect OT from punch records", type: "toggle" },
            { key: "weekendOT", label: "Weekend Overtime", description: "Track overtime on weekends separately", type: "toggle" },
            { key: "holidayOT", label: "Holiday Overtime", description: "Track overtime on holidays separately", type: "toggle" },
        ],
    },
    {
        title: "Rate Multipliers",
        icon: DollarSign,
        fields: [
            { key: "weekdayRate", label: "Weekday Rate", type: "number", suffix: "x", min: 1, max: 5, step: 0.25 },
            { key: "weekendRate", label: "Weekend Rate", type: "number", suffix: "x", min: 1, max: 5, step: 0.25 },
            { key: "holidayRate", label: "Holiday Rate", type: "number", suffix: "x", min: 1, max: 5, step: 0.25 },
            { key: "nightShiftRate", label: "Night Shift Rate", type: "number", suffix: "x", min: 1, max: 5, step: 0.25 },
        ],
    },
    {
        title: "Caps & Limits",
        icon: Gauge,
        fields: [
            { key: "maxDailyHours", label: "Max Daily OT", type: "number", suffix: "hrs", min: 0, max: 12 },
            { key: "maxWeeklyHours", label: "Max Weekly OT", type: "number", suffix: "hrs", min: 0, max: 48 },
            { key: "maxMonthlyHours", label: "Max Monthly OT", type: "number", suffix: "hrs", min: 0, max: 200 },
            { key: "enforceCaps", label: "Enforce Caps", description: "Block overtime entries exceeding limits", type: "toggle" },
        ],
    },
    {
        title: "Payroll Integration",
        icon: Receipt,
        fields: [
            { key: "includeInPayroll", label: "Include in Payroll", description: "Automatically add approved OT to payroll", type: "toggle" },
            { key: "payrollCutoffDay", label: "Payroll Cutoff Day", type: "number", suffix: "day", min: 1, max: 31 },
            { key: "roundToNearest", label: "Round to Nearest", type: "number", suffix: "min", min: 1, max: 60 },
            { key: "compOffOption", label: "Comp-Off Option", description: "Allow employees to choose comp-off instead of pay", type: "toggle" },
        ],
    },
];

/* ── Screen ── */

export function OvertimeRulesScreen() {
    const { data, isLoading, isError } = useOvertimeRules();
    const updateMutation = useUpdateOvertimeRules();

    const [rules, setRules] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverRules = (data as any)?.data ?? {};

    useEffect(() => {
        if ((data as any)?.data) {
            setRules({ ...serverRules });
            setHasChanges(false);
        }
    }, [data]);

    const updateRule = (key: string, value: any) => {
        setRules((p) => ({ ...p, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(rules);
            showSuccess("Rules Saved", "Overtime rules have been updated.");
            setHasChanges(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReset = () => {
        setRules({ ...serverRules });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Overtime Rules</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load overtime rules</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Overtime Rules</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure eligibility, rates, caps and payroll integration</p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
                        >
                            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECTIONS.map((section) => (
                    <div key={section.title} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <section.icon size={16} className="text-primary-600" />
                                </div>
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</h3>
                            </div>
                            <div className="space-y-3">
                                {section.fields.map((field) => {
                                    if (field.type === "toggle") {
                                        return (
                                            <Toggle
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                checked={rules[field.key] ?? false}
                                                onChange={(v) => updateRule(field.key, v)}
                                            />
                                        );
                                    }
                                    if (field.type === "number") {
                                        return (
                                            <NumberField
                                                key={field.key}
                                                label={field.label}
                                                value={rules[field.key] ?? 0}
                                                onChange={(v) => updateRule(field.key, v)}
                                                suffix={field.suffix}
                                                min={field.min}
                                                max={field.max}
                                                step={field.step}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shadow-2xl shadow-neutral-900/10">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
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
