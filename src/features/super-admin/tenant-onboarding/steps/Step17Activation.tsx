// Step 17 — Review & Activation
import React from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, MapPin, Package, Users, TrendingUp } from 'lucide-react';
import { SectionCard, InfoBanner } from '../atoms';
import { MODULE_CATALOGUE, USER_TIERS, resolveModuleDependencies } from '../constants';
import { useTenantOnboardingStore } from '../store';

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
        phase: 'Strategy & Locations',
        items: ['Multi-location mode configured', 'All locations added with addresses', 'HQ location designated', 'Geo-fencing configured (if applicable)'],
    },
    {
        phase: 'Modules & Pricing',
        items: ['Modules selected per location', 'User tier set per location', 'Trial days configured', 'Billing cycle confirmed'],
    },
    {
        phase: 'Contacts & Configuration',
        items: ['Key contacts assigned', 'Shifts created', 'No. Series defined', 'IOT Reasons populated', 'System controls reviewed'],
    },
    {
        phase: 'User Access',
        items: ['Company Admin user created', 'Location access assigned', 'Role assignments confirmed'],
    },
];

export function Step17Activation({ onConfirmSubmit }: { onConfirmSubmit?: () => void }) {
    const {
        step1,
        step10,
        step15,
        strategyConfig,
        locationCommercial,
        setStep1,
    } = useTenantOnboardingStore();

    const locations = step10.locations;

    // Per-location readiness check
    const locationReadiness = locations.map((loc) => {
        const entry = locationCommercial[loc.id];
        const { resolved: moduleIds } = resolveModuleDependencies(
            entry?.moduleIds ?? [],
            MODULE_CATALOGUE
        );
        const hasModules = moduleIds.length > 0;
        const hasTier = !!entry?.userTier;
        const isComplete = hasModules && hasTier;

        const moduleCost = moduleIds.reduce((sum, id) => {
            const mod = MODULE_CATALOGUE.find(m => m.id === id);
            return sum + (entry?.customModulePricing?.[id] ?? mod?.price ?? 0);
        }, 0);
        const tier = USER_TIERS.find(t => t.key === entry?.userTier);
        const tierCost = entry?.userTier === 'custom'
            ? parseInt(entry.customTierPrice || '0') || 0
            : tier?.basePrice ?? 0;
        const monthly = moduleCost + tierCost;
        const annual = monthly * 10;

        return {
            loc,
            entry,
            moduleIds,
            hasModules,
            hasTier,
            isComplete,
            moduleCost,
            tierCost,
            monthly,
            annual,
            tier,
        };
    });

    // Grand totals
    const grandMonthly = locationReadiness.reduce((sum, r) => sum + r.monthly, 0);
    const grandAnnual = grandMonthly * 10;
    const allLocationsComplete = locationReadiness.every(r => r.isComplete);
    const hasUsers = step15.users.length > 0;
    const overallReady = allLocationsComplete && hasUsers;

    const { handleSubmit } = useForm();
    const onSubmit = () => {
        if (onConfirmSubmit) {
            onConfirmSubmit();
        }
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 px-8 py-10 text-white">
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
                        <p className="text-primary-300 text-xs mt-0.5">
                            {locations.length} location{locations.length !== 1 ? 's' : ''} ·{' '}
                            {locationReadiness.reduce((s, r) => s + r.moduleIds.length, 0)} total module subscriptions ·{' '}
                            {step15.users.length} user{step15.users.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Location-wise Readiness Summary */}
            <SectionCard
                title="Location Readiness"
                subtitle="Review modules, tier, and billing configured per location"
            >
                {!allLocationsComplete && (
                    <div className="flex items-start gap-2 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 mb-4 dark:bg-warning-900/20 dark:border-warning-800/50">
                        <AlertTriangle size={14} className="text-warning-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-warning-700 dark:text-warning-400">
                            Some locations are missing module selection or user tier configuration.
                            Go back to steps 9 and 10 to complete them.
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    {locationReadiness.map(({ loc, moduleIds, isComplete, monthly, annual, tier, entry }) => (
                        <div
                            key={loc.id}
                            className={cn(
                                'rounded-2xl border-2 p-4 transition-all',
                                isComplete
                                    ? 'border-success-200 bg-success-50/50 dark:bg-success-900/10 dark:border-success-800/40'
                                    : 'border-warning-200 bg-warning-50/50 dark:bg-warning-900/10 dark:border-warning-800/40'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={cn(
                                        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                                        isComplete ? 'bg-success-100 dark:bg-success-900/30' : 'bg-warning-100 dark:bg-warning-900/30'
                                    )}>
                                        <MapPin size={14} className={isComplete ? 'text-success-600' : 'text-warning-600'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-primary-950 dark:text-white">
                                                {loc.name || 'Unnamed Location'}
                                            </p>
                                            {loc.isHQ && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400">HQ</span>
                                            )}
                                            <span className={cn(
                                                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                                isComplete
                                                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                                    : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                                            )}>
                                                {isComplete ? 'COMPLETE' : 'INCOMPLETE'}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-300">
                                            <span className="flex items-center gap-1">
                                                <Package size={11} />
                                                {moduleIds.length} module{moduleIds.length !== 1 ? 's' : ''}
                                                {moduleIds.length > 0 && (
                                                    <span className="text-neutral-400">
                                                        ({moduleIds.map(id => MODULE_CATALOGUE.find(m => m.id === id)?.icon).join('')})
                                                    </span>
                                                )}
                                            </span>
                                            {tier && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={11} />
                                                    {tier.label} Tier
                                                </span>
                                            )}
                                            {entry?.billingType && (
                                                <span className="capitalize text-neutral-500 dark:text-neutral-400">
                                                    {entry.billingType} billing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isComplete && (
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-base font-bold text-primary-700 dark:text-primary-400">
                                            ₹{(entry?.billingType === 'annual' ? annual : monthly).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                            /{entry?.billingType === 'annual' ? 'year' : 'month'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grand total */}
                {locations.length > 0 && (
                    <div className="mt-4 bg-primary-950 rounded-2xl px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-primary-300" />
                            <div>
                                <p className="text-sm font-bold text-white">Grand Total</p>
                                <p className="text-xs text-primary-300">{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">₹{grandMonthly.toLocaleString('en-IN')}<span className="text-sm font-normal text-primary-300">/mo</span></p>
                            <p className="text-xs text-primary-300">Annual: ₹{grandAnnual.toLocaleString('en-IN')}/yr</p>
                        </div>
                    </div>
                )}
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
                            onClick={() => setStep1({ status: opt.status as any })}
                            className={cn(
                                'w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150',
                                step1.status === opt.status
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300'
                            )}
                        >
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                            <div className="flex-1">
                                <p className={cn(
                                    'text-sm font-bold',
                                    step1.status === opt.status ? 'text-primary-800 dark:text-primary-300' : 'text-primary-950 dark:text-white'
                                )}>
                                    {opt.status}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">{opt.subtitle}</p>
                            </div>
                            <div className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                step1.status === opt.status ? 'border-primary-600 dark:border-primary-500 bg-primary-600' : 'border-neutral-300'
                            )}>
                                {step1.status === opt.status && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
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
                        <div key={phase.phase} className="bg-neutral-50 rounded-xl border border-neutral-100 px-5 py-4 dark:bg-neutral-800 dark:border-neutral-800">
                            <p className="text-xs font-bold text-primary-900 mb-2 dark:text-white">{phase.phase}</p>
                            <div className="space-y-1.5">
                                {phase.items.map((item) => (
                                    <div key={item} className="flex items-start gap-2">
                                        <CheckCircle2 size={13} className="text-success-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-neutral-600 leading-4 dark:text-neutral-300">{item}</p>
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
                Location commercial configuration (modules, tier) determines billing from day one of activation.
            </InfoBanner>

            {!overallReady && (
                <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 rounded-2xl px-5 py-4 dark:bg-danger-900/20 dark:border-danger-800/50">
                    <AlertTriangle size={16} className="text-danger-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-danger-800 dark:text-danger-300">Setup Incomplete</p>
                        <ul className="mt-1 space-y-1">
                            {!allLocationsComplete && (
                                <li className="text-xs text-danger-700 dark:text-danger-400">
                                    One or more locations are missing module selection or user tier — go back to Steps 9 & 10.
                                </li>
                            )}
                            {!hasUsers && (
                                <li className="text-xs text-danger-700 dark:text-danger-400">
                                    At least one user account must be configured — go back to Step 16.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </form>
    );
}
