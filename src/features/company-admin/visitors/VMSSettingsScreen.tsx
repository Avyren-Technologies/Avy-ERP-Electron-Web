import { useState, useEffect, useRef } from "react";
import {
    Loader2,
    Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVmsConfig } from "@/features/company-admin/api/use-visitor-queries";
import { useUpdateVmsConfig } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Toggle ── */

function ToggleSwitch({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <div className="flex items-start justify-between py-3 gap-4">
            <div>
                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative shrink-0",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

function NumberSetting({ label, description, value, onChange, disabled }: { label: string; description?: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
    return (
        <div className="flex items-start justify-between py-3 gap-4">
            <div>
                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                min={0}
                className="w-24 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white disabled:opacity-50 transition-all"
            />
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6">
            <h2 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">{title}</h2>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</div>
        </div>
    );
}

/* ── Screen ── */

export function VMSSettingsScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading } = useVmsConfig();
    const updateMutation = useUpdateVmsConfig();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [dirty, setDirty] = useState(false);

    const serverConfig = data?.data ?? {};
    const initialized = useRef(false);

    useEffect(() => {
        if (serverConfig && Object.keys(serverConfig).length > 0 && !initialized.current) {
            setConfig(serverConfig);
            initialized.current = true;
        }
    }, [serverConfig]);

    const updateField = (key: string, value: any) => {
        setConfig((p) => ({ ...p, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(config);
            showSuccess("Settings Saved", "VMS configuration has been updated.");
            setDirty(false);
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-7 h-7 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">VMS Settings</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure visitor management system behaviour</p>
                </div>
                {canConfigure && dirty && (
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
                    >
                        {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                )}
            </div>

            <div className="max-w-3xl space-y-6">
                <SectionCard title="Registration">
                    <ToggleSwitch label="Allow Walk-In Registration" description="Enable walk-in visitors to be registered directly at the gate" checked={config.allowWalkIn ?? true} onChange={(v) => updateField("allowWalkIn", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Allow Self-Registration" description="Visitors can self-register via QR code posters" checked={config.allowSelfRegistration ?? false} onChange={(v) => updateField("allowSelfRegistration", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Pre-Registration Required" description="All visits must be pre-registered before arrival" checked={config.preRegistrationRequired ?? false} onChange={(v) => updateField("preRegistrationRequired", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Collect Visitor Photo" description="Capture visitor photo during check-in" checked={config.collectPhoto ?? true} onChange={(v) => updateField("collectPhoto", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Identity Verification">
                    <ToggleSwitch label="Require ID Verification" description="Visitors must present a valid ID document" checked={config.requireIdVerification ?? true} onChange={(v) => updateField("requireIdVerification", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="ID Document Photo Capture" description="Capture photo of ID document" checked={config.captureIdPhoto ?? false} onChange={(v) => updateField("captureIdPhoto", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="OTP Verification" description="Send OTP to visitor mobile for verification" checked={config.otpVerification ?? false} onChange={(v) => updateField("otpVerification", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Approval">
                    <ToggleSwitch label="Require Host Approval" description="Visits require approval from the host employee" checked={config.requireHostApproval ?? false} onChange={(v) => updateField("requireHostApproval", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Auto-Approve Pre-Registered" description="Pre-registered visits are automatically approved" checked={config.autoApprovePreRegistered ?? true} onChange={(v) => updateField("autoApprovePreRegistered", v)} disabled={!canConfigure} />
                    <NumberSetting label="Approval Timeout (minutes)" description="Auto-reject if not approved within this time (0 = no timeout)" value={config.approvalTimeoutMinutes ?? 0} onChange={(v) => updateField("approvalTimeoutMinutes", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Safety & Compliance">
                    <ToggleSwitch label="Require Safety Induction" description="Visitors must complete safety induction before entry" checked={config.requireInduction ?? false} onChange={(v) => updateField("requireInduction", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Require NDA Signing" description="Visitors must sign an NDA" checked={config.requireNDA ?? false} onChange={(v) => updateField("requireNDA", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="PPE Compliance Check" description="Check PPE requirements before entry" checked={config.requirePPE ?? false} onChange={(v) => updateField("requirePPE", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Check-Out & Overstay">
                    <ToggleSwitch label="Auto Check-Out at EOD" description="Automatically check out remaining visitors at end of day" checked={config.autoCheckOutEod ?? true} onChange={(v) => updateField("autoCheckOutEod", v)} disabled={!canConfigure} />
                    <NumberSetting label="Default Visit Duration (minutes)" description="Default expected duration for visits" value={config.defaultVisitDuration ?? 120} onChange={(v) => updateField("defaultVisitDuration", v)} disabled={!canConfigure} />
                    <NumberSetting label="Overstay Alert Threshold (minutes)" description="Trigger alert after this many minutes past expected checkout" value={config.overstayThreshold ?? 30} onChange={(v) => updateField("overstayThreshold", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Features">
                    <ToggleSwitch label="Enable Recurring Passes" description="Allow recurring visitor passes" checked={config.enableRecurringPasses ?? true} onChange={(v) => updateField("enableRecurringPasses", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Enable Group Visits" description="Allow batch visitor registrations" checked={config.enableGroupVisits ?? true} onChange={(v) => updateField("enableGroupVisits", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Enable Vehicle Passes" description="Track vehicle entry and exit" checked={config.enableVehiclePasses ?? true} onChange={(v) => updateField("enableVehiclePasses", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Enable Material Passes" description="Track material in/out with visitors" checked={config.enableMaterialPasses ?? true} onChange={(v) => updateField("enableMaterialPasses", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Enable Emergency Muster" description="Emergency evacuation visitor tracking" checked={config.enableEmergencyMuster ?? true} onChange={(v) => updateField("enableEmergencyMuster", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Enable Watchlist Checks" description="Check visitors against watchlist/blocklist during check-in" checked={config.enableWatchlistChecks ?? true} onChange={(v) => updateField("enableWatchlistChecks", v)} disabled={!canConfigure} />
                </SectionCard>

                {/* Save button at bottom too */}
                {canConfigure && dirty && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
                        >
                            {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
