// Step 15 — User Setup + Activation & Review
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, SecretInput,
    AddButton, ItemCard, TwoCol, InfoBanner
} from '../atoms';
import { useTenantOnboardingStore } from '../store';
import type { UserItem } from '../types';

const USER_ROLES = [
    'Company Admin', 'HR Manager', 'Payroll Manager', 'Plant Manager',
    'Production Supervisor', 'Quality Manager', 'Maintenance Manager',
    'Finance Manager', 'IT Admin', 'Viewer',
];

const DEPARTMENTS = [
    'IT', 'HR', 'Finance', 'Operations', 'Production',
    'Quality', 'Maintenance', 'Stores', 'Management', 'Other',
];

const ACTIVATION_STATUSES = [
    { status: 'Draft', subtitle: 'Setup still in progress — not yet live', color: '#F59E0B' },
    { status: 'Pilot', subtitle: 'Company is in trial/UAT phase with limited users', color: '#3B82F6' },
    { status: 'Active', subtitle: 'Company is live — full production use', color: '#10B981' },
];

const CHECKLIST_PHASES = [
    {
        phase: 'Company Identity',
        items: ['Display name & legal name', 'Business type & industry', 'Company code & CIN', 'Incorporation date'],
    },
    {
        phase: 'Compliance & Statutory',
        items: ['PAN & TAN entered', 'GSTIN configured', 'PF & ESI details set', 'ROC filing state selected'],
    },
    {
        phase: 'Address',
        items: ['Registered address complete', 'Corporate/HQ address confirmed'],
    },
    {
        phase: 'Fiscal & Calendar',
        items: ['FY period selected', 'Payroll cycle configured', 'Timezone & working days set'],
    },
    {
        phase: 'Preferences',
        items: ['Currency & language set', 'Compliance toggles reviewed', 'Integrations configured'],
    },
    {
        phase: 'Backend Endpoint',
        items: ['Endpoint type selected (Default/Custom)', 'Region/custom URL configured'],
    },
    {
        phase: 'Modules & Pricing',
        items: ['Modules selected & priced', 'User tier confirmed', 'Trial days set', 'Billing cycle set'],
    },
    {
        phase: 'Locations',
        items: ['Locations/Plants added', 'Key contacts assigned', 'Geo-fencing configured (if applicable)'],
    },
    {
        phase: 'Time & Config',
        items: ['Shifts created', 'No. Series defined', 'IOT Reasons populated', 'Controls reviewed'],
    },
    {
        phase: 'User Access',
        items: ['Company Admin user created', 'Role assignments confirmed'],
    },
];

function UserForm({
    user,
    onUpdate,
    onRemove,
}: {
    user: UserItem;
    onUpdate: (u: Partial<UserItem>) => void;
    onRemove?: () => void;
}) {
    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput
                    label="Full Name"
                    placeholder="e.g. Rahul Mehta"
                    value={user.fullName}
                    onChange={(v) => onUpdate({ fullName: v })}
                    required
                />
                <FormSelect
                    label="Role / Access Level"
                    value={user.role}
                    onChange={(v) => onUpdate({ role: v })}
                    options={USER_ROLES}
                    required
                />
            </TwoCol>

            <TwoCol>
                <FormInput
                    label="Username"
                    placeholder="e.g. rahul.mehta"
                    value={user.username}
                    onChange={(v) => onUpdate({ username: v.toLowerCase() })}
                    required
                    monospace
                    hint="Used for login. Alphanumeric, dots and underscores allowed."
                />
                <SecretInput
                    label="Initial Password"
                    placeholder="Minimum 8 characters"
                    value={user.password}
                    onChange={(v) => onUpdate({ password: v })}
                    hint="User will be prompted to change on first login"
                />
            </TwoCol>

            <TwoCol>
                <FormInput
                    label="Email Address"
                    placeholder="rahul@company.com"
                    value={user.email}
                    onChange={(v) => onUpdate({ email: v })}
                    type="email"
                    required
                />
                <FormInput
                    label="Mobile Number"
                    placeholder="9876543210"
                    value={user.mobile}
                    onChange={(v) => onUpdate({ mobile: v })}
                    type="tel"
                    hint="Used for MFA / OTP authentication"
                />
            </TwoCol>

            <FormSelect
                label="Department"
                value={user.department}
                onChange={(v) => onUpdate({ department: v })}
                options={DEPARTMENTS}
            />

            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors"
                >
                    🗑 Remove this user
                </button>
            )}
        </div>
    );
}

export function Step15Activation() {
    const state = useTenantOnboardingStore();
    const { step1, step15, addUser, removeUser, updateUser, setStep1 } = state;

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 px-8 py-10 text-white">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute top-1/2 -translate-y-1/2 right-20 w-20 h-20 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0">
                        🚀
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Almost Ready to Activate!</h2>
                        <p className="text-primary-200 mt-1">
                            {step1.displayName || 'New Company'} · Final review & activation
                        </p>
                    </div>
                </div>
            </div>

            {/* Initial Users */}
            <SectionCard
                title="Initial User Setup"
                subtitle="Create the first user accounts for this tenant. At least one Company Admin is required."
            >
                <InfoBanner variant="info">
                    These users will be able to log in immediately after activation. Additional users can be created
                    by the Company Admin from within the ERP.
                </InfoBanner>

                {step15.users.map((user, idx) => (
                    <ItemCard
                        key={user.id}
                        title={user.fullName || `User ${idx + 1}`}
                        subtitle={[user.role, user.department].filter(Boolean).join(' · ')}
                        badge={idx === 0 ? 'Primary Admin' : `User ${idx + 1}`}
                        badgeVariant={idx === 0 ? 'primary' : 'info'}
                        onRemove={step15.users.length > 1 ? () => removeUser(user.id) : undefined}
                        defaultOpen={idx === 0}
                    >
                        <UserForm
                            user={user}
                            onUpdate={(u) => updateUser(user.id, u)}
                            onRemove={step15.users.length > 1 ? () => removeUser(user.id) : undefined}
                        />
                    </ItemCard>
                ))}

                <AddButton label="Add Another User" onClick={addUser} />
            </SectionCard>

            {/* Activation Status */}
            <SectionCard
                title="Set Company Status"
                subtitle="Select the activation status for this tenant after creation"
            >
                <div className="space-y-3">
                    {ACTIVATION_STATUSES.map((opt) => (
                        <button
                            key={opt.status}
                            type="button"
                            onClick={() => setStep1({ status: opt.status })}
                            className={cn(
                                'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150',
                                step1.status === opt.status
                                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                            )}
                        >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                            <div className="flex-1">
                                <p className={cn(
                                    'text-sm font-bold',
                                    step1.status === opt.status ? 'text-primary-800' : 'text-primary-950'
                                )}>
                                    {opt.status}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">{opt.subtitle}</p>
                            </div>
                            <div className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                step1.status === opt.status ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'
                            )}>
                                {step1.status === opt.status && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Provisioning Checklist */}
            <SectionCard
                title="Provisioning Checklist"
                subtitle="Verify all phases are complete before going live. Items without explicit data will use system defaults."
                accent="success"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CHECKLIST_PHASES.map((phase) => (
                        <div key={phase.phase} className="bg-neutral-50 rounded-xl border border-neutral-100 px-5 py-4">
                            <p className="text-xs font-bold text-primary-900 mb-2">{phase.phase}</p>
                            <div className="space-y-1.5">
                                {phase.items.map((item) => (
                                    <div key={item} className="flex items-start gap-2">
                                        <CheckCircle2 size={13} className="text-success-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-neutral-600 leading-4">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Final confirmation notice */}
            <InfoBanner variant="warning">
                <strong>Before you click "Create Company":</strong> Verify all the data above. After creation, statutory
                identifiers (PAN, TAN, GSTIN) cannot be changed without Super-Admin override and audit trail.
                User credentials will be sent to the email addresses configured for each user.
            </InfoBanner>
        </div>
    );
}
