// Step 02 — Statutory & Tax
import { SectionCard, FormInput, FormSelect, InfoBanner, TwoCol } from '../atoms';
import { INDIAN_STATES } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step02Statutory() {
    const { step2, setStep2 } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">
            <InfoBanner variant="warning" className="mb-5">
                <strong>Critical:</strong> These identifiers drive payroll computation, TDS deductions, and all statutory
                filings. Ensure 100% accuracy — incorrect values can cause compliance failures and penalty notices.
            </InfoBanner>

            <SectionCard title="India Statutory Identifiers" subtitle="Government-issued registration numbers for compliant operations">
                <TwoCol>
                    <FormInput
                        label="PAN"
                        placeholder="AARCA5678F"
                        value={step2.pan}
                        onChange={(v) => setStep2({ pan: v.toUpperCase() })}
                        required
                        hint="Required for TDS, Form 16, Form 24Q filing"
                        monospace
                    />
                    <FormInput
                        label="TAN (Tax Deduction Account Number)"
                        placeholder="BLRA98765T"
                        value={step2.tan}
                        onChange={(v) => setStep2({ tan: v.toUpperCase() })}
                        required
                        hint="Required for TDS deduction and quarterly returns"
                        monospace
                    />
                </TwoCol>

                <TwoCol>
                    <FormInput
                        label="GSTIN"
                        placeholder="29AARCA5678F1Z3"
                        value={step2.gstin}
                        onChange={(v) => setStep2({ gstin: v.toUpperCase() })}
                        hint="Required if GST-registered. State code auto-prefixed from registration state."
                        monospace
                    />
                    <FormInput
                        label="PF Registration No."
                        placeholder="KA/BLR/0112345/000/0001"
                        value={step2.pfRegNo}
                        onChange={(v) => setStep2({ pfRegNo: v })}
                        required
                        hint="Required for PF deductions and ECR uploads to EPFO portal"
                        monospace
                    />
                </TwoCol>

                <TwoCol>
                    <FormInput
                        label="ESI Employer Code"
                        placeholder="53-00-123456-000-0001"
                        value={step2.esiCode}
                        onChange={(v) => setStep2({ esiCode: v })}
                        hint="Required if any employee earns ≤ ₹21,000/month gross salary"
                        monospace
                    />
                    <FormInput
                        label="PT Registration No. (Professional Tax)"
                        placeholder="State-specific format"
                        value={step2.ptReg}
                        onChange={(v) => setStep2({ ptReg: v })}
                        hint="Required in PT-applicable states (Karnataka, Maharashtra, AP, etc.)"
                        monospace
                    />
                </TwoCol>

                <TwoCol>
                    <FormInput
                        label="LWFR Number (Labour Welfare Fund)"
                        placeholder="Labour Welfare Fund Registration"
                        value={step2.lwfrNo}
                        onChange={(v) => setStep2({ lwfrNo: v })}
                        hint="Required under the Labour Welfare Fund Act in applicable states"
                        monospace
                    />
                    <FormSelect
                        label="ROC Filing State"
                        value={step2.rocState}
                        onChange={(v) => setStep2({ rocState: v })}
                        options={INDIAN_STATES}
                        placeholder="Select state"
                        required
                        hint="State where company is registered with Registrar of Companies"
                    />
                </TwoCol>
            </SectionCard>

            <SectionCard
                title="Compliance Notes"
                subtitle="Quick reference for mandatory vs optional registrations"
                accent="info"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'PAN', note: 'Mandatory for all companies', status: 'required' },
                        { label: 'TAN', note: 'Mandatory if deducting TDS', status: 'required' },
                        { label: 'GSTIN', note: 'Mandatory if annual turnover > ₹40L', status: 'conditional' },
                        { label: 'PF Reg.', note: 'Mandatory if ≥ 20 employees', status: 'required' },
                        { label: 'ESI Code', note: 'Mandatory if ≥ 10 employees with salary ≤ ₹21K', status: 'conditional' },
                        { label: 'PT Reg.', note: 'State-specific applicability', status: 'conditional' },
                        { label: 'LWF Reg.', note: 'State-specific applicability', status: 'optional' },
                        { label: 'ROC State', note: 'Always required', status: 'required' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-2.5 dark:bg-neutral-800">
                            <span className="text-xs font-bold text-primary-900 dark:text-white">{item.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-600 dark:text-neutral-300">{item.note}</span>
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                    ${item.status === 'required' ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600' :
                                            item.status === 'conditional' ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-600' :
                                                'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}
                                >
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
