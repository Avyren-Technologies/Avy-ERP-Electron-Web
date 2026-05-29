import { useState, useEffect } from "react";
import { Loader2, Save, Settings, Clock, AlertTriangle, Shield, ToggleLeft, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanPerform } from "@/hooks/useCanPerform";
import { showSuccess, showApiError } from "@/lib/toast";
import { useMaintenanceConfig } from "@/features/maintenance/api/use-maintenance-queries";
import { useUpdateMaintenanceConfig } from "@/features/maintenance/api/use-maintenance-mutations";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { configHelp } from "@/features/maintenance/help";

/* ── Constants ── */

const NON_WORKING_DAY_RULES = [
    { value: "MOVE_EARLIER", label: "Move Earlier" },
    { value: "MOVE_LATER", label: "Move Later" },
    { value: "KEEP_DATE", label: "Keep Date" },
];

const AUTO_ASSIGN_RULES = [
    { value: "PRIMARY_TECHNICIAN", label: "Primary Technician" },
    { value: "ROUND_ROBIN", label: "Round Robin" },
    { value: "SKILL_BASED", label: "Skill Based" },
];

/* ── Types ── */

interface ConfigForm {
    // General
    defaultLeadDays: string;
    defaultGracePeriodDays: string;
    nonWorkingDayRule: string;
    autoAssignRule: string;
    // SLA
    ackSlaCritical: string;
    ackSlaHigh: string;
    ackSlaMedium: string;
    ackSlaLow: string;
    // Escalation
    escalationL1Minutes: string;
    escalationL2Minutes: string;
    escalationL3Minutes: string;
    // Breakdown
    bottleneckAlertMinutes: string;
    repeatFailureThreshold: string;
    repeatFailureWindowDays: string;
    // Closure
    repairVsReplacePercent: string;
    // Feature Toggles
    ptwEnabled: boolean;
    shutdownPlanningEnabled: boolean;
    vendorPortalEnabled: boolean;
    conditionMonitoringEnabled: boolean;
    qrTaggingEnabled: boolean;
    qaReleaseEnabled: boolean;
    sanitationEnabled: boolean;
    calibrationBlockEnabled: boolean;
    // Industry
    industryProfile: string;
}

const EMPTY_FORM: ConfigForm = {
    defaultLeadDays: "7",
    defaultGracePeriodDays: "2",
    nonWorkingDayRule: "MOVE_LATER",
    autoAssignRule: "PRIMARY_TECHNICIAN",
    ackSlaCritical: "15",
    ackSlaHigh: "30",
    ackSlaMedium: "60",
    ackSlaLow: "120",
    escalationL1Minutes: "30",
    escalationL2Minutes: "60",
    escalationL3Minutes: "120",
    bottleneckAlertMinutes: "60",
    repeatFailureThreshold: "3",
    repeatFailureWindowDays: "30",
    repairVsReplacePercent: "70",
    ptwEnabled: false,
    shutdownPlanningEnabled: false,
    vendorPortalEnabled: false,
    conditionMonitoringEnabled: false,
    qrTaggingEnabled: false,
    qaReleaseEnabled: false,
    sanitationEnabled: false,
    calibrationBlockEnabled: false,
    industryProfile: "",
};

/* ── Section Component ── */

function ConfigSection({ icon: Icon, title, description, children }: {
    icon: typeof Settings; title: string; description?: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                    {description && <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function NumberInput({ label, value, onChange, suffix, min, max, tooltip }: {
    label: string; value: string; onChange: (v: string) => void; suffix?: string; min?: number; max?: number; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5">{label}{tooltip && <InfoTooltip content={tooltip} />}</label>
            <div className="flex items-center gap-1.5">
                <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min={min} max={max}
                    className="w-20 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                {suffix && <span className="text-xs text-neutral-400 w-8">{suffix}</span>}
            </div>
        </div>
    );
}

function SelectInput({ label, value, onChange, options, tooltip }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5">{label}{tooltip && <InfoTooltip content={tooltip} />}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function ToggleRow({ label, description, checked, onChange, tooltip }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5">{label}{tooltip && <InfoTooltip content={tooltip} />}</p>
                {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={() => onChange(!checked)}
                className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

/* ── Main Screen ── */

export function MaintenanceConfigScreen() {
    const canConfigure = useCanPerform("maintenance:configure");
    const { data, isLoading } = useMaintenanceConfig();
    const updateMut = useUpdateMaintenanceConfig();
    const [form, setForm] = useState<ConfigForm>({ ...EMPTY_FORM });
    const [loaded, setLoaded] = useState(false);

    // Populate form from server data
    useEffect(() => {
        if (data?.data && !loaded) {
            const c = data.data;
            setForm({
                defaultLeadDays: String(c.defaultLeadDays ?? 7),
                defaultGracePeriodDays: String(c.defaultGracePeriodDays ?? 2),
                nonWorkingDayRule: c.nonWorkingDayRule ?? "MOVE_LATER",
                autoAssignRule: c.autoAssignRule ?? "PRIMARY_TECHNICIAN",
                ackSlaCritical: String(c.ackSlaCritical ?? 15),
                ackSlaHigh: String(c.ackSlaHigh ?? 30),
                ackSlaMedium: String(c.ackSlaMedium ?? 60),
                ackSlaLow: String(c.ackSlaLow ?? 120),
                escalationL1Minutes: String(c.escalationL1Minutes ?? 30),
                escalationL2Minutes: String(c.escalationL2Minutes ?? 60),
                escalationL3Minutes: String(c.escalationL3Minutes ?? 120),
                bottleneckAlertMinutes: String(c.bottleneckAlertMinutes ?? 60),
                repeatFailureThreshold: String(c.repeatFailureThreshold ?? 3),
                repeatFailureWindowDays: String(c.repeatFailureWindowDays ?? 30),
                repairVsReplacePercent: String(c.repairVsReplacePercent ?? 70),
                ptwEnabled: c.ptwEnabled ?? false,
                shutdownPlanningEnabled: c.shutdownPlanningEnabled ?? false,
                vendorPortalEnabled: c.vendorPortalEnabled ?? false,
                conditionMonitoringEnabled: c.conditionMonitoringEnabled ?? false,
                qrTaggingEnabled: c.qrTaggingEnabled ?? false,
                qaReleaseEnabled: c.qaReleaseEnabled ?? false,
                sanitationEnabled: c.sanitationEnabled ?? false,
                calibrationBlockEnabled: c.calibrationBlockEnabled ?? false,
                industryProfile: c.industryProfile ?? "",
            });
            setLoaded(true);
        }
    }, [data, loaded]);

    const handleSave = async () => {
        try {
            const payload: any = {
                defaultLeadDays: Number(form.defaultLeadDays),
                defaultGracePeriodDays: Number(form.defaultGracePeriodDays),
                nonWorkingDayRule: form.nonWorkingDayRule,
                autoAssignRule: form.autoAssignRule,
                ackSlaCritical: Number(form.ackSlaCritical),
                ackSlaHigh: Number(form.ackSlaHigh),
                ackSlaMedium: Number(form.ackSlaMedium),
                ackSlaLow: Number(form.ackSlaLow),
                escalationL1Minutes: Number(form.escalationL1Minutes),
                escalationL2Minutes: Number(form.escalationL2Minutes),
                escalationL3Minutes: Number(form.escalationL3Minutes),
                bottleneckAlertMinutes: Number(form.bottleneckAlertMinutes),
                repeatFailureThreshold: Number(form.repeatFailureThreshold),
                repeatFailureWindowDays: Number(form.repeatFailureWindowDays),
                repairVsReplacePercent: Number(form.repairVsReplacePercent),
                ptwEnabled: form.ptwEnabled,
                shutdownPlanningEnabled: form.shutdownPlanningEnabled,
                vendorPortalEnabled: form.vendorPortalEnabled,
                conditionMonitoringEnabled: form.conditionMonitoringEnabled,
                qrTaggingEnabled: form.qrTaggingEnabled,
                qaReleaseEnabled: form.qaReleaseEnabled,
                sanitationEnabled: form.sanitationEnabled,
                calibrationBlockEnabled: form.calibrationBlockEnabled,
                industryProfile: form.industryProfile || null,
            };
            await updateMut.mutateAsync(payload);
            showSuccess("Saved", "Maintenance configuration updated.");
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Maintenance Configuration</h1>
                        <HelpDrawer help={configHelp} />
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Global settings for the maintenance module</p>
                </div>
                {canConfigure && (
                    <button onClick={handleSave} disabled={updateMut.isPending}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50">
                        {updateMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {updateMut.isPending ? "Saving..." : "Save Configuration"}
                    </button>
                )}
            </div>

            {/* General */}
            <ConfigSection icon={Settings} title="General" description="Default scheduling and assignment rules">
                <NumberInput label="Default Lead Days" value={form.defaultLeadDays} onChange={(v) => setForm((p) => ({ ...p, defaultLeadDays: v }))} suffix="days" min={0} tooltip={configHelp.fields!.defaultLeadDays} />
                <NumberInput label="Default Grace Period" value={form.defaultGracePeriodDays} onChange={(v) => setForm((p) => ({ ...p, defaultGracePeriodDays: v }))} suffix="days" min={0} tooltip={configHelp.fields!.defaultGracePeriodDays} />
                <SelectInput label="Non-Working Day Rule" value={form.nonWorkingDayRule} onChange={(v) => setForm((p) => ({ ...p, nonWorkingDayRule: v }))} options={NON_WORKING_DAY_RULES} tooltip={configHelp.fields!.nonWorkingDayRule} />
                <SelectInput label="Auto-Assign Rule" value={form.autoAssignRule} onChange={(v) => setForm((p) => ({ ...p, autoAssignRule: v }))} options={AUTO_ASSIGN_RULES} tooltip={configHelp.fields!.autoAssignRule} />
            </ConfigSection>

            {/* SLA Timings */}
            <ConfigSection icon={Clock} title="SLA Timings" description="Acknowledgement SLA by priority (minutes)">
                <NumberInput label="Critical" value={form.ackSlaCritical} onChange={(v) => setForm((p) => ({ ...p, ackSlaCritical: v }))} suffix="min" min={1} />
                <NumberInput label="High" value={form.ackSlaHigh} onChange={(v) => setForm((p) => ({ ...p, ackSlaHigh: v }))} suffix="min" min={1} />
                <NumberInput label="Medium" value={form.ackSlaMedium} onChange={(v) => setForm((p) => ({ ...p, ackSlaMedium: v }))} suffix="min" min={1} />
                <NumberInput label="Low" value={form.ackSlaLow} onChange={(v) => setForm((p) => ({ ...p, ackSlaLow: v }))} suffix="min" min={1} />
            </ConfigSection>

            {/* Escalation */}
            <ConfigSection icon={AlertTriangle} title="Escalation" description="Escalation timers for unacknowledged work orders">
                <NumberInput label="Level 1" value={form.escalationL1Minutes} onChange={(v) => setForm((p) => ({ ...p, escalationL1Minutes: v }))} suffix="min" min={1} />
                <NumberInput label="Level 2" value={form.escalationL2Minutes} onChange={(v) => setForm((p) => ({ ...p, escalationL2Minutes: v }))} suffix="min" min={1} />
                <NumberInput label="Level 3" value={form.escalationL3Minutes} onChange={(v) => setForm((p) => ({ ...p, escalationL3Minutes: v }))} suffix="min" min={1} />
            </ConfigSection>

            {/* Breakdown */}
            <ConfigSection icon={AlertTriangle} title="Breakdown & Repeat Failure" description="Thresholds for detecting repeat failures">
                <NumberInput label="Bottleneck Alert After" value={form.bottleneckAlertMinutes} onChange={(v) => setForm((p) => ({ ...p, bottleneckAlertMinutes: v }))} suffix="min" min={1} tooltip={configHelp.fields!.bottleneckAlertMinutes} />
                <NumberInput label="Repeat Failure Threshold" value={form.repeatFailureThreshold} onChange={(v) => setForm((p) => ({ ...p, repeatFailureThreshold: v }))} suffix="times" min={1} tooltip={configHelp.fields!.repeatFailureThreshold} />
                <NumberInput label="Repeat Failure Window" value={form.repeatFailureWindowDays} onChange={(v) => setForm((p) => ({ ...p, repeatFailureWindowDays: v }))} suffix="days" min={1} tooltip={configHelp.fields!.repeatFailureWindowDays} />
            </ConfigSection>

            {/* Closure */}
            <ConfigSection icon={Shield} title="Closure" description="Rules for closing and evaluating work orders">
                <NumberInput label="Repair vs Replace Threshold" value={form.repairVsReplacePercent} onChange={(v) => setForm((p) => ({ ...p, repairVsReplacePercent: v }))} suffix="%" min={0} max={100} tooltip={configHelp.fields!.repairVsReplacePercent} />
            </ConfigSection>

            {/* Feature Toggles */}
            <ConfigSection icon={ToggleLeft} title="Feature Toggles" description="Enable or disable maintenance sub-modules">
                <ToggleRow label="Permit to Work (PTW)" description="Require permits for hazardous work" checked={form.ptwEnabled} onChange={(v) => setForm((p) => ({ ...p, ptwEnabled: v }))} tooltip={configHelp.fields!.ptwEnabled} />
                <ToggleRow label="Shutdown Planning" description="Plan and schedule plant shutdowns" checked={form.shutdownPlanningEnabled} onChange={(v) => setForm((p) => ({ ...p, shutdownPlanningEnabled: v }))} tooltip={configHelp.fields!.shutdownPlanningEnabled} />
                <ToggleRow label="Vendor Portal" description="External vendor access for work orders" checked={form.vendorPortalEnabled} onChange={(v) => setForm((p) => ({ ...p, vendorPortalEnabled: v }))} />
                <ToggleRow label="Condition Monitoring" description="IoT sensor-based condition monitoring" checked={form.conditionMonitoringEnabled} onChange={(v) => setForm((p) => ({ ...p, conditionMonitoringEnabled: v }))} />
                <ToggleRow label="QR / NFC Tagging" description="Scan asset tags for quick identification" checked={form.qrTaggingEnabled} onChange={(v) => setForm((p) => ({ ...p, qrTaggingEnabled: v }))} tooltip={configHelp.fields!.qrTaggingEnabled} />
                <ToggleRow label="QA Release" description="Require quality assurance sign-off" checked={form.qaReleaseEnabled} onChange={(v) => setForm((p) => ({ ...p, qaReleaseEnabled: v }))} tooltip={configHelp.fields!.qaReleaseEnabled} />
                <ToggleRow label="Sanitation" description="Food/pharma sanitation protocols" checked={form.sanitationEnabled} onChange={(v) => setForm((p) => ({ ...p, sanitationEnabled: v }))} tooltip={configHelp.fields!.sanitationEnabled} />
                <ToggleRow label="Calibration Block" description="Block assets from use until calibrated" checked={form.calibrationBlockEnabled} onChange={(v) => setForm((p) => ({ ...p, calibrationBlockEnabled: v }))} tooltip={configHelp.fields!.calibrationBlockEnabled} />
            </ConfigSection>

            {/* Industry */}
            <ConfigSection icon={Factory} title="Industry Profile" description="Set the industry profile to enable domain-specific defaults">
                <div className="flex items-center justify-between gap-4">
                    <label className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">Industry Profile</label>
                    <input type="text" value={form.industryProfile} onChange={(e) => setForm((p) => ({ ...p, industryProfile: e.target.value }))} placeholder="e.g. manufacturing, pharma"
                        className="w-48 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </ConfigSection>

            {/* Bottom Save */}
            {canConfigure && (
                <div className="flex justify-end pt-2 pb-8">
                    <button onClick={handleSave} disabled={updateMut.isPending}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50">
                        {updateMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {updateMut.isPending ? "Saving..." : "Save Configuration"}
                    </button>
                </div>
            )}
        </div>
    );
}
