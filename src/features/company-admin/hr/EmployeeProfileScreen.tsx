import { useState, useEffect, useMemo, useCallback } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
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
    Eye,
    EyeOff,
    KeyRound,
    Plus,
    RotateCcw,
    AlertTriangle,
    UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addCalendarDaysToIsoDate, getProbationDaysFromDesignation } from "@/lib/probation-end-date";
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
import { useCompanyLocations, useCompanyShifts, useRbacRoles } from "@/features/company-admin/api/use-company-admin-queries";
import {
    useCreateEmployee,
    useUpdateEmployee,
    useUpdateEmployeeStatus,
    useDeleteEmployee,
    useDeleteDocument,
} from "@/features/company-admin/api/use-hr-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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

function SelectField({ label, value, onChange, options, placeholder, disabled = false, createLink }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean;
    createLink?: { href: string; label: string };
}) {
    const navigate = useNavigate();
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</label>
                {createLink && !disabled && (
                    <button
                        type="button"
                        onClick={() => navigate(createLink.href)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        title={createLink.label}
                    >
                        <Plus size={14} />
                        <span>Create</span>
                    </button>
                )}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all",
                    disabled && "opacity-60 cursor-not-allowed"
                )}
            >
                <option value="">{options.length === 0 && createLink ? `No ${label.toLowerCase()}s — create one` : (placeholder ?? "Select...")}</option>
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

/* ── Phone number parser: splits "+91XXXXXXXXXX" into code + phone ── */

const KNOWN_CODES = ["+971", "+966", "+974", "+965", "+973", "+968", "+977", "+880", "+91", "+44", "+61", "+49", "+33", "+81", "+86", "+55", "+27", "+60", "+64", "+92", "+94", "+65", "+1"];

function parsePhoneNumber(full: string): { code: string; phone: string } {
    if (!full) return { code: "+91", phone: "" };
    const trimmed = full.replace(/\s/g, "");
    if (!trimmed.startsWith("+")) return { code: "+91", phone: trimmed };
    // Try longest codes first
    const sorted = [...KNOWN_CODES].sort((a, b) => b.length - a.length);
    for (const code of sorted) {
        if (trimmed.startsWith(code)) {
            return { code, phone: trimmed.slice(code.length) };
        }
    }
    // Fallback: assume first 3 chars are code
    return { code: trimmed.slice(0, 3), phone: trimmed.slice(3) };
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
    personalMobile: "", personalMobileCountryCode: "+91",
    altMobile: "", personalEmail: "", officialEmail: "",
    currentAddress: { line1: "", line2: "", city: "", state: "", pin: "" },
    permanentAddress: { line1: "", line2: "", city: "", state: "", pin: "" },
    sameAsCurrent: false,
    emergencyName: "", emergencyRelation: "",
    emergencyMobile: "", emergencyMobileCountryCode: "+91",
};

const EMPTY_PROFESSIONAL = {
    joiningDate: "", employeeTypeId: "", departmentId: "",
    designationId: "", gradeId: "",
    reportingManagerId: "", functionalManagerId: "",
    workType: "ON_SITE", shiftId: "", locationId: "",
    costCentreId: "", noticePeriod: "", probationEndDate: "",
};

const EMPTY_SALARY = {
    annualCTC: "", paymentMode: "NEFT",
    salaryStructure: null as any,
};

const EMPTY_BANK = {
    ifscCode: "", bankName: "", branchName: "",
    accountNumber: "", confirmAccountNumber: "",
    accountType: "SAVINGS",
};

const EMPTY_DOCUMENTS = {
    pan: "", aadhaar: "", uan: "", esiIp: "",
    passport: "", dl: "", voterId: "",
};

/* ── Draft persistence helpers (localStorage) ── */

const STORAGE_KEY = 'avy_employee_form_draft';

function saveDraft(data: any) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadDraft(): any | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/* ── Main Screen ── */

export function EmployeeProfileScreen() {
    const fmt = useCompanyFormatter();
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
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

    // Login account state (only for new employees)
    const [createUserAccount, setCreateUserAccount] = useState(false);
    const [userPassword, setUserPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [userRole, setUserRole] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userLocationId, setUserLocationId] = useState("");

    // IFSC auto-fill state
    const [ifscVerifying, setIfscVerifying] = useState(false);
    const [ifscError, setIfscError] = useState("");

    // Document proof uploads: keyed by document type
    const [docUploads, setDocUploads] = useState<Record<string, { fileName: string; base64: string }>>({});

    // Probation auto-calculation state
    const [probationAutoCalculated, setProbationAutoCalculated] = useState(false);

    // Queries
    const employeeQuery = useEmployee(isNew ? "" : id!);
    const departmentsQuery = useDepartments();
    const designationsQuery = useDesignations();
    const gradesQuery = useGrades();
    const employeeTypesQuery = useEmployeeTypes();
    const costCentresQuery = useCostCentres();
    const employeesQuery = useEmployees({ limit: 500 });
    const locationsQuery = useCompanyLocations();
    const shiftsQuery = useCompanyShifts();
    const rolesQuery = useRbacRoles();
    const docsQuery = useEmployeeDocuments(isNew ? "" : id!);
    const timelineQuery = useEmployeeTimeline(isNew ? "" : id!);

    // Mutations
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const statusMutation = useUpdateEmployeeStatus();
    const deleteEmployeeMutation = useDeleteEmployee();
    const deleteDocMutation = useDeleteDocument();

    // Deactivation modal state
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [exitReason, setExitReason] = useState("");
    const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().split("T")[0]);

    // Initial status for new employees
    const [initialStatus, setInitialStatus] = useState<string>("PROBATION");

    // Select option mappers
    const deptOptions = useMemo(() => (departmentsQuery.data?.data ?? []).map((d: any) => ({ value: d.id, label: d.name })), [departmentsQuery.data]);
    const desigOptions = useMemo(() => (designationsQuery.data?.data ?? []).map((d: any) => ({ value: d.id, label: d.name })), [designationsQuery.data]);
    const gradeOptions = useMemo(() => (gradesQuery.data?.data ?? []).map((g: any) => ({ value: g.id, label: g.name })), [gradesQuery.data]);
    const empTypeOptions = useMemo(() => (employeeTypesQuery.data?.data ?? []).map((t: any) => ({ value: t.id, label: t.name })), [employeeTypesQuery.data]);
    const costCentreOptions = useMemo(() => (costCentresQuery.data?.data ?? []).map((c: any) => ({ value: c.id, label: `${c.code ?? ""} - ${c.name}` })), [costCentresQuery.data]);
    const locationOptions = useMemo(() => (locationsQuery.data?.data ?? []).map((l: any) => ({ value: l.id, label: l.name })), [locationsQuery.data]);
    const shiftOptions = useMemo(() => (shiftsQuery.data?.data ?? []).map((s: any) => ({ value: s.id, label: s.name })), [shiftsQuery.data]);
    const managerOptions = useMemo(() => (employeesQuery.data?.data ?? []).filter((e: any) => e.id !== id).map((e: any) => {
        const name = [e.firstName, e.lastName].filter(Boolean).join(" ") || e.officialEmail || e.id;
        const empId = e.employeeId ?? "";
        // Tenant RBAC role name (same as auth profile roleName); fallback to job title if no user/role.
        const roleLabel = e.rbacRoleName ?? e.designation?.name ?? e.designationName ?? "";
        const parts = [name, empId && `(${empId})`, roleLabel && `— ${roleLabel}`].filter(Boolean);
        return { value: e.id, label: parts.join(" ") };
    }), [employeesQuery.data, id]);

    // Populate from API
    useEffect(() => {
        if (isNew || !employeeQuery.data?.data) return;
        const emp: any = employeeQuery.data.data;

        setProfilePhotoUrl(emp.profilePhotoUrl ?? null);

        setPersonal({
            firstName: emp.firstName ?? "",
            middleName: emp.middleName ?? "",
            lastName: emp.lastName ?? "",
            dob: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split("T")[0] : "",
            gender: emp.gender ?? "",
            maritalStatus: emp.maritalStatus ?? "",
            bloodGroup: emp.bloodGroup ?? "",
            fatherName: emp.fatherMotherName?.split(" / ")?.[0] ?? "",
            motherName: emp.fatherMotherName?.split(" / ")?.[1] ?? "",
            nationality: emp.nationality ?? "Indian",
            religion: emp.religion ?? "",
            category: emp.category ?? "",
            personalMobile: parsePhoneNumber(emp.personalMobile ?? "").phone,
            personalMobileCountryCode: parsePhoneNumber(emp.personalMobile ?? "").code,
            altMobile: emp.alternativeMobile ?? "",
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
            sameAsCurrent: false,
            emergencyName: emp.emergencyContactName ?? "",
            emergencyRelation: emp.emergencyContactRelation ?? "",
            emergencyMobile: parsePhoneNumber(emp.emergencyContactMobile ?? "").phone,
            emergencyMobileCountryCode: parsePhoneNumber(emp.emergencyContactMobile ?? "").code,
        });

        setProfessional({
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split("T")[0] : "",
            employeeTypeId: emp.employeeTypeId ?? "",
            departmentId: emp.departmentId ?? "",
            designationId: emp.designationId ?? "",
            gradeId: emp.gradeId ?? "",
            reportingManagerId: emp.reportingManagerId ?? "",
            functionalManagerId: emp.functionalManagerId ?? "",
            workType: emp.workType ?? "ON_SITE",
            shiftId: emp.shiftId ?? "",
            locationId: emp.locationId ?? "",
            costCentreId: emp.costCentreId ?? "",
            noticePeriod: emp.noticePeriodDays?.toString() ?? "",
            probationEndDate: emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().split("T")[0] : "",
        });

        setSalary({
            annualCTC: emp.annualCtc?.toString() ?? "",
            paymentMode: emp.paymentMode ?? "NEFT",
            salaryStructure: emp.salaryStructure ?? null,
        });

        setBank({
            ifscCode: emp.bankIfscCode ?? "",
            bankName: emp.bankName ?? "",
            branchName: emp.bankBranch ?? "",
            accountNumber: emp.bankAccountNumber ?? "",
            confirmAccountNumber: emp.bankAccountNumber ?? "",
            accountType: emp.accountType ?? "SAVINGS",
        });

        setDocuments({
            pan: emp.panNumber ?? "",
            aadhaar: emp.aadhaarNumber ?? "",
            uan: emp.uan ?? "",
            esiIp: emp.esiIpNumber ?? "",
            passport: emp.passportNumber ?? "",
            dl: emp.drivingLicence ?? "",
            voterId: emp.voterId ?? "",
        });
    }, [employeeQuery.data, isNew]);

    // Load draft from localStorage on mount (create mode only)
    useEffect(() => {
        if (!isNew) return;
        const draft = loadDraft();
        if (draft) {
            setPersonal(draft.personal ?? { ...EMPTY_PERSONAL });
            setProfessional(draft.professional ?? { ...EMPTY_PROFESSIONAL });
            setSalary(draft.salary ?? { ...EMPTY_SALARY });
            setBank(draft.bank ?? { ...EMPTY_BANK });
            setDocuments(draft.documents ?? { ...EMPTY_DOCUMENTS });
            showSuccess('Draft Restored', 'Your previously saved employee form data has been restored.');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save draft on form changes (debounced, create mode only)
    useEffect(() => {
        if (!isNew) return;
        const timer = setTimeout(() => {
            saveDraft({
                personal,
                professional,
                salary,
                bank,
                documents,
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [personal, professional, salary, bank, documents, isNew]);

    // Helpers
    const updatePersonal = (key: string, value: any) => setPersonal((p) => ({ ...p, [key]: value }));
    const updateAddress = (which: "currentAddress" | "permanentAddress", key: string, value: string) => {
        setPersonal((p) => ({ ...p, [which]: { ...p[which], [key]: value } }));
    };
    const updateProfessional = (key: string, value: any) => setProfessional((p) => ({ ...p, [key]: value }));
    const updateSalary = (key: string, value: any) => setSalary((p) => ({ ...p, [key]: value }));
    const updateBank = (key: string, value: any) => setBank((p) => ({ ...p, [key]: value }));
    const updateDocuments = (key: string, value: any) => setDocuments((p) => ({ ...p, [key]: value }));

    // IFSC auto-fill: fetch bank details when IFSC code is 11 chars
    const fetchIfscDetails = useCallback(async (ifsc: string) => {
        if (ifsc.length !== 11) {
            setIfscError("");
            return;
        }
        setIfscVerifying(true);
        setIfscError("");
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
            if (!res.ok) throw new Error("Invalid IFSC");
            const data = await res.json();
            setBank((prev) => ({
                ...prev,
                bankName: data.BANK ?? prev.bankName,
                branchName: [data.BRANCH, data.CITY, data.STATE].filter(Boolean).join(", ") || prev.branchName,
            }));
        } catch {
            setIfscError("Could not verify IFSC code");
        } finally {
            setIfscVerifying(false);
        }
    }, []);

    // Probation end date = joining date + designation.probationDays (from Designation master)
    useEffect(() => {
        if (!editing || !professional.designationId || !professional.joiningDate) return;
        const designations: any[] = designationsQuery.data?.data ?? [];
        const desig = designations.find((d: any) => d.id === professional.designationId);
        const days = getProbationDaysFromDesignation(desig);
        if (days != null) {
            const formatted = addCalendarDaysToIsoDate(professional.joiningDate, days);
            if (formatted) {
                setProfessional((p) => ({ ...p, probationEndDate: formatted }));
                setProbationAutoCalculated(true);
                return;
            }
        }
        setProbationAutoCalculated(false);
    }, [professional.designationId, professional.joiningDate, designationsQuery.data, editing]);

    // Document file upload handler
    const handleDocUpload = (docType: string, file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            showApiError({ message: "File must be under 10 MB" });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setDocUploads((prev) => ({
                ...prev,
                [docType]: { fileName: file.name, base64: reader.result as string },
            }));
        };
        reader.readAsDataURL(file);
    };

    const saving = createMutation.isPending || updateMutation.isPending;

    const handleSave = async () => {
        // Map frontend field names to backend schema field names
        const payload: Record<string, any> = {
            // Personal
            firstName: personal.firstName,
            lastName: personal.lastName,
            dateOfBirth: personal.dob,
            personalMobile: personal.personalMobile ? personal.personalMobileCountryCode + personal.personalMobile : "",
            personalEmail: personal.personalEmail,
            emergencyContactName: personal.emergencyName,
            emergencyContactRelation: personal.emergencyRelation,
            emergencyContactMobile: personal.emergencyMobile ? personal.emergencyMobileCountryCode + personal.emergencyMobile : "",
            // Professional (required)
            joiningDate: professional.joiningDate,
            employeeTypeId: professional.employeeTypeId,
            departmentId: professional.departmentId,
            designationId: professional.designationId,
        };

        // Profile photo
        if (profilePhotoUrl !== undefined) payload.profilePhotoUrl = profilePhotoUrl;

        // Gender and marital status (already using backend enum values)
        if (personal.gender) payload.gender = personal.gender;
        if (personal.maritalStatus) payload.maritalStatus = personal.maritalStatus;

        // Optional personal fields
        if (personal.middleName) payload.middleName = personal.middleName;
        if (personal.bloodGroup) payload.bloodGroup = personal.bloodGroup;
        // Combine father/mother into fatherMotherName
        const parentNames = [personal.fatherName, personal.motherName].filter(Boolean).join(" / ");
        if (parentNames) payload.fatherMotherName = parentNames;
        if (personal.nationality) payload.nationality = personal.nationality;
        if (personal.religion) payload.religion = personal.religion;
        if (personal.category) payload.category = personal.category;
        if (personal.altMobile) payload.alternativeMobile = personal.altMobile;
        if (personal.officialEmail) payload.officialEmail = personal.officialEmail;

        // Addresses
        if (personal.currentAddress?.line1) payload.currentAddress = personal.currentAddress;
        if (personal.sameAsCurrent) {
            payload.permanentAddress = personal.currentAddress;
        } else if (personal.permanentAddress?.line1) {
            payload.permanentAddress = personal.permanentAddress;
        }

        // Optional professional fields
        if (professional.gradeId) payload.gradeId = professional.gradeId;
        if (professional.reportingManagerId) payload.reportingManagerId = professional.reportingManagerId;
        if (professional.functionalManagerId) payload.functionalManagerId = professional.functionalManagerId;
        if (professional.shiftId) payload.shiftId = professional.shiftId;
        if (professional.costCentreId) payload.costCentreId = professional.costCentreId;
        if (professional.locationId) payload.locationId = professional.locationId;
        if (professional.noticePeriod) payload.noticePeriodDays = parseInt(professional.noticePeriod);

        // Work type (already using backend enum values)
        if (professional.workType) payload.workType = professional.workType;

        // Salary
        if (salary.annualCTC) payload.annualCtc = parseFloat(salary.annualCTC);
        if (salary.paymentMode) payload.paymentMode = salary.paymentMode;
        if (salary.salaryStructure) payload.salaryStructure = salary.salaryStructure;

        // Bank
        if (bank.accountNumber) payload.bankAccountNumber = bank.accountNumber;
        if (bank.ifscCode) payload.bankIfscCode = bank.ifscCode;
        if (bank.bankName) payload.bankName = bank.bankName;
        if (bank.branchName) payload.bankBranch = bank.branchName;
        if (bank.accountType) payload.accountType = bank.accountType;

        // Statutory documents
        if (documents.pan) payload.panNumber = documents.pan;
        if (documents.aadhaar) payload.aadhaarNumber = documents.aadhaar;
        if (documents.uan) payload.uan = documents.uan;
        if (documents.esiIp) payload.esiIpNumber = documents.esiIp;
        if (documents.passport) payload.passportNumber = documents.passport;
        if (documents.dl) payload.drivingLicence = documents.dl;
        if (documents.voterId) payload.voterId = documents.voterId;

        // Probation end date
        if (professional.probationEndDate) payload.probationEndDate = professional.probationEndDate;

        // Initial status (for new employees)
        if (isNew && initialStatus) payload.status = initialStatus;

        // Document proof uploads (base64)
        if (Object.keys(docUploads).length > 0) {
            payload.documentUploads = docUploads;
        }

        // Include user account fields if creating a new employee with login
        if (isNew && createUserAccount) {
            if (!personal.officialEmail) {
                showApiError({ message: "Official Email is required when creating a login account." });
                return;
            }
            if (!userPassword || userPassword.length < 6) {
                showApiError({ message: "Password must be at least 6 characters." });
                return;
            }
            if (userPassword !== confirmPassword) {
                showApiError({ message: "Passwords do not match." });
                return;
            }
            payload.createUserAccount = true;
            payload.userPassword = userPassword;
            if (userRole) payload.userRole = userRole;
            if (userLocationId) payload.userLocationId = userLocationId;
        }

        try {
            if (isNew) {
                const result = await createMutation.mutateAsync(payload);
                clearDraft();
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

    const handleStatusAction = async (status: EmployeeStatus, extra?: { lastWorkingDate?: string; exitReason?: string }) => {
        if (!id || isNew) return;
        try {
            await statusMutation.mutateAsync({ id, status, ...extra });
            showSuccess("Status Updated", `Employee status changed to ${status}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDeactivate = async () => {
        if (!id || isNew) return;
        if (!exitReason.trim()) {
            showApiError({ message: "Exit reason is required." });
            return;
        }
        try {
            await statusMutation.mutateAsync({
                id,
                status: "EXITED" as EmployeeStatus,
                exitReason: exitReason.trim(),
                lastWorkingDate: lastWorkingDate || undefined,
            });
            showSuccess("Employee Deactivated", `${personal.firstName} ${personal.lastName} has been set to Exited.`);
            setShowDeactivateModal(false);
            setExitReason("");
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
        if (!d) return "—";
        return fmt.date(d);
    };

    const formatDateTime = (d: string | null | undefined) => {
        if (!d) return "—";
        return fmt.date(d);
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
                <div className="flex items-center gap-3">
                    {isNew && (
                        <button
                            onClick={() => {
                                clearDraft();
                                setPersonal({ ...EMPTY_PERSONAL });
                                setProfessional({ ...EMPTY_PROFESSIONAL });
                                setSalary({ ...EMPTY_SALARY });
                                setBank({ ...EMPTY_BANK });
                                setDocuments({ ...EMPTY_DOCUMENTS });
                                setProfilePhotoUrl(null);
                                setCreateUserAccount(false);
                                setUserPassword("");
                                setConfirmPassword("");
                                setUserRole("");
                                setDocUploads({});
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Reset Form
                        </button>
                    )}
                    {!isNew && !editing && emp.status?.toUpperCase() !== "EXITED" && (
                        <button
                            onClick={() => setShowDeactivateModal(true)}
                            className="inline-flex items-center gap-2 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            <UserX className="w-4 h-4" />
                            Deactivate
                        </button>
                    )}
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
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex overflow-x-auto border-b border-neutral-100 dark:border-neutral-800">
                    {(isNew ? TABS.filter((t) => t.key !== "timeline") : TABS).map((tab) => {
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
                            {/* Profile Photo */}
                            <div className="flex items-center gap-6 mb-2">
                                <div className="w-20 h-20 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-2xl font-bold text-accent-700 dark:text-accent-400 relative">
                                    {profilePhotoUrl ? (
                                        <img src={profilePhotoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        (personal.firstName?.charAt(0) ?? "") + (personal.lastName?.charAt(0) ?? "") || "?"
                                    )}
                                    {editing && (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="profile-photo-input"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        showApiError({ message: "Photo must be under 5 MB" });
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setProfilePhotoUrl(reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                            <label
                                                htmlFor="profile-photo-input"
                                                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md cursor-pointer"
                                            >
                                                <Camera size={14} />
                                            </label>
                                        </>
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
                                    { value: "MALE", label: "Male" },
                                    { value: "FEMALE", label: "Female" },
                                    { value: "NON_BINARY", label: "Non-Binary" },
                                    { value: "PREFER_NOT_TO_SAY", label: "Prefer Not to Say" },
                                ]} />
                                <SelectField label="Marital Status" value={personal.maritalStatus} onChange={(v) => updatePersonal("maritalStatus", v)} disabled={!editing} options={[
                                    { value: "SINGLE", label: "Single" },
                                    { value: "MARRIED", label: "Married" },
                                    { value: "DIVORCED", label: "Divorced" },
                                    { value: "WIDOWED", label: "Widowed" },
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
                                <PhoneInput
                                    label="Personal Mobile"
                                    countryCode={personal.personalMobileCountryCode}
                                    phone={personal.personalMobile}
                                    onCountryCodeChange={(v) => updatePersonal("personalMobileCountryCode", v)}
                                    onPhoneChange={(v) => updatePersonal("personalMobile", v)}
                                    placeholder="98765 43210"
                                    disabled={!editing}
                                />
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
                                <PhoneInput
                                    label="Mobile"
                                    countryCode={personal.emergencyMobileCountryCode}
                                    phone={personal.emergencyMobile}
                                    onCountryCodeChange={(v) => updatePersonal("emergencyMobileCountryCode", v)}
                                    onPhoneChange={(v) => updatePersonal("emergencyMobile", v)}
                                    placeholder="98765 43210"
                                    disabled={!editing}
                                />
                            </div>

                            {/* Create Login Account — only for new employees */}
                            {isNew && (
                                <>
                                    <SectionTitle title="Create Login Account" icon={KeyRound} />
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={createUserAccount}
                                                onChange={(e) => setCreateUserAccount(e.target.checked)}
                                                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm font-semibold text-primary-950 dark:text-white">Enable login for this employee</span>
                                        </label>
                                        {!personal.officialEmail && createUserAccount && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800/50">
                                                <AlertCircle size={13} className="text-warning-500 flex-shrink-0" />
                                                <p className="text-xs font-semibold text-warning-700 dark:text-warning-400">Official Email (above) is required to create a login account.</p>
                                            </div>
                                        )}
                                        {createUserAccount && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <FormField label="Password" value={userPassword} onChange={setUserPassword} placeholder="Min 6 characters" type={showPassword ? "text" : "password"} />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword((v) => !v)}
                                                        className="absolute right-3 top-8 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <FormField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" type={showConfirmPassword ? "text" : "password"} />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                                        className="absolute right-3 top-8 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                <SelectField
                                                    label="Role"
                                                    value={userRole}
                                                    onChange={setUserRole}
                                                    options={(rolesQuery.data?.data || [])
                                                        .map((r: any) => ({ value: r.id, label: r.name }))}
                                                    placeholder={rolesQuery.isError ? "Failed to load roles" : rolesQuery.isLoading ? "Loading roles..." : "Select role..."}
                                                    createLink={{ href: "/app/company/roles", label: "Create Role" }}
                                                />
                                                <SearchableSelect
                                                    label="Location / Branch"
                                                    value={userLocationId}
                                                    onChange={setUserLocationId}
                                                    options={locationOptions}
                                                    placeholder="Select location..."
                                                    disabled={false}
                                                />
                                            </div>
                                        )}
                                        {createUserAccount && confirmPassword && userPassword !== confirmPassword && (
                                            <p className="text-xs font-semibold text-danger-600">Passwords do not match.</p>
                                        )}
                                        {createUserAccount && userPassword && userPassword.length < 6 && (
                                            <p className="text-xs font-semibold text-danger-600">Password must be at least 6 characters.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Professional Tab ── */}
                    {activeTab === "professional" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Joining Date" value={professional.joiningDate} onChange={(v) => updateProfessional("joiningDate", v)} type="date" disabled={!editing} />
                                {isNew && (
                                    <SelectField
                                        label="Initial Status"
                                        value={initialStatus}
                                        onChange={(v) => setInitialStatus(v)}
                                        options={[
                                            { value: "PROBATION", label: "Probation" },
                                            { value: "ACTIVE", label: "Active" },
                                            { value: "CONFIRMED", label: "Confirmed" },
                                        ]}
                                        disabled={!editing}
                                        placeholder="Select status..."
                                    />
                                )}
                                <SelectField label="Employee Type" value={professional.employeeTypeId} onChange={(v) => updateProfessional("employeeTypeId", v)} options={empTypeOptions} disabled={!editing} placeholder="Select type..." createLink={{ href: "/app/company/hr/employee-types", label: "Create Employee Type" }} />
                                <SelectField label="Department" value={professional.departmentId} onChange={(v) => updateProfessional("departmentId", v)} options={deptOptions} disabled={!editing} placeholder="Select department..." createLink={{ href: "/app/company/hr/departments", label: "Create Department" }} />
                                <SelectField label="Designation" value={professional.designationId} onChange={(v) => updateProfessional("designationId", v)} options={desigOptions} disabled={!editing} placeholder="Select designation..." createLink={{ href: "/app/company/hr/designations", label: "Create Designation" }} />
                                <SelectField label="Grade" value={professional.gradeId} onChange={(v) => updateProfessional("gradeId", v)} options={gradeOptions} disabled={!editing} placeholder="Select grade..." createLink={{ href: "/app/company/hr/grades", label: "Create Grade" }} />
                                <SelectField label="Reporting Manager" value={professional.reportingManagerId} onChange={(v) => updateProfessional("reportingManagerId", v)} options={managerOptions} disabled={!editing} placeholder="Search manager..." />
                                <SelectField label="Functional Manager" value={professional.functionalManagerId} onChange={(v) => updateProfessional("functionalManagerId", v)} options={managerOptions} disabled={!editing} placeholder="Search manager..." />
                                <SelectField label="Location" value={professional.locationId} onChange={(v) => updateProfessional("locationId", v)} options={locationOptions} disabled={!editing} placeholder="Select location..." createLink={{ href: "/app/company/locations", label: "Create Location" }} />
                                <SelectField label="Shift" value={professional.shiftId} onChange={(v) => updateProfessional("shiftId", v)} options={shiftOptions} disabled={!editing} placeholder="Select shift..." createLink={{ href: "/app/company/shifts", label: "Create Shift" }} />
                            </div>

                            <RadioGroup
                                label="Work Type"
                                value={professional.workType}
                                onChange={(v) => updateProfessional("workType", v)}
                                options={[
                                    { value: "ON_SITE", label: "On-site" },
                                    { value: "REMOTE", label: "Remote" },
                                    { value: "HYBRID", label: "Hybrid" },
                                ]}
                                disabled={!editing}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField label="Cost Centre" value={professional.costCentreId} onChange={(v) => updateProfessional("costCentreId", v)} options={costCentreOptions} disabled={!editing} placeholder="Select cost centre..." createLink={{ href: "/app/company/hr/cost-centres", label: "Create Cost Centre" }} />
                                <FormField label="Notice Period (days)" value={professional.noticePeriod} onChange={(v) => updateProfessional("noticePeriod", v)} type="number" placeholder="e.g. 90" disabled={!editing} />
                                <div>
                                    <FormField
                                        label="Probation End Date"
                                        value={professional.probationEndDate}
                                        onChange={(v) => {
                                            updateProfessional("probationEndDate", v);
                                            setProbationAutoCalculated(false);
                                        }}
                                        type="date"
                                        disabled={!editing}
                                        mono
                                    />
                                    {probationAutoCalculated && professional.probationEndDate && (
                                        <p className="text-[10px] text-info-600 dark:text-info-400 mt-1 font-semibold">
                                            Auto-calculated from joining date + probation days on the designation. You can override this date.
                                        </p>
                                    )}
                                </div>
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
                                    { value: "CHEQUE", label: "Cheque" },
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
                                                            {typeof val === "number" ? (val / 12).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
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
                                <div>
                                    <FormField
                                        label="IFSC Code"
                                        value={bank.ifscCode}
                                        onChange={(v) => {
                                            const upper = v.toUpperCase();
                                            updateBank("ifscCode", upper);
                                            fetchIfscDetails(upper);
                                        }}
                                        placeholder="e.g. SBIN0001234"
                                        mono
                                        disabled={!editing}
                                    />
                                    {ifscVerifying && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Loader2 size={12} className="animate-spin text-primary-500" />
                                            <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">Verifying IFSC...</span>
                                        </div>
                                    )}
                                    {ifscError && (
                                        <p className="text-[10px] font-semibold text-danger-600 dark:text-danger-400 mt-1">{ifscError}</p>
                                    )}
                                </div>
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
                                    { value: "SAVINGS", label: "Savings" },
                                    { value: "CURRENT", label: "Current" },
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
                                {/* PAN */}
                                <div className="space-y-1.5">
                                    <FormField label="PAN" value={documents.pan} onChange={(v) => updateDocuments("pan", v.toUpperCase())} placeholder="ABCDE1234F" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.pan ? docUploads.pan.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("pan", e.target.files[0])} />
                                            </label>
                                            {docUploads.pan && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.pan; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Aadhaar */}
                                <div className="space-y-1.5">
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
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.aadhaar ? docUploads.aadhaar.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("aadhaar", e.target.files[0])} />
                                            </label>
                                            {docUploads.aadhaar && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.aadhaar; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* UAN */}
                                <div className="space-y-1.5">
                                    <FormField label="UAN" value={documents.uan} onChange={(v) => updateDocuments("uan", v)} placeholder="Universal Account Number" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.uan ? docUploads.uan.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("uan", e.target.files[0])} />
                                            </label>
                                            {docUploads.uan && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.uan; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* ESI IP */}
                                <div className="space-y-1.5">
                                    <FormField label="ESI IP Number" value={documents.esiIp} onChange={(v) => updateDocuments("esiIp", v)} placeholder="ESI Insurance Number" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.esiIp ? docUploads.esiIp.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("esiIp", e.target.files[0])} />
                                            </label>
                                            {docUploads.esiIp && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.esiIp; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Passport */}
                                <div className="space-y-1.5">
                                    <FormField label="Passport Number" value={documents.passport} onChange={(v) => updateDocuments("passport", v.toUpperCase())} placeholder="Passport" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.passport ? docUploads.passport.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("passport", e.target.files[0])} />
                                            </label>
                                            {docUploads.passport && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.passport; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Driving Licence */}
                                <div className="space-y-1.5">
                                    <FormField label="Driving Licence" value={documents.dl} onChange={(v) => updateDocuments("dl", v.toUpperCase())} placeholder="DL Number" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.dl ? docUploads.dl.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("dl", e.target.files[0])} />
                                            </label>
                                            {docUploads.dl && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.dl; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Voter ID */}
                                <div className="space-y-1.5">
                                    <FormField label="Voter ID" value={documents.voterId} onChange={(v) => updateDocuments("voterId", v.toUpperCase())} placeholder="EPIC Number" mono disabled={!editing} />
                                    {editing && (
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer">
                                                <Upload size={12} />
                                                {docUploads.voterId ? docUploads.voterId.fileName : "Upload proof"}
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload("voterId", e.target.files[0])} />
                                            </label>
                                            {docUploads.voterId && (
                                                <button onClick={() => setDocUploads((p) => { const n = { ...p }; delete n.voterId; return n; })} className="text-danger-500 hover:text-danger-700 transition-colors"><Trash2 size={12} /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                                            <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{doc.type || doc.documentType || "—"}</td>
                                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{doc.fileName || doc.name || "—"}</td>
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
            {(editing || isNew) && (() => {
                const newTabOrder: TabKey[] = ["personal", "professional", "salary", "bank", "documents"];
                const currentNewTabIndex = newTabOrder.indexOf(activeTab);
                const isLastNewTab = isNew && currentNewTabIndex === newTabOrder.length - 1;
                const isNotLastNewTab = isNew && currentNewTabIndex >= 0 && currentNewTabIndex < newTabOrder.length - 1;

                return (
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
                            {isNew && currentNewTabIndex > 0 && (
                                <button
                                    onClick={() => setActiveTab(newTabOrder[currentNewTabIndex - 1])}
                                    className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    &larr; Back
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
                                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl hidden group-hover:block z-10">
                                        <button onClick={() => handleStatusAction("CONFIRMED" as EmployeeStatus)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-t-xl transition-colors">
                                            Confirm Employee
                                        </button>
                                        <button onClick={() => handleStatusAction("SUSPENDED" as EmployeeStatus)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors">
                                            Suspend
                                        </button>
                                        <button onClick={() => handleStatusAction("ON_NOTICE" as EmployeeStatus)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors">
                                            Initiate Exit (On Notice)
                                        </button>
                                        {emp.status?.toUpperCase() !== "EXITED" && (
                                            <button onClick={() => setShowDeactivateModal(true)} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-b-xl transition-colors">
                                                Deactivate (Exit)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {isNotLastNewTab ? (
                                <button
                                    onClick={() => setActiveTab(newTabOrder[currentNewTabIndex + 1])}
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                                >
                                    Next &rarr;
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {saving ? "Saving..." : isNew ? "Create Employee" : "Save Changes"}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Deactivate Employee Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl max-w-md w-full mx-4 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/30 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-danger-600 dark:text-danger-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">Deactivate Employee</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Set status to Exited</p>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                            This will deactivate <span className="font-bold">{personal.firstName} {personal.lastName}</span> and set their status to Exited.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Exit Reason <span className="text-danger-500">*</span></label>
                                <input
                                    type="text"
                                    value={exitReason}
                                    onChange={(e) => setExitReason(e.target.value)}
                                    placeholder="e.g. Resignation, Termination, Contract End..."
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Last Working Date</label>
                                <input
                                    type="date"
                                    value={lastWorkingDate}
                                    onChange={(e) => setLastWorkingDate(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => { setShowDeactivateModal(false); setExitReason(""); }}
                                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivate}
                                disabled={statusMutation.isPending || !exitReason.trim()}
                                className="px-4 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold shadow-md shadow-danger-500/20 transition-all disabled:opacity-50"
                            >
                                {statusMutation.isPending ? "Deactivating..." : "Deactivate Employee"}
                            </button>
                        </div>
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
