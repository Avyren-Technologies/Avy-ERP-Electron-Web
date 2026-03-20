import { useState, useEffect } from "react";
import {
    Settings2,
    Loader2,
    CheckCircle2,
    XCircle,
    Shield,
    Eye,
    Fingerprint,
    Key,
    FileText,
    Calendar,
    Wallet,
    Clock,
    Users,
    Bell,
    Globe,
    Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEssConfig } from "@/features/company-admin/api/use-ess-queries";
import { useUpdateEssConfig } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Toggle ── */

function Toggle({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between px-5 py-4 rounded-xl border transition-colors",
                checked
                    ? "bg-success-50 dark:bg-success-900/10 border-success-100 dark:border-success-800/50"
                    : "bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-800"
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {checked ? (
                    <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                ) : (
                    <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                )}
                <div>
                    <p
                        className={cn(
                            "text-sm font-semibold",
                            checked ? "text-success-800 dark:text-success-400" : "text-neutral-500 dark:text-neutral-400"
                        )}
                    >
                        {label}
                    </p>
                    {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                    checked ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div
                    className={cn(
                        "w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm",
                        checked ? "left-[22px]" : "left-[3px]"
                    )}
                />
            </button>
        </div>
    );
}

/* ── Select ── */

function SelectRow({
    label,
    description,
    value,
    onChange,
    options,
}: {
    label: string;
    description?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/* ── Section Config ── */

interface ControlSection {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    controls: Array<{ key: string; label: string; description?: string; type?: "toggle" | "select"; options?: { value: string; label: string }[] }>;
}

const SECTIONS: ControlSection[] = [
    {
        title: "Portal Access",
        icon: Globe,
        controls: [
            { key: "portalEnabled", label: "Enable ESS Portal", description: "Allow employees to access the self-service portal" },
            {
                key: "loginMethod",
                label: "Login Method",
                description: "How employees authenticate",
                type: "select",
                options: [
                    { value: "email_password", label: "Email + Password" },
                    { value: "employee_id", label: "Employee ID + Password" },
                    { value: "sso", label: "Single Sign-On (SSO)" },
                    { value: "otp", label: "OTP-based" },
                ],
            },
            {
                key: "passwordPolicy",
                label: "Password Policy",
                description: "Minimum password strength",
                type: "select",
                options: [
                    { value: "basic", label: "Basic (6+ chars)" },
                    { value: "medium", label: "Medium (8+ chars, mixed case)" },
                    { value: "strong", label: "Strong (10+ chars, mixed case, numbers, symbols)" },
                ],
            },
            { key: "mfaEnabled", label: "Multi-Factor Authentication", description: "Require MFA for ESS login" },
            { key: "sessionTimeout", label: "Auto-Logout on Inactivity", description: "End session after 30 minutes of inactivity" },
        ],
    },
    {
        title: "Profile & Documents",
        icon: Eye,
        controls: [
            { key: "viewProfile", label: "View Profile", description: "Allow employees to view their profile" },
            { key: "requestProfileUpdate", label: "Request Profile Update", description: "Allow employees to request changes to their profile" },
            { key: "viewDocuments", label: "View Documents", description: "Access uploaded documents (offer letter, ID proofs, etc.)" },
            { key: "uploadDocuments", label: "Upload Documents", description: "Allow employees to upload documents" },
            { key: "viewOrgChart", label: "View Org Chart", description: "Display organisation hierarchy to employees" },
        ],
    },
    {
        title: "Leave Management",
        icon: Calendar,
        controls: [
            { key: "viewLeaveBalance", label: "View Leave Balance", description: "Show available leave balances" },
            { key: "applyLeave", label: "Apply Leave", description: "Allow leave application through ESS" },
            { key: "cancelLeave", label: "Cancel Leave", description: "Allow cancelling pending/approved leave" },
            { key: "viewLeaveHistory", label: "View Leave History", description: "Show past leave records" },
            { key: "viewTeamLeave", label: "View Team Leave Calendar", description: "Show team members' leave schedule" },
        ],
    },
    {
        title: "Attendance",
        icon: Clock,
        controls: [
            { key: "viewAttendance", label: "View Attendance", description: "Show daily attendance records" },
            { key: "regularizeAttendance", label: "Regularize Attendance", description: "Request attendance corrections" },
            { key: "punchInOut", label: "Web Punch In/Out", description: "Allow clock in/out from portal" },
            { key: "viewShiftSchedule", label: "View Shift Schedule", description: "Display assigned shift roster" },
        ],
    },
    {
        title: "Payroll & Compensation",
        icon: Wallet,
        controls: [
            { key: "viewPayslips", label: "View Payslips", description: "Access monthly salary slips" },
            { key: "downloadPayslips", label: "Download Payslips", description: "Allow PDF download of payslips" },
            { key: "viewSalaryStructure", label: "View Salary Structure", description: "Show salary component breakdown" },
            { key: "viewForm16", label: "View Form 16", description: "Access Form 16 / TDS certificate" },
            { key: "itDeclaration", label: "IT Declaration (Form 12BB)", description: "Submit investment declarations for tax saving" },
            { key: "viewLoanDetails", label: "View Loan Details", description: "Show active loan and EMI details" },
        ],
    },
    {
        title: "Manager Self-Service (MSS)",
        icon: Users,
        controls: [
            { key: "mssEnabled", label: "Enable MSS", description: "Allow managers to access team management features" },
            { key: "mssViewTeam", label: "View Team Members", description: "Show direct reportees list" },
            { key: "mssApproveLeave", label: "Approve/Reject Leave", description: "Allow leave approvals" },
            { key: "mssApproveAttendance", label: "Approve Attendance Regularization", description: "Allow attendance correction approvals" },
            { key: "mssViewTeamAttendance", label: "View Team Attendance", description: "Show team attendance summary" },
        ],
    },
    {
        title: "Notifications & Communication",
        icon: Bell,
        controls: [
            { key: "emailNotifications", label: "Email Notifications", description: "Send email alerts for approvals, payslips, etc." },
            { key: "pushNotifications", label: "Push Notifications", description: "Mobile push notifications" },
            { key: "inAppNotifications", label: "In-App Notifications", description: "Show notification bell in portal" },
            { key: "announcementBoard", label: "Announcement Board", description: "Show company announcements on ESS dashboard" },
        ],
    },
    {
        title: "Mobile App",
        icon: Smartphone,
        controls: [
            { key: "mobileAppEnabled", label: "Mobile App Access", description: "Allow ESS access via mobile app" },
            { key: "mobileGeoFencing", label: "Geo-Fenced Punch", description: "Restrict mobile attendance to geo-fenced locations" },
            { key: "mobileFaceRecognition", label: "Face Recognition", description: "Require face recognition for mobile attendance" },
            { key: "mobileOfflineMode", label: "Offline Mode", description: "Allow offline attendance capture" },
        ],
    },
];

/* ── Screen ── */

export function EssConfigScreen() {
    const { data, isLoading, isError } = useEssConfig();
    const updateMutation = useUpdateEssConfig();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const serverConfig = (data?.data as any) ?? {};

    useEffect(() => {
        if (data?.data) {
            setConfig({ ...serverConfig });
            setHasChanges(false);
        }
    }, [data]);

    const updateField = (key: string, value: any) => {
        setConfig((p) => ({ ...p, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(config);
            showSuccess("ESS Config Saved", "Employee Self-Service settings have been updated.");
            setHasChanges(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReset = () => {
        setConfig({ ...serverConfig });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">ESS Configuration</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Settings2 className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load ESS configuration</p>
            </div>
        );
    }

    const enabledCount = Object.values(config).filter((v) => v === true).length;
    const totalToggles = SECTIONS.reduce((sum, s) => sum + s.controls.filter((c) => c.type !== "select").length, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">ESS Configuration</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {enabledCount} of {totalToggles} features enabled
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
                        >
                            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECTIONS.map((section) => (
                    <div
                        key={section.title}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <section.icon size={16} className="text-primary-600" />
                                </div>
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</h3>
                            </div>
                            <div className="space-y-3">
                                {section.controls.map((ctrl) =>
                                    ctrl.type === "select" ? (
                                        <SelectRow
                                            key={ctrl.key}
                                            label={ctrl.label}
                                            description={ctrl.description}
                                            value={config[ctrl.key] ?? ctrl.options?.[0]?.value ?? ""}
                                            onChange={(v) => updateField(ctrl.key, v)}
                                            options={ctrl.options ?? []}
                                        />
                                    ) : (
                                        <Toggle
                                            key={ctrl.key}
                                            label={ctrl.label}
                                            description={ctrl.description}
                                            checked={config[ctrl.key] ?? false}
                                            onChange={(v) => updateField(ctrl.key, v)}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shadow-2xl shadow-neutral-900/10">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
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
