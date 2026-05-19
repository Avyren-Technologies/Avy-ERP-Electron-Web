import { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperations, useProcessCategories } from '@/features/production/pip/api/use-pip-queries';
import {
  useCreateOperation,
  useUpdateOperation,
  useDeleteOperation,
  useCreateProcessCategory,
  useUpdateProcessCategory,
  useDeleteProcessCategory,
} from '@/features/production/pip/api/use-pip-mutations';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ManageModal } from '@/components/ui/ManageModal';
import { showSuccess, showApiError } from '@/lib/toast';
import type { Operation, ProcessCategory } from '@/lib/api/pip';

/* ── Constants ── */

const PAGE_SIZE = 20;

const PROCESS_CATEGORY_BADGE = 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50';

/* ── Create/Edit Modal ── */

interface OperationFormState {
  name: string;
  processCategoryId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function OperationModal({
  operation,
  onClose,
  onSaved,
  processCategories,
  onManageCategories,
}: {
  operation: Operation | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
  processCategories: ProcessCategory[];
  onManageCategories: () => void;
}) {
  const isEdit = !!operation;
  const createMutation = useCreateOperation();
  const updateMutation = useUpdateOperation();

  const [form, setForm] = useState<OperationFormState>({
    name: operation?.name ?? '',
    processCategoryId: operation?.processCategoryId ?? '',
    status: (operation?.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      showApiError({ message: 'Operation Name is required' });
      return;
    }

    try {
      if (isEdit && operation) {
        await updateMutation.mutateAsync({
          id: operation.id,
          data: {
            name: form.name.trim(),
            processCategoryId: form.processCategoryId || undefined,
            status: form.status,
          },
        });
        showSuccess('Operation Updated', 'Operation has been updated successfully.');
      } else {
        await createMutation.mutateAsync({
          name: form.name.trim(),
          processCategoryId: form.processCategoryId || undefined,
        });
        showSuccess('Operation Created', 'New operation has been created successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      showApiError(err);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">
              {isEdit ? 'Edit Operation' : 'Add Operation'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEdit ? `Editing ${operation.code}` : 'Create a new production operation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Operation Number (read-only / auto-generated) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Operation Number
            </label>
            <input
              type="text"
              value={isEdit ? (operation?.operationNumber ?? '') : ''}
              readOnly
              disabled
              placeholder="Auto Generated via Number Series"
              className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-500 dark:text-neutral-400 cursor-not-allowed transition-all"
            />
          </div>

          {/* Operation Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Operation Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CNC Turning"
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>

          {/* Process Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Process Category
              </label>
              <button
                type="button"
                onClick={onManageCategories}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <Settings2 size={12} />
                Manage
              </button>
            </div>
            <select
              value={form.processCategoryId}
              onChange={(e) => setForm((f) => ({ ...f, processCategoryId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
              <option value="">-- None --</option>
              {processCategories.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name}{pc.code ? ` (${pc.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Screen ── */

export function PipOperationMasterScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    return params;
  }, [page, search]);

  const { data: opData, isLoading, isError } = useOperations(queryParams);

  const operations: Operation[] = opData?.data ?? [];
  const meta = opData?.meta;

  const deleteMutation = useDeleteOperation();

  // Process categories
  const { data: pcData, isLoading: pcLoading } = useProcessCategories();
  const processCategories: ProcessCategory[] = pcData?.data ?? [];
  const createPcMutation = useCreateProcessCategory();
  const updatePcMutation = useUpdateProcessCategory();
  const deletePcMutation = useDeleteProcessCategory();
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Operation | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('Operation Deleted', 'Operation has been removed.');
      setDeleteTarget(null);
    } catch (err) {
      showApiError(err);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            Operation Master
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage production operations and process types
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          Add Operation
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by code, name or operation number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>
        </div>
      </div>

      {isError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
          Failed to load operations. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Operation Code</th>
                  <th className="py-4 px-6 font-bold">Operation Number</th>
                  <th className="py-4 px-6 font-bold">Operation Name</th>
                  <th className="py-4 px-6 font-bold">Process Category</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {operations.map((op) => (
                  <tr
                    key={op.id}
                    className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* Operation Code */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-mono text-xs font-bold border border-primary-100 dark:border-primary-800/50">
                        {op.code}
                      </span>
                    </td>
                    {/* Operation Number */}
                    <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">
                      {op.operationNumber}
                    </td>
                    {/* Operation Name */}
                    <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">
                      {op.name}
                    </td>
                    {/* Process Category */}
                    <td className="py-4 px-6">
                      {(op.processCategory?.name ?? op.processType) ? (
                        <span
                          className={cn(
                            'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                            PROCESS_CATEGORY_BADGE,
                          )}
                        >
                          {op.processCategory?.name ?? op.processType}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">--</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                          op.status === 'ACTIVE'
                            ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-400 dark:border-neutral-700',
                        )}
                      >
                        {op.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingOperation(op)}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(op)}
                          className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {operations.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon="list"
                        title="No operations found"
                        message="Add your first operation to define production process types."
                        action={{ label: 'Add Operation', onClick: () => setAddModalOpen(true) }}
                      />
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
              Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, meta.total)} of{' '}
              {meta.total}
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

      {/* Add Modal */}
      {addModalOpen && (
        <OperationModal
          operation={null}
          onClose={() => setAddModalOpen(false)}
          onSaved={() => {}}
          processCategories={processCategories}
          onManageCategories={() => setManageCategoriesOpen(true)}
        />
      )}

      {/* Edit Modal */}
      {editingOperation && (
        <OperationModal
          operation={editingOperation}
          onClose={() => setEditingOperation(null)}
          onSaved={() => {}}
          processCategories={processCategories}
          onManageCategories={() => setManageCategoriesOpen(true)}
        />
      )}

      {/* Manage Process Categories Modal */}
      <ManageModal
        open={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        title="Process Categories"
        items={processCategories.map((pc) => ({ id: pc.id, name: pc.name, code: pc.code ?? null }))}
        isLoading={pcLoading}
        createFields={[
          { key: 'name', label: 'Name', placeholder: 'e.g. Machining', required: true },
          { key: 'code', label: 'Code', placeholder: 'e.g. MACH' },
        ]}
        onCreate={async (values) => {
          await createPcMutation.mutateAsync({ name: values.name, code: values.code || undefined });
          showSuccess('Created', 'Process category created.');
        }}
        onUpdate={async (id, values) => {
          await updatePcMutation.mutateAsync({ id, data: { name: values.name } });
          showSuccess('Updated', 'Process category updated.');
        }}
        onDelete={async (id) => {
          await deletePcMutation.mutateAsync(id);
          showSuccess('Deleted', 'Process category deleted.');
        }}
        isCreating={createPcMutation.isPending}
        isUpdating={updatePcMutation.isPending}
        isDeleting={deletePcMutation.isPending}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">
              Delete Operation?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This will permanently delete the operation{' '}
              <strong>{deleteTarget.code}</strong> &mdash;{' '}
              <strong>{deleteTarget.name}</strong>. Slab configurations referencing this operation
              may be affected.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
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
