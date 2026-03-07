// Step 14 — System Controls
import { SectionCard, ToggleRow, InfoBanner } from '../atoms';
import { useTenantOnboardingStore } from '../store';

export function Step14Controls() {
    const { step14, setStep14 } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            <InfoBanner variant="info" className="mb-5">
                System controls are <strong>company-level settings</strong> — they apply to all plants and
                locations. These settings can be modified post-activation by the Company Admin with Super-Admin approval.
            </InfoBanner>

            {/* NC Reason */}
            <SectionCard
                title="Non-Conformance (NC) Management"
                subtitle="Controls for quality and production NC entry behaviour"
            >
                <ToggleRow
                    label="Enable NC Edit Mode"
                    subtitle="Allow operators to edit or delete existing NC entries in the NC Reason Assignment screen. When disabled, entries are immutable once saved."
                    value={step14.ncEditMode}
                    onToggle={(v) => setStep14({ ncEditMode: v })}
                />
            </SectionCard>

            {/* Load & Unload */}
            <SectionCard
                title="Load & Unload Assignment"
                subtitle="Production tracking controls for machine loading events"
            >
                <ToggleRow
                    label="Load / Unload Tracking"
                    subtitle="When enabled, Load & Unload time is tracked separately and must be assigned to a category. Used for OEE Performance analysis."
                    value={step14.loadUnload}
                    onToggle={(v) => setStep14({ loadUnload: v })}
                />
                <ToggleRow
                    label="Cycle Time Capture"
                    subtitle="Automatically capture cycle time data for each production run. Required for accurate OEE and throughput analysis."
                    value={step14.cycleTime}
                    onToggle={(v) => setStep14({ cycleTime: v })}
                />
            </SectionCard>

            {/* Payroll & Attendance */}
            <SectionCard
                title="Payroll & Attendance Controls"
                subtitle="Financial governance and leave management settings"
            >
                <ToggleRow
                    label="Payroll Lock Control"
                    subtitle="Prevent any payroll modifications after the payroll lock date. Authorized managers can unlock with audit trail."
                    value={step14.payrollLock}
                    onToggle={(v) => setStep14({ payrollLock: v })}
                />
                <ToggleRow
                    label="Leave Carry Forward"
                    subtitle="Enable automatic carry forward of unused leave balances at year-end. Applied based on leaf policy rules."
                    value={step14.leaveCarryForward}
                    onToggle={(v) => setStep14({ leaveCarryForward: v })}
                />
                <ToggleRow
                    label="Overtime Approval"
                    subtitle="Require manager approval before overtime hours are counted for salary calculation. Prevents unauthorized OT."
                    value={step14.overtimeApproval}
                    onToggle={(v) => setStep14({ overtimeApproval: v })}
                />
            </SectionCard>

            {/* Security */}
            <SectionCard
                title="Security & Access Controls"
                subtitle="Authentication and data integrity settings"
                accent="warning"
            >
                <ToggleRow
                    label="Multi-Factor Authentication (MFA)"
                    subtitle="Require OTP via SMS/Email or an Authenticator app (Google/Microsoft Authenticator) for all user logins. Recommended for enterprise security."
                    value={step14.mfa}
                    onToggle={(v) => setStep14({ mfa: v })}
                />
                <ToggleRow
                    label="Backdated Entry Control"
                    subtitle="Restrict creation of records with past dates beyond a defined window (configurable: 1–30 days). Prevents retroactive manipulation."
                    value={step14.backdatedEntry}
                    onToggle={(v) => setStep14({ backdatedEntry: v })}
                />
                <ToggleRow
                    label="Document Number Edit Lock"
                    subtitle="Prevent manual editing of auto-generated document numbers (e.g. invoices, work orders). All numbers must follow the configured No. Series."
                    value={step14.docNumberLock}
                    onToggle={(v) => setStep14({ docNumberLock: v })}
                />
            </SectionCard>

            {/* Summary */}
            <SectionCard title="Controls Summary" subtitle="Current configuration overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'NC Edit Mode', value: step14.ncEditMode },
                        { label: 'Load/Unload Tracking', value: step14.loadUnload },
                        { label: 'Cycle Time Capture', value: step14.cycleTime },
                        { label: 'Payroll Lock', value: step14.payrollLock },
                        { label: 'Leave Carry Forward', value: step14.leaveCarryForward },
                        { label: 'Overtime Approval', value: step14.overtimeApproval },
                        { label: 'MFA Required', value: step14.mfa },
                        { label: 'Backdated Entry Control', value: step14.backdatedEntry },
                        { label: 'Doc Number Lock', value: step14.docNumberLock },
                    ].map((ctrl) => (
                        <div
                            key={ctrl.label}
                            className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-800"
                        >
                            <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${ctrl.value ? 'bg-success-500' : 'bg-neutral-300'}`}
                            />
                            <span className="text-xs font-semibold text-primary-950 flex-1 dark:text-white">{ctrl.label}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ctrl.value ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                }`}>
                                {ctrl.value ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
