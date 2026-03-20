import { useState, useEffect } from "react";
import {
    Building2,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBankConfig } from "@/features/company-admin/api/use-payroll-queries";
import { useUpdateBankConfig } from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
        </div>
    );
}

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button type="button" onClick={() => onChange(!checked)} className={cn("w-10 h-6 rounded-full transition-colors relative", checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

const PAYMENT_MODES = [
    { value: "neft", label: "NEFT" },
    { value: "rtgs", label: "RTGS" },
    { value: "imps", label: "IMPS" },
    { value: "upi", label: "UPI" },
    { value: "cheque", label: "Cheque" },
];

const FILE_FORMATS = [
    { value: "csv", label: "CSV" },
    { value: "txt", label: "Text (Bank Format)" },
    { value: "xlsx", label: "Excel" },
    { value: "xml", label: "XML" },
];

/* ── Screen ── */

export function BankConfigScreen() {
    const { data, isLoading, isError } = useBankConfig();
    const updateMutation = useUpdateBankConfig();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverConfig = (data as any)?.data ?? {};

    useEffect(() => {
        if ((data as any)?.data) {
            setConfig({ ...serverConfig });
            setHasChanges(false);
        }
    }, [data]);

    const update = (key: string, value: any) => { setConfig((p) => ({ ...p, [key]: value })); setHasChanges(true); };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(config);
            showSuccess("Bank Config Saved", "Bank configuration has been updated.");
            setHasChanges(false);
        } catch (err) { showApiError(err); }
    };

    const handleReset = () => { setConfig({ ...serverConfig }); setHasChanges(false); };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Bank Configuration</h1></div>
                <SkeletonCard />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load bank configuration</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Bank Configuration</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure salary disbursement bank details and payment mode</p>
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

            {/* Bank Details Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden max-w-2xl">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Building2 size={16} className="text-primary-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Bank Account Details</h3>
                    </div>
                    <div className="space-y-4">
                        <FormField label="Bank Name" value={config.bankName ?? ""} onChange={(v) => update("bankName", v)} placeholder="e.g. HDFC Bank" />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Account Number" value={config.accountNumber ?? ""} onChange={(v) => update("accountNumber", v)} placeholder="e.g. 50100123456789" />
                            <FormField label="IFSC Code" value={config.ifscCode ?? ""} onChange={(v) => update("ifscCode", v)} placeholder="e.g. HDFC0001234" />
                        </div>
                        <FormField label="Branch" value={config.branch ?? ""} onChange={(v) => update("branch", v)} placeholder="e.g. MG Road, Bangalore" />
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField label="Payment Mode" value={config.paymentMode ?? "neft"} onChange={(v) => update("paymentMode", v)} options={PAYMENT_MODES} />
                            <SelectField label="File Format" value={config.fileFormat ?? "csv"} onChange={(v) => update("fileFormat", v)} options={FILE_FORMATS} />
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                            <ToggleSwitch label="Auto-Push Salary to Bank" checked={config.autoPush ?? false} onChange={(v) => update("autoPush", v)} />
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">When enabled, salary disbursement files will be automatically pushed to the bank after payroll approval.</p>
                        </div>
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
