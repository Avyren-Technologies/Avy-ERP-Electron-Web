// ============================================================
// Tenant Onboarding — Zustand State Store
// Web + Electron
// ============================================================
import { create } from 'zustand';
import type {
    TenantOnboardingState,
    Step1Form,
    Step2Form,
    Step3Form,
    Step4Form,
    Step5Form,
    Step6Form,
    Step7ModulesForm,
    Step8TierForm,
    Contact,
    PlantBranch,
    Step10PlantsForm,
    Step11ShiftsForm,
    Step14ControlsForm,
    NoSeriesItem,
    IOTReason,
    UserItem,
    Shift,
    StrategyConfig,
    LocationCommercialEntry,
} from './types';

// Default initial values
const defaultStep1: Step1Form = {
    logoFile: null,
    logoPreviewUrl: '',
    displayName: '', legalName: '', businessType: '', industry: '',
    companyCode: '', shortName: '', incorporationDate: '', employees: '',
    cin: '', website: '', emailDomain: '', status: 'Draft',
};

const defaultStep2: Step2Form = {
    pan: '', tan: '', gstin: '', pfRegNo: '', esiCode: '', ptReg: '', lwfrNo: '', rocState: '',
};

const defaultStep3: Step3Form = {
    regLine1: '', regLine2: '', regCity: '', regDistrict: '', regState: '',
    regCountry: 'India', regPin: '', regStdCode: '',
    sameAsRegistered: true,
    corpLine1: '', corpLine2: '', corpCity: '', corpDistrict: '', corpState: '', corpCountry: 'India', corpPin: '', corpStdCode: '',
};

const defaultStep4: Step4Form = {
    fyType: 'apr-mar', fyCustomStartMonth: '', fyCustomEndMonth: '',
    payrollFreq: 'Monthly', cutoffDay: 'Last Working Day',
    disbursementDay: '1st', weekStart: 'Monday',
    timezone: 'IST UTC+5:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

const defaultStep5: Step5Form = {
    currency: 'INR — ₹', language: 'English', dateFormat: 'DD/MM/YYYY',
    numberFormat: 'Indian (2,00,000)', timeFormat: '12-hour (AM/PM)',
    indiaCompliance: true, multiCurrency: false, ess: true, mobileApp: true, webApp: true,
    systemApp: false,
    aiChatbot: false, eSign: false, biometric: false,
    bankIntegration: false,
    razorpayEnabled: false, razorpayKeyId: '', razorpayKeySecret: '',
    razorpayWebhookSecret: '', razorpayAccountNumber: '',
    razorpayAutoDisbursement: false, razorpayTestMode: true,
    emailNotif: false, whatsapp: false,
};

const defaultStep6: Step6Form = {
    endpointType: 'default',
    customBaseUrl: '',
};

const defaultStep7: Step7ModulesForm = {
    selectedModuleIds: [],
    customModulePricing: {},
};

const defaultStep8: Step8TierForm = {
    userTier: 'starter',
    customUserLimit: '',
    billingType: 'monthly',
    customTierPrice: '',
    trialDays: '14',
};

const defaultContact: Contact = {
    id: '1', name: '', designation: '', department: '',
    countryCode: '+91', mobile: '', email: '', type: 'Primary', linkedin: '',
};

const defaultStep10: Step10PlantsForm = {
    multiLocationMode: false,
    locationConfig: 'common',
    locations: [],
};

const defaultStep11: Step11ShiftsForm = {
    dayStartTime: '', dayEndTime: '', weeklyOffs: ['Sunday'], shifts: [],
};

const defaultStep14: Step14ControlsForm = {
    ncEditMode: false, loadUnload: false, cycleTime: false,
    payrollLock: true, leaveCarryForward: true, overtimeApproval: false,
    mfa: false,
};

const defaultUser: UserItem = {
    id: '1', fullName: '', username: '', password: '',
    role: 'Company Admin', email: '', mobile: '', department: '',
};

const defaultStrategyConfig: StrategyConfig = {
    multiLocationMode: false,
    locationConfig: 'common',
    billingScope: 'per-location',
};

const defaultLocationCommercialEntry = (): LocationCommercialEntry => ({
    moduleIds: [],
    customModulePricing: {},
    userTier: 'starter',
    customUserLimit: '',
    customTierPrice: '',
    billingType: 'monthly',
    trialDays: '14',
});

// ============ Store Interface ============

interface TenantOnboardingStore extends TenantOnboardingState {
    // Navigation
    goToStep: (step: number) => void;
    goNext: () => void;
    goPrev: () => void;

    // Step setters (partial merge)
    setStep1: (u: Partial<Step1Form>) => void;
    setStep2: (u: Partial<Step2Form>) => void;
    setStep3: (u: Partial<Step3Form>) => void;
    setStep4: (u: Partial<Step4Form>) => void;
    setStep5: (u: Partial<Step5Form>) => void;
    setStep6: (u: Partial<Step6Form>) => void;
    setStep7: (u: Partial<Step7ModulesForm>) => void;
    setStep8: (u: Partial<Step8TierForm>) => void;
    setStep9: (u: { contacts: Contact[] }) => void;
    setContacts: (contacts: Contact[]) => void;
    setStep10: (u: Partial<Step10PlantsForm>) => void;
    setStep11: (u: Partial<Step11ShiftsForm>) => void;
    setStep12: (u: { noSeries: NoSeriesItem[] }) => void;
    setNoSeries: (list: NoSeriesItem[]) => void;
    setStep13: (u: { reasons: IOTReason[] }) => void;
    setIOTReasons: (list: IOTReason[]) => void;
    setStep14: (u: Partial<Step14ControlsForm>) => void;
    setStep15: (u: { users: UserItem[] }) => void;
    setUsers: (users: UserItem[]) => void;
    setStrategyConfig: (u: Partial<StrategyConfig>) => void;
    setLocationCommercial: (locationId: string, u: Partial<LocationCommercialEntry>) => void;
    initLocationCommercial: (locationId: string) => void;
    removeLocationCommercial: (locationId: string) => void;

    // Helpers
    toggleWorkingDay: (day: string) => void;
    toggleModule: (id: string) => void;
    setModuleCustomPrice: (id: string, price: number) => void;
    addLocation: () => void;
    updateLocation: (id: string, u: Partial<PlantBranch>) => void;
    removeLocation: (id: string) => void;
    setHQLoc: (id: string) => void;
    addShift: () => void;
    updateShift: (id: string, u: Partial<Shift>) => void;
    removeShift: (id: string) => void;
    addContact: () => void;
    removeContact: (id: string) => void;
    updateContact: (id: string, u: Partial<Contact>) => void;
    addUser: () => void;
    removeUser: (id: string) => void;
    updateUser: (id: string, u: Partial<UserItem>) => void;
    addNoSeriesItem: () => void;
    updateNoSeriesItem: (id: string, u: Partial<NoSeriesItem>) => void;
    removeNoSeriesItem: (id: string) => void;
    addIOTReason: () => void;
    updateIOTReason: (id: string, u: Partial<IOTReason>) => void;
    removeIOTReason: (id: string) => void;

    // Lifecycle
    setIsSubmitting: (v: boolean) => void;
    reset: () => void;
}

export const useTenantOnboardingStore = create<TenantOnboardingStore>((set) => ({
    // Initial state
    currentStep: 1,
    strategyConfig: defaultStrategyConfig,
    locationCommercial: {},
    step1: defaultStep1,
    step2: defaultStep2,
    step3: defaultStep3,
    step4: defaultStep4,
    step5: defaultStep5,
    step6: defaultStep6,
    step7: defaultStep7,
    step8: defaultStep8,
    step9: { contacts: [{ ...defaultContact }] },
    step10: defaultStep10,
    step11: defaultStep11,
    step12: { noSeries: [] },
    step13: { reasons: [] },
    step14: defaultStep14,
    step15: { users: [{ ...defaultUser }] },
    isDirty: false,
    isSubmitting: false,

    // Navigation
    goToStep: (step) => set({ currentStep: step }),
    goNext: () => set((s) => ({
        currentStep: Math.min(s.currentStep + 1, 17),
        isDirty: true,
    })),
    goPrev: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

    // Step setters
    setStep1: (u) => set((s) => ({ step1: { ...s.step1, ...u }, isDirty: true })),
    setStep2: (u) => set((s) => ({ step2: { ...s.step2, ...u }, isDirty: true })),
    setStep3: (u) => set((s) => ({ step3: { ...s.step3, ...u }, isDirty: true })),
    setStep4: (u) => set((s) => ({ step4: { ...s.step4, ...u }, isDirty: true })),
    setStep5: (u) => set((s) => ({ step5: { ...s.step5, ...u }, isDirty: true })),
    setStep6: (u) => set((s) => ({ step6: { ...s.step6, ...u }, isDirty: true })),
    setStep7: (u) => set((s) => ({ step7: { ...s.step7, ...u }, isDirty: true })),
    setStep8: (u) => set((s) => ({ step8: { ...s.step8, ...u }, isDirty: true })),
    setStep9: (u) => set((s) => ({ step9: { ...s.step9, ...u }, isDirty: true })),
    setStep10: (u) => set((s) => ({ step10: { ...s.step10, ...u }, isDirty: true })),
    setStep11: (u) => set((s) => ({ step11: { ...s.step11, ...u }, isDirty: true })),
    setStep12: (u) => set((s) => ({ step12: { ...s.step12, ...u }, isDirty: true })),
    setStep13: (u) => set((s) => ({ step13: { ...s.step13, ...u }, isDirty: true })),
    setStep14: (u) => set((s) => ({ step14: { ...s.step14, ...u }, isDirty: true })),
    setStep15: (u) => set((s) => ({ step15: { ...s.step15, ...u }, isDirty: true })),
    setContacts: (contacts) => set((s) => ({ step9: { ...s.step9, contacts }, isDirty: true })),
    setNoSeries: (list) => set(() => ({ step12: { noSeries: list }, isDirty: true })),
    setIOTReasons: (list) => set(() => ({ step13: { reasons: list }, isDirty: true })),
    setUsers: (users) => set(() => ({ step15: { users }, isDirty: true })),

    // Helpers
    toggleWorkingDay: (day) => set((s) => {
        const days = s.step4.workingDays;
        const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
        return { step4: { ...s.step4, workingDays: next }, isDirty: true };
    }),

    toggleModule: (id) => set((s) => {
        const ids = s.step7.selectedModuleIds;
        const next = ids.includes(id) ? ids.filter((m) => m !== id) : [...ids, id];
        return { step7: { ...s.step7, selectedModuleIds: next }, isDirty: true };
    }),

    setModuleCustomPrice: (id, price) => set((s) => ({
        step7: {
            ...s.step7,
            customModulePricing: { ...s.step7.customModulePricing, [id]: price },
        },
        isDirty: true,
    })),

    // Location management
    addLocation: () => set((s) => {
        const loc: PlantBranch = {
            id: Date.now().toString(),
            name: '', code: '', facilityType: '', customFacilityType: '',
            status: 'Active', isHQ: s.step10.locations.length === 0,
            gstin: '', stateGST: '',
            addressLine1: '', addressLine2: '', city: '', district: '',
            state: '', pin: '', country: 'India',
            contactName: '', contactDesignation: '', contactEmail: '',
            contactCountryCode: '+91', contactPhone: '',
            geoEnabled: false, geoLocationName: '', geoLat: '', geoLng: '',
            geoRadius: 200, geoShape: 'circle',
        };
        return {
            step10: { ...s.step10, locations: [...s.step10.locations, loc] },
            isDirty: true,
        };
    }),

    updateLocation: (id, u) => set((s) => ({
        step10: {
            ...s.step10,
            locations: s.step10.locations.map((l) => l.id === id ? { ...l, ...u } : l),
        },
        isDirty: true,
    })),

    removeLocation: (id) => set((s) => {
        const filtered = s.step10.locations.filter((l) => l.id !== id);
        if (filtered.length > 0 && !filtered.some((l) => l.isHQ)) filtered[0].isHQ = true;
        return { step10: { ...s.step10, locations: filtered }, isDirty: true };
    }),

    setHQLoc: (id) => set((s) => ({
        step10: {
            ...s.step10,
            locations: s.step10.locations.map((l) => ({ ...l, isHQ: l.id === id })),
        },
        isDirty: true,
    })),

    // Shift management
    addShift: () => set((s) => {
        const shift: Shift = {
            id: Date.now().toString(),
            name: '', fromTime: '', toTime: '', noShuffle: false, downtimeSlots: [],
        };
        return { step11: { ...s.step11, shifts: [...s.step11.shifts, shift] }, isDirty: true };
    }),

    updateShift: (id, u) => set((s) => ({
        step11: {
            ...s.step11,
            shifts: s.step11.shifts.map((sh) => sh.id === id ? { ...sh, ...u } : sh),
        },
        isDirty: true,
    })),

    removeShift: (id) => set((s) => ({
        step11: { ...s.step11, shifts: s.step11.shifts.filter((sh) => sh.id !== id) },
        isDirty: true,
    })),

    // Contact management
    addContact: () => set((s) => {
        const c: Contact = {
            id: Date.now().toString(), name: '', designation: '', department: '',
            countryCode: '+91', mobile: '', email: '', type: 'Primary', linkedin: '',
        };
        return { step9: { contacts: [...s.step9.contacts, c] }, isDirty: true };
    }),

    removeContact: (id) => set((s) => ({
        step9: { contacts: s.step9.contacts.filter((c) => c.id !== id) },
        isDirty: true,
    })),

    updateContact: (id, u) => set((s) => ({
        step9: { contacts: s.step9.contacts.map((c) => c.id === id ? { ...c, ...u } : c) },
        isDirty: true,
    })),

    // User management
    addUser: () => set((s) => {
        const u: UserItem = {
            id: Date.now().toString(), fullName: '', username: '', password: '',
            role: 'Company Admin', email: '', mobile: '', department: '',
        };
        return { step15: { users: [...s.step15.users, u] }, isDirty: true };
    }),

    removeUser: (id) => set((s) => ({
        step15: { users: s.step15.users.filter((u) => u.id !== id) },
        isDirty: true,
    })),

    updateUser: (id, u) => set((s) => ({
        step15: { users: s.step15.users.map((usr) => usr.id === id ? { ...usr, ...u } : usr) },
        isDirty: true,
    })),

    // No Series management
    addNoSeriesItem: () => set((s) => {
        const item: NoSeriesItem = {
            id: Date.now().toString(), code: '', description: '', linkedScreen: '',
            prefix: '', suffix: '', numberCount: '6', startNumber: '1',
        };
        return { step12: { noSeries: [...s.step12.noSeries, item] }, isDirty: true };
    }),

    updateNoSeriesItem: (id, u) => set((s) => ({
        step12: {
            noSeries: s.step12.noSeries.map((n) => n.id === id ? { ...n, ...u } : n),
        },
        isDirty: true,
    })),

    removeNoSeriesItem: (id) => set((s) => ({
        step12: { noSeries: s.step12.noSeries.filter((n) => n.id !== id) },
        isDirty: true,
    })),

    // IOT Reason management
    addIOTReason: () => set((s) => {
        const r: IOTReason = {
            id: Date.now().toString(), reasonType: 'Machine Idle', reason: '',
            description: '', department: '', planned: false, duration: '',
        };
        return { step13: { reasons: [...s.step13.reasons, r] }, isDirty: true };
    }),

    updateIOTReason: (id, u) => set((s) => ({
        step13: {
            reasons: s.step13.reasons.map((r) => r.id === id ? { ...r, ...u } : r),
        },
        isDirty: true,
    })),

    removeIOTReason: (id) => set((s) => ({
        step13: { reasons: s.step13.reasons.filter((r) => r.id !== id) },
        isDirty: true,
    })),

    setStrategyConfig: (u) => set((s) => ({ strategyConfig: { ...s.strategyConfig, ...u }, isDirty: true })),

    setLocationCommercial: (locationId, u) => set((s) => ({
        locationCommercial: {
            ...s.locationCommercial,
            [locationId]: { ...(s.locationCommercial[locationId] ?? defaultLocationCommercialEntry()), ...u },
        },
        isDirty: true,
    })),

    initLocationCommercial: (locationId) => set((s) => {
        if (s.locationCommercial[locationId]) return s;
        return {
            locationCommercial: { ...s.locationCommercial, [locationId]: defaultLocationCommercialEntry() },
            isDirty: true,
        };
    }),

    removeLocationCommercial: (locationId) => set((s) => {
        const next = { ...s.locationCommercial };
        delete next[locationId];
        return { locationCommercial: next, isDirty: true };
    }),

    // Lifecycle
    setIsSubmitting: (v) => set({ isSubmitting: v }),
    reset: () => set({
        currentStep: 1,
        strategyConfig: defaultStrategyConfig,
        locationCommercial: {},
        step1: defaultStep1,
        step2: defaultStep2,
        step3: defaultStep3,
        step4: defaultStep4,
        step5: defaultStep5,
        step6: defaultStep6,
        step7: defaultStep7,
        step8: defaultStep8,
        step9: { contacts: [{ ...defaultContact }] },
        step10: defaultStep10,
        step11: defaultStep11,
        step12: { noSeries: [] },
        step13: { reasons: [] },
        step14: defaultStep14,
        step15: { users: [{ ...defaultUser }] },
        isDirty: false,
        isSubmitting: false,
    }),
}));
