import { useState, useMemo } from 'react';
import { X, Search, Plus, Trash2, Loader2, ChevronRight, ChevronLeft, Check, Info, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBulkCreatePipSlabConfigs } from '@/features/production/pip/api/use-pip-mutations';
import { useOperations } from '@/features/production/pip/api/use-pip-queries';
import { showSuccess, showApiError } from '@/lib/toast';
import type { Part, Machine } from '@/lib/api/masters';

/* ── Types ── */

interface SlabTierForm {
  fromQty: string;
  toQty: string; // empty = infinity
  ratePerPiece: string;
}

interface PartConfigForm {
  partId: string;
  partNumber: string;
  partName: string;
  shiftTargetQty: string;
  slabTiers: SlabTierForm[];
}

interface SlabConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  machines: Machine[];
  parts: Part[];
}

const EMPTY_TIER: SlabTierForm = { fromQty: '', toQty: '', ratePerPiece: '' };

/* ── Searchable Checkbox Dropdown ── */

function CheckboxDropdown<T extends { id: string }>({
  label,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  renderItem,
  searchPlaceholder,
}: {
  label: string;
  items: T[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  renderItem: (item: T) => React.ReactNode;
  searchPlaceholder: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((item) => {
      const m = item as unknown as Record<string, unknown>;
      const text = [m.assetCode, m.assetName, m.partNumber, m.name, m.code, m.operationNumber].filter(Boolean).join(' ').toLowerCase();
      return text.includes(lower);
    });
  }, [items, searchTerm]);

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all flex items-center justify-between"
        >
          <span className={cn(selectedIds.size === 0 && 'text-neutral-400')}>
            {selectedIds.size === 0
              ? `Select ${label.toLowerCase()}...`
              : `${selectedIds.size} selected`}
          </span>
          <ChevronRight
            size={16}
            className={cn('text-neutral-400 transition-transform', dropdownOpen && 'rotate-90')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Select All */}
            <button
              type="button"
              onClick={onSelectAll}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-800 transition-colors"
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  allSelected
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-neutral-300 dark:border-neutral-600',
                )}
              >
                {allSelected && <Check size={10} className="text-white" />}
              </div>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Select All</span>
            </button>

            {/* Items */}
            <div className="overflow-y-auto max-h-44">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      selectedIds.has(item.id)
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-neutral-300 dark:border-neutral-600',
                    )}
                  >
                    {selectedIds.has(item.id) && <Check size={10} className="text-white" />}
                  </div>
                  {renderItem(item)}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-neutral-400 p-3 text-center">No results found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Part Config Card ── */

type PartConfigErrors = {
  shiftTargetQty?: string;
  noTiers?: string;
  tierErrors?: Record<number, string>;
};

function PartConfigCard({
  config,
  onChange,
  onRemove,
  onCopyToAll,
  totalParts,
  errors,
  onClearError,
}: {
  config: PartConfigForm;
  onChange: (updated: PartConfigForm) => void;
  onRemove: () => void;
  onCopyToAll?: () => void;
  totalParts?: number;
  errors?: PartConfigErrors;
  onClearError?: (field: 'shiftTargetQty' | 'noTiers' | 'tier', tierIdx?: number) => void;
}) {
  const addTier = () => {
    const lastTier = config.slabTiers[config.slabTiers.length - 1];
    const nextFrom = lastTier?.toQty ? String(Number(lastTier.toQty) + 1) : '';
    onChange({
      ...config,
      slabTiers: [...config.slabTiers, { ...EMPTY_TIER, fromQty: nextFrom }],
    });
  };

  const updateTier = (idx: number, field: keyof SlabTierForm, value: string) => {
    const tiers = [...config.slabTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    onChange({ ...config, slabTiers: tiers });
    if ((field === 'fromQty' || field === 'ratePerPiece') && onClearError) {
      onClearError('tier', idx);
    }
  };

  const removeTier = (idx: number) => {
    const tiers = config.slabTiers.filter((_, i) => i !== idx);
    onChange({ ...config, slabTiers: tiers });
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-mono text-xs font-bold border border-primary-100 dark:border-primary-800/50">
            {config.partNumber}
          </span>
          <span className="text-sm font-bold text-primary-950 dark:text-white">
            {config.partName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold">
            per selected machine
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
          title="Remove part"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Shift Target */}
      <div className="max-w-xs">
        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Shift Target Qty <span className="text-danger-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          value={config.shiftTargetQty}
          onChange={(e) => {
            onChange({ ...config, shiftTargetQty: e.target.value });
            if (onClearError) onClearError('shiftTargetQty');
          }}
          placeholder="e.g. 100"
          className={cn(
            'w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all',
            errors?.shiftTargetQty
              ? 'border-danger-500 ring-1 ring-danger-500/20 focus:ring-danger-500/20'
              : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20',
          )}
        />
        {errors?.shiftTargetQty && (
          <p className="text-[10px] text-danger-500 font-medium mt-1">{errors.shiftTargetQty}</p>
        )}
      </div>

      {/* Slab Tiers */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          Slab Tiers
        </p>
        <div className="space-y-2">
          {config.slabTiers.map((tier, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={tier.fromQty}
                    onChange={(e) => updateTier(idx, 'fromQty', e.target.value)}
                    placeholder="From Qty"
                    className={cn(
                      'w-full px-2.5 py-2 bg-white dark:bg-neutral-900 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all',
                      errors?.tierErrors?.[idx]
                        ? 'border-danger-500 ring-1 ring-danger-500/20 focus:ring-danger-500/20'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20',
                    )}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    value={tier.toQty}
                    onChange={(e) => updateTier(idx, 'toQty', e.target.value)}
                    placeholder="To Qty (blank=\u221e)"
                    className="w-full px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tier.ratePerPiece}
                    onChange={(e) => updateTier(idx, 'ratePerPiece', e.target.value)}
                    placeholder="Rate \u20b9/pc"
                    className={cn(
                      'w-full px-2.5 py-2 bg-white dark:bg-neutral-900 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all',
                      errors?.tierErrors?.[idx]
                        ? 'border-danger-500 ring-1 ring-danger-500/20 focus:ring-danger-500/20'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20',
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTier(idx)}
                  className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              {errors?.tierErrors?.[idx] && (
                <p className="text-[10px] text-danger-500 font-medium pl-0.5">{errors.tierErrors[idx]}</p>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            addTier();
            if (onClearError) onClearError('noTiers');
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <Plus size={14} />
          Add Tier
        </button>
        {errors?.noTiers && (
          <p className="text-[10px] text-danger-500 font-medium mt-1">{errors.noTiers}</p>
        )}
        {onCopyToAll && totalParts !== undefined && totalParts >= 2 && (
          <button
            type="button"
            onClick={onCopyToAll}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline ml-4"
          >
            <Copy size={12} />
            Copy to All Parts ({totalParts - 1})
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Modal ── */

export function SlabConfigModal({ isOpen, onClose, onSaved, machines, parts }: SlabConfigModalProps) {
  const bulkCreateMutation = useBulkCreatePipSlabConfigs();

  // Operations query
  const { data: operationsData } = useOperations({ status: 'ACTIVE', limit: 500 });
  const operations = (operationsData as any)?.data ?? [];

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Machine selection
  const [selectedMachineIds, setSelectedMachineIds] = useState<Set<string>>(new Set());

  // Step 2: Operation selection
  const [selectedOperationIds, setSelectedOperationIds] = useState<Set<string>>(new Set());

  // Step 3: Part selection
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());

  // Step 4: Part configs
  const [partConfigs, setPartConfigs] = useState<PartConfigForm[]>([]);

  // Inline validation errors per part config index
  const [configErrors, setConfigErrors] = useState<Record<number, PartConfigErrors>>({});

  /* ── Machine handlers ── */

  const toggleMachine = (id: string) => {
    setSelectedMachineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllMachines = () => {
    if (selectedMachineIds.size === machines.length) {
      setSelectedMachineIds(new Set());
    } else {
      setSelectedMachineIds(new Set(machines.map((m) => m.id)));
    }
  };

  /* ── Operation handlers ── */

  const toggleOperation = (id: string) => {
    setSelectedOperationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOperations = () => {
    if (selectedOperationIds.size === operations.length) {
      setSelectedOperationIds(new Set());
    } else {
      setSelectedOperationIds(new Set(operations.map((o: any) => o.id)));
    }
  };

  /* ── Part handlers ── */

  const togglePart = (id: string) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllParts = () => {
    if (selectedPartIds.size === parts.length) {
      setSelectedPartIds(new Set());
    } else {
      setSelectedPartIds(new Set(parts.map((p) => p.id)));
    }
  };

  /* ── Step transitions ── */

  const goToStep2 = () => {
    if (selectedMachineIds.size === 0) {
      showApiError({ message: 'Select at least one machine' });
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    if (selectedOperationIds.size === 0) {
      showApiError({ message: 'Select at least one operation' });
      return;
    }
    setStep(3);
  };

  const goToStep4 = () => {
    if (selectedPartIds.size === 0) {
      showApiError({ message: 'Select at least one part' });
      return;
    }
    // Build part configs from selection
    const configs: PartConfigForm[] = Array.from(selectedPartIds).map((pid) => {
      const part = parts.find((p) => p.id === pid);
      // Preserve existing config if available
      const existing = partConfigs.find((c) => c.partId === pid);
      return (
        existing ?? {
          partId: pid,
          partNumber: part?.partNumber ?? '',
          partName: part?.name ?? '',
          shiftTargetQty: '',
          slabTiers: [{ ...EMPTY_TIER }],
        }
      );
    });
    setPartConfigs(configs);
    setStep(4);
  };

  /* ── Copy to All Parts ── */

  const copyToAllParts = () => {
    if (partConfigs.length < 2) return;
    const source = partConfigs[0];
    setPartConfigs(prev => prev.map((cfg, i) =>
      i === 0 ? cfg : {
        ...cfg,
        shiftTargetQty: source.shiftTargetQty,
        slabTiers: source.slabTiers.map(t => ({ ...t })),
      }
    ));
    showSuccess('Copied', `Configuration copied to ${partConfigs.length - 1} parts`);
  };

  /* ── Clear single error ── */

  const clearError = (partIndex: number, field: string, tierIdx?: number) => {
    setConfigErrors(prev => {
      const next = { ...prev };
      if (!next[partIndex]) return prev;
      const partErr = { ...next[partIndex] };
      if (field === 'shiftTargetQty') delete partErr.shiftTargetQty;
      if (field === 'noTiers') delete partErr.noTiers;
      if (field === 'tier' && tierIdx !== undefined && partErr.tierErrors) {
        const te = { ...partErr.tierErrors };
        delete te[tierIdx];
        partErr.tierErrors = Object.keys(te).length > 0 ? te : undefined;
      }
      if (Object.keys(partErr).filter(k => partErr[k as keyof PartConfigErrors] !== undefined).length === 0) {
        delete next[partIndex];
      } else {
        next[partIndex] = partErr;
      }
      return next;
    });
  };

  /* ── Save ── */

  const handleSave = async () => {
    // Clear previous errors
    setConfigErrors({});

    const errors: Record<number, PartConfigErrors> = {};
    let errorCount = 0;

    for (let i = 0; i < partConfigs.length; i++) {
      const cfg = partConfigs[i];
      const partErrors: PartConfigErrors = {};

      if (!cfg.shiftTargetQty || Number(cfg.shiftTargetQty) < 1) {
        partErrors.shiftTargetQty = 'Shift target is required';
        errorCount++;
      }

      if (cfg.slabTiers.length === 0) {
        partErrors.noTiers = 'At least one slab tier required';
        errorCount++;
      }

      const tierErrors: Record<number, string> = {};
      for (let t = 0; t < cfg.slabTiers.length; t++) {
        const tier = cfg.slabTiers[t];
        if (!tier.fromQty || !tier.ratePerPiece) {
          tierErrors[t] = 'From Qty and Rate required';
          errorCount++;
        }
      }
      if (Object.keys(tierErrors).length > 0) partErrors.tierErrors = tierErrors;

      if (Object.keys(partErrors).length > 0) errors[i] = partErrors;
    }

    if (errorCount > 0) {
      setConfigErrors(errors);
      showApiError({ message: `${errorCount} field(s) need attention — check highlighted fields` });
      return;
    }

    const payload = {
      machineIds: Array.from(selectedMachineIds),
      operationIds: Array.from(selectedOperationIds),
      configs: partConfigs.map((cfg) => ({
        partId: cfg.partId,
        shiftTargetQty: Number(cfg.shiftTargetQty),
        slabTiers: cfg.slabTiers.map((t) => ({
          fromQty: Number(t.fromQty),
          toQty: t.toQty ? Number(t.toQty) : null,
          ratePerPiece: Number(t.ratePerPiece),
        })),
      })),
    };

    try {
      const result = await bulkCreateMutation.mutateAsync(payload);
      const machineCount = selectedMachineIds.size;
      const operationCount = selectedOperationIds.size;
      const partCount = partConfigs.length;
      const rd = result?.data;
      if (rd && rd.skippedCount > 0) {
        const skippedList = (rd.skipped ?? [])
          .map((s: any) => `${s.machineCode} + ${s.partNumber}`)
          .join(', ');
        showSuccess('Saved with skips', `${rd.createdCount} created, ${rd.skippedCount} skipped: ${skippedList}`);
      } else {
        showSuccess(
          'Slab Configs Saved',
          `${machineCount * operationCount * partCount} config(s) saved \u2014 ${machineCount} machine(s) \u00d7 ${operationCount} operation(s) \u00d7 ${partCount} part(s)`,
        );
      }
      onSaved();
      handleClose();
    } catch (err) {
      showApiError(err);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedMachineIds(new Set());
    setSelectedOperationIds(new Set());
    setSelectedPartIds(new Set());
    setPartConfigs([]);
    setConfigErrors({});
    onClose();
  };

  const saving = bulkCreateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Add Slab Configuration</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Step {step} of 4 &mdash;{' '}
              {step === 1 ? 'Select Machines' : step === 2 ? 'Select Operations' : step === 3 ? 'Select Parts' : 'Set Targets & Slabs'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400',
                  )}
                >
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 rounded-full transition-colors',
                      step > s ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 min-h-[40vh]">
          {/* Step 1: Machines */}
          {step === 1 && (
            <>
              <CheckboxDropdown
                label="Machines"
                items={machines}
                selectedIds={selectedMachineIds}
                onToggle={toggleMachine}
                onSelectAll={selectAllMachines}
                searchPlaceholder="Search by asset code or name..."
                renderItem={(m) => (
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary-700 dark:text-primary-400">
                        {m.assetCode}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300">{m.assetName}</span>
                    </div>
                    {(m.zone || m.category) && (
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {[m.zone?.name, m.category?.name].filter(Boolean).join(' \u2022 ')}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Selected Chips */}
              {selectedMachineIds.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedMachineIds).map((id) => {
                    const m = machines.find((x) => x.id === id);
                    if (!m) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold border border-primary-100 dark:border-primary-800/50"
                      >
                        {m.assetCode}
                        <button
                          type="button"
                          onClick={() => toggleMachine(id)}
                          className="hover:text-danger-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 2: Operations */}
          {step === 2 && (
            <>
              <CheckboxDropdown
                label="Operations"
                items={operations}
                selectedIds={selectedOperationIds}
                onToggle={toggleOperation}
                onSelectAll={selectAllOperations}
                searchPlaceholder="Search by code, name or number..."
                renderItem={(op: any) => (
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                        {op.code}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{op.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        {op.processCategory?.name ?? op.processType ?? ''}
                      </span>
                    </div>
                  </div>
                )}
              />

              {/* Selected Chips */}
              {selectedOperationIds.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedOperationIds).map((id) => {
                    const op = operations.find((x: any) => x.id === id);
                    if (!op) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold border border-primary-100 dark:border-primary-800/50"
                      >
                        {op.code}
                        <button
                          type="button"
                          onClick={() => toggleOperation(id)}
                          className="hover:text-danger-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 3: Parts */}
          {step === 3 && (
            <>
              <CheckboxDropdown
                label="Parts"
                items={parts}
                selectedIds={selectedPartIds}
                onToggle={togglePart}
                onSelectAll={selectAllParts}
                searchPlaceholder="Search by part no or name..."
                renderItem={(p) => (
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary-700 dark:text-primary-400">
                        {p.partNumber}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300">{p.name}</span>
                    </div>
                  </div>
                )}
              />

              {/* Selected Chips */}
              {selectedPartIds.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedPartIds).map((id) => {
                    const p = parts.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold border border-primary-100 dark:border-primary-800/50"
                      >
                        {p.partNumber}
                        <button
                          type="button"
                          onClick={() => togglePart(id)}
                          className="hover:text-danger-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Step 4: Config per Part */}
          {step === 4 && (
            <div className="space-y-4">
              {partConfigs.map((cfg, idx) => (
                <PartConfigCard
                  key={cfg.partId}
                  config={cfg}
                  onChange={(updated) => {
                    const next = [...partConfigs];
                    next[idx] = updated;
                    setPartConfigs(next);
                  }}
                  onRemove={() => {
                    setPartConfigs((prev) => prev.filter((_, i) => i !== idx));
                    setSelectedPartIds((prev) => {
                      const next = new Set(prev);
                      next.delete(cfg.partId);
                      return next;
                    });
                  }}
                  onCopyToAll={idx === 0 ? copyToAllParts : undefined}
                  totalParts={partConfigs.length}
                  errors={configErrors[idx]}
                  onClearError={(field, tierIdx) => clearError(idx, field, tierIdx)}
                />
              ))}
              {partConfigs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-400">No parts selected. Go back to add parts.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="py-2.5 px-5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={step === 1 ? goToStep2 : step === 2 ? goToStep3 : goToStep4}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors shadow-md shadow-primary-500/20"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || partConfigs.length === 0}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-primary-500/20"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save All'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
