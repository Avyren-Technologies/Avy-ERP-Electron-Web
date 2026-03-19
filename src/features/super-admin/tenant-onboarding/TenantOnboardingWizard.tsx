// ============================================================
// Tenant Onboarding Wizard — Main Orchestrator
// Web + Electron (Vite + React + Tailwind)
// ============================================================
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    ChevronLeft, ChevronRight, Save, X, Building2, Check, AlertCircle
} from 'lucide-react';
import { STEP_META, TOTAL_STEPS } from './constants';
import { useTenantOnboardingStore } from './store';
import { useOnboardTenant } from '@/features/super-admin/api/use-tenant-queries';

// Steps
import { Step01Identity } from './steps/Step01Identity';
import { Step02Statutory } from './steps/Step02Statutory';
import { Step03Address } from './steps/Step03Address';
import { Step04Fiscal } from './steps/Step04Fiscal';
import { Step05Preferences } from './steps/Step05Preferences';
import { Step06Endpoint } from './steps/Step06Endpoint';
import { Step07Strategy } from './steps/Step07Strategy';
import { Step08Locations } from './steps/Step08Locations';
import { Step09PerLocationModules } from './steps/Step09PerLocationModules';
import { Step10PerLocationTier } from './steps/Step10PerLocationTier';
import { Step11Contacts } from './steps/Step11Contacts';
import { Step12Shifts } from './steps/Step12Shifts';
import { Step13NoSeries } from './steps/Step13NoSeries';
import { Step14IOTReasons } from './steps/Step14IOTReasons';
import { Step15Controls } from './steps/Step15Controls';
import { Step16Users } from './steps/Step16Users';
import { Step17Activation } from './steps/Step17Activation';

// ---- Step Render Map ----
const STEP_COMPONENTS: Record<number, React.ComponentType> = {
    1: Step01Identity,
    2: Step02Statutory,
    3: Step03Address,
    4: Step04Fiscal,
    5: Step05Preferences,
    6: Step06Endpoint,
    7: Step07Strategy,
    8: Step08Locations,
    9: Step09PerLocationModules,
    10: Step10PerLocationTier,
    11: Step11Contacts,
    12: Step12Shifts,
    13: Step13NoSeries,
    14: Step14IOTReasons,
    15: Step15Controls,
    16: Step16Users,
    17: Step17Activation,
};

// ---- Sidebar Step Item ----

function SidebarStep({
    step,
    current,
    onClick,
}: {
    step: typeof STEP_META[number];
    current: number;
    onClick: () => void;
}) {
    const isActive = step.id === current;
    const isDone = step.id < current;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 group',
                isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : isDone
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-400 hover:bg-success-100 dark:bg-success-900/30 border border-success-100 dark:border-success-800/50'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:bg-neutral-800'
            )}
        >
            {/* Number / Done indicator */}
            <div
                className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isActive ? 'bg-white/20 text-white' :
                        isDone ? 'bg-success-500 text-white' :
                            'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-300'
                )}
            >
                {isDone ? <Check size={12} strokeWidth={3} /> : step.id}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-xs font-bold truncate',
                    isActive ? 'text-white' : isDone ? 'text-success-800 dark:text-success-400' : 'text-primary-950 dark:text-white'
                )}>
                    {step.title}
                </p>
                <p className={cn(
                    'text-[10px] truncate mt-0.5',
                    isActive ? 'text-primary-200' : isDone ? 'text-success-600' : 'text-neutral-400 dark:text-neutral-500'
                )}>
                    {step.subtitle}
                </p>
            </div>

            {/* Icon */}
            <span className="text-base flex-shrink-0">{step.icon}</span>
        </button>
    );
}

// ---- Confirm Submit Modal ----

function ConfirmSubmitModal({
    companyName,
    onConfirm,
    onCancel,
    isLoading,
}: {
    companyName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mb-5">
                        <Building2 size={28} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-primary-950 dark:text-white">Create Company?</h2>
                    <p className="text-neutral-500 text-sm mt-2 dark:text-neutral-400">
                        You're about to provision <strong>{companyName || 'this company'}</strong> on the Avy ERP platform.
                        This will create the tenant, users, and configure all selected modules.
                    </p>

                    <div className="w-full mt-6 bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 text-left dark:bg-warning-900/20 dark:border-warning-800/50">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={16} className="text-warning-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-warning-700 dark:text-warning-400">
                                Statutory identifiers (PAN, TAN, GSTIN) cannot be changed after creation without a
                                Super-Admin override. Ensure all data is correct.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300
                hover:bg-neutral-50 dark:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold
                hover:bg-primary-700 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-60
                flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8V0" stroke="currentColor" strokeWidth="4" className="opacity-75" fill="none" />
                                    </svg>
                                    Provisioning...
                                </>
                            ) : (
                                <>
                                    <Building2 size={15} />
                                    Confirm & Create
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---- Progress Bar (top) ----

function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = Math.round(((current - 1) / (total - 1)) * 100);
    return (
        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
            <div
                className="h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ============================================================
// Main Wizard
// ============================================================

export interface TenantOnboardingWizardProps {
    onClose: () => void;
    onSuccess?: (companyName: string) => void;
}

export function TenantOnboardingWizard({ onClose, onSuccess }: TenantOnboardingWizardProps) {
    const store = useTenantOnboardingStore();
    const {
        currentStep, goNext, goPrev, goToStep, reset, isSubmitting, setIsSubmitting, step1,
    } = store;

    const [showConfirm, setShowConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const onboardMutation = useOnboardTenant();

    const stepMeta = STEP_META[currentStep - 1];
    const StepComponent = STEP_COMPONENTS[currentStep];
    const isLastStep = currentStep === TOTAL_STEPS;
    const isFirstStep = currentStep === 1;

    // ---- Handlers ----
    const handlePrev = () => goPrev();

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setSubmitError('');
        try {
            // Build the full API payload from the Zustand store
            const s = useTenantOnboardingStore.getState();

            const payload = {
                identity: {
                    displayName: s.step1.displayName,
                    legalName: s.step1.legalName,
                    businessType: s.step1.businessType,
                    industry: s.step1.industry,
                    companyCode: s.step1.companyCode,
                    shortName: s.step1.shortName || undefined,
                    incorporationDate: s.step1.incorporationDate || undefined,
                    employeeCount: s.step1.employees || undefined,
                    cin: s.step1.cin || undefined,
                    website: s.step1.website || undefined,
                    emailDomain: s.step1.emailDomain,
                    logoUrl: s.step1.logoPreviewUrl || undefined,
                    wizardStatus: s.step1.status || 'Draft',
                },
                statutory: {
                    pan: s.step2.pan,
                    tan: s.step2.tan || undefined,
                    gstin: s.step2.gstin || undefined,
                    pfRegNo: s.step2.pfRegNo || undefined,
                    esiCode: s.step2.esiCode || undefined,
                    ptReg: s.step2.ptReg || undefined,
                    lwfrNo: s.step2.lwfrNo || undefined,
                    rocState: s.step2.rocState || undefined,
                },
                address: {
                    registered: {
                        line1: s.step3.regLine1,
                        line2: s.step3.regLine2 || undefined,
                        city: s.step3.regCity,
                        district: s.step3.regDistrict || undefined,
                        state: s.step3.regState,
                        pin: s.step3.regPin,
                        country: s.step3.regCountry,
                        stdCode: s.step3.regStdCode || undefined,
                    },
                    sameAsRegistered: s.step3.sameAsRegistered,
                    corporate: s.step3.sameAsRegistered ? undefined : {
                        line1: s.step3.corpLine1,
                        line2: s.step3.corpLine2 || undefined,
                        city: s.step3.corpCity,
                        district: s.step3.corpDistrict || undefined,
                        state: s.step3.corpState,
                        pin: s.step3.corpPin,
                        country: s.step3.corpCountry,
                        stdCode: s.step3.corpStdCode || undefined,
                    },
                },
                fiscal: {
                    fyType: s.step4.fyType,
                    fyCustomStartMonth: s.step4.fyCustomStartMonth || undefined,
                    fyCustomEndMonth: s.step4.fyCustomEndMonth || undefined,
                    payrollFreq: s.step4.payrollFreq,
                    cutoffDay: s.step4.cutoffDay,
                    disbursementDay: s.step4.disbursementDay,
                    weekStart: s.step4.weekStart,
                    timezone: s.step4.timezone,
                    workingDays: s.step4.workingDays,
                },
                preferences: {
                    currency: s.step5.currency,
                    language: s.step5.language,
                    dateFormat: s.step5.dateFormat,
                    numberFormat: s.step5.numberFormat || undefined,
                    timeFormat: s.step5.timeFormat || undefined,
                    indiaCompliance: s.step5.indiaCompliance,
                    multiCurrency: s.step5.multiCurrency,
                    ess: s.step5.ess,
                    mobileApp: s.step5.mobileApp,
                    webApp: s.step5.webApp,
                    systemApp: s.step5.systemApp,
                    aiChatbot: s.step5.aiChatbot,
                    eSign: s.step5.eSign,
                    biometric: s.step5.biometric,
                    bankIntegration: s.step5.bankIntegration,
                    emailNotif: s.step5.emailNotif,
                    whatsapp: s.step5.whatsapp,
                    razorpayEnabled: s.step5.razorpayEnabled,
                    razorpayKeyId: s.step5.razorpayKeyId || undefined,
                    razorpayKeySecret: s.step5.razorpayKeySecret || undefined,
                    razorpayWebhookSecret: s.step5.razorpayWebhookSecret || undefined,
                    razorpayAccountNumber: s.step5.razorpayAccountNumber || undefined,
                    razorpayAutoDisbursement: s.step5.razorpayAutoDisbursement,
                    razorpayTestMode: s.step5.razorpayTestMode,
                },
                endpoint: {
                    endpointType: s.step6.endpointType as 'default' | 'custom',
                    customBaseUrl: s.step6.customBaseUrl || undefined,
                },
                strategy: {
                    multiLocationMode: s.strategyConfig.multiLocationMode,
                    locationConfig: s.strategyConfig.locationConfig as 'common' | 'per-location',
                },
                locations: s.step10.locations.map((loc) => {
                    const locCommercial = s.locationCommercial[loc.id];
                    return {
                        name: loc.name,
                        code: loc.code,
                        facilityType: loc.facilityType,
                        customFacilityType: loc.customFacilityType || undefined,
                        status: loc.status,
                        isHQ: loc.isHQ,
                        addressLine1: loc.addressLine1 || undefined,
                        addressLine2: loc.addressLine2 || undefined,
                        city: loc.city || undefined,
                        district: loc.district || undefined,
                        state: loc.state || undefined,
                        pin: loc.pin || undefined,
                        country: loc.country || undefined,
                        gstin: loc.gstin || undefined,
                        stateGST: loc.stateGST || undefined,
                        contactName: loc.contactName || undefined,
                        contactDesignation: loc.contactDesignation || undefined,
                        contactEmail: loc.contactEmail || undefined,
                        contactCountryCode: loc.contactCountryCode || undefined,
                        contactPhone: loc.contactPhone || undefined,
                        geoEnabled: loc.geoEnabled,
                        geoLocationName: loc.geoLocationName || undefined,
                        geoLat: loc.geoLat || undefined,
                        geoLng: loc.geoLng || undefined,
                        geoRadius: loc.geoRadius,
                        geoShape: loc.geoShape || undefined,
                        // Per-location commercial data
                        moduleIds: locCommercial?.moduleIds ?? undefined,
                        customModulePricing: locCommercial?.customModulePricing ?? undefined,
                        userTier: locCommercial?.userTier ?? undefined,
                        customUserLimit: locCommercial?.customUserLimit || undefined,
                        customTierPrice: locCommercial?.customTierPrice || undefined,
                        billingType: locCommercial?.billingType ?? undefined,
                        trialDays: locCommercial?.trialDays ? parseInt(locCommercial.trialDays) : undefined,
                    };
                }),
                commercial: s.strategyConfig.locationConfig === 'common' ? {
                    selectedModuleIds: s.step7.selectedModuleIds,
                    customModulePricing: s.step7.customModulePricing,
                    userTier: s.step8.userTier,
                    customUserLimit: s.step8.customUserLimit || undefined,
                    customTierPrice: s.step8.customTierPrice || undefined,
                    billingType: s.step8.billingType,
                    trialDays: s.step8.trialDays ? parseInt(s.step8.trialDays) : undefined,
                } : undefined,
                contacts: s.step9.contacts.map((c) => ({
                    name: c.name,
                    designation: c.designation || undefined,
                    department: c.department || undefined,
                    type: c.type,
                    email: c.email,
                    countryCode: c.countryCode || undefined,
                    mobile: c.mobile,
                    linkedin: c.linkedin || undefined,
                })),
                shifts: {
                    dayStartTime: s.step11.dayStartTime || undefined,
                    dayEndTime: s.step11.dayEndTime || undefined,
                    weeklyOffs: s.step11.weeklyOffs,
                    items: s.step11.shifts.map((sh) => ({
                        name: sh.name,
                        fromTime: sh.fromTime,
                        toTime: sh.toTime,
                        noShuffle: sh.noShuffle,
                        downtimeSlots: sh.downtimeSlots,
                    })),
                },
                noSeries: s.step12.noSeries.map((ns) => ({
                    code: ns.code,
                    linkedScreen: ns.linkedScreen,
                    description: ns.description || undefined,
                    prefix: ns.prefix,
                    suffix: ns.suffix || undefined,
                    numberCount: ns.numberCount ? parseInt(ns.numberCount) : undefined,
                    startNumber: ns.startNumber ? parseInt(ns.startNumber) : undefined,
                })),
                iotReasons: s.step13.reasons.map((r) => ({
                    reasonType: r.reasonType,
                    reason: r.reason,
                    description: r.description || undefined,
                    department: r.department || undefined,
                    planned: r.planned,
                    duration: r.duration || undefined,
                })),
                controls: {
                    ncEditMode: s.step14.ncEditMode,
                    loadUnload: s.step14.loadUnload,
                    cycleTime: s.step14.cycleTime,
                    payrollLock: s.step14.payrollLock,
                    leaveCarryForward: s.step14.leaveCarryForward,
                    overtimeApproval: s.step14.overtimeApproval,
                    mfa: s.step14.mfa,
                },
                users: s.step15.users.map((u) => ({
                    fullName: u.fullName,
                    username: u.username,
                    password: u.password,
                    role: u.role,
                    email: u.email,
                    mobile: u.mobile || undefined,
                    department: u.department || undefined,
                })),
            };

            await onboardMutation.mutateAsync(payload);
            setShowConfirm(false);
            onSuccess?.(step1.displayName);
            reset();
        } catch (e: any) {
            console.error('Failed to create company', e);
            const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to create company. Please try again.';
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowDiscardConfirm(true);
    };

    const confirmDiscard = () => {
        reset();
        onClose();
    };

    return (
        <>
            {/* Wizard container */}
            <div className="fixed inset-0 z-40 flex bg-neutral-50 dark:bg-neutral-800">

                {/* ===== LEFT SIDEBAR ===== */}
                <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 bg-white border-r border-neutral-100 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    {/* Header */}
                    <div className="px-5 py-5 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                                <Building2 size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">New Company</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Tenant Onboarding</p>
                            </div>
                        </div>
                        <ProgressBar current={currentStep} total={TOTAL_STEPS} />
                        <p className="text-xs text-neutral-500 mt-2 dark:text-neutral-400">Step {currentStep} of {TOTAL_STEPS}</p>
                    </div>

                    {/* Step list */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {STEP_META.map((step) => (
                            <SidebarStep
                                key={step.id}
                                step={step}
                                current={currentStep}
                                onClick={() => goToStep(step.id)}
                            />
                        ))}
                    </nav>

                    {/* Bottom actions */}
                    <div className="px-4 py-4 border-t border-neutral-100 space-y-2 dark:border-neutral-800">
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300
                hover:bg-neutral-50 dark:bg-neutral-800 transition-colors"
                        >
                            <Save size={14} />
                            Save Draft
                        </button>
                    </div>
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                    {/* Top bar */}
                    <header className="flex-shrink-0 flex items-center justify-between bg-white border-b border-neutral-100 px-6 py-4 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                        {/* Mobile progress */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                                <Building2 size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary-950 dark:text-white">{stepMeta.title}</p>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Step {currentStep}/{TOTAL_STEPS}</p>
                            </div>
                        </div>

                        {/* Desktop step title */}
                        <div className="hidden lg:block">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{stepMeta.icon}</span>
                                <div>
                                    <h1 className="text-lg font-bold text-primary-950 dark:text-white">{stepMeta.title}</h1>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{stepMeta.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-600 dark:text-neutral-300
                hover:bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300 transition-colors"
                        >
                            <X size={15} />
                            <span className="hidden sm:inline">Cancel</span>
                        </button>
                    </header>

                    {/* Mobile progress bar */}
                    <div className="lg:hidden px-6 py-2 bg-white border-b border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800">
                        <ProgressBar current={currentStep} total={TOTAL_STEPS} />
                    </div>

                    {/* Content scroll area */}
                    <main
                        id="wizard-content"
                        className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-7 bg-neutral-50/30 dark:bg-neutral-900/10"
                    >
                        <div className="max-w-4xl mx-auto">
                            {/* @ts-ignore generic passing */}
                            {StepComponent && <StepComponent onConfirmSubmit={() => setShowConfirm(true)} />}
                        </div>
                    </main>

                    {/* Bottom navigation bar */}
                    <footer className="flex-shrink-0 bg-white border-t border-neutral-100 px-6 py-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">

                            {/* Back button */}
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={isFirstStep}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-bold transition-all duration-150',
                                    isFirstStep
                                        ? 'opacity-30 cursor-not-allowed border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 hover:border-neutral-300'
                                )}
                            >
                                <ChevronLeft size={16} strokeWidth={2.5} />
                                Back
                            </button>

                            {/* Mobile step indicator */}
                            <div className="flex items-center gap-1.5 lg:hidden">
                                {STEP_META.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => goToStep(s.id)}
                                        className={cn(
                                            'rounded-full transition-all duration-200',
                                            s.id === currentStep
                                                ? 'w-5 h-2 bg-primary-600'
                                                : s.id < currentStep
                                                    ? 'w-2 h-2 bg-success-500'
                                                    : 'w-2 h-2 bg-neutral-200 dark:bg-neutral-700'
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Desktop step counter */}
                            <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                                <span className="font-semibold text-primary-700 dark:text-primary-400">{currentStep}</span>
                                <span>/</span>
                                <span>{TOTAL_STEPS}</span>
                                <span className="ml-1">— {stepMeta.title}</span>
                            </div>

                            {/* Next / Submit button */}
                            <button
                                type="submit"
                                form="wizard-step-form"
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm',
                                    isLastStep
                                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-accent-700'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20'
                                )}
                            >
                                {isLastStep ? (
                                    <>
                                        <Building2 size={15} />
                                        Create Company
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight size={16} strokeWidth={2.5} />
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            {/* ===== CONFIRM SUBMIT MODAL ===== */}
            {showConfirm && (
                <>
                    <ConfirmSubmitModal
                        companyName={step1.displayName}
                        onConfirm={handleConfirm}
                        onCancel={() => { setShowConfirm(false); setSubmitError(''); }}
                        isLoading={isSubmitting}
                    />
                    {submitError && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-md w-full px-4">
                            <div className="bg-danger-600 text-white rounded-xl px-5 py-3 shadow-xl text-sm font-medium flex items-center gap-3">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {submitError}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ===== DISCARD CONFIRM MODAL ===== */}
            {showDiscardConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900">
                        <h2 className="text-lg font-bold text-primary-950 mb-2 dark:text-white">Discard Changes?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            All progress will be lost. Are you sure you want to cancel this onboarding?
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowDiscardConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-800"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={confirmDiscard}
                                className="flex-1 py-3 rounded-xl bg-danger-600 text-white text-sm font-bold hover:bg-danger-700"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
