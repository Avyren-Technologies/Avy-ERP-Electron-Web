// ============================================================
// Bulk Upload — Excel Template Generation, Parsing & Validation
// ============================================================
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
    BUSINESS_TYPES, INDUSTRIES, COMPANY_STATUSES, INDIAN_STATES,
    CUTOFF_DAYS, DISBURSEMENT_DAYS,
    DAYS_OF_WEEK, FACILITY_TYPES,
    CONTACT_TYPES, NO_SERIES_SCREENS, IOT_REASON_TYPES,
    MODULE_CATALOGUE, USER_TIERS, BILLING_TYPES,
} from '../tenant-onboarding/constants';

// ---- Types ----

export interface BulkUploadError {
    row: number;
    sheet: string;
    field: string;
    message: string;
}

export interface ParsedCompany {
    payload: any;
    errors: BulkUploadError[];
    rowIndex: number;
}

// ---- Reserved slugs (same as Step01) ----
const RESERVED_SLUGS = new Set([
    'admin', 'www', 'api', 'app', 'staging', 'dev', 'test', 'demo',
    'mail', 'ftp', 'cdn', 'static', 'assets', 'docs', 'help',
    'support', 'status', 'blog', 'avy-erp-api', 'pg', 'ssh',
]);

// ---- Allowed timezones (format: ABBR UTC±HH:MM) ----
export const ALLOWED_TIMEZONES = [
    'UTC UTC+0:00',
    'GMT UTC+0:00',
    'WET UTC+0:00',
    'CET UTC+1:00',
    'EET UTC+2:00',
    'MSK UTC+3:00',
    'GST UTC+4:00',
    'PKT UTC+5:00',
    'IST UTC+5:30',
    'BST UTC+6:00',
    'ICT UTC+7:00',
    'CST UTC+8:00',
    'JST UTC+9:00',
    'AEST UTC+10:00',
    'NZST UTC+12:00',
    'EST UTC-5:00',
    'CST UTC-6:00',
    'MST UTC-7:00',
    'PST UTC-8:00',
    'AKST UTC-9:00',
    'HST UTC-10:00',
];

// ---- Column Definitions per Sheet ----

const COMPANY_IDENTITY_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'e.g. Apex Manufacturing' },
    { header: 'Legal Name *', key: 'legalName', required: true, hint: 'Full name as per incorporation docs' },
    { header: 'Slug *', key: 'slug', required: true, hint: 'Subdomain (e.g. apex-manufacturing)' },
    { header: 'Business Type *', key: 'businessType', required: true, hint: BUSINESS_TYPES.join(' | ') },
    { header: 'Industry *', key: 'industry', required: true, hint: INDUSTRIES.join(' | ') },
    { header: 'Company Code *', key: 'companyCode', required: true, hint: 'e.g. APEXMA-486' },
    { header: 'Short Name', key: 'shortName', required: false, hint: 'Abbreviated name' },
    { header: 'Incorporation Date *', key: 'incorporationDate', required: true, hint: 'YYYY-MM-DD' },
    { header: 'Employee Count', key: 'employees', required: false, hint: 'Approx number' },
    { header: 'CIN', key: 'cin', required: false, hint: 'Required for Pvt Ltd / Public Ltd' },
    { header: 'Website', key: 'website', required: false, hint: 'https://company.com' },
    { header: 'Email Domain *', key: 'emailDomain', required: true, hint: 'e.g. company.com' },
    { header: 'Status *', key: 'status', required: true, hint: COMPANY_STATUSES.map(s => s.value).join(' | ') },
];

const STATUTORY_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'PAN *', key: 'pan', required: true, hint: 'e.g. AARCA5678F' },
    { header: 'TAN', key: 'tan', required: false, hint: 'e.g. BLRA98765T' },
    { header: 'GSTIN', key: 'gstin', required: false, hint: 'e.g. 29AARCA5678F1Z3' },
    { header: 'PF Reg No', key: 'pfRegNo', required: false, hint: 'PF Registration Number' },
    { header: 'ESI Code', key: 'esiCode', required: false, hint: 'ESI Employer Code' },
    { header: 'PT Reg No', key: 'ptReg', required: false, hint: 'Professional Tax Reg No' },
    { header: 'LWFR No', key: 'lwfrNo', required: false, hint: 'Labour Welfare Fund Reg' },
    { header: 'ROC State', key: 'rocState', required: false, hint: INDIAN_STATES.slice(0, 5).join(', ') + '...' },
];

const ADDRESS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'Reg Address Line 1 *', key: 'regLine1', required: true, hint: 'Plot no., Street, Building' },
    { header: 'Reg Address Line 2', key: 'regLine2', required: false, hint: 'Area, Landmark' },
    { header: 'Reg City *', key: 'regCity', required: true, hint: 'City / Town' },
    { header: 'Reg District', key: 'regDistrict', required: false, hint: 'District' },
    { header: 'Reg State *', key: 'regState', required: true, hint: INDIAN_STATES.slice(0, 5).join(', ') + '...' },
    { header: 'Reg Country *', key: 'regCountry', required: true, hint: 'Default: India' },
    { header: 'Reg PIN *', key: 'regPin', required: true, hint: '6-digit PIN code' },
    { header: 'Reg STD Code', key: 'regStdCode', required: false, hint: 'Telephone STD code' },
    { header: 'Same as Registered', key: 'sameAsRegistered', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'Corp Address Line 1', key: 'corpLine1', required: false, hint: 'Required if "Same as Registered" = No' },
    { header: 'Corp Address Line 2', key: 'corpLine2', required: false, hint: '' },
    { header: 'Corp City', key: 'corpCity', required: false, hint: '' },
    { header: 'Corp District', key: 'corpDistrict', required: false, hint: '' },
    { header: 'Corp State', key: 'corpState', required: false, hint: '' },
    { header: 'Corp Country', key: 'corpCountry', required: false, hint: '' },
    { header: 'Corp PIN', key: 'corpPin', required: false, hint: '' },
    { header: 'Corp STD Code', key: 'corpStdCode', required: false, hint: '' },
];

const FISCAL_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'FY Type *', key: 'fyType', required: true, hint: 'apr-mar | custom' },
    { header: 'FY Custom Start Month', key: 'fyCustomStartMonth', required: false, hint: '01-12 (if custom)' },
    { header: 'FY Custom End Month', key: 'fyCustomEndMonth', required: false, hint: '01-12 (if custom)' },
    { header: 'Payroll Frequency', key: 'payrollFreq', required: false, hint: 'Monthly (default)' },
    { header: 'Cutoff Day', key: 'cutoffDay', required: false, hint: CUTOFF_DAYS.slice(0, 4).join(', ') + '...' },
    { header: 'Disbursement Day', key: 'disbursementDay', required: false, hint: DISBURSEMENT_DAYS.slice(0, 4).join(', ') + '...' },
    { header: 'Week Start *', key: 'weekStart', required: true, hint: 'Monday | Sunday | ...' },
    { header: 'Timezone', key: 'timezone', required: false, hint: `IST UTC+5:30 (default) | ${ALLOWED_TIMEZONES.filter(t => t !== 'IST UTC+5:30').slice(0, 5).join(' | ')} | ...` },
    { header: 'Working Days *', key: 'workingDays', required: true, hint: 'Mon,Tue,Wed,Thu,Fri (comma-separated)' },
];

const PREFERENCES_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'Currency', key: 'currency', required: false, hint: 'INR — ₹ (default)' },
    { header: 'Language', key: 'language', required: false, hint: 'English (default)' },
    { header: 'Date Format', key: 'dateFormat', required: false, hint: 'DD/MM/YYYY (default)' },
    { header: 'India Compliance', key: 'indiaCompliance', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'Mobile App', key: 'mobileApp', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'Web App', key: 'webApp', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'System App', key: 'systemApp', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Bank Integration', key: 'bankIntegration', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Email Notifications', key: 'emailNotif', required: false, hint: 'Yes / No (default: No)' },
];

const ENDPOINT_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'Endpoint Type', key: 'endpointType', required: false, hint: 'default | custom (default: default)' },
    { header: 'Custom Base URL', key: 'customBaseUrl', required: false, hint: 'Required if endpoint = custom' },
];

const STRATEGY_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Must match Company Identity sheet' },
    { header: 'Multi-Location Mode', key: 'multiLocationMode', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Location Config', key: 'locationConfig', required: false, hint: 'common | per-location (default: common)' },
];

const LOCATIONS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name - must match' },
    { header: 'Location Name *', key: 'name', required: true, hint: 'e.g. Bengaluru HQ' },
    { header: 'Location Code *', key: 'code', required: true, hint: 'e.g. BLR-HQ-001' },
    { header: 'Facility Type *', key: 'facilityType', required: true, hint: FACILITY_TYPES.slice(0, 5).join(' | ') + '...' },
    { header: 'Status', key: 'status', required: false, hint: 'Active | Inactive | Under Construction' },
    { header: 'Is HQ', key: 'isHQ', required: false, hint: 'Yes / No' },
    { header: 'GSTIN', key: 'gstin', required: false, hint: 'Location GSTIN' },
    { header: 'Address Line 1 *', key: 'addressLine1', required: true, hint: 'Street, plot, building' },
    { header: 'Address Line 2', key: 'addressLine2', required: false, hint: '' },
    { header: 'City *', key: 'city', required: true, hint: '' },
    { header: 'District', key: 'district', required: false, hint: '' },
    { header: 'State', key: 'state', required: false, hint: '' },
    { header: 'PIN', key: 'pin', required: false, hint: '' },
    { header: 'Contact Name', key: 'contactName', required: false, hint: '' },
    { header: 'Contact Email', key: 'contactEmail', required: false, hint: '' },
    { header: 'Contact Phone', key: 'contactPhone', required: false, hint: '' },
    { header: 'Geo Enabled', key: 'geoEnabled', required: false, hint: 'Yes / No' },
    { header: 'Geo Lat', key: 'geoLat', required: false, hint: '' },
    { header: 'Geo Lng', key: 'geoLng', required: false, hint: '' },
    { header: 'Geo Radius (m)', key: 'geoRadius', required: false, hint: '50 | 100 | 200 | ...' },
];

const MODULES_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Location Name', key: 'locationName', required: false, hint: 'Leave blank for common config' },
    { header: 'Selected Modules *', key: 'selectedModules', required: true, hint: MODULE_CATALOGUE.map(m => m.id).join(', ') },
    { header: 'User Tier *', key: 'userTier', required: true, hint: USER_TIERS.map(t => t.key).join(' | ') },
    { header: 'Custom User Limit', key: 'customUserLimit', required: false, hint: 'Required if tier = custom' },
    { header: 'Custom Tier Price', key: 'customTierPrice', required: false, hint: 'Monthly base override' },
    { header: 'Billing Type *', key: 'billingType', required: true, hint: BILLING_TYPES.map(b => b.key).join(' | ') },
    { header: 'Trial Days', key: 'trialDays', required: false, hint: 'Default: 14' },
];

const CONTACTS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Contact Name *', key: 'name', required: true, hint: 'Full name' },
    { header: 'Designation', key: 'designation', required: false, hint: 'e.g. HR Manager' },
    { header: 'Department', key: 'department', required: false, hint: 'e.g. Human Resources' },
    { header: 'Type', key: 'type', required: false, hint: CONTACT_TYPES.join(' | ') },
    { header: 'Email', key: 'email', required: false, hint: 'Contact email' },
    { header: 'Country Code', key: 'countryCode', required: false, hint: '+91 (default)' },
    { header: 'Mobile', key: 'mobile', required: false, hint: '' },
    { header: 'LinkedIn', key: 'linkedin', required: false, hint: 'https://linkedin.com/in/...' },
];

const SHIFTS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Day Start Time *', key: 'dayStartTime', required: true, hint: 'HH:MM (e.g. 06:00)' },
    { header: 'Day End Time *', key: 'dayEndTime', required: true, hint: 'HH:MM (e.g. 22:00)' },
    { header: 'Weekly Offs', key: 'weeklyOffs', required: false, hint: 'Sunday,Saturday (comma-separated)' },
    { header: 'Shift Name *', key: 'shiftName', required: true, hint: 'e.g. Morning Shift' },
    { header: 'Shift From *', key: 'shiftFrom', required: true, hint: 'HH:MM' },
    { header: 'Shift To *', key: 'shiftTo', required: true, hint: 'HH:MM' },
    { header: 'No Shuffle', key: 'noShuffle', required: false, hint: 'Yes / No' },
];

const NO_SERIES_COL = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Series Code *', key: 'code', required: true, hint: 'e.g. INV, EMP' },
    { header: 'Linked Screen *', key: 'linkedScreen', required: true, hint: NO_SERIES_SCREENS.map(s => s.value).join(' | ') },
    { header: 'Description', key: 'description', required: false, hint: '' },
    { header: 'Prefix', key: 'prefix', required: false, hint: 'e.g. INV-' },
    { header: 'Suffix', key: 'suffix', required: false, hint: 'e.g. -FY25' },
    { header: 'Number Count', key: 'numberCount', required: false, hint: 'Default: 4' },
    { header: 'Start Number', key: 'startNumber', required: false, hint: 'Default: 1' },
];

const IOT_REASONS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Reason Type *', key: 'reasonType', required: true, hint: IOT_REASON_TYPES.join(' | ') },
    { header: 'Reason *', key: 'reason', required: true, hint: 'Short label' },
    { header: 'Description', key: 'description', required: false, hint: '' },
    { header: 'Department', key: 'department', required: false, hint: 'Production, Maintenance, ...' },
    { header: 'Planned', key: 'planned', required: false, hint: 'Yes / No' },
    { header: 'Duration (min)', key: 'duration', required: false, hint: 'Threshold minutes' },
];

const CONTROLS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'NC Edit Mode', key: 'ncEditMode', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Load/Unload Tracking', key: 'loadUnload', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Cycle Time', key: 'cycleTime', required: false, hint: 'Yes / No (default: No)' },
    { header: 'Payroll Lock', key: 'payrollLock', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'Leave Carry Forward', key: 'leaveCarryForward', required: false, hint: 'Yes / No (default: Yes)' },
    { header: 'Overtime Approval', key: 'overtimeApproval', required: false, hint: 'Yes / No (default: No)' },
    { header: 'MFA', key: 'mfa', required: false, hint: 'Yes / No (default: No)' },
];

const USERS_COLS = [
    { header: 'Display Name *', key: 'displayName', required: true, hint: 'Company name' },
    { header: 'Full Name *', key: 'fullName', required: true, hint: '' },
    { header: 'Username *', key: 'username', required: true, hint: 'Lowercase, alphanumeric, dots, underscores' },
    { header: 'Password', key: 'password', required: false, hint: 'Initial password' },
    { header: 'Role *', key: 'role', required: true, hint: 'Company Admin, HR Manager, ...' },
    { header: 'Email *', key: 'email', required: true, hint: 'Valid email' },
    { header: 'Mobile', key: 'mobile', required: false, hint: '' },
    { header: 'Department', key: 'department', required: false, hint: 'IT, HR, Finance, ...' },
];

// ============================================================
// Template Generation
// ============================================================

type ColDef = { header: string; key: string; required: boolean; hint: string };

function addSheetToWorkbook(
    wb: ExcelJS.Workbook,
    cols: ColDef[],
    sheetName: string,
    sampleRows?: Record<string, string>[],
) {
    const ws = wb.addWorksheet(sheetName);

    // Set column widths and add header row
    ws.columns = cols.map(c => ({
        width: Math.max(c.header.length, c.hint.length, 20),
    }));

    // Row 1 — column headers (bold)
    const headerRow = ws.addRow(cols.map(c => c.header));
    headerRow.eachCell(cell => {
        cell.font = { bold: true };
    });

    // Row 2 — hints (plain)
    ws.addRow(cols.map(c => c.hint));

    // Data rows
    if (sampleRows) {
        for (const row of sampleRows) {
            ws.addRow(cols.map(c => row[c.key] ?? ''));
        }
    }
}

export async function downloadTemplate() {
    const wb = new ExcelJS.Workbook();

    // Sample data
    const sampleIdentity = [{
        displayName: 'Apex Manufacturing',
        legalName: 'Apex Manufacturing Pvt. Ltd.',
        slug: 'apex-manufacturing',
        businessType: 'Private Limited (Pvt. Ltd.)',
        industry: 'Manufacturing',
        companyCode: 'APEXMA-486',
        shortName: 'APEX',
        incorporationDate: '2020-01-15',
        employees: '120',
        cin: 'U72900KA2020PTC312847',
        website: 'https://apex-mfg.com',
        emailDomain: 'apex-mfg.com',
        status: 'Draft',
    }];

    const sampleStatutory = [{
        displayName: 'Apex Manufacturing',
        pan: 'AARCA5678F',
        tan: 'BLRA98765T',
        gstin: '29AARCA5678F1Z3',
        pfRegNo: 'KA/BLR/0112345/000/0001',
        esiCode: '',
        ptReg: '',
        lwfrNo: '',
        rocState: 'Karnataka',
    }];

    const sampleAddress = [{
        displayName: 'Apex Manufacturing',
        regLine1: '42, Industrial Layout, Phase 2',
        regLine2: 'Peenya',
        regCity: 'Bengaluru',
        regDistrict: 'Bengaluru Urban',
        regState: 'Karnataka',
        regCountry: 'India',
        regPin: '560058',
        regStdCode: '080',
        sameAsRegistered: 'Yes',
        corpLine1: '', corpLine2: '', corpCity: '', corpDistrict: '',
        corpState: '', corpCountry: '', corpPin: '', corpStdCode: '',
    }];

    const sampleFiscal = [{
        displayName: 'Apex Manufacturing',
        fyType: 'apr-mar',
        fyCustomStartMonth: '',
        fyCustomEndMonth: '',
        payrollFreq: 'Monthly',
        cutoffDay: '25',
        disbursementDay: '1',
        weekStart: 'Monday',
        timezone: 'IST UTC+5:30',
        workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    }];

    const samplePrefs = [{
        displayName: 'Apex Manufacturing',
        currency: 'INR — ₹',
        language: 'English',
        dateFormat: 'DD/MM/YYYY',
        indiaCompliance: 'Yes',
        mobileApp: 'Yes',
        webApp: 'Yes',
        systemApp: 'No',
        bankIntegration: 'No',
        emailNotif: 'Yes',
    }];

    const sampleEndpoint = [{ displayName: 'Apex Manufacturing', endpointType: 'default', customBaseUrl: '' }];
    const sampleStrategy = [{ displayName: 'Apex Manufacturing', multiLocationMode: 'No', locationConfig: 'common' }];

    const sampleLocations = [{
        displayName: 'Apex Manufacturing',
        name: 'Bengaluru HQ',
        code: 'BLR-HQ-001',
        facilityType: 'Head Office',
        status: 'Active',
        isHQ: 'Yes',
        gstin: '29AARCA5678F1Z3',
        addressLine1: '42, Industrial Layout, Phase 2',
        addressLine2: 'Peenya',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pin: '560058',
        contactName: 'Rahul Mehta',
        contactEmail: 'rahul@apex-mfg.com',
        contactPhone: '9876543210',
        geoEnabled: 'No',
        geoLat: '',
        geoLng: '',
        geoRadius: '',
    }];

    const sampleModules = [{
        displayName: 'Apex Manufacturing',
        locationName: '',
        selectedModules: 'hr,production,security,masters',
        userTier: 'growth',
        customUserLimit: '',
        customTierPrice: '',
        billingType: 'monthly',
        trialDays: '14',
    }];

    const sampleContacts = [{
        displayName: 'Apex Manufacturing',
        name: 'Priya Sharma',
        designation: 'HR Manager',
        department: 'Human Resources',
        type: 'Primary',
        email: 'priya@apex-mfg.com',
        countryCode: '+91',
        mobile: '9876543210',
        linkedin: '',
    }];

    const sampleShifts = [{
        displayName: 'Apex Manufacturing',
        dayStartTime: '06:00',
        dayEndTime: '22:00',
        weeklyOffs: 'Sunday',
        shiftName: 'Morning Shift',
        shiftFrom: '06:00',
        shiftTo: '14:00',
        noShuffle: 'No',
    }];

    const sampleNoSeries = [{
        displayName: 'Apex Manufacturing',
        code: 'EMP',
        linkedScreen: 'Employee',
        description: 'Employee Onboarding',
        prefix: 'EMP-',
        suffix: '',
        numberCount: '6',
        startNumber: '1',
    }];

    const sampleIOT = [{
        displayName: 'Apex Manufacturing',
        reasonType: 'Machine Idle',
        reason: 'Material Shortage',
        description: 'Raw material not available',
        department: 'Production',
        planned: 'No',
        duration: '15',
    }];

    const sampleControls = [{
        displayName: 'Apex Manufacturing',
        ncEditMode: 'No',
        loadUnload: 'No',
        cycleTime: 'No',
        payrollLock: 'Yes',
        leaveCarryForward: 'Yes',
        overtimeApproval: 'No',
        mfa: 'No',
    }];

    const sampleUsers = [{
        displayName: 'Apex Manufacturing',
        fullName: 'Rahul Mehta',
        username: 'rahul.mehta',
        password: '',
        role: 'Company Admin',
        email: 'rahul@apex-mfg.com',
        mobile: '9876543210',
        department: 'IT',
    }];

    addSheetToWorkbook(wb, COMPANY_IDENTITY_COLS, '1. Company Identity', sampleIdentity);
    addSheetToWorkbook(wb, STATUTORY_COLS, '2. Statutory', sampleStatutory);
    addSheetToWorkbook(wb, ADDRESS_COLS, '3. Address', sampleAddress);
    addSheetToWorkbook(wb, FISCAL_COLS, '4. Fiscal', sampleFiscal);
    addSheetToWorkbook(wb, PREFERENCES_COLS, '5. Preferences', samplePrefs);
    addSheetToWorkbook(wb, ENDPOINT_COLS, '6. Endpoint', sampleEndpoint);
    addSheetToWorkbook(wb, STRATEGY_COLS, '7. Strategy', sampleStrategy);
    addSheetToWorkbook(wb, LOCATIONS_COLS, '8. Locations', sampleLocations);
    addSheetToWorkbook(wb, MODULES_COLS, '9. Modules & Pricing', sampleModules);
    addSheetToWorkbook(wb, CONTACTS_COLS, '10. Contacts', sampleContacts);
    addSheetToWorkbook(wb, SHIFTS_COLS, '11. Shifts', sampleShifts);
    addSheetToWorkbook(wb, NO_SERIES_COL, '12. No Series', sampleNoSeries);
    addSheetToWorkbook(wb, IOT_REASONS_COLS, '13. IOT Reasons', sampleIOT);
    addSheetToWorkbook(wb, CONTROLS_COLS, '14. Controls', sampleControls);
    addSheetToWorkbook(wb, USERS_COLS, '15. Users', sampleUsers);

    // Write to buffer and trigger browser download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Avy_ERP_Company_Bulk_Upload_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================
// Parsing & Validation
// ============================================================

function str(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return '';
    return String(v).trim();
}

function toBool(v: unknown, defaultVal = false): boolean {
    const s = str(v).toLowerCase();
    if (s === 'yes' || s === 'true' || s === '1') return true;
    if (s === 'no' || s === 'false' || s === '0') return false;
    return defaultVal;
}

function readSheetRows(wb: XLSX.WorkBook, sheetName: string): Record<string, string>[] {
    // Find sheet by partial name match (prefix number)
    const matchedName = wb.SheetNames.find(
        n => n.toLowerCase().includes(sheetName.toLowerCase())
    );
    if (!matchedName) return [];
    const ws = wb.Sheets[matchedName];
    if (!ws) return [];

    const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
    if (raw.length < 2) return []; // headers + hints row at minimum

    const headers = raw[0].map(h => str(h));
    // Skip row 1 (hints row), data starts from row 2
    const dataRows = raw.slice(2);

    return dataRows
        .filter(row => Array.isArray(row) && row.some(cell => str(cell) !== ''))
        .map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
                obj[h] = str((row as any[])[i]);
            });
            return obj;
        });
}

function findColValue(row: Record<string, string>, cols: { header: string; key: string }[], key: string): string {
    const col = cols.find(c => c.key === key);
    if (!col) return '';
    return row[col.header] ?? '';
}

function addError(errors: BulkUploadError[], row: number, sheet: string, field: string, message: string) {
    errors.push({ row, sheet, field, message });
}

// ---- Validate a single company ----

function validateSlug(slug: string, rowIdx: number, errors: BulkUploadError[], sheet: string) {
    if (!slug) {
        addError(errors, rowIdx, sheet, 'Slug', 'Slug is required');
    } else if (slug.length < 3) {
        addError(errors, rowIdx, sheet, 'Slug', 'Slug must be at least 3 characters');
    } else if (slug.length > 50) {
        addError(errors, rowIdx, sheet, 'Slug', 'Slug must be at most 50 characters');
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
        addError(errors, rowIdx, sheet, 'Slug', 'Slug: lowercase letters, numbers, hyphens only. Cannot start/end with hyphen.');
    } else if (RESERVED_SLUGS.has(slug)) {
        addError(errors, rowIdx, sheet, 'Slug', `Slug "${slug}" is a reserved subdomain`);
    }
}

function validateIdentity(row: Record<string, string>, rowIdx: number, errors: BulkUploadError[]) {
    const sheet = 'Company Identity';
    const get = (key: string) => findColValue(row, COMPANY_IDENTITY_COLS, key);

    const displayName = get('displayName');
    if (!displayName) addError(errors, rowIdx, sheet, 'Display Name', 'Display Name is required');

    const legalName = get('legalName');
    if (!legalName) addError(errors, rowIdx, sheet, 'Legal Name', 'Legal Name is required');

    const slug = get('slug');
    validateSlug(slug, rowIdx, errors, sheet);

    const businessType = get('businessType');
    if (!businessType) {
        addError(errors, rowIdx, sheet, 'Business Type', 'Business Type is required');
    } else if (!BUSINESS_TYPES.includes(businessType)) {
        addError(errors, rowIdx, sheet, 'Business Type', `Invalid Business Type. Must be one of: ${BUSINESS_TYPES.join(', ')}`);
    }

    const industry = get('industry');
    if (!industry) {
        addError(errors, rowIdx, sheet, 'Industry', 'Industry is required');
    } else if (!INDUSTRIES.includes(industry)) {
        addError(errors, rowIdx, sheet, 'Industry', `Invalid Industry. Must be one of: ${INDUSTRIES.join(', ')}`);
    }

    const companyCode = get('companyCode');
    if (!companyCode) addError(errors, rowIdx, sheet, 'Company Code', 'Company Code is required');

    const incorporationDate = get('incorporationDate');
    if (!incorporationDate) {
        addError(errors, rowIdx, sheet, 'Incorporation Date', 'Incorporation Date is required');
    } else if (Number.isNaN(Date.parse(incorporationDate))) {
        addError(errors, rowIdx, sheet, 'Incorporation Date', 'Invalid date format. Use YYYY-MM-DD');
    }

    const emailDomain = get('emailDomain');
    if (!emailDomain) addError(errors, rowIdx, sheet, 'Email Domain', 'Email Domain is required');

    const status = get('status');
    if (!status) {
        addError(errors, rowIdx, sheet, 'Status', 'Status is required');
    } else if (!COMPANY_STATUSES.map(s => s.value).includes(status)) {
        addError(errors, rowIdx, sheet, 'Status', `Invalid Status. Must be one of: ${COMPANY_STATUSES.map(s => s.value).join(', ')}`);
    }

    const isCorporate = ['Private Limited (Pvt. Ltd.)', 'Public Limited'].includes(businessType);
    const cin = get('cin');
    if (isCorporate && !cin) {
        addError(errors, rowIdx, sheet, 'CIN', 'CIN is required for Private Limited and Public Limited companies');
    }

    const website = get('website');
    if (website && !/^https?:\/\//.test(website)) {
        addError(errors, rowIdx, sheet, 'Website', 'Website URL must start with http:// or https://');
    }

    return { displayName, legalName, slug, businessType, industry, companyCode, incorporationDate, emailDomain, status, cin, isCorporate, website };
}

function validateCorporateStatutory(
    rowIdx: number, get: (key: string) => string,
    sheet: string, errors: BulkUploadError[],
) {
    const pfRegNo = get('pfRegNo');
    if (!pfRegNo) addError(errors, rowIdx, sheet, 'PF Reg No', 'PF Registration No. is required for corporate entities');

    const rocState = get('rocState');
    if (!rocState) {
        addError(errors, rowIdx, sheet, 'ROC State', 'ROC Filing State is required for corporate entities');
    } else if (!INDIAN_STATES.includes(rocState)) {
        addError(errors, rowIdx, sheet, 'ROC State', 'Invalid ROC State. Must be one of the Indian states.');
    }
}

function validateStatutory(row: Record<string, string>, rowIdx: number, isCorporate: boolean, errors: BulkUploadError[]) {
    const sheet = 'Statutory';
    const get = (key: string) => findColValue(row, STATUTORY_COLS, key);

    const pan = get('pan');
    if (!pan) {
        addError(errors, rowIdx, sheet, 'PAN', 'PAN is required');
    } else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.toUpperCase())) {
        addError(errors, rowIdx, sheet, 'PAN', 'Invalid PAN format (e.g. AARCA5678F)');
    }

    const tan = get('tan');
    if (isCorporate && !tan) {
        addError(errors, rowIdx, sheet, 'TAN', 'TAN is required for corporate entities');
    }
    if (tan && !/^[A-Z]{4}\d{5}[A-Z]$/.test(tan.toUpperCase())) {
        addError(errors, rowIdx, sheet, 'TAN', 'Invalid TAN format (e.g. BLRA98765T)');
    }

    const gstin = get('gstin');
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase())) {
        addError(errors, rowIdx, sheet, 'GSTIN', 'Invalid GSTIN format (e.g. 29AARCA5678F1Z3)');
    }

    if (isCorporate) validateCorporateStatutory(rowIdx, get, sheet, errors);

    return {
        pan: pan.toUpperCase(), tan: tan.toUpperCase(), gstin: gstin.toUpperCase(),
        pfRegNo: get('pfRegNo'), esiCode: get('esiCode'), ptReg: get('ptReg'),
        lwfrNo: get('lwfrNo'), rocState: get('rocState'),
    };
}

function validateAddress(row: Record<string, string>, rowIdx: number, errors: BulkUploadError[]) {
    const sheet = 'Address';
    const get = (key: string) => findColValue(row, ADDRESS_COLS, key);

    const regLine1 = get('regLine1');
    if (!regLine1) addError(errors, rowIdx, sheet, 'Reg Address Line 1', 'Registered Address Line 1 is required');

    const regCity = get('regCity');
    if (!regCity) addError(errors, rowIdx, sheet, 'Reg City', 'Registered City is required');

    const regState = get('regState');
    if (!regState) addError(errors, rowIdx, sheet, 'Reg State', 'Registered State is required');

    const regCountry = get('regCountry') || 'India';
    if (!regCountry) addError(errors, rowIdx, sheet, 'Reg Country', 'Registered Country is required');

    const regPin = get('regPin');
    if (!regPin) addError(errors, rowIdx, sheet, 'Reg PIN', 'Registered PIN is required');

    const sameAsRegistered = toBool(get('sameAsRegistered'), true);

    if (!sameAsRegistered) {
        if (!get('corpLine1')) addError(errors, rowIdx, sheet, 'Corp Address Line 1', 'Corporate Address Line 1 is required when not same as registered');
        if (!get('corpCity')) addError(errors, rowIdx, sheet, 'Corp City', 'Corporate City is required when not same as registered');
        if (!get('corpState')) addError(errors, rowIdx, sheet, 'Corp State', 'Corporate State is required when not same as registered');
        if (!get('corpCountry')) addError(errors, rowIdx, sheet, 'Corp Country', 'Corporate Country is required when not same as registered');
        if (!get('corpPin')) addError(errors, rowIdx, sheet, 'Corp PIN', 'Corporate PIN is required when not same as registered');
    }

    return {
        registered: {
            line1: regLine1, line2: get('regLine2'), city: regCity,
            district: get('regDistrict'), state: regState, pin: regPin,
            country: regCountry, stdCode: get('regStdCode'),
        },
        sameAsRegistered,
        corporate: sameAsRegistered ? undefined : {
            line1: get('corpLine1'), line2: get('corpLine2'), city: get('corpCity'),
            district: get('corpDistrict'), state: get('corpState'), pin: get('corpPin'),
            country: get('corpCountry') || 'India', stdCode: get('corpStdCode'),
        },
    };
}

function validateFiscal(row: Record<string, string>, rowIdx: number, errors: BulkUploadError[]) {
    const sheet = 'Fiscal';
    const get = (key: string) => findColValue(row, FISCAL_COLS, key);

    const fyType = get('fyType') || 'apr-mar';
    if (fyType === 'custom') {
        if (!get('fyCustomStartMonth')) addError(errors, rowIdx, sheet, 'FY Custom Start Month', 'Required when FY Type is custom');
        if (!get('fyCustomEndMonth')) addError(errors, rowIdx, sheet, 'FY Custom End Month', 'Required when FY Type is custom');
    }

    const weekStart = get('weekStart') || 'Monday';

    const rawTimezone = get('timezone');
    const timezone = rawTimezone || 'IST UTC+5:30';
    if (rawTimezone && !ALLOWED_TIMEZONES.includes(rawTimezone)) {
        const examples = ALLOWED_TIMEZONES.slice(0, 5).join(', ');
        addError(errors, rowIdx, sheet, 'Timezone', `Invalid timezone "${rawTimezone}". Use format ABBR UTC±HH:MM (e.g. ${examples}, …).`);
    }

    const workingDaysStr = get('workingDays');
    let workingDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (workingDaysStr) {
        workingDays = workingDaysStr.split(',').map(d => d.trim());
        const invalid = workingDays.filter(d => !DAYS_OF_WEEK.includes(d));
        if (invalid.length > 0) {
            addError(errors, rowIdx, sheet, 'Working Days', `Invalid days: ${invalid.join(', ')}. Use full day names.`);
        }
    }

    return {
        fyType, fyCustomStartMonth: get('fyCustomStartMonth'), fyCustomEndMonth: get('fyCustomEndMonth'),
        payrollFreq: get('payrollFreq') || 'Monthly',
        cutoffDay: get('cutoffDay'), disbursementDay: get('disbursementDay'),
        weekStart, timezone, workingDays,
    };
}

function validateUsers(rows: Record<string, string>[], companyName: string, errors: BulkUploadError[]): any[] {
    const sheet = 'Users';
    const companyRows = rows.filter(r => findColValue(r, USERS_COLS, 'displayName') === companyName);

    if (companyRows.length === 0) {
        addError(errors, 0, sheet, 'Users', `No users defined for company "${companyName}". At least one user is required.`);
        return [];
    }

    return companyRows.map((row, idx) => {
        const rowIdx = idx + 3; // header + hints + data rows
        const get = (key: string) => findColValue(row, USERS_COLS, key);

        const fullName = get('fullName');
        if (!fullName) addError(errors, rowIdx, sheet, 'Full Name', 'Full Name is required');

        const username = get('username');
        if (!username) {
            addError(errors, rowIdx, sheet, 'Username', 'Username is required');
        } else if (!/^[a-z0-9._]+$/.test(username)) {
            addError(errors, rowIdx, sheet, 'Username', 'Username: lowercase alphanumeric, dots, and underscores only');
        }

        const role = get('role');
        if (!role) addError(errors, rowIdx, sheet, 'Role', 'Role is required');

        const email = get('email');
        if (!email) {
            addError(errors, rowIdx, sheet, 'Email', 'Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            addError(errors, rowIdx, sheet, 'Email', 'Invalid email format');
        }

        return {
            fullName, username: username.toLowerCase(), password: get('password'),
            role, email, mobile: get('mobile'), department: get('department'),
        };
    });
}

// ============================================================
// Main Parse Function
// ============================================================

export function parseAndValidateBulkUpload(file: ArrayBuffer): ParsedCompany[] {
    const wb = XLSX.read(file, { type: 'array' });

    // Read all sheets
    const identityRows = readSheetRows(wb, 'company identity');
    const statutoryRows = readSheetRows(wb, 'statutory');
    const addressRows = readSheetRows(wb, 'address');
    const fiscalRows = readSheetRows(wb, 'fiscal');
    const prefsRows = readSheetRows(wb, 'preferences');
    const endpointRows = readSheetRows(wb, 'endpoint');
    const strategyRows = readSheetRows(wb, 'strategy');
    const locationRows = readSheetRows(wb, 'locations');
    const modulesRows = readSheetRows(wb, 'modules');
    const contactRows = readSheetRows(wb, 'contacts');
    const shiftRows = readSheetRows(wb, 'shifts');
    const noSeriesRows = readSheetRows(wb, 'no series');
    const iotRows = readSheetRows(wb, 'iot');
    const controlsRows = readSheetRows(wb, 'controls');
    const usersRows = readSheetRows(wb, 'users');

    if (identityRows.length === 0) {
        return [{
            payload: null,
            errors: [{ row: 0, sheet: 'Company Identity', field: '', message: 'No company data found in the Company Identity sheet. Please fill in at least one company row.' }],
            rowIndex: 0,
        }];
    }

    const results: ParsedCompany[] = [];

    for (let i = 0; i < identityRows.length; i++) {
        const errors: BulkUploadError[] = [];
        const rowIdx = i + 3; // header + hints + 1-based

        // Step 1: Identity
        const identity = validateIdentity(identityRows[i], rowIdx, errors);

        // Step 2: Statutory
        const statRow = statutoryRows.find(r => findColValue(r, STATUTORY_COLS, 'displayName') === identity.displayName) ?? {};
        const statutory = validateStatutory(statRow, rowIdx, identity.isCorporate, errors);

        // Step 3: Address
        const addrRow = addressRows.find(r => findColValue(r, ADDRESS_COLS, 'displayName') === identity.displayName) ?? {};
        const address = validateAddress(addrRow, rowIdx, errors);

        // Step 4: Fiscal
        const fiscalRow = fiscalRows.find(r => findColValue(r, FISCAL_COLS, 'displayName') === identity.displayName) ?? {};
        const fiscal = validateFiscal(fiscalRow, rowIdx, errors);

        // Step 5: Preferences
        const prefRow = prefsRows.find(r => findColValue(r, PREFERENCES_COLS, 'displayName') === identity.displayName) ?? {};
        const getPref = (key: string) => findColValue(prefRow, PREFERENCES_COLS, key);
        const preferences = {
            currency: getPref('currency') || 'INR — ₹',
            language: getPref('language') || 'English',
            dateFormat: getPref('dateFormat') || 'DD/MM/YYYY',
            numberFormat: 'Indian (2,00,000)',
            timeFormat: '12-hour (AM/PM)',
            indiaCompliance: toBool(getPref('indiaCompliance'), true),
            multiCurrency: false, ess: false,
            mobileApp: toBool(getPref('mobileApp'), true),
            webApp: toBool(getPref('webApp'), true),
            systemApp: toBool(getPref('systemApp'), false),
            aiChatbot: false, eSign: false, biometric: false,
            bankIntegration: toBool(getPref('bankIntegration'), false),
            razorpayEnabled: false, razorpayKeyId: undefined, razorpayKeySecret: undefined,
            razorpayWebhookSecret: undefined, razorpayAccountNumber: undefined,
            razorpayAutoDisbursement: false, razorpayTestMode: true,
            emailNotif: toBool(getPref('emailNotif'), false),
            whatsapp: false,
        };

        // Step 6: Endpoint
        const endRow = endpointRows.find(r => findColValue(r, ENDPOINT_COLS, 'displayName') === identity.displayName) ?? {};
        const getEnd = (key: string) => findColValue(endRow, ENDPOINT_COLS, key);
        const endpointType = (getEnd('endpointType') || 'default') as 'default' | 'custom';
        const customBaseUrl = getEnd('customBaseUrl');
        if (endpointType === 'custom' && !customBaseUrl) {
            addError(errors, rowIdx, 'Endpoint', 'Custom Base URL', 'Custom Base URL is required when endpoint type is custom');
        }

        // Step 7: Strategy
        const strategyRow = strategyRows.find(r => findColValue(r, STRATEGY_COLS, 'displayName') === identity.displayName) ?? {};
        const getStrategyValue = (key: string) => findColValue(strategyRow, STRATEGY_COLS, key);
        const multiLocationMode = toBool(getStrategyValue('multiLocationMode'), false);
        const locationConfig = (getStrategyValue('locationConfig') || 'common') as 'common' | 'per-location';

        // Step 8: Locations
        const companyLocations = locationRows.filter(r => findColValue(r, LOCATIONS_COLS, 'displayName') === identity.displayName);
        if (companyLocations.length === 0) {
            addError(errors, rowIdx, 'Locations', 'Locations', `No locations defined for "${identity.displayName}". At least one location is required.`);
        }

        const locations = companyLocations.map((locRow, locIdx) => {
            const locRowIdx = locIdx + 3;
            const getLoc = (key: string) => findColValue(locRow, LOCATIONS_COLS, key);

            const name = getLoc('name');
            if (!name) addError(errors, locRowIdx, 'Locations', 'Location Name', 'Location Name is required');

            const code = getLoc('code');
            if (!code) addError(errors, locRowIdx, 'Locations', 'Location Code', 'Location Code is required');

            const facilityType = getLoc('facilityType');
            if (!facilityType) addError(errors, locRowIdx, 'Locations', 'Facility Type', 'Facility Type is required');

            const addressLine1 = getLoc('addressLine1');
            if (!addressLine1) addError(errors, locRowIdx, 'Locations', 'Address Line 1', 'Location Address Line 1 is required');

            const city = getLoc('city');
            if (!city) addError(errors, locRowIdx, 'Locations', 'City', 'Location City is required');

            const contactEmail = getLoc('contactEmail');
            if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
                addError(errors, locRowIdx, 'Locations', 'Contact Email', 'Invalid email format');
            }

            return {
                name, code: code.toUpperCase(), facilityType,
                status: getLoc('status') || 'Active',
                isHQ: toBool(getLoc('isHQ'), locIdx === 0),
                gstin: getLoc('gstin')?.toUpperCase(),
                addressLine1, addressLine2: getLoc('addressLine2'),
                city, district: getLoc('district'), state: getLoc('state'),
                pin: getLoc('pin'), country: 'India',
                contactName: getLoc('contactName'), contactDesignation: undefined,
                contactEmail, contactCountryCode: '+91', contactPhone: getLoc('contactPhone'),
                geoEnabled: toBool(getLoc('geoEnabled'), false),
                geoLocationName: undefined,
                geoLat: getLoc('geoLat'), geoLng: getLoc('geoLng'),
                geoRadius: Number.parseInt(getLoc('geoRadius')) || 200,
                geoShape: 'circle' as const,
            };
        });

        // Step 9 & 10: Modules & Pricing (commercial)
        const companyModules = modulesRows.filter(r => findColValue(r, MODULES_COLS, 'displayName') === identity.displayName);
        let commercial: any = undefined;

        if (companyModules.length > 0) {
            const modRow = companyModules[0];
            const getMod = (key: string) => findColValue(modRow, MODULES_COLS, key);

            const selectedModules = getMod('selectedModules').split(',').map(s => s.trim()).filter(Boolean);
            if (selectedModules.length === 0) {
                addError(errors, rowIdx, 'Modules & Pricing', 'Selected Modules', 'At least one module must be selected');
            }
            const invalidModules = selectedModules.filter(m => !MODULE_CATALOGUE.some(mc => mc.id === m));
            if (invalidModules.length > 0) {
                addError(errors, rowIdx, 'Modules & Pricing', 'Selected Modules', `Invalid module IDs: ${invalidModules.join(', ')}. Valid: ${MODULE_CATALOGUE.map(m => m.id).join(', ')}`);
            }

            const userTier = getMod('userTier');
            if (!userTier) {
                addError(errors, rowIdx, 'Modules & Pricing', 'User Tier', 'User Tier is required');
            } else if (!USER_TIERS.some(t => t.key === userTier)) {
                addError(errors, rowIdx, 'Modules & Pricing', 'User Tier', `Invalid User Tier. Must be one of: ${USER_TIERS.map(t => t.key).join(', ')}`);
            }

            if (userTier === 'custom') {
                if (!getMod('customUserLimit')) addError(errors, rowIdx, 'Modules & Pricing', 'Custom User Limit', 'Required when tier is custom');
                if (!getMod('customTierPrice')) addError(errors, rowIdx, 'Modules & Pricing', 'Custom Tier Price', 'Required when tier is custom');
            }

            const billingType = getMod('billingType');
            if (!billingType) {
                addError(errors, rowIdx, 'Modules & Pricing', 'Billing Type', 'Billing Type is required');
            } else if (!BILLING_TYPES.some(b => b.key === billingType)) {
                addError(errors, rowIdx, 'Modules & Pricing', 'Billing Type', `Invalid Billing Type. Must be one of: ${BILLING_TYPES.map(b => b.key).join(', ')}`);
            }

            commercial = {
                selectedModuleIds: selectedModules,
                customModulePricing: {},
                userTier: userTier || 'starter',
                customUserLimit: getMod('customUserLimit') || undefined,
                customTierPrice: getMod('customTierPrice') || undefined,
                billingType: billingType || 'monthly',
                trialDays: Number.parseInt(getMod('trialDays')) || 14,
            };
        } else {
            addError(errors, rowIdx, 'Modules & Pricing', 'Modules', `No modules/pricing defined for "${identity.displayName}".`);
        }

        // Step 11: Contacts
        const companyContacts = contactRows.filter(r => findColValue(r, CONTACTS_COLS, 'displayName') === identity.displayName);
        if (companyContacts.length === 0) {
            addError(errors, rowIdx, 'Contacts', 'Contacts', `No contacts defined for "${identity.displayName}". At least one contact is required.`);
        }

        const contacts = companyContacts.map((cRow, cIdx) => {
            const cRowIdx = cIdx + 3;
            const getC = (key: string) => findColValue(cRow, CONTACTS_COLS, key);

            const name = getC('name');
            if (!name) addError(errors, cRowIdx, 'Contacts', 'Contact Name', 'Contact Name is required');

            const email = getC('email');
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                addError(errors, cRowIdx, 'Contacts', 'Email', 'Invalid email format');
            }

            const linkedin = getC('linkedin');
            if (linkedin && !/^https?:\/\//.test(linkedin)) {
                addError(errors, cRowIdx, 'Contacts', 'LinkedIn', 'LinkedIn URL must start with http:// or https://');
            }

            return {
                name, designation: getC('designation'), department: getC('department'),
                type: getC('type') || 'Primary', email, countryCode: getC('countryCode') || '+91',
                mobile: getC('mobile'), linkedin: linkedin || undefined,
            };
        });

        // Step 12: Shifts
        const companyShifts = shiftRows.filter(r => findColValue(r, SHIFTS_COLS, 'displayName') === identity.displayName);
        let shifts: any = { dayStartTime: undefined, dayEndTime: undefined, weeklyOffs: ['Sunday'], items: [] };

        if (companyShifts.length > 0) {
            const firstRow = companyShifts[0];
            const getS = (key: string) => findColValue(firstRow, SHIFTS_COLS, key);

            const dayStartTime = getS('dayStartTime');
            const dayEndTime = getS('dayEndTime');
            if (!dayStartTime) addError(errors, rowIdx, 'Shifts', 'Day Start Time', 'Day Start Time is required');
            if (!dayEndTime) addError(errors, rowIdx, 'Shifts', 'Day End Time', 'Day End Time is required');

            const weeklyOffsStr = getS('weeklyOffs');
            const weeklyOffs = weeklyOffsStr ? weeklyOffsStr.split(',').map(d => d.trim()) : ['Sunday'];

            shifts = {
                dayStartTime, dayEndTime, weeklyOffs,
                items: companyShifts.map((sRow, sIdx) => {
                    const sRowIdx = sIdx + 3;
                    const getSh = (key: string) => findColValue(sRow, SHIFTS_COLS, key);

                    const shiftName = getSh('shiftName');
                    if (!shiftName) addError(errors, sRowIdx, 'Shifts', 'Shift Name', 'Shift Name is required');

                    const shiftFrom = getSh('shiftFrom');
                    if (!shiftFrom) addError(errors, sRowIdx, 'Shifts', 'Shift From', 'Shift From time is required');

                    const shiftTo = getSh('shiftTo');
                    if (!shiftTo) addError(errors, sRowIdx, 'Shifts', 'Shift To', 'Shift To time is required');

                    return {
                        name: shiftName, fromTime: shiftFrom, toTime: shiftTo,
                        noShuffle: toBool(getSh('noShuffle'), false),
                        downtimeSlots: [],
                    };
                }),
            };
        }

        // Step 13: No Series
        const companyNoSeries = noSeriesRows.filter(r => findColValue(r, NO_SERIES_COL, 'displayName') === identity.displayName);
        const noSeries = companyNoSeries.map((nsRow, nsIdx) => {
            const nsRowIdx = nsIdx + 3;
            const getNs = (key: string) => findColValue(nsRow, NO_SERIES_COL, key);

            const code = getNs('code');
            if (!code) addError(errors, nsRowIdx, 'No Series', 'Series Code', 'Series Code is required');

            const linkedScreen = getNs('linkedScreen');
            if (!linkedScreen) {
                addError(errors, nsRowIdx, 'No Series', 'Linked Screen', 'Linked Screen is required');
            } else if (!NO_SERIES_SCREENS.some(s => s.value === linkedScreen)) {
                addError(errors, nsRowIdx, 'No Series', 'Linked Screen', `Invalid Linked Screen. Must be one of: ${NO_SERIES_SCREENS.map(s => s.value).join(', ')}`);
            }

            return {
                code: code.toUpperCase(), linkedScreen,
                description: getNs('description'),
                prefix: getNs('prefix'), suffix: getNs('suffix'),
                numberCount: Number.parseInt(getNs('numberCount')) || 4,
                startNumber: Number.parseInt(getNs('startNumber')) || 1,
            };
        });

        // Step 14: IOT Reasons
        const companyIOT = iotRows.filter(r => findColValue(r, IOT_REASONS_COLS, 'displayName') === identity.displayName);
        const iotReasons = companyIOT.map((iotRow, iotIdx) => {
            const iotRowIdx = iotIdx + 3;
            const getIOT = (key: string) => findColValue(iotRow, IOT_REASONS_COLS, key);

            const reasonType = getIOT('reasonType');
            if (!reasonType) {
                addError(errors, iotRowIdx, 'IOT Reasons', 'Reason Type', 'Reason Type is required');
            } else if (!IOT_REASON_TYPES.includes(reasonType)) {
                addError(errors, iotRowIdx, 'IOT Reasons', 'Reason Type', `Invalid Reason Type. Must be: ${IOT_REASON_TYPES.join(' or ')}`);
            }

            const reason = getIOT('reason');
            if (!reason) addError(errors, iotRowIdx, 'IOT Reasons', 'Reason', 'Reason is required');

            return {
                reasonType, reason, description: getIOT('description'),
                department: getIOT('department'), planned: toBool(getIOT('planned'), false),
                duration: getIOT('duration'),
            };
        });

        // Step 15: Controls
        const ctrlRow = controlsRows.find(r => findColValue(r, CONTROLS_COLS, 'displayName') === identity.displayName) ?? {};
        const getCtrl = (key: string) => findColValue(ctrlRow, CONTROLS_COLS, key);
        const controls = {
            ncEditMode: toBool(getCtrl('ncEditMode'), false),
            loadUnload: toBool(getCtrl('loadUnload'), false),
            cycleTime: toBool(getCtrl('cycleTime'), false),
            payrollLock: toBool(getCtrl('payrollLock'), true),
            leaveCarryForward: toBool(getCtrl('leaveCarryForward'), true),
            overtimeApproval: toBool(getCtrl('overtimeApproval'), false),
            mfa: toBool(getCtrl('mfa'), false),
        };

        // Step 16: Users
        const users = validateUsers(usersRows, identity.displayName, errors);

        // Build the final payload (same structure as TenantOnboardingWizard handleConfirm)
        const payload = {
            identity: {
                displayName: identity.displayName,
                slug: identity.slug,
                legalName: identity.legalName,
                businessType: identity.businessType,
                industry: identity.industry,
                companyCode: identity.companyCode,
                shortName: findColValue(identityRows[i], COMPANY_IDENTITY_COLS, 'shortName') || undefined,
                incorporationDate: identity.incorporationDate || undefined,
                employeeCount: findColValue(identityRows[i], COMPANY_IDENTITY_COLS, 'employees') || undefined,
                cin: identity.cin || undefined,
                website: identity.website || undefined,
                emailDomain: identity.emailDomain,
                wizardStatus: identity.status || 'Draft',
            },
            statutory,
            address,
            fiscal,
            preferences,
            endpoint: { endpointType, customBaseUrl: customBaseUrl || undefined },
            strategy: { multiLocationMode, locationConfig },
            locations: locations.map(loc => ({
                ...loc,
                moduleIds: commercial?.selectedModuleIds,
                userTier: commercial?.userTier,
                customUserLimit: commercial?.customUserLimit,
                customTierPrice: commercial?.customTierPrice,
                billingType: commercial?.billingType,
                trialDays: commercial?.trialDays,
            })),
            commercial,
            contacts,
            shifts,
            noSeries,
            iotReasons,
            controls,
            users,
        };

        results.push({ payload, errors, rowIndex: i });
    }

    return results;
}
