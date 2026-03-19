import { useState, useEffect } from "react";
import {
    Settings,
    Loader2,
    CheckCircle2,
    XCircle,
    Factory,
    Wallet,
    Shield,
    CalendarOff,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyControls } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateControls } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

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
                <div className={cn("w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", checked ? "left-[22px]" : "left-[3px]")} />
            </button>
        </div>
    );
}

interface ControlSection {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    controls: Array<{ key: string; label: string; description?: string }>;
}

const SECTIONS: ControlSection[] = [
    {
        title: "Production",
        icon: Factory,
        controls: [
            { key: "ncEditMode", label: "NC Edit Mode", description: "Allow editing non-conformance records" },
            { key: "loadUnload", label: "Load / Unload Tracking", description: "Track machine loading and unloading events" },
            { key: "cycleTime", label: "Cycle Time Capture", description: "Record cycle times for production runs" },
        ],
    },
    {
        title: "Payroll",
        icon: Wallet,
        controls: [
            { key: "payrollLock", label: "Payroll Lock", description: "Lock payroll after processing" },
            { key: "overtimeApproval", label: "Overtime Approval", description: "Require approval for overtime hours" },
        ],
    },
    {
        title: "Security",
        icon: Shield,
        controls: [
            { key: "mfa", label: "MFA Required", description: "Enforce multi-factor authentication for all users" },
            { key: "sessionTimeout", label: "Session Timeout", description: "Auto-logout after inactivity period" },
            { key: "ipWhitelist", label: "IP Whitelisting", description: "Restrict access to specific IP addresses" },
        ],
    },
    {
        title: "Leave",
        icon: CalendarOff,
        controls: [
            { key: "leaveCarryForward", label: "Leave Carry Forward", description: "Allow carrying forward unused leave" },
            { key: "compOff", label: "Compensatory Off", description: "Enable comp-off for working on holidays" },
            { key: "halfDayLeave", label: "Half-Day Leave", description: "Allow half-day leave applications" },
        ],
    },
    {
        title: "Notifications",
        icon: Bell,
        controls: [
            { key: "emailNotifications", label: "Email Notifications", description: "Send email alerts for key events" },
            { key: "pushNotifications", label: "Push Notifications", description: "Enable mobile push notifications" },
            { key: "smsAlerts", label: "SMS Alerts", description: "Send critical alerts via SMS" },
        ],
    },
];

export function SystemControlsScreen() {
    const { data, isLoading, isError } = useCompanyControls();
    const updateMutation = useUpdateControls();

    const [controls, setControls] = useState<Record<string, boolean>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverControls = (data?.data as any) ?? {};

    useEffect(() => {
        if (data?.data) {
            setControls({ ...serverControls });
            setHasChanges(false);
        }
    }, [data]);

    const toggleControl = (key: string, value: boolean) => {
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
        setControls({ ...serverControls });
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

    const enabledCount = Object.values(controls).filter(Boolean).length;
    const totalCount = SECTIONS.reduce((sum, s) => sum + s.controls.length, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">System Controls</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {enabledCount} of {totalCount} controls enabled
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
                    <div key={section.title} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <section.icon size={16} className="text-primary-600" />
                                </div>
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</h3>
                            </div>
                            <div className="space-y-3">
                                {section.controls.map((ctrl) => (
                                    <Toggle
                                        key={ctrl.key}
                                        label={ctrl.label}
                                        description={ctrl.description}
                                        checked={controls[ctrl.key] ?? false}
                                        onChange={(v) => toggleControl(ctrl.key, v)}
                                    />
                                ))}
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
