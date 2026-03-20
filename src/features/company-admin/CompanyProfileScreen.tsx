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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyProfile } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateProfileSection } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

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

// ── Main Screen ──

export function CompanyProfileScreen() {
    const { data, isLoading, isError } = useCompanyProfile();
    const updateMutation = useUpdateProfileSection();

    const [editSection, setEditSection] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Record<string, any>>({});

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
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Company Profile</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">View and manage your company information</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column — Read-only Info */}
                <div className="space-y-6">
                    {/* Company Identity (read-only) */}
                    <SectionCard title="Company Identity" icon={Building2}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <DetailField label="Company Code" value={profile.companyCode} mono />
                            <DetailField label="Industry" value={profile.industry} />
                            <DetailField label="Business Type" value={profile.businessType} />
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
                        </div>
                    </SectionCard>

                    {/* Online Presence (read-only) */}
                    <SectionCard title="Online Presence" icon={Globe}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <DetailField label="Website" value={profile.website} />
                            <DetailField label="Email Domain" value={profile.emailDomain ? `@${profile.emailDomain}` : null} mono />
                            <DetailField label="Employee Count" value={profile.employeeCount} />
                        </div>
                    </SectionCard>
                </div>

                {/* Right Column — Editable Sections */}
                <div className="space-y-6">
                    {/* Names (editable) */}
                    <SectionCard
                        title="Display & Legal Name"
                        icon={Edit3}
                        onEdit={() => openEdit("names", {
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
                        onEdit={() => openEdit("registeredAddress", {
                            line1: regAddress.line1 ?? "",
                            line2: regAddress.line2 ?? "",
                            city: regAddress.city ?? "",
                            district: regAddress.district ?? "",
                            state: regAddress.state ?? "",
                            country: regAddress.country ?? "",
                            pin: regAddress.pin ?? "",
                            stdCode: regAddress.stdCode ?? "",
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
                        onEdit={() => openEdit("corporateAddress", {
                            line1: corpAddress.line1 ?? "",
                            line2: corpAddress.line2 ?? "",
                            city: corpAddress.city ?? "",
                            district: corpAddress.district ?? "",
                            state: corpAddress.state ?? "",
                            country: corpAddress.country ?? "",
                            pin: corpAddress.pin ?? "",
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

            {/* ── Edit Modals ── */}
            {/* Names */}
            <EditModal
                open={editSection === "names"}
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
                open={editSection === "registeredAddress"}
                onClose={closeEdit}
                title="Edit Registered Address"
                onSave={handleSave}
                saving={updateMutation.isPending}
            >
                <FormField label="Address Line 1" value={editForm.line1 ?? ""} onChange={(v) => updateField("line1", v)} />
                <FormField label="Address Line 2" value={editForm.line2 ?? ""} onChange={(v) => updateField("line2", v)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" value={editForm.city ?? ""} onChange={(v) => updateField("city", v)} />
                    <FormField label="District" value={editForm.district ?? ""} onChange={(v) => updateField("district", v)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="State" value={editForm.state ?? ""} onChange={(v) => updateField("state", v)} />
                    <FormField label="PIN Code" value={editForm.pin ?? ""} onChange={(v) => updateField("pin", v)} mono />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Country" value={editForm.country ?? ""} onChange={(v) => updateField("country", v)} />
                    <FormField label="STD Code" value={editForm.stdCode ?? ""} onChange={(v) => updateField("stdCode", v)} mono />
                </div>
            </EditModal>

            {/* Corporate Address */}
            <EditModal
                open={editSection === "corporateAddress"}
                onClose={closeEdit}
                title="Edit Corporate Address"
                onSave={handleSave}
                saving={updateMutation.isPending}
            >
                <FormField label="Address Line 1" value={editForm.line1 ?? ""} onChange={(v) => updateField("line1", v)} />
                <FormField label="Address Line 2" value={editForm.line2 ?? ""} onChange={(v) => updateField("line2", v)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" value={editForm.city ?? ""} onChange={(v) => updateField("city", v)} />
                    <FormField label="District" value={editForm.district ?? ""} onChange={(v) => updateField("district", v)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="State" value={editForm.state ?? ""} onChange={(v) => updateField("state", v)} />
                    <FormField label="PIN Code" value={editForm.pin ?? ""} onChange={(v) => updateField("pin", v)} mono />
                </div>
                <FormField label="Country" value={editForm.country ?? ""} onChange={(v) => updateField("country", v)} />
            </EditModal>
        </div>
    );
}
