// Step 03 — Address (Registered & Corporate)
import { SectionCard, FormInput, FormSelect, ToggleRow, TwoCol, ThreeCol } from '../atoms';
import { INDIAN_STATES } from '../constants';
import { useTenantOnboardingStore } from '../store';

export function Step03Address() {
    const { step3, setStep3 } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Registered Address */}
            <SectionCard title="Registered Address" subtitle="Official address as per incorporation documents — used in all statutory filings">
                <FormInput
                    label="Address Line 1"
                    placeholder="Plot no., Street, Building, Floor"
                    value={step3.regLine1}
                    onChange={(v) => setStep3({ regLine1: v })}
                    required
                />
                <FormInput
                    label="Address Line 2"
                    placeholder="Area, Landmark, Locality"
                    value={step3.regLine2}
                    onChange={(v) => setStep3({ regLine2: v })}
                />
                <ThreeCol>
                    <FormInput
                        label="City / Town"
                        placeholder="Bengaluru"
                        value={step3.regCity}
                        onChange={(v) => setStep3({ regCity: v })}
                        required
                    />
                    <FormInput
                        label="District"
                        placeholder="Bengaluru Urban"
                        value={step3.regDistrict}
                        onChange={(v) => setStep3({ regDistrict: v })}
                    />
                    <FormInput
                        label="PIN Code"
                        placeholder="560001"
                        value={step3.regPin}
                        onChange={(v) => setStep3({ regPin: v })}
                        type="text"
                        required
                    />
                </ThreeCol>
                <TwoCol>
                    <FormSelect
                        label="State"
                        value={step3.regState}
                        onChange={(v) => setStep3({ regState: v })}
                        options={INDIAN_STATES}
                        placeholder="Select state"
                        required
                        hint="Determines CGST+SGST vs. IGST applicability"
                    />
                    <FormInput
                        label="Country"
                        placeholder="India"
                        value={step3.regCountry}
                        onChange={(v) => setStep3({ regCountry: v })}
                        required
                    />
                </TwoCol>
                <FormInput
                    label="STD Code (Telephone)"
                    placeholder="080"
                    value={step3.regStdCode}
                    onChange={(v) => setStep3({ regStdCode: v })}
                    hint="Area/STD code for the registered location's landline"
                />
            </SectionCard>

            {/* Corporate / HQ Address */}
            <SectionCard
                title="Corporate / HQ Address"
                subtitle="Primary operational address — may differ from registered address"
            >
                <ToggleRow
                    label="Same as Registered Address"
                    subtitle="Check if corporate HQ is at the same location as the registered office"
                    value={step3.sameAsRegistered}
                    onToggle={(v) => setStep3({ sameAsRegistered: v })}
                />

                {!step3.sameAsRegistered && (
                    <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                        <FormInput
                            label="Address Line 1"
                            placeholder="Plot no., Street, Building, Floor"
                            value={step3.corpLine1}
                            onChange={(v) => setStep3({ corpLine1: v })}
                            required
                        />
                        <FormInput
                            label="Address Line 2"
                            placeholder="Area, Landmark, Locality"
                            value={step3.corpLine2}
                            onChange={(v) => setStep3({ corpLine2: v })}
                        />
                        <ThreeCol>
                            <FormInput
                                label="City / Town"
                                placeholder="Mumbai"
                                value={step3.corpCity}
                                onChange={(v) => setStep3({ corpCity: v })}
                                required
                            />
                            <FormInput
                                label="PIN Code"
                                placeholder="400001"
                                value={step3.corpPin}
                                onChange={(v) => setStep3({ corpPin: v })}
                                required
                            />
                            <FormSelect
                                label="State"
                                value={step3.corpState}
                                onChange={(v) => setStep3({ corpState: v })}
                                options={INDIAN_STATES}
                                placeholder="Select state"
                                required
                            />
                        </ThreeCol>
                    </div>
                )}

                {step3.sameAsRegistered && (
                    <div className="bg-success-50 rounded-xl border border-success-200 px-4 py-3 mt-2 dark:bg-success-900/20 dark:border-success-800/50">
                        <p className="text-xs font-semibold text-success-700 dark:text-success-400">
                            ✅ Corporate address will mirror the registered address above.
                        </p>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
