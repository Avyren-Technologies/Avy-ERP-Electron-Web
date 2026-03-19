import { useState, useEffect } from "react";
import {
    Settings,
    Loader2,
    Globe,
    Shield,
    Monitor,
    Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanySettings } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateSettings } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

function SelectField({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select
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

function Toggle({ label, description, checked, onChange }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div>
                <p className="text-sm font-semibold text-primary-950 dark:text-white">{label}</p>
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

const CURRENCY_OPTIONS = [
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
];

const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "mr", label: "Marathi" },
];

const DATE_FORMAT_OPTIONS = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMAT_OPTIONS = [
    { value: "12h", label: "12 Hour" },
    { value: "24h", label: "24 Hour" },
];

const NUMBER_FORMAT_OPTIONS = [
    { value: "en-IN", label: "Indian (1,00,000)" },
    { value: "en-US", label: "International (100,000)" },
];

const TIMEZONE_OPTIONS = [
    { value: "Asia/Kolkata", label: "IST (Asia/Kolkata)" },
    { value: "America/New_York", label: "EST (America/New_York)" },
    { value: "America/Los_Angeles", label: "PST (America/Los_Angeles)" },
    { value: "Europe/London", label: "GMT (Europe/London)" },
    { value: "Asia/Dubai", label: "GST (Asia/Dubai)" },
    { value: "Asia/Singapore", label: "SGT (Asia/Singapore)" },
];

export function CompanySettingsScreen() {
    const { data, isLoading, isError } = useCompanySettings();
    const updateMutation = useUpdateSettings();

    const [settings, setSettings] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverSettings = (data?.data as any) ?? {};

    useEffect(() => {
        if (data?.data) {
            setSettings({ ...serverSettings });
            setHasChanges(false);
        }
    }, [data]);

    const updateField = (key: string, value: any) => {
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
        setSettings({ ...serverSettings });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Settings</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
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
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Globe size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Locale</h3>
                    </div>
                    <div className="space-y-4">
                        <SelectField label="Currency" value={settings.currency ?? "INR"} onChange={(v) => updateField("currency", v)} options={CURRENCY_OPTIONS} />
                        <SelectField label="Language" value={settings.language ?? "en"} onChange={(v) => updateField("language", v)} options={LANGUAGE_OPTIONS} />
                        <SelectField label="Timezone" value={settings.timezone ?? "Asia/Kolkata"} onChange={(v) => updateField("timezone", v)} options={TIMEZONE_OPTIONS} />
                        <SelectField label="Date Format" value={settings.dateFormat ?? "DD/MM/YYYY"} onChange={(v) => updateField("dateFormat", v)} options={DATE_FORMAT_OPTIONS} />
                        <SelectField label="Time Format" value={settings.timeFormat ?? "12h"} onChange={(v) => updateField("timeFormat", v)} options={TIME_FORMAT_OPTIONS} />
                        <SelectField label="Number Format" value={settings.numberFormat ?? "en-IN"} onChange={(v) => updateField("numberFormat", v)} options={NUMBER_FORMAT_OPTIONS} />
                    </div>
                </div>

                {/* Compliance */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Shield size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Compliance</h3>
                    </div>
                    <div className="space-y-3">
                        <Toggle label="India Compliance" description="Enable India-specific statutory compliance" checked={settings.indiaCompliance ?? false} onChange={(v) => updateField("indiaCompliance", v)} />
                        <Toggle label="GDPR Mode" description="Enable GDPR data protection features" checked={settings.gdprMode ?? false} onChange={(v) => updateField("gdprMode", v)} />
                        <Toggle label="Audit Trail" description="Maintain detailed audit trail for all changes" checked={settings.auditTrail ?? true} onChange={(v) => updateField("auditTrail", v)} />
                    </div>
                </div>

                {/* Portal */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Monitor size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Portal</h3>
                    </div>
                    <div className="space-y-3">
                        <Toggle label="Web App" description="Enable web portal access" checked={settings.webApp ?? true} onChange={(v) => updateField("webApp", v)} />
                        <Toggle label="Mobile App" description="Enable mobile app access" checked={settings.mobileApp ?? true} onChange={(v) => updateField("mobileApp", v)} />
                        <Toggle label="System App" description="Enable desktop system app" checked={settings.systemApp ?? false} onChange={(v) => updateField("systemApp", v)} />
                        <Toggle label="Biometric Login" description="Enable biometric authentication" checked={settings.biometric ?? false} onChange={(v) => updateField("biometric", v)} />
                    </div>
                </div>

                {/* Integrations */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center"><Plug size={16} className="text-primary-600" /></div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Integrations</h3>
                    </div>
                    <div className="space-y-3">
                        <Toggle label="Bank Integration" description="Enable bank account integration" checked={settings.bankIntegration ?? false} onChange={(v) => updateField("bankIntegration", v)} />
                        <Toggle label="RazorpayX Payout" description="Enable RazorpayX for payroll disbursement" checked={settings.razorpayEnabled ?? false} onChange={(v) => updateField("razorpayEnabled", v)} />
                        <Toggle label="Email Notifications" description="Send email alerts for key events" checked={settings.emailNotif ?? true} onChange={(v) => updateField("emailNotif", v)} />
                        <Toggle label="WhatsApp Notifications" description="Send WhatsApp alerts" checked={settings.whatsapp ?? false} onChange={(v) => updateField("whatsapp", v)} />
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
