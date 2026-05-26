import { client } from '@/lib/api/client';

export const maintenanceApi = {
    // ── Config ──
    getConfig: () => client.get('/maintenance/config').then((r) => r.data),
    updateConfig: (data: any) => client.patch('/maintenance/config', data).then((r) => r.data),

    // ── Failure Code Sets ──
    listFailureCodeSets: (params?: any) => client.get('/maintenance/failure-code-sets', { params }).then((r) => r.data),
    getFailureCodeSet: (id: string) => client.get(`/maintenance/failure-code-sets/${id}`).then((r) => r.data),
    createFailureCodeSet: (data: any) => client.post('/maintenance/failure-code-sets', data).then((r) => r.data),
    updateFailureCodeSet: (id: string, data: any) => client.patch(`/maintenance/failure-code-sets/${id}`, data).then((r) => r.data),
    deleteFailureCodeSet: (id: string) => client.delete(`/maintenance/failure-code-sets/${id}`).then((r) => r.data),

    // ── Failure Modes ──
    listFailureModes: (setId: string) => client.get(`/maintenance/failure-code-sets/${setId}/modes`).then((r) => r.data),
    createFailureMode: (setId: string, data: any) => client.post(`/maintenance/failure-code-sets/${setId}/modes`, data).then((r) => r.data),
    updateFailureMode: (setId: string, id: string, data: any) => client.patch(`/maintenance/failure-code-sets/${setId}/modes/${id}`, data).then((r) => r.data),
    deleteFailureMode: (setId: string, id: string) => client.delete(`/maintenance/failure-code-sets/${setId}/modes/${id}`).then((r) => r.data),

    // ── Failure Causes ──
    listFailureCauses: (modeId: string) => client.get(`/maintenance/failure-modes/${modeId}/causes`).then((r) => r.data),
    createFailureCause: (modeId: string, data: any) => client.post(`/maintenance/failure-modes/${modeId}/causes`, data).then((r) => r.data),
    updateFailureCause: (modeId: string, id: string, data: any) => client.patch(`/maintenance/failure-modes/${modeId}/causes/${id}`, data).then((r) => r.data),
    deleteFailureCause: (modeId: string, id: string) => client.delete(`/maintenance/failure-modes/${modeId}/causes/${id}`).then((r) => r.data),

    // ── Action Codes ──
    listActionCodes: (params?: any) => client.get('/maintenance/action-codes', { params }).then((r) => r.data),
    createActionCode: (data: any) => client.post('/maintenance/action-codes', data).then((r) => r.data),
    updateActionCode: (id: string, data: any) => client.patch(`/maintenance/action-codes/${id}`, data).then((r) => r.data),
    deleteActionCode: (id: string) => client.delete(`/maintenance/action-codes/${id}`).then((r) => r.data),

    // ── Strategies ──
    listStrategies: (params?: any) => client.get('/maintenance/strategies', { params }).then((r) => r.data),
    getStrategy: (id: string) => client.get(`/maintenance/strategies/${id}`).then((r) => r.data),
    createStrategy: (data: any) => client.post('/maintenance/strategies', data).then((r) => r.data),
    updateStrategy: (id: string, data: any) => client.patch(`/maintenance/strategies/${id}`, data).then((r) => r.data),
    deleteStrategy: (id: string) => client.delete(`/maintenance/strategies/${id}`).then((r) => r.data),

    // ── Job Plans ──
    listJobPlans: (params?: any) => client.get('/maintenance/job-plans', { params }).then((r) => r.data),
    getJobPlan: (id: string) => client.get(`/maintenance/job-plans/${id}`).then((r) => r.data),
    createJobPlan: (data: any) => client.post('/maintenance/job-plans', data).then((r) => r.data),
    updateJobPlan: (id: string, data: any) => client.patch(`/maintenance/job-plans/${id}`, data).then((r) => r.data),
    deleteJobPlan: (id: string) => client.delete(`/maintenance/job-plans/${id}`).then((r) => r.data),

    // ── Checklist Templates ──
    listChecklistTemplates: (params?: any) => client.get('/maintenance/checklist-templates', { params }).then((r) => r.data),
    getChecklistTemplate: (id: string) => client.get(`/maintenance/checklist-templates/${id}`).then((r) => r.data),
    createChecklistTemplate: (data: any) => client.post('/maintenance/checklist-templates', data).then((r) => r.data),
    updateChecklistTemplate: (id: string, data: any) => client.patch(`/maintenance/checklist-templates/${id}`, data).then((r) => r.data),
    deleteChecklistTemplate: (id: string) => client.delete(`/maintenance/checklist-templates/${id}`).then((r) => r.data),

    // ── Assets ──
    listAssets: (params?: any) => client.get('/maintenance/assets', { params }).then((r) => r.data),
    getAsset: (id: string) => client.get(`/maintenance/assets/${id}`).then((r) => r.data),
    createAsset: (data: any) => client.post('/maintenance/assets', data).then((r) => r.data),
    updateAsset: (id: string, data: any) => client.patch(`/maintenance/assets/${id}`, data).then((r) => r.data),
    deleteAsset: (id: string) => client.delete(`/maintenance/assets/${id}`).then((r) => r.data),
    transferAsset: (id: string, data: any) => client.post(`/maintenance/assets/${id}/transfer`, data).then((r) => r.data),
    getAssetHierarchy: (params?: any) => client.get('/maintenance/assets/hierarchy', { params }).then((r) => r.data),
    getAssetHistory: (id: string, params?: any) => client.get(`/maintenance/assets/${id}/history`, { params }).then((r) => r.data),
    syncMachines: () => client.post('/maintenance/assets/sync-machines').then((r) => r.data),

    // ── Asset Categories / Sub-Categories / Types ──
    listAssetCategories: () => client.get('/maintenance/assets/categories/list').then((r) => r.data),
    createAssetCategory: (data: any) => client.post('/maintenance/assets/categories', data).then((r) => r.data),
    updateAssetCategory: (id: string, data: any) => client.patch(`/maintenance/assets/categories/${id}`, data).then((r) => r.data),
    deleteAssetCategory: (id: string) => client.delete(`/maintenance/assets/categories/${id}`).then((r) => r.data),

    listAssetSubCategories: (params?: any) => client.get('/maintenance/assets/sub-categories/list', { params }).then((r) => r.data),
    createAssetSubCategory: (data: any) => client.post('/maintenance/assets/sub-categories', data).then((r) => r.data),
    updateAssetSubCategory: (id: string, data: any) => client.patch(`/maintenance/assets/sub-categories/${id}`, data).then((r) => r.data),
    deleteAssetSubCategory: (id: string) => client.delete(`/maintenance/assets/sub-categories/${id}`).then((r) => r.data),

    listAssetTypes: () => client.get('/maintenance/assets/types/list').then((r) => r.data),
    createAssetType: (data: any) => client.post('/maintenance/assets/types', data).then((r) => r.data),
    updateAssetType: (id: string, data: any) => client.patch(`/maintenance/assets/types/${id}`, data).then((r) => r.data),
    deleteAssetType: (id: string) => client.delete(`/maintenance/assets/types/${id}`).then((r) => r.data),

    // ── Asset Class / Ownership / PTW Class Options ──
    listAssetClassOptions: () => client.get('/maintenance/assets/asset-class-options/list').then((r) => r.data),
    createAssetClassOption: (data: any) => client.post('/maintenance/assets/asset-class-options', data).then((r) => r.data),
    updateAssetClassOption: (id: string, data: any) => client.patch(`/maintenance/assets/asset-class-options/${id}`, data).then((r) => r.data),
    deleteAssetClassOption: (id: string) => client.delete(`/maintenance/assets/asset-class-options/${id}`).then((r) => r.data),

    listOwnershipOptions: () => client.get('/maintenance/assets/ownership-options/list').then((r) => r.data),
    createOwnershipOption: (data: any) => client.post('/maintenance/assets/ownership-options', data).then((r) => r.data),
    updateOwnershipOption: (id: string, data: any) => client.patch(`/maintenance/assets/ownership-options/${id}`, data).then((r) => r.data),
    deleteOwnershipOption: (id: string) => client.delete(`/maintenance/assets/ownership-options/${id}`).then((r) => r.data),

    listPTWClassOptions: () => client.get('/maintenance/assets/ptw-class-options/list').then((r) => r.data),
    createPTWClassOption: (data: any) => client.post('/maintenance/assets/ptw-class-options', data).then((r) => r.data),
    updatePTWClassOption: (id: string, data: any) => client.patch(`/maintenance/assets/ptw-class-options/${id}`, data).then((r) => r.data),
    deletePTWClassOption: (id: string) => client.delete(`/maintenance/assets/ptw-class-options/${id}`).then((r) => r.data),

    // ── Meters & Readings ──
    listMeters: (assetId: string) => client.get(`/maintenance/assets/${assetId}/meters`).then((r) => r.data),
    addMeter: (assetId: string, data: any) => client.post(`/maintenance/assets/${assetId}/meters`, data).then((r) => r.data),
    updateMeter: (assetId: string, meterId: string, data: any) => client.patch(`/maintenance/assets/${assetId}/meters/${meterId}`, data).then((r) => r.data),
    deleteMeter: (assetId: string, meterId: string) => client.delete(`/maintenance/assets/${assetId}/meters/${meterId}`).then((r) => r.data),
    logReading: (assetId: string, meterId: string, data: any) => client.post(`/maintenance/assets/${assetId}/meters/${meterId}/readings`, data).then((r) => r.data),
    getReadingHistory: (assetId: string, meterId: string, params?: any) => client.get(`/maintenance/assets/${assetId}/meters/${meterId}/readings`, { params }).then((r) => r.data),

    // ── Tags ──
    linkTag: (assetId: string, data: any) => client.post(`/maintenance/assets/${assetId}/tags`, data).then((r) => r.data),
    lookupByTag: (tagCode: string) => client.get(`/maintenance/assets/tags/${tagCode}`).then((r) => r.data),
    deactivateTag: (assetId: string, tagId: string) => client.delete(`/maintenance/assets/${assetId}/tags/${tagId}`).then((r) => r.data),
    batchGenerateTags: (data: any) => client.post('/maintenance/assets/tags/batch-generate', data).then((r) => r.data),

    // ── Work Requests ──
    listWorkRequests: (params?: any) => client.get('/maintenance/work-requests', { params }).then((r) => r.data),
    getWorkRequest: (id: string) => client.get(`/maintenance/work-requests/${id}`).then((r) => r.data),
    createWorkRequest: (data: any) => client.post('/maintenance/work-requests', data).then((r) => r.data),
    updateWorkRequest: (id: string, data: any) => client.patch(`/maintenance/work-requests/${id}`, data).then((r) => r.data),
    triageWorkRequest: (id: string, data: any) => client.post(`/maintenance/work-requests/${id}/triage`, data).then((r) => r.data),
    approveWorkRequest: (id: string) => client.post(`/maintenance/work-requests/${id}/approve`).then((r) => r.data),
    rejectWorkRequest: (id: string, data: any) => client.post(`/maintenance/work-requests/${id}/reject`, data).then((r) => r.data),
    convertWorkRequest: (id: string) => client.post(`/maintenance/work-requests/${id}/convert`).then((r) => r.data),
    cancelWorkRequest: (id: string) => client.post(`/maintenance/work-requests/${id}/cancel`).then((r) => r.data),
    checkDuplicateWR: (params: any) => client.get('/maintenance/work-requests/duplicate-check', { params }).then((r) => r.data),

    // ── Work Orders ──
    listWorkOrders: (params?: any) => client.get('/maintenance/work-orders', { params }).then((r) => r.data),
    getWorkOrder: (id: string) => client.get(`/maintenance/work-orders/${id}`).then((r) => r.data),
    createWorkOrder: (data: any) => client.post('/maintenance/work-orders', data).then((r) => r.data),
    updateWorkOrder: (id: string, data: any) => client.patch(`/maintenance/work-orders/${id}`, data).then((r) => r.data),
    approveWorkOrder: (id: string, data?: any) => client.post(`/maintenance/work-orders/${id}/approve`, data).then((r) => r.data),
    assignWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/assign`, data).then((r) => r.data),
    acknowledgeWorkOrder: (id: string) => client.post(`/maintenance/work-orders/${id}/acknowledge`).then((r) => r.data),
    declineWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/decline`, data).then((r) => r.data),
    startWorkOrder: (id: string) => client.post(`/maintenance/work-orders/${id}/start`).then((r) => r.data),
    holdWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/hold`, data).then((r) => r.data),
    resumeWorkOrder: (id: string) => client.post(`/maintenance/work-orders/${id}/resume`).then((r) => r.data),
    completeWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/complete`, data).then((r) => r.data),
    qaReleaseWorkOrder: (id: string) => client.post(`/maintenance/work-orders/${id}/qa-release`).then((r) => r.data),
    closeWorkOrder: (id: string, data?: any) => client.post(`/maintenance/work-orders/${id}/close`, data).then((r) => r.data),
    rejectWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/reject`, data).then((r) => r.data),
    cancelWorkOrder: (id: string) => client.post(`/maintenance/work-orders/${id}/cancel`).then((r) => r.data),
    reopenWorkOrder: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/reopen`, data).then((r) => r.data),
    submitChecklist: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/checklist`, data).then((r) => r.data),
    addWOParts: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/parts`, data).then((r) => r.data),
    returnWOPart: (id: string, partId: string, data: any) => client.post(`/maintenance/work-orders/${id}/parts/${partId}/return`, data).then((r) => r.data),
    logWOLabour: (id: string, data: any) => client.post(`/maintenance/work-orders/${id}/labour`, data).then((r) => r.data),
    addWOEvidence: (id: string, evidence: unknown[]) =>
        client.post(`/maintenance/work-orders/${id}/evidence`, { evidence }).then((r) => r.data),
    getWOBoard: (params?: any) => client.get('/maintenance/work-orders/board', { params }).then((r) => r.data),

    // ── PM Schedules ──
    listPMSchedules: (params?: any) => client.get('/maintenance/pm-schedules', { params }).then((r) => r.data),
    getPMSchedule: (id: string) => client.get(`/maintenance/pm-schedules/${id}`).then((r) => r.data),
    createPMSchedule: (data: any) => client.post('/maintenance/pm-schedules', data).then((r) => r.data),
    updatePMSchedule: (id: string, data: any) => client.patch(`/maintenance/pm-schedules/${id}`, data).then((r) => r.data),
    deletePMSchedule: (id: string) => client.delete(`/maintenance/pm-schedules/${id}`).then((r) => r.data),
    reschedulePM: (id: string, data: any) => client.post(`/maintenance/pm-schedules/${id}/reschedule`, data).then((r) => r.data),
    skipPM: (id: string, data: any) => client.post(`/maintenance/pm-schedules/${id}/skip`, data).then((r) => r.data),
    generateWOFromPM: (id: string) => client.post(`/maintenance/pm-schedules/${id}/generate-wo`).then((r) => r.data),
    getPMCalendar: (params: any) => client.get('/maintenance/pm-schedules/calendar', { params }).then((r) => r.data),
    getOverduePMs: () => client.get('/maintenance/pm-schedules/overdue').then((r) => r.data),
    getDueTodayPMs: () => client.get('/maintenance/pm-schedules/due-today').then((r) => r.data),

    // ── Breakdowns ──
    logBreakdown: (data: any) => client.post('/maintenance/breakdowns', data).then((r) => r.data),
    listBreakdowns: (params?: any) => client.get('/maintenance/breakdowns', { params }).then((r) => r.data),
    getBreakdown: (id: string) => client.get(`/maintenance/breakdowns/${id}`).then((r) => r.data),
    assignBreakdown: (id: string, data: any) => client.post(`/maintenance/breakdowns/${id}/assign`, data).then((r) => r.data),
    resolveBreakdown: (id: string, data: any) => client.post(`/maintenance/breakdowns/${id}/resolve`, data).then((r) => r.data),
    getRecurringFailures: (params?: any) => client.get('/maintenance/breakdowns/recurring', { params }).then((r) => r.data),

    // ── Downtime ──
    createDowntime: (data: any) => client.post('/maintenance/downtime', data).then((r) => r.data),
    updateDowntime: (id: string, data: any) => client.patch(`/maintenance/downtime/${id}`, data).then((r) => r.data),
    listDowntime: (params?: any) => client.get('/maintenance/downtime', { params }).then((r) => r.data),
    getAssetDowntime: (assetId: string, params?: any) => client.get(`/maintenance/downtime/asset/${assetId}`, { params }).then((r) => r.data),
    getOEEFeed: (params?: any) => client.get('/maintenance/downtime/oee-feed', { params }).then((r) => r.data),

    // ── Contracts ──
    listContracts: (params?: any) => client.get('/maintenance/contracts', { params }).then((r) => r.data),
    getContract: (id: string) => client.get(`/maintenance/contracts/${id}`).then((r) => r.data),
    createContract: (data: any) => client.post('/maintenance/contracts', data).then((r) => r.data),
    updateContract: (id: string, data: any) => client.patch(`/maintenance/contracts/${id}`, data).then((r) => r.data),
    deleteContract: (id: string) => client.delete(`/maintenance/contracts/${id}`).then((r) => r.data),
    addContractAsset: (id: string, data: any) => client.post(`/maintenance/contracts/${id}/assets`, data).then((r) => r.data),
    removeContractAsset: (id: string, assetId: string) => client.delete(`/maintenance/contracts/${id}/assets/${assetId}`).then((r) => r.data),
    logContractVisit: (id: string, data: any) => client.post(`/maintenance/contracts/${id}/visits`, data).then((r) => r.data),
    getExpiringContracts: (params?: any) => client.get('/maintenance/contracts/expiring', { params }).then((r) => r.data),
    getContractUtilisation: (id: string) => client.get(`/maintenance/contracts/${id}/utilisation`).then((r) => r.data),

    // ── Spare Parts ──
    reserveParts: (woId: string, data: any) => client.post(`/maintenance/work-orders/${woId}/parts/reserve`, data).then((r) => r.data),
    issueParts: (woId: string, data: any) => client.post(`/maintenance/work-orders/${woId}/parts/issue`, data).then((r) => r.data),
    checkSpareKit: (jobPlanId: string) => client.get(`/maintenance/spare-parts/kit/${jobPlanId}`).then((r) => r.data),
    getStockoutAlerts: (params?: any) => client.get('/maintenance/spare-parts/stockout-alerts', { params }).then((r) => r.data),

    // ── Permit to Work (PTW) ──
    listPTW: (params?: any) => client.get('/maintenance/ptw', { params }).then((r) => r.data),
    getPTW: (id: string) => client.get(`/maintenance/ptw/${id}`).then((r) => r.data),
    createPTW: (data: any) => client.post('/maintenance/ptw', data).then((r) => r.data),
    updatePTW: (id: string, data: any) => client.patch(`/maintenance/ptw/${id}`, data).then((r) => r.data),
    reviewPTW: (id: string) => client.post(`/maintenance/ptw/${id}/review`).then((r) => r.data),
    issuePTW: (id: string) => client.post(`/maintenance/ptw/${id}/issue`).then((r) => r.data),
    closePTW: (id: string) => client.post(`/maintenance/ptw/${id}/close`).then((r) => r.data),
    revokePTW: (id: string, data: any) => client.post(`/maintenance/ptw/${id}/revoke`, data).then((r) => r.data),
    deletePTW: (id: string) => client.delete(`/maintenance/ptw/${id}`).then((r) => r.data),

    // ── Shutdown Events ──
    listShutdowns: (params?: any) => client.get('/maintenance/shutdown', { params }).then((r) => r.data),
    getShutdown: (id: string) => client.get(`/maintenance/shutdown/${id}`).then((r) => r.data),
    createShutdown: (data: any) => client.post('/maintenance/shutdown', data).then((r) => r.data),
    updateShutdown: (id: string, data: any) => client.patch(`/maintenance/shutdown/${id}`, data).then((r) => r.data),
    deleteShutdown: (id: string) => client.delete(`/maintenance/shutdown/${id}`).then((r) => r.data),
    approveShutdown: (id: string) => client.post(`/maintenance/shutdown/${id}/approve`).then((r) => r.data),
    addShutdownWOs: (id: string, data: any) => client.post(`/maintenance/shutdown/${id}/add-work-orders`, data).then((r) => r.data),
    removeShutdownWO: (id: string, woId: string) => client.delete(`/maintenance/shutdown/${id}/work-orders/${woId}`).then((r) => r.data),
    startShutdown: (id: string) => client.post(`/maintenance/shutdown/${id}/start`).then((r) => r.data),
    completeShutdown: (id: string) => client.post(`/maintenance/shutdown/${id}/complete`).then((r) => r.data),
    getShutdownProgress: (id: string) => client.get(`/maintenance/shutdown/${id}/progress`).then((r) => r.data),

    // ── Dashboards ──
    getManagerDashboard: (params?: any) => client.get('/maintenance/dashboard/manager', { params }).then((r) => r.data),
    getPlannerDashboard: (params?: any) => client.get('/maintenance/dashboard/planner', { params }).then((r) => r.data),
    getTechnicianDashboard: (params?: any) => client.get('/maintenance/dashboard/technician', { params }).then((r) => r.data),
    getPlantHeadDashboard: (params?: any) => client.get('/maintenance/dashboard/plant-head', { params }).then((r) => r.data),
    getFinanceDashboard: (params?: any) => client.get('/maintenance/dashboard/finance', { params }).then((r) => r.data),

    // ── Reports ──
    getReportPMDueOverdue: (params?: any) => client.get('/maintenance/reports/pm-due-overdue', { params }).then((r) => r.data),
    getReportOpenBreakdowns: (params?: any) => client.get('/maintenance/reports/open-breakdowns', { params }).then((r) => r.data),
    getReportTechnicianWorkload: (params?: any) => client.get('/maintenance/reports/technician-workload', { params }).then((r) => r.data),
    getReportVendorSLA: (params?: any) => client.get('/maintenance/reports/vendor-sla', { params }).then((r) => r.data),
    getReportPartsAvailability: (params?: any) => client.get('/maintenance/reports/parts-availability', { params }).then((r) => r.data),
    getReportAssetMovement: (params?: any) => client.get('/maintenance/reports/asset-movement', { params }).then((r) => r.data),
    getReportShutdownProgress: (shutdownId: string) => client.get(`/maintenance/reports/shutdown-progress/${shutdownId}`).then((r) => r.data),
    getReportAvailabilityTrend: (params?: any) => client.get('/maintenance/reports/availability-trend', { params }).then((r) => r.data),
    getReportRecurringFailures: (params?: any) => client.get('/maintenance/reports/recurring-failures', { params }).then((r) => r.data),
    getReportPlannedVsUnplanned: (params?: any) => client.get('/maintenance/reports/planned-vs-unplanned', { params }).then((r) => r.data),
    getReportCostBreakdown: (params?: any) => client.get('/maintenance/reports/cost-breakdown', { params }).then((r) => r.data),
    getReportCalibrationDue: (params?: any) => client.get('/maintenance/reports/calibration-due', { params }).then((r) => r.data),
    getReportStatutoryDueOverdue: (params?: any) => client.get('/maintenance/reports/statutory-due-overdue', { params }).then((r) => r.data),
    getReportClosureEvidenceMissing: (params?: any) => client.get('/maintenance/reports/closure-evidence-missing', { params }).then((r) => r.data),
    getReportApprovalAuditTrail: (params?: any) => client.get('/maintenance/reports/approval-audit-trail', { params }).then((r) => r.data),
    getReportRepairVsReplace: (params?: any) => client.get('/maintenance/reports/repair-vs-replace', { params }).then((r) => r.data),
    getReportWarrantyAMCRecovery: (params?: any) => client.get('/maintenance/reports/warranty-amc-recovery', { params }).then((r) => r.data),
    getReportPTWCompliance: (params?: any) => client.get('/maintenance/reports/ptw-compliance', { params }).then((r) => r.data),

    // ── Analytics / Reliability (reuses reports endpoints) ──
    getAvailabilityTrend: (params?: any) => client.get('/maintenance/reports/availability-trend', { params }).then((r) => r.data),
    getCostAnalytics: (params?: any) => client.get('/maintenance/reports/cost-breakdown', { params }).then((r) => r.data),
    getPlannedVsUnplanned: (params?: any) => client.get('/maintenance/reports/planned-vs-unplanned', { params }).then((r) => r.data),
    getReliabilityMetrics: (params?: any) => client.get('/maintenance/reports/repair-vs-replace', { params }).then((r) => r.data),
};
