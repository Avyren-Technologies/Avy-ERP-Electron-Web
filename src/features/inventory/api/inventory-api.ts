import { client } from '@/lib/api/client';

export const inventoryApi = {
    // ── Config ──
    getConfig: () => client.get('/inventory/config').then((r) => r.data),
    updateConfig: (data: any) => client.patch('/inventory/config', data).then((r) => r.data),
    getOnboardingStatus: () => client.get('/inventory/config/onboarding').then((r) => r.data),
    completeOnboardingStep: (step: number) => client.patch(`/inventory/config/onboarding/${step}`).then((r) => r.data),

    // ── Warehouses ──
    listWarehouses: (params?: any) => client.get('/inventory/warehouses', { params }).then((r) => r.data),
    getWarehouse: (id: string) => client.get(`/inventory/warehouses/${id}`).then((r) => r.data),
    createWarehouse: (data: any) => client.post('/inventory/warehouses', data).then((r) => r.data),
    updateWarehouse: (id: string, data: any) => client.patch(`/inventory/warehouses/${id}`, data).then((r) => r.data),
    deleteWarehouse: (id: string) => client.delete(`/inventory/warehouses/${id}`).then((r) => r.data),

    // ── Zones ──
    listZones: (params?: any) => client.get('/inventory/zones', { params }).then((r) => r.data),
    createZone: (data: any) => client.post('/inventory/zones', data).then((r) => r.data),
    updateZone: (id: string, data: any) => client.patch(`/inventory/zones/${id}`, data).then((r) => r.data),
    deleteZone: (id: string) => client.delete(`/inventory/zones/${id}`).then((r) => r.data),

    // ── Bins ──
    listBins: (params?: any) => client.get('/inventory/bins', { params }).then((r) => r.data),
    createBin: (data: any) => client.post('/inventory/bins', data).then((r) => r.data),
    updateBin: (id: string, data: any) => client.patch(`/inventory/bins/${id}`, data).then((r) => r.data),
    deleteBin: (id: string) => client.delete(`/inventory/bins/${id}`).then((r) => r.data),

    // ── Item Stock Policies ──
    listItemPolicies: (params?: any) => client.get('/inventory/item-policies', { params }).then((r) => r.data),
    getItemPolicy: (partId: string) => client.get(`/inventory/item-policies/${partId}`).then((r) => r.data),
    upsertItemPolicy: (data: any) => client.post('/inventory/item-policies', data).then((r) => r.data),

    // ── Reason Codes ──
    listReasonCodes: (params?: any) => client.get('/inventory/reason-codes', { params }).then((r) => r.data),
    createReasonCode: (data: any) => client.post('/inventory/reason-codes', data).then((r) => r.data),
    updateReasonCode: (id: string, data: any) => client.patch(`/inventory/reason-codes/${id}`, data).then((r) => r.data),
    deleteReasonCode: (id: string) => client.delete(`/inventory/reason-codes/${id}`).then((r) => r.data),

    // ── Approval Thresholds ──
    listApprovalThresholds: (params?: any) => client.get('/inventory/approval-thresholds', { params }).then((r) => r.data),
    createApprovalThreshold: (data: any) => client.post('/inventory/approval-thresholds', data).then((r) => r.data),
    updateApprovalThreshold: (id: string, data: any) => client.patch(`/inventory/approval-thresholds/${id}`, data).then((r) => r.data),
    deleteApprovalThreshold: (id: string) => client.delete(`/inventory/approval-thresholds/${id}`).then((r) => r.data),

    // ── Handling Units ──
    listHandlingUnits: (params?: any) => client.get('/inventory/handling-units', { params }).then((r) => r.data),
    createHandlingUnit: (data: any) => client.post('/inventory/handling-units', data).then((r) => r.data),
    updateHandlingUnit: (id: string, data: any) => client.patch(`/inventory/handling-units/${id}`, data).then((r) => r.data),
    deleteHandlingUnit: (id: string) => client.delete(`/inventory/handling-units/${id}`).then((r) => r.data),

    // ── Transactions ──
    createReceiveStock: (data: any) => client.post('/inventory/transactions/receive-stock', data).then((r) => r.data),
    listReceiveStock: (params?: any) => client.get('/inventory/transactions/receive-stock', { params }).then((r) => r.data),
    getReceiveStock: (id: string) => client.get(`/inventory/transactions/receive-stock/${id}`).then((r) => r.data),

    createGrn: (data: any) => client.post('/inventory/transactions/grn', data).then((r) => r.data),
    listGrns: (params?: any) => client.get('/inventory/transactions/grn', { params }).then((r) => r.data),
    getGrn: (id: string) => client.get(`/inventory/transactions/grn/${id}`).then((r) => r.data),

    confirmPutaway: (data: any) => client.post('/inventory/transactions/put-away', data).then((r) => r.data),
    listPendingPutaway: (params?: any) => client.get('/inventory/transactions/put-away/pending', { params }).then((r) => r.data),

    createMoveStock: (data: any) => client.post('/inventory/transactions/move-stock', data).then((r) => r.data),
    confirmMoveReceipt: (id: string) => client.post(`/inventory/transactions/move-stock/${id}/confirm-receipt`).then((r) => r.data),
    listMoveStock: (params?: any) => client.get('/inventory/transactions/move-stock', { params }).then((r) => r.data),

    createReserveStock: (data: any) => client.post('/inventory/transactions/reserve-stock', data).then((r) => r.data),
    releaseReservation: (id: string) => client.post(`/inventory/transactions/reserve-stock/${id}/release`).then((r) => r.data),
    listReservations: (params?: any) => client.get('/inventory/transactions/reserve-stock', { params }).then((r) => r.data),

    createAdjustStock: (data: any) => client.post('/inventory/transactions/adjust-stock', data).then((r) => r.data),
    createOpeningBalance: (data: any) => client.post('/inventory/transactions/adjust-stock/opening-balance', data).then((r) => r.data),
    listAdjustments: (params?: any) => client.get('/inventory/transactions/adjust-stock', { params }).then((r) => r.data),

    createChangeStatus: (data: any) => client.post('/inventory/transactions/change-status', data).then((r) => r.data),
    listStatusChanges: (params?: any) => client.get('/inventory/transactions/change-status', { params }).then((r) => r.data),

    createPickItems: (data: any) => client.post('/inventory/transactions/pick-items', data).then((r) => r.data),
    confirmPick: (id: string, data: any) => client.post(`/inventory/transactions/pick-items/${id}/confirm`, data).then((r) => r.data),
    listPickItems: (params?: any) => client.get('/inventory/transactions/pick-items', { params }).then((r) => r.data),

    createPack: (data: any) => client.post('/inventory/transactions/pack', data).then((r) => r.data),
    listPacks: (params?: any) => client.get('/inventory/transactions/pack', { params }).then((r) => r.data),

    createDispatch: (data: any) => client.post('/inventory/transactions/dispatch', data).then((r) => r.data),
    listDispatches: (params?: any) => client.get('/inventory/transactions/dispatch', { params }).then((r) => r.data),
    getDispatch: (id: string) => client.get(`/inventory/transactions/dispatch/${id}`).then((r) => r.data),

    createCustomerReturn: (data: any) => client.post('/inventory/transactions/customer-return', data).then((r) => r.data),
    inspectReturn: (id: string, data: any) => client.post(`/inventory/transactions/customer-return/${id}/inspect`, data).then((r) => r.data),
    listCustomerReturns: (params?: any) => client.get('/inventory/transactions/customer-return', { params }).then((r) => r.data),

    createVendorReturn: (data: any) => client.post('/inventory/transactions/vendor-return', data).then((r) => r.data),
    listVendorReturns: (params?: any) => client.get('/inventory/transactions/vendor-return', { params }).then((r) => r.data),

    // ── Stock Explorer ──
    getStockOnHand: (params?: any) => client.get('/inventory/stock/on-hand', { params }).then((r) => r.data),
    getNetAvailable: (params?: any) => client.get('/inventory/stock/net-available', { params }).then((r) => r.data),
    getStockByStatus: (params?: any) => client.get('/inventory/stock/by-status', { params }).then((r) => r.data),
    getLotHistory: (lotId: string) => client.get(`/inventory/stock/lot/${lotId}`).then((r) => r.data),
    getSerialHistory: (serialId: string) => client.get(`/inventory/stock/serial/${serialId}`).then((r) => r.data),
    getExpiryReport: (params?: any) => client.get('/inventory/stock/expiry-report', { params }).then((r) => r.data),
    getAgingReport: (params?: any) => client.get('/inventory/stock/aging-report', { params }).then((r) => r.data),
    getMovementHistory: (params?: any) => client.get('/inventory/stock/movement-history', { params }).then((r) => r.data),

    // ── Counts ──
    createCount: (data: any) => client.post('/inventory/counts', data).then((r) => r.data),
    listCounts: (params?: any) => client.get('/inventory/counts', { params }).then((r) => r.data),
    getCount: (id: string) => client.get(`/inventory/counts/${id}`).then((r) => r.data),
    enterCount: (id: string, data: any) => client.patch(`/inventory/counts/${id}/enter`, data).then((r) => r.data),
    submitCount: (id: string) => client.patch(`/inventory/counts/${id}/submit`).then((r) => r.data),
    approveCount: (id: string, data?: any) => client.patch(`/inventory/counts/${id}/approve`, data).then((r) => r.data),

    // ── Approvals ──
    listPendingApprovals: () => client.get('/inventory/approvals/pending').then((r) => r.data),
    approveTransaction: (id: string) => client.patch(`/inventory/approvals/${id}/approve`).then((r) => r.data),
    rejectTransaction: (id: string, data: any) => client.patch(`/inventory/approvals/${id}/reject`, data).then((r) => r.data),
    getApprovalHistory: (params?: any) => client.get('/inventory/approvals/history', { params }).then((r) => r.data),

    // ── Dashboard ──
    getDashboard: () => client.get('/inventory/dashboard').then((r) => r.data),
    getActivitySummary: (params?: any) => client.get('/inventory/dashboard/activity-summary', { params }).then((r) => r.data),

    // ── Reports ──
    getTransactionRegister: (params?: any) => client.get('/inventory/reports/transaction-register', { params }).then((r) => r.data),
    getCountVariance: (params?: any) => client.get('/inventory/reports/count-variance', { params }).then((r) => r.data),
    getAdjustmentRegister: (params?: any) => client.get('/inventory/reports/adjustment-register', { params }).then((r) => r.data),
    getTransferLog: (params?: any) => client.get('/inventory/reports/transfer-log', { params }).then((r) => r.data),

    // ── Production — Issue to Production ──
    createIssueToProduction: (data: any) => client.post('/inventory/transactions/issue-to-production', data).then((r) => r.data),
    listIssueToProduction: (params?: any) => client.get('/inventory/transactions/issue-to-production', { params }).then((r) => r.data),
    getIssueToProduction: (id: string) => client.get(`/inventory/transactions/issue-to-production/${id}`).then((r) => r.data),
    getIssuesByWorkOrder: (workOrderId: string) => client.get(`/inventory/transactions/issue-to-production/wo/${workOrderId}`).then((r) => r.data),

    // ── Production — FG Receipt ──
    createFgReceipt: (data: any) => client.post('/inventory/transactions/fg-receipt', data).then((r) => r.data),
    listFgReceipts: (params?: any) => client.get('/inventory/transactions/fg-receipt', { params }).then((r) => r.data),
    getFgReceipt: (id: string) => client.get(`/inventory/transactions/fg-receipt/${id}`).then((r) => r.data),

    // ── Production — Material Return ──
    createMaterialReturn: (data: any) => client.post('/inventory/transactions/material-return', data).then((r) => r.data),
    listMaterialReturns: (params?: any) => client.get('/inventory/transactions/material-return', { params }).then((r) => r.data),

    // ── Production — Production Scrap ──
    createProductionScrap: (data: any) => client.post('/inventory/transactions/production-scrap', data).then((r) => r.data),
    listProductionScraps: (params?: any) => client.get('/inventory/transactions/production-scrap', { params }).then((r) => r.data),

    // ── Production — Scrap Categories ──
    listScrapCategories: (params?: any) => client.get('/inventory/scrap-categories', { params }).then((r) => r.data),
    createScrapCategory: (data: any) => client.post('/inventory/scrap-categories', data).then((r) => r.data),
    updateScrapCategory: (id: string, data: any) => client.patch(`/inventory/scrap-categories/${id}`, data).then((r) => r.data),
    deleteScrapCategory: (id: string) => client.delete(`/inventory/scrap-categories/${id}`).then((r) => r.data),

    // ── Production — WO Reconciliation ──
    getWoReconciliation: (workOrderId: string) => client.get(`/inventory/wo-reconciliation/${workOrderId}`).then((r) => r.data),
    generateWoReconciliation: (workOrderId: string) => client.post(`/inventory/wo-reconciliation/${workOrderId}/generate`).then((r) => r.data),

    // ── WIP Stock ──
    getWipStock: (params?: any) => client.get('/inventory/stock/wip', { params }).then((r) => r.data),

    // ── Scrap Analysis ──
    getScrapAnalysis: (params?: any) => client.get('/inventory/reports/scrap-analysis', { params }).then((r) => r.data),

    // ── Putaway Rules ──
    listPutawayRules: (params?: any) => client.get('/inventory/putaway-rules', { params }).then((r) => r.data),
    createPutawayRule: (data: any) => client.post('/inventory/putaway-rules', data).then((r) => r.data),
    updatePutawayRule: (id: string, data: any) => client.patch(`/inventory/putaway-rules/${id}`, data).then((r) => r.data),
    deletePutawayRule: (id: string) => client.delete(`/inventory/putaway-rules/${id}`).then((r) => r.data),
    suggestBin: (data: any) => client.post('/inventory/putaway-rules/suggest', data).then((r) => r.data),

    // ── Pallets ──
    listPallets: (params?: any) => client.get('/inventory/pallets', { params }).then((r) => r.data),
    getPallet: (id: string) => client.get(`/inventory/pallets/${id}`).then((r) => r.data),
    createPallet: (data: any) => client.post('/inventory/pallets', data).then((r) => r.data),
    addPalletItems: (id: string, data: any) => client.post(`/inventory/pallets/${id}/items`, data).then((r) => r.data),
    closePallet: (id: string) => client.patch(`/inventory/pallets/${id}/close`).then((r) => r.data),

    // ── Staging ──
    getStagingInbound: (params?: any) => client.get('/inventory/staging/inbound', { params }).then((r) => r.data),
    getStagingOutbound: (params?: any) => client.get('/inventory/staging/outbound', { params }).then((r) => r.data),
    getStagingArea: (warehouseId: string) => client.get(`/inventory/staging/${warehouseId}`).then((r) => r.data),

    // ── Tool Life Policies ──
    listToolLifePolicies: (params?: any) => client.get('/inventory/tool-life-policies', { params }).then((r) => r.data),
    getToolLifePolicy: (partId: string) => client.get(`/inventory/tool-life-policies/${partId}`).then((r) => r.data),
    upsertToolLifePolicy: (data: any) => client.post('/inventory/tool-life-policies', data).then((r) => r.data),

    // ── Tool Issue ──
    createToolIssue: (data: any) => client.post('/inventory/transactions/tool-issue', data).then((r) => r.data),
    getToolsAtMachine: (params?: any) => client.get('/inventory/stock/tools-at-machine', { params }).then((r) => r.data),

    // ── Tool Return ──
    createToolReturn: (data: any) => client.post('/inventory/transactions/tool-return', data).then((r) => r.data),

    // ── Reconditioning ──
    listReconditioning: (params?: any) => client.get('/inventory/transactions/reconditioning', { params }).then((r) => r.data),
    initiateReconditioning: (data: any) => client.post('/inventory/transactions/reconditioning', data).then((r) => r.data),
    completeReconditioning: (id: string, data: any) => client.patch(`/inventory/transactions/reconditioning/${id}/complete`, data).then((r) => r.data),
    getOverdueReconditioning: () => client.get('/inventory/transactions/reconditioning/overdue').then((r) => r.data),

    // ── Tool Reports ──
    getToolStatusReport: (params?: any) => client.get('/inventory/reports/tool-status', { params }).then((r) => r.data),
    getToolsAtMachineReport: (params?: any) => client.get('/inventory/reports/tool-at-machine', { params }).then((r) => r.data),
    getToolConsumptionReport: (params?: any) => client.get('/inventory/reports/tool-consumption', { params }).then((r) => r.data),
    getReconditioningRegister: (params?: any) => client.get('/inventory/reports/reconditioning-register', { params }).then((r) => r.data),
    getToolBreakageReport: (params?: any) => client.get('/inventory/reports/tool-breakage', { params }).then((r) => r.data),

    // ── Industry Templates ──
    listIndustryTemplates: () => client.get('/inventory/industry/templates').then((r) => r.data),
    getIndustryTemplate: (id: string) => client.get(`/inventory/industry/templates/${id}`).then((r) => r.data),
    activateIndustryTemplate: (id: string) => client.post(`/inventory/industry/templates/${id}/activate`).then((r) => r.data),
    cloneIndustryTemplate: (id: string, data: any) => client.post(`/inventory/industry/templates/${id}/clone`, data).then((r) => r.data),
    updateFieldConfig: (templateId: string, fieldId: string, data: any) => client.patch(`/inventory/industry/templates/${templateId}/fields/${fieldId}`, data).then((r) => r.data),
    getActiveFieldConfig: () => client.get('/inventory/industry/field-config').then((r) => r.data),
    seedIndustryTemplates: () => client.post('/inventory/industry/seed').then((r) => r.data),

    // ── Compliance Documents ──
    listComplianceDocuments: (params?: any) => client.get('/inventory/compliance-documents', { params }).then((r) => r.data),
    getComplianceDocument: (id: string) => client.get(`/inventory/compliance-documents/${id}`).then((r) => r.data),
    createComplianceDocument: (data: any) => client.post('/inventory/compliance-documents', data).then((r) => r.data),
    updateComplianceDocument: (id: string, data: any) => client.patch(`/inventory/compliance-documents/${id}`, data).then((r) => r.data),
    deleteComplianceDocument: (id: string) => client.delete(`/inventory/compliance-documents/${id}`).then((r) => r.data),
    getComplianceByLot: (lotId: string) => client.get(`/inventory/compliance-documents/by-lot/${lotId}`).then((r) => r.data),
    getComplianceByPart: (partId: string) => client.get(`/inventory/compliance-documents/by-part/${partId}`).then((r) => r.data),

    // ── Analytics ──
    getDailyAnalytics: (params?: any) => client.get('/inventory/analytics/daily', { params }).then((r) => r.data),
    getKpiSnapshots: (params?: any) => client.get('/inventory/analytics/kpis', { params }).then((r) => r.data),
    getCurrentKpis: () => client.get('/inventory/analytics/current-kpis').then((r) => r.data),
    getStockValueByWarehouse: () => client.get('/inventory/analytics/stock-value').then((r) => r.data),
    getTrendData: (params?: any) => client.get('/inventory/analytics/trend', { params }).then((r) => r.data),

    // ── Search ──
    globalSearch: (params?: any) => client.get('/inventory/search', { params }).then((r) => r.data),
    searchByEntity: (entityType: string, params?: any) => client.get(`/inventory/search/${entityType}`, { params }).then((r) => r.data),

    // ── Import ──
    previewImport: (data: any) => client.post('/inventory/import/preview', data).then((r) => r.data),
    commitImport: (jobId: string) => client.post(`/inventory/import/${jobId}/commit`).then((r) => r.data),
    listImportJobs: (params?: any) => client.get('/inventory/import/jobs', { params }).then((r) => r.data),
    getImportJob: (jobId: string) => client.get(`/inventory/import/jobs/${jobId}`).then((r) => r.data),

    // ── Export ──
    exportData: (data: any) => client.post('/inventory/export', data, { responseType: 'blob' }).then((r) => r.data),
    getExportTemplates: () => client.get('/inventory/export/templates').then((r) => r.data),

    // ── Saved Filters ──
    listSavedFilters: (params?: any) => client.get('/inventory/saved-filters', { params }).then((r) => r.data),
    createSavedFilter: (data: any) => client.post('/inventory/saved-filters', data).then((r) => r.data),
    updateSavedFilter: (id: string, data: any) => client.patch(`/inventory/saved-filters/${id}`, data).then((r) => r.data),
    deleteSavedFilter: (id: string) => client.delete(`/inventory/saved-filters/${id}`).then((r) => r.data),
    setDefaultFilter: (id: string) => client.patch(`/inventory/saved-filters/${id}/default`).then((r) => r.data),

    // ── Sync (offline actions — primarily mobile, admin view on web) ──
    uploadSyncActions: (data: any) => client.post('/inventory/sync/upload', data).then((r) => r.data),
    getSyncConflicts: () => client.get('/inventory/sync/conflicts').then((r) => r.data),
    resolveSyncConflict: (id: string, data: any) => client.patch(`/inventory/sync/conflicts/${id}/resolve`, data).then((r) => r.data),
    retrySyncFailed: () => client.post('/inventory/sync/retry').then((r) => r.data),
    getSyncStats: () => client.get('/inventory/sync/stats').then((r) => r.data),
};
