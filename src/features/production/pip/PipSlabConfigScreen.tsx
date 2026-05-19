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
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportMenu } from '@/components/analytics/ExportMenu';
import { usePipSlabConfigs } from '@/features/production/pip/api/use-pip-queries';
import {
  useUpdatePipSlabConfig,
  useDeletePipSlabConfig,
} from '@/features/production/pip/api/use-pip-mutations';
import { useParts, useMachines } from '@/features/masters/api/use-masters-queries';
import { SlabConfigModal } from '@/features/production/pip/components/SlabConfigModal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showSuccess, showApiError } from '@/lib/toast';
import type { PipSlabConfig, SlabTier } from '@/lib/api/pip';
import type { Part, Machine } from '@/lib/api/masters';

/* ── Constants ── */

const PAGE_SIZE = 20;

/* ── Edit Modal ── */

interface EditFormState {
  shiftTargetQty: string;
  slabTiers: { fromQty: string; toQty: string; ratePerPiece: string }[];
}

function EditSlabModal({
  config,
  onClose,
  onSaved,
}: {
  config: PipSlabConfig;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateMutation = useUpdatePipSlabConfig();

  const [form, setForm] = useState<EditFormState>({
    shiftTargetQty: String(config.shiftTargetQty),
    slabTiers: config.slabTiers.map((t) => ({
      fromQty: String(t.fromQty),
      toQty: t.toQty != null ? String(t.toQty) : '',
      ratePerPiece: String(t.ratePerPiece),
    })),
  });

  const addTier = () => {
    const last = form.slabTiers[form.slabTiers.length - 1];
    const nextFrom = last?.toQty ? String(Number(last.toQty) + 1) : '';
    setForm((f) => ({
      ...f,
      slabTiers: [...f.slabTiers, { fromQty: nextFrom, toQty: '', ratePerPiece: '' }],
    }));
  };

  const updateTier = (idx: number, field: string, value: string) => {
    setForm((f) => {
      const tiers = [...f.slabTiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      return { ...f, slabTiers: tiers };
    });
  };

  const removeTier = (idx: number) => {
    setForm((f) => ({
      ...f,
      slabTiers: f.slabTiers.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!form.shiftTargetQty || Number(form.shiftTargetQty) < 1) {
      showApiError({ message: 'Shift target qty is required' });
      return;
    }
    for (const tier of form.slabTiers) {
      if (!tier.fromQty || !tier.ratePerPiece) {
        showApiError({ message: 'From Qty and Rate are required for all tiers' });
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: config.id,
        data: {
          shiftTargetQty: Number(form.shiftTargetQty),
          slabTiers: form.slabTiers.map((t) => ({
            fromQty: Number(t.fromQty),
            toQty: t.toQty ? Number(t.toQty) : null,
            ratePerPiece: Number(t.ratePerPiece),
          })),
        },
      });
      showSuccess('Config Updated', 'Slab configuration has been updated.');
      onSaved();
      onClose();
    } catch (err) {
      showApiError(err);
    }
  };

  const saving = updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Edit Slab Config</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {config.machine?.assetCode} &mdash; {config.part?.partNumber} ({config.part?.name})
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
          {/* Shift Target */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Shift Target Qty <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={form.shiftTargetQty}
              onChange={(e) => setForm((f) => ({ ...f, shiftTargetQty: e.target.value }))}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            />
          </div>

          {/* Slab Tiers */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              Slab Tiers
            </p>
            <div className="space-y-2">
              {form.slabTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={tier.fromQty}
                    onChange={(e) => updateTier(idx, 'fromQty', e.target.value)}
                    placeholder="From"
                    className="flex-1 px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                  <input
                    type="number"
                    min={0}
                    value={tier.toQty}
                    onChange={(e) => updateTier(idx, 'toQty', e.target.value)}
                    placeholder="To (\u221e)"
                    className="flex-1 px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.ratePerPiece}
                    onChange={(e) => updateTier(idx, 'ratePerPiece', e.target.value)}
                    placeholder="\u20b9/pc"
                    className="flex-1 px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(idx)}
                    className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTier}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <Plus size={14} />
              Add Tier
            </button>
          </div>
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
            {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Slab Tier Badge ── */

function SlabBadge({ tier }: { tier: SlabTier }) {
  const to = tier.toQty != null ? tier.toQty : '\u221e';
  const label = `${tier.fromQty}\u2013${to}:\u20b9${tier.ratePerPiece}`;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50 whitespace-nowrap">
      {label}
    </span>
  );
}

/* ── Screen ── */

export function PipSlabConfigScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    return params;
  }, [page, search]);

  const { data: slabData, isLoading, isError } = usePipSlabConfigs(queryParams);
  const { data: partsData } = useParts({ limit: 500, status: 'ACTIVE' });
  const { data: machinesData } = useMachines({ limit: 500 });

  const slabConfigs: PipSlabConfig[] = slabData?.data ?? [];
  const meta = slabData?.meta;
  const allParts: Part[] = partsData?.data ?? [];
  const allMachines: Machine[] = machinesData?.data ?? [];

  const deleteMutation = useDeletePipSlabConfig();

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PipSlabConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PipSlabConfig | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('Config Deleted', 'Slab configuration has been removed.');
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
            Slab Configuration
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Define incentive rules per machine-operation-part combination
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          Add Slab Config
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-2xl p-5">
        <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
        <p className="text-sm text-primary-800 dark:text-primary-300 leading-relaxed">
          Select machine(s), operation(s), and part(s). For each part set the shift target qty and add slab tiers with rates. On save each combination is stored as its own row below.
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by machine code, operation, part no or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>
          <ExportMenu reportType="pip-slab-config" filters={{}} />
        </div>
      </div>

      {isError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
          Failed to load slab configurations. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Machine</th>
                  <th className="py-4 px-6 font-bold">Operation</th>
                  <th className="py-4 px-6 font-bold">Part No</th>
                  <th className="py-4 px-6 font-bold">Part Name</th>
                  <th className="py-4 px-6 font-bold">Shift Target</th>
                  <th className="py-4 px-6 font-bold">Slab Tiers</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {slabConfigs.map((config) => (
                  <tr
                    key={config.id}
                    className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    {/* Machine */}
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary-950 dark:text-white">
                          {config.machine?.assetCode ?? '--'}
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {config.machine?.assetName ?? ''}
                        </p>
                      </div>
                    </td>
                    {/* Operation */}
                    <td className="py-4 px-6">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[10px] font-bold">
                          {config.operation?.code ?? '--'}
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {config.operation?.name ?? ''}
                        </p>
                      </div>
                    </td>
                    {/* Part No */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-mono text-xs font-bold border border-primary-100 dark:border-primary-800/50">
                        {config.part?.partNumber ?? '--'}
                      </span>
                    </td>
                    {/* Part Name */}
                    <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                      {config.part?.name ?? '--'}
                    </td>
                    {/* Shift Target */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary-950 dark:text-white">
                        {config.shiftTargetQty}
                      </span>
                      <span className="text-xs text-neutral-400 ml-1">pcs</span>
                    </td>
                    {/* Slab Tiers */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {config.slabTiers.map((tier, i) => (
                          <SlabBadge key={i} tier={tier} />
                        ))}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                          config.isActive
                            ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-400 dark:border-neutral-700',
                        )}
                      >
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingConfig(config)}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(config)}
                          className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slabConfigs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon="list"
                        title="No slab configurations found"
                        message="Add your first slab configuration to define incentive rules."
                        action={{ label: 'Add Slab Config', onClick: () => setAddModalOpen(true) }}
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

      {/* Add Modal (3-step) */}
      <SlabConfigModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={() => {}}
        machines={allMachines}
        parts={allParts}
      />

      {/* Edit Modal */}
      {editingConfig && (
        <EditSlabModal
          config={editingConfig}
          onClose={() => setEditingConfig(null)}
          onSaved={() => {}}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">
              Delete Slab Config?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This will permanently delete the slab configuration for{' '}
              <strong>{deleteTarget.machine?.assetCode}</strong> &mdash;{' '}
              <strong>{deleteTarget.part?.partNumber}</strong>. Daily entries referencing this config
              will not be affected.
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
