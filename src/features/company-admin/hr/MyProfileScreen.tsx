import { useState } from "react";
import { UserCircle, Mail, Phone, Briefcase, CreditCard, Shield, Pencil, X, Loader2 } from "lucide-react";
import { useMyProfile } from "@/features/company-admin/api/use-ess-queries";
import { useUpdateMyProfile } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Types (align with GET /hr/ess/my-profile `data`) ── */

interface NamedRef {
    id: string;
    name: string;
    code?: string | null;
}

interface ShiftRef extends NamedRef {
    fromTime?: string | null;
    toTime?: string | null;
}

interface ManagerRef {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
}

export interface EssMyProfileData {
    id: string;
    employeeId: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    maritalStatus?: string | null;
    bloodGroup?: string | null;
    nationality?: string | null;
    fatherMotherName?: string | null;
    personalMobile?: string | null;
    alternativeMobile?: string | null;
    personalEmail?: string | null;
    officialEmail?: string | null;
    profilePhotoUrl?: string | null;
    currentAddress?: unknown;
    permanentAddress?: unknown;
    emergencyContactName?: string | null;
    emergencyContactRelation?: string | null;
    emergencyContactMobile?: string | null;
    joiningDate?: string | null;
    probationEndDate?: string | null;
    confirmationDate?: string | null;
    noticePeriodDays?: number | null;
    department?: NamedRef | null;
    designation?: NamedRef | null;
    grade?: NamedRef | null;
    employeeType?: NamedRef | null;
    shift?: ShiftRef | null;
    location?: NamedRef | null;
    costCentre?: NamedRef | null;
    reportingManager?: ManagerRef | null;
    functionalManager?: ManagerRef | null;
    status?: string | null;
    workType?: string | null;
    bankName?: string | null;
    /** Last 4 digits only (sanitized by GET /hr/ess/my-profile). */
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    bankBranch?: string | null;
    accountType?: string | null;
    panNumber?: string | null;
    aadhaarNumber?: string | null;
    uan?: string | null;
    esiIpNumber?: string | null;
    /** Legacy / alternate keys some clients sent */
    email?: string | null;
    phone?: string | null;
    pan?: string | null;
    aadhaar?: string | null;
    bankAccountNo?: string | null;
    ifscCode?: string | null;
    esiNumber?: string | null;
    fatherName?: string | null;
    dateOfJoining?: string | null;
}

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** Backend sends only last 4 digits in `bankAccountNumber`; format for display. */
function formatBankAccountLastFour(last4: string | null | undefined): string | undefined {
    if (!last4) return undefined;
    return "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " + last4;
}

const maskPAN = (pan: string | null | undefined) => {
    if (!pan) return "—";
    if (pan.length <= 4) return pan;
    return pan.slice(0, 2) + "\u2022\u2022\u2022\u2022\u2022" + pan.slice(-2);
};

/** Humanize enum-like strings: MALE → Male, ON_SITE → On site */
function humanizeEnum(value: string | null | undefined): string {
    if (value == null || value === "") return "—";
    const s = String(value).replace(/_/g, " ").toLowerCase();
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** ESS API returns many fields as `{ id, name }` (or manager as `{ firstName, lastName }`). Coerce for display. */
function displayProfileField(value: unknown): string {
    if (value == null || value === "") return "—";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "object") {
        const o = value as Record<string, unknown>;
        if ("firstName" in o || "lastName" in o) {
            const parts = [o.firstName, o.lastName].filter((x) => typeof x === "string" && x.length > 0);
            return parts.length ? parts.join(" ") : "—";
        }
        if (typeof o.name === "string" && o.name.length > 0) {
            const code = typeof o.code === "string" && o.code.length > 0 ? ` (${o.code})` : "";
            return o.name + code;
        }
        if (typeof o.code === "string" && o.code.length > 0) return o.code;
    }
    return "—";
}

function formatGrade(grade: EssMyProfileData["grade"]): string {
    if (grade == null) return "—";
    if (typeof grade === "object" && grade !== null) {
        const g = grade as NamedRef;
        const name = g.name ?? "";
        const code = g.code ? ` (${g.code})` : "";
        return (name + code).trim() || "—";
    }
    return "—";
}

function formatShift(shift: EssMyProfileData["shift"]): string {
    if (shift == null) return "—";
    if (typeof shift === "object") {
        const s = shift as ShiftRef;
        const name = s.name ?? "";
        const from = s.fromTime ?? "";
        const to = s.toTime ?? "";
        const time =
            from && to ? ` · ${from} – ${to}` : from ? ` · from ${from}` : to ? ` · until ${to}` : "";
        return (name + time).trim() || "—";
    }
    return "—";
}

function formatAddress(addr: unknown): string {
    if (addr == null || addr === "") return "—";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object" && addr !== null) {
        const o = addr as Record<string, unknown>;
        const parts = [o.line1, o.line2, o.city, o.state, o.pincode, o.country, o.district].filter(
            (x) => typeof x === "string" && x.length > 0,
        ) as string[];
        if (parts.length) return parts.join(", ");
        try {
            return JSON.stringify(addr);
        } catch {
            return "—";
        }
    }
    return "—";
}

function buildFullName(p: EssMyProfileData): string {
    const parts = [p.firstName, p.middleName, p.lastName].filter((x) => typeof x === "string" && x.trim().length > 0);
    if (parts.length) return parts.join(" ");
    return "Employee";
}

function isImageSrc(url: string | undefined | null): url is string {
    if (!url || typeof url !== "string") return false;
    return url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

/* ── Info Row ── */

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-primary-950 dark:text-white text-right max-w-[60%] break-words">{value || "—"}</span>
        </div>
    );
}

/* ── Section Card ── */

function ProfileSection({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-primary-600" />
                    </div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

/* ── Screen ── */

const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

const EMPTY_EDIT_FORM = {
    personalMobile: "",
    alternativeMobile: "",
    personalEmail: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactMobile: "",
    maritalStatus: "",
    bloodGroup: "",
};

export function MyProfileScreen() {
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ ...EMPTY_EDIT_FORM });

    const { data, isLoading, isError } = useMyProfile();
    const updateProfile = useUpdateMyProfile();
    const profile = (data?.data ?? null) as EssMyProfileData | null;

    const openEdit = () => {
        if (profile) {
            setEditForm({
                personalMobile: profile.personalMobile ?? profile.phone ?? "",
                alternativeMobile: profile.alternativeMobile ?? "",
                personalEmail: profile.personalEmail ?? profile.email ?? "",
                emergencyContactName: profile.emergencyContactName ?? "",
                emergencyContactRelation: profile.emergencyContactRelation ?? "",
                emergencyContactMobile: profile.emergencyContactMobile ?? "",
                maritalStatus: profile.maritalStatus ?? "",
                bloodGroup: profile.bloodGroup ?? "",
            });
        }
        setEditOpen(true);
    };

    const handleSaveProfile = async () => {
        try {
            await updateProfile.mutateAsync(editForm);
            showSuccess("Profile Updated", "Your profile has been updated successfully.");
            setEditOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Profile</h1>
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
                <UserCircle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load profile</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Please try again later.</p>
            </div>
        );
    }

    if (!profile || !profile.firstName) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <UserCircle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Profile Not Linked</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md text-center">
                    Your user account is not yet linked to an employee record. Please contact HR to set up your employee profile.
                </p>
            </div>
        );
    }

    const fullName = buildFullName(profile);
    const primaryEmail = profile.officialEmail ?? profile.personalEmail ?? profile.email ?? "";
    const phone = profile.personalMobile ?? profile.phone ?? "";
    const altPhone = profile.alternativeMobile ?? "";

    const bankAcc = profile.bankAccountNumber ?? profile.bankAccountNo;
    const ifsc = profile.bankIfscCode ?? profile.ifscCode;
    const pan = profile.panNumber ?? profile.pan;
    const aadhaar = profile.aadhaarNumber ?? profile.aadhaar;
    const esi = profile.esiIpNumber ?? profile.esiNumber;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Profile</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View your personal and employment information</p>
                </div>
                <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                <div className="flex items-center gap-5">
                    {isImageSrc(profile.profilePhotoUrl) ? (
                        <img
                            src={profile.profilePhotoUrl!}
                            alt=""
                            className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-neutral-200 dark:border-neutral-700"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {fullName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">{fullName}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {displayProfileField(profile.designation)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            {primaryEmail && (
                                <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 min-w-0">
                                    <Mail size={12} className="flex-shrink-0" />
                                    <span className="truncate">{primaryEmail}</span>
                                </span>
                            )}
                            {phone && (
                                <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <Phone size={12} />
                                    {phone}
                                </span>
                            )}
                        </div>
                        {(profile.status || profile.workType) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {profile.status && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                                        {humanizeEnum(profile.status)}
                                    </span>
                                )}
                                {profile.workType && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                        {humanizeEnum(profile.workType)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <ProfileSection title="Personal Information" icon={UserCircle}>
                    <InfoRow label="Full Name" value={fullName} />
                    <InfoRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                    <InfoRow label="Gender" value={humanizeEnum(profile.gender ?? undefined)} />
                    <InfoRow label="Blood Group" value={profile.bloodGroup ?? undefined} />
                    <InfoRow label="Marital Status" value={humanizeEnum(profile.maritalStatus ?? undefined)} />
                    <InfoRow label="Nationality" value={profile.nationality ?? "Indian"} />
                    <InfoRow
                        label="Father / Mother Name"
                        value={profile.fatherMotherName ?? profile.fatherName ?? undefined}
                    />
                </ProfileSection>

                {/* Contact Information */}
                <ProfileSection title="Contact Information" icon={Phone}>
                    <InfoRow label="Official Email" value={profile.officialEmail ?? undefined} />
                    <InfoRow label="Personal Email" value={profile.personalEmail ?? profile.email ?? undefined} />
                    <InfoRow label="Mobile" value={phone} />
                    {altPhone ? <InfoRow label="Alternative Mobile" value={altPhone} /> : null}
                    <InfoRow label="Emergency Contact" value={profile.emergencyContactName ?? undefined} />
                    <InfoRow label="Relation" value={profile.emergencyContactRelation ?? undefined} />
                    <InfoRow label="Emergency Mobile" value={profile.emergencyContactMobile ?? undefined} />
                    <InfoRow label="Current Address" value={formatAddress(profile.currentAddress)} />
                    <InfoRow label="Permanent Address" value={formatAddress(profile.permanentAddress)} />
                </ProfileSection>

                {/* Employment Details */}
                <ProfileSection title="Employment Details" icon={Briefcase}>
                    <InfoRow label="Employee ID" value={profile.employeeId} />
                    <InfoRow label="Department" value={displayProfileField(profile.department)} />
                    <InfoRow label="Designation" value={displayProfileField(profile.designation)} />
                    <InfoRow label="Grade" value={formatGrade(profile.grade)} />
                    <InfoRow label="Employee Type" value={displayProfileField(profile.employeeType)} />
                    <InfoRow label="Cost Centre" value={displayProfileField(profile.costCentre)} />
                    <InfoRow label="Date of Joining" value={formatDate(profile.joiningDate ?? profile.dateOfJoining)} />
                    <InfoRow label="Probation End" value={formatDate(profile.probationEndDate)} />
                    <InfoRow label="Confirmation Date" value={formatDate(profile.confirmationDate)} />
                    <InfoRow
                        label="Notice Period"
                        value={
                            profile.noticePeriodDays != null ? `${profile.noticePeriodDays} day(s)` : undefined
                        }
                    />
                    <InfoRow label="Shift" value={formatShift(profile.shift)} />
                    <InfoRow label="Location" value={displayProfileField(profile.location)} />
                    <InfoRow label="Reporting Manager" value={displayProfileField(profile.reportingManager)} />
                    <InfoRow label="Functional Manager" value={displayProfileField(profile.functionalManager)} />
                    <InfoRow label="Employment Status" value={humanizeEnum(profile.status ?? undefined)} />
                    <InfoRow label="Work Type" value={humanizeEnum(profile.workType ?? undefined)} />
                </ProfileSection>

                {/* Bank Details (Masked) */}
                <ProfileSection title="Bank Details" icon={CreditCard}>
                    <InfoRow label="Bank Name" value={profile.bankName ?? undefined} />
                    <InfoRow label="Branch" value={profile.bankBranch ?? undefined} />
                    <InfoRow label="Account Number" value={formatBankAccountLastFour(bankAcc ?? undefined)} />
                    <InfoRow label="IFSC Code" value={ifsc ?? undefined} />
                    <InfoRow label="Account Type" value={profile.accountType ? humanizeEnum(String(profile.accountType)) : undefined} />
                </ProfileSection>

                {/* Statutory Details (Masked) */}
                <ProfileSection title="Statutory Details" icon={Shield}>
                    <InfoRow label="PAN" value={maskPAN(pan ?? undefined)} />
                    <InfoRow
                        label="Aadhaar"
                        value={
                            aadhaar
                                ? "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " + String(aadhaar).slice(-4)
                                : "—"
                        }
                    />
                    <InfoRow label="UAN" value={profile.uan ?? undefined} />
                    <InfoRow label="ESI IP Number" value={esi ?? undefined} />
                </ProfileSection>
            </div>

            {/* ── Edit Profile Modal ── */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Edit Profile</h2>
                            <button onClick={() => setEditOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Personal Mobile</label>
                                <input type="tel" value={editForm.personalMobile} onChange={(e) => setEditForm((p) => ({ ...p, personalMobile: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Alternative Mobile</label>
                                <input type="tel" value={editForm.alternativeMobile} onChange={(e) => setEditForm((p) => ({ ...p, alternativeMobile: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Personal Email</label>
                                <input type="email" value={editForm.personalEmail} onChange={(e) => setEditForm((p) => ({ ...p, personalEmail: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Marital Status</label>
                                    <select value={editForm.maritalStatus} onChange={(e) => setEditForm((p) => ({ ...p, maritalStatus: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select...</option>
                                        {MARITAL_OPTIONS.map((opt) => (<option key={opt} value={opt.toUpperCase()}>{opt}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Blood Group</label>
                                    <input type="text" value={editForm.bloodGroup} onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))} placeholder="e.g. O+" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Emergency Contact</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Contact Name</label>
                                        <input type="text" value={editForm.emergencyContactName} onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactName: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Relation</label>
                                            <input type="text" value={editForm.emergencyContactRelation} onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactRelation: e.target.value }))} placeholder="e.g. Spouse" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                            <input type="tel" value={editForm.emergencyContactMobile} onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactMobile: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setEditOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {updateProfile.isPending && <Loader2 size={14} className="animate-spin" />}
                                {updateProfile.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
