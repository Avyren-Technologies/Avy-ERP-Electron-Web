import { useState, useEffect } from "react";
import {
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    Timer,
    AlertTriangle,
    Smartphone,
    TrendingDown,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceRules } from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateAttendanceRules } from "@/features/company-admin/api/use-attendance-mutations";
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
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    min?: number;
    max?: number;
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
                    className="w-20 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">{suffix}</span>}
            </div>
        </div>
    );
}

/* ── Time Field ── */

function TimeField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            />
        </div>
    );
}

/* ── Sections Config ── */

interface RuleSection {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    fields: Array<{
        key: string;
        label: string;
        description?: string;
        type: "toggle" | "number" | "time";
        suffix?: string;
        min?: number;
        max?: number;
    }>;
}

const SECTIONS: RuleSection[] = [
    {
        title: "Time Rules",
        icon: Clock,
        fields: [
            { key: "shiftStartTime", label: "Default Shift Start", type: "time" },
            { key: "shiftEndTime", label: "Default Shift End", type: "time" },
            { key: "graceMinutes", label: "Grace Period", type: "number", suffix: "min", min: 0, max: 60 },
            { key: "halfDayHours", label: "Half Day Threshold", type: "number", suffix: "hrs", min: 1, max: 12 },
            { key: "fullDayHours", label: "Full Day Threshold", type: "number", suffix: "hrs", min: 1, max: 24 },
            { key: "autoClockOut", label: "Auto Clock-Out", description: "Automatically clock out after shift end + buffer", type: "toggle" },
        ],
    },
    {
        title: "Thresholds",
        icon: Timer,
        fields: [
            { key: "lateThresholdMinutes", label: "Late After", type: "number", suffix: "min", min: 0, max: 120 },
            { key: "earlyLeaveMinutes", label: "Early Leave Before", type: "number", suffix: "min", min: 0, max: 120 },
            { key: "minWorkHours", label: "Minimum Work Hours", type: "number", suffix: "hrs", min: 0, max: 24 },
            { key: "markAbsentAfterMinutes", label: "Mark Absent After", type: "number", suffix: "min", min: 0, max: 480 },
        ],
    },
    {
        title: "Deduction Rules",
        icon: TrendingDown,
        fields: [
            { key: "deductForLate", label: "Deduct for Late Arrival", description: "Apply salary deduction for late arrivals", type: "toggle" },
            { key: "deductForEarlyLeave", label: "Deduct for Early Leave", description: "Apply salary deduction for early departures", type: "toggle" },
            { key: "lateDeductionPerDay", label: "Late Deduction Amount", type: "number", suffix: "/day", min: 0 },
            { key: "maxLatePerMonth", label: "Max Late Per Month", type: "number", suffix: "days", min: 0, max: 31 },
        ],
    },
    {
        title: "Alerts & Notifications",
        icon: Bell,
        fields: [
            { key: "alertOnAbsence", label: "Absence Alert", description: "Notify manager when employee is absent", type: "toggle" },
            { key: "alertOnLate", label: "Late Arrival Alert", description: "Notify manager on late arrivals", type: "toggle" },
            { key: "dailySummaryEmail", label: "Daily Summary Email", description: "Send daily attendance summary to HR", type: "toggle" },
            { key: "weeklyReport", label: "Weekly Report", description: "Generate weekly attendance reports", type: "toggle" },
        ],
    },
    {
        title: "Mobile & Geo",
        icon: Smartphone,
        fields: [
            { key: "mobileCheckIn", label: "Mobile Check-In", description: "Allow check-in from mobile app", type: "toggle" },
            { key: "geoFencing", label: "Geo-Fencing", description: "Restrict check-in to office location", type: "toggle" },
            { key: "geoRadiusMeters", label: "Geo-Fence Radius", type: "number", suffix: "m", min: 50, max: 5000 },
            { key: "selfieVerification", label: "Selfie Verification", description: "Require selfie for mobile check-in", type: "toggle" },
        ],
    },
];

/* ── Screen ── */

export function AttendanceRulesScreen() {
    const { data, isLoading, isError } = useAttendanceRules();
    const updateMutation = useUpdateAttendanceRules();

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
            showSuccess("Rules Saved", "Attendance rules have been updated.");
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
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Rules</h1></div>
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
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load attendance rules</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Rules</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure time, threshold, deduction and alert settings</p>
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
                                            />
                                        );
                                    }
                                    if (field.type === "time") {
                                        return (
                                            <TimeField
                                                key={field.key}
                                                label={field.label}
                                                value={rules[field.key] ?? "09:00"}
                                                onChange={(v) => updateRule(field.key, v)}
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
