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

// Steps
import { Step01Identity } from './steps/Step01Identity';
import { Step02Statutory } from './steps/Step02Statutory';
import { Step03Address } from './steps/Step03Address';
import { Step04Fiscal } from './steps/Step04Fiscal';
import { Step05Preferences } from './steps/Step05Preferences';
import { Step06Endpoint } from './steps/Step06Endpoint';
import { Step07Modules } from './steps/Step07Modules';
import { Step08UserTier } from './steps/Step08UserTier';
import { Step09Contacts } from './steps/Step09Contacts';
import { Step10Plants } from './steps/Step10Plants';
import { Step11Shifts } from './steps/Step11Shifts';
import { Step12NoSeries } from './steps/Step12NoSeries';
import { Step13IOTReasons } from './steps/Step13IOTReasons';
import { Step14Controls } from './steps/Step14Controls';
import { Step15Activation } from './steps/Step15Activation';

// ---- Step Render Map ----
const STEP_COMPONENTS: Record<number, React.ComponentType> = {
    1: Step01Identity,
    2: Step02Statutory,
    3: Step03Address,
    4: Step04Fiscal,
    5: Step05Preferences,
    6: Step06Endpoint,
    7: Step07Modules,
    8: Step08UserTier,
    9: Step09Contacts,
    10: Step10Plants,
    11: Step11Shifts,
    12: Step12NoSeries,
    13: Step13IOTReasons,
    14: Step14Controls,
    15: Step15Activation,
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
                        ? 'bg-success-50 text-success-800 hover:bg-success-100 border border-success-100'
                        : 'text-neutral-600 hover:bg-neutral-100'
            )}
        >
            {/* Number / Done indicator */}
            <div
                className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isActive ? 'bg-white/20 text-white' :
                        isDone ? 'bg-success-500 text-white' :
                            'bg-neutral-200 text-neutral-500 group-hover:bg-neutral-300'
                )}
            >
                {isDone ? <Check size={12} strokeWidth={3} /> : step.id}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-xs font-bold truncate',
                    isActive ? 'text-white' : isDone ? 'text-success-800' : 'text-primary-950'
                )}>
                    {step.title}
                </p>
                <p className={cn(
                    'text-[10px] truncate mt-0.5',
                    isActive ? 'text-primary-200' : isDone ? 'text-success-600' : 'text-neutral-400'
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mb-5">
                        <Building2 size={28} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-primary-950">Create Company?</h2>
                    <p className="text-neutral-500 text-sm mt-2">
                        You're about to provision <strong>{companyName || 'this company'}</strong> on the Avy ERP platform.
                        This will create the tenant, users, and configure all selected modules.
                    </p>

                    <div className="w-full mt-6 bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 text-left">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={16} className="text-warning-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-warning-700">
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
                            className="flex-1 px-6 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700
                hover:bg-neutral-50 transition-colors disabled:opacity-50"
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
        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
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
    const {
        currentStep, goNext, goPrev, goToStep, reset, isSubmitting, setIsSubmitting, step1,
    } = useTenantOnboardingStore();

    const [showConfirm, setShowConfirm] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const stepMeta = STEP_META[currentStep - 1];
    const StepComponent = STEP_COMPONENTS[currentStep];
    const isLastStep = currentStep === TOTAL_STEPS;
    const isFirstStep = currentStep === 1;

    // ---- Handlers ----
    const handlePrev = () => goPrev();

    const handleNext = () => {
        if (isLastStep) {
            setShowConfirm(true);
        } else {
            goNext();
            // scroll top
            document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            // TODO — Replace with actual API call to create tenant
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setShowConfirm(false);
            onSuccess?.(step1.displayName);
            reset();
        } catch (e) {
            console.error('Failed to create company', e);
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
            <div className="fixed inset-0 z-40 flex bg-neutral-50">

                {/* ===== LEFT SIDEBAR ===== */}
                <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 bg-white border-r border-neutral-100 shadow-sm">
                    {/* Header */}
                    <div className="px-5 py-5 border-b border-neutral-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                                <Building2 size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary-950">New Company</p>
                                <p className="text-xs text-neutral-500">Tenant Onboarding</p>
                            </div>
                        </div>
                        <ProgressBar current={currentStep} total={TOTAL_STEPS} />
                        <p className="text-xs text-neutral-500 mt-2">Step {currentStep} of {TOTAL_STEPS}</p>
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
                    <div className="px-4 py-4 border-t border-neutral-100 space-y-2">
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                border border-neutral-200 text-sm font-semibold text-neutral-600
                hover:bg-neutral-50 transition-colors"
                        >
                            <Save size={14} />
                            Save Draft
                        </button>
                    </div>
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                    {/* Top bar */}
                    <header className="flex-shrink-0 flex items-center justify-between bg-white border-b border-neutral-100 px-6 py-4 shadow-sm">
                        {/* Mobile progress */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                                <Building2 size={14} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-primary-950">{stepMeta.title}</p>
                                <p className="text-[10px] text-neutral-500">Step {currentStep}/{TOTAL_STEPS}</p>
                            </div>
                        </div>

                        {/* Desktop step title */}
                        <div className="hidden lg:block">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{stepMeta.icon}</span>
                                <div>
                                    <h1 className="text-lg font-bold text-primary-950">{stepMeta.title}</h1>
                                    <p className="text-xs text-neutral-500">{stepMeta.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600
                hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                        >
                            <X size={15} />
                            <span className="hidden sm:inline">Cancel</span>
                        </button>
                    </header>

                    {/* Mobile progress bar */}
                    <div className="lg:hidden px-6 py-2 bg-white border-b border-neutral-100">
                        <ProgressBar current={currentStep} total={TOTAL_STEPS} />
                    </div>

                    {/* Content scroll area */}
                    <main
                        id="wizard-content"
                        className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-7"
                    >
                        <div className="max-w-4xl mx-auto">
                            {StepComponent && <StepComponent />}
                        </div>
                    </main>

                    {/* Bottom navigation bar */}
                    <footer className="flex-shrink-0 bg-white border-t border-neutral-100 px-6 py-5 shadow-sm">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">

                            {/* Back button */}
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={isFirstStep}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 rounded-xl border text-sm font-bold transition-all duration-150',
                                    isFirstStep
                                        ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400'
                                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
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
                                                    : 'w-2 h-2 bg-neutral-200'
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Desktop step counter */}
                            <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400">
                                <span className="font-semibold text-primary-700">{currentStep}</span>
                                <span>/</span>
                                <span>{TOTAL_STEPS}</span>
                                <span className="ml-1">— {stepMeta.title}</span>
                            </div>

                            {/* Next / Submit button */}
                            <button
                                type="button"
                                onClick={handleNext}
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
                <ConfirmSubmitModal
                    companyName={step1.displayName}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                    isLoading={isSubmitting}
                />
            )}

            {/* ===== DISCARD CONFIRM MODAL ===== */}
            {showDiscardConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-primary-950 mb-2">Discard Changes?</h2>
                        <p className="text-sm text-neutral-500">
                            All progress will be lost. Are you sure you want to cancel this onboarding?
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowDiscardConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50"
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
