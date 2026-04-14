import { useState } from "react";
import {
    Loader2,
    ArrowLeft,
    Calendar,
    Clock,
    Building2,
    User,
    Phone,
    Mail,
    FileText,
    Car,
} from "lucide-react";
import { useCreateVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useVisitorTypes, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    icon: Icon,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    icon?: any;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? "pl-10" : "px-3"} pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all`}
                />
            </div>
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
            />
        </div>
    );
}

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

/* ── Constants ── */

const PURPOSE_OPTIONS = [
    { value: "MEETING", label: "Meeting" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "DELIVERY", label: "Delivery" },
    { value: "MAINTENANCE", label: "Maintenance / Repair" },
    { value: "AUDIT", label: "Audit / Inspection" },
    { value: "VENDOR_VISIT", label: "Vendor Visit" },
    { value: "CLIENT_VISIT", label: "Client Visit" },
    { value: "TRAINING", label: "Training" },
    { value: "PERSONAL", label: "Personal" },
    { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
    visitorName: "",
    visitorMobile: "",
    visitorEmail: "",
    visitorCompany: "",
    visitorTypeId: "",
    purpose: "",
    visitDate: "",
    expectedArrival: "",
    expectedDuration: "",
    hostEmployeeId: "",
    hostName: "",
    gateId: "",
    vehicleNumber: "",
    instructions: "",
    meetingReference: "",
};

/* ── Screen ── */

export function PreRegisterVisitorScreen() {
    const createMutation = useCreateVisit();
    const visitorTypesQuery = useVisitorTypes();
    const gatesQuery = useGates();

    const [form, setForm] = useState({ ...EMPTY_FORM });

    const visitorTypes: any[] = visitorTypesQuery.data?.data ?? [];
    const gates: any[] = gatesQuery.data?.data ?? [];

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    const handleSubmit = async () => {
        try {
            const payload: any = {
                visitorName: form.visitorName,
                visitorMobile: form.visitorMobile || undefined,
                visitorEmail: form.visitorEmail || undefined,
                visitorCompany: form.visitorCompany || undefined,
                visitorTypeId: form.visitorTypeId || undefined,
                purpose: form.purpose || undefined,
                visitDate: form.visitDate || undefined,
                expectedArrival:
                    form.visitDate && form.expectedArrival
                        ? `${form.visitDate}T${form.expectedArrival}:00`
                        : undefined,
                expectedDuration: form.expectedDuration ? Number(form.expectedDuration) : undefined,
                hostEmployeeId: form.hostEmployeeId || undefined,
                hostName: form.hostName || undefined,
                gateId: form.gateId || undefined,
                vehicleNumber: form.vehicleNumber || undefined,
                instructions: form.instructions || undefined,
                meetingReference: form.meetingReference || undefined,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Visitor Pre-Registered", `${form.visitorName} has been registered successfully.`);
            setForm({ ...EMPTY_FORM });
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <a
                    href="/app/company/visitors/dashboard"
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                >
                    <ArrowLeft size={18} />
                </a>
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Pre-Register Visitor</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Create a pre-registration for an expected visitor</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 space-y-4 max-w-3xl">
                <SectionLabel title="Visitor Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Visitor Name" value={form.visitorName} onChange={(v) => updateField("visitorName", v)} placeholder="Full name" required icon={User} />
                    <FormField label="Mobile Number" value={form.visitorMobile} onChange={(v) => updateField("visitorMobile", v)} placeholder="+91 98765 43210" icon={Phone} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Email" value={form.visitorEmail} onChange={(v) => updateField("visitorEmail", v)} placeholder="visitor@company.com" type="email" icon={Mail} />
                    <FormField label="Company / Organisation" value={form.visitorCompany} onChange={(v) => updateField("visitorCompany", v)} placeholder="e.g. Acme Corp" icon={Building2} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        label="Visitor Type"
                        value={form.visitorTypeId}
                        onChange={(v) => updateField("visitorTypeId", v)}
                        options={visitorTypes.map((t: any) => ({ value: t.id, label: t.name }))}
                        placeholder="Select type..."
                        required
                    />
                    <SelectField
                        label="Purpose of Visit"
                        value={form.purpose}
                        onChange={(v) => updateField("purpose", v)}
                        options={PURPOSE_OPTIONS}
                        placeholder="Select purpose..."
                        required
                    />
                </div>

                <SectionLabel title="Visit Schedule" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Visit Date" value={form.visitDate} onChange={(v) => updateField("visitDate", v)} type="date" required icon={Calendar} />
                    <FormField label="Expected Arrival" value={form.expectedArrival} onChange={(v) => updateField("expectedArrival", v)} type="time" icon={Clock} />
                    <FormField label="Duration (minutes)" value={form.expectedDuration} onChange={(v) => updateField("expectedDuration", v)} type="number" placeholder="e.g. 60" />
                </div>

                <SectionLabel title="Host & Location" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Host Employee Name" value={form.hostName} onChange={(v) => updateField("hostName", v)} placeholder="Search or enter host name" icon={User} />
                    <SelectField
                        label="Entry Gate"
                        value={form.gateId}
                        onChange={(v) => updateField("gateId", v)}
                        options={gates.map((g: any) => ({ value: g.id, label: `${g.name}${g.plant?.name ? ` (${g.plant.name})` : ""}` }))}
                        placeholder="Select gate..."
                    />
                </div>

                <SectionLabel title="Additional Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Vehicle Number" value={form.vehicleNumber} onChange={(v) => updateField("vehicleNumber", v)} placeholder="e.g. KA-01-AB-1234" icon={Car} />
                    <FormField label="Meeting Reference" value={form.meetingReference} onChange={(v) => updateField("meetingReference", v)} placeholder="Meeting ID or ref" icon={FileText} />
                </div>
                <TextAreaField
                    label="Special Instructions"
                    value={form.instructions}
                    onChange={(v) => updateField("instructions", v)}
                    placeholder="Any specific instructions for the visitor or gate security..."
                />

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <a
                        href="/app/company/visitors/dashboard"
                        className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center"
                    >
                        Cancel
                    </a>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.visitorName}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Registering..." : "Pre-Register Visitor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
