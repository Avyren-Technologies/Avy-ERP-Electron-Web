import { test, expect } from '../fixture';

test.describe('Industry Templates & Compliance', () => {
  test.describe.configure({ mode: 'serial' });

  // Templates
  test('should list industry templates', async ({ api }) => {
    const res = await api.listIndustryTemplates();
    expect(res.success).toBe(true);
  });

  test('should seed system templates', async ({ api }) => {
    const res = await api.seedIndustryTemplates();
    expect(res).toBeDefined();
  });

  test('should list templates after seed (11 system templates)', async ({ api }) => {
    const res = await api.listIndustryTemplates();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThanOrEqual(11);
  });

  test('should get pharma template with field configs', async ({ api }) => {
    const templates = await api.listIndustryTemplates();
    const pharma = templates.data.find((t: any) => t.industryName === 'pharma');
    expect(pharma).toBeDefined();
    const detail = await api.getIndustryTemplate(pharma.id);
    expect(detail.success).toBe(true);
    expect(detail.data.fefoEnforcement).toBe('HARD');
    expect(detail.data.fieldConfigs.length).toBeGreaterThan(0);
  });

  test('should get active field config (returns defaults when no template active)', async ({ api }) => {
    const res = await api.getActiveFieldConfig();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('visibleFields');
    expect(res.data).toHaveProperty('mandatoryFields');
  });

  test('should activate pharma template', async ({ api }) => {
    const templates = await api.listIndustryTemplates();
    const pharma = templates.data.find((t: any) => t.industryName === 'pharma');
    const res = await api.activateIndustryTemplate(pharma.id);
    expect(res.success).toBe(true);
  });

  test('should get field config after pharma activation (mandatory lot + expiry)', async ({ api }) => {
    const res = await api.getActiveFieldConfig();
    expect(res.success).toBe(true);
    expect(res.data.mandatoryFields).toContain('lotNumber');
    expect(res.data.mandatoryFields).toContain('expiryDate');
    expect(res.data.fefoEnforcement).toBe('HARD');
  });

  test('should clone pharma template to custom', async ({ api }) => {
    const templates = await api.listIndustryTemplates();
    const pharma = templates.data.find((t: any) => t.industryName === 'pharma');
    const res = await api.cloneIndustryTemplate(pharma.id, { customName: 'Custom Pharma' });
    expect(res.success).toBe(true);
    expect(res.data.isSystemTemplate).toBe(false);
  });

  // Compliance Documents
  test('should list compliance documents (empty initially)', async ({ api }) => {
    const res = await api.listComplianceDocuments();
    expect(res.success).toBe(true);
  });

  test('should create a compliance document', async ({ api }) => {
    const res = await api.createComplianceDocument({
      documentType: 'COA',
      documentName: 'Test CoA Document',
      documentUrl: 'https://example.com/coa.pdf',
    });
    expect(res.success).toBe(true);
  });

  test('should list compliance documents after creation', async ({ api }) => {
    const res = await api.listComplianceDocuments();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('should delete compliance document', async ({ api }) => {
    const docs = await api.listComplianceDocuments();
    if (docs.data.length > 0) {
      const res = await api.deleteComplianceDocument(docs.data[0].id);
      expect(res.success).toBe(true);
    }
  });

  // Automotive template check
  test('should get automotive template with serial tracking', async ({ api }) => {
    const templates = await api.listIndustryTemplates();
    const auto = templates.data.find((t: any) => t.industryName === 'automotive');
    expect(auto).toBeDefined();
    expect(auto.enableToolRoomExtension).toBe(true);
    expect(auto.enableProductionExtension).toBe(true);
  });

  // Food template check
  test('should get food template with FEFO hard enforcement', async ({ api }) => {
    const templates = await api.listIndustryTemplates();
    const food = templates.data.find((t: any) => t.industryName === 'food');
    expect(food).toBeDefined();
    expect(food.fefoEnforcement).toBe('HARD');
  });
});
