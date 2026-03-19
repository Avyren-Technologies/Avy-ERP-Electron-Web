// ============================================================
// Company Detail — Section Edit Modal
// Opens a centered modal with form fields for each section,
// saves via PATCH /api/v1/platform/companies/:id/sections/:sectionKey
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useUpdateCompanySection } from '@/features/super-admin/api/use-tenant-queries';
import { showSuccess } from '@/lib/toast';
import {
    FormInput,
    FormSelect,
    ToggleRow,
    RadioOption,
    ChipSelector,
    TwoCol,
    ThreeCol,
} from '@/features/super-admin/tenant-onboarding/atoms';

// ============================================================
// Types
// ============================================================

export interface EditModalProps {
    open: boolean;
    onClose: () => void;
    companyId: string;
    section: string; // identity | statutory | address | fiscal | preferences | endpoint | strategy | controls
    currentData: Record<string, any>;
    onSaved: () => void;
}

// ============================================================
// Section titles
// ============================================================

const SECTION_TITLES: Record<string, string> = {
    identity: 'Company Identity',
    statutory: 'Statutory & Tax',
    address: 'Registered & Corporate Address',
    fiscal: 'Fiscal & Calendar',
    preferences: 'Preferences & Security',
    endpoint: 'Backend Endpoint',
    strategy: 'Multi-Location Strategy',
    controls: 'System Controls',
};

// ============================================================
// Section form renderers
// ============================================================

function IdentityForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput label="Display Name" value={form.displayName ?? ''} onChange={(v) => setField('displayName', v)} required />
                <FormInput label="Legal Name" value={form.legalName ?? ''} onChange={(v) => setField('legalName', v)} required />
            </TwoCol>
            <ThreeCol>
                <FormInput label="Company Code" value={form.companyCode ?? ''} onChange={(v) => setField('companyCode', v)} monospace />
                <FormInput label="Short Name" value={form.shortName ?? ''} onChange={(v) => setField('shortName', v)} />
                <FormInput label="CIN" value={form.cin ?? ''} onChange={(v) => setField('cin', v)} monospace />
            </ThreeCol>
            <TwoCol>
                <FormSelect
                    label="Business Type"
                    value={form.businessType ?? ''}
                    onChange={(v) => setField('businessType', v)}
                    options={['Private Limited', 'Public Limited', 'LLP', 'Partnership', 'Proprietorship', 'HUF', 'Trust', 'Section 8', 'Other']}
                    placeholder="Select business type"
                />
                <FormSelect
                    label="Industry"
                    value={form.industry ?? ''}
                    onChange={(v) => setField('industry', v)}
                    options={['Manufacturing', 'IT / Software', 'FMCG', 'Pharma', 'Automotive', 'Textile', 'Retail', 'Construction', 'Agriculture', 'Education', 'Healthcare', 'Other']}
                    placeholder="Select industry"
                    searchable
                />
            </TwoCol>
            <TwoCol>
                <FormInput label="Website" value={form.website ?? ''} onChange={(v) => setField('website', v)} placeholder="https://example.com" />
                <FormInput label="Email Domain" value={form.emailDomain ?? ''} onChange={(v) => setField('emailDomain', v)} placeholder="example.com" />
            </TwoCol>
            <FormSelect
                label="Employee Count"
                value={form.employeeCount ?? ''}
                onChange={(v) => setField('employeeCount', v)}
                options={['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']}
                placeholder="Select range"
            />
        </div>
    );
}

function StatutoryForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput label="PAN" value={form.pan ?? ''} onChange={(v) => setField('pan', v.toUpperCase())} monospace placeholder="ABCDE1234F" />
                <FormInput label="TAN" value={form.tan ?? ''} onChange={(v) => setField('tan', v.toUpperCase())} monospace placeholder="ABCD12345E" />
            </TwoCol>
            <TwoCol>
                <FormInput label="GSTIN (Primary)" value={form.gstin ?? ''} onChange={(v) => setField('gstin', v.toUpperCase())} monospace placeholder="22ABCDE1234F1Z5" />
                <FormInput label="PF Registration No." value={form.pfRegNo ?? ''} onChange={(v) => setField('pfRegNo', v)} monospace />
            </TwoCol>
            <TwoCol>
                <FormInput label="ESI Code" value={form.esiCode ?? ''} onChange={(v) => setField('esiCode', v)} monospace />
                <FormInput label="PT Registration" value={form.ptReg ?? ''} onChange={(v) => setField('ptReg', v)} monospace />
            </TwoCol>
            <TwoCol>
                <FormInput label="LWFR No." value={form.lwfrNo ?? ''} onChange={(v) => setField('lwfrNo', v)} monospace />
                <FormSelect
                    label="ROC Filing State"
                    value={form.rocState ?? ''}
                    onChange={(v) => setField('rocState', v)}
                    options={[
                        'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
                        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
                        'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
                        'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
                    ]}
                    placeholder="Select state"
                    searchable
                />
            </TwoCol>
        </div>
    );
}

function AddressFields({
    prefix,
    form,
    setField,
}: {
    prefix: string;
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <FormInput label="Address Line 1" value={form[`${prefix}line1`] ?? ''} onChange={(v) => setField(`${prefix}line1`, v)} required />
            <FormInput label="Address Line 2" value={form[`${prefix}line2`] ?? ''} onChange={(v) => setField(`${prefix}line2`, v)} />
            <ThreeCol>
                <FormInput label="City" value={form[`${prefix}city`] ?? ''} onChange={(v) => setField(`${prefix}city`, v)} required />
                <FormInput label="District" value={form[`${prefix}district`] ?? ''} onChange={(v) => setField(`${prefix}district`, v)} />
                <FormInput label="PIN Code" value={form[`${prefix}pin`] ?? ''} onChange={(v) => setField(`${prefix}pin`, v)} />
            </ThreeCol>
            <TwoCol>
                <FormInput label="State" value={form[`${prefix}state`] ?? ''} onChange={(v) => setField(`${prefix}state`, v)} required />
                <FormInput label="Country" value={form[`${prefix}country`] ?? ''} onChange={(v) => setField(`${prefix}country`, v)} required />
            </TwoCol>
            <FormInput label="STD Code" value={form[`${prefix}stdCode`] ?? ''} onChange={(v) => setField(`${prefix}stdCode`, v)} />
        </div>
    );
}

function AddressForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-3 dark:text-primary-400">Registered Address</p>
                <AddressFields prefix="reg_" form={form} setField={setField} />
            </div>
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <ToggleRow
                    label="Corporate address same as registered"
                    value={form.sameAsRegistered ?? false}
                    onToggle={(v) => setField('sameAsRegistered', v)}
                />
            </div>
            {!form.sameAsRegistered && (
                <div>
                    <p className="text-xs font-bold text-accent-600 uppercase tracking-wider mb-3 dark:text-accent-400">Corporate Address</p>
                    <AddressFields prefix="corp_" form={form} setField={setField} />
                </div>
            )}
        </div>
    );
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function FiscalForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const workingDays: string[] = form.workingDays ?? [];

    const toggleDay = (day: string) => {
        const next = workingDays.includes(day)
            ? workingDays.filter((d) => d !== day)
            : [...workingDays, day];
        setField('workingDays', next);
    };

    return (
        <div className="space-y-4">
            <TwoCol>
                <FormSelect
                    label="Financial Year"
                    value={form.fyType ?? ''}
                    onChange={(v) => setField('fyType', v)}
                    options={['April–March', 'January–December', 'July–June', 'October–September']}
                    placeholder="Select FY type"
                />
                <FormSelect
                    label="Payroll Frequency"
                    value={form.payrollFreq ?? ''}
                    onChange={(v) => setField('payrollFreq', v)}
                    options={['Monthly', 'Bi-weekly', 'Weekly']}
                    placeholder="Select frequency"
                />
            </TwoCol>
            <ThreeCol>
                <FormInput label="Cutoff Day" value={form.cutoffDay ?? ''} onChange={(v) => setField('cutoffDay', v)} placeholder="e.g. 25" />
                <FormInput label="Disbursement Day" value={form.disbursementDay ?? ''} onChange={(v) => setField('disbursementDay', v)} placeholder="e.g. 1" />
                <FormSelect
                    label="Week Start"
                    value={form.weekStart ?? ''}
                    onChange={(v) => setField('weekStart', v)}
                    options={ALL_DAYS}
                />
            </ThreeCol>
            <FormSelect
                label="Timezone"
                value={form.timezone ?? ''}
                onChange={(v) => setField('timezone', v)}
                options={['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin']}
                placeholder="Select timezone"
                searchable
            />
            <div>
                <p className="text-xs font-bold text-primary-900 dark:text-white mb-2">Working Days</p>
                <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 select-none',
                                workingDays.includes(day)
                                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 shadow-sm shadow-primary-500/20'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:hover:text-primary-400'
                            )}
                        >
                            {day.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PreferencesForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <ThreeCol>
                <FormSelect
                    label="Currency"
                    value={form.currency ?? ''}
                    onChange={(v) => setField('currency', v)}
                    options={['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']}
                    placeholder="Select currency"
                />
                <FormSelect
                    label="Language"
                    value={form.language ?? ''}
                    onChange={(v) => setField('language', v)}
                    options={['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati']}
                    placeholder="Select language"
                />
                <FormSelect
                    label="Date Format"
                    value={form.dateFormat ?? ''}
                    onChange={(v) => setField('dateFormat', v)}
                    options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY']}
                    placeholder="Select format"
                />
            </ThreeCol>
            <TwoCol>
                <FormSelect
                    label="Number Format"
                    value={form.numberFormat ?? ''}
                    onChange={(v) => setField('numberFormat', v)}
                    options={['Indian (1,23,456.78)', 'International (123,456.78)']}
                    placeholder="Select format"
                />
                <FormSelect
                    label="Time Format"
                    value={form.timeFormat ?? ''}
                    onChange={(v) => setField('timeFormat', v)}
                    options={['12h', '24h']}
                    placeholder="Select format"
                />
            </TwoCol>
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-1">
                <p className="text-xs font-bold text-primary-900 dark:text-white mb-2">Feature Flags</p>
                <ToggleRow label="India Compliance" subtitle="Enable Indian statutory compliance features" value={form.indiaCompliance ?? false} onToggle={(v) => setField('indiaCompliance', v)} />
                <ToggleRow label="Web App Access" value={form.webApp ?? false} onToggle={(v) => setField('webApp', v)} />
                <ToggleRow label="System App Access" value={form.systemApp ?? false} onToggle={(v) => setField('systemApp', v)} />
                <ToggleRow label="Mobile App Access" value={form.mobileApp ?? false} onToggle={(v) => setField('mobileApp', v)} />
                <ToggleRow label="Bank Integration" value={form.bankIntegration ?? false} onToggle={(v) => setField('bankIntegration', v)} />
                <ToggleRow label="Email Notifications" value={form.emailNotif ?? false} onToggle={(v) => setField('emailNotif', v)} />
                <ToggleRow label="WhatsApp Notifications" value={form.whatsapp ?? false} onToggle={(v) => setField('whatsapp', v)} />
                <ToggleRow label="Biometric" value={form.biometric ?? false} onToggle={(v) => setField('biometric', v)} />
                <ToggleRow label="RazorpayX Payout" value={form.razorpayEnabled ?? false} onToggle={(v) => setField('razorpayEnabled', v)} />
            </div>
        </div>
    );
}

function EndpointForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <RadioOption
                    label="Avyren Default Cloud"
                    subtitle="Hosted on Avyren's managed infrastructure"
                    selected={form.endpointType !== 'custom'}
                    onSelect={() => setField('endpointType', 'default')}
                />
                <RadioOption
                    label="Custom Self-Hosted Server"
                    subtitle="Use your own server URL"
                    selected={form.endpointType === 'custom'}
                    onSelect={() => setField('endpointType', 'custom')}
                />
            </div>
            {form.endpointType === 'custom' && (
                <FormInput
                    label="Custom Endpoint URL"
                    value={form.customEndpointUrl ?? ''}
                    onChange={(v) => setField('customEndpointUrl', v)}
                    placeholder="https://erp.yourcompany.com/api"
                    monospace
                    required
                />
            )}
        </div>
    );
}

function StrategyForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <ToggleRow
                label="Multi-Location Mode"
                subtitle="Enable multi-location configuration for this tenant"
                value={form.multiLocationMode ?? false}
                onToggle={(v) => setField('multiLocationMode', v)}
            />
            {form.multiLocationMode && (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-primary-900 dark:text-white">Location Configuration Mode</p>
                    <RadioOption
                        label="Unified Configuration"
                        subtitle="All locations share the same settings"
                        selected={form.locationConfig !== 'per-location'}
                        onSelect={() => setField('locationConfig', 'unified')}
                    />
                    <RadioOption
                        label="Per-Location Configuration"
                        subtitle="Each location can have its own settings"
                        selected={form.locationConfig === 'per-location'}
                        onSelect={() => setField('locationConfig', 'per-location')}
                    />
                </div>
            )}
        </div>
    );
}

function ControlsForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    return (
        <div className="space-y-1">
            <ToggleRow label="NC Edit Mode" subtitle="Allow editing of NC (Non-Conformance) records" value={form.ncEditMode ?? false} onToggle={(v) => setField('ncEditMode', v)} />
            <ToggleRow label="Load/Unload Tracking" subtitle="Track material loading and unloading events" value={form.loadUnload ?? false} onToggle={(v) => setField('loadUnload', v)} />
            <ToggleRow label="Cycle Time Capture" subtitle="Capture production cycle time data" value={form.cycleTime ?? false} onToggle={(v) => setField('cycleTime', v)} />
            <ToggleRow label="Payroll Lock" subtitle="Lock payroll after processing" value={form.payrollLock ?? false} onToggle={(v) => setField('payrollLock', v)} />
            <ToggleRow label="Leave Carry Forward" subtitle="Allow unused leaves to be carried forward" value={form.leaveCarryForward ?? false} onToggle={(v) => setField('leaveCarryForward', v)} />
            <ToggleRow label="Overtime Approval" subtitle="Require approval for overtime entries" value={form.overtimeApproval ?? false} onToggle={(v) => setField('overtimeApproval', v)} />
            <ToggleRow label="MFA Required" subtitle="Enforce multi-factor authentication for all users" value={form.mfa ?? false} onToggle={(v) => setField('mfa', v)} />
        </div>
    );
}

// ============================================================
// Helpers to flatten/unflatten nested data for address section
// ============================================================

function flattenAddressData(data: Record<string, any>): Record<string, any> {
    const reg = data.registeredAddress ?? {};
    const corp = data.corporateAddress ?? {};
    const flat: Record<string, any> = {
        sameAsRegistered: data.sameAsRegistered ?? false,
    };
    for (const key of ['line1', 'line2', 'city', 'district', 'pin', 'state', 'country', 'stdCode']) {
        flat[`reg_${key}`] = reg[key] ?? '';
        flat[`corp_${key}`] = corp[key] ?? '';
    }
    return flat;
}

function unflattenAddressData(flat: Record<string, any>): Record<string, any> {
    const registeredAddress: Record<string, any> = {};
    const corporateAddress: Record<string, any> = {};
    for (const key of ['line1', 'line2', 'city', 'district', 'pin', 'state', 'country', 'stdCode']) {
        registeredAddress[key] = flat[`reg_${key}`] ?? '';
        corporateAddress[key] = flat[`corp_${key}`] ?? '';
    }
    return {
        sameAsRegistered: flat.sameAsRegistered ?? false,
        registeredAddress,
        corporateAddress: flat.sameAsRegistered ? {} : corporateAddress,
    };
}

function flattenFiscalData(data: Record<string, any>): Record<string, any> {
    const fc = data.fiscalConfig ?? {};
    return {
        fyType: fc.fyType ?? '',
        payrollFreq: fc.payrollFreq ?? '',
        cutoffDay: fc.cutoffDay ?? '',
        disbursementDay: fc.disbursementDay ?? '',
        weekStart: fc.weekStart ?? '',
        timezone: fc.timezone ?? '',
        workingDays: fc.workingDays ?? [],
    };
}

function flattenPreferencesData(data: Record<string, any>): Record<string, any> {
    const prefs = data.preferences ?? {};
    const razorpay = data.razorpayConfig ?? {};
    return {
        currency: prefs.currency ?? '',
        language: prefs.language ?? '',
        dateFormat: prefs.dateFormat ?? '',
        numberFormat: prefs.numberFormat ?? '',
        timeFormat: prefs.timeFormat ?? '',
        indiaCompliance: prefs.indiaCompliance ?? false,
        webApp: prefs.webApp ?? false,
        systemApp: prefs.systemApp ?? false,
        mobileApp: prefs.mobileApp ?? false,
        bankIntegration: prefs.bankIntegration ?? false,
        emailNotif: prefs.emailNotif ?? false,
        whatsapp: prefs.whatsapp ?? false,
        biometric: prefs.biometric ?? false,
        razorpayEnabled: razorpay.enabled ?? prefs.razorpayEnabled ?? false,
    };
}

function flattenControlsData(data: Record<string, any>): Record<string, any> {
    const ctrl = data.systemControls ?? {};
    return {
        ncEditMode: ctrl.ncEditMode ?? false,
        loadUnload: ctrl.loadUnload ?? false,
        cycleTime: ctrl.cycleTime ?? false,
        payrollLock: ctrl.payrollLock ?? false,
        leaveCarryForward: ctrl.leaveCarryForward ?? false,
        overtimeApproval: ctrl.overtimeApproval ?? false,
        mfa: ctrl.mfa ?? false,
    };
}

function buildInitialForm(section: string, data: Record<string, any>): Record<string, any> {
    switch (section) {
        case 'identity':
            return {
                displayName: data.displayName ?? '',
                legalName: data.legalName ?? '',
                businessType: data.businessType ?? '',
                industry: data.industry ?? '',
                companyCode: data.companyCode ?? '',
                shortName: data.shortName ?? '',
                cin: data.cin ?? '',
                website: data.website ?? '',
                emailDomain: data.emailDomain ?? '',
                employeeCount: data.employeeCount ?? '',
            };
        case 'statutory':
            return {
                pan: data.pan ?? '',
                tan: data.tan ?? '',
                gstin: data.gstin ?? '',
                pfRegNo: data.pfRegNo ?? '',
                esiCode: data.esiCode ?? '',
                ptReg: data.ptReg ?? '',
                lwfrNo: data.lwfrNo ?? '',
                rocState: data.rocState ?? '',
            };
        case 'address':
            return flattenAddressData(data);
        case 'fiscal':
            return flattenFiscalData(data);
        case 'preferences':
            return flattenPreferencesData(data);
        case 'endpoint':
            return {
                endpointType: data.endpointType ?? 'default',
                customEndpointUrl: data.customEndpointUrl ?? '',
            };
        case 'strategy':
            return {
                multiLocationMode: data.multiLocationMode ?? false,
                locationConfig: data.locationConfig ?? 'unified',
            };
        case 'controls':
            return flattenControlsData(data);
        default:
            return { ...data };
    }
}

function buildPayload(section: string, form: Record<string, any>): Record<string, any> {
    switch (section) {
        case 'address':
            return unflattenAddressData(form);
        case 'fiscal':
            return { fiscalConfig: { ...form } };
        case 'preferences': {
            const { currency, language, dateFormat, numberFormat, timeFormat, razorpayEnabled, ...flags } = form;
            return {
                preferences: { currency, language, dateFormat, numberFormat, timeFormat, ...flags },
                razorpayConfig: { enabled: razorpayEnabled },
            };
        }
        case 'controls':
            return { systemControls: { ...form } };
        default:
            return { ...form };
    }
}

// ============================================================
// Main Modal Component
// ============================================================

export function CompanyDetailEditModal({
    open,
    onClose,
    companyId,
    section,
    currentData,
    onSaved,
}: EditModalProps) {
    const [form, setForm] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);
    const mutation = useUpdateCompanySection();

    // Re-initialize form when modal opens or section changes
    useEffect(() => {
        if (open) {
            setForm(buildInitialForm(section, currentData));
            setError(null);
        }
    }, [open, section, currentData]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return undefined;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    const setField = useCallback((key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = async () => {
        setError(null);
        try {
            const payload = buildPayload(section, form);
            await mutation.mutateAsync({
                companyId,
                sectionKey: section,
                data: payload,
            });
            showSuccess('Section Updated', 'Changes have been saved.');
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Failed to save. Please try again.');
        }
    };

    if (!open) return null;

    const title = SECTION_TITLES[section] ?? 'Edit Section';

    const renderForm = () => {
        switch (section) {
            case 'identity':
                return <IdentityForm form={form} setField={setField} />;
            case 'statutory':
                return <StatutoryForm form={form} setField={setField} />;
            case 'address':
                return <AddressForm form={form} setField={setField} />;
            case 'fiscal':
                return <FiscalForm form={form} setField={setField} />;
            case 'preferences':
                return <PreferencesForm form={form} setField={setField} />;
            case 'endpoint':
                return <EndpointForm form={form} setField={setField} />;
            case 'strategy':
                return <StrategyForm form={form} setField={setField} />;
            case 'controls':
                return <ControlsForm form={form} setField={setField} />;
            default:
                return <p className="text-sm text-neutral-500 dark:text-neutral-400">Unknown section: {section}</p>;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">{title}</h2>
                        <p className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">Edit and save changes for this section</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-7 py-6">
                    {renderForm()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        {error && (
                            <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <p className="text-xs font-medium truncate">{error}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            className={cn(
                                'px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all',
                                'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'flex items-center gap-2'
                            )}
                        >
                            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {mutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
