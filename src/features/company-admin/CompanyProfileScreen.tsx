import { useState, useEffect, useCallback } from "react";
import {
    Building2,
    Edit3,
    MapPin,
    Landmark,
    Globe,
    Mail,
    CheckCircle2,
    Loader2,
    X,
    Calendar,
    Settings2,
    Sliders,
    CreditCard,
    Users,
    Hash,
    AlertCircle,
    Contact,
    Clock,
    ArrowRight,
    Lock,
    Plus,
    Minus,
    ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCompanyProfile } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateProfileSection, useAddLocationModules, useRemoveLocationModule } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import { MODULE_CATALOGUE, FY_OPTIONS, MONTHS } from "@/features/super-admin/tenant-onboarding/constants";

// ── Primitives ──

function DetailField({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-500">{label}</p>
            <p className={cn(
                "text-sm font-semibold text-primary-950 dark:text-white",
                mono && "font-mono bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-100 dark:border-neutral-800 text-xs inline-block",
                !value && "text-neutral-300 dark:text-neutral-500 italic font-normal"
            )}>
                {value || "\u2014"}
            </p>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, onEdit }: {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    children: React.ReactNode;
    onEdit?: () => void;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Icon size={16} className="text-primary-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                    </div>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 border border-primary-100 dark:border-primary-800/50 transition-colors"
                        >
                            <Edit3 size={11} />
                            Edit
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

// ── Edit Modal ──

function EditModal({ open, onClose, title, children, onSave, saving }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave: () => void;
    saving: boolean;
}) {
    const handleEscKey = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [open, handleEscKey]);

    if (!open) return null;
    const modalId = title.toLowerCase().replace(/\s+/g, '-') + '-title';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby={modalId}>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 id={modalId} className="text-lg font-bold text-primary-950 dark:text-white">{title}</h2>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {children}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, mono = false }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    mono?: boolean;
}) {
    const fieldId = label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div>
            <label htmlFor={fieldId} className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                id={fieldId}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                    mono && "font-mono"
                )}
            />
        </div>
    );
}

function BooleanBadge({ label, enabled }: { label: string; enabled?: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
            enabled
                ? "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-100 dark:border-success-800/50"
                : "bg-neutral-50 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-700"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", enabled ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-600")} />
            {label}
        </span>
    );
}

function StatCard({ label, count, icon: Icon, to }: {
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    to: string;
}) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(to)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all group text-left w-full"
        >
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-primary-950 dark:text-white">{count}</p>
                <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{label}</p>
            </div>
            <ArrowRight size={16} className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
        </button>
    );
}

// ── Main Screen ──

export function CompanyProfileScreen() {
    const { data, isLoading, isError } = useCompanyProfile();
    const updateMutation = useUpdateProfileSection();
    const addModulesMutation = useAddLocationModules();
    const removeModuleMutation = useRemoveLocationModule();
    const navigate = useNavigate();

    const [editSection, setEditSection] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Record<string, any>>({});
    const [confirmAction, setConfirmAction] = useState<{
        type: 'add' | 'remove';
        locationId: string;
        locationName: string;
        moduleId: string;
        moduleName: string;
        modulePrice: number;
        autoDeps: string[];
    } | null>(null);
    const [moduleError, setModuleError] = useState<string | null>(null);

    const profile = data?.data as any;

    const openEdit = (section: string, fields: Record<string, any>) => {
        setEditSection(section);
        setEditForm({ ...fields });
    };

    const closeEdit = () => {
        setEditSection(null);
        setEditForm({});
    };

    const handleSave = async () => {
        if (!editSection) return;
        try {
            await updateMutation.mutateAsync({ sectionKey: editSection, data: editForm });
            showSuccess("Profile Updated", `${editSection} section has been saved.`);
            closeEdit();
        } catch (err) {
            showApiError(err);
        }
    };

    const updateField = (key: string, value: any) => {
        setEditForm((prev) => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Profile</h1></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Building2 className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load profile</p>
                <p className="text-sm text-neutral-500">Please try again later.</p>
            </div>
        );
    }

    const regAddress = (profile.registeredAddress as any) ?? {};
    const corpAddress = (profile.corporateAddress as any) ?? {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-5">
                {profile?.logoUrl ? (
                    <img src={profile.logoUrl} alt="Company Logo" className="w-20 h-20 rounded-2xl object-contain border border-neutral-200 dark:border-neutral-700" />
                ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center border border-primary-200 dark:border-primary-800 flex-shrink-0">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {(profile?.displayName || profile?.name || "C").slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Profile</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and manage your company information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column — Read-only Info */}
                <div className="space-y-6">
                    {/* Company Identity (read-only) */}
                    <SectionCard title="Company Identity" icon={Building2}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <DetailField label="Company Name" value={profile.name} />
                            <DetailField label="Company Code" value={profile.companyCode} mono />
                            <DetailField label="Industry" value={profile.industry} />
                            <DetailField label="Business Type" value={profile.businessType} />
                            <DetailField label="Company Size" value={profile.size} />
                            <DetailField label="Employee Count" value={profile.employeeCount?.toString()} />
                            <DetailField label="CIN" value={profile.cin} mono />
                            <DetailField label="Incorporation Date" value={profile.incorporationDate} />
                            <DetailField label="Status" value={profile.wizardStatus} />
                        </div>
                    </SectionCard>

                    {/* Statutory IDs (read-only) */}
                    <SectionCard title="Statutory & Tax IDs" icon={Landmark}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <DetailField label="PAN" value={profile.pan} mono />
                            <DetailField label="TAN" value={profile.tan} mono />
                            <DetailField label="GSTIN" value={profile.gstin} mono />
                            <DetailField label="PF Reg. No." value={profile.pfRegNo} mono />
                            <DetailField label="ESI Code" value={profile.esiCode} mono />
                            <DetailField label="PT Registration" value={profile.ptReg} mono />
                            <DetailField label="LWF Registration" value={profile.lwfrNo} mono />
                            <DetailField label="ROC State" value={profile.rocState} />
                        </div>
                    </SectionCard>

                    {/* Online Presence (read-only) */}
                    <SectionCard title="Online Presence" icon={Globe}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <DetailField label="Website" value={profile.website} />
                            <DetailField label="Email Domain" value={profile.emailDomain ? `@${profile.emailDomain}` : null} mono />
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column — Editable Sections */}
                <div className="space-y-6">
                    {/* Names (editable) */}
                    <SectionCard
                        title="Display & Legal Name"
                        icon={Edit3}
                        onEdit={() => openEdit("identity", {
                            displayName: profile.displayName ?? "",
                            legalName: profile.legalName ?? "",
                            shortName: profile.shortName ?? "",
                        })}
                    >
                        <div className="grid grid-cols-1 gap-y-4">
                            <DetailField label="Display Name" value={profile.displayName} />
                            <DetailField label="Legal Name" value={profile.legalName} />
                            <DetailField label="Short Name" value={profile.shortName} />
                        </div>
                    </SectionCard>

                    {/* Registered Address (editable) */}
                    <SectionCard
                        title="Registered Address"
                        icon={MapPin}
                        onEdit={() => openEdit("address", {
                            registered: {
                                line1: regAddress.line1 ?? "",
                                line2: regAddress.line2 ?? "",
                                city: regAddress.city ?? "",
                                district: regAddress.district ?? "",
                                state: regAddress.state ?? "",
                                country: regAddress.country ?? "",
                                pin: regAddress.pin ?? "",
                                stdCode: regAddress.stdCode ?? "",
                            },
                            sameAsRegistered: profile.sameAsRegistered ?? false,
                        })}
                    >
                        {regAddress.line1 ? (
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-800">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white">{regAddress.line1}</p>
                                {regAddress.line2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{regAddress.line2}</p>}
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                    {[regAddress.city, regAddress.district, regAddress.pin].filter(Boolean).join(", ")}
                                </p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                    {[regAddress.state, regAddress.country].filter(Boolean).join(", ")}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 italic">No address configured</p>
                        )}
                    </SectionCard>

                    {/* Corporate Address (editable) */}
                    <SectionCard
                        title="Corporate Address"
                        icon={MapPin}
                        onEdit={() => openEdit("address", {
                            sameAsRegistered: false,
                            corporate: {
                                line1: corpAddress.line1 ?? "",
                                line2: corpAddress.line2 ?? "",
                                city: corpAddress.city ?? "",
                                district: corpAddress.district ?? "",
                                state: corpAddress.state ?? "",
                                country: corpAddress.country ?? "",
                                pin: corpAddress.pin ?? "",
                            },
                        })}
                    >
                        {profile.sameAsRegistered ? (
                            <div className="flex items-center gap-2 px-4 py-3 bg-info-50 dark:bg-info-900/20 rounded-xl border border-info-100 dark:border-info-800/50">
                                <CheckCircle2 size={13} className="text-info-500 flex-shrink-0" />
                                <p className="text-xs font-semibold text-info-700 dark:text-info-400">Same as registered address</p>
                            </div>
                        ) : corpAddress.line1 ? (
                            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-neutral-800">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white">{corpAddress.line1}</p>
                                {corpAddress.line2 && <p className="text-sm text-neutral-600 dark:text-neutral-300">{corpAddress.line2}</p>}
                                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                    {[corpAddress.city, corpAddress.state, corpAddress.pin].filter(Boolean).join(", ")}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-400 italic">No address configured</p>
                        )}
                    </SectionCard>
                </div>
            </div>

            {/* ── Fiscal Config ── */}
            {profile.fiscalConfig && (
                <SectionCard title="Fiscal Configuration" icon={Calendar}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                        <DetailField label="Financial Year" value={(() => {
                            const fc = profile.fiscalConfig;
                            const fyOpt = FY_OPTIONS.find((o) => o.key === fc.fyType);
                            if (fc.fyType === 'custom' && fc.fyCustomStartMonth && fc.fyCustomEndMonth) {
                                const startMonth = MONTHS.find((m) => m.key === fc.fyCustomStartMonth || m.label === fc.fyCustomStartMonth);
                                const endMonth = MONTHS.find((m) => m.key === fc.fyCustomEndMonth || m.label === fc.fyCustomEndMonth);
                                return `${startMonth?.label ?? fc.fyCustomStartMonth} – ${endMonth?.label ?? fc.fyCustomEndMonth}`;
                            }
                            return fyOpt?.label ?? fc.fyType;
                        })()} />
                        <DetailField label="Timezone" value={profile.fiscalConfig.timezone} />
                        <DetailField label="Payroll Frequency" value={profile.fiscalConfig.payrollFreq} />
                        <DetailField label="Cutoff Day" value={profile.fiscalConfig.cutoffDay?.toString()} />
                        <DetailField label="Disbursement Day" value={profile.fiscalConfig.disbursementDay?.toString()} />
                        <DetailField label="Week Start" value={profile.fiscalConfig.weekStart} />
                        <DetailField label="Working Days" value={Array.isArray(profile.fiscalConfig.workingDays) ? profile.fiscalConfig.workingDays.join(", ") : profile.fiscalConfig.workingDays} />
                    </div>
                </SectionCard>
            )}

            {/* ── Preferences ── */}
            {profile.preferences && (
                <SectionCard title="Preferences" icon={Settings2}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 mb-5">
                        <DetailField label="Currency" value={profile.preferences.currency} />
                        <DetailField label="Language" value={profile.preferences.language} />
                        <DetailField label="Date Format" value={profile.preferences.dateFormat} mono />
                        <DetailField label="Time Format" value={profile.preferences.timeFormat} mono />
                        <DetailField label="Number Format" value={profile.preferences.numberFormat} mono />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <BooleanBadge label="ESS Portal" enabled={profile.preferences.ess} />
                        <BooleanBadge label="Mobile App" enabled={profile.preferences.mobileApp} />
                        <BooleanBadge label="Web App" enabled={profile.preferences.webApp} />
                        <BooleanBadge label="Email Notifications" enabled={profile.preferences.emailNotif} />
                        <BooleanBadge label="Biometric" enabled={profile.preferences.biometric} />
                        <BooleanBadge label="Geo Fencing" enabled={profile.preferences.geoFencing} />
                        <BooleanBadge label="Multi-Currency" enabled={profile.preferences.multiCurrency} />
                        <BooleanBadge label="Multi-Language" enabled={profile.preferences.multiLanguage} />
                    </div>
                </SectionCard>
            )}

            {/* ── System Controls ── */}
            {profile.systemControls && (
                <SectionCard title="System Controls" icon={Sliders}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(profile.systemControls as Record<string, boolean | string | number>).map(([key, value]) => {
                            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
                            const isBoolean = typeof value === "boolean";
                            return isBoolean ? (
                                <div key={key} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", value ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-600")} />
                                    <span className="text-xs font-semibold text-primary-950 dark:text-white truncate">{label}</span>
                                </div>
                            ) : (
                                <div key={key} className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
                                    <p className="text-xs font-semibold text-primary-950 dark:text-white truncate">{String(value)}</p>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            {/* ── Subscription Info ── */}
            {profile.tenant && (() => {
                const sub = profile.tenant.subscriptions?.[0];
                return (
                    <SectionCard title="Subscription" icon={CreditCard}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                            <DetailField label="Tenant Status" value={profile.tenant.status} />
                            <DetailField label="Plan" value={sub?.planId ?? "—"} />
                            <DetailField label="User Tier" value={sub?.userTier ?? "—"} />
                            <DetailField label="Billing Type" value={sub?.billingType ?? "—"} />
                            <DetailField label="Subscription Status" value={sub?.status ?? "—"} />
                            <DetailField label="Trial Ends" value={sub?.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"} />
                        </div>
                        {/* Interactive Module Management per Location */}
                        {profile.locations && profile.locations.length > 0 && (
                            <div className="mt-5 space-y-6">
                                {profile.locations.map((loc: any) => {
                                    const locModuleIds: string[] = (loc.moduleIds as string[] | null) ?? [];
                                    const isOneTimeBilling = loc.billingType !== 'monthly' && loc.billingType !== 'annual' && (loc.oneTimeLicenseFee > 0 || (!loc.billingType && profile.tenant?.subscriptions?.[0]?.billingType !== 'monthly' && profile.tenant?.subscriptions?.[0]?.billingType !== 'annual'));
                                    return (
                                        <div key={loc.id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 uppercase tracking-wider">{loc.name}</span>
                                                {loc.isHQ && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300">HQ</span>}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {MODULE_CATALOGUE.map((mod) => {
                                                    const isActive = locModuleIds.includes(mod.id);
                                                    const isMasters = mod.id === 'masters';
                                                    const depNames = mod.dependencies.map((depId) => MODULE_CATALOGUE.find((m) => m.id === depId)?.name ?? depId);
                                                    // Find auto-dependencies that would be added
                                                    const missingDeps = mod.dependencies.filter((depId) => !locModuleIds.includes(depId));
                                                    const autoDeps = missingDeps.map((depId) => MODULE_CATALOGUE.find((m) => m.id === depId)?.name ?? depId);

                                                    return (
                                                        <div
                                                            key={mod.id}
                                                            className={cn(
                                                                "rounded-xl p-3 transition-all",
                                                                isMasters
                                                                    ? "border-2 border-primary-200 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/20"
                                                                    : isActive
                                                                        ? "border-2 border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-900/20"
                                                                        : "border border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50"
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="text-base flex-shrink-0">{mod.icon}</span>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-primary-950 dark:text-white truncate">{mod.name}</p>
                                                                        <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                                                                            {"\u20B9"}{mod.price.toLocaleString('en-IN')}/mo
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {isMasters ? (
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex-shrink-0">
                                                                        <Lock size={9} />
                                                                        Required
                                                                    </span>
                                                                ) : isOneTimeBilling ? (
                                                                    <button
                                                                        onClick={() => navigate('/app/help', { state: { prefill: { subject: `${isActive ? 'Remove' : 'Add'} module: ${mod.name}`, message: `I would like to ${isActive ? 'remove' : 'add'} the "${mod.name}" module for location "${loc.name}".`, category: 'billing' } } })}
                                                                        className={cn(
                                                                            "flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full flex-shrink-0 transition-colors",
                                                                            isActive
                                                                                ? "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 hover:bg-warning-100"
                                                                                : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                                                                        )}
                                                                    >
                                                                        <ExternalLink size={10} />
                                                                        {isActive ? 'Request Remove' : 'Request Add'}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setModuleError(null);
                                                                            setConfirmAction({
                                                                                type: isActive ? 'remove' : 'add',
                                                                                locationId: loc.id,
                                                                                locationName: loc.name,
                                                                                moduleId: mod.id,
                                                                                moduleName: mod.name,
                                                                                modulePrice: mod.price,
                                                                                autoDeps: isActive ? [] : autoDeps,
                                                                            });
                                                                        }}
                                                                        disabled={addModulesMutation.isPending || removeModuleMutation.isPending}
                                                                        className={cn(
                                                                            "flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full flex-shrink-0 transition-colors disabled:opacity-50",
                                                                            isActive
                                                                                ? "bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 hover:bg-danger-100"
                                                                                : "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-100"
                                                                        )}
                                                                    >
                                                                        {isActive ? <Minus size={10} /> : <Plus size={10} />}
                                                                        {isActive ? 'Remove' : 'Add'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {depNames.length > 0 && (
                                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 pl-7">
                                                                    Requires: {depNames.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>
                );
            })()}

            {/* ── Quick Stats / Summary Cards ── */}
            <div>
                <h2 className="text-sm font-bold text-primary-950 dark:text-white mb-4 uppercase tracking-wider">Quick Navigation</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Locations" count={profile?.locations?.length || 0} icon={MapPin} to="/app/company/locations" />
                    <StatCard label="Contacts" count={profile?.contacts?.length || 0} icon={Contact} to="/app/company/contacts" />
                    <StatCard label="Shifts" count={profile?.shifts?.length || 0} icon={Clock} to="/app/company/shifts" />
                    <StatCard label="Users" count={profile?.users?.length || 0} icon={Users} to="/app/company/users" />
                    <StatCard label="No Series" count={profile?.noSeries?.length || 0} icon={Hash} to="/app/company/no-series" />
                    <StatCard label="IOT Reasons" count={profile?.iotReasons?.length || 0} icon={AlertCircle} to="/app/company/iot-reasons" />
                </div>
            </div>

            {/* ── Edit Modals ── */}
            {/* Identity (Names) */}
            <EditModal
                open={editSection === "identity"}
                onClose={closeEdit}
                title="Edit Company Names"
                onSave={handleSave}
                saving={updateMutation.isPending}
            >
                <FormField label="Display Name" value={editForm.displayName ?? ""} onChange={(v) => updateField("displayName", v)} placeholder="Company display name" />
                <FormField label="Legal Name" value={editForm.legalName ?? ""} onChange={(v) => updateField("legalName", v)} placeholder="Full legal entity name" />
                <FormField label="Short Name" value={editForm.shortName ?? ""} onChange={(v) => updateField("shortName", v)} placeholder="Abbreviated name" />
            </EditModal>

            {/* Registered Address */}
            <EditModal
                open={editSection === "address" && !!editForm.registered}
                onClose={closeEdit}
                title="Edit Registered Address"
                onSave={handleSave}
                saving={updateMutation.isPending}
            >
                <FormField label="Address Line 1" value={editForm.registered?.line1 ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, line1: v } }))} />
                <FormField label="Address Line 2" value={editForm.registered?.line2 ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, line2: v } }))} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" value={editForm.registered?.city ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, city: v } }))} />
                    <FormField label="District" value={editForm.registered?.district ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, district: v } }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="State" value={editForm.registered?.state ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, state: v } }))} />
                    <FormField label="PIN Code" value={editForm.registered?.pin ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, pin: v } }))} mono />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Country" value={editForm.registered?.country ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, country: v } }))} />
                    <FormField label="STD Code" value={editForm.registered?.stdCode ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, registered: { ...prev.registered, stdCode: v } }))} mono />
                </div>
            </EditModal>

            {/* Corporate Address */}
            <EditModal
                open={editSection === "address" && !!editForm.corporate}
                onClose={closeEdit}
                title="Edit Corporate Address"
                onSave={handleSave}
                saving={updateMutation.isPending}
            >
                <FormField label="Address Line 1" value={editForm.corporate?.line1 ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, line1: v } }))} />
                <FormField label="Address Line 2" value={editForm.corporate?.line2 ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, line2: v } }))} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" value={editForm.corporate?.city ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, city: v } }))} />
                    <FormField label="District" value={editForm.corporate?.district ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, district: v } }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="State" value={editForm.corporate?.state ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, state: v } }))} />
                    <FormField label="PIN Code" value={editForm.corporate?.pin ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, pin: v } }))} mono />
                </div>
                <FormField label="Country" value={editForm.corporate?.country ?? ""} onChange={(v) => setEditForm((prev) => ({ ...prev, corporate: { ...prev.corporate, country: v } }))} />
            </EditModal>

            {/* Module Add/Remove Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                                {confirmAction.type === 'add' ? 'Add Module' : 'Remove Module'}
                            </h2>
                            <button onClick={() => { setConfirmAction(null); setModuleError(null); }} aria-label="Close" className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{MODULE_CATALOGUE.find((m) => m.id === confirmAction.moduleId)?.icon ?? '📦'}</span>
                                <div>
                                    <p className="text-sm font-bold text-primary-950 dark:text-white">{confirmAction.moduleName}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        for {confirmAction.locationName}
                                    </p>
                                </div>
                            </div>

                            {confirmAction.type === 'add' && (
                                <>
                                    <div className="bg-info-50 dark:bg-info-900/20 rounded-xl px-4 py-3 border border-info-100 dark:border-info-800/50">
                                        <p className="text-xs font-semibold text-info-700 dark:text-info-400">
                                            This will add {"\u20B9"}{confirmAction.modulePrice.toLocaleString('en-IN')}/mo to your billing.
                                        </p>
                                    </div>
                                    {confirmAction.autoDeps.length > 0 && (
                                        <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl px-4 py-3 border border-warning-100 dark:border-warning-800/50">
                                            <p className="text-xs font-semibold text-warning-700 dark:text-warning-400">
                                                Auto-adding dependencies: {confirmAction.autoDeps.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {confirmAction.type === 'remove' && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl px-4 py-3 border border-danger-100 dark:border-danger-800/50">
                                    <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">
                                        This module will be deactivated for this location. Any associated data will be retained.
                                    </p>
                                </div>
                            )}

                            {moduleError && (
                                <div className="bg-danger-50 dark:bg-danger-900/20 rounded-xl px-4 py-3 border border-danger-200 dark:border-danger-800">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={14} className="text-danger-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs font-semibold text-danger-700 dark:text-danger-400">{moduleError}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                onClick={() => { setConfirmAction(null); setModuleError(null); }}
                                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setModuleError(null);
                                    try {
                                        if (confirmAction.type === 'add') {
                                            const missingDeps = MODULE_CATALOGUE.find((m) => m.id === confirmAction.moduleId)?.dependencies.filter((depId) => {
                                                const loc = profile.locations?.find((l: any) => l.id === confirmAction.locationId);
                                                const locMods: string[] = (loc?.moduleIds as string[] | null) ?? [];
                                                return !locMods.includes(depId);
                                            }) ?? [];
                                            const allModuleIds = [confirmAction.moduleId, ...missingDeps];
                                            await addModulesMutation.mutateAsync({ locationId: confirmAction.locationId, moduleIds: allModuleIds });
                                            showSuccess('Module Added', `${confirmAction.moduleName} has been activated.`);
                                        } else {
                                            await removeModuleMutation.mutateAsync({ locationId: confirmAction.locationId, moduleId: confirmAction.moduleId });
                                            showSuccess('Module Removed', `${confirmAction.moduleName} has been deactivated.`);
                                        }
                                        setConfirmAction(null);
                                    } catch (err: any) {
                                        if (err?.response?.status === 409) {
                                            const dependents = err?.response?.data?.dependents ?? err?.response?.data?.message ?? 'Other modules depend on this module.';
                                            const msg = typeof dependents === 'string'
                                                ? dependents
                                                : Array.isArray(dependents)
                                                    ? `Cannot remove: required by ${dependents.join(', ')}`
                                                    : 'Cannot remove: other modules depend on this module.';
                                            setModuleError(msg);
                                        } else {
                                            showApiError(err);
                                            setConfirmAction(null);
                                        }
                                    }
                                }}
                                disabled={addModulesMutation.isPending || removeModuleMutation.isPending}
                                className={cn(
                                    "flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                                    confirmAction.type === 'add'
                                        ? "bg-success-600 hover:bg-success-700"
                                        : "bg-danger-600 hover:bg-danger-700"
                                )}
                            >
                                {(addModulesMutation.isPending || removeModuleMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                                {(addModulesMutation.isPending || removeModuleMutation.isPending)
                                    ? 'Processing...'
                                    : confirmAction.type === 'add' ? 'Confirm Add' : 'Confirm Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
