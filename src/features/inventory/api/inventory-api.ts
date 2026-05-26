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
};
