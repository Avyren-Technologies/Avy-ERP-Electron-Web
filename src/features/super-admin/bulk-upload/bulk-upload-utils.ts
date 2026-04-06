// ============================================================
// Bulk Upload — Types (logic moved to backend)
// ============================================================

export interface BulkCompanyError {
    sheet: string;
    field: string;
    message: string;
}

export interface ValidatedCompany {
    name: string;
    rowIndex: number;
    valid: boolean;
    payload?: any;
    errors?: BulkCompanyError[];
}

export interface BulkValidationResult {
    totalCompanies: number;
    validCount: number;
    errorCount: number;
    companies: ValidatedCompany[];
}

export interface BulkImportResultItem {
    name: string;
    success: boolean;
    companyId?: string;
    error?: string;
}

export interface BulkImportResult {
    total: number;
    successCount: number;
    failureCount: number;
    results: BulkImportResultItem[];
}
