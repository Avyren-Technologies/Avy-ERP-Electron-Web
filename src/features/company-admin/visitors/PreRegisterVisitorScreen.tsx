import { useState, useRef, useCallback } from "react";
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
    Briefcase,
    Upload,
    ImageIcon,
    X,
} from "lucide-react";
import { useCreateVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useVisitorTypes, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { showSuccess, showApiError } from "@/lib/toast";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { EmployeePicker } from "@/components/ui/EmployeePicker";
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

async function processVisitorPhotoFile(file: File): Promise<string> {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Please upload a JPEG, PNG, or WebP image.");
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
        throw new Error("Image must be 5 MB or smaller.");
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const maxDim = 480;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
                const scale = maxDim / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to process image."));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Invalid image file."));
        img.src = dataUrl;
    });
}

function VisitorPhotoUpload({
    photo,
    onPhotoChange,
    isProcessing,
    onProcessingChange,
}: {
    photo: string | null;
    onPhotoChange: (dataUrl: string | null) => void;
    isProcessing: boolean;
    onProcessingChange: (v: boolean) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback(async (file: File | undefined) => {
        if (!file) return;
        onProcessingChange(true);
        try {
            const dataUrl = await processVisitorPhotoFile(file);
            onPhotoChange(dataUrl);
        } catch (err) {
            showApiError(err);
        } finally {
            onProcessingChange(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [onPhotoChange, onProcessingChange]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        void handleFile(file);
    }, [handleFile]);

    if (photo) {
        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-primary-200/60 dark:border-primary-800/40 bg-primary-50/30 dark:bg-primary-900/10">
                <img
                    src={photo}
                    alt="Visitor"
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-white dark:border-neutral-800 shadow-md shrink-0"
                />
                <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-sm font-semibold text-primary-950 dark:text-white">Photo uploaded</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        This photo will be used for gate identification when the visitor arrives.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            Replace
                        </button>
                        <button
                            type="button"
                            onClick={() => onPhotoChange(null)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50 dark:bg-danger-900/20 text-danger-600 text-xs font-bold hover:bg-danger-100 dark:hover:bg-danger-900/30 transition-colors disabled:opacity-50"
                        >
                            <X size={12} />
                            Remove
                        </button>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => void handleFile(e.target.files?.[0])}
                />
            </div>
        );
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={onDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all ${
                isDragging
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-primary-300 dark:hover:border-primary-700"
            }`}
        >
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragging ? "bg-primary-100 dark:bg-primary-900/40" : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"}`}>
                    {isProcessing ? (
                        <Loader2 size={24} className="animate-spin text-primary-500" />
                    ) : (
                        <ImageIcon size={24} className="text-primary-500" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-primary-950 dark:text-white">
                        {isProcessing ? "Processing image..." : "Upload visitor photo"}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                        Drag and drop an image here, or browse from your device. JPEG, PNG, or WebP up to 5 MB.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm shadow-primary-500/20 transition-colors disabled:opacity-50"
                >
                    <Upload size={16} />
                    Choose file
                </button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
            />
        </div>
    );
}

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
    const locationsQuery = useCompanyLocations();

    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [countryCode, setCountryCode] = useState("+91");
    const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
    const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

    const visitorTypes: any[] = visitorTypesQuery.data?.data ?? [];
    const gates: any[] = gatesQuery.data?.data ?? [];
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];

    const filteredGates = gates.filter((g: any) => !form.plantId || g.plantId === form.plantId);

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

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
                    <EmployeePicker
                        label="Host Employee"
                        value={form.hostEmployeeId || null}
                        onChange={(id) => updateField("hostEmployeeId", id ?? "")}
                        placeholder="Search employee..."
                        status="ACTIVE"
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
                    Optional — upload a photo of the visitor for gate security (they do not need to be present now).
                </p>
                <VisitorPhotoUpload
                    photo={visitorPhoto}
                    onPhotoChange={setVisitorPhoto}
                    isProcessing={isPhotoProcessing}
                    onProcessingChange={setIsPhotoProcessing}
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
                        disabled={saving || isPhotoProcessing || !form.visitorName || !form.visitorMobile || !form.visitorTypeId || !form.purpose || !form.expectedDate || !form.plantId}
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
