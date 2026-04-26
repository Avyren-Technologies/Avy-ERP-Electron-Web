import { useState, useRef } from "react";
import {
    Loader2,
    ArrowLeft,
    Calendar,
    Clock,
    Building2,
    User,
    Mail,
    FileText,
    Car,
    MapPin,
    Briefcase,
    Camera,
} from "lucide-react";
import { useCreateVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useVisitorTypes, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { showSuccess, showApiError } from "@/lib/toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";

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
    { value: "SITE_TOUR", label: "Site Tour" },
    { value: "PERSONAL", label: "Personal" },
    { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
    visitorName: "",
    visitorMobile: "",
    visitorEmail: "",
    visitorCompany: "",
    visitorDesignation: "",
    visitorTypeId: "",
    purpose: "",
    expectedDate: "",
    expectedTime: "",
    expectedDurationMinutes: "",
    hostEmployeeId: "",
    plantId: "",
    gateId: "",
    vehicleRegNumber: "",
    specialInstructions: "",
    meetingRef: "",
};

/* ── Screen ── */

export function PreRegisterVisitorScreen() {
    const createMutation = useCreateVisit();
    const visitorTypesQuery = useVisitorTypes();
    const gatesQuery = useGates();
    const employeesQuery = useEmployees({ limit: 500 });
    const locationsQuery = useCompanyLocations();

    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [countryCode, setCountryCode] = useState("+91");
    const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const visitorTypes: any[] = visitorTypesQuery.data?.data ?? [];
    const gates: any[] = gatesQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];

    const filteredGates = gates.filter((g: any) => !form.plantId || g.plantId === form.plantId);

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    /* ── Webcam functions ── */

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 320 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            showApiError(err);
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setVisitorPhoto(dataUrl);
        stopCamera();
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const removePhoto = () => {
        setVisitorPhoto(null);
    };

    const handleSubmit = async () => {
        try {
            const payload: any = {
                visitorName: form.visitorName,
                visitorMobile: form.visitorMobile ? `${countryCode}${form.visitorMobile}` : undefined,
                visitorEmail: form.visitorEmail || undefined,
                visitorCompany: form.visitorCompany || undefined,
                visitorDesignation: form.visitorDesignation || undefined,
                visitorTypeId: form.visitorTypeId || undefined,
                purpose: form.purpose || undefined,
                expectedDate: form.expectedDate || undefined,
                expectedTime: form.expectedTime || undefined,
                expectedDurationMinutes: form.expectedDurationMinutes ? Number(form.expectedDurationMinutes) : undefined,
                hostEmployeeId: form.hostEmployeeId || undefined,
                plantId: form.plantId || undefined,
                gateId: form.gateId || undefined,
                vehicleRegNumber: form.vehicleRegNumber || undefined,
                specialInstructions: form.specialInstructions || undefined,
                meetingRef: form.meetingRef || undefined,
                visitorPhoto: visitorPhoto || undefined,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Visitor Pre-Registered", `${form.visitorName} has been registered successfully.`);
            setForm({ ...EMPTY_FORM });
            setVisitorPhoto(null);
            setCountryCode("+91");
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
                    <PhoneInput
                        label="Mobile Number"
                        countryCode={countryCode}
                        phone={form.visitorMobile}
                        onCountryCodeChange={setCountryCode}
                        onPhoneChange={(v) => updateField("visitorMobile", v)}
                        required
                    />
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
                    <FormField label="Expected Date" value={form.expectedDate} onChange={(v) => updateField("expectedDate", v)} type="date" required icon={Calendar} />
                    <FormField label="Expected Time" value={form.expectedTime} onChange={(v) => updateField("expectedTime", v)} type="time" icon={Clock} />
                    <FormField label="Duration (minutes)" value={form.expectedDurationMinutes} onChange={(v) => updateField("expectedDurationMinutes", v)} type="number" placeholder="e.g. 60" />
                </div>

                <SectionLabel title="Host & Location" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableSelect
                        label="Host Employee"
                        value={form.hostEmployeeId}
                        onChange={(v) => updateField("hostEmployeeId", v)}
                        options={employees.map((e: any) => ({
                            value: e.id,
                            label: `${e.firstName} ${e.lastName}`,
                            sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                        }))}
                        placeholder="Search employee..."
                    />
                    <SearchableSelect
                        label="Location (Plant)"
                        value={form.plantId}
                        onChange={(v) => updateField("plantId", v)}
                        options={locations.map((l: any) => ({
                            value: l.id,
                            label: l.name,
                            sublabel: l.city ? `${l.city}, ${l.state ?? ''}` : undefined,
                        }))}
                        placeholder="Select location..."
                        required
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        label="Entry Gate"
                        value={form.gateId}
                        onChange={(v) => updateField("gateId", v)}
                        options={filteredGates.map((g: any) => ({ value: g.id, label: `${g.name}${g.plant?.name ? ` (${g.plant.name})` : ""}` }))}
                        placeholder="Select gate..."
                    />
                    <FormField label="Designation" value={form.visitorDesignation} onChange={(v) => updateField("visitorDesignation", v)} placeholder="Visitor designation" icon={Briefcase} />
                </div>

                <SectionLabel title="Additional Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Vehicle Reg Number" value={form.vehicleRegNumber} onChange={(v) => updateField("vehicleRegNumber", v)} placeholder="e.g. KA-01-AB-1234" icon={Car} />
                    <FormField label="Meeting Reference" value={form.meetingRef} onChange={(v) => updateField("meetingRef", v)} placeholder="Meeting ID or ref" icon={FileText} />
                </div>
                <TextAreaField
                    label="Special Instructions"
                    value={form.specialInstructions}
                    onChange={(v) => updateField("specialInstructions", v)}
                    placeholder="Any specific instructions for the visitor or gate security..."
                />

                <SectionLabel title="Visitor Photo" />
                <div className="space-y-3">
                    {visitorPhoto ? (
                        <div className="flex items-center gap-4">
                            <img src={visitorPhoto} alt="Visitor" className="w-24 h-24 rounded-full object-cover border-2 border-primary-200" />
                            <div className="flex gap-2">
                                <button type="button" onClick={startCamera} className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-bold hover:bg-primary-100 transition-colors">Retake</button>
                                <button type="button" onClick={removePhoto} className="px-3 py-1.5 rounded-lg bg-danger-50 text-danger-600 text-xs font-bold hover:bg-danger-100 transition-colors">Remove</button>
                            </div>
                        </div>
                    ) : showCamera ? (
                        <div className="space-y-3">
                            <video ref={videoRef} className="w-80 h-60 rounded-xl bg-black object-cover" autoPlay muted />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2">
                                <button type="button" onClick={capturePhoto} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors">Capture</button>
                                <button type="button" onClick={stopCamera} className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-bold hover:bg-neutral-50 transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={startCamera} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 text-primary-600 text-sm font-semibold hover:bg-primary-100/50 transition-colors w-full justify-center">
                            <Camera size={18} />
                            Open Webcam to Capture Photo
                        </button>
                    )}
                </div>

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
                        disabled={saving || !form.visitorName || !form.visitorMobile || !form.visitorTypeId || !form.purpose || !form.expectedDate || !form.plantId}
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
