import { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  X,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-utils';
import { useCompanyProfile } from '@/features/company-admin/api/use-company-admin-queries';
import { useParts, usePartCategories, useProductModels, useUoms } from '@/features/masters/api/use-masters-queries';
import {
  useCreatePart,
  useUpdatePart,
  useDeletePart,
  useCreatePartCategory,
  useCreateProductModel,
  useCreateUom,
} from '@/features/masters/api/use-masters-mutations';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showSuccess, showApiError } from '@/lib/toast';
import type { Part, PartCategory, ProductModel, UnitOfMeasure } from '@/lib/api/masters';

/* ── Constants ── */

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
];

const PART_TYPE_OPTIONS = [
  { value: 'FINISH_PART', label: 'Finished Part' },
  { value: 'SEMI_FINISHED', label: 'Semi Finished' },
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'SPARE', label: 'Spare' },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50',
  INACTIVE: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-400 dark:border-neutral-700',
  DISCONTINUED: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
};

const PAGE_SIZE = 20;

/* ── Form State ── */

interface PartFormState {
  name: string;
  partNumber: string;
  engineeringPartNo: string;
  productModelId: string;
  categoryId: string;
  uomId: string;
  partType: string;
  hsnCode: string;
  weight: string;
  dimensions: string;
  revision: string;
  drawingReference: string;
  status: string;
  isBatchTracked: boolean;
  isSerialTracked: boolean;
  isBomEnabled: boolean;
  isQcRequired: boolean;
  isInventoryItem: boolean;
}

const EMPTY_FORM: PartFormState = {
  name: '',
  partNumber: '',
  engineeringPartNo: '',
  productModelId: '',
  categoryId: '',
  uomId: '',
  partType: 'FINISH_PART',
  hsnCode: '',
  weight: '',
  dimensions: '',
  revision: '',
  drawingReference: '',
  status: 'ACTIVE',
  isBatchTracked: false,
  isSerialTracked: false,
  isBomEnabled: false,
  isQcRequired: false,
  isInventoryItem: true,
};

/* ── Shared Form Components ── */

function FormField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'w-10 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5',
          checked ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700',
        )}
      >
        <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all', checked ? 'left-5' : 'left-1')} />
      </button>
      <div>
        <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
        {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

/* ── Inline Create Dropdown ── */

function DropdownWithCreate({ label, value, onChange, options, onCreateNew, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  onCreateNew: () => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-3 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-xs font-bold transition-colors whitespace-nowrap"
        >
          + New
        </button>
      </div>
    </div>
  );
}

/* ── Inline Create Mini-Modal ── */

function InlineCreateModal({ title, fields, onSave, onCancel, saving }: {
  title: string;
  fields: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-primary-950 dark:text-white">{title}</h3>
        {fields.map((f, i) => (
          <FormField key={i} label={f.label} value={f.value} onChange={f.onChange} placeholder={f.placeholder} />
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Screen ── */

export function PartMasterScreen() {
  // Data queries
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [page, search, statusFilter]);

  const { data: partsData, isLoading, isError } = useParts(queryParams);
  const { data: categoriesData } = usePartCategories();
  const { data: modelsData } = useProductModels();
  const { data: uomsData } = useUoms();
  const { data: profileData } = useCompanyProfile();

  const parts: Part[] = partsData?.data ?? [];
  const meta = partsData?.meta;
  const categories: PartCategory[] = categoriesData?.data ?? [];
  const productModels: ProductModel[] = modelsData?.data ?? [];
  const uoms: UnitOfMeasure[] = uomsData?.data ?? [];

  // Mutations
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const deleteMutation = useDeletePart();
  const createCategoryMutation = useCreatePartCategory();
  const createModelMutation = useCreateProductModel();
  const createUomMutation = useCreateUom();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartFormState>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);

  // Inline create modals
  const [inlineCreate, setInlineCreate] = useState<'category' | 'model' | 'uom' | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlineCode, setInlineCode] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (part: Part) => {
    setEditingId(part.id);
    setForm({
      name: part.name,
      partNumber: part.partNumber,
      engineeringPartNo: part.engineeringPartNo ?? '',
      productModelId: part.productModelId ?? '',
      categoryId: part.categoryId ?? '',
      uomId: part.uomId ?? '',
      partType: part.partType,
      hsnCode: part.hsnCode ?? '',
      weight: part.weight != null ? String(part.weight) : '',
      dimensions: part.dimensions ?? '',
      revision: part.revision ?? '',
      drawingReference: part.drawingReference ?? '',
      status: part.status,
      isBatchTracked: part.isBatchTracked,
      isSerialTracked: part.isSerialTracked,
      isBomEnabled: part.isBomEnabled,
      isQcRequired: part.isQcRequired,
      isInventoryItem: part.isInventoryItem,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showApiError({ message: 'Component / Part name is required' });
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        partType: form.partType,
        status: form.status,
        isBatchTracked: form.isBatchTracked,
        isSerialTracked: form.isSerialTracked,
        isBomEnabled: form.isBomEnabled,
        isQcRequired: form.isQcRequired,
        isInventoryItem: form.isInventoryItem,
      };
      if (form.partNumber.trim()) payload.partNumber = form.partNumber.trim();
      if (form.engineeringPartNo) payload.engineeringPartNo = form.engineeringPartNo.trim();
      if (form.productModelId) payload.productModelId = form.productModelId;
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.uomId) payload.uomId = form.uomId;
      if (form.hsnCode) payload.hsnCode = form.hsnCode.trim();
      if (form.weight) payload.weight = parseFloat(form.weight);
      if (form.dimensions) payload.dimensions = form.dimensions.trim();
      if (form.revision) payload.revision = form.revision.trim();
      if (form.drawingReference) payload.drawingReference = form.drawingReference.trim();

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        showSuccess('Part Updated', `${form.name} has been updated.`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        const newPartNumber = result?.data?.partNumber ?? '';
        showSuccess('Part Created', `${form.name} (${newPartNumber}) has been added.`);
      }
      setModalOpen(false);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('Part Deleted', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleInlineCreate = async () => {
    if (!inlineName.trim()) {
      showApiError({ message: 'Name is required' });
      return;
    }
    try {
      if (inlineCreate === 'category') {
        const res = await createCategoryMutation.mutateAsync({ name: inlineName.trim(), code: inlineCode.trim() || undefined });
        const newId = res?.data?.id;
        if (newId) setForm((p) => ({ ...p, categoryId: newId }));
        showSuccess('Category Created', `${inlineName} has been added.`);
      } else if (inlineCreate === 'model') {
        const res = await createModelMutation.mutateAsync({ name: inlineName.trim(), code: inlineCode.trim() || undefined });
        const newId = res?.data?.id;
        if (newId) setForm((p) => ({ ...p, productModelId: newId }));
        showSuccess('Product Model Created', `${inlineName} has been added.`);
      } else if (inlineCreate === 'uom') {
        const res = await createUomMutation.mutateAsync({ name: inlineName.trim(), abbreviation: inlineCode.trim() });
        const newId = res?.data?.id;
        if (newId) setForm((p) => ({ ...p, uomId: newId }));
        showSuccess('UOM Created', `${inlineName} has been added.`);
      }
      setInlineCreate(null);
      setInlineName('');
      setInlineCode('');
    } catch (err) {
      showApiError(err);
    }
  };

  const handleExport = () => {
    const headers = [
      'Part No', 'Name', 'Product Model', 'Engineering Part No', 'Category', 'UOM',
      'Part Type', 'HSN Code', 'Weight (kg)', 'Dimensions', 'Revision', 'Drawing Reference',
      'Status', 'Batch Tracked', 'Serial Tracked', 'BOM Enabled', 'QC Required', 'Inventory Item',
    ];
    const rows = parts.map((p) => [
      p.partNumber,
      p.name,
      p.productModel?.name ?? '',
      p.engineeringPartNo ?? '',
      p.category?.name ?? '',
      p.uom ? `${p.uom.name} (${p.uom.abbreviation})` : '',
      p.partType,
      p.hsnCode ?? '',
      p.weight != null ? p.weight : '',
      p.dimensions ?? '',
      p.revision ?? '',
      p.drawingReference ?? '',
      p.status,
      p.isBatchTracked ? 'Yes' : 'No',
      p.isSerialTracked ? 'Yes' : 'No',
      p.isBomEnabled ? 'Yes' : 'No',
      p.isQcRequired ? 'Yes' : 'No',
      p.isInventoryItem ? 'Yes' : 'No',
    ]);
    const companyName = profileData?.data?.name ?? profileData?.data?.displayName ?? '';
    exportToExcel(headers, rows, {
      fileName: 'parts-export',
      sheetName: 'Part Master',
      companyName,
      title: 'Part Master Report',
      reportDate: new Date().toLocaleDateString(),
    });
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const inlineSaving = createCategoryMutation.isPending || createModelMutation.isPending || createUomMutation.isPending;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Part Master</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Catalogue of finish parts produced in the factory</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          New Part
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by part no or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
          Failed to load parts. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Part No</th>
                  <th className="py-4 px-6 font-bold">Component / Part</th>
                  <th className="py-4 px-6 font-bold">Product Model</th>
                  <th className="py-4 px-6 font-bold">Engineering Part No</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {parts.map((part) => (
                  <tr key={part.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-mono text-xs font-bold border border-primary-100 dark:border-primary-800/50">
                        {part.partNumber}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                        </div>
                        <span className="font-bold text-primary-950 dark:text-white">{part.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                      {part.productModel?.name ?? <span className="text-neutral-400">--</span>}
                    </td>
                    <td className="py-4 px-6">
                      {part.engineeringPartNo ? (
                        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{part.engineeringPartNo}</span>
                      ) : (
                        <span className="text-neutral-400">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn('inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border', STATUS_BADGE[part.status] ?? STATUS_BADGE.INACTIVE)}>
                        {part.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(part)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(part)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {parts.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon="list" title="No parts found" message="Add your first part to the catalogue." action={{ label: 'New Part', onClick: openCreate }} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? 'Edit Part' : 'Add Part'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Row 1: Name + Product Model */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Component / Part" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Crankshaft Assembly" required />
                <DropdownWithCreate
                  label="Product Model"
                  value={form.productModelId}
                  onChange={(v) => setForm((p) => ({ ...p, productModelId: v }))}
                  options={productModels.filter((m) => m.isActive).map((m) => ({ value: m.id, label: m.name }))}
                  onCreateNew={() => { setInlineCreate('model'); setInlineName(''); setInlineCode(''); }}
                />
              </div>

              {/* Row 2: Engineering Part No + Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Engineering Part No" value={form.engineeringPartNo} onChange={(v) => setForm((p) => ({ ...p, engineeringPartNo: v }))} placeholder="e.g. ENG-CS-001" />
                <FormSelect
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'DISCONTINUED', label: 'Discontinued' },
                  ]}
                />
              </div>

              {/* Row 3: Part Number (full width — auto-generated if left blank) */}
              <FormField label="Part Number" value={form.partNumber} onChange={(v) => setForm((p) => ({ ...p, partNumber: v }))} placeholder={editingId ? 'Part number' : 'Leave blank to auto-generate from Number Series'} />

              {/* Row 4: Category + UOM + Part Type */}
              <div className="grid grid-cols-3 gap-4">
                <DropdownWithCreate
                  label="Category"
                  value={form.categoryId}
                  onChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
                  options={categories.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name }))}
                  onCreateNew={() => { setInlineCreate('category'); setInlineName(''); setInlineCode(''); }}
                />
                <DropdownWithCreate
                  label="Unit of Measure"
                  value={form.uomId}
                  onChange={(v) => setForm((p) => ({ ...p, uomId: v }))}
                  options={uoms.filter((u) => u.isActive).map((u) => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
                  onCreateNew={() => { setInlineCreate('uom'); setInlineName(''); setInlineCode(''); }}
                />
                <FormSelect label="Part Type" value={form.partType} onChange={(v) => setForm((p) => ({ ...p, partType: v }))} options={PART_TYPE_OPTIONS} />
              </div>

              {/* Row 5: HSN Code + Weight + Dimensions */}
              <div className="grid grid-cols-3 gap-4">
                <FormField label="HSN Code" value={form.hsnCode} onChange={(v) => setForm((p) => ({ ...p, hsnCode: v }))} placeholder="e.g. 8483" />
                <FormField label="Weight (kg)" value={form.weight} onChange={(v) => setForm((p) => ({ ...p, weight: v }))} placeholder="e.g. 12.5" type="number" />
                <FormField label="Dimensions" value={form.dimensions} onChange={(v) => setForm((p) => ({ ...p, dimensions: v }))} placeholder="e.g. 300x200x150mm" />
              </div>

              {/* Row 6: Revision + Drawing Reference */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Revision" value={form.revision} onChange={(v) => setForm((p) => ({ ...p, revision: v }))} placeholder="e.g. Rev A" />
                <FormField label="Drawing Reference" value={form.drawingReference} onChange={(v) => setForm((p) => ({ ...p, drawingReference: v }))} placeholder="e.g. DWG-CS-001-A" />
              </div>

              {/* Capability Toggles */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Capabilities</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormToggle label="Batch Tracked" description="Track parts in batches" checked={form.isBatchTracked} onChange={(v) => setForm((p) => ({ ...p, isBatchTracked: v }))} />
                  <FormToggle label="Serial Tracked" description="Track individual serial numbers" checked={form.isSerialTracked} onChange={(v) => setForm((p) => ({ ...p, isSerialTracked: v }))} />
                  <FormToggle label="BOM Enabled" description="Part has a Bill of Materials" checked={form.isBomEnabled} onChange={(v) => setForm((p) => ({ ...p, isBomEnabled: v }))} />
                  <FormToggle label="QC Required" description="Quality check required" checked={form.isQcRequired} onChange={(v) => setForm((p) => ({ ...p, isQcRequired: v }))} />
                  <FormToggle label="Inventory Item" description="Tracked in inventory" checked={form.isInventoryItem} onChange={(v) => setForm((p) => ({ ...p, isInventoryItem: v }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline Create Modals ── */}
      {inlineCreate === 'category' && (
        <InlineCreateModal
          title="New Part Category"
          fields={[
            { label: 'Name', value: inlineName, onChange: setInlineName, placeholder: 'e.g. Engine Components' },
            { label: 'Code', value: inlineCode, onChange: setInlineCode, placeholder: 'e.g. ENG (optional)' },
          ]}
          onSave={handleInlineCreate}
          onCancel={() => setInlineCreate(null)}
          saving={inlineSaving}
        />
      )}
      {inlineCreate === 'model' && (
        <InlineCreateModal
          title="New Product Model"
          fields={[
            { label: 'Name', value: inlineName, onChange: setInlineName, placeholder: 'e.g. Model X-100' },
            { label: 'Code', value: inlineCode, onChange: setInlineCode, placeholder: 'e.g. X100 (optional)' },
          ]}
          onSave={handleInlineCreate}
          onCancel={() => setInlineCreate(null)}
          saving={inlineSaving}
        />
      )}
      {inlineCreate === 'uom' && (
        <InlineCreateModal
          title="New Unit of Measure"
          fields={[
            { label: 'Name', value: inlineName, onChange: setInlineName, placeholder: 'e.g. Kilogram' },
            { label: 'Abbreviation', value: inlineCode, onChange: setInlineCode, placeholder: 'e.g. kg' },
          ]}
          onSave={handleInlineCreate}
          onCancel={() => setInlineCreate(null)}
          saving={inlineSaving}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Part?</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This will permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.partNumber}). If this part is referenced in slab configurations, the delete will fail.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
