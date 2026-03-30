import { useState, useEffect } from "react";
import {
    Settings,
    Loader2,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    Factory,
    Wallet,
    CalendarOff,
    Shield,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyControls } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateControls } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import type { SystemControls } from "@/lib/api/company-admin";

/* ── Toggle ── */

function Toggle({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
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

function NumberField({ label, description, value, onChange, suffix, min, max }: {
    label: string; description?: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4">
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

/* ── Select Row ── */

function SelectRow({ label, description, value, onChange, options }: {
    label: string; description?: string; value: string | number; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={String(value)}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

/* ── Default values ── */

const DEFAULTS: SystemControls = {
    // Module Enablement
    attendanceEnabled: true,
    leaveEnabled: true,
    payrollEnabled: true,
    essEnabled: true,
    performanceEnabled: false,
    recruitmentEnabled: false,
    trainingEnabled: false,
    mobileAppEnabled: true,
    aiChatbotEnabled: false,
    // Production
    ncEditMode: false,
    loadUnload: false,
    cycleTime: false,
    // Payroll
    payrollLock: true,
    backdatedEntryControl: false,
    // Leave
    leaveCarryForward: true,
    compOffEnabled: false,
    halfDayLeaveEnabled: true,
    // Security
    mfaRequired: false,
    sessionTimeoutMinutes: 30,
    maxConcurrentSessions: 3,
    passwordMinLength: 8,
    passwordComplexity: true,
    accountLockThreshold: 5,
    accountLockDurationMinutes: 30,
    // Audit
    auditLogRetentionDays: 365,
};

const AUDIT_RETENTION_OPTIONS = [
    { value: "30", label: "30 days" },
    { value: "90", label: "90 days" },
    { value: "180", label: "180 days" },
    { value: "365", label: "1 year" },
    { value: "730", label: "2 years" },
];

/* ── Section Config ── */

interface ControlField {
    key: keyof SystemControls;
    label: string;
    description?: string;
    type: "toggle" | "number" | "select";
    suffix?: string;
    min?: number;
    max?: number;
    options?: { value: string; label: string }[];
}

interface ControlSection {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    fields: ControlField[];
}

const SECTIONS: ControlSection[] = [
    {
        title: "Module Enablement",
        icon: LayoutGrid,
        fields: [
            { key: "attendanceEnabled", label: "Attendance", description: "Enable attendance tracking module", type: "toggle" },
            { key: "leaveEnabled", label: "Leave Management", description: "Enable leave management module", type: "toggle" },
            { key: "payrollEnabled", label: "Payroll", description: "Enable payroll processing module", type: "toggle" },
            { key: "essEnabled", label: "Employee Self-Service", description: "Enable ESS portal for employees", type: "toggle" },
            { key: "performanceEnabled", label: "Performance", description: "Enable performance management module", type: "toggle" },
            { key: "recruitmentEnabled", label: "Recruitment", description: "Enable recruitment and hiring module", type: "toggle" },
            { key: "trainingEnabled", label: "Training", description: "Enable training and development module", type: "toggle" },
            { key: "mobileAppEnabled", label: "Mobile App", description: "Enable mobile app access for employees", type: "toggle" },
            { key: "aiChatbotEnabled", label: "AI Chatbot", description: "Enable AI-powered chatbot assistant", type: "toggle" },
        ],
    },
    {
        title: "Production",
        icon: Factory,
        fields: [
            { key: "ncEditMode", label: "NC Edit Mode", description: "Allow editing non-conformance records", type: "toggle" },
            { key: "loadUnload", label: "Load / Unload Tracking", description: "Track machine loading and unloading events", type: "toggle" },
            { key: "cycleTime", label: "Cycle Time Capture", description: "Record cycle times for production runs", type: "toggle" },
        ],
    },
    {
        title: "Payroll",
        icon: Wallet,
        fields: [
            { key: "payrollLock", label: "Payroll Lock", description: "Lock payroll after processing", type: "toggle" },
            { key: "backdatedEntryControl", label: "Backdated Entry Control", description: "Control backdated payroll entries", type: "toggle" },
        ],
    },
    {
        title: "Leave",
        icon: CalendarOff,
        fields: [
            { key: "leaveCarryForward", label: "Leave Carry Forward", description: "Allow carrying forward unused leave", type: "toggle" },
            { key: "compOffEnabled", label: "Compensatory Off", description: "Enable comp-off for working on holidays", type: "toggle" },
            { key: "halfDayLeaveEnabled", label: "Half-Day Leave", description: "Allow half-day leave applications", type: "toggle" },
        ],
    },
    {
        title: "Security & Access",
        icon: Shield,
        fields: [
            { key: "mfaRequired", label: "MFA Required", description: "Enforce multi-factor authentication for all users", type: "toggle" },
            { key: "sessionTimeoutMinutes", label: "Session Timeout", description: "Auto-logout after inactivity (minutes)", type: "number", suffix: "min", min: 5, max: 1440 },
            { key: "maxConcurrentSessions", label: "Max Concurrent Sessions", description: "Maximum active sessions per user", type: "number", suffix: "sessions", min: 1, max: 10 },
            { key: "passwordMinLength", label: "Password Min Length", description: "Minimum password character count", type: "number", suffix: "chars", min: 6, max: 32 },
            { key: "passwordComplexity", label: "Password Complexity", description: "Require uppercase, lowercase, number, and special character", type: "toggle" },
            { key: "accountLockThreshold", label: "Account Lock Threshold", description: "Failed attempts before account lock", type: "number", suffix: "attempts", min: 1, max: 20 },
            { key: "accountLockDurationMinutes", label: "Account Lock Duration", description: "Auto-unlock after (minutes)", type: "number", suffix: "min", min: 1, max: 1440 },
        ],
    },
    {
        title: "Audit",
        icon: FileText,
        fields: [
            { key: "auditLogRetentionDays", label: "Audit Log Retention", description: "How long to retain audit logs", type: "select", options: AUDIT_RETENTION_OPTIONS },
        ],
    },
];

/* ── Screen ── */

export function SystemControlsScreen() {
    const { data, isLoading, isError } = useCompanyControls();
    const updateMutation = useUpdateControls();

    const [controls, setControls] = useState<SystemControls>({ ...DEFAULTS });
    const [hasChanges, setHasChanges] = useState(false);

    const serverControls: SystemControls = (data?.data as SystemControls) ?? DEFAULTS;

    useEffect(() => {
        if (data?.data) {
            setControls({ ...DEFAULTS, ...serverControls });
            setHasChanges(false);
        }
    }, [data]);

    const updateField = <K extends keyof SystemControls>(key: K, value: SystemControls[K]) => {
        setControls((p) => ({ ...p, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(controls);
            showSuccess("Controls Saved", "System controls have been updated.");
            setHasChanges(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReset = () => {
        setControls({ ...DEFAULTS, ...serverControls });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">System Controls</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Settings className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load controls</p>
            </div>
        );
    }

    const toggleCount = SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.type === "toggle").length, 0);
    const enabledCount = SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.type === "toggle" && controls[f.key] === true).length, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">System Controls</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {enabledCount} of {toggleCount} controls enabled
                    </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECTIONS.map((section) => (
                    <div key={section.title} className={cn(
                        "bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden",
                        section.title === "Module Enablement" && "md:col-span-2"
                    )}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <section.icon size={16} className="text-primary-600" />
                                </div>
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</h3>
                            </div>
                            <div className={cn(
                                "space-y-3",
                                section.title === "Module Enablement" && "grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0"
                            )}>
                                {section.fields.map((field) => {
                                    if (field.type === "toggle") {
                                        return (
                                            <Toggle
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                checked={controls[field.key] as boolean}
                                                onChange={(v) => updateField(field.key, v as never)}
                                            />
                                        );
                                    }
                                    if (field.type === "number") {
                                        return (
                                            <NumberField
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                value={controls[field.key] as number}
                                                onChange={(v) => updateField(field.key, v as never)}
                                                suffix={field.suffix}
                                                min={field.min}
                                                max={field.max}
                                            />
                                        );
                                    }
                                    if (field.type === "select") {
                                        return (
                                            <SelectRow
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                value={controls[field.key] as number}
                                                onChange={(v) => updateField(field.key, Number(v) as never)}
                                                options={field.options ?? []}
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
