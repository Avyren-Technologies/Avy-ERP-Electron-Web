import { BaseApiClient } from '../../shared/helpers/base-api-client';

/**
 * Inventory & Warehouse Management module API client.
 * Extends BaseApiClient with all inventory-specific endpoints.
 */
export class InventoryApiClient extends BaseApiClient {
  // ── Warehouses ────────────────────────────────
  async listWarehouses(params?: Record<string, string>) {
    return this.get('/inventory/warehouses', params);
  }

  async createWarehouse(data: Record<string, unknown>) {
    return this.post('/inventory/warehouses', data);
  }

  async getWarehouse(id: string) {
    return this.get(`/inventory/warehouses/${id}`);
  }

  async updateWarehouse(id: string, data: Record<string, unknown>) {
    return this.patch(`/inventory/warehouses/${id}`, data);
  }

  async deleteWarehouse(id: string) {
    return this.delete(`/inventory/warehouses/${id}`);
  }

  // ── Zones ─────────────────────────────────────
  async listZones(params?: Record<string, string>) {
    return this.get('/inventory/zones', params);
  }

  async createZone(data: Record<string, unknown>) {
    return this.post('/inventory/zones', data);
  }

  // ── Bins ──────────────────────────────────────
  async listBins(params?: Record<string, string>) {
    return this.get('/inventory/bins', params);
  }

  async createBin(data: Record<string, unknown>) {
    return this.post('/inventory/bins', data);
  }

  // ── Item Stock Policies ───────────────────────
  async listItemPolicies(params?: Record<string, string>) {
    return this.get('/inventory/item-policies', params);
  }

  async upsertItemPolicy(data: Record<string, unknown>) {
    return this.post('/inventory/item-policies', data);
  }

  // ── Reason Codes ──────────────────────────────
  async listReasonCodes(params?: Record<string, string>) {
    return this.get('/inventory/reason-codes', params);
  }

  async createReasonCode(data: Record<string, unknown>) {
    return this.post('/inventory/reason-codes', data);
  }

  // ── Approval Thresholds ───────────────────────
  async listApprovalThresholds() {
    return this.get('/inventory/approval-thresholds');
  }

  async createApprovalThreshold(data: Record<string, unknown>) {
    return this.post('/inventory/approval-thresholds', data);
  }

  // ── Config ────────────────────────────────────
  async getConfig() {
    return this.get('/inventory/config');
  }

  async updateConfig(data: Record<string, unknown>) {
    return this.patch('/inventory/config', data);
  }

  // ── Transactions: GRN ─────────────────────────
  async createGrn(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/grn', data);
  }

  async listGrns(params?: Record<string, string>) {
    return this.get('/inventory/transactions/grn', params);
  }

  async getGrn(id: string) {
    return this.get(`/inventory/transactions/grn/${id}`);
  }

  // ── Transactions: Receive Stock ───────────────
  async createReceiveStock(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/receive-stock', data);
  }

  async listReceiveStock(params?: Record<string, string>) {
    return this.get('/inventory/transactions/receive-stock', params);
  }

  // ── Transactions: Put Away ────────────────────
  async confirmPutaway(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/put-away', data);
  }

  async listPendingPutaway(params?: Record<string, string>) {
    return this.get('/inventory/transactions/put-away/pending', params);
  }

  // ── Transactions: Move Stock ──────────────────
  async createMoveStock(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/move-stock', data);
  }

  async confirmMoveReceipt(id: string) {
    return this.post(`/inventory/transactions/move-stock/${id}/confirm-receipt`);
  }

  async listMoveStock(params?: Record<string, string>) {
    return this.get('/inventory/transactions/move-stock', params);
  }

  // ── Transactions: Adjust Stock ────────────────
  async createAdjustStock(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/adjust-stock', data);
  }

  async createOpeningBalance(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/adjust-stock/opening-balance', data);
  }

  async listAdjustments(params?: Record<string, string>) {
    return this.get('/inventory/transactions/adjust-stock', params);
  }

  // ── Transactions: Change Status ───────────────
  async createChangeStatus(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/change-status', data);
  }

  // ── Transactions: Pick ────────────────────────
  async createPickItems(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/pick-items', data);
  }

  async confirmPick(id: string, data: Record<string, unknown>) {
    return this.post(`/inventory/transactions/pick-items/${id}/confirm`, data);
  }

  // ── Transactions: Dispatch ────────────────────
  async createDispatch(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/dispatch', data);
  }

  async listDispatches(params?: Record<string, string>) {
    return this.get('/inventory/transactions/dispatch', params);
  }

  // ── Transactions: Customer Return ─────────────
  async createCustomerReturn(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/customer-return', data);
  }

  async inspectReturn(id: string, data: Record<string, unknown>) {
    return this.post(`/inventory/transactions/customer-return/${id}/inspect`, data);
  }

  // ── Transactions: Vendor Return ───────────────
  async createVendorReturn(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/vendor-return', data);
  }

  // ── Transactions: Reserve Stock ───────────────
  async createReserveStock(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/reserve-stock', data);
  }

  async releaseReservation(id: string) {
    return this.post(`/inventory/transactions/reserve-stock/${id}/release`);
  }

  // ── Stock Explorer ────────────────────────────
  async getStockOnHand(params?: Record<string, string>) {
    return this.get('/inventory/stock/on-hand', params);
  }

  async getNetAvailable(params?: Record<string, string>) {
    return this.get('/inventory/stock/net-available', params);
  }

  async getWipStock(params?: Record<string, string>) {
    return this.get('/inventory/stock/wip', params);
  }

  async getExpiryReport(params?: Record<string, string>) {
    return this.get('/inventory/stock/expiry-report', params);
  }

  // ── Counts ────────────────────────────────────
  async createCount(data: Record<string, unknown>) {
    return this.post('/inventory/counts', data);
  }

  async listCounts(params?: Record<string, string>) {
    return this.get('/inventory/counts', params);
  }

  async getCount(id: string) {
    return this.get(`/inventory/counts/${id}`);
  }

  async enterCount(id: string, data: Record<string, unknown>) {
    return this.patch(`/inventory/counts/${id}/enter`, data);
  }

  async submitCount(id: string) {
    return this.patch(`/inventory/counts/${id}/submit`);
  }

  async approveCount(id: string, data?: Record<string, unknown>) {
    return this.patch(`/inventory/counts/${id}/approve`, data);
  }

  // ── Approvals ─────────────────────────────────
  async listPendingApprovals() {
    return this.get('/inventory/approvals/pending');
  }

  async approveTransaction(id: string) {
    return this.patch(`/inventory/approvals/${id}/approve`);
  }

  async rejectTransaction(id: string, data: Record<string, unknown>) {
    return this.patch(`/inventory/approvals/${id}/reject`, data);
  }

  // ── Dashboard ─────────────────────────────────
  async getDashboard() {
    return this.get('/inventory/dashboard');
  }

  // ── Reports ───────────────────────────────────
  async getTransactionRegister(params?: Record<string, string>) {
    return this.get('/inventory/reports/transaction-register', params);
  }

  async getCountVariance(params?: Record<string, string>) {
    return this.get('/inventory/reports/count-variance', params);
  }

  async getScrapAnalysis(params?: Record<string, string>) {
    return this.get('/inventory/reports/scrap-analysis', params);
  }

  // ── Phase 2: Production ───────────────────────
  async createIssueToProduction(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/issue-to-production', data);
  }

  async listIssueToProduction(params?: Record<string, string>) {
    return this.get('/inventory/transactions/issue-to-production', params);
  }

  async createFgReceipt(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/fg-receipt', data);
  }

  async createMaterialReturn(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/material-return', data);
  }

  async createProductionScrap(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/production-scrap', data);
  }

  async getWoReconciliation(workOrderId: string) {
    return this.get(`/inventory/wo-reconciliation/${workOrderId}`);
  }

  async generateWoReconciliation(workOrderId: string) {
    return this.post(`/inventory/wo-reconciliation/${workOrderId}/generate`);
  }

  // ── Scrap Categories ──────────────────────────
  async listScrapCategories(params?: Record<string, string>) {
    return this.get('/inventory/scrap-categories', params);
  }

  async createScrapCategory(data: Record<string, unknown>) {
    return this.post('/inventory/scrap-categories', data);
  }

  // ── Phase 3: Putaway Rules ────────────────────
  async listPutawayRules(params?: Record<string, string>) {
    return this.get('/inventory/putaway-rules', params);
  }

  async createPutawayRule(data: Record<string, unknown>) {
    return this.post('/inventory/putaway-rules', data);
  }

  async deletePutawayRule(id: string) {
    return this.delete(`/inventory/putaway-rules/${id}`);
  }

  async suggestBin(data: Record<string, unknown>) {
    return this.post('/inventory/putaway-rules/suggest', data);
  }

  // ── Phase 3: Pallets ─────────────────────────
  async listPallets(params?: Record<string, string>) {
    return this.get('/inventory/pallets', params);
  }

  async getPallet(id: string) {
    return this.get(`/inventory/pallets/${id}`);
  }

  async createPallet(data: Record<string, unknown>) {
    return this.post('/inventory/pallets', data);
  }

  async closePallet(id: string) {
    return this.patch(`/inventory/pallets/${id}/close`);
  }

  // ── Phase 3: Staging ─────────────────────────
  async getStagingInbound(params?: Record<string, string>) {
    return this.get('/inventory/staging/inbound', params);
  }

  async getStagingOutbound(params?: Record<string, string>) {
    return this.get('/inventory/staging/outbound', params);
  }

  // ── Phase 3: Tool Life Policies ──────────────
  async listToolLifePolicies(params?: Record<string, string>) {
    return this.get('/inventory/tool-life-policies', params);
  }

  async upsertToolLifePolicy(data: Record<string, unknown>) {
    return this.post('/inventory/tool-life-policies', data);
  }

  // ── Phase 3: Tool Issue/Return ───────────────
  async createToolIssue(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/tool-issue', data);
  }

  async getToolsAtMachine(params?: Record<string, string>) {
    return this.get('/inventory/stock/tools-at-machine', params);
  }

  async createToolReturn(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/tool-return', data);
  }

  // ── Phase 3: Reconditioning ──────────────────
  async listReconditioning(params?: Record<string, string>) {
    return this.get('/inventory/transactions/reconditioning', params);
  }

  async initiateReconditioning(data: Record<string, unknown>) {
    return this.post('/inventory/transactions/reconditioning', data);
  }

  async completeReconditioning(id: string, data: Record<string, unknown>) {
    return this.patch(`/inventory/transactions/reconditioning/${id}/complete`, data);
  }

  async getOverdueReconditioning() {
    return this.get('/inventory/transactions/reconditioning/overdue');
  }

  // ── Phase 3: Tool Reports ────────────────────
  async getToolStatusReport(params?: Record<string, string>) {
    return this.get('/inventory/reports/tool-status', params);
  }

  async getToolsAtMachineReport(params?: Record<string, string>) {
    return this.get('/inventory/reports/tool-at-machine', params);
  }

  async getToolConsumptionReport(params?: Record<string, string>) {
    return this.get('/inventory/reports/tool-consumption', params);
  }

  async getReconditioningRegister(params?: Record<string, string>) {
    return this.get('/inventory/reports/reconditioning-register', params);
  }

  async getToolBreakageReport(params?: Record<string, string>) {
    return this.get('/inventory/reports/tool-breakage', params);
  }

  // ── Phase 4: Industry Templates ───────────────
  async listIndustryTemplates() {
    return this.get('/inventory/industry/templates');
  }

  async getIndustryTemplate(id: string) {
    return this.get(`/inventory/industry/templates/${id}`);
  }

  async activateIndustryTemplate(id: string) {
    return this.post(`/inventory/industry/templates/${id}/activate`);
  }

  async cloneIndustryTemplate(id: string, data: Record<string, unknown>) {
    return this.post(`/inventory/industry/templates/${id}/clone`, data);
  }

  async getActiveFieldConfig() {
    return this.get('/inventory/industry/field-config');
  }

  async seedIndustryTemplates() {
    return this.post('/inventory/industry/seed');
  }

  // ── Phase 4: Compliance Documents ────────────
  async listComplianceDocuments(params?: Record<string, string>) {
    return this.get('/inventory/compliance-documents', params);
  }

  async createComplianceDocument(data: Record<string, unknown>) {
    return this.post('/inventory/compliance-documents', data);
  }

  async deleteComplianceDocument(id: string) {
    return this.delete(`/inventory/compliance-documents/${id}`);
  }

  // ── Phase 5: Analytics ────────────────────────
  async getCurrentKpis() {
    return this.get('/inventory/analytics/current-kpis');
  }

  async getDailyAnalytics(params?: Record<string, string>) {
    return this.get('/inventory/analytics/daily', params);
  }

  async getKpiSnapshots(params?: Record<string, string>) {
    return this.get('/inventory/analytics/kpis', params);
  }

  async getStockValueByWarehouse() {
    return this.get('/inventory/analytics/stock-value');
  }

  async getTrendData(params?: Record<string, string>) {
    return this.get('/inventory/analytics/trend', params);
  }

  // ── Phase 5: Search ─────────────────────────
  async globalSearch(params?: Record<string, string>) {
    return this.get('/inventory/search', params);
  }

  // ── Phase 5: Import/Export ──────────────────
  async previewImport(data: Record<string, unknown>) {
    return this.post('/inventory/import/preview', data);
  }

  async commitImport(jobId: string) {
    return this.post(`/inventory/import/${jobId}/commit`);
  }

  async listImportJobs(params?: Record<string, string>) {
    return this.get('/inventory/import/jobs', params);
  }

  async getImportJob(jobId: string) {
    return this.get(`/inventory/import/jobs/${jobId}`);
  }

  async exportData(data: Record<string, unknown>) {
    return this.post('/inventory/export', data);
  }

  async getExportTemplates() {
    return this.get('/inventory/export/templates');
  }

  // ── Phase 5: Saved Filters ─────────────────
  async listSavedFilters(params?: Record<string, string>) {
    return this.get('/inventory/saved-filters', params);
  }

  async createSavedFilter(data: Record<string, unknown>) {
    return this.post('/inventory/saved-filters', data);
  }

  async deleteSavedFilter(id: string) {
    return this.delete(`/inventory/saved-filters/${id}`);
  }

  // ── Phase 6: Offline Sync ─────────────────────
  async uploadSyncActions(data: Record<string, unknown>) {
    return this.post('/inventory/sync/upload', data);
  }

  async getSyncConflicts() {
    return this.get('/inventory/sync/conflicts');
  }

  async resolveSyncConflict(id: string, data: Record<string, unknown>) {
    return this.patch(`/inventory/sync/conflicts/${id}/resolve`, data);
  }

  async retrySyncFailed() {
    return this.post('/inventory/sync/retry');
  }

  async getSyncStats() {
    return this.get('/inventory/sync/stats');
  }

  // ── Helpers ───────────────────────────────────
  async seedInventoryData() {
    await this.ensureNumberSeries();
    const warehouses = await this.listWarehouses();
    let warehouseId: string;
    if (warehouses?.data?.length > 0) {
      warehouseId = warehouses.data[0].id;
    } else {
      const wh = await this.createWarehouse({ code: 'WH-E2E', name: 'E2E Test Warehouse' });
      warehouseId = wh.data.id;
    }
    return { warehouseId };
  }

  private async ensureNumberSeries() {
    const screens = [
      { code: 'TXN', linkedScreen: 'Inventory Transaction', prefix: 'TXN-' },
      { code: 'GRN', linkedScreen: 'Goods Receipt Note', prefix: 'GRN-' },
      { code: 'DSP', linkedScreen: 'Dispatch Note', prefix: 'DSP-' },
      { code: 'CNT', linkedScreen: 'Stock Count', prefix: 'CNT-' },
    ];
    const existing = await this.get('/company/no-series');
    const existingScreens = new Set(
      (existing?.data ?? []).map((ns: Record<string, unknown>) => ns.linkedScreen),
    );
    for (const screen of screens) {
      if (existingScreens.has(screen.linkedScreen)) continue;
      await this.post('/company/no-series', {
        code: screen.code,
        linkedScreen: screen.linkedScreen,
        prefix: screen.prefix,
        startNumber: 1,
        numberCount: 5,
      });
    }
  }
}
