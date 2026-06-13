/**
 * Reference Professional Tax (PT) slab presets for common Indian states.
 *
 * IMPORTANT: These are illustrative examples for FY 2025-26 based on
 * commonly published rates. Verify against current state notifications
 * before applying — actual amounts may change with state budgets.
 */

export type PTGender = 'MALE' | 'FEMALE' | 'ALL';

export interface PTSlabExample {
    fromAmount: number;
    toAmount: number;
    gender: PTGender;
    taxAmount: number;
}

export interface PTStatePreset {
    /** Display label for the dropdown */
    label: string;
    /** State name as stored in PT config (matches INDIAN_STATES list) */
    state: string;
    /** Brief context shown in the UI */
    note?: string;
    /** Slab rows */
    slabs: PTSlabExample[];
    /** Optional monthly overrides (e.g. Feb top-up) */
    monthlyOverrides?: Record<string, number>;
}

export const PT_SLAB_EXAMPLES: Record<string, PTStatePreset> = {
    KARNATAKA: {
        label: 'Karnataka (FY 2025-26)',
        state: 'Karnataka',
        note: 'No PT below ₹25,000/month. Flat ₹200 above.',
        slabs: [
            { fromAmount: 0, toAmount: 25000, gender: 'ALL', taxAmount: 0 },
            { fromAmount: 25001, toAmount: 999999999, gender: 'ALL', taxAmount: 200 },
        ],
    },
    MAHARASHTRA: {
        label: 'Maharashtra (FY 2025-26)',
        state: 'Maharashtra',
        note: 'Gender-based slabs. Females exempt up to ₹25,000. Feb top-up ₹300 (last month).',
        slabs: [
            { fromAmount: 0, toAmount: 7500, gender: 'MALE', taxAmount: 0 },
            { fromAmount: 7501, toAmount: 10000, gender: 'MALE', taxAmount: 175 },
            { fromAmount: 10001, toAmount: 999999999, gender: 'MALE', taxAmount: 200 },
            { fromAmount: 0, toAmount: 25000, gender: 'FEMALE', taxAmount: 0 },
            { fromAmount: 25001, toAmount: 999999999, gender: 'FEMALE', taxAmount: 200 },
        ],
        monthlyOverrides: { '2': 300 },
    },
    WEST_BENGAL: {
        label: 'West Bengal (FY 2025-26)',
        state: 'West Bengal',
        note: 'Five-slab graduated tax up to ₹200.',
        slabs: [
            { fromAmount: 0, toAmount: 10000, gender: 'ALL', taxAmount: 0 },
            { fromAmount: 10001, toAmount: 15000, gender: 'ALL', taxAmount: 110 },
            { fromAmount: 15001, toAmount: 25000, gender: 'ALL', taxAmount: 130 },
            { fromAmount: 25001, toAmount: 40000, gender: 'ALL', taxAmount: 150 },
            { fromAmount: 40001, toAmount: 999999999, gender: 'ALL', taxAmount: 200 },
        ],
    },
    ANDHRA_PRADESH: {
        label: 'Andhra Pradesh (FY 2025-26)',
        state: 'Andhra Pradesh',
        note: 'Three slabs. No PT below ₹15,000/month.',
        slabs: [
            { fromAmount: 0, toAmount: 15000, gender: 'ALL', taxAmount: 0 },
            { fromAmount: 15001, toAmount: 20000, gender: 'ALL', taxAmount: 150 },
            { fromAmount: 20001, toAmount: 999999999, gender: 'ALL', taxAmount: 200 },
        ],
    },
};

export const PT_GENDER_OPTIONS: { value: PTGender; label: string }[] = [
    { value: 'ALL', label: 'All Genders' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
];
