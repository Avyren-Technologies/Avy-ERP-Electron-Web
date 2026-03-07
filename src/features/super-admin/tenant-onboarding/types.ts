// ============================================================
// Tenant Onboarding — Shared Types
// Web + Electron (Vite + React + Tailwind)
// ============================================================

// ---- Entity Types ----

export interface PlantBranch {
    id: string;
    name: string;
    code: string;
    facilityType: string;
    customFacilityType: string;
    status: string;
    isHQ: boolean;
    // GST
    gstin: string;
    stateGST: string;
    // Address
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    pin: string;
    country: string;
    // Contact Person
    contactName: string;
    contactDesignation: string;
    contactEmail: string;
    contactCountryCode: string;
    contactPhone: string;
    // Geo-fencing
    geoEnabled: boolean;
    geoLocationName: string;
    geoLat: string;
    geoLng: string;
    geoRadius: number;
    geoShape: 'circle' | 'freeform';
}

export interface Contact {
    id: string;
    name: string;
    designation: string;
    department: string;
    countryCode: string;
    mobile: string;
    email: string;
    type: string;
    linkedin: string;
}

export interface DowntimeSlot {
    id: string;
    type: string;
    duration: string;
}

export interface Shift {
    id: string;
    name: string;
    fromTime: string;
    toTime: string;
    noShuffle: boolean;
    downtimeSlots: DowntimeSlot[];
}

export interface NoSeriesItem {
    id: string;
    code: string;
    description: string;
    linkedScreen: string;
    prefix: string;
    suffix: string;
    numberCount: string;
    startNumber: string;
}

export interface IOTReason {
    id: string;
    reasonType: string;
    reason: string;
    description: string;
    department: string;
    planned: boolean;
    duration: string;
}

export interface UserItem {
    id: string;
    fullName: string;
    username: string;
    password: string;
    role: string;
    email: string;
    mobile: string;
    department: string;
}

export interface ModuleItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
    price: number; // per month INR
    requiredBy?: string[]; // module IDs that auto-add this
    dependencies?: string[]; // module IDs this requires
}

// ---- Step Form Types ----

export interface Step1Form {
    logoFile: File | null;
    logoPreviewUrl: string;
    displayName: string;
    legalName: string;
    businessType: string;
    industry: string;
    companyCode: string;
    shortName: string;
    incorporationDate: string;
    employees: string;
    cin: string;
    website: string;
    emailDomain: string;
    status: string;
}

export interface Step2Form {
    pan: string;
    tan: string;
    gstin: string;
    pfRegNo: string;
    esiCode: string;
    ptReg: string;
    lwfrNo: string;
    rocState: string;
}

export interface Step3Form {
    regLine1: string;
    regLine2: string;
    regCity: string;
    regDistrict: string;
    regState: string;
    regCountry: string;
    regPin: string;
    regStdCode: string;
    sameAsRegistered: boolean;
    corpLine1: string;
    corpLine2: string;
    corpCity: string;
    corpState: string;
    corpPin: string;
}

export interface Step4Form {
    fyType: string;
    fyCustomStartMonth: string;
    fyCustomEndMonth: string;
    payrollFreq: string;
    cutoffDay: string;
    disbursementDay: string;
    weekStart: string;
    timezone: string;
    workingDays: string[];
}

export interface Step5Form {
    currency: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
    timeFormat: string;
    indiaCompliance: boolean;
    multiCurrency: boolean;
    ess: boolean;
    mobileApp: boolean;
    aiChatbot: boolean;
    eSign: boolean;
    biometric: boolean;
    bankIntegration: boolean;
    razorpayEnabled: boolean;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpayWebhookSecret: string;
    razorpayAccountNumber: string;
    razorpayAutoDisbursement: boolean;
    razorpayTestMode: boolean;
    emailNotif: boolean;
    whatsapp: boolean;
}

// Step 6: Backend Endpoint (WEB EXCLUSIVE — missing from mobile)
export interface Step6Form {
    endpointType: 'default' | 'custom';
    customBaseUrl: string;
    customRegion: string;
    customNote: string;
    // API keys for connecting this tenant to the backend
    apiKey: string;
    webhookSecret: string;
}

// Step 7: Module Selection (WEB EXCLUSIVE — missing from mobile)
export interface Step7ModulesForm {
    selectedModuleIds: string[];
    customModulePricing: Record<string, number>; // moduleId -> custom price (super-admin override)
}

// Step 8: User Tier & Pricing (WEB EXCLUSIVE — missing from mobile)
export interface Step8TierForm {
    userTier: 'starter' | 'growth' | 'scale' | 'enterprise' | 'custom';
    customUserLimit: string;
    billingCycle: 'monthly' | 'annual';
    customTierPrice: string; // monthly base override
    trialDays: string;
}

export interface Step9ContactsForm {
    contacts: Contact[];
}

export interface Step10PlantsForm {
    multiLocationMode: boolean;
    locationConfig: 'common' | 'per-location';
    locations: PlantBranch[];
}

export interface Step11ShiftsForm {
    dayStartTime: string;
    dayEndTime: string;
    weeklyOffs: string[];
    shifts: Shift[];
}

export interface Step12NoSeriesForm {
    noSeries: NoSeriesItem[];
}

export interface Step13IOTForm {
    reasons: IOTReason[];
}

export interface Step14ControlsForm {
    ncEditMode: boolean;
    loadUnload: boolean;
    cycleTime: boolean;
    payrollLock: boolean;
    leaveCarryForward: boolean;
    overtimeApproval: boolean;
    mfa: boolean;
    backdatedEntry: boolean;
    docNumberLock: boolean;
}

export interface Step15UsersForm {
    users: UserItem[];
}

// ---- Master Form (full wizard state) ----

export interface TenantOnboardingState {
    currentStep: number;
    step1: Step1Form;
    step2: Step2Form;
    step3: Step3Form;
    step4: Step4Form;
    step5: Step5Form;
    step6: Step6Form;
    step7: Step7ModulesForm;
    step8: Step8TierForm;
    step9: Step9ContactsForm;
    step10: Step10PlantsForm;
    step11: Step11ShiftsForm;
    step12: Step12NoSeriesForm;
    step13: Step13IOTForm;
    step14: Step14ControlsForm;
    step15: Step15UsersForm;
    isDirty: boolean;
    isSubmitting: boolean;
}
