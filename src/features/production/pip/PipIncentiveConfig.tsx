import { useState, useEffect } from 'react';
import { Save, Loader2, ArrowRight, AlertTriangle, Zap, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipConfig } from '@/features/production/pip/api/use-pip-queries';
import { useUpdatePipConfig } from '@/features/production/pip/api/use-pip-mutations';
import { showSuccess, showApiError } from '@/lib/toast';
import type { PipIncentiveConfig } from '@/lib/api/pip';

/* ── Method descriptions (static) ── */

const METHOD_1_DESCRIPTION =
  'Operator must achieve cumulative completion \u2265 100% across all parts worked. Only the qty that pushed past 100% earns at Slab 1 rate; production beyond each part\u2019s individual target earns full slab tiers.';

const METHOD_1_EXAMPLE =
  'Example: P-102: 40/80 (50%) + P-104: 70/120 \u2192 Cumul. = 108%. First 60 pcs of P-104 reach 100%; remaining 10 pcs \u00d7 \u20b90.50 = \u20b95.00';

const METHOD_2_DESCRIPTION =
  'Each part\u2019s actual completion is rounded down to the nearest milestone (25%, 50%, 75%, 100%). The milestone qty counts toward the shift target; all remaining produced qty earns incentive at Slab 1 rate \u2014 as long as total milestones sum to \u2265 100%.';

const METHOD_2_EXAMPLE =
  'Example: P-101: 85/100 \u2192 75% milestone (75 pcs). Remaining 10 pcs earn at Slab 1 rate. P-103: 55/50 \u2192 100% milestone (50 pcs). 5 pcs earn full slab tiers.';

/* ── Toggle Switch ── */

function ToggleSwitch({ checked, onChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-12 h-7 rounded-full transition-colors relative flex-shrink-0',
        checked ? 'bg-primary-600' : 'bg-neutral-300 dark:bg-neutral-700',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-sm',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  );
}

/* ── Method Card ── */

function MethodCard({
  methodNumber,
  subtitle,
  accent,
  accentBg,
  accentBorder,
  accentIcon,
  name,
  onNameChange,
  enabled,
  onToggle,
  description,
  example,
  saving,
}: {
  methodNumber: 1 | 2;
  subtitle: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentIcon: React.ReactNode;
  name: string;
  onNameChange: (v: string) => void;
  enabled: boolean;
  onToggle: () => void;
  description: string;
  example: string;
  saving: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl border shadow-lg transition-all duration-300',
        enabled
          ? `${accentBorder} shadow-xl`
          : 'border-neutral-200/60 dark:border-neutral-800 opacity-60',
      )}
    >
      {/* Card Header */}
      <div className={cn('px-6 py-4 border-b rounded-t-2xl', enabled ? accentBg : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-100 dark:border-neutral-800')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', enabled ? accentBg : 'bg-neutral-100 dark:bg-neutral-800')}>
              {accentIcon}
            </div>
            <div>
              <span className={cn('text-xs font-extrabold uppercase tracking-widest', accent)}>
                Method {methodNumber}
              </span>
              <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('text-xs font-bold', enabled ? 'text-success-600 dark:text-success-400' : 'text-neutral-400 dark:text-neutral-500')}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
            <ToggleSwitch checked={enabled} onChange={onToggle} disabled={saving} />
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            placeholder={`Method ${methodNumber} name`}
          />
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            How it works
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Example Box */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-mono">
            {example}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Screen ── */

export function PipIncentiveConfig() {
  const { data: configData, isLoading } = usePipConfig();
  const updateMutation = useUpdatePipConfig();

  const config: PipIncentiveConfig | undefined = configData?.data;

  // Local state for names and toggles
  const [method1Enabled, setMethod1Enabled] = useState(false);
  const [method2Enabled, setMethod2Enabled] = useState(false);
  const [method1Name, setMethod1Name] = useState('Excess Ratio Incentive');
  const [method2Name, setMethod2Name] = useState('Milestone Rounding Incentive');

  // Advanced Setting — Extra Hours Production
  const [differentiateExtraHours, setDifferentiateExtraHours] = useState(false);
  const [defaultShiftHours, setDefaultShiftHours] = useState(8);
  const [extraHoursWarnThreshold, setExtraHoursWarnThreshold] = useState(0);
  const [splitExtraHoursEarning, setSplitExtraHoursEarning] = useState(false);
  const [extraHoursEarningCode, setExtraHoursEarningCode] = useState('PIP_EXTRA_HOURS');

  // Sync from server
  useEffect(() => {
    if (config) {
      setMethod1Enabled(config.method1Enabled);
      setMethod2Enabled(config.method2Enabled);
      setMethod1Name(config.method1Name || 'Excess Ratio Incentive');
      setMethod2Name(config.method2Name || 'Milestone Rounding Incentive');
      setDifferentiateExtraHours(config.differentiateExtraHours);
      setDefaultShiftHours(config.defaultShiftHours || 8);
      setExtraHoursWarnThreshold(config.extraHoursWarnThreshold ?? 0);
      setSplitExtraHoursEarning(config.splitExtraHoursEarning);
      setExtraHoursEarningCode(config.extraHoursEarningCode || 'PIP_EXTRA_HOURS');
    }
  }, [config]);

  /* ── Mutual-exclusion toggle handlers ── */

  const handleToggleMethod1 = async () => {
    const newVal = !method1Enabled;
    setMethod1Enabled(newVal);
    if (newVal) setMethod2Enabled(false);

    try {
      await updateMutation.mutateAsync({
        method1Enabled: newVal,
        method2Enabled: newVal ? false : method2Enabled,
      });
      showSuccess('Method Updated', newVal ? 'Method 1 enabled' : 'Method 1 disabled');
    } catch (err) {
      // Revert on failure
      setMethod1Enabled(!newVal);
      if (newVal) setMethod2Enabled(config?.method2Enabled ?? false);
      showApiError(err);
    }
  };

  const handleToggleMethod2 = async () => {
    const newVal = !method2Enabled;
    setMethod2Enabled(newVal);
    if (newVal) setMethod1Enabled(false);

    try {
      await updateMutation.mutateAsync({
        method2Enabled: newVal,
        method1Enabled: newVal ? false : method1Enabled,
      });
      showSuccess('Method Updated', newVal ? 'Method 2 enabled' : 'Method 2 disabled');
    } catch (err) {
      setMethod2Enabled(!newVal);
      if (newVal) setMethod1Enabled(config?.method1Enabled ?? false);
      showApiError(err);
    }
  };

  /* ── Differentiate Extra Hours — immediate toggle ── */

  const handleToggleDifferentiateExtraHours = async () => {
    const newVal = !differentiateExtraHours;
    setDifferentiateExtraHours(newVal);

    try {
      await updateMutation.mutateAsync({ differentiateExtraHours: newVal });
      showSuccess(
        'Extra Hours Updated',
        newVal ? 'Extra-hours differentiation enabled' : 'Extra-hours differentiation disabled',
      );
    } catch (err) {
      // Revert on failure
      setDifferentiateExtraHours(!newVal);
      showApiError(err);
    }
  };

  /* ── Save names + advanced settings ── */

  const handleSaveNames = async () => {
    if (!method1Name.trim() || !method2Name.trim()) {
      showApiError({ message: 'Both method names are required' });
      return;
    }
    if (differentiateExtraHours && (defaultShiftHours < 1 || defaultShiftHours > 24)) {
      showApiError({ message: 'Default Shift Hours must be between 1 and 24' });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        method1Name: method1Name.trim(),
        method2Name: method2Name.trim(),
        defaultShiftHours,
        extraHoursWarnThreshold,
        splitExtraHoursEarning,
        extraHoursEarningCode: extraHoursEarningCode.trim() || 'PIP_EXTRA_HOURS',
      });
      showSuccess('Configuration Saved', 'Custom method names have been updated.');
    } catch (err) {
      showApiError(err);
    }
  };

  // Live example math (guard divide-by-zero)
  const exampleTarget = 800;
  const safeShiftHours = defaultShiftHours > 0 ? defaultShiftHours : 1;
  const examplePerHour = (exampleTarget / safeShiftHours).toFixed(1);
  const exampleExtraTarget = Math.ceil((exampleTarget / safeShiftHours) * 2);

  const saving = updateMutation.isPending;
  const bothOff = !method1Enabled && !method2Enabled;

  if (isLoading) {
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
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
            Incentive Configuration
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Enable or disable incentive calculation methods and set their names
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNames}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <a
            href="/production/pip/daily-entry"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            Go to Daily Entry
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Method Cards — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MethodCard
          methodNumber={1}
          subtitle="Excess Ratio Based"
          accent="text-primary-600 dark:text-primary-400"
          accentBg="bg-primary-50 dark:bg-primary-900/20"
          accentBorder="border-primary-200 dark:border-primary-800/50"
          accentIcon={<Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
          name={method1Name}
          onNameChange={setMethod1Name}
          enabled={method1Enabled}
          onToggle={handleToggleMethod1}
          description={METHOD_1_DESCRIPTION}
          example={METHOD_1_EXAMPLE}
          saving={saving}
        />
        <MethodCard
          methodNumber={2}
          subtitle="Percentage-Based Milestone"
          accent="text-amber-600 dark:text-amber-400"
          accentBg="bg-amber-50 dark:bg-amber-900/20"
          accentBorder="border-amber-200 dark:border-amber-800/50"
          accentIcon={<Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          name={method2Name}
          onNameChange={setMethod2Name}
          enabled={method2Enabled}
          onToggle={handleToggleMethod2}
          description={METHOD_2_DESCRIPTION}
          example={METHOD_2_EXAMPLE}
          saving={saving}
        />
      </div>

      {/* ── Advanced Setting ── */}
      <div className="space-y-4">
        {/* Section heading / separator */}
        <div className="flex items-center gap-3 pt-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Advanced Setting
          </span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6 space-y-5">
          {/* Differentiate Extra Hours — pill toggle (immediate) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-50 dark:bg-primary-900/20">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-950 dark:text-white">
                  Differentiate Extra Hours Production
                </p>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Track production worked beyond shift hours separately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold',
                  differentiateExtraHours
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                )}
              >
                <Clock className="w-3 h-3" />
                Extra Hrs
                <span className="font-extrabold">{differentiateExtraHours ? 'On' : 'Off'}</span>
              </span>
              <ToggleSwitch
                checked={differentiateExtraHours}
                onChange={handleToggleDifferentiateExtraHours}
                disabled={saving}
              />
            </div>
          </div>

          {/* Expanded controls */}
          {differentiateExtraHours && (
            <div className="space-y-5 pt-5 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Default Shift Hours */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Default Shift Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={defaultShiftHours}
                    onChange={(e) => setDefaultShiftHours(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    Fallback used when a shift has no defined start/end times.
                  </p>
                </div>

                {/* Hourly Target Rate (read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    Hourly Target Rate
                  </label>
                  <div className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-600 dark:text-neutral-300">
                    Auto-calculated per part = Shift Target &divide; Shift Hours
                  </div>
                </div>
              </div>

              {/* Live example callout */}
              <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl p-4">
                <Target className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed font-mono">
                  Example: {exampleTarget} pcs target &divide; {defaultShiftHours} hrs = {examplePerHour} pcs/hr.
                  For 2 extra hours, target = {exampleExtraTarget} pcs.
                </p>
              </div>

              {/* Extra Hours Warning Threshold */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                  Warn when extra hours exceed (hrs)
                </label>
                <input
                  type="number"
                  min={0}
                  value={extraHoursWarnThreshold}
                  onChange={(e) => setExtraHoursWarnThreshold(Number(e.target.value))}
                  className="w-full sm:w-1/2 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                />
              </div>

              {/* Split Extra Hours Earning toggle */}
              <div className="pt-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary-950 dark:text-white">
                      Split Extra Hours Earning
                    </p>
                    <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      Post extra-hours incentive as a separate payroll earning line (PIP_EXTRA_HOURS) instead of combining into PIP_INCENTIVE.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={splitExtraHoursEarning}
                    onChange={setSplitExtraHoursEarning}
                    disabled={saving}
                  />
                </div>

                {splitExtraHoursEarning && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Extra Hours Earning Code
                    </label>
                    <input
                      type="text"
                      value={extraHoursEarningCode}
                      onChange={(e) => setExtraHoursEarningCode(e.target.value)}
                      className="w-full sm:w-1/2 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all font-mono"
                      placeholder="PIP_EXTRA_HOURS"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Both-off Warning */}
      {bothOff && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              No calculation method enabled
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Incentive calculations will not run until at least one method is enabled. Daily entries can still be recorded, but no incentive amounts will be computed.
            </p>
          </div>
        </div>
      )}

      {/* Active Method Indicator */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
          Active Calculation Method
        </p>
        {method1Enabled ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50">
              <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                Method 1 active:
              </span>
            </span>
            <span className="text-sm font-medium text-primary-950 dark:text-white">
              {method1Name}
            </span>
          </div>
        ) : method2Enabled ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Method 2 active:
              </span>
            </span>
            <span className="text-sm font-medium text-primary-950 dark:text-white">
              {method2Name}
            </span>
          </div>
        ) : (
          <p className="text-sm font-bold text-danger-600 dark:text-danger-400">
            No method enabled
          </p>
        )}
      </div>
    </div>
  );
}
