import { useState, useEffect, useRef, useMemo } from "react";
import {
    Loader2,
    Save,
    Eye,
    Edit2,
    RotateCcw,
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

function NumberSetting({ label, description, value, onChange, disabled, min, max }: { label: string; description?: string; value: number; onChange: (v: number) => void; disabled?: boolean; min?: number; max?: number }) {
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
                min={min ?? 0}
                max={max}
                className="w-24 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white disabled:opacity-50 transition-all"
            />
        </div>
    );
}

const REQUIREMENT_OPTIONS = [
    { value: "ALWAYS", label: "Always" },
    { value: "PER_VISITOR_TYPE", label: "Per Visitor Type" },
    { value: "NEVER", label: "Never" },
] as const;

function RequirementSetting({ label, description, value, onChange, disabled }: { label: string; description?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <div className="flex items-start justify-between py-3 gap-4">
            <div>
                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-40 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white disabled:opacity-50 transition-all"
            >
                {REQUIREMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function TimeSetting({ label, description, value, onChange, disabled }: { label: string; description?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <div className="flex items-start justify-between py-3 gap-4">
            <div>
                <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
                {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-28 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white disabled:opacity-50 transition-all"
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

const DEFAULT_NDA_TEMPLATE = `# Non-Disclosure Agreement

## Confidentiality Obligation

By entering the premises of **[Company Name]**, I ("the Visitor") acknowledge and agree to the following:

1. **Confidential Information**: Any information, whether written, oral, or visual, that I may access, observe, or receive during my visit is considered confidential.

2. **Non-Disclosure**: I agree not to disclose, publish, or otherwise reveal any confidential information to any third party during or after my visit without prior written consent.

3. **No Recording**: I will not photograph, video record, or make audio recordings of any area, equipment, process, or document without explicit written permission.

4. **Return of Materials**: I will return any documents, materials, or equipment provided to me during the visit before leaving the premises.

5. **Duration**: This obligation of confidentiality shall remain in effect indefinitely and shall survive the conclusion of my visit.

6. **Acknowledgement**: I understand that violation of this agreement may result in legal action.

**By signing below (or accepting digitally), I confirm that I have read, understood, and agree to the terms above.**`;

/** Simple markdown-to-HTML for preview (handles headings, bold, lists, paragraphs) */
function renderMarkdown(md: string): string {
    return md
        .split("\n\n")
        .map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return "";
            // Headings
            if (trimmed.startsWith("## ")) return `<h2 style="font-size:1.25rem;font-weight:700;margin:1rem 0 0.5rem">${inlineMd(trimmed.slice(3))}</h2>`;
            if (trimmed.startsWith("# ")) return `<h1 style="font-size:1.5rem;font-weight:700;margin:1rem 0 0.5rem">${inlineMd(trimmed.slice(2))}</h1>`;
            // Numbered list
            const lines = trimmed.split("\n");
            if (/^\d+\.\s/.test(lines[0] ?? "")) {
                const items = lines.map((l) => `<li style="margin-bottom:0.25rem">${inlineMd(l.replace(/^\d+\.\s*/, ""))}</li>`).join("");
                return `<ol style="list-style:decimal;padding-left:1.5rem;margin:0.5rem 0">${items}</ol>`;
            }
            // Bullet list
            if (lines[0]?.startsWith("- ")) {
                const items = lines.map((l) => `<li style="margin-bottom:0.25rem">${inlineMd(l.replace(/^-\s*/, ""))}</li>`).join("");
                return `<ul style="list-style:disc;padding-left:1.5rem;margin:0.5rem 0">${items}</ul>`;
            }
            return `<p style="margin:0.5rem 0">${inlineMd(trimmed)}</p>`;
        })
        .join("");
}

function inlineMd(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/* ── Screen ── */

export function VMSSettingsScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading } = useVmsConfig();
    const updateMutation = useUpdateVmsConfig();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [dirty, setDirty] = useState(false);
    const [ndaPreview, setNdaPreview] = useState(false);

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
                    <ToggleSwitch label="Allow Walk-In Registration" description="Enable walk-in visitors to be registered directly at the gate" checked={config.walkInAllowed ?? true} onChange={(v) => updateField("walkInAllowed", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="QR Self-Registration" description="Visitors can self-register via QR code posters" checked={config.qrSelfRegistrationEnabled ?? true} onChange={(v) => updateField("qrSelfRegistrationEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Pre-Registration Enabled" description="Enable pre-registration of visits before arrival" checked={config.preRegistrationEnabled ?? true} onChange={(v) => updateField("preRegistrationEnabled", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Verification & Compliance">
                    <RequirementSetting label="Photo Capture" description="When to capture visitor photo during check-in" value={config.photoCapture ?? "PER_VISITOR_TYPE"} onChange={(v) => updateField("photoCapture", v)} disabled={!canConfigure} />
                    <RequirementSetting label="ID Verification" description="When to require visitor ID verification" value={config.idVerification ?? "PER_VISITOR_TYPE"} onChange={(v) => updateField("idVerification", v)} disabled={!canConfigure} />
                    <RequirementSetting label="Safety Induction" description="When to require safety induction before entry" value={config.safetyInduction ?? "PER_VISITOR_TYPE"} onChange={(v) => updateField("safetyInduction", v)} disabled={!canConfigure} />
                    <RequirementSetting label="NDA Required" description="When to require visitors to sign an NDA" value={config.ndaRequired ?? "PER_VISITOR_TYPE"} onChange={(v) => updateField("ndaRequired", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Badges">
                    <ToggleSwitch label="Badge Printing" description="Print physical visitor badges upon check-in" checked={config.badgePrintingEnabled ?? true} onChange={(v) => updateField("badgePrintingEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Digital Badge" description="Issue digital visitor badges" checked={config.digitalBadgeEnabled ?? true} onChange={(v) => updateField("digitalBadgeEnabled", v)} disabled={!canConfigure} />
                </SectionCard>

                <SectionCard title="Approval">
                    <ToggleSwitch label="Walk-In Approval Required" description="Walk-in visits require host approval before entry" checked={config.walkInApprovalRequired ?? true} onChange={(v) => updateField("walkInApprovalRequired", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="QR Self-Reg Approval Required" description="QR self-registered visits require host approval" checked={config.qrSelfRegApprovalRequired ?? true} onChange={(v) => updateField("qrSelfRegApprovalRequired", v)} disabled={!canConfigure} />
                    <NumberSetting label="Approval Timeout (minutes)" description="Time limit for host to approve a visit" value={config.approvalTimeoutMinutes ?? 15} onChange={(v) => updateField("approvalTimeoutMinutes", v)} disabled={!canConfigure} min={1} max={120} />
                    <NumberSetting label="Auto-Reject After (minutes)" description="Auto-reject if not approved within this time" value={config.autoRejectAfterMinutes ?? 30} onChange={(v) => updateField("autoRejectAfterMinutes", v)} disabled={!canConfigure} min={5} max={120} />
                </SectionCard>

                <SectionCard title="Check-Out & Overstay">
                    <ToggleSwitch label="Overstay Alert" description="Alert when visitors exceed their expected duration" checked={config.overstayAlertEnabled ?? true} onChange={(v) => updateField("overstayAlertEnabled", v)} disabled={!canConfigure} />
                    <NumberSetting label="Default Max Duration (minutes)" description="Default maximum visit duration" value={config.defaultMaxDurationMinutes ?? 480} onChange={(v) => updateField("defaultMaxDurationMinutes", v)} disabled={!canConfigure} min={30} max={1440} />
                    <ToggleSwitch label="Auto Check-Out" description="Automatically check out remaining visitors at a set time" checked={config.autoCheckOutEnabled ?? false} onChange={(v) => updateField("autoCheckOutEnabled", v)} disabled={!canConfigure} />
                    {config.autoCheckOutEnabled && (
                        <TimeSetting label="Auto Check-Out Time" description="Time to auto check-out remaining visitors" value={config.autoCheckOutTime ?? "20:00"} onChange={(v) => updateField("autoCheckOutTime", v)} disabled={!canConfigure} />
                    )}
                </SectionCard>

                <SectionCard title="Features">
                    <ToggleSwitch label="Vehicle Gate Pass" description="Track vehicle entry and exit with gate passes" checked={config.vehicleGatePassEnabled ?? true} onChange={(v) => updateField("vehicleGatePassEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Material Gate Pass" description="Track material in/out with gate passes" checked={config.materialGatePassEnabled ?? true} onChange={(v) => updateField("materialGatePassEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Recurring Passes" description="Allow recurring visitor passes for frequent visitors" checked={config.recurringPassEnabled ?? true} onChange={(v) => updateField("recurringPassEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Group Visits" description="Allow batch visitor registrations" checked={config.groupVisitEnabled ?? true} onChange={(v) => updateField("groupVisitEnabled", v)} disabled={!canConfigure} />
                    <ToggleSwitch label="Emergency Muster" description="Emergency evacuation visitor tracking" checked={config.emergencyMusterEnabled ?? true} onChange={(v) => updateField("emergencyMusterEnabled", v)} disabled={!canConfigure} />
                </SectionCard>

                {/* NDA Template */}
                {config.ndaRequired !== "NEVER" && (
                    <SectionCard title="NDA Template">
                        <div className="py-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-primary-950 dark:text-white">NDA Content</span>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                        Write the NDA in markdown format. Visitors will see this before signing.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateField("ndaTemplateContent", DEFAULT_NDA_TEMPLATE);
                                        }}
                                        disabled={!canConfigure}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                                    >
                                        <RotateCcw size={12} />
                                        Reset to Default
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNdaPreview((p) => !p)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                            ndaPreview
                                                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                                        )}
                                    >
                                        {ndaPreview ? <Edit2 size={12} /> : <Eye size={12} />}
                                        {ndaPreview ? "Edit" : "Preview"}
                                    </button>
                                </div>
                            </div>
                            {ndaPreview ? (
                                <div
                                    className="prose prose-sm max-w-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 text-primary-950 dark:text-white"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(config.ndaTemplateContent || DEFAULT_NDA_TEMPLATE) }}
                                />
                            ) : (
                                <textarea
                                    value={config.ndaTemplateContent ?? DEFAULT_NDA_TEMPLATE}
                                    onChange={(e) => updateField("ndaTemplateContent", e.target.value)}
                                    disabled={!canConfigure}
                                    rows={16}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm font-mono text-primary-950 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50 transition-all resize-y"
                                    placeholder="Enter NDA content in markdown format..."
                                />
                            )}
                        </div>
                    </SectionCard>
                )}

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
