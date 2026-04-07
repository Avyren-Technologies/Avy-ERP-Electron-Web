// ============================================================
// Company Detail — Section Edit Modal
// Opens a centered modal with form fields for each section,
// saves via PATCH /api/v1/platform/companies/:id/sections/:sectionKey
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Loader2, AlertCircle, Plus, Trash2, Edit3, Star, Upload, Camera } from 'lucide-react';
import { useRef } from 'react';
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
import { MODULE_CATALOGUE, USER_TIERS, resolveModuleDependencies } from '@/features/super-admin/tenant-onboarding/constants';

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
    contacts: 'Key Contacts',
    shifts: 'Shifts & Time',
    noSeries: 'Number Series',
    iotReasons: 'IOT Reasons',
    users: 'Users & Access',
    locations: 'Plants & Locations',
    commercial: 'Active Modules & Billing',
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
    const fileRef = useRef<HTMLInputElement>(null);
    const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return; // 2MB max
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setField('logoUrl', result);
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setField('logoUrl', '');
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            {/* Company Logo */}
            <div>
                <p className="text-xs font-bold text-primary-900 dark:text-white mb-2">Company Logo</p>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        'w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden',
                        form.logoUrl
                            ? 'border-2 border-primary-200 dark:border-primary-800/50'
                            : 'border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                    )}>
                        {form.logoUrl ? (
                            <img src={form.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-[10px] text-neutral-400 font-medium">No logo</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
                        {form.logoUrl ? (
                            <div className="flex gap-2">
                                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 hover:bg-primary-100 transition-colors">
                                    <Camera size={13} /> Change
                                </button>
                                <button type="button" onClick={removeLogo} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-danger-50 dark:bg-danger-900/20 text-danger-600 border border-danger-200 dark:border-danger-800/50 hover:bg-danger-100 transition-colors">
                                    <X size={13} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setLogoMode('upload'); fileRef.current?.click(); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20 transition-colors">
                                    <Upload size={13} /> Upload
                                </button>
                                <button type="button" onClick={() => setLogoMode(logoMode === 'url' ? 'upload' : 'url')} className="px-3 py-2 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    {logoMode === 'url' ? 'Hide URL' : 'Use URL'}
                                </button>
                            </div>
                        )}
                        {logoMode === 'url' && !form.logoUrl && (
                            <FormInput
                                label=""
                                value={form.logoUrl ?? ''}
                                onChange={(v) => setField('logoUrl', v)}
                                placeholder="https://cdn.example.com/logo.png"
                            />
                        )}
                        <p className="text-[10px] text-neutral-400">PNG/JPG/WebP, max 2 MB</p>
                    </div>
                </div>
            </div>

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
            <TwoCol>
                <FormSelect
                    label="Employee Count"
                    value={form.employeeCount ?? ''}
                    onChange={(v) => setField('employeeCount', v)}
                    options={['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']}
                    placeholder="Select range"
                />
                <FormInput
                    label="Incorporation Date"
                    value={form.incorporationDate ?? ''}
                    onChange={(v) => setField('incorporationDate', v)}
                    placeholder="YYYY-MM-DD"
                />
            </TwoCol>
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

const CONTACT_TYPES = ['Primary', 'Secondary', 'Technical', 'Billing', 'HR', 'Other'];

const EMPTY_CONTACT = {
    name: '', type: 'Primary', email: '', mobile: '',
    countryCode: '+91', designation: '', department: '', linkedin: '',
};

function ContactsForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const items: any[] = form._items ?? [];
    const [editIdx, setEditIdx] = useState<number | null>(null); // -1 = adding new
    const [draft, setDraft] = useState<Record<string, any>>({ ...EMPTY_CONTACT });

    const setDraftField = (key: string, value: any) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const startAdd = () => {
        setDraft({ ...EMPTY_CONTACT });
        setEditIdx(-1);
    };

    const startEdit = (idx: number) => {
        setDraft({ ...items[idx] });
        setEditIdx(idx);
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setDraft({ ...EMPTY_CONTACT });
    };

    const saveEdit = () => {
        if (!draft.name || !draft.email || !draft.mobile || !draft.type) return;
        let next: any[];
        if (editIdx === -1) {
            next = [...items, { ...draft }];
        } else {
            next = items.map((item, i) => (i === editIdx ? { ...draft } : item));
        }
        setField('_items', next);
        setEditIdx(null);
        setDraft({ ...EMPTY_CONTACT });
    };

    const removeItem = (idx: number) => {
        setField('_items', items.filter((_, i) => i !== idx));
        if (editIdx === idx) cancelEdit();
    };

    const renderDraftForm = () => (
        <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <TwoCol>
                <FormInput label="Name" value={draft.name ?? ''} onChange={(v) => setDraftField('name', v)} required />
                <FormSelect
                    label="Type"
                    value={draft.type ?? 'Primary'}
                    onChange={(v) => setDraftField('type', v)}
                    options={CONTACT_TYPES}
                    placeholder="Select type"
                />
            </TwoCol>
            <TwoCol>
                <FormInput label="Email" value={draft.email ?? ''} onChange={(v) => setDraftField('email', v)} required />
                <FormInput label="Mobile" value={draft.mobile ?? ''} onChange={(v) => setDraftField('mobile', v)} placeholder="10-15 digits" required />
            </TwoCol>
            <TwoCol>
                <FormInput label="Country Code" value={draft.countryCode ?? '+91'} onChange={(v) => setDraftField('countryCode', v)} />
                <FormInput label="Designation" value={draft.designation ?? ''} onChange={(v) => setDraftField('designation', v)} />
            </TwoCol>
            <TwoCol>
                <FormInput label="Department" value={draft.department ?? ''} onChange={(v) => setDraftField('department', v)} />
                <FormInput label="LinkedIn" value={draft.linkedin ?? ''} onChange={(v) => setDraftField('linkedin', v)} placeholder="https://linkedin.com/in/..." />
            </TwoCol>
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.name || !draft.email || !draft.mobile || !draft.type}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold text-white transition-all',
                        'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    {editIdx === -1 ? 'Add Contact' : 'Update Contact'}
                </button>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {items.map((c, i) => (
                <div key={i}>
                    {editIdx === i ? (
                        renderDraftForm()
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{c.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                    {c.type} &middot; {c.email} &middot; {c.countryCode || '+91'} {c.mobile}
                                </p>
                                {(c.designation || c.department) && (
                                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                                        {[c.designation, c.department].filter(Boolean).join(' / ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(i)}
                                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {editIdx === -1 ? (
                renderDraftForm()
            ) : (
                <button
                    type="button"
                    onClick={startAdd}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                >
                    <Plus size={14} />
                    Add Contact
                </button>
            )}
        </div>
    );
}

const EMPTY_SHIFT = { name: '', fromTime: '', toTime: '', noShuffle: false };

function ShiftsForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const weeklyOffs: string[] = form.weeklyOffs ?? [];
    const items: any[] = form._items ?? [];
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, any>>({ ...EMPTY_SHIFT });

    const toggleOff = (day: string) => {
        const next = weeklyOffs.includes(day)
            ? weeklyOffs.filter((d) => d !== day)
            : [...weeklyOffs, day];
        setField('weeklyOffs', next);
    };

    const setDraftField = (key: string, value: any) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const startAdd = () => {
        setDraft({ ...EMPTY_SHIFT });
        setEditIdx(-1);
    };

    const startEdit = (idx: number) => {
        setDraft({ ...items[idx] });
        setEditIdx(idx);
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setDraft({ ...EMPTY_SHIFT });
    };

    const saveEdit = () => {
        if (!draft.name || !draft.fromTime || !draft.toTime) return;
        let next: any[];
        if (editIdx === -1) {
            next = [...items, { ...draft }];
        } else {
            next = items.map((item, i) => (i === editIdx ? { ...draft } : item));
        }
        setField('_items', next);
        setEditIdx(null);
        setDraft({ ...EMPTY_SHIFT });
    };

    const removeItem = (idx: number) => {
        setField('_items', items.filter((_, i) => i !== idx));
        if (editIdx === idx) cancelEdit();
    };

    const renderDraftForm = () => (
        <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <FormInput label="Shift Name" value={draft.name ?? ''} onChange={(v) => setDraftField('name', v)} required placeholder="e.g. General Shift" />
            <TwoCol>
                <FormInput label="From Time" value={draft.fromTime ?? ''} onChange={(v) => setDraftField('fromTime', v)} required placeholder="HH:mm" />
                <FormInput label="To Time" value={draft.toTime ?? ''} onChange={(v) => setDraftField('toTime', v)} required placeholder="HH:mm" />
            </TwoCol>
            <ToggleRow label="No Shuffle" subtitle="Prevent this shift from being auto-rotated" value={draft.noShuffle ?? false} onToggle={(v) => setDraftField('noShuffle', v)} />
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.name || !draft.fromTime || !draft.toTime}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold text-white transition-all',
                        'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    {editIdx === -1 ? 'Add Shift' : 'Update Shift'}
                </button>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Company-level time fields */}
            <div className="space-y-4">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Day Boundaries</p>
                <TwoCol>
                    <FormInput label="Day Start Time" value={form.dayStartTime ?? ''} onChange={(v) => setField('dayStartTime', v)} placeholder="HH:mm" />
                    <FormInput label="Day End Time" value={form.dayEndTime ?? ''} onChange={(v) => setField('dayEndTime', v)} placeholder="HH:mm" />
                </TwoCol>
            </div>

            {/* Weekly offs */}
            <div>
                <p className="text-xs font-bold text-primary-900 dark:text-white mb-2">Weekly Offs</p>
                <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleOff(day)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 select-none',
                                weeklyOffs.includes(day)
                                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 shadow-sm shadow-primary-500/20'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:hover:text-primary-400'
                            )}
                        >
                            {day.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Shift items */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Shift Definitions</p>
                {items.map((s, i) => (
                    <div key={i}>
                        {editIdx === i ? (
                            renderDraftForm()
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{s.name}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                        {s.fromTime} &ndash; {s.toTime}{s.noShuffle ? ' · No Shuffle' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(i)}
                                        className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {editIdx === -1 ? (
                    renderDraftForm()
                ) : (
                    <button
                        type="button"
                        onClick={startAdd}
                        className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                    >
                        <Plus size={14} />
                        Add Shift
                    </button>
                )}
            </div>
        </div>
    );
}

const EMPTY_NO_SERIES = {
    code: '', linkedScreen: '', prefix: '', suffix: '',
    numberCount: 5, startNumber: 1, description: '',
};

function NoSeriesForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const items: any[] = form._items ?? [];
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, any>>({ ...EMPTY_NO_SERIES });

    const setDraftField = (key: string, value: any) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const startAdd = () => {
        setDraft({ ...EMPTY_NO_SERIES });
        setEditIdx(-1);
    };

    const startEdit = (idx: number) => {
        setDraft({ ...items[idx] });
        setEditIdx(idx);
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setDraft({ ...EMPTY_NO_SERIES });
    };

    const saveEdit = () => {
        if (!draft.code || !draft.linkedScreen || !draft.prefix) return;
        let next: any[];
        if (editIdx === -1) {
            next = [...items, { ...draft }];
        } else {
            next = items.map((item, i) => (i === editIdx ? { ...draft } : item));
        }
        setField('_items', next);
        setEditIdx(null);
        setDraft({ ...EMPTY_NO_SERIES });
    };

    const removeItem = (idx: number) => {
        setField('_items', items.filter((_, i) => i !== idx));
        if (editIdx === idx) cancelEdit();
    };

    const renderDraftForm = () => (
        <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <TwoCol>
                <FormInput label="Code" value={draft.code ?? ''} onChange={(v) => setDraftField('code', v)} required monospace placeholder="e.g. EMP" />
                <FormInput label="Linked Screen" value={draft.linkedScreen ?? ''} onChange={(v) => setDraftField('linkedScreen', v)} required placeholder="e.g. Employee Master" />
            </TwoCol>
            <TwoCol>
                <FormInput label="Prefix" value={draft.prefix ?? ''} onChange={(v) => setDraftField('prefix', v)} required monospace placeholder="e.g. EMP-" />
                <FormInput label="Suffix" value={draft.suffix ?? ''} onChange={(v) => setDraftField('suffix', v)} monospace placeholder="Optional suffix" />
            </TwoCol>
            <TwoCol>
                <FormInput label="Number Count (digits)" value={String(draft.numberCount ?? 5)} onChange={(v) => setDraftField('numberCount', v)} placeholder="Default: 5" />
                <FormInput label="Start Number" value={String(draft.startNumber ?? 1)} onChange={(v) => setDraftField('startNumber', v)} placeholder="Default: 1" />
            </TwoCol>
            <FormInput label="Description" value={draft.description ?? ''} onChange={(v) => setDraftField('description', v)} placeholder="Optional description" />
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.code || !draft.linkedScreen || !draft.prefix}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold text-white transition-all',
                        'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    {editIdx === -1 ? 'Add Series' : 'Update Series'}
                </button>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {items.map((ns, i) => (
                <div key={i}>
                    {editIdx === i ? (
                        renderDraftForm()
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold font-mono text-primary-950 dark:text-white truncate">{ns.code}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                    {ns.linkedScreen} &middot; <span className="font-mono">{ns.prefix}{String(ns.startNumber ?? 1).padStart(ns.numberCount ?? 5, '0')}{ns.suffix ?? ''}</span>
                                </p>
                                {ns.description && (
                                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{ns.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(i)}
                                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {editIdx === -1 ? (
                renderDraftForm()
            ) : (
                <button
                    type="button"
                    onClick={startAdd}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                >
                    <Plus size={14} />
                    Add Series
                </button>
            )}
        </div>
    );
}

const IOT_REASON_TYPES = ['Machine Idle', 'Machine Alarm'];

const EMPTY_IOT_REASON = {
    reasonType: '', reason: '', description: '',
    department: '', planned: false, duration: '',
};

function IotReasonsForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const items: any[] = form._items ?? [];
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, any>>({ ...EMPTY_IOT_REASON });

    const setDraftField = (key: string, value: any) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const startAdd = () => {
        setDraft({ ...EMPTY_IOT_REASON });
        setEditIdx(-1);
    };

    const startEdit = (idx: number) => {
        setDraft({ ...items[idx] });
        setEditIdx(idx);
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setDraft({ ...EMPTY_IOT_REASON });
    };

    const saveEdit = () => {
        if (!draft.reasonType || !draft.reason) return;
        let next: any[];
        if (editIdx === -1) {
            next = [...items, { ...draft }];
        } else {
            next = items.map((item, i) => (i === editIdx ? { ...draft } : item));
        }
        setField('_items', next);
        setEditIdx(null);
        setDraft({ ...EMPTY_IOT_REASON });
    };

    const removeItem = (idx: number) => {
        setField('_items', items.filter((_, i) => i !== idx));
        if (editIdx === idx) cancelEdit();
    };

    const renderDraftForm = () => (
        <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <TwoCol>
                <FormSelect
                    label="Reason Type"
                    value={draft.reasonType ?? ''}
                    onChange={(v) => setDraftField('reasonType', v)}
                    options={IOT_REASON_TYPES}
                    placeholder="Select type"
                />
                <FormInput label="Reason" value={draft.reason ?? ''} onChange={(v) => setDraftField('reason', v)} required placeholder="e.g. Power Failure" />
            </TwoCol>
            <TwoCol>
                <FormInput label="Department" value={draft.department ?? ''} onChange={(v) => setDraftField('department', v)} placeholder="Optional" />
                <FormInput label="Duration" value={draft.duration ?? ''} onChange={(v) => setDraftField('duration', v)} placeholder="e.g. 30m, 1h" />
            </TwoCol>
            <FormInput label="Description" value={draft.description ?? ''} onChange={(v) => setDraftField('description', v)} placeholder="Optional description" />
            <ToggleRow label="Planned" subtitle="Is this a planned downtime reason?" value={draft.planned ?? false} onToggle={(v) => setDraftField('planned', v)} />
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.reasonType || !draft.reason}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold text-white transition-all',
                        'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    {editIdx === -1 ? 'Add Reason' : 'Update Reason'}
                </button>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {items.map((r, i) => (
                <div key={i}>
                    {editIdx === i ? (
                        renderDraftForm()
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                        r.reasonType === 'Machine Idle'
                                            ? 'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50'
                                            : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
                                    )}>
                                        {r.reasonType}
                                    </span>
                                    {r.planned && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">
                                            Planned
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{r.reason}</p>
                                {r.department && (
                                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{r.department}{r.duration ? ` · ${r.duration}` : ''}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(i)}
                                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {editIdx === -1 ? (
                renderDraftForm()
            ) : (
                <button
                    type="button"
                    onClick={startAdd}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                >
                    <Plus size={14} />
                    Add Reason
                </button>
            )}
        </div>
    );
}

const EMPTY_NEW_USER = {
    fullName: '', username: '', email: '', password: '',
    role: 'COMPANY_ADMIN', mobile: '', department: '',
};

function UsersForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const existingUsers: any[] = form._existingUsers ?? [];
    const newUsers: any[] = form._newUsers ?? [];

    const addNewUser = () => {
        setField('_newUsers', [...newUsers, { ...EMPTY_NEW_USER }]);
    };

    const removeNewUser = (idx: number) => {
        setField('_newUsers', newUsers.filter((_: any, i: number) => i !== idx));
    };

    const updateNewUser = (idx: number, key: string, value: any) => {
        const updated = newUsers.map((u: any, i: number) => (i === idx ? { ...u, [key]: value } : u));
        setField('_newUsers', updated);
    };

    return (
        <div className="space-y-5">
            {/* Existing users (read-only) */}
            <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-3 dark:text-primary-400">Existing Users</p>
                {existingUsers.length === 0 ? (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">No users yet.</p>
                ) : (
                    <div className="space-y-2">
                        {existingUsers.map((u: any, i: number) => (
                            <div key={u.id ?? i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{u.fullName || u.username}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{u.email}</p>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 flex-shrink-0 ml-3">
                                    {u.role ?? 'COMPANY_ADMIN'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New users */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Add New Users</p>
                {newUsers.map((u: any, idx: number) => (
                    <div key={idx} className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-primary-950 dark:text-white">New User #{idx + 1}</p>
                            <button
                                type="button"
                                onClick={() => removeNewUser(idx)}
                                className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <TwoCol>
                            <FormInput label="Full Name" value={u.fullName ?? ''} onChange={(v) => updateNewUser(idx, 'fullName', v)} required placeholder="John Doe" />
                            <FormInput label="Username" value={u.username ?? ''} onChange={(v) => updateNewUser(idx, 'username', v)} required placeholder="johndoe" />
                        </TwoCol>
                        <TwoCol>
                            <FormInput label="Email" value={u.email ?? ''} onChange={(v) => updateNewUser(idx, 'email', v)} required placeholder="john@example.com" />
                            <FormInput label="Password" value={u.password ?? ''} onChange={(v) => updateNewUser(idx, 'password', v)} required type="password" placeholder="Min 6 characters" />
                        </TwoCol>
                        <TwoCol>
                            <FormSelect
                                label="Role"
                                value={u.role ?? 'COMPANY_ADMIN'}
                                onChange={(v) => updateNewUser(idx, 'role', v)}
                                options={['COMPANY_ADMIN']}
                                placeholder="Select role"
                            />
                            <FormInput label="Mobile" value={u.mobile ?? ''} onChange={(v) => updateNewUser(idx, 'mobile', v)} placeholder="Optional" />
                        </TwoCol>
                        <FormInput label="Department" value={u.department ?? ''} onChange={(v) => updateNewUser(idx, 'department', v)} placeholder="Optional" />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addNewUser}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                >
                    <Plus size={14} />
                    Add User
                </button>
            </div>
        </div>
    );
}

const FACILITY_TYPES = ['Factory', 'Warehouse', 'Office', 'Retail', 'Other'];
const LOCATION_STATUSES = ['Active', 'Draft', 'Inactive'];

const EMPTY_LOCATION = {
    name: '', code: '', facilityType: '', status: 'Active', isHQ: false,
    addressLine1: '', addressLine2: '', city: '', district: '', state: '', pin: '', country: '', stdCode: '', gstin: '',
    contactName: '', contactDesignation: '', contactEmail: '', contactPhone: '',
    geoEnabled: false, geoLocationName: '', geoLat: '', geoLng: '', geoRadius: 50,
};

function LocationsForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const items: any[] = form._items ?? [];
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<Record<string, any>>({ ...EMPTY_LOCATION });

    const setDraftField = (key: string, value: any) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const startAdd = () => {
        setDraft({ ...EMPTY_LOCATION });
        setEditIdx(-1);
    };

    const startEdit = (idx: number) => {
        setDraft({ ...items[idx] });
        setEditIdx(idx);
    };

    const cancelEdit = () => {
        setEditIdx(null);
        setDraft({ ...EMPTY_LOCATION });
    };

    const saveEdit = () => {
        if (!draft.name || !draft.code || !draft.facilityType) return;
        let next: any[];
        if (editIdx === -1) {
            next = [...items, { ...draft }];
        } else {
            next = items.map((item, i) => (i === editIdx ? { ...draft } : item));
        }
        setField('_items', next);
        setEditIdx(null);
        setDraft({ ...EMPTY_LOCATION });
    };

    const removeItem = (idx: number) => {
        setField('_items', items.filter((_, i) => i !== idx));
        if (editIdx === idx) cancelEdit();
    };

    const renderDraftForm = () => (
        <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            {/* Basic Info */}
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Basic Info</p>
            <TwoCol>
                <FormInput label="Name" value={draft.name ?? ''} onChange={(v) => setDraftField('name', v)} required />
                <FormInput label="Code" value={draft.code ?? ''} onChange={(v) => setDraftField('code', v.toUpperCase())} monospace required />
            </TwoCol>
            <ThreeCol>
                <FormSelect
                    label="Facility Type"
                    value={draft.facilityType ?? ''}
                    onChange={(v) => setDraftField('facilityType', v)}
                    options={FACILITY_TYPES}
                    placeholder="Select type"
                />
                <FormSelect
                    label="Status"
                    value={draft.status ?? 'Active'}
                    onChange={(v) => setDraftField('status', v)}
                    options={LOCATION_STATUSES}
                />
                <div className="pt-5">
                    <ToggleRow label="Headquarters (HQ)" value={draft.isHQ ?? false} onToggle={(v) => setDraftField('isHQ', v)} />
                </div>
            </ThreeCol>

            {/* Address */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-3 dark:text-primary-400">Address</p>
                <div className="space-y-3">
                    <FormInput label="Address Line 1" value={draft.addressLine1 ?? ''} onChange={(v) => setDraftField('addressLine1', v)} />
                    <FormInput label="Address Line 2" value={draft.addressLine2 ?? ''} onChange={(v) => setDraftField('addressLine2', v)} />
                    <ThreeCol>
                        <FormInput label="City" value={draft.city ?? ''} onChange={(v) => setDraftField('city', v)} />
                        <FormInput label="District" value={draft.district ?? ''} onChange={(v) => setDraftField('district', v)} />
                        <FormInput label="PIN Code" value={draft.pin ?? ''} onChange={(v) => setDraftField('pin', v)} />
                    </ThreeCol>
                    <TwoCol>
                        <FormInput label="State" value={draft.state ?? ''} onChange={(v) => setDraftField('state', v)} />
                        <FormInput label="Country" value={draft.country ?? ''} onChange={(v) => setDraftField('country', v)} />
                    </TwoCol>
                    <TwoCol>
                        <FormInput label="STD Code" value={draft.stdCode ?? ''} onChange={(v) => setDraftField('stdCode', v)} />
                        <FormInput label="GSTIN" value={draft.gstin ?? ''} onChange={(v) => setDraftField('gstin', v.toUpperCase())} monospace />
                    </TwoCol>
                </div>
            </div>

            {/* Contact */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="text-xs font-bold text-accent-600 uppercase tracking-wider mb-3 dark:text-accent-400">Contact</p>
                <TwoCol>
                    <FormInput label="Contact Name" value={draft.contactName ?? ''} onChange={(v) => setDraftField('contactName', v)} />
                    <FormInput label="Designation" value={draft.contactDesignation ?? ''} onChange={(v) => setDraftField('contactDesignation', v)} />
                </TwoCol>
                <div className="mt-3">
                    <TwoCol>
                        <FormInput label="Email" value={draft.contactEmail ?? ''} onChange={(v) => setDraftField('contactEmail', v)} />
                        <FormInput label="Phone" value={draft.contactPhone ?? ''} onChange={(v) => setDraftField('contactPhone', v)} />
                    </TwoCol>
                </div>
            </div>

            {/* Geo-Fencing */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="text-xs font-bold text-accent-600 uppercase tracking-wider mb-3 dark:text-accent-400">Geo-Fencing</p>
                <ToggleRow label="Enable Geo-Fencing" value={draft.geoEnabled ?? false} onToggle={(v) => setDraftField('geoEnabled', v)} />
                {draft.geoEnabled && (
                    <div className="space-y-3 mt-3">
                        <FormInput label="Location Name" value={draft.geoLocationName ?? ''} onChange={(v) => setDraftField('geoLocationName', v)} />
                        <ThreeCol>
                            <FormInput label="Latitude" value={draft.geoLat ?? ''} onChange={(v) => setDraftField('geoLat', v)} placeholder="e.g. 12.9716" />
                            <FormInput label="Longitude" value={draft.geoLng ?? ''} onChange={(v) => setDraftField('geoLng', v)} placeholder="e.g. 77.5946" />
                            <FormInput label="Radius (m)" value={String(draft.geoRadius ?? 50)} onChange={(v) => setDraftField('geoRadius', v)} placeholder="50" />
                        </ThreeCol>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!draft.name || !draft.code || !draft.facilityType}
                    className={cn(
                        'px-4 py-2 rounded-xl text-xs font-bold text-white transition-all',
                        'bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                >
                    {editIdx === -1 ? 'Add Location' : 'Update Location'}
                </button>
                <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {items.map((loc, i) => (
                <div key={i}>
                    {editIdx === i ? (
                        renderDraftForm()
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-primary-950 dark:text-white truncate">{loc.name}</p>
                                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded">{loc.code}</span>
                                    {loc.isHQ && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                    {loc.facilityType}{loc.city || loc.state ? ` \u00b7 ${[loc.city, loc.state].filter(Boolean).join(', ')}` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                <button
                                    type="button"
                                    onClick={() => startEdit(i)}
                                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 dark:text-danger-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {editIdx === -1 ? (
                renderDraftForm()
            ) : (
                <button
                    type="button"
                    onClick={startAdd}
                    className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-xs font-bold text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all"
                >
                    <Plus size={14} />
                    Add Location
                </button>
            )}
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

// ============================================================
// Commercial (Active Modules & Billing) Form
// ============================================================

function CommercialForm({
    form,
    setField,
}: {
    form: Record<string, any>;
    setField: (key: string, value: any) => void;
}) {
    const selectedIds: string[] = form.selectedModuleIds ?? [];
    const customPricing: Record<string, number> = form.customModulePricing ?? {};

    const toggleModule = (moduleId: string) => {
        if (selectedIds.includes(moduleId)) {
            // Remove — just remove that one module
            setField('selectedModuleIds', selectedIds.filter((id) => id !== moduleId));
        } else {
            // Add — resolve dependencies recursively
            const { resolved } = resolveModuleDependencies([...selectedIds, moduleId], MODULE_CATALOGUE);
            setField('selectedModuleIds', resolved);
        }
    };

    const selectedTotal = selectedIds.reduce((sum, id) => {
        if (customPricing[id] != null) return sum + customPricing[id];
        const mod = MODULE_CATALOGUE.find((m) => m.id === id);
        return sum + (mod?.price ?? 0);
    }, 0);

    const setCustomPrice = (moduleId: string, price: string) => {
        const next = { ...customPricing };
        const num = Number(price);
        if (!price || isNaN(num)) {
            delete next[moduleId];
        } else {
            next[moduleId] = num;
        }
        setField('customModulePricing', next);
    };

    return (
        <div className="space-y-6">
            {/* Module Selection */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wider dark:text-primary-400">Module Selection</p>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        {selectedIds.length} modules selected &middot; &#8377;{selectedTotal.toLocaleString('en-IN')}/mo
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MODULE_CATALOGUE.map((mod) => {
                        const isSelected = selectedIds.includes(mod.id);
                        return (
                            <button
                                key={mod.id}
                                type="button"
                                onClick={() => toggleModule(mod.id)}
                                className={cn(
                                    'flex flex-col items-start text-left p-4 rounded-2xl border-2 transition-all duration-150',
                                    isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm shadow-primary-500/10'
                                        : 'border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                )}
                            >
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <span className="text-lg">{mod.icon}</span>
                                    <span className={cn(
                                        'text-sm font-bold',
                                        isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-primary-950 dark:text-white'
                                    )}>
                                        {mod.name}
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2">
                                    {mod.description}
                                </p>
                                <div className="flex items-center justify-between w-full">
                                    <span className={cn(
                                        'text-xs font-bold',
                                        isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'
                                    )}>
                                        &#8377;{mod.price.toLocaleString('en-IN')}/mo
                                    </span>
                                    {mod.dependencies.length > 0 && (
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
                                            Requires: {mod.dependencies.join(', ')}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Custom pricing overrides for selected modules */}
                {selectedIds.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-primary-900 dark:text-white mb-2">Custom Module Pricing (optional)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedIds.map((id) => {
                                const mod = MODULE_CATALOGUE.find((m) => m.id === id);
                                if (!mod) return null;
                                return (
                                    <FormInput
                                        key={id}
                                        label={mod.name}
                                        value={customPricing[id] != null ? String(customPricing[id]) : ''}
                                        onChange={(v) => setCustomPrice(id, v)}
                                        placeholder={`Default: ${mod.price}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* User Tier */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-3 dark:text-primary-400">User Tier</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {USER_TIERS.map((tier) => {
                        const isSelected = form.userTier === tier.key;
                        return (
                            <button
                                key={tier.key}
                                type="button"
                                onClick={() => setField('userTier', tier.key)}
                                className={cn(
                                    'flex flex-col items-start text-left p-4 rounded-2xl border-2 transition-all duration-150',
                                    isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm shadow-primary-500/10'
                                        : 'border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                )}
                            >
                                <span className={cn(
                                    'text-sm font-bold mb-0.5',
                                    isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-primary-950 dark:text-white'
                                )}>
                                    {tier.label}
                                </span>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mb-1.5">
                                    {tier.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    {/* Pricing hidden — uncomment when pricing is finalized
                                    <span className={cn(
                                        'text-xs font-bold',
                                        isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'
                                    )}>
                                        {tier.basePrice > 0 ? `₹${tier.basePrice.toLocaleString('en-IN')}/mo` : 'Custom'}
                                    </span>
                                    */}
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                        {tier.range}
                                    </span>
                                </div>
                                {tier.popular && (
                                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
                                        <Star size={10} /> Popular
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {form.userTier === 'custom' && (
                    <div className="mt-4">
                        <TwoCol>
                            <FormInput
                                label="Custom User Limit"
                                value={form.customUserLimit ?? ''}
                                onChange={(v) => setField('customUserLimit', v)}
                                placeholder="e.g. 2000"
                            />
                            <FormInput
                                label="Custom Tier Price (per month)"
                                value={form.customTierPrice ?? ''}
                                onChange={(v) => setField('customTierPrice', v)}
                                placeholder="e.g. 15000"
                            />
                        </TwoCol>
                    </div>
                )}
            </div>

            {/* Billing Config */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-3 dark:text-primary-400">Billing Configuration</p>
                <TwoCol>
                    <FormSelect
                        label="Billing Type"
                        value={form.billingType ?? 'monthly'}
                        onChange={(v) => setField('billingType', v)}
                        options={['monthly', 'annual']}
                        placeholder="Select billing type"
                    />
                    <FormInput
                        label="Trial Days"
                        value={String(form.trialDays ?? 0)}
                        onChange={(v) => setField('trialDays', v)}
                        placeholder="0-365"
                    />
                </TwoCol>
            </div>
        </div>
    );
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
                slug: data.slug ?? '',
                shortName: data.shortName ?? '',
                cin: data.cin ?? '',
                website: data.website ?? '',
                emailDomain: data.emailDomain ?? '',
                employeeCount: data.employeeCount ?? '',
                incorporationDate: data.incorporationDate ?? '',
                logoUrl: data.logoUrl ?? '',
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
        case 'contacts':
            return { _items: (data.contacts ?? data._items ?? []).map((c: any) => ({
                name: c.name ?? '', type: c.type ?? 'Primary', email: c.email ?? '',
                mobile: c.mobile ?? '', countryCode: c.countryCode ?? '+91',
                designation: c.designation ?? '', department: c.department ?? '',
                linkedin: c.linkedin ?? '',
            })) };
        case 'shifts':
            return {
                dayStartTime: data.dayStartTime ?? '',
                dayEndTime: data.dayEndTime ?? '',
                weeklyOffs: data.weeklyOffs ?? [],
                _items: (data.shifts ?? data._items ?? []).map((s: any) => ({
                    name: s.name ?? '', fromTime: s.fromTime ?? s.startTime ?? '',
                    toTime: s.toTime ?? s.endTime ?? '', noShuffle: s.noShuffle ?? false,
                })),
            };
        case 'noSeries':
            return { _items: (data.noSeries ?? data._items ?? []).map((ns: any) => ({
                code: ns.code ?? '', linkedScreen: ns.linkedScreen ?? '', prefix: ns.prefix ?? '',
                suffix: ns.suffix ?? '', numberCount: ns.numberCount ?? 5, startNumber: ns.startNumber ?? 1,
                description: ns.description ?? '',
            })) };
        case 'iotReasons':
            return { _items: (data.iotReasons ?? data._items ?? []).map((r: any) => ({
                reasonType: r.reasonType ?? '', reason: r.reason ?? '', description: r.description ?? '',
                department: r.department ?? '', planned: r.planned ?? false, duration: r.duration ?? '',
            })) };
        case 'users':
            return { _existingUsers: data.users ?? [], _newUsers: [] };
        case 'locations':
            return { _items: (data.locations ?? data._items ?? []).map((loc: any) => ({
                name: loc.name ?? '', code: loc.code ?? '', facilityType: loc.facilityType ?? '',
                status: loc.status ?? 'Active', isHQ: loc.isHQ ?? false,
                addressLine1: loc.addressLine1 ?? '', addressLine2: loc.addressLine2 ?? '',
                city: loc.city ?? '', district: loc.district ?? '', state: loc.state ?? '',
                pin: loc.pin ?? '', country: loc.country ?? '', stdCode: loc.stdCode ?? '',
                gstin: loc.gstin ?? '', contactName: loc.contactName ?? '',
                contactDesignation: loc.contactDesignation ?? '', contactEmail: loc.contactEmail ?? '',
                contactPhone: loc.contactPhone ?? '', geoEnabled: loc.geoEnabled ?? false,
                geoLocationName: loc.geoLocationName ?? '', geoLat: loc.geoLat ?? '',
                geoLng: loc.geoLng ?? '', geoRadius: loc.geoRadius ?? 50,
            })) };
        case 'commercial':
            return {
                selectedModuleIds: data.selectedModuleIds ?? [],
                customModulePricing: data.customModulePricing ?? {},
                userTier: data.userTier ?? '',
                customUserLimit: data.customUserLimit ?? '',
                customTierPrice: data.customTierPrice ?? '',
                billingType: data.billingType ?? 'monthly',
                trialDays: data.trialDays ?? 0,
            };
        default:
            return { ...data };
    }
}

function buildPayload(section: string, form: Record<string, any>): Record<string, any> {
    switch (section) {
        case 'address':
            return unflattenAddressData(form);
        case 'fiscal':
            return { ...form };
        case 'preferences': {
            const { razorpayEnabled, ...rest } = form;
            return { ...rest, razorpayEnabled: razorpayEnabled ?? false };
        }
        case 'controls':
            return { ...form };
        case 'contacts':
            return (form._items ?? []).map((c: any) => ({
                name: c.name, type: c.type, email: c.email, mobile: c.mobile,
                countryCode: c.countryCode || '+91', designation: c.designation || undefined,
                department: c.department || undefined, linkedin: c.linkedin || undefined,
            }));
        case 'shifts':
            return {
                dayStartTime: form.dayStartTime || undefined,
                dayEndTime: form.dayEndTime || undefined,
                weeklyOffs: form.weeklyOffs ?? [],
                items: (form._items ?? []).map((s: any) => ({
                    name: s.name, fromTime: s.fromTime, toTime: s.toTime,
                    noShuffle: s.noShuffle ?? false,
                })),
            };
        case 'noSeries':
            return (form._items ?? []).map((ns: any) => ({
                code: ns.code, linkedScreen: ns.linkedScreen, prefix: ns.prefix,
                suffix: ns.suffix || undefined, numberCount: Number(ns.numberCount) || 5,
                startNumber: Number(ns.startNumber) || 1, description: ns.description || undefined,
            }));
        case 'iotReasons':
            return (form._items ?? []).map((r: any) => ({
                reasonType: r.reasonType, reason: r.reason,
                description: r.description || undefined, department: r.department || undefined,
                planned: r.planned ?? false, duration: r.duration || undefined,
            }));
        case 'users':
            return (form._newUsers ?? []).map((u: any) => ({
                fullName: u.fullName, username: u.username, email: u.email,
                password: u.password, role: u.role || 'COMPANY_ADMIN',
                mobile: u.mobile || undefined, department: u.department || undefined,
            }));
        case 'locations':
            return (form._items ?? []).map((loc: any) => ({
                name: loc.name, code: loc.code, facilityType: loc.facilityType,
                status: loc.status || 'Active', isHQ: loc.isHQ ?? false,
                addressLine1: loc.addressLine1 || undefined, addressLine2: loc.addressLine2 || undefined,
                city: loc.city || undefined, district: loc.district || undefined,
                state: loc.state || undefined, pin: loc.pin || undefined,
                country: loc.country || undefined, stdCode: loc.stdCode || undefined,
                gstin: loc.gstin || undefined, contactName: loc.contactName || undefined,
                contactDesignation: loc.contactDesignation || undefined,
                contactEmail: loc.contactEmail || undefined, contactPhone: loc.contactPhone || undefined,
                geoEnabled: loc.geoEnabled ?? false, geoLocationName: loc.geoLocationName || undefined,
                geoLat: loc.geoLat || undefined, geoLng: loc.geoLng || undefined,
                geoRadius: loc.geoRadius ? Number(loc.geoRadius) : undefined,
            }));
        case 'commercial':
            return {
                selectedModuleIds: form.selectedModuleIds ?? [],
                customModulePricing: form.customModulePricing || undefined,
                userTier: form.userTier || undefined,
                customUserLimit: form.userTier === 'custom' ? form.customUserLimit || undefined : undefined,
                customTierPrice: form.userTier === 'custom' ? form.customTierPrice || undefined : undefined,
                billingType: form.billingType || 'monthly',
                trialDays: Number(form.trialDays) || 0,
            };
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
            case 'contacts':
                return <ContactsForm form={form} setField={setField} />;
            case 'shifts':
                return <ShiftsForm form={form} setField={setField} />;
            case 'noSeries':
                return <NoSeriesForm form={form} setField={setField} />;
            case 'iotReasons':
                return <IotReasonsForm form={form} setField={setField} />;
            case 'users':
                return <UsersForm form={form} setField={setField} />;
            case 'locations':
                return <LocationsForm form={form} setField={setField} />;
            case 'commercial':
                return <CommercialForm form={form} setField={setField} />;
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
