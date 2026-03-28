import {
    UserCircle,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Building2,
    Calendar,
    CreditCard,
    Shield,
    Pencil,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyProfile } from "@/features/company-admin/api/use-ess-queries";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showInfo } from "@/lib/toast";

/* ── Helpers ── */

const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const maskAccount = (acc: string | null | undefined) => {
    if (!acc) return "—";
    if (acc.length <= 4) return acc;
    return "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " + acc.slice(-4);
};

const maskPAN = (pan: string | null | undefined) => {
    if (!pan) return "—";
    if (pan.length <= 4) return pan;
    return pan.slice(0, 2) + "\u2022\u2022\u2022\u2022\u2022" + pan.slice(-2);
};

/* ── Info Row ── */

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium text-primary-950 dark:text-white text-right max-w-[60%] truncate">{value || "—"}</span>
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

export function MyProfileScreen() {
    const { data, isLoading, isError } = useMyProfile();
    const profile: any = (data?.data as any) ?? {};

    const handleRequestUpdate = () => {
        showInfo("Request Sent", "A profile update request has been sent to HR. You will be notified once it is reviewed.");
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

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.fullName || "Employee";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">My Profile</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">View your personal and employment information</p>
                </div>
                <button
                    onClick={handleRequestUpdate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Pencil className="w-4 h-4" />
                    Request Update
                </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary-950 dark:text-white">{fullName}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{profile.designation ?? profile.jobTitle ?? "—"}</p>
                        <div className="flex items-center gap-4 mt-2">
                            {profile.email && (
                                <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <Mail size={12} />
                                    {profile.email}
                                </span>
                            )}
                            {profile.phone && (
                                <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <Phone size={12} />
                                    {profile.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <ProfileSection title="Personal Information" icon={UserCircle}>
                    <InfoRow label="Full Name" value={fullName} />
                    <InfoRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                    <InfoRow label="Gender" value={profile.gender} />
                    <InfoRow label="Blood Group" value={profile.bloodGroup} />
                    <InfoRow label="Marital Status" value={profile.maritalStatus} />
                    <InfoRow label="Nationality" value={profile.nationality ?? "Indian"} />
                    <InfoRow label="Father's Name" value={profile.fatherName} />
                </ProfileSection>

                {/* Contact Information */}
                <ProfileSection title="Contact Information" icon={Phone}>
                    <InfoRow label="Personal Email" value={profile.personalEmail ?? profile.email} />
                    <InfoRow label="Phone" value={profile.phone} />
                    <InfoRow label="Emergency Contact" value={profile.emergencyContactName} />
                    <InfoRow label="Emergency Phone" value={profile.emergencyContactPhone} />
                    <InfoRow label="Current Address" value={profile.currentAddress} />
                    <InfoRow label="Permanent Address" value={profile.permanentAddress} />
                </ProfileSection>

                {/* Employment Details */}
                <ProfileSection title="Employment Details" icon={Briefcase}>
                    <InfoRow label="Employee ID" value={profile.employeeId ?? profile.empCode} />
                    <InfoRow label="Department" value={profile.department} />
                    <InfoRow label="Designation" value={profile.designation ?? profile.jobTitle} />
                    <InfoRow label="Grade" value={profile.grade} />
                    <InfoRow label="Employee Type" value={profile.employeeType} />
                    <InfoRow label="Date of Joining" value={formatDate(profile.dateOfJoining)} />
                    <InfoRow label="Reporting Manager" value={profile.reportingManager} />
                    <InfoRow label="Location" value={profile.location ?? profile.branch} />
                </ProfileSection>

                {/* Bank Details (Masked) */}
                <ProfileSection title="Bank Details" icon={CreditCard}>
                    <InfoRow label="Bank Name" value={profile.bankName} />
                    <InfoRow label="Account Number" value={maskAccount(profile.bankAccountNo)} />
                    <InfoRow label="IFSC Code" value={profile.ifscCode} />
                    <InfoRow label="Account Type" value={profile.accountType ?? "Savings"} />
                </ProfileSection>

                {/* Statutory Details (Masked) */}
                <ProfileSection title="Statutory Details" icon={Shield}>
                    <InfoRow label="PAN" value={maskPAN(profile.pan)} />
                    <InfoRow label="Aadhaar" value={profile.aadhaar ? "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " + (profile.aadhaar ?? "").slice(-4) : "—"} />
                    <InfoRow label="UAN" value={profile.uan} />
                    <InfoRow label="ESI Number" value={profile.esiNumber} />
                </ProfileSection>
            </div>
        </div>
    );
}
