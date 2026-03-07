// Step 05 — Preferences (Locale, Compliance, Integrations)
import {
    SectionCard, FormInput, SecretInput, ChipSelector, ToggleRow, TwoCol, InfoBanner, SectionDivider
} from '../atoms';
import { CURRENCIES, LANGUAGES, DATE_FORMATS, NUMBER_FORMATS, TIME_FORMATS } from '../constants';
import { useTenantOnboardingStore } from '../store';

// ---- RazorpayX Section ----
function RazorpaySection() {
    const { step5, setStep5 } = useTenantOnboardingStore();

    return (
        <div className="mt-2 space-y-4 p-5 rounded-2xl bg-gradient-to-br from-[#072654]/5 to-[#3395FF]/5 border border-[#3395FF]/20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#072654] flex items-center justify-center text-lg">
                    💳
                </div>
                <div>
                    <p className="text-sm font-bold text-primary-950">RazorpayX Payout API</p>
                    <p className="text-xs text-neutral-500">One-click salary disbursement integration</p>
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
                        <p className="text-xs text-neutral-700 leading-4">{step}</p>
                    </div>
                ))}
            </div>

            <SectionDivider label="API Credentials" />

            <TwoCol>
                <FormInput
                    label="RazorpayX Key ID"
                    placeholder="rzp_live_xxxxxxxxxxxx"
                    value={step5.razorpayKeyId}
                    onChange={(v) => setStep5({ razorpayKeyId: v })}
                    hint="From Razorpay Dashboard → Settings → API Keys"
                    monospace
                />
                <SecretInput
                    label="RazorpayX Key Secret"
                    placeholder="Your secret key"
                    value={step5.razorpayKeySecret}
                    onChange={(v) => setStep5({ razorpayKeySecret: v })}
                    hint="Never share this. Stored encrypted in Avy ERP."
                />
            </TwoCol>

            <TwoCol>
                <SecretInput
                    label="Webhook Secret"
                    placeholder="Webhook signing secret"
                    value={step5.razorpayWebhookSecret}
                    onChange={(v) => setStep5({ razorpayWebhookSecret: v })}
                    hint="Used to verify payout.processed / payout.failed webhook events"
                />
                <FormInput
                    label="RazorpayX Account Number"
                    placeholder="Bank account number linked to RazorpayX"
                    value={step5.razorpayAccountNumber}
                    onChange={(v) => setStep5({ razorpayAccountNumber: v })}
                    hint="Source account from which salary payouts are debited"
                />
            </TwoCol>

            <SectionDivider label="Disbursement Settings" />

            <ToggleRow
                label="Auto-Disbursement"
                subtitle="Automatically trigger salary transfers after payroll approval — no manual step required"
                value={step5.razorpayAutoDisbursement}
                onToggle={(v) => setStep5({ razorpayAutoDisbursement: v })}
            />
            <ToggleRow
                label="Test Mode"
                subtitle="Use Razorpay test keys for UAT — no real money is transferred"
                value={step5.razorpayTestMode}
                onToggle={(v) => setStep5({ razorpayTestMode: v })}
            />
        </div>
    );
}

// ---- Main Step ----

export function Step05Preferences() {
    const { step5, setStep5 } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Locale & Format */}
            <SectionCard title="Locale & Format" subtitle="Controls how numbers, dates, currencies, and times are displayed">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <ChipSelector label="Currency" options={CURRENCIES} selected={step5.currency}
                            onSelect={(v) => setStep5({ currency: v })} required />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <ChipSelector label="Language" options={LANGUAGES} selected={step5.language}
                            onSelect={(v) => setStep5({ language: v })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <ChipSelector label="Date Format" options={DATE_FORMATS} selected={step5.dateFormat}
                            onSelect={(v) => setStep5({ dateFormat: v })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <ChipSelector label="Number Format" options={NUMBER_FORMATS} selected={step5.numberFormat}
                            onSelect={(v) => setStep5({ numberFormat: v })} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <ChipSelector label="Time Format" options={TIME_FORMATS} selected={step5.timeFormat}
                            onSelect={(v) => setStep5({ timeFormat: v })} />
                    </div>
                </div>
            </SectionCard>

            {/* Compliance Toggles */}
            <SectionCard title="Compliance Toggles" subtitle="Statutory and regulatory frameworks active for this tenant">
                <ToggleRow
                    label="India Statutory Compliance"
                    subtitle="Enables PF, ESI, PT, TDS, Form 16, Gratuity, Bonus Act calculations and filings"
                    value={step5.indiaCompliance}
                    onToggle={(v) => setStep5({ indiaCompliance: v })}
                />
                <ToggleRow
                    label="Multi-Currency Payroll"
                    subtitle="Support for international employees paid in multiple currencies"
                    value={step5.multiCurrency}
                    onToggle={(v) => setStep5({ multiCurrency: v })}
                />
            </SectionCard>

            {/* Employee Portal & App */}
            <SectionCard title="Employee Portal & App" subtitle="Self-service and digital tools for employees">
                <ToggleRow
                    label="Employee Self-Service (ESS) Portal"
                    subtitle="Employee login for leaves, payslips, IT declarations, and personal profile"
                    value={step5.ess}
                    onToggle={(v) => setStep5({ ess: v })}
                />
                <ToggleRow
                    label="Mobile App (iOS & Android)"
                    subtitle="Avy ERP mobile app access for all employees — production, HR, attendance"
                    value={step5.mobileApp}
                    onToggle={(v) => setStep5({ mobileApp: v })}
                />
                <ToggleRow
                    label="AI HR Assistant Chatbot"
                    subtitle="NLP chatbot for employee leave queries, policy FAQs, and HR support"
                    value={step5.aiChatbot}
                    onToggle={(v) => setStep5({ aiChatbot: v })}
                />
                <ToggleRow
                    label="e-Sign Integration"
                    subtitle="Digital signatures for offer letters, full & final settlements, compliance documents"
                    value={step5.eSign}
                    onToggle={(v) => setStep5({ eSign: v })}
                />
            </SectionCard>

            {/* Integrations & Devices */}
            <SectionCard title="Integrations & Devices" subtitle="Hardware and third-party system connections">
                <ToggleRow
                    label="Biometric / Device Sync"
                    subtitle="Auto-sync employee attendance from ZKTeco, ESSL, and compatible biometric devices"
                    value={step5.biometric}
                    onToggle={(v) => setStep5({ biometric: v })}
                />

                <ToggleRow
                    label="Payroll Bank Integration"
                    subtitle="NEFT/RTGS bank file generation for salary disbursement via banking partner"
                    value={step5.bankIntegration}
                    onToggle={(v) => setStep5({ bankIntegration: v })}
                />

                {step5.bankIntegration && (
                    <div className="pl-4 border-l-2 border-primary-200">
                        <ToggleRow
                            label="RazorpayX Payout API"
                            subtitle="Enable direct one-click salary disbursement via RazorpayX — fully automated payroll"
                            value={step5.razorpayEnabled}
                            onToggle={(v) => setStep5({ razorpayEnabled: v })}
                        />
                        {step5.razorpayEnabled && <RazorpaySection />}
                    </div>
                )}

                <ToggleRow
                    label="Email Notifications"
                    subtitle="Automated emails for payslips, leave approvals, breakdown alerts, and reminders"
                    value={step5.emailNotif}
                    onToggle={(v) => setStep5({ emailNotif: v })}
                />
                <ToggleRow
                    label="WhatsApp Notifications"
                    subtitle="Salary alerts, leave approval status, and OTP delivery via WhatsApp Business API"
                    value={step5.whatsapp}
                    onToggle={(v) => setStep5({ whatsapp: v })}
                />
            </SectionCard>
        </div>
    );
}
