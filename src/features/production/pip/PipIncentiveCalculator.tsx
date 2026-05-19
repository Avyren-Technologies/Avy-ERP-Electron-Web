import { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  X,
  Loader2,
  Zap,
  Target,
  AlertTriangle,
  TrendingUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipConfig, usePipSlabConfigs } from '@/features/production/pip/api/use-pip-queries';
import { useSimulatePipIncentive } from '@/features/production/pip/api/use-pip-mutations';
import { useParts } from '@/features/masters/api/use-masters-queries';
import { showApiError } from '@/lib/toast';
import type { PipIncentiveConfig as PipIncentiveConfigType, SlabTier, CalculationResult } from '@/lib/api/pip';
import type { Part } from '@/lib/api/masters';

/* ── Types ── */

interface PartRow {
  partId: string;
  qty: string;
}

/* ── Client-side calculation helpers (mirrors DailyEntry) ── */

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

interface SlabPartInfo {
  partId: string;
  partNumber: string;
  partName: string;
  shiftTargetQty: number;
  slabTiers: SlabTier[];
}

interface SampleCase {
  label: string;
  operator: string;
  parts: { partId: string; qty: number }[];
  description: string;
}

/* ── Sample Cases ── */

function buildSampleCases(slabParts: SlabPartInfo[]): SampleCase[] {
  if (slabParts.length === 0) return [];
  const p1 = slabParts[0];
  const p2 = slabParts.length > 1 ? slabParts[1] : slabParts[0];

  return [
    {
      label: 'Below Target',
      operator: 'Operator A',
      parts: [{ partId: p1.partId, qty: Math.floor(p1.shiftTargetQty * 0.6) }],
      description: 'Single part, below 100%',
    },
    {
      label: 'Exactly at Target',
      operator: 'Operator B',
      parts: [{ partId: p1.partId, qty: p1.shiftTargetQty }],
      description: 'Meets shift target exactly',
    },
    {
      label: 'Above Target',
      operator: 'Operator C',
      parts: [{ partId: p1.partId, qty: Math.floor(p1.shiftTargetQty * 1.3) }],
      description: 'Exceeds target by 30%',
    },
    {
      label: 'Multi-Part Eligible',
      operator: 'Operator D',
      parts: [
        { partId: p1.partId, qty: Math.floor(p1.shiftTargetQty * 0.5) },
        { partId: p2.partId, qty: Math.floor(p2.shiftTargetQty * 0.7) },
      ],
      description: 'Cumulative passes 100%',
    },
    {
      label: 'High Performer',
      operator: 'Operator E',
      parts: [
        { partId: p1.partId, qty: Math.floor(p1.shiftTargetQty * 1.5) },
        { partId: p2.partId, qty: Math.floor(p2.shiftTargetQty * 1.2) },
      ],
      description: 'All parts exceed targets',
    },
  ];
}

function calcSampleCase(
  partsConfig: Map<string, SlabPartInfo>,
  caseParts: { partId: string; qty: number }[],
  methodNumber: number,
): { completion: number; eligible: boolean; incentive: number } {
  const inputs = caseParts
    .map((cp) => {
      const cfg = partsConfig.get(cp.partId);
      if (!cfg) return null;
      return { ...cfg, qtyProduced: cp.qty };
    })
    .filter(Boolean) as (SlabPartInfo & { qtyProduced: number })[];

  if (!inputs.length) return { completion: 0, eligible: false, incentive: 0 };

  const cumulativeRatio = inputs.reduce(
    (s, p) => s + (p.shiftTargetQty > 0 ? p.qtyProduced / p.shiftTargetQty : 0),
    0,
  );
  const cumulativePct = cumulativeRatio * 100;

  if (methodNumber === 1) {
    if (cumulativePct < 100) return { completion: cumulativePct, eligible: false, incentive: 0 };
    let totalIncentive = 0;
    let runningRatio = 0;
    for (const p of inputs) {
      const pctContrib = p.shiftTargetQty > 0 ? p.qtyProduced / p.shiftTargetQty : 0;
      const prev = runningRatio;
      runningRatio += pctContrib;
      let earningQty = 0;
      if (prev >= 1) {
        // Case B: already past 100% — full qty earns
        earningQty = p.qtyProduced;
      } else if (runningRatio > 1) {
        // Case C: this part crosses 100% — only qty past threshold earns
        const needed = (1 - prev) * p.shiftTargetQty;
        earningQty = Math.max(0, p.qtyProduced - Math.ceil(needed));
      }
      // Case A: runningRatio <= 1 — earningQty stays 0
      const excessAboveTarget = Math.max(0, p.qtyProduced - p.shiftTargetQty);
      const slab1Earning = Math.max(0, earningQty - excessAboveTarget);
      const slab1Rate = p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0;
      totalIncentive += slab1Earning * slab1Rate + (excessAboveTarget > 0 ? getSlabRate(p.slabTiers, excessAboveTarget) : 0);
    }
    return { completion: cumulativePct, eligible: true, incentive: totalIncentive };
  }

  if (methodNumber === 2) {
    const milestones = [100, 75, 50, 25];
    let totalMilestonePct = 0;
    let totalIncentive = 0;
    const partCalcs = inputs.map((p) => {
      const pct = p.shiftTargetQty > 0 ? (p.qtyProduced / p.shiftTargetQty) * 100 : 0;
      const milestone = milestones.find((m) => pct >= m) ?? 0;
      const milestoneQty = Math.round((milestone / 100) * p.shiftTargetQty);
      const remainingQty = Math.max(0, p.qtyProduced - milestoneQty);
      totalMilestonePct += milestone;
      return { ...p, milestone, milestoneQty, remainingQty };
    });
    const milestoneEligible = totalMilestonePct >= 100;
    for (const p of partCalcs) {
      if (milestoneEligible && p.milestone > 0 && p.remainingQty > 0) {
        const slab1Rate = p.slabTiers.length > 0 ? p.slabTiers[0].ratePerPiece : 0;
        totalIncentive += p.remainingQty * slab1Rate;
      }
    }
    return { completion: totalMilestonePct, eligible: milestoneEligible, incentive: totalIncentive };
  }

  return { completion: cumulativePct, eligible: false, incentive: 0 };
}

/* ── Screen ── */

export function PipIncentiveCalculator() {
  const { data: configData, isLoading: configLoading } = usePipConfig();
  const { data: slabData } = usePipSlabConfigs({ limit: 500 });
  const { data: partsData } = useParts({ limit: 500, status: 'ACTIVE' });

  const simulateMutation = useSimulatePipIncentive();

  const config: PipIncentiveConfigType | undefined = configData?.data;
  const allParts: Part[] = partsData?.data ?? [];

  const activeMethodNumber = config?.method1Enabled ? 1 : config?.method2Enabled ? 2 : null;
  const activeMethodName = activeMethodNumber === 1
    ? (config?.method1Name || 'Method 1')
    : activeMethodNumber === 2
      ? (config?.method2Name || 'Method 2')
      : null;

  // Build part lookup from slab configs
  const slabPartsMap = useMemo(() => {
    const map = new Map<string, SlabPartInfo>();
    const slabs = slabData?.data ?? [];
    for (const s of slabs) {
      if (!s.isActive || !s.part) continue;
      map.set(s.partId, {
        partId: s.partId,
        partNumber: s.part.partNumber,
        partName: s.part.name,
        shiftTargetQty: s.shiftTargetQty,
        slabTiers: s.slabTiers,
      });
    }
    return map;
  }, [slabData]);

  // Part options for dropdown (only parts with slab configs)
  const partOptions = useMemo(() => {
    return allParts
      .filter((p) => slabPartsMap.has(p.id))
      .map((p) => {
        const cfg = slabPartsMap.get(p.id);
        return {
          id: p.id,
          label: `${p.partNumber} -- ${p.name} (target: ${cfg?.shiftTargetQty ?? '?'})`,
        };
      });
  }, [allParts, slabPartsMap]);

  // Input state
  const [partRows, setPartRows] = useState<PartRow[]>([{ partId: '', qty: '' }]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Duplicate detection: set of partIds that appear more than once
  const duplicatePartIds = useMemo<Set<string>>(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const row of partRows) {
      if (!row.partId) continue;
      if (seen.has(row.partId)) dupes.add(row.partId);
      else seen.add(row.partId);
    }
    return dupes;
  }, [partRows]);

  const addPartRow = () => setPartRows((r) => [...r, { partId: '', qty: '' }]);
  const removePartRow = (idx: number) => setPartRows((r) => r.filter((_, i) => i !== idx));
  const updatePartRow = (idx: number, field: keyof PartRow, value: string) => {
    setPartRows((r) => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleCalculate = async () => {
    const entries = partRows
      .filter((r) => r.partId && r.qty && Number(r.qty) > 0)
      .map((r) => ({ partId: r.partId, qtyProduced: Number(r.qty) }));

    if (!entries.length) {
      showApiError({ message: 'Add at least one part with quantity' });
      return;
    }

    try {
      const res = await simulateMutation.mutateAsync({ parts: entries });
      setResult(res?.data ?? null);
    } catch (err) {
      showApiError(err);
    }
  };

  // Sample cases
  const slabPartsArray = useMemo(() => Array.from(slabPartsMap.values()), [slabPartsMap]);
  const sampleCases = useMemo(() => buildSampleCases(slabPartsArray), [slabPartsArray]);
  const sampleResults = useMemo(() => {
    if (!activeMethodNumber || !sampleCases.length) return [];
    return sampleCases.map((sc) => calcSampleCase(slabPartsMap, sc.parts, activeMethodNumber));
  }, [activeMethodNumber, sampleCases, slabPartsMap]);

  const noMethod = !activeMethodNumber;

  if (configLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          <div className="h-80 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
              Incentive Calculator
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Simulate and verify incentive calculations for any operator scenario
            </p>
          </div>
        </div>
        {activeMethodNumber ? (
          <span
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border',
              activeMethodNumber === 1
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800/50'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
            )}
          >
            {activeMethodNumber === 1 ? <Zap size={16} /> : <Target size={16} />}
            {activeMethodName} active
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50">
            <AlertTriangle size={16} />
            No method active
          </span>
        )}
      </div>

      {/* Warning when no method */}
      {noMethod && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              No calculation method enabled
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Enable an incentive method in Incentive Configuration before using the calculator.
            </p>
          </div>
        </div>
      )}

      {/* Two-column: Input + Result */}
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', noMethod && 'opacity-50 pointer-events-none')}>
        {/* Input Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-lg">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Simulation Input</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Method info */}
            {activeMethodName && (
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={14} className="text-neutral-400" />
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Active Method
                  </span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {activeMethodNumber === 1
                    ? 'Excess Ratio: Operator must achieve cumulative >=100% across all parts. Only qty past 100% earns at Slab 1; excess above individual target uses full tiers.'
                    : 'Milestone Rounding: Each part rounds down to nearest 25% milestone. If milestones sum to >=100%, remaining qty earns incentive.'}
                </p>
              </div>
            )}

            {/* Parts & Quantities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Parts &amp; Quantities
                </p>
                <button
                  onClick={addPartRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  <Plus size={14} />
                  Add Part
                </button>
              </div>
              <div className="space-y-3">
                {partRows.map((row, idx) => {
                  const isDuplicate = row.partId !== '' && duplicatePartIds.has(row.partId);
                  const duplicatePartLabel = isDuplicate
                    ? (partOptions.find((p) => p.id === row.partId)?.label ?? row.partId)
                    : '';
                  return (
                    <div key={idx} className="space-y-1">
                      <div className={cn('flex items-center gap-2 rounded-xl', isDuplicate && 'ring-2 ring-amber-400 dark:ring-amber-500')}>
                        <select
                          value={row.partId}
                          onChange={(e) => updatePartRow(idx, 'partId', e.target.value)}
                          className={cn(
                            'flex-1 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all',
                            isDuplicate
                              ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-neutral-200 dark:border-neutral-700',
                          )}
                        >
                          <option value="">Select part...</option>
                          {partOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={row.qty}
                          onChange={(e) => updatePartRow(idx, 'qty', e.target.value)}
                          placeholder="Qty"
                          className={cn(
                            'w-28 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all',
                            isDuplicate
                              ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'border-neutral-200 dark:border-neutral-700',
                          )}
                        />
                        <button
                          onClick={() => removePartRow(idx)}
                          disabled={partRows.length <= 1}
                          className="p-2 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {isDuplicate && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 pl-1 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {duplicatePartLabel} is already in this calculation — duplicate parts will skew the ratio
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={simulateMutation.isPending || noMethod}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
            >
              {simulateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Calculator size={16} />
              )}
              {simulateMutation.isPending ? 'Calculating...' : 'Calculate Incentive'}
            </button>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-lg overflow-hidden">
          {result ? (
            <>
              {/* Result Header */}
              <div
                className={cn(
                  'px-6 py-5 border-b',
                  result.isEligible
                    ? 'bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800/50'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Result
                    </p>
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">
                      {result.methodUsed}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-3xl font-extrabold',
                        result.isEligible
                          ? 'text-success-700 dark:text-success-400'
                          : 'text-amber-700 dark:text-amber-400',
                      )}
                    >
                      {'\u20B9'}{Number(result.totalIncentive).toFixed(2)}
                    </p>
                    <span
                      className={cn(
                        'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border mt-1',
                        result.isEligible
                          ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50'
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
                      )}
                    >
                      {result.isEligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-part rows */}
              <div className="p-6 space-y-3">
                {(result.parts ?? []).map((part, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50 mr-2">
                        {part.partNumber}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {part.qtyProduced}/{part.shiftTargetQty} ({Number(part.achievementPct).toFixed(0)}%)
                      </span>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {part.breakdown}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        Number(part.incentiveAmount) > 0
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-neutral-400',
                      )}
                    >
                      {'\u20B9'}{Number(part.incentiveAmount).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Overall completion
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border',
                      Number(result.cumulativeRatio) >= 100
                        ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                        : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
                    )}
                  >
                    <TrendingUp size={12} />
                    {Number(result.cumulativeRatio).toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Calculator className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                No calculation yet
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">
                Select parts, enter quantities, and click Calculate to see the incentive breakdown.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sample Cases Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-primary-950 dark:text-white">Sample Scenarios</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            Pre-built cases to illustrate how the active method calculates incentives
          </p>
        </div>

        {noMethod ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Enable an incentive method to see sample cases
            </p>
          </div>
        ) : sampleCases.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              No slab configurations found. Add slab configs to see sample calculations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Case</th>
                  <th className="py-4 px-6 font-bold">Operator</th>
                  <th className="py-4 px-6 font-bold">Parts &amp; Qty</th>
                  <th className="py-4 px-6 font-bold">Completion</th>
                  <th className="py-4 px-6 font-bold">Eligible</th>
                  <th className="py-4 px-6 font-bold">Incentive</th>
                  <th className="py-4 px-6 font-bold">Insight</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sampleCases.map((sc, idx) => {
                  const r = sampleResults[idx];
                  return (
                    <tr
                      key={idx}
                      className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">
                        {sc.label}
                      </td>
                      <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                        {sc.operator}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {sc.parts.map((p, pi) => {
                            const cfg = slabPartsMap.get(p.partId);
                            return (
                              <span
                                key={pi}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold border border-primary-100 dark:border-primary-800/50"
                              >
                                {cfg?.partNumber ?? '?'}({p.qty})
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            'font-bold',
                            r && Number(r.completion ?? 0) >= 100
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {r ? `${Number(r.completion ?? 0).toFixed(0)}%` : '--'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {r ? (
                          <span
                            className={cn(
                              'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border',
                              r.eligible
                                ? 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50'
                                : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
                            )}
                          >
                            {r.eligible ? 'Yes' : 'No'}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            'font-bold',
                            r && Number(r.incentive ?? 0) > 0
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-neutral-400',
                          )}
                        >
                          {r ? `\u20B9${Number(r.incentive ?? 0).toFixed(2)}` : '--'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">
                        {sc.description}
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
