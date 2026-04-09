// Step 05 — Preferences (Compliance, Integrations)
import React from 'react';
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    SectionCard, FormInput, SecretInput, ToggleRow, TwoCol, InfoBanner, SectionDivider
} from '../atoms';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    // Hidden locale defaults — not shown in UI
    currency: z.string().optional(),
    language: z.string().optional(),
    dateFormat: z.string().optional(),
    numberFormat: z.string().optional(),
    timeFormat: z.string().optional(),

    indiaCompliance: z.boolean(),
    mobileApp: z.boolean(),
    webApp: z.boolean(),
    systemApp: z.boolean(),
    biometric: z.boolean(),
    bankIntegration: z.boolean(),

    razorpayEnabled: z.boolean(),
    razorpayKeyId: z.string().optional(),
    razorpayKeySecret: z.string().optional(),
    razorpayWebhookSecret: z.string().optional(),
    razorpayAccountNumber: z.string().optional(),
    razorpayAutoDisbursement: z.boolean(),
    razorpayTestMode: z.boolean(),

    emailNotif: z.boolean(),
    pushNotif: z.boolean(),
    smsNotif: z.boolean(),
    inAppNotif: z.boolean(),
    whatsapp: z.boolean(),
}).superRefine((data, ctx) => {
    if (data.bankIntegration && data.razorpayEnabled) {
        if (!data.razorpayKeyId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['razorpayKeyId'], message: 'Required' });
        if (!data.razorpayKeySecret) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['razorpayKeySecret'], message: 'Required' });
    }
});

type FormData = z.infer<typeof schema>;

// ---- RazorpayX Section ----
function RazorpaySection() {
    const { control } = useFormContext<FormData>();

    return (
        <div className="mt-2 space-y-4 p-5 rounded-2xl bg-gradient-to-br from-[#072654]/5 to-[#3395FF]/5 border border-[#3395FF]/20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#072654] flex items-center justify-center text-lg">
                    💳
                </div>
                <div>
                    <p className="text-sm font-bold text-primary-950 dark:text-white">RazorpayX Payout API</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">One-click salary disbursement integration</p>
                </div>
            </div>

            <InfoBanner variant="info">
                Avy ERP integrates with <strong>RazorpayX Payout API</strong> for direct salary disbursement.
                Each tenant configures their own Razorpay API keys for multi-tenant isolation. When payroll is approved,
                the ERP creates a payment batch and transfers salaries via RazorpayX — with real-time webhook status updates.
            </InfoBanner>

            {/* Setup Steps */}
            <div className="space-y-2">
                {[
                    'Create Razorpay business account & complete KYC',
                    'Enable RazorpayX Payouts from your Razorpay dashboard',
                    'Enter your API keys below — stored per-tenant (multi-tenant safe)',
                    'Employee bank details → Razorpay Contact + Fund Account auto-created',
                    'One-click salary disbursement after payroll approval',
                ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#3395FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-white">{i + 1}</span>
                        </div>
                        <p className="text-xs text-neutral-700 leading-4 dark:text-neutral-300">{step}</p>
                    </div>
                ))}
            </div>

            <SectionDivider label="API Credentials" />

            <TwoCol>
                <Controller name="razorpayKeyId" control={control} render={({ field, fieldState }) => (
                    <FormInput label="RazorpayX Key ID" placeholder="rzp_live_xxxxxxxxxxxx" {...field} value={field.value || ''} hint="From Razorpay Dashboard → Settings → API Keys" monospace error={fieldState.error?.message} />
                )} />
                <Controller name="razorpayKeySecret" control={control} render={({ field, fieldState }) => (
                    <SecretInput label="RazorpayX Key Secret" placeholder="Your secret key" {...field} value={field.value || ''} hint="Never share this. Stored encrypted in Avy ERP." error={fieldState.error?.message} />
                )} />
            </TwoCol>

            <TwoCol>
                <Controller name="razorpayWebhookSecret" control={control} render={({ field, fieldState }) => (
                    <SecretInput label="Webhook Secret" placeholder="Webhook signing secret" {...field} value={field.value || ''} hint="Used to verify payout.processed / payout.failed webhook events" error={fieldState.error?.message} />
                )} />
                <Controller name="razorpayAccountNumber" control={control} render={({ field, fieldState }) => (
                    <FormInput label="RazorpayX Account Number" placeholder="Bank account number linked to RazorpayX" {...field} value={field.value || ''} hint="Source account from which salary payouts are debited" error={fieldState.error?.message} />
                )} />
            </TwoCol>

            <SectionDivider label="Disbursement Settings" />

            <Controller name="razorpayAutoDisbursement" control={control} render={({ field }) => (
                <ToggleRow label="Auto-Disbursement" subtitle="Automatically trigger salary transfers after payroll approval — no manual step required" value={field.value} onToggle={field.onChange} />
            )} />
            <Controller name="razorpayTestMode" control={control} render={({ field }) => (
                <ToggleRow label="Test Mode" subtitle="Use Razorpay test keys for UAT — no real money is transferred" value={field.value} onToggle={field.onChange} />
            )} />
        </div>
    );
}

// ---- Main Step ----

export function Step05Preferences() {
    const { step5, setStep5, goNext } = useTenantOnboardingStore();

    const methods = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            // Hidden locale defaults
            currency: step5.currency || 'INR — ₹',
            language: step5.language || 'English',
            dateFormat: step5.dateFormat || 'DD/MM/YYYY',
            numberFormat: step5.numberFormat || 'Indian (2,00,000)',
            timeFormat: step5.timeFormat || '12-hour (AM/PM)',
            // Compliance
            indiaCompliance: step5.indiaCompliance,
            // Employee Portal & App
            mobileApp: step5.mobileApp,
            webApp: step5.webApp ?? true,
            systemApp: step5.systemApp ?? false,
            // Integrations
            biometric: false,
            bankIntegration: step5.bankIntegration,
            razorpayEnabled: false,
            razorpayKeyId: step5.razorpayKeyId,
            razorpayKeySecret: step5.razorpayKeySecret,
            razorpayWebhookSecret: step5.razorpayWebhookSecret,
            razorpayAccountNumber: step5.razorpayAccountNumber,
            razorpayAutoDisbursement: step5.razorpayAutoDisbursement,
            razorpayTestMode: step5.razorpayTestMode,
            emailNotif: step5.emailNotif,
            pushNotif: step5.pushNotif ?? true,
            smsNotif: step5.smsNotif ?? false,
            inAppNotif: step5.inAppNotif ?? true,
            whatsapp: false,
        }
    });

    const { control, handleSubmit, watch } = methods;
    const bankIntegration = watch('bankIntegration');
    const razorpayEnabled = watch('razorpayEnabled');

    const onSubmit = (data: FormData) => {
        setStep5({
            ...data,
            razorpayEnabled: false,
            // Ensure removed fields keep safe defaults in store
            multiCurrency: false,
            ess: false,
            aiChatbot: false,
            eSign: false,
            biometric: false,
            whatsapp: false,
        });
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <FormProvider {...methods}>
            <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

                {/* Compliance Toggles */}
                <SectionCard title="Compliance Toggles" subtitle="Statutory and regulatory frameworks active for this tenant">
                    <Controller name="indiaCompliance" control={control} render={({ field }) => (
                        <ToggleRow label="India Statutory Compliance" subtitle="Enables PF, ESI, PT, TDS, Form 16, Gratuity, Bonus Act calculations and filings" value={field.value} onToggle={field.onChange} />
                    )} />
                </SectionCard>

                {/* Employee Portal & App */}
                <SectionCard title="Employee Portal & App" subtitle="Self-service and digital tools for employees">
                    <Controller name="mobileApp" control={control} render={({ field }) => (
                        <ToggleRow label="Mobile App (iOS & Android)" subtitle="Avy ERP mobile app access for all employees — production, HR, attendance" value={field.value} onToggle={field.onChange} />
                    )} />
                    <Controller name="webApp" control={control} render={({ field }) => (
                        <ToggleRow label="Web Application" subtitle="Browser-based ERP access for managers, HR, and admin users — full feature access" value={field.value} onToggle={field.onChange} />
                    )} />
                    <Controller name="systemApp" control={control} render={({ field }) => (
                        <ToggleRow label="System Application" subtitle="Desktop/system application access for users who operate from company systems" value={field.value} onToggle={field.onChange} />
                    )} />
                </SectionCard>

                {/* Integrations & Devices */}
                <SectionCard title="Integrations & Devices" subtitle="Hardware and third-party system connections">
                    <div className="relative opacity-60 pointer-events-none">
                        <ToggleRow label="Biometric / Device Sync" subtitle="Auto-sync employee attendance from ZKTeco, ESSL, and compatible biometric devices" value={false} onToggle={() => {}} />
                        <span className="absolute top-3 right-12 text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">COMING SOON</span>
                    </div>

                    <Controller name="bankIntegration" control={control} render={({ field }) => (
                        <ToggleRow label="Payroll Bank Integration" subtitle="NEFT/RTGS bank file generation for salary disbursement via banking partner" value={field.value} onToggle={field.onChange} />
                    )} />

                    {bankIntegration && (
                        <div className="pl-4 border-l-2 border-primary-200 dark:border-primary-800/50">
                            <div className="relative opacity-60 pointer-events-none">
                                <ToggleRow
                                    label="RazorpayX Payout API"
                                    subtitle="Enable direct one-click salary disbursement via RazorpayX — fully automated payroll"
                                    value={false}
                                    onToggle={() => {}}
                                />
                                <span className="absolute top-3 right-12 text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">
                                    COMING SOON
                                </span>
                            </div>
                            {razorpayEnabled && <RazorpaySection />}
                        </div>
                    )}

                    <Controller name="emailNotif" control={control} render={({ field }) => (
                        <ToggleRow label="Email Notifications" subtitle="Automated emails for payslips, leave approvals, breakdown alerts, and reminders" value={field.value} onToggle={field.onChange} />
                    )} />

                    <Controller name="pushNotif" control={control} render={({ field }) => (
                        <ToggleRow label="Push Notifications" subtitle="Mobile push alerts for approvals, salary credits, and real-time updates" value={field.value} onToggle={field.onChange} />
                    )} />

                    <Controller name="inAppNotif" control={control} render={({ field }) => (
                        <ToggleRow label="In-App Notifications" subtitle="Notification feed inside the web and mobile apps (always enabled — cannot be disabled per user)" value={field.value} onToggle={field.onChange} />
                    )} />

                    <Controller name="smsNotif" control={control} render={({ field }) => (
                        <ToggleRow label="SMS Notifications" subtitle="Transactional SMS via Twilio for critical alerts — daily caps apply to control cost" value={field.value} onToggle={field.onChange} />
                    )} />

                    <div className="relative opacity-60 pointer-events-none">
                        <ToggleRow label="WhatsApp Notifications" subtitle="Salary alerts, leave approval status, and OTP delivery via WhatsApp Business API" value={false} onToggle={() => {}} />
                        <span className="absolute top-3 right-12 text-[9px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-700 border border-warning-200">COMING SOON</span>
                    </div>
                </SectionCard>
            </form>
        </FormProvider>
    );
}
