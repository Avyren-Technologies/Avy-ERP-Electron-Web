import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Loader2,
  Plus,
  ChevronRight,
  Trash2,
  Edit3,
  Download,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  User,
  Cpu,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ManageModal } from '@/components/ui/ManageModal';
import { usePipConfig, usePipSlabConfigs, usePipDailyEntries, useDowntimeReasons } from '@/features/production/pip/api/use-pip-queries';
import { useSavePipDailyEntries, useCreateDowntimeReason, useUpdateDowntimeReason, useDeleteDowntimeReason } from '@/features/production/pip/api/use-pip-mutations';
import { useCompanyShifts } from '@/features/company-admin/api/use-company-admin-queries';
import { useMachines } from '@/features/masters/api/use-masters-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { showSuccess, showApiError } from '@/lib/toast';
import { hrApi } from '@/lib/api/hr';
import type { PipIncentiveConfig, PipSlabConfig, SlabTier, CalculationResult, DowntimeReason } from '@/lib/api/pip';
import type { CompanyShift } from '@/lib/api/company-admin';
import type { Employee } from '@/lib/api/hr';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface PartEntry {
  partId: string;
  partNumber: string;
  partName: string;
  slabConfigId: string;
  operationId: string | null;
  shiftTargetQty: number;
  slabTiers: SlabTier[];
  qtyProduced: number;
  ncCount: number;
  downtimeReasonId: string;
  downtimeMinutes: number;
}

interface OperationOption {
  id: string;
  code: string;
  name: string;
}

interface SessionMachine {
  machineId: string;
  assetCode: string;
  assetName: string;
  selectedOperationId: string | null;
  selectedOperationLabel: string | null;
  entries: PartEntry[];
}

interface SelectedOperator {
  id: string;
  name: string;
  employeeId: string;
}

interface SelectedMachine {
  id: string;
  assetCode: string;
  assetName: string;
}

interface SavedOperatorSummary {
  operatorId: string;
  name: string;
  employeeId: string;
  machineCount: number;
  totalIncentive: number;
  isEligible: boolean;
}

interface SavedEntry {
  operatorName: string;
  employeeId: string;
  machineCode: string;
  machineName: string;
  operationCode: string | null;
  operationName: string | null;
  partNumber: string;
  partName: string;
  qty: number;
  target: number;
  pct: number;
  method: string;
  incentive: number;
  status: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Client-Side Incentive Calculation (simplified mirror of backend logic)
   ═══════════════════════════════════════════════════════════════════════════ */

interface CalcPartInput {
  partId: string;
  partNumber: string;
  partName: string;
  machineId: string;
  machineCode: string;
  qtyProduced: number;
  shiftTargetQty: number;
  slabTiers: SlabTier[];
}

interface CalcPartResult {
  partId: string;
  partNumber: string;
  partName: string;
  machineId: string;
  machineCode: string;
  qtyProduced: number;
  shiftTargetQty: number;
  achievementPct: number;
  incentiveAmount: number;
  consideredPct: number;
  earningQty: number;
  appliedRate: number;
  appliedSlabLabel: string;
  milestone?: number;
}

function getSlabRate(slabTiers: SlabTier[], qty: number): number {
  if (!slabTiers.length || qty <= 0) return 0;
  let total = 0;
  let remaining = qty;
  for (const tier of slabTiers) {
    if (remaining <= 0) break;
    const tierRange = tier.toQty != null ? tier.toQty - tier.fromQty + 1 : remaining;
    const pcs = Math.min(remaining, tierRange);
    total += pcs * tier.ratePerPiece;
    remaining -= pcs;
  }
  return total;
}

function calculateIncentiveLocal(
  parts: CalcPartInput[],
  methodNumber: number | null,
): { totalIncentive: number; cumulativeRatio: number; isEligible: boolean; partResults: CalcPartResult[] } {
  if (!parts.length || !methodNumber) {
    return {
      totalIncentive: 0,
      cumulativeRatio: 0,
      isEligible: false,
      partResults: parts.map((p) => ({
        ...p,
        achievementPct: p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0,
        incentiveAmount: 0,
        consideredPct: 0,
        earningQty: 0,
        appliedRate: 0,
        appliedSlabLabel: 'N/A',
      })),
    };
  }

  // Cumulative ratio = sum of (qty/target) for each part
  const cumulativeRatio = parts.reduce((sum, p) => {
    if (p.shiftTargetQty <= 0) return sum;
    return sum + p.qtyProduced / p.shiftTargetQty;
  }, 0);
  const cumulativePct = cumulativeRatio * 100;
  const isEligible = cumulativePct >= 100;

  if (methodNumber === 1) {
    // Method 1: Excess Ratio — only qty past 100% cumulative earns
    const partResults: CalcPartResult[] = [];
    let totalIncentive = 0;

    if (!isEligible) {
      // Below 100% — no incentive
      return {
        totalIncentive: 0,
        cumulativeRatio: cumulativePct,
        isEligible: false,
        partResults: parts.map((p) => ({
          ...p,
          achievementPct: p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0,
          incentiveAmount: 0,
          consideredPct: 0,
          earningQty: 0,
          appliedRate: 0,
          appliedSlabLabel: 'N/A',
        })),
      };
    }

    // Find how much each part contributes past 100%
    // Sort by achievement ascending — last parts "push past" the threshold
    const sorted = [...parts].sort(
      (a, b) => (a.qtyProduced / (a.shiftTargetQty || 1)) - (b.qtyProduced / (b.shiftTargetQty || 1)),
    );

    let runningRatio = 0;
    for (const p of sorted) {
      const pctContribution = p.shiftTargetQty > 0 ? p.qtyProduced / p.shiftTargetQty : 0;
      const prevRunning = runningRatio;
      runningRatio += pctContribution;

      let earningQty = 0;
      if (prevRunning >= 1) {
        // Already past 100% — only excess above target earns
        earningQty = Math.max(0, p.qtyProduced - p.shiftTargetQty);
      } else if (runningRatio > 1) {
        // This part pushes past 100%
        const neededToReach100 = (1 - prevRunning) * p.shiftTargetQty;
        earningQty = Math.max(0, p.qtyProduced - Math.ceil(neededToReach100));
      }

      // For excess above individual target, use full slab tiers
      const excessAboveTarget = Math.max(0, p.qtyProduced - p.shiftTargetQty);
      // Earning qty from excess ratio
      const slab1Earning = Math.max(0, earningQty - excessAboveTarget);
      const slab1Rate = p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0;
      const slab1Amount = slab1Earning * slab1Rate;
      const excessAmount = excessAboveTarget > 0 ? getSlabRate(p.slabTiers, excessAboveTarget) : 0;
      const incentiveAmount = slab1Amount + excessAmount;

      totalIncentive += incentiveAmount;
      partResults.push({
        ...p,
        achievementPct: p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0,
        incentiveAmount,
        consideredPct: 100,
        earningQty,
        appliedRate: p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0,
        appliedSlabLabel: earningQty > 0 && p.slabTiers.length > 0 ? 'Slab 1' : 'N/A',
      });
    }

    // Reorder to original order
    const resultMap = new Map(partResults.map((r) => [r.partId + r.machineId, r]));
    return {
      totalIncentive,
      cumulativeRatio: cumulativePct,
      isEligible: true,
      partResults: parts.map((p) => resultMap.get(p.partId + p.machineId) ?? {
        ...p,
        achievementPct: p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0,
        incentiveAmount: 0,
        consideredPct: 100,
        earningQty: 0,
        appliedRate: 0,
        appliedSlabLabel: 'N/A',
      }),
    };
  }

  if (methodNumber === 2) {
    // Method 2: Milestone rounding
    const milestones = [100, 75, 50, 25];
    const partResults: CalcPartResult[] = [];
    let totalMilestonePct = 0;
    let totalIncentive = 0;

    const partCalcs = parts.map((p) => {
      const pct = p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0;
      const milestone = milestones.find((m) => pct >= m) ?? 0;
      const milestoneQty = Math.floor((milestone / 100) * p.shiftTargetQty);
      const remainingQty = Math.max(0, p.qtyProduced - milestoneQty);
      return { ...p, pct, milestone, milestoneQty, remainingQty };
    });

    totalMilestonePct = partCalcs.reduce((s, p) => s + p.milestone, 0);
    const milestoneEligible = totalMilestonePct >= 100;

    for (const p of partCalcs) {
      let incentiveAmount = 0;
      if (milestoneEligible && p.remainingQty > 0) {
        // Excess above target uses full slab tiers
        const excessAboveTarget = Math.max(0, p.qtyProduced - p.shiftTargetQty);
        if (excessAboveTarget > 0) {
          incentiveAmount += getSlabRate(p.slabTiers, excessAboveTarget);
        }
        // Remaining qty (between milestone and target) earns slab 1 rate
        const slab1Earning = Math.max(0, p.remainingQty - excessAboveTarget);
        const slab1Rate = p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0;
        incentiveAmount += slab1Earning * slab1Rate;
      }
      totalIncentive += incentiveAmount;
      const slab1Rate = p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0;
      partResults.push({
        partId: p.partId,
        partNumber: p.partNumber,
        partName: p.partName,
        machineId: p.machineId,
        machineCode: p.machineCode,
        qtyProduced: p.qtyProduced,
        shiftTargetQty: p.shiftTargetQty,
        achievementPct: p.pct,
        incentiveAmount,
        consideredPct: p.milestone,
        milestone: p.milestone,
        earningQty: p.milestone > 0 ? p.remainingQty : 0,
        appliedRate: slab1Rate,
        appliedSlabLabel: slab1Rate > 0 && p.milestone > 0 ? 'Slab 1' : 'N/A',
      });
    }

    return {
      totalIncentive,
      cumulativeRatio: totalMilestonePct,
      isEligible: milestoneEligible,
      partResults,
    };
  }

  // Fallback
  return {
    totalIncentive: 0,
    cumulativeRatio: cumulativePct,
    isEligible: false,
    partResults: parts.map((p) => ({
      ...p,
      achievementPct: p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0,
      incentiveAmount: 0,
      consideredPct: 0,
      earningQty: 0,
      appliedRate: 0,
      appliedSlabLabel: 'N/A',
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}

function pctColor(pct: number): string {
  if (pct >= 100) return 'text-success-600 dark:text-success-400';
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-danger-600 dark:text-danger-400';
}

function pctBgColor(pct: number): string {
  if (pct >= 100) return 'bg-success-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-primary-500';
}

function statusBadge(pct: number, incentive: number): { text: string; cls: string } {
  if (incentive > 0) return { text: 'Incentive', cls: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400' };
  if (pct >= 100) return { text: 'Eligible', cls: 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400' };
  return { text: 'Below 100%', cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   No-Method Interstitial
   ═══════════════════════════════════════════════════════════════════════════ */

function NoMethodPopup({ onContinue, onGoToConfig }: { onContinue: () => void; onGoToConfig: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Incentive Calculation Not Enabled</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          No incentive calculation method is currently active. You can enable a method in Incentive Config, or
          continue to record production data without incentive calculation.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Continue Without Incentive
          </button>
          <button
            onClick={onGoToConfig}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Settings2 size={14} />
            Go to Config
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Autocomplete Search Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface AutocompleteItem {
  id: string;
  primary: string;
  secondary: string;
  detail?: string;
  avatar?: string;
  avatarColor?: string;
  badge?: 'saved' | 'pending' | null;
}

function AutocompleteSearch({
  label,
  stepNumber,
  stepColor,
  placeholder,
  items,
  selectedId,
  onSelect,
  onClear,
  onSearch,
  disabled,
  loading,
  inputRef,
}: {
  label: string;
  stepNumber: number;
  stepColor: string;
  placeholder: string;
  items: AutocompleteItem[];
  selectedId: string | null;
  onSelect: (item: AutocompleteItem) => void;
  onClear: () => void;
  onSearch: (q: string) => void;
  disabled?: boolean;
  loading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) => i.primary.toLowerCase().includes(q) || i.secondary.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filtered[highlightIndex]) {
        e.preventDefault();
        onSelect(filtered[highlightIndex]);
        setQuery(filtered[highlightIndex].primary);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 relative">
      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white', stepColor)}>
          {stepNumber}
        </span>
        {label}
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={selectedId ? query : query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (items.length === 0) onSearch(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-9 pr-9 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all',
            disabled && 'opacity-50 cursor-not-allowed',
            selectedId ? 'border-primary-400 dark:border-primary-600' : 'border-neutral-200 dark:border-neutral-700',
          )}
        />
        {selectedId && (
          <button
            onClick={() => {
              onClear();
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X size={14} className="text-neutral-500" />
          </button>
        )}
        {loading && !selectedId && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && !selectedId && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery(item.primary);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                idx === highlightIndex
                  ? 'bg-primary-50 dark:bg-primary-900/30'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                  item.avatarColor || 'bg-primary-500',
                )}
              >
                {item.avatar || getInitials(item.primary)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{item.primary}</span>
                  {item.badge === 'saved' && <CheckCircle2 size={14} className="text-success-500 flex-shrink-0" />}
                  {item.badge === 'pending' && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.secondary}</p>
              </div>
              {item.detail && (
                <span className="text-xs text-neutral-400 flex-shrink-0">{item.detail}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && !disabled && !selectedId && !loading && filtered.length === 0 && query.trim() && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-4 text-center text-sm text-neutral-500">
          No results found
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Screen Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function PipDailyEntryScreen() {
  const navigate = useNavigate();

  /* ── Data queries ── */
  const { data: configData, isLoading: configLoading } = usePipConfig();
  const { data: slabData, isLoading: slabsLoading } = usePipSlabConfigs({ limit: 500, isActive: true });
  const { data: shiftsData } = useCompanyShifts();
  const { data: allMachinesData } = useMachines({ limit: 500 });
  const saveMutation = useSavePipDailyEntries();

  const config: PipIncentiveConfig | undefined = configData?.data;
  const slabConfigs: PipSlabConfig[] = slabData?.data ?? [];
  const shifts: CompanyShift[] = shiftsData?.data ?? [];

  /* ── Downtime reasons ── */
  const { data: downtimeReasonsData, isLoading: downtimeReasonsLoading } = useDowntimeReasons();
  const downtimeReasons: DowntimeReason[] = downtimeReasonsData?.data ?? [];
  const createDtMutation = useCreateDowntimeReason();
  const updateDtMutation = useUpdateDowntimeReason();
  const deleteDtMutation = useDeleteDowntimeReason();
  const [manageDowntimeOpen, setManageDowntimeOpen] = useState(false);

  /* ── Derived: active method ── */
  const activeMethod = useMemo(() => {
    if (!config) return null;
    if (config.method1Enabled) return { number: 1, name: config.method1Name };
    if (config.method2Enabled) return { number: 2, name: config.method2Name };
    return null;
  }, [config]);

  /* ── No-method popup ── */
  const [showNoMethodPopup, setShowNoMethodPopup] = useState(false);
  const [dismissedNoMethod, setDismissedNoMethod] = useState(false);

  useEffect(() => {
    if (!configLoading && config && !activeMethod && !dismissedNoMethod) {
      setShowNoMethodPopup(true);
    }
  }, [configLoading, config, activeMethod, dismissedNoMethod]);

  /* ── Date / shift selection ── */
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShiftId, setSelectedShiftId] = useState('');

  useEffect(() => {
    if (shifts.length > 0 && !selectedShiftId) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

      // Find the shift whose time window contains the current time
      const matchedShift = shifts.find((shift: any) => {
        const [startH, startM] = (shift.startTime || '00:00').split(':').map(Number);
        const [endH, endM] = (shift.endTime || '23:59').split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (shift.isCrossDay) {
          // Night shift: e.g., 22:00 - 06:00
          return currentTime >= startMinutes || currentTime < endMinutes;
        }
        return currentTime >= startMinutes && currentTime < endMinutes;
      });

      if (matchedShift) {
        setSelectedShiftId(matchedShift.id);
      } else {
        // Fallback to first shift
        setSelectedShiftId(shifts[0].id);
      }
    }
  }, [shifts, selectedShiftId]);

  const selectedShift = shifts.find((s) => s.id === selectedShiftId);

  /* ── Operator search ── */
  const [operatorSearchResults, setOperatorSearchResults] = useState<Employee[]>([]);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<SelectedOperator | null>(null);

  const operatorInputRef = useRef<HTMLInputElement>(null);
  const machineInputRef = useRef<HTMLInputElement>(null);
  const firstQtyRef = useRef<HTMLInputElement>(null);

  const searchOperators = useCallback(async (q: string) => {
    setOperatorLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (q.trim()) params.search = q;
      const res = await hrApi.listEmployees(params as any);
      setOperatorSearchResults(res.data ?? []);
    } catch {
      setOperatorSearchResults([]);
    } finally {
      setOperatorLoading(false);
    }
  }, []);

  /* ── Machine selection ── */
  const [selectedMachine, setSelectedMachine] = useState<SelectedMachine | null>(null);

  /* ── Operation selection ── */
  const [machineOperations, setMachineOperations] = useState<OperationOption[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);

  // Build machine list: machines from Machine Master that have active slab configs (BR-15)
  const allMachines = allMachinesData?.data ?? [];
  const machinesWithSlabs = useMemo(() => {
    // Count slab configs per machine
    const configCountMap = new Map<string, number>();
    for (const sc of slabConfigs) {
      configCountMap.set(sc.machineId, (configCountMap.get(sc.machineId) ?? 0) + 1);
    }
    // Only include machines that have at least one active slab config
    return allMachines
      .filter((m: any) => configCountMap.has(m.id))
      .map((m: any) => ({
        id: m.id,
        assetCode: m.assetCode ?? '',
        assetName: m.assetName ?? '',
        configCount: configCountMap.get(m.id) ?? 0,
      }));
  }, [allMachines, slabConfigs]);

  /* ── Parts entry for current machine ── */
  const [partEntries, setPartEntries] = useState<PartEntry[]>([]);

  // When machine changes, extract unique operations from slab configs
  useEffect(() => {
    if (!selectedMachine) {
      setMachineOperations([]);
      setSelectedOperationId(null);
      setPartEntries([]);
      return;
    }
    const machineSlabs = slabConfigs.filter((sc) => sc.machineId === selectedMachine.id && sc.isActive);
    // Extract unique operations
    const opMap = new Map<string, OperationOption>();
    for (const sc of machineSlabs) {
      if (sc.operationId && sc.operation && !opMap.has(sc.operationId)) {
        opMap.set(sc.operationId, {
          id: sc.operationId,
          code: sc.operation.code,
          name: sc.operation.name,
        });
      }
    }
    const ops = Array.from(opMap.values());
    setMachineOperations(ops);

    // Auto-select if only one operation (or none — legacy configs without operation)
    if (ops.length === 1) {
      setSelectedOperationId(ops[0].id);
    } else if (ops.length === 0) {
      // No operations on slab configs — derive parts directly (legacy fallback)
      setSelectedOperationId(null);
      setPartEntries(
        machineSlabs.map((sc) => ({
          partId: sc.partId,
          partNumber: sc.part?.partNumber ?? '',
          partName: sc.part?.name ?? '',
          slabConfigId: sc.id,
          operationId: sc.operationId ?? null,
          shiftTargetQty: sc.shiftTargetQty,
          slabTiers: sc.slabTiers,
          qtyProduced: 0,
          ncCount: 0,
          downtimeReasonId: '',
          downtimeMinutes: 0,
        })),
      );
      setTimeout(() => firstQtyRef.current?.focus(), 100);
    } else {
      // Multiple operations — wait for user to pick
      setSelectedOperationId(null);
      setPartEntries([]);
    }
  }, [selectedMachine, slabConfigs]);

  // When operation is selected, derive parts filtered by that operation
  useEffect(() => {
    if (!selectedMachine || !selectedOperationId) return;
    const filteredSlabs = slabConfigs.filter(
      (sc) => sc.machineId === selectedMachine.id && sc.isActive && sc.operationId === selectedOperationId,
    );
    setPartEntries(
      filteredSlabs.map((sc) => ({
        partId: sc.partId,
        partNumber: sc.part?.partNumber ?? '',
        partName: sc.part?.name ?? '',
        slabConfigId: sc.id,
        operationId: sc.operationId ?? null,
        shiftTargetQty: sc.shiftTargetQty,
        slabTiers: sc.slabTiers,
        qtyProduced: 0,
        ncCount: 0,
        downtimeReasonId: '',
        downtimeMinutes: 0,
      })),
    );
    setTimeout(() => firstQtyRef.current?.focus(), 100);
  }, [selectedMachine, selectedOperationId, slabConfigs]);

  /* ── Session accumulator ── */
  const [session, setSession] = useState<SessionMachine[]>([]);
  const [editingSessionIndex, setEditingSessionIndex] = useState<number | null>(null);

  /* ── Saved operators ── */
  const [savedOperators, setSavedOperators] = useState<SavedOperatorSummary[]>([]);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);

  /* ── Part filter ── */
  const [partFilter, setPartFilter] = useState('');

  /* ── Placeholder message ── */
  const [placeholderMsg, setPlaceholderMsg] = useState<string | null>(null);

  /* ── Live calculation ── */
  const liveCalcResult = useMemo(() => {
    // Combine session entries + current part entries
    const allParts: CalcPartInput[] = [];
    for (const sm of session) {
      for (const e of sm.entries) {
        allParts.push({
          partId: e.partId,
          partNumber: e.partNumber,
          partName: e.partName,
          machineId: sm.machineId,
          machineCode: sm.assetCode,
          qtyProduced: e.qtyProduced,
          shiftTargetQty: e.shiftTargetQty,
          slabTiers: e.slabTiers,
        });
      }
    }
    for (const e of partEntries) {
      allParts.push({
        partId: e.partId,
        partNumber: e.partNumber,
        partName: e.partName,
        machineId: selectedMachine?.id ?? '',
        machineCode: selectedMachine?.assetCode ?? '',
        qtyProduced: e.qtyProduced,
        shiftTargetQty: e.shiftTargetQty,
        slabTiers: e.slabTiers,
      });
    }

    return calculateIncentiveLocal(allParts, activeMethod?.number ?? null);
  }, [session, partEntries, selectedMachine, activeMethod]);

  /* ── Qty input refs for keyboard navigation ── */
  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  /* ── Handlers ── */

  const handleOperatorSelect = (item: AutocompleteItem) => {
    const emp = operatorSearchResults.find((e) => e.id === item.id);
    if (!emp) return;
    setSelectedOperator({
      id: emp.id,
      name: emp.fullName ?? `${emp.firstName} ${emp.lastName}`,
      employeeId: emp.employeeId,
    });
    setSession([]);
    setSelectedMachine(null);
    setPartEntries([]);
    setPlaceholderMsg(null);
    setTimeout(() => machineInputRef.current?.focus(), 50);
  };

  const handleOperatorClear = () => {
    setSelectedOperator(null);
    setSelectedMachine(null);
    setSelectedOperationId(null);
    setMachineOperations([]);
    setPartEntries([]);
    setSession([]);
    setPlaceholderMsg(null);
  };

  const handleMachineSelect = (item: AutocompleteItem) => {
    const m = machinesWithSlabs.find((mc) => mc.id === item.id);
    if (!m) return;
    setSelectedMachine({ id: m.id, assetCode: m.assetCode, assetName: m.assetName });
    setSelectedOperationId(null);
    setMachineOperations([]);
    setEditingSessionIndex(null);
    setPlaceholderMsg(null);
    setPartFilter('');
  };

  const handleMachineClear = () => {
    setSelectedMachine(null);
    setSelectedOperationId(null);
    setMachineOperations([]);
    setPartEntries([]);
  };

  const handleSelectOperation = (opId: string) => {
    setSelectedOperationId(opId);
    setPartFilter('');
  };

  const handleQtyChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    setPartEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qtyProduced: isNaN(num) ? 0 : Math.max(0, num) };
      return next;
    });
  };

  const handleNcChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    setPartEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ncCount: isNaN(num) ? 0 : Math.max(0, num) };
      return next;
    });
  };

  const handleDowntimeReasonChange = (index: number, reasonId: string) => {
    setPartEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], downtimeReasonId: reasonId };
      return next;
    });
  };

  const handleDowntimeMinutesChange = (index: number, value: string) => {
    const num = parseInt(value, 10);
    setPartEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], downtimeMinutes: isNaN(num) ? 0 : Math.max(0, num) };
      return next;
    });
  };

  const handleAddToSession = () => {
    if (!selectedMachine || partEntries.length === 0) return;
    const selectedOp = machineOperations.find((o) => o.id === selectedOperationId);
    const newEntry: SessionMachine = {
      machineId: selectedMachine.id,
      assetCode: selectedMachine.assetCode,
      assetName: selectedMachine.assetName,
      selectedOperationId: selectedOperationId,
      selectedOperationLabel: selectedOp ? `${selectedOp.code} — ${selectedOp.name}` : null,
      entries: [...partEntries],
    };

    if (editingSessionIndex !== null) {
      setSession((prev) => {
        const next = [...prev];
        next[editingSessionIndex] = newEntry;
        return next;
      });
      setEditingSessionIndex(null);
    } else {
      setSession((prev) => [...prev, newEntry]);
    }

    setSelectedMachine(null);
    setSelectedOperationId(null);
    setMachineOperations([]);
    setPartEntries([]);
    setPlaceholderMsg(`${newEntry.assetCode} ${newEntry.assetName} added -- Type next machine above, or click Save entries below.`);
    setTimeout(() => machineInputRef.current?.focus(), 50);
  };

  const handleEditSession = (index: number) => {
    const sm = session[index];
    setSelectedMachine({ id: sm.machineId, assetCode: sm.assetCode, assetName: sm.assetName });
    // Restore operation selection — the useEffect for machine will recalculate machineOperations,
    // but we also need to restore the selectedOperationId. We set it directly; the part-derivation
    // effect will be overridden by the explicit setPartEntries below.
    setSelectedOperationId(sm.selectedOperationId);
    setPartEntries(sm.entries.map((e) => ({ ...e })));
    setEditingSessionIndex(index);
  };

  const handleRemoveSession = (index: number) => {
    setSession((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeMachine = () => {
    setSelectedMachine(null);
    setSelectedOperationId(null);
    setMachineOperations([]);
    setPartEntries([]);
    setEditingSessionIndex(null);
    setTimeout(() => machineInputRef.current?.focus(), 50);
  };

  const handleClearAll = () => {
    setSelectedOperator(null);
    setSelectedMachine(null);
    setSelectedOperationId(null);
    setMachineOperations([]);
    setPartEntries([]);
    setSession([]);
    setEditingSessionIndex(null);
    setPlaceholderMsg(null);
    setTimeout(() => operatorInputRef.current?.focus(), 50);
  };

  const handleSaveEntries = async () => {
    if (!selectedOperator || !selectedShiftId || session.length === 0) return;

    const entries = session.flatMap((sm) =>
      sm.entries.map((e) => ({
        machineId: sm.machineId,
        partId: e.partId,
        slabConfigId: e.slabConfigId,
        operationId: e.operationId ?? sm.selectedOperationId ?? undefined,
        qtyProduced: e.qtyProduced,
        shiftTargetQty: e.shiftTargetQty,
        ncCount: e.ncCount,
        downtimeReasonId: e.downtimeReasonId || undefined,
        downtimeMinutes: e.downtimeMinutes || undefined,
      })),
    );

    try {
      await saveMutation.mutateAsync({
        entryDate,
        shiftId: selectedShiftId,
        operatorId: selectedOperator.id,
        entries,
      });

      // Add to saved operators summary
      setSavedOperators((prev) => [
        ...prev,
        {
          operatorId: selectedOperator.id,
          name: selectedOperator.name,
          employeeId: selectedOperator.employeeId,
          machineCount: session.length,
          totalIncentive: liveCalcResult.totalIncentive,
          isEligible: liveCalcResult.isEligible,
        },
      ]);

      // Add to saved entries table
      const methodName = activeMethod?.name ?? 'No method';
      for (const sm of session) {
        for (const e of sm.entries) {
          const pct = e.shiftTargetQty > 0 ? (e.qtyProduced / e.shiftTargetQty) * 100 : 0;
          const partCalc = liveCalcResult.partResults.find(
            (r) => r.partId === e.partId && r.machineId === sm.machineId,
          );
          // Resolve operation label from the session-level selection
          const opLabel = sm.selectedOperationLabel;
          const opParts = opLabel?.split(' — ') ?? [null, null];
          setSavedEntries((prev) => [
            ...prev,
            {
              operatorName: selectedOperator.name,
              employeeId: selectedOperator.employeeId,
              machineCode: sm.assetCode,
              machineName: sm.assetName,
              operationCode: opParts[0] ?? null,
              operationName: opParts[1] ?? null,
              partNumber: e.partNumber,
              partName: e.partName,
              qty: e.qtyProduced,
              target: e.shiftTargetQty,
              pct,
              method: methodName,
              incentive: partCalc?.incentiveAmount ?? 0,
              status: pct >= 100 ? (partCalc?.incentiveAmount ?? 0) > 0 ? 'Incentive' : 'Eligible' : 'Below 100%',
            },
          ]);
        }
      }

      const firstName = selectedOperator.name.split(' ')[0];
      showSuccess(`Entries saved for ${selectedOperator.name}`);
      setPlaceholderMsg(`${firstName}'s entries saved! -- Type next operator above to continue.`);
      setSelectedOperator(null);
      setSelectedMachine(null);
      setPartEntries([]);
      setSession([]);
      setEditingSessionIndex(null);
      setTimeout(() => operatorInputRef.current?.focus(), 50);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      saveButtonRef.current?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (index < partEntries.length - 1) {
        qtyInputRefs.current[index + 1]?.focus();
      } else {
        // Last part — trigger add to session
        handleAddToSession();
      }
    }
  };

  /* ── Operator autocomplete items ── */
  const operatorItems: AutocompleteItem[] = operatorSearchResults.map((emp) => {
    const name = emp.fullName ?? `${emp.firstName} ${emp.lastName}`;
    const isSaved = savedOperators.some((so) => so.operatorId === emp.id);
    return {
      id: emp.id,
      primary: name,
      secondary: `${emp.employeeId}${emp.designationName ? ' - ' + emp.designationName : ''}`,
      avatarColor: 'bg-primary-500',
      badge: isSaved ? 'saved' as const : null,
    };
  });

  /* ── Machine autocomplete items ── */
  const machineItems: AutocompleteItem[] = machinesWithSlabs.map((m) => {
    const suffix = m.assetCode.replace(/\D/g, '').slice(-2) || '00';
    const inSession = session.some((s) => s.machineId === m.id);
    return {
      id: m.id,
      primary: `${m.assetCode} -- ${m.assetName}`,
      secondary: `${m.configCount} part(s) configured`,
      avatar: suffix,
      avatarColor: 'bg-success-500',
      badge: inSession ? 'saved' as const : null,
    };
  });

  /* ── Saved entries query for today ── */
  const { data: todaySavedData, isLoading: todaySavedLoading } = usePipDailyEntries({
    entryDate,
    shiftId: selectedShiftId || undefined,
    limit: 200,
  });

  const todaySaved = todaySavedData?.data ?? [];

  /* ── Loading state ── */
  if (configLoading || slabsLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Daily Production Entry</h1>
        </div>
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex-1 p-6 max-w-[1600px] mx-auto space-y-6">
      {/* No-method popup */}
      {showNoMethodPopup && (
        <NoMethodPopup
          onContinue={() => {
            setShowNoMethodPopup(false);
            setDismissedNoMethod(true);
          }}
          onGoToConfig={() => navigate('/app/company/production/pip/config')}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Daily Production Entry</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {!activeMethod
              ? 'Production records only -- no incentive calculation active.'
              : `${entryDate} -- ${selectedShift?.name ?? 'Select shift'} -- keyboard-first: type, select, Tab, Enter`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date selector */}
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          />
          {/* Shift selector */}
          <select
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          >
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {/* Active method badge */}
          {activeMethod ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-100 dark:border-primary-800">
              <CheckCircle2 size={12} />
              Active: {activeMethod.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 text-xs font-bold border border-danger-100 dark:border-danger-800">
              <AlertTriangle size={12} />
              No incentive method active
            </span>
          )}
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ═══════ LEFT COLUMN ═══════ */}
        <div className="space-y-6">
          {/* ── Operator & Machine Selectors Card ── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Operator */}
              <AutocompleteSearch
                label="Operator"
                stepNumber={1}
                stepColor="bg-primary-600"
                placeholder="Name or EMP ID..."
                items={operatorItems}
                selectedId={selectedOperator?.id ?? null}
                onSelect={handleOperatorSelect}
                onClear={handleOperatorClear}
                onSearch={searchOperators}
                loading={operatorLoading}
                inputRef={operatorInputRef}
              />

              {/* Machine */}
              <AutocompleteSearch
                label="Machine"
                stepNumber={2}
                stepColor="bg-success-600"
                placeholder="Machine ID or name..."
                items={machineItems}
                selectedId={selectedMachine?.id ?? null}
                onSelect={handleMachineSelect}
                onClear={handleMachineClear}
                onSearch={() => {}}
                disabled={!selectedOperator}
                inputRef={machineInputRef}
              />
            </div>

            {/* ── Context Strip ── */}
            {selectedOperator && selectedMachine && (
              <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(selectedOperator.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300">{selectedOperator.name}</p>
                    <p className="text-xs text-primary-500 dark:text-primary-400 flex items-center gap-1.5">
                      {selectedMachine.assetCode} -- {selectedMachine.assetName}
                      {selectedOperationId && machineOperations.find((o) => o.id === selectedOperationId) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-[10px] font-bold">
                          {machineOperations.find((o) => o.id === selectedOperationId)!.code}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      liveCalcResult.cumulativeRatio >= 100
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    )}
                  >
                    Actual: {liveCalcResult.cumulativeRatio.toFixed(1)}%
                  </span>
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {formatCurrency(liveCalcResult.totalIncentive)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Operation Selector (when machine has multiple operations) ── */}
          {selectedMachine && machineOperations.length > 1 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-4">
              <SearchableSelect
                label="Select Operation"
                value={selectedOperationId ?? ''}
                onChange={(v) => handleSelectOperation(v)}
                options={machineOperations.map((op) => ({
                  value: op.id,
                  label: op.name,
                  sublabel: op.code,
                }))}
                placeholder="Select operation..."
              />
            </div>
          )}

          {/* ── Prompt to select operation ── */}
          {selectedMachine && machineOperations.length > 1 && !selectedOperationId && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-8 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                This machine has {machineOperations.length} operations configured. Select an operation above to load its parts.
              </p>
            </div>
          )}

          {/* ── Parts Entry Table ── */}
          {selectedMachine && partEntries.length > 0 && (() => {
            const filteredParts = partEntries.filter(p => {
              if (!partFilter.trim()) return true;
              const q = partFilter.toLowerCase();
              return p.partNumber?.toLowerCase().includes(q) || p.partName?.toLowerCase().includes(q);
            });

            return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              {/* Part filter bar */}
              {partEntries.length > 3 && (
                <div className="px-4 pt-4">
                  <div className="relative max-w-sm mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Filter parts by name or number..."
                      value={partFilter}
                      onChange={(e) => setPartFilter(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white placeholder:text-neutral-400"
                    />
                    {partFilter && (
                      <button onClick={() => setPartFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Part</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-20">Target</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[130px]">
                        <div>Qty Produced</div>
                        <div className="text-[10px] font-normal normal-case tracking-normal text-neutral-400">Enter=next / Shift+Enter=Save</div>
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[90px]">Progress</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[50px]">%</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[80px]">NC</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-[80px]">Incentive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.length === 0 && partEntries.length > 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-400">
                          No parts match "{partFilter}"
                        </td>
                      </tr>
                    )}
                    {filteredParts.map((entry) => {
                      const idx = partEntries.findIndex(p => p.partId === entry.partId);
                      const pct = entry.shiftTargetQty > 0 ? (entry.qtyProduced / entry.shiftTargetQty) * 100 : 0;
                      const partCalc = liveCalcResult.partResults.find(
                        (r) => r.partId === entry.partId && r.machineId === (selectedMachine?.id ?? ''),
                      );
                      const incentive = partCalc?.incentiveAmount ?? 0;

                      return (
                        <React.Fragment key={entry.partId}>
                        <tr className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                          {/* Part */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold mr-2">
                              {entry.partNumber}
                            </span>
                            <span className="text-neutral-700 dark:text-neutral-300 text-sm">{entry.partName}</span>
                          </td>

                          {/* Target */}
                          <td className="text-center px-3 py-3 font-semibold text-neutral-600 dark:text-neutral-400">
                            {entry.shiftTargetQty}
                          </td>

                          {/* Qty Produced */}
                          <td className="px-3 py-3">
                            <input
                              ref={(el) => {
                                qtyInputRefs.current[idx] = el;
                                if (idx === 0) (firstQtyRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                              }}
                              type="number"
                              min={0}
                              value={entry.qtyProduced || ''}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              onKeyDown={(e) => handleQtyKeyDown(e, idx)}
                              placeholder="0"
                              className={cn(
                                'w-full text-center px-2 py-2 rounded-lg border text-base font-bold focus:outline-none focus:ring-2 transition-all bg-white dark:bg-neutral-800',
                                pct >= 100
                                  ? 'border-success-400 focus:ring-success-500/20 focus:border-success-500 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                                  : entry.qtyProduced > 0
                                    ? 'border-primary-400 focus:ring-primary-500/20 focus:border-primary-500 text-primary-700 dark:text-primary-300'
                                    : 'border-neutral-200 dark:border-neutral-700 focus:ring-primary-500/20 focus:border-primary-500 text-neutral-900 dark:text-white',
                              )}
                            />
                          </td>

                          {/* Progress */}
                          <td className="px-3 py-3">
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-300', pctBgColor(pct))}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </td>

                          {/* % */}
                          <td className={cn('text-center px-3 py-3 font-bold text-sm', pctColor(pct))}>
                            {pct.toFixed(0)}%
                          </td>

                          {/* NC Count */}
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min={0}
                              value={entry.ncCount || ''}
                              onChange={(e) => handleNcChange(idx, e.target.value)}
                              placeholder="0"
                              className="w-full text-center px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                            />
                          </td>

                          {/* Incentive */}
                          <td className="text-right px-4 py-3">
                            <span className={cn('font-bold text-sm', incentive > 0 ? 'text-success-600 dark:text-success-400' : 'text-neutral-400')}>
                              {!activeMethod
                                ? '--'
                                : activeMethod.number === 1 && !liveCalcResult.isEligible
                                  ? '\u2014'
                                  : formatCurrency(incentive)}
                            </span>
                          </td>
                        </tr>
                        {/* Downtime/Idle Reason Row */}
                        <tr className="border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-800/20">
                          <td colSpan={7} className="px-4 py-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                                Downtime / Idle
                              </span>
                              {/* Downtime Reason dropdown */}
                              <div className="flex items-center gap-1.5 min-w-[180px]">
                                <select
                                  value={entry.downtimeReasonId}
                                  onChange={(e) => handleDowntimeReasonChange(idx, e.target.value)}
                                  className="flex-1 px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                                >
                                  <option value="">-- No Reason --</option>
                                  {downtimeReasons.filter(dr => dr.isActive).map(dr => (
                                    <option key={dr.id} value={dr.id}>{dr.name}{dr.code ? ` (${dr.code})` : ''}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setManageDowntimeOpen(true)}
                                  className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 whitespace-nowrap transition-colors"
                                >
                                  Manage
                                </button>
                              </div>
                              {/* Duration presets */}
                              <div className="flex items-center gap-1">
                                {[5, 10, 15, 30, 45, 60, 90, 120].map(mins => (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => handleDowntimeMinutesChange(idx, String(mins))}
                                    className={cn(
                                      'px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors',
                                      entry.downtimeMinutes === mins
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-400 hover:text-primary-600',
                                    )}
                                  >
                                    {mins}m
                                  </button>
                                ))}
                              </div>
                              {/* Custom minutes input */}
                              <input
                                type="number"
                                min={0}
                                value={entry.downtimeMinutes || ''}
                                onChange={(e) => handleDowntimeMinutesChange(idx, e.target.value)}
                                placeholder="min"
                                className="w-16 text-center px-1.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                              />
                            </div>
                          </td>
                        </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Session Controls ── */}
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAddToSession}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  {editingSessionIndex !== null ? 'Update in Session' : 'Add to Session'}
                </button>
                <button
                  onClick={handleChangeMachine}
                  className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Change Machine
                </button>
                <button
                  onClick={handleClearAll}
                  className="py-2.5 px-4 rounded-xl border border-danger-200 dark:border-danger-800 text-sm font-bold text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Clear All
                </button>
              </div>
            </div>
            );
          })()}

          {/* ── Placeholder Area ── */}
          {selectedOperator && !selectedMachine && partEntries.length === 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-8 text-center">
              {placeholderMsg ? (
                <p className="text-sm text-success-600 dark:text-success-400 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  {placeholderMsg}
                </p>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Select a machine above to begin entering production quantities.
                </p>
              )}
            </div>
          )}

          {/* ── Session Mini-Cards ── */}
          {session.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Session Entries ({session.length} machine{session.length !== 1 ? 's' : ''})
              </h3>
              {session.map((sm, sIdx) => (
                <div
                  key={`${sm.machineId}-${sIdx}`}
                  className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center">
                        <Cpu size={14} className="text-success-600 dark:text-success-400" />
                      </div>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {sm.assetCode} -- {sm.assetName}
                      </span>
                      {sm.selectedOperationLabel && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-[10px] font-bold">
                          {sm.selectedOperationLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditSession(sIdx)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} className="text-neutral-500" />
                      </button>
                      <button
                        onClick={() => handleRemoveSession(sIdx)}
                        className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                        title="Remove"
                      >
                        <X size={14} className="text-danger-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sm.entries.map((e) => {
                      const pct = e.shiftTargetQty > 0 ? (e.qtyProduced / e.shiftTargetQty) * 100 : 0;
                      return (
                        <div key={e.partId} className="flex items-center gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold">
                            {e.partNumber}
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {e.qtyProduced}/{e.shiftTargetQty}
                          </span>
                          <span className={cn('font-bold', pctColor(pct))}>{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ── Pre-save confirmation line ── */}
              {activeMethod && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">
                  Save entries for {selectedOperator?.name ?? 'operator'} — {formatCurrency(liveCalcResult.totalIncentive)} incentive · {activeMethod.name}
                </p>
              )}

              {/* ── Save Operator Button ── */}
              <button
                ref={saveButtonRef}
                onClick={handleSaveEntries}
                disabled={saveMutation.isPending || session.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IndianRupee size={16} />
                    Save entries for {selectedOperator?.name.split(' ')[0] ?? 'operator'} (Enter)
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Empty state when nothing selected ── */}
          {!selectedOperator && !placeholderMsg && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-primary-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Start by selecting an operator</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Search for an operator above to begin entering their production data for this shift.
              </p>
            </div>
          )}

          {/* ── Post-save placeholder ── */}
          {!selectedOperator && placeholderMsg && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-8 text-center">
              <p className="text-sm text-success-600 dark:text-success-400 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                {placeholderMsg}
              </p>
            </div>
          )}
        </div>

        {/* ═══════ RIGHT COLUMN ═══════ */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          {/* ── Live Incentive Panel ── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="bg-primary-600 text-white rounded-t-2xl p-4">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Live Incentive</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(liveCalcResult.totalIncentive)}</p>
            </div>

            {/* Part breakdown */}
            <div className="max-h-[300px] overflow-y-auto px-4 py-2">
              {liveCalcResult.partResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-neutral-400">
                  Select an operator and machine to see live calculations.
                </div>
              ) : (
                liveCalcResult.partResults.map((part: any) => {
                  const pct = Number(part.achievementPct).toFixed(0);
                  const qty = part.qtyProduced ?? 0;
                  const target = part.shiftTargetQty ?? 0;
                  const inc = Number(part.incentiveAmount);
                  const isMethod2 = activeMethod?.number === 2;

                  return (
                    <div key={`${part.partId}-${part.machineId}`} className="flex flex-col gap-0.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      {/* Row 1: Part identifier + incentive amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary-950 dark:text-white truncate max-w-[160px]">
                          {part.partNumber}({part.machineCode})
                        </span>
                        <span className={cn("text-xs font-bold tabular-nums", inc > 0 ? "text-success-600" : "text-neutral-400")}>
                          {activeMethod ? `\u20B9${inc.toFixed(2)}` : '--'}
                        </span>
                      </div>
                      {/* Row 2: Production info — method-specific */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {isMethod2
                            ? <>Achieved <span className="font-semibold text-neutral-700 dark:text-neutral-300">{pct}%</span> {'\u2192'} <span className="font-semibold text-neutral-700 dark:text-neutral-300">{part.consideredPct ?? 0}%</span> slab</>
                            : <>{qty}/{target} {'\u00b7'} Produced <span className="font-semibold text-neutral-700 dark:text-neutral-300">{pct}%</span></>
                          }
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {part.appliedSlabLabel && part.appliedSlabLabel !== 'N/A'
                            ? `${part.appliedSlabLabel}: \u20B9${part.appliedRate}/pc`
                            : part.earningQty > 0 ? `${part.earningQty} pcs earn` : '\u2014'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500">
                    {!activeMethod ? 'Overall' : activeMethod.number === 2 ? 'Milestone total' : 'Cumulative ratio'}
                  </span>
                  <span className={cn("text-[10px] font-bold", liveCalcResult.isEligible ? "text-success-600" : "text-warning-600")}>
                    {!activeMethod
                      ? 'No method'
                      : activeMethod.number === 2
                        ? `${Number(liveCalcResult.cumulativeRatio).toFixed(0)}% milestones ${liveCalcResult.isEligible ? '\u2713' : '\u2014 Need \u2265 100%'}`
                        : `${Number(liveCalcResult.cumulativeRatio).toFixed(1)}% ${liveCalcResult.isEligible ? 'Eligible \u2713' : '\u2014 Need > 100%'}`}
                  </span>
                </div>
              </div>
              {activeMethod?.number === 1 && !liveCalcResult.isEligible && liveCalcResult.partResults.length > 0 && (() => {
                const deficit = 1.0 - (liveCalcResult.cumulativeRatio / 100);
                const hint = liveCalcResult.partResults.find((p) => p.shiftTargetQty > 0);
                if (!hint || deficit <= 0) return null;
                const morePcs = Math.ceil(deficit * hint.shiftTargetQty);
                return (
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5 text-center">
                    {morePcs} more pcs of {hint.partNumber} to unlock incentive
                  </p>
                );
              })()}
            </div>
          </div>

          {/* ── Saved This Shift Panel ── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Saved this shift</h3>
            </div>
            {savedOperators.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-400">No saved entries yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[250px] overflow-y-auto">
                {savedOperators.map((so, i) => (
                  <div key={`${so.operatorId}-${i}`} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{so.name}</p>
                      <p className="text-xs text-neutral-500">{so.machineCount} machine{so.machineCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-bold', so.totalIncentive > 0 ? 'text-success-600 dark:text-success-400' : 'text-neutral-500')}>
                        {formatCurrency(so.totalIncentive)}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                          so.isEligible
                            ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
                        )}
                      >
                        {so.isEligible ? 'Eligible' : 'Below 100%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Manage Downtime Reasons Modal ── */}
      <ManageModal
        open={manageDowntimeOpen}
        onClose={() => setManageDowntimeOpen(false)}
        title="Downtime / Idle Reasons"
        items={downtimeReasons.map((dr) => ({ id: dr.id, name: dr.name, code: dr.code ?? null }))}
        isLoading={downtimeReasonsLoading}
        createFields={[
          { key: 'name', label: 'Name', placeholder: 'e.g. Power Failure', required: true },
        ]}
        onCreate={async (values) => {
          await createDtMutation.mutateAsync({ name: values.name });
          showSuccess('Created', 'Downtime reason created.');
        }}
        onUpdate={async (id, values) => {
          await updateDtMutation.mutateAsync({ id, data: { name: values.name } });
          showSuccess('Updated', 'Downtime reason updated.');
        }}
        onDelete={async (id) => {
          await deleteDtMutation.mutateAsync(id);
          showSuccess('Deleted', 'Downtime reason deleted.');
        }}
        isCreating={createDtMutation.isPending}
        isUpdating={updateDtMutation.isPending}
        isDeleting={deleteDtMutation.isPending}
      />

      {/* ═══════ TODAY'S SAVED ENTRIES TABLE (Full Width) ═══════ */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Today's saved entries</h3>
            {(savedEntries.length > 0 || todaySaved.length > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                {savedEntries.length + todaySaved.length}
              </span>
            )}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <Download size={12} />
            Export
          </button>
        </div>

        {savedEntries.length === 0 && todaySaved.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No entries yet"
              message="Saved production entries for today will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Operator</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Machine</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Operation</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Part</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Qty</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Target</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">%</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Method</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Incentive</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Locally saved entries (current session) */}
                {savedEntries.map((se, idx) => {
                  const badge = statusBadge(se.pct, se.incentive);
                  return (
                    <tr key={`local-${idx}`} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-3">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">{se.operatorName}</p>
                        <p className="text-xs text-neutral-500">{se.employeeId}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-neutral-900 dark:text-white text-sm">{se.machineCode}</p>
                        <p className="text-xs text-neutral-500">{se.machineName}</p>
                      </td>
                      <td className="px-3 py-3">
                        {se.operationCode ? (
                          <>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-bold">
                              {se.operationCode}
                            </span>
                            {se.operationName && (
                              <p className="text-[10px] text-neutral-500 mt-0.5">{se.operationName}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-neutral-400">--</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                          {se.partNumber}
                        </span>
                        <p className="text-xs text-neutral-500 mt-0.5">{se.partName}</p>
                      </td>
                      <td className="text-center px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300">{se.qty}</td>
                      <td className="text-center px-3 py-3 text-neutral-500">{se.target}</td>
                      <td className={cn('text-center px-3 py-3 font-bold', pctColor(se.pct))}>{se.pct.toFixed(0)}%</td>
                      <td className="px-3 py-3 text-neutral-600 dark:text-neutral-400 text-xs">{se.method}</td>
                      <td className="text-right px-3 py-3">
                        <span className={cn('font-bold', se.incentive > 0 ? 'text-success-600 dark:text-success-400' : 'text-neutral-400')}>
                          {formatCurrency(se.incentive)}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold border', badge.cls)}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Server-side saved entries from API query */}
                {todaySaved.map((entry) => {
                  const pct = Number(entry.achievementPct ?? (entry.shiftTargetQty > 0 ? (entry.qtyProduced / entry.shiftTargetQty) * 100 : 0));
                  const badge = statusBadge(pct, Number(entry.incentiveAmount ?? 0));
                  return (
                    <tr key={entry.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-3">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm">
                          {entry.operator ? `${entry.operator.firstName ?? ''} ${entry.operator.lastName ?? ''}`.trim() : entry.operatorId}
                        </p>
                        {entry.operator?.employeeId && (
                          <p className="text-[10px] text-neutral-400">{entry.operator.employeeId}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-neutral-900 dark:text-white text-sm">
                          {entry.slabConfig?.machine?.assetName ?? entry.machineId}
                        </p>
                        {entry.slabConfig?.machine?.assetCode && (
                          <p className="text-[10px] text-neutral-400">{entry.slabConfig.machine.assetCode}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {entry.operation ? (
                          <>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-bold">
                              {entry.operation.code}
                            </span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{entry.operation.name}</p>
                          </>
                        ) : (
                          <span className="text-xs text-neutral-400">--</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                          {entry.slabConfig?.part?.partNumber ?? entry.partId}
                        </span>
                        {entry.slabConfig?.part?.name && (
                          <p className="text-[10px] text-neutral-400 mt-0.5">{entry.slabConfig.part.name}</p>
                        )}
                      </td>
                      <td className="text-center px-3 py-3 font-semibold text-neutral-700 dark:text-neutral-300">{entry.qtyProduced}</td>
                      <td className="text-center px-3 py-3 text-neutral-500">{entry.shiftTargetQty}</td>
                      <td className={cn('text-center px-3 py-3 font-bold', pctColor(pct))}>{pct.toFixed(0)}%</td>
                      <td className="px-3 py-3 text-neutral-600 dark:text-neutral-400 text-xs">{entry.methodUsed ?? '--'}</td>
                      <td className="text-right px-3 py-3">
                        <span className={cn('font-bold', Number(entry.incentiveAmount) > 0 ? 'text-success-600 dark:text-success-400' : 'text-neutral-400')}>
                          {formatCurrency(Number(entry.incentiveAmount ?? 0))}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold border', badge.cls)}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
