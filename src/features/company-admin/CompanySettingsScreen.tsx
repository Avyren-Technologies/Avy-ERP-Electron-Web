import { useState, useEffect } from "react";
import {
    Settings,
    Loader2,
    Globe,
    Shield,
    Plug,
} from "lucide-react";
import { InfoTooltip, SectionDescription } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { useCompanySettings } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateSettings } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import type { CompanySettings } from "@/lib/api/company-admin";

/* ── Shared Controls ── */

function SelectField({ label, value, onChange, options, tooltip }: {
    label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; tooltip?: string;
}) {
    const fieldId = label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1.5">
                <label htmlFor={fieldId} className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</label>
                {tooltip && <InfoTooltip content={tooltip} />}
            </div>
            <select
                id={fieldId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function Toggle({ label, description, checked, onChange, tooltip }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div>
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary-950 dark:text-white">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", checked ? "left-[22px]" : "left-[3px]")} />
            </button>
        </div>
    );
}

/* ── Options ── */

const CURRENCY_OPTIONS = [
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "AED", label: "AED - UAE Dirham" },
];

const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "mr", label: "Marathi" },
    { value: "kn", label: "Kannada" },
];

const TIMEZONE_OPTIONS = [
    { value: "Asia/Kolkata", label: "IST (Asia/Kolkata)" },
    { value: "America/New_York", label: "EST (America/New_York)" },
    { value: "America/Los_Angeles", label: "PST (America/Los_Angeles)" },
    { value: "Europe/London", label: "GMT (Europe/London)" },
    { value: "Asia/Dubai", label: "GST (Asia/Dubai)" },
    { value: "Asia/Singapore", label: "SGT (Asia/Singapore)" },
];

const DATE_FORMAT_OPTIONS = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMAT_OPTIONS = [
    { value: "TWELVE_HOUR", label: "12 Hour" },
    { value: "TWENTY_FOUR_HOUR", label: "24 Hour" },
];

const NUMBER_FORMAT_OPTIONS = [
    { value: "en-IN", label: "Indian (1,00,000)" },
    { value: "en-US", label: "International (100,000)" },
];

/* ── Default values ── */

const DEFAULTS: CompanySettings = {
    currency: "INR",
    language: "en",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "TWELVE_HOUR",
    numberFormat: "en-IN",
    indiaCompliance: true,
    gdprMode: false,
    auditTrail: true,
    bankIntegration: false,
    razorpayEnabled: false,
    emailNotifications: true,
    whatsappNotifications: false,
    pushNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    biometricIntegration: false,
    eSignIntegration: false,
};

/* ── Screen ── */

export function CompanySettingsScreen() {
    const { data, isLoading, isError } = useCompanySettings();
    const updateMutation = useUpdateSettings();

    const [settings, setSettings] = useState<CompanySettings>({ ...DEFAULTS });
    const [hasChanges, setHasChanges] = useState(false);

    const serverSettings: CompanySettings = (data?.data as CompanySettings) ?? DEFAULTS;

    useEffect(() => {
        if (data?.data) {
            setSettings({ ...DEFAULTS, ...serverSettings });
            setHasChanges(false);
        }
    }, [data]);

    const updateField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
        setSettings((p) => ({ ...p, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(settings);
            showSuccess("Settings Saved", "Company settings have been updated.");
            setHasChanges(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReset = () => {
        setSettings({ ...DEFAULTS, ...serverSettings });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Settings</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Settings className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load settings</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Settings</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure locale, compliance, and integrations</p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Reset</button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50">
                            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Locale */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Globe size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Locale</h3>
                    </div>
                    <SectionDescription>Regional settings that affect date formatting, currency display, and language across the platform.</SectionDescription>
                    <div className="space-y-4">
                        <SelectField label="Currency" value={settings.currency} onChange={(v) => updateField("currency", v as CompanySettings["currency"])} options={CURRENCY_OPTIONS} />
                        <SelectField label="Language" value={settings.language} onChange={(v) => updateField("language", v as CompanySettings["language"])} options={LANGUAGE_OPTIONS} />
                        <SelectField label="Timezone" value={settings.timezone} onChange={(v) => updateField("timezone", v)} options={TIMEZONE_OPTIONS} tooltip="All attendance calculations use this timezone. Changing this affects how dates and times are interpreted." />
                        <SelectField label="Date Format" value={settings.dateFormat} onChange={(v) => updateField("dateFormat", v)} options={DATE_FORMAT_OPTIONS} />
                        <SelectField label="Time Format" value={settings.timeFormat} onChange={(v) => updateField("timeFormat", v as CompanySettings["timeFormat"])} options={TIME_FORMAT_OPTIONS} />
                        <SelectField label="Number Format" value={settings.numberFormat} onChange={(v) => updateField("numberFormat", v)} options={NUMBER_FORMAT_OPTIONS} />
                    </div>
                </div>

                {/* Compliance */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Shield size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Compliance</h3>
                    </div>
                    <SectionDescription>Enable region-specific compliance frameworks and data protection features.</SectionDescription>
                    <div className="space-y-3">
                        <Toggle label="India Compliance" description="Enable India-specific statutory compliance" checked={settings.indiaCompliance} onChange={(v) => updateField("indiaCompliance", v)} />
                        <Toggle label="GDPR Mode" description="Enable GDPR data protection features" checked={settings.gdprMode} onChange={(v) => updateField("gdprMode", v)} />
                        <Toggle label="Audit Trail" description="Maintain detailed audit trail for all changes" checked={settings.auditTrail} onChange={(v) => updateField("auditTrail", v)} tooltip="When enabled, all configuration changes are logged with who made the change and when." />
                    </div>
                </div>

                {/* Integrations */}
                <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Plug size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Integrations</h3>
                    </div>
                    <SectionDescription>Connect external services for payments, notifications, biometric devices, and e-signatures.</SectionDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Toggle label="Bank Integration" description="Enable bank account integration" checked={settings.bankIntegration} onChange={(v) => updateField("bankIntegration", v)} />
                        <Toggle label="RazorpayX Payout" description="Enable RazorpayX for payroll disbursement" checked={settings.razorpayEnabled} onChange={(v) => updateField("razorpayEnabled", v)} />
                        <Toggle label="Email Notifications" description="Send email alerts for key events" checked={settings.emailNotifications} onChange={(v) => updateField("emailNotifications", v)} />
                        <Toggle label="Push Notifications" description="Deliver notifications to users' devices" checked={settings.pushNotifications} onChange={(v) => updateField("pushNotifications", v)} />
                        <Toggle label="SMS Notifications" description="Send SMS alerts (requires SMS provider)" checked={settings.smsNotifications} onChange={(v) => updateField("smsNotifications", v)} />
                        <Toggle label="In-App Notifications" description="Show bell icon notifications in web and mobile" checked={settings.inAppNotifications} onChange={(v) => updateField("inAppNotifications", v)} />
                        <Toggle label="WhatsApp Notifications" description="Send WhatsApp alerts" checked={settings.whatsappNotifications} onChange={(v) => updateField("whatsappNotifications", v)} />
                        <Toggle label="Biometric Integration" description="Enable biometric device integration" checked={settings.biometricIntegration} onChange={(v) => updateField("biometricIntegration", v)} />
                        <Toggle label="E-Sign Integration" description="Enable electronic signature workflows" checked={settings.eSignIntegration} onChange={(v) => updateField("eSignIntegration", v)} />
                    </div>
                </div>
            </div>

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shadow-2xl shadow-neutral-900/10">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Discard</button>
                            <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
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
