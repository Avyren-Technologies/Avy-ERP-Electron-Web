import { test, expect } from '../fixture';

test.describe('Inventory Import/Export', () => {
  test.describe.configure({ mode: 'serial' });

  let importJobId: string;

  test('should preview import with valid data', async ({ api }) => {
    const csvContent = 'partNumber,warehouseCode,quantity,uom\nTEST-001,WH-TEST,100,KG';
    const res = await api.previewImport({ entityType: 'opening-stock', csvContent });
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('jobId');
    expect(res.data).toHaveProperty('totalRows');
    importJobId = res.data.jobId;
  });

  test('should get import job detail', async ({ api }) => {
    if (!importJobId) return;
    const res = await api.getImportJob(importJobId);
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('PENDING');
  });

  test('should list import jobs', async ({ api }) => {
    const res = await api.listImportJobs();
    expect(res.success).toBe(true);
  });

  test('should get export templates', async ({ api }) => {
    const res = await api.getExportTemplates();
    expect(res.success).toBe(true);
  });

  test('should export stock on hand', async ({ api }) => {
    const res = await api.exportData({ entityType: 'stock-on-hand', filters: {} });
    expect(res).toBeDefined();
  });
});
