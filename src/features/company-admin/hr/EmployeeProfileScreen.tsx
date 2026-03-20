import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Briefcase,
    Wallet,
    Landmark,
    FileText,
    Clock,
    Upload,
    Download,
    Trash2,
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useEmployee,
    useEmployees,
    useDepartments,
    useDesignations,
    useGrades,
    useEmployeeTypes,
    useCostCentres,
    useEmployeeDocuments,
    useEmployeeTimeline,
} from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateEmployee,
    useUpdateEmployee,
    useUpdateEmployeeStatus,
    useDeleteDocument,
} from "@/features/company-admin/api/use-hr-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import type { EmployeeStatus } from "@/lib/api/hr";

/* ── Form Atoms ── */

function FormField({ label, value, onChange, placeholder, type = "text", disabled = false, mono = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; mono?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                    disabled && "opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/50",
                    mono && "font-mono"
                )}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options, placeholder, disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all",
                    disabled && "opacity-60 cursor-not-allowed"
                )}
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function RadioGroup({ label, value, onChange, options, disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{label}</label>
            <div className="flex flex-wrap gap-3">
                {options.map((o) => (
                    <label
                        key={o.value}
                        className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-all",
                            value === o.value
                                ? "bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400"
                                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300",
                            disabled && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <input
                            type="radio"
                            value={o.value}
                            checked={value === o.value}
                            onChange={() => onChange(o.value)}
                            disabled={disabled}
                            className="sr-only"
                        />
                        <span className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            value === o.value ? "border-primary-600" : "border-neutral-300 dark:border-neutral-600"
                        )}>
                            {value === o.value && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                        </span>
                        {o.label}
                    </label>
                ))}
            </div>
        </div>
    );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string; size?: number }> }) {
    return (
        <div className="flex items-center gap-2.5 mb-4 mt-2">
            <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-primary-600" />
            </div>
            <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
        </div>
    );
}

/* ── Tab definitions ── */

const TABS = [
    { key: "personal", label: "Personal", icon: User },
    { key: "professional", label: "Professional", icon: Briefcase },
    { key: "salary", label: "Salary", icon: Wallet },
    { key: "bank", label: "Bank", icon: Landmark },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "timeline", label: "Timeline", icon: Clock },
] as const;

type TabKey = typeof TABS[number]["key"];

/* ── Empty form state ── */

const EMPTY_PERSONAL = {
    firstName: "", middleName: "", lastName: "",
    dob: "", gender: "", maritalStatus: "",
    bloodGroup: "", fatherName: "", motherName: "",
    nationality: "Indian", religion: "", category: "",
    personalMobile: "", altMobile: "", personalEmail: "", officialEmail: "",
    currentAddress: { line1: "", line2: "", city: "", state: "", pin: "" },
    permanentAddress: { line1: "", line2: "", city: "", state: "", pin: "" },
    sameAsCurrent: false,
    emergencyName: "", emergencyRelation: "", emergencyMobile: "",
};

const EMPTY_PROFESSIONAL = {
    joiningDate: "", employeeTypeId: "", departmentId: "",
    designationId: "", gradeId: "",
    reportingManagerId: "", functionalManagerId: "",
    workType: "On-site", shiftId: "", locationId: "",
    costCentreId: "", noticePeriod: "", probationEndDate: "",
};

const EMPTY_SALARY = {
    annualCTC: "", paymentMode: "NEFT",
    salaryStructure: null as any,
};

const EMPTY_BANK = {
    ifscCode: "", bankName: "", branchName: "",
    accountNumber: "", confirmAccountNumber: "",
    accountType: "Savings",
};

const EMPTY_DOCUMENTS = {
    pan: "", aadhaar: "", uan: "", esiIp: "",
    passport: "", dl: "", voterId: "",
};

/* ── Main Screen ── */

export function EmployeeProfileScreen() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isNew = id === "new";
    const startInEdit = isNew || searchParams.get("edit") === "true";

    const [activeTab, setActiveTab] = useState<TabKey>("personal");
    const [editing, setEditing] = useState(startInEdit);

    // Form states — one per tab so data is preserved when switching
    const [personal, setPersonal] = useState({ ...EMPTY_PERSONAL });
    const [professional, setProfessional] = useState({ ...EMPTY_PROFESSIONAL });
    const [salary, setSalary] = useState({ ...EMPTY_SALARY });
    const [bank, setBank] = useState({ ...EMPTY_BANK });
    const [documents, setDocuments] = useState({ ...EMPTY_DOCUMENTS });

    // Queries
    const employeeQuery = useEmployee(isNew ? "" : id!);
    const departmentsQuery = useDepartments();
    const designationsQuery = useDesignations();
    const gradesQuery = useGrades();
    const employeeTypesQuery = useEmployeeTypes();
    const costCentresQuery = useCostCentres();
    const employeesQuery = useEmployees({ limit: 500 });
    const docsQuery = useEmployeeDocuments(isNew ? "" : id!);
    const timelineQuery = useEmployeeTimeline(isNew ? "" : id!);

    // Mutations
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const statusMutation = useUpdateEmployeeStatus();
    const deleteDocMutation = useDeleteDocument();

    // Select option mappers
    const deptOptions = useMemo(() => (departmentsQuery.data?.data ?? []).map((d: any) => ({ value: d.id, label: d.name })), [departmentsQuery.data]);
    const desigOptions = useMemo(() => (designationsQuery.data?.data ?? []).map((d: any) => ({ value: d.id, label: d.name })), [designationsQuery.data]);
    const gradeOptions = useMemo(() => (gradesQuery.data?.data ?? []).map((g: any) => ({ value: g.id, label: g.name })), [gradesQuery.data]);
    const empTypeOptions = useMemo(() => (employeeTypesQuery.data?.data ?? []).map((t: any) => ({ value: t.id, label: t.name })), [employeeTypesQuery.data]);
    const costCentreOptions = useMemo(() => (costCentresQuery.data?.data ?? []).map((c: any) => ({ value: c.id, label: `${c.code ?? ""} - ${c.name}` })), [costCentresQuery.data]);
    const managerOptions = useMemo(() => (employeesQuery.data?.data ?? []).filter((e: any) => e.id !== id).map((e: any) => ({ value: e.id, label: [e.firstName, e.lastName].filter(Boolean).join(" ") || e.officialEmail || e.id })), [employeesQuery.data, id]);

    // Populate from API
    useEffect(() => {
        if (isNew || !employeeQuery.data?.data) return;
        const emp: any = employeeQuery.data.data;

        setPersonal({
            firstName: emp.firstName ?? "",
            middleName: emp.middleName ?? "",
            lastName: emp.lastName ?? "",
            dob: emp.dob ?? "",
            gender: emp.gender ?? "",
            maritalStatus: emp.maritalStatus ?? "",
            bloodGroup: emp.bloodGroup ?? "",
            fatherName: emp.fatherName ?? "",
            motherName: emp.motherName ?? "",
            nationality: emp.nationality ?? "Indian",
            religion: emp.religion ?? "",
            category: emp.category ?? "",
            personalMobile: emp.personalMobile ?? "",
            altMobile: emp.altMobile ?? "",
            personalEmail: emp.personalEmail ?? "",
            officialEmail: emp.officialEmail ?? "",
            currentAddress: {
                line1: emp.currentAddress?.line1 ?? "",
                line2: emp.currentAddress?.line2 ?? "",
                city: emp.currentAddress?.city ?? "",
                state: emp.currentAddress?.state ?? "",
                pin: emp.currentAddress?.pin ?? "",
            },
            permanentAddress: {
                line1: emp.permanentAddress?.line1 ?? "",
                line2: emp.permanentAddress?.line2 ?? "",
                city: emp.permanentAddress?.city ?? "",
                state: emp.permanentAddress?.state ?? "",
                pin: emp.permanentAddress?.pin ?? "",
            },
            sameAsCurrent: emp.sameAsCurrent ?? false,
            emergencyName: emp.emergencyName ?? "",
            emergencyRelation: emp.emergencyRelation ?? "",
            emergencyMobile: emp.emergencyMobile ?? "",
        });

        setProfessional({
            joiningDate: emp.joiningDate ?? "",
            employeeTypeId: emp.employeeTypeId ?? "",
            departmentId: emp.departmentId ?? "",
            designationId: emp.designationId ?? "",
            gradeId: emp.gradeId ?? "",
            reportingManagerId: emp.reportingManagerId ?? "",
            functionalManagerId: emp.functionalManagerId ?? "",
            workType: emp.workType ?? "On-site",
            shiftId: emp.shiftId ?? "",
            locationId: emp.locationId ?? "",
            costCentreId: emp.costCentreId ?? "",
            noticePeriod: emp.noticePeriod?.toString() ?? "",
            probationEndDate: emp.probationEndDate ?? "",
        });

        setSalary({
            annualCTC: emp.annualCTC?.toString() ?? "",
            paymentMode: emp.paymentMode ?? "NEFT",
            salaryStructure: emp.salaryStructure ?? null,
        });

        setBank({
            ifscCode: emp.ifscCode ?? "",
            bankName: emp.bankName ?? "",
            branchName: emp.branchName ?? "",
            accountNumber: emp.accountNumber ?? "",
            confirmAccountNumber: emp.accountNumber ?? "",
            accountType: emp.accountType ?? "Savings",
        });

        setDocuments({
            pan: emp.pan ?? "",
            aadhaar: emp.aadhaar ?? "",
            uan: emp.uan ?? "",
            esiIp: emp.esiIp ?? "",
            passport: emp.passport ?? "",
            dl: emp.dl ?? "",
            voterId: emp.voterId ?? "",
        });
    }, [employeeQuery.data, isNew]);

    // Helpers
    const updatePersonal = (key: string, value: any) => setPersonal((p) => ({ ...p, [key]: value }));
    const updateAddress = (which: "currentAddress" | "permanentAddress", key: string, value: string) => {
        setPersonal((p) => ({ ...p, [which]: { ...p[which], [key]: value } }));
    };
    const updateProfessional = (key: string, value: any) => setProfessional((p) => ({ ...p, [key]: value }));
    const updateSalary = (key: string, value: any) => setSalary((p) => ({ ...p, [key]: value }));
    const updateBank = (key: string, value: any) => setBank((p) => ({ ...p, [key]: value }));
    const updateDocuments = (key: string, value: any) => setDocuments((p) => ({ ...p, [key]: value }));

    const saving = createMutation.isPending || updateMutation.isPending;

    const handleSave = async () => {
        const payload = {
            ...personal,
            ...professional,
            ...salary,
            ...bank,
            ...documents,
            noticePeriod: professional.noticePeriod ? parseInt(professional.noticePeriod) : undefined,
            annualCTC: salary.annualCTC ? parseFloat(salary.annualCTC) : undefined,
        };
        try {
            if (isNew) {
                const result = await createMutation.mutateAsync(payload);
                showSuccess("Employee Created", `${personal.firstName} ${personal.lastName} has been added.`);
                const newId = (result as any)?.data?.id;
                if (newId) {
                    navigate(`/app/company/hr/employees/${newId}`, { replace: true });
                } else {
                    navigate("/app/company/hr/employees", { replace: true });
                }
            } else {
                await updateMutation.mutateAsync({ id: id!, data: payload });
                showSuccess("Employee Updated", `${personal.firstName} ${personal.lastName} has been saved.`);
                setEditing(false);
            }
        } catch (err) {
            showApiError(err);
        }
    };

    const handleStatusAction = async (status: EmployeeStatus) => {
        if (!id || isNew) return;
        try {
            await statusMutation.mutateAsync({ id, status });
            showSuccess("Status Updated", `Employee status changed to ${status}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!id || isNew) return;
        try {
            await deleteDocMutation.mutateAsync({ employeeId: id, documentId: docId });
            showSuccess("Document Deleted", "Document has been removed.");
        } catch (err) {
            showApiError(err);
        }
    };

    const formatDate = (d: string | null | undefined) => {
        if (!d) return "\u2014";
        return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatDateTime = (d: string | null | undefined) => {
        if (!d) return "\u2014";
        return new Date(d).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    const maskAadhaar = (val: string) => {
        if (!val || val.length < 4) return val;
        return "XXXX XXXX " + val.slice(-4);
    };

    // Loading state
    if (!isNew && employeeQuery.isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </button>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Loading...</h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    if (!isNew && (employeeQuery.isError || !employeeQuery.data)) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <User className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load employee</p>
                <p className="text-sm text-neutral-500">Please try again later.</p>
                <button onClick={() => navigate(-1)} className="text-primary-600 font-semibold text-sm hover:underline">Go Back</button>
            </div>
        );
    }

    const emp: any = employeeQuery.data?.data ?? {};
    const empDocs: any[] = docsQuery.data?.data ?? [];
    const empTimeline: any[] = timelineQuery.data?.data ?? [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/app/company/hr/employees")} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                            {isNew ? "New Employee" : `${personal.firstName || ""} ${personal.lastName || ""}`.trim() || "Employee"}
                        </h1>
                        {!isNew && emp.employeeCode && (
                            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono text-sm">{emp.employeeCode}</p>
                        )}
                    </div>
                </div>
                {!isNew && !editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Briefcase className="w-4 h-4" />
                        Edit Employee
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all",
                                    active
                                        ? "border-primary-600 text-primary-700 dark:text-primary-400"
                                        : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* ── Personal Tab ── */}
                    {activeTab === "personal" && (
                        <div className="space-y-6">
                            {/* Photo placeholder */}
                            <div className="flex items-center gap-6 mb-2">
                                <div className="w-20 h-20 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-2xl font-bold text-accent-700 dark:text-accent-400 relative">
                                    {emp.photoUrl ? (
                                        <img src={emp.photoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        (personal.firstName?.charAt(0) ?? "") + (personal.lastName?.charAt(0) ?? "") || "?"
                                    )}
                                    {editing && (
                                        <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md">
                                            <Camera size={14} />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-primary-950 dark:text-white">
                                        {isNew ? "Profile Photo" : `${personal.firstName} ${personal.lastName}`.trim()}
                                    </p>
                                    <p className="text-xs text-neutral-400">Upload a profile photo (optional)</p>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="First Name" value={personal.firstName} onChange={(v) => updatePersonal("firstName", v)} placeholder="First name" disabled={!editing} />
                                <FormField label="Middle Name" value={personal.middleName} onChange={(v) => updatePersonal("middleName", v)} placeholder="Middle name" disabled={!editing} />
                                <FormField label="Last Name" value={personal.lastName} onChange={(v) => updatePersonal("lastName", v)} placeholder="Last name" disabled={!editing} />
                                <FormField label="Date of Birth" value={personal.dob} onChange={(v) => updatePersonal("dob", v)} type="date" disabled={!editing} />
                                <SelectField label="Gender" value={personal.gender} onChange={(v) => updatePersonal("gender", v)} disabled={!editing} options={[
                                    { value: "Male", label: "Male" },
                                    { value: "Female", label: "Female" },
                                    { value: "Other", label: "Other" },
                                ]} />
                                <SelectField label="Marital Status" value={personal.maritalStatus} onChange={(v) => updatePersonal("maritalStatus", v)} disabled={!editing} options={[
                                    { value: "Single", label: "Single" },
                                    { value: "Married", label: "Married" },
                                    { value: "Divorced", label: "Divorced" },
                                    { value: "Widowed", label: "Widowed" },
                                ]} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField label="Blood Group" value={personal.bloodGroup} onChange={(v) => updatePersonal("bloodGroup", v)} disabled={!editing} options={[
                                    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
                                ].map((b) => ({ value: b, label: b }))} />
                                <FormField label="Father's Name" value={personal.fatherName} onChange={(v) => updatePersonal("fatherName", v)} placeholder="Father's name" disabled={!editing} />
                                <FormField label="Mother's Name" value={personal.motherName} onChange={(v) => updatePersonal("motherName", v)} placeholder="Mother's name" disabled={!editing} />
                                <FormField label="Nationality" value={personal.nationality} onChange={(v) => updatePersonal("nationality", v)} placeholder="Nationality" disabled={!editing} />
                                <FormField label="Religion" value={personal.religion} onChange={(v) => updatePersonal("religion", v)} placeholder="Religion" disabled={!editing} />
                                <FormField label="Category" value={personal.category} onChange={(v) => updatePersonal("category", v)} placeholder="e.g. General, OBC, SC, ST" disabled={!editing} />
                            </div>

                            {/* Contact */}
                            <SectionTitle title="Contact Information" icon={Phone} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Personal Mobile" value={personal.personalMobile} onChange={(v) => updatePersonal("personalMobile", v)} placeholder="+91 98765 43210" disabled={!editing} />
                                <FormField label="Alternate Mobile" value={personal.altMobile} onChange={(v) => updatePersonal("altMobile", v)} placeholder="Alternate number" disabled={!editing} />
                                <FormField label="Personal Email" value={personal.personalEmail} onChange={(v) => updatePersonal("personalEmail", v)} type="email" placeholder="personal@email.com" disabled={!editing} />
                                <FormField label="Official Email" value={personal.officialEmail} onChange={(v) => updatePersonal("officialEmail", v)} type="email" placeholder="name@company.com" disabled={!editing} />
                            </div>

                            {/* Current Address */}
                            <SectionTitle title="Current Address" icon={MapPin} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <FormField label="Address Line 1" value={personal.currentAddress.line1} onChange={(v) => updateAddress("currentAddress", "line1", v)} placeholder="Street / Area" disabled={!editing} />
                                </div>
                                <div className="md:col-span-2">
                                    <FormField label="Address Line 2" value={personal.currentAddress.line2} onChange={(v) => updateAddress("currentAddress", "line2", v)} placeholder="Landmark" disabled={!editing} />
                                </div>
                                <FormField label="City" value={personal.currentAddress.city} onChange={(v) => updateAddress("currentAddress", "city", v)} placeholder="City" disabled={!editing} />
                                <FormField label="State" value={personal.currentAddress.state} onChange={(v) => updateAddress("currentAddress", "state", v)} placeholder="State" disabled={!editing} />
                                <FormField label="PIN Code" value={personal.currentAddress.pin} onChange={(v) => updateAddress("currentAddress", "pin", v)} placeholder="PIN" mono disabled={!editing} />
                            </div>

                            {/* Permanent Address */}
                            <div className="flex items-center justify-between">
                                <SectionTitle title="Permanent Address" icon={MapPin} />
                                {editing && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={personal.sameAsCurrent}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                updatePersonal("sameAsCurrent", checked);
                                                if (checked) {
                                                    setPersonal((p) => ({ ...p, permanentAddress: { ...p.currentAddress } }));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Same as current</span>
                                    </label>
                                )}
                            </div>
                            {personal.sameAsCurrent && !editing ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-info-50 dark:bg-info-900/20 rounded-xl border border-info-100 dark:border-info-800/50">
                                    <CheckCircle2 size={13} className="text-info-500 flex-shrink-0" />
                                    <p className="text-xs font-semibold text-info-700 dark:text-info-400">Same as current address</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FormField label="Address Line 1" value={personal.permanentAddress.line1} onChange={(v) => updateAddress("permanentAddress", "line1", v)} placeholder="Street / Area" disabled={!editing || personal.sameAsCurrent} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField label="Address Line 2" value={personal.permanentAddress.line2} onChange={(v) => updateAddress("permanentAddress", "line2", v)} placeholder="Landmark" disabled={!editing || personal.sameAsCurrent} />
                                    </div>
                                    <FormField label="City" value={personal.permanentAddress.city} onChange={(v) => updateAddress("permanentAddress", "city", v)} placeholder="City" disabled={!editing || personal.sameAsCurrent} />
                                    <FormField label="State" value={personal.permanentAddress.state} onChange={(v) => updateAddress("permanentAddress", "state", v)} placeholder="State" disabled={!editing || personal.sameAsCurrent} />
                                    <FormField label="PIN Code" value={personal.permanentAddress.pin} onChange={(v) => updateAddress("permanentAddress", "pin", v)} placeholder="PIN" mono disabled={!editing || personal.sameAsCurrent} />
                                </div>
                            )}

                            {/* Emergency Contact */}
                            <SectionTitle title="Emergency Contact" icon={AlertCircle} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField label="Contact Name" value={personal.emergencyName} onChange={(v) => updatePersonal("emergencyName", v)} placeholder="Full name" disabled={!editing} />
                                <FormField label="Relation" value={personal.emergencyRelation} onChange={(v) => updatePersonal("emergencyRelation", v)} placeholder="e.g. Spouse, Parent" disabled={!editing} />
                                <FormField label="Mobile" value={personal.emergencyMobile} onChange={(v) => updatePersonal("emergencyMobile", v)} placeholder="+91 98765 43210" disabled={!editing} />
                            </div>
                        </div>
                    )}

                    {/* ── Professional Tab ── */}
                    {activeTab === "professional" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Joining Date" value={professional.joiningDate} onChange={(v) => updateProfessional("joiningDate", v)} type="date" disabled={!editing} />
                                <SelectField label="Employee Type" value={professional.employeeTypeId} onChange={(v) => updateProfessional("employeeTypeId", v)} options={empTypeOptions} disabled={!editing} placeholder="Select type..." />
                                <SelectField label="Department" value={professional.departmentId} onChange={(v) => updateProfessional("departmentId", v)} options={deptOptions} disabled={!editing} placeholder="Select department..." />
                                <SelectField label="Designation" value={professional.designationId} onChange={(v) => updateProfessional("designationId", v)} options={desigOptions} disabled={!editing} placeholder="Select designation..." />
                                <SelectField label="Grade" value={professional.gradeId} onChange={(v) => updateProfessional("gradeId", v)} options={gradeOptions} disabled={!editing} placeholder="Select grade..." />
                                <SelectField label="Reporting Manager" value={professional.reportingManagerId} onChange={(v) => updateProfessional("reportingManagerId", v)} options={managerOptions} disabled={!editing} placeholder="Search manager..." />
                                <SelectField label="Functional Manager" value={professional.functionalManagerId} onChange={(v) => updateProfessional("functionalManagerId", v)} options={managerOptions} disabled={!editing} placeholder="Search manager..." />
                                <SelectField label="Location" value={professional.locationId} onChange={(v) => updateProfessional("locationId", v)} options={[]} disabled={!editing} placeholder="Select location..." />
                            </div>

                            <RadioGroup
                                label="Work Type"
                                value={professional.workType}
                                onChange={(v) => updateProfessional("workType", v)}
                                options={[
                                    { value: "On-site", label: "On-site" },
                                    { value: "Remote", label: "Remote" },
                                    { value: "Hybrid", label: "Hybrid" },
                                ]}
                                disabled={!editing}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField label="Cost Centre" value={professional.costCentreId} onChange={(v) => updateProfessional("costCentreId", v)} options={costCentreOptions} disabled={!editing} placeholder="Select cost centre..." />
                                <FormField label="Notice Period (days)" value={professional.noticePeriod} onChange={(v) => updateProfessional("noticePeriod", v)} type="number" placeholder="e.g. 90" disabled={!editing} />
                                <FormField label="Probation End Date" value={professional.probationEndDate} onChange={() => {}} type="date" disabled mono />
                            </div>
                        </div>
                    )}

                    {/* ── Salary Tab ── */}
                    {activeTab === "salary" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Annual CTC" value={salary.annualCTC} onChange={(v) => updateSalary("annualCTC", v)} type="number" placeholder="e.g. 1200000" disabled={!editing} />
                            </div>
                            <RadioGroup
                                label="Payment Mode"
                                value={salary.paymentMode}
                                onChange={(v) => updateSalary("paymentMode", v)}
                                options={[
                                    { value: "NEFT", label: "NEFT" },
                                    { value: "IMPS", label: "IMPS" },
                                    { value: "Cheque", label: "Cheque" },
                                ]}
                                disabled={!editing}
                            />

                            {/* Salary Structure Preview */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Salary Structure</label>
                                {salary.salaryStructure ? (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-neutral-100 dark:bg-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase">
                                                    <th className="py-2.5 px-4 text-left font-bold">Component</th>
                                                    <th className="py-2.5 px-4 text-right font-bold">Monthly</th>
                                                    <th className="py-2.5 px-4 text-right font-bold">Annual</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(salary.salaryStructure).map(([key, val]: [string, any]) => (
                                                    <tr key={key} className="border-t border-neutral-200 dark:border-neutral-700">
                                                        <td className="py-2 px-4 text-neutral-700 dark:text-neutral-300 font-medium">{key}</td>
                                                        <td className="py-2 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                                                            {typeof val === "number" ? (val / 12).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "\u2014"}
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">
                                                            {typeof val === "number" ? val.toLocaleString("en-IN") : String(val)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                                        <Wallet size={24} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                                        <p className="text-sm text-neutral-400">No salary structure defined yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Bank Tab ── */}
                    {activeTab === "bank" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="IFSC Code" value={bank.ifscCode} onChange={(v) => updateBank("ifscCode", v.toUpperCase())} placeholder="e.g. SBIN0001234" mono disabled={!editing} />
                                <FormField label="Bank Name" value={bank.bankName} onChange={(v) => updateBank("bankName", v)} placeholder="Auto-filled from IFSC" disabled={!editing} />
                                <FormField label="Branch Name" value={bank.branchName} onChange={(v) => updateBank("branchName", v)} placeholder="Auto-filled from IFSC" disabled={!editing} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Account Number" value={bank.accountNumber} onChange={(v) => updateBank("accountNumber", v)} placeholder="Account number" mono disabled={!editing} />
                                <FormField label="Confirm Account Number" value={bank.confirmAccountNumber} onChange={(v) => updateBank("confirmAccountNumber", v)} placeholder="Re-enter account number" mono disabled={!editing} />
                            </div>
                            {editing && bank.accountNumber && bank.confirmAccountNumber && bank.accountNumber !== bank.confirmAccountNumber && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-200 dark:border-danger-800/50">
                                    <AlertCircle size={14} className="text-danger-500 shrink-0" />
                                    <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">Account numbers do not match</p>
                                </div>
                            )}
                            <RadioGroup
                                label="Account Type"
                                value={bank.accountType}
                                onChange={(v) => updateBank("accountType", v)}
                                options={[
                                    { value: "Savings", label: "Savings" },
                                    { value: "Current", label: "Current" },
                                ]}
                                disabled={!editing}
                            />
                        </div>
                    )}

                    {/* ── Documents Tab ── */}
                    {activeTab === "documents" && (
                        <div className="space-y-6">
                            <SectionTitle title="Statutory IDs" icon={FileText} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="PAN" value={documents.pan} onChange={(v) => updateDocuments("pan", v.toUpperCase())} placeholder="ABCDE1234F" mono disabled={!editing} />
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Aadhaar</label>
                                    <input
                                        type="text"
                                        value={editing ? documents.aadhaar : maskAadhaar(documents.aadhaar)}
                                        onChange={(e) => updateDocuments("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))}
                                        placeholder="1234 5678 9012"
                                        disabled={!editing}
                                        className={cn(
                                            "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                                            !editing && "opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/50"
                                        )}
                                    />
                                </div>
                                <FormField label="UAN" value={documents.uan} onChange={(v) => updateDocuments("uan", v)} placeholder="Universal Account Number" mono disabled={!editing} />
                                <FormField label="ESI IP Number" value={documents.esiIp} onChange={(v) => updateDocuments("esiIp", v)} placeholder="ESI Insurance Number" mono disabled={!editing} />
                                <FormField label="Passport Number" value={documents.passport} onChange={(v) => updateDocuments("passport", v.toUpperCase())} placeholder="Passport" mono disabled={!editing} />
                                <FormField label="Driving Licence" value={documents.dl} onChange={(v) => updateDocuments("dl", v.toUpperCase())} placeholder="DL Number" mono disabled={!editing} />
                                <FormField label="Voter ID" value={documents.voterId} onChange={(v) => updateDocuments("voterId", v.toUpperCase())} placeholder="EPIC Number" mono disabled={!editing} />
                            </div>

                            {/* Uploaded Documents */}
                            {!isNew && (
                                <>
                                    <SectionTitle title="Uploaded Documents" icon={Upload} />
                                    {empDocs.length > 0 ? (
                                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-neutral-100 dark:bg-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                        <th className="py-3 px-4 text-left font-bold">Type</th>
                                                        <th className="py-3 px-4 text-left font-bold">File Name</th>
                                                        <th className="py-3 px-4 text-left font-bold">Date</th>
                                                        <th className="py-3 px-4 text-right font-bold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {empDocs.map((doc: any) => (
                                                        <tr key={doc.id} className="border-t border-neutral-200 dark:border-neutral-700">
                                                            <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{doc.type || doc.documentType || "\u2014"}</td>
                                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{doc.fileName || doc.name || "\u2014"}</td>
                                                            <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs">{formatDate(doc.createdAt ?? doc.uploadedAt)}</td>
                                                            <td className="py-3 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {doc.url && (
                                                                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Download">
                                                                            <Download size={14} />
                                                                        </a>
                                                                    )}
                                                                    {editing && (
                                                                        <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                                            <FileText size={24} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                                            <p className="text-sm text-neutral-400">No documents uploaded yet</p>
                                        </div>
                                    )}
                                    {editing && (
                                        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all">
                                            <Upload size={16} />
                                            Upload Document
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Timeline Tab ── */}
                    {activeTab === "timeline" && (
                        <div className="space-y-1">
                            {isNew ? (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-10 text-center">
                                    <Clock size={28} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-neutral-500">Timeline will appear after the employee is created</p>
                                </div>
                            ) : timelineQuery.isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-primary-500" />
                                </div>
                            ) : empTimeline.length === 0 ? (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-10 text-center">
                                    <Clock size={28} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-neutral-500">No timeline events yet</p>
                                </div>
                            ) : (
                                <div className="relative pl-8">
                                    {/* Vertical line */}
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
                                    {empTimeline.map((event: any, idx: number) => {
                                        const color = EVENT_COLORS[event.type?.toLowerCase()] ?? "bg-neutral-400";
                                        return (
                                            <div key={event.id ?? idx} className="relative mb-6 last:mb-0">
                                                {/* Dot */}
                                                <div className={cn("absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900", color)} />
                                                <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-primary-950 dark:text-white">{event.title || event.action || "Event"}</p>
                                                            {event.description && (
                                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{event.description}</p>
                                                            )}
                                                            {event.performedBy && (
                                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">by {event.performedBy}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-neutral-400 whitespace-nowrap">{formatDateTime(event.timestamp ?? event.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Bar */}
            {(editing || isNew) && (
                <div className="sticky bottom-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 -mx-6 -mb-6 flex items-center justify-between gap-4 rounded-b-2xl">
                    <div className="flex items-center gap-3">
                        {!isNew && (
                            <button
                                onClick={() => setEditing(false)}
                                className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!isNew && (
                            <div className="relative group">
                                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    Status Action
                                    <ChevronDown size={14} />
                                </button>
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl hidden group-hover:block z-10">
                                    <button onClick={() => handleStatusAction("ACTIVE")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-t-xl transition-colors">
                                        Confirm Employee
                                    </button>
                                    <button onClick={() => handleStatusAction("SUSPENDED")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors">
                                        Suspend
                                    </button>
                                    <button onClick={() => handleStatusAction("NOTICE_PERIOD")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-b-xl transition-colors">
                                        Initiate Exit
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? "Saving..." : isNew ? "Save Employee" : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Timeline event colors ── */

const EVENT_COLORS: Record<string, string> = {
    created: "bg-success-500",
    joined: "bg-success-500",
    promoted: "bg-primary-500",
    transferred: "bg-accent-500",
    "status change": "bg-warning-500",
    confirmed: "bg-primary-500",
    "salary revision": "bg-info-500",
    exited: "bg-danger-500",
    suspended: "bg-danger-500",
    document: "bg-neutral-500",
};
