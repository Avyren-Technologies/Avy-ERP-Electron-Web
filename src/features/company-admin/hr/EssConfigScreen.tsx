import { useState, useEffect } from "react";
import {
    Settings2,
    Loader2,
    CheckCircle2,
    XCircle,
    Wallet,
    Calendar,
    Clock,
    Eye,
    CreditCard,
    Target,
    HelpCircle,
    Users,
    Smartphone,
} from "lucide-react";
import { InfoTooltip, SectionDescription } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { useEssConfig } from "@/features/company-admin/api/use-ess-queries";
import { useUpdateEssConfig } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import type { ESSConfig } from "@/lib/api/ess";

/* ── Toggle ── */

function Toggle({ label, description, checked, onChange, tooltip }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string;
}) {
    return (
        <div className={cn(
            "flex items-center justify-between px-5 py-4 rounded-xl border transition-colors",
            checked
                ? "bg-success-50 dark:bg-success-900/10 border-success-100 dark:border-success-800/50"
                : "bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-800"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {checked
                    ? <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />}
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className={cn("text-sm font-semibold", checked ? "text-success-800 dark:text-success-400" : "text-neutral-500 dark:text-neutral-400")}>{label}</p>
                        {tooltip && <InfoTooltip content={tooltip} />}
                    </div>
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
                <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", checked ? "left-[22px]" : "left-[3px]")} />
            </button>
        </div>
    );
}

/* ── Number Field ── */

function NumberField({ label, description, value, onChange, suffix, min, max, tooltip }: {
    label: string; description?: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                    className="w-20 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">{suffix}</span>}
            </div>
        </div>
    );
}

/* ── Select Row ── */

function SelectRow({ label, description, value, onChange, options, tooltip }: {
    label: string; description?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

/* ── Options ── */

const LOCATION_ACCURACY_OPTIONS = [
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

/* ── Defaults ── */

const DEFAULTS: ESSConfig = {
    // Payroll & Tax
    viewPayslips: true,
    downloadPayslips: true,
    downloadForm16: true,
    viewSalaryStructure: false,
    itDeclaration: true,
    // Leave
    leaveApplication: true,
    leaveBalanceView: true,
    leaveCancellation: false,
    // Attendance
    attendanceView: true,
    attendanceRegularization: false,
    viewShiftSchedule: false,
    shiftSwapRequest: false,
    wfhRequest: false,
    // Profile & Documents
    profileUpdate: false,
    documentUpload: false,
    employeeDirectory: false,
    viewOrgChart: false,
    // Financial
    reimbursementClaims: false,
    loanApplication: false,
    assetView: false,
    // Performance
    performanceGoals: false,
    appraisalAccess: false,
    feedback360: false,
    trainingEnrollment: false,
    // Support
    helpDesk: false,
    grievanceSubmission: false,
    holidayCalendar: true,
    policyDocuments: false,
    announcementBoard: false,
    // MSS
    mssViewTeam: false,
    mssApproveLeave: false,
    mssApproveAttendance: false,
    mssViewTeamAttendance: false,
    // Mobile Behavior
    mobileOfflinePunch: false,
    mobileSyncRetryMinutes: 5,
    mobileLocationAccuracy: "HIGH",
};

/* ── Section Config ── */

interface EssField {
    key: keyof ESSConfig;
    label: string;
    description?: string;
    tooltip?: string;
    type: "toggle" | "number" | "select";
    suffix?: string;
    min?: number;
    max?: number;
    options?: { value: string; label: string }[];
}

interface EssSection {
    title: string;
    sectionDescription?: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    fields: EssField[];
}

const SECTIONS: EssSection[] = [
    {
        title: "Payroll & Tax",
        sectionDescription: "Control what payroll and tax information employees can view and download through the self-service portal.",
        icon: Wallet,
        fields: [
            { key: "viewPayslips", label: "View Payslips", description: "Access monthly salary slips", type: "toggle" },
            { key: "downloadPayslips", label: "Download Payslips", description: "Allow PDF download of payslips", type: "toggle" },
            { key: "downloadForm16", label: "Download Form 16", description: "Access Form 16 / TDS certificate", type: "toggle" },
            { key: "viewSalaryStructure", label: "View Salary Structure", description: "Show salary component breakdown", type: "toggle" },
            { key: "itDeclaration", label: "IT Declaration", description: "Submit investment declarations for tax saving", type: "toggle" },
        ],
    },
    {
        title: "Leave",
        sectionDescription: "Configure which leave-related actions employees can perform on their own.",
        icon: Calendar,
        fields: [
            { key: "leaveApplication", label: "Leave Application", description: "Allow leave application through ESS", type: "toggle" },
            { key: "leaveBalanceView", label: "Leave Balance View", description: "Show available leave balances", type: "toggle" },
            { key: "leaveCancellation", label: "Leave Cancellation", description: "Allow cancelling pending/approved leave", type: "toggle" },
        ],
    },
    {
        title: "Attendance",
        sectionDescription: "Define which attendance features are available to employees in the self-service portal.",
        icon: Clock,
        fields: [
            { key: "attendanceView", label: "Attendance View", description: "Show daily attendance records", type: "toggle" },
            { key: "attendanceRegularization", label: "Attendance Regularization", description: "Request attendance corrections", type: "toggle" },
            { key: "viewShiftSchedule", label: "View Shift Schedule", description: "Display assigned shift roster", type: "toggle" },
            { key: "shiftSwapRequest", label: "Shift Swap Request", description: "Allow requesting shift swaps", type: "toggle", tooltip: "Allow employees to request swapping shifts with colleagues." },
            { key: "wfhRequest", label: "WFH Request", description: "Allow work from home requests", type: "toggle", tooltip: "Allow employees to request work-from-home days." },
        ],
    },
    {
        title: "Profile & Documents",
        sectionDescription: "Manage employee access to profile editing, document uploads, and organizational information.",
        icon: Eye,
        fields: [
            { key: "profileUpdate", label: "Profile Update", description: "Allow employees to request profile changes", type: "toggle" },
            { key: "documentUpload", label: "Document Upload", description: "Allow employees to upload documents", type: "toggle" },
            { key: "employeeDirectory", label: "Employee Directory", description: "Access company employee directory", type: "toggle" },
            { key: "viewOrgChart", label: "View Org Chart", description: "Display organisation hierarchy", type: "toggle" },
        ],
    },
    {
        title: "Financial",
        sectionDescription: "Control access to financial self-service features like reimbursements, loans, and asset tracking.",
        icon: CreditCard,
        fields: [
            { key: "reimbursementClaims", label: "Reimbursement Claims", description: "Submit expense reimbursements", type: "toggle" },
            { key: "loanApplication", label: "Loan Application", description: "Apply for company loans", type: "toggle" },
            { key: "assetView", label: "Asset View", description: "View assigned company assets", type: "toggle" },
        ],
    },
    {
        title: "Performance",
        sectionDescription: "Enable performance management features employees can access through self-service.",
        icon: Target,
        fields: [
            { key: "performanceGoals", label: "Performance Goals", description: "View and manage performance goals", type: "toggle" },
            { key: "appraisalAccess", label: "Appraisal Access", description: "Access appraisal forms and history", type: "toggle" },
            { key: "feedback360", label: "360 Feedback", description: "Participate in 360-degree feedback", type: "toggle" },
            { key: "trainingEnrollment", label: "Training Enrollment", description: "Enroll in training programs", type: "toggle" },
        ],
    },
    {
        title: "Support & Communication",
        sectionDescription: "Configure employee access to help desk, grievance submission, and company communications.",
        icon: HelpCircle,
        fields: [
            { key: "helpDesk", label: "Help Desk", description: "Access IT / HR help desk", type: "toggle" },
            { key: "grievanceSubmission", label: "Grievance Submission", description: "Submit workplace grievances", type: "toggle" },
            { key: "holidayCalendar", label: "Holiday Calendar", description: "View company holiday calendar", type: "toggle" },
            { key: "policyDocuments", label: "Policy Documents", description: "Access company policy documents", type: "toggle" },
            { key: "announcementBoard", label: "Announcement Board", description: "View company announcements", type: "toggle" },
        ],
    },
    {
        title: "Manager Self-Service",
        sectionDescription: "Control what managers can do for their direct reports through the portal.",
        icon: Users,
        fields: [
            { key: "mssViewTeam", label: "View Team Members", description: "Show direct reportees list", type: "toggle" },
            { key: "mssApproveLeave", label: "Approve/Reject Leave", description: "Allow leave approvals for team", type: "toggle" },
            { key: "mssApproveAttendance", label: "Approve Attendance", description: "Allow attendance regularization approvals", type: "toggle", tooltip: "Allow managers to approve or reject attendance regularization requests from their team." },
            { key: "mssViewTeamAttendance", label: "View Team Attendance", description: "Show team attendance summary", type: "toggle" },
        ],
    },
    {
        title: "Mobile Behavior",
        sectionDescription: "Configure mobile app behavior for attendance capture, offline support, and location tracking.",
        icon: Smartphone,
        fields: [
            { key: "mobileOfflinePunch", label: "Offline Punch", description: "Allow offline attendance capture on mobile", type: "toggle", tooltip: "Allow attendance punches to be recorded offline on mobile and synced later." },
            { key: "mobileSyncRetryMinutes", label: "Sync Retry Interval", description: "Minutes between offline sync retries", type: "number", suffix: "min", min: 1, max: 60, tooltip: "How often the mobile app retries syncing failed offline punches." },
            { key: "mobileLocationAccuracy", label: "Location Accuracy", description: "GPS accuracy level for mobile attendance", type: "select", options: LOCATION_ACCURACY_OPTIONS },
        ],
    },
];

/* ── Screen ── */

export function EssConfigScreen() {
    const { data, isLoading, isError } = useEssConfig();
    const updateMutation = useUpdateEssConfig();

    const [config, setConfig] = useState<ESSConfig>({ ...DEFAULTS });
    const [hasChanges, setHasChanges] = useState(false);

    const serverConfig: ESSConfig = (data?.data as ESSConfig) ?? DEFAULTS;

    useEffect(() => {
        if (data?.data) {
            setConfig({ ...DEFAULTS, ...serverConfig });
            setHasChanges(false);
        }
    }, [data]);

    const updateField = <K extends keyof ESSConfig>(key: K, value: ESSConfig[K]) => {
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
        setConfig({ ...DEFAULTS, ...serverConfig });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">ESS Configuration</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
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

    const toggleCount = SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.type === "toggle").length, 0);
    const enabledCount = SECTIONS.reduce((sum, s) => sum + s.fields.filter(f => f.type === "toggle" && config[f.key] === true).length, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">ESS Configuration</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {enabledCount} of {toggleCount} features enabled
                    </p>
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

            {/* Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECTIONS.map((section) => (
                    <div
                        key={section.title}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <section.icon size={16} className="text-primary-600" />
                                </div>
                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</h3>
                            </div>
                            {section.sectionDescription && (
                                <SectionDescription>{section.sectionDescription}</SectionDescription>
                            )}
                            {!section.sectionDescription && <div className="mb-5" />}
                            <div className="space-y-3">
                                {section.fields.map((field) => {
                                    if (field.type === "toggle") {
                                        return (
                                            <Toggle
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                checked={config[field.key] as boolean}
                                                onChange={(v) => updateField(field.key, v as never)}
                                                tooltip={field.tooltip}
                                            />
                                        );
                                    }
                                    if (field.type === "number") {
                                        return (
                                            <NumberField
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                value={config[field.key] as number}
                                                onChange={(v) => updateField(field.key, v as never)}
                                                suffix={field.suffix}
                                                min={field.min}
                                                max={field.max}
                                                tooltip={field.tooltip}
                                            />
                                        );
                                    }
                                    if (field.type === "select") {
                                        return (
                                            <SelectRow
                                                key={field.key}
                                                label={field.label}
                                                description={field.description}
                                                value={config[field.key] as string}
                                                onChange={(v) => updateField(field.key, v as never)}
                                                options={field.options ?? []}
                                                tooltip={field.tooltip}
                                            />
                                        );
                                    }
                                    return null;
                                })}
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
