// Step 13 — IOT Reasons (Machine Downtime & Idle Reasons)
import {
    SectionCard, FormInput, FormSelect, FormTextarea, ToggleRow,
    ChipSelector, AddButton, ItemCard, TwoCol, InfoBanner
} from '../atoms';
import { IOT_REASON_TYPES } from '../constants';
import { useTenantOnboardingStore } from '../store';
import type { IOTReason } from '../types';

const DEPARTMENTS = [
    'Production', 'Maintenance', 'Quality', 'Stores', 'Admin',
    'HR', 'Finance', 'IT', 'Engineering', 'All',
];

function IOTReasonForm({
    reason,
    onUpdate,
    onRemove,
}: {
    reason: IOTReason;
    onUpdate: (u: Partial<IOTReason>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="space-y-4">
            <TwoCol>
                <ChipSelector
                    label="Reason Type"
                    options={IOT_REASON_TYPES}
                    selected={reason.reasonType}
                    onSelect={(v) => onUpdate({ reasonType: v })}
                    required
                />
                <FormSelect
                    label="Department"
                    value={reason.department}
                    onChange={(v) => onUpdate({ department: v })}
                    options={DEPARTMENTS}
                />
            </TwoCol>

            <FormInput
                label="Reason (Short Label)"
                placeholder="e.g. Tool Breakage, Power Failure, Raw Material Shortage"
                value={reason.reason}
                onChange={(v) => onUpdate({ reason: v })}
                required
                hint="This label appears in the Andon board, reports, and OEE Dashboard"
            />

            <FormTextarea
                label="Description"
                placeholder="Optional detailed description of when this reason applies..."
                value={reason.description}
                onChange={(v) => onUpdate({ description: v })}
                rows={2}
            />

            <TwoCol>
                <FormInput
                    label="Threshold Duration (min)"
                    placeholder="15"
                    value={reason.duration}
                    onChange={(v) => onUpdate({ duration: v })}
                    type="number"
                    hint="Minimum downtime duration before this reason must be logged"
                />
                <div className="flex items-center pt-5">
                    <ToggleRow
                        label="Planned Downtime"
                        subtitle="Planned losses don't count against OEE Availability"
                        value={reason.planned}
                        onToggle={(v) => onUpdate({ planned: v })}
                    />
                </div>
            </TwoCol>

            <button
                type="button"
                onClick={onRemove}
                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
            >
                🗑 Remove this reason
            </button>
        </div>
    );
}

export function Step13IOTReasons() {
    const { step13, addIOTReason, updateIOTReason, removeIOTReason } = useTenantOnboardingStore();

    const idle = step13.reasons.filter((r) => r.reasonType === 'Machine Idle');
    const alarm = step13.reasons.filter((r) => r.reasonType === 'Machine Alarm');

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            <InfoBanner variant="info" className="mb-5">
                <strong>IOT Reason Configuration</strong> — Machine Idle and Alarm reasons are used by the Andon
                system to classify production downtime. These appear in OEE dashboards, NC reports, and shift handover
                summaries. Planned downtimes (e.g. scheduled maintenance) are excluded from OEE Availability loss calculations.
            </InfoBanner>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-warning-50 border border-warning-200 rounded-2xl px-5 py-4 dark:bg-warning-900/20 dark:border-warning-800/50">
                    <p className="text-2xl font-bold text-warning-700 dark:text-warning-400">{idle.length}</p>
                    <p className="text-sm font-semibold text-warning-800 dark:text-warning-400">Machine Idle Reasons</p>
                    <p className="text-xs text-warning-600 mt-1">Material shortage, changeover, operator absence...</p>
                </div>
                <div className="bg-danger-50 border border-danger-200 rounded-2xl px-5 py-4 dark:bg-danger-900/20 dark:border-danger-800/50">
                    <p className="text-2xl font-bold text-danger-700 dark:text-danger-400">{alarm.length}</p>
                    <p className="text-sm font-semibold text-danger-800 dark:text-danger-400">Machine Alarm Reasons</p>
                    <p className="text-xs text-danger-600 mt-1">Breakdown, hydraulic failure, spindle error...</p>
                </div>
            </div>

            <SectionCard title="IOT Reason List" subtitle="Add all reasons that operators will use to classify machine downtime on the shop floor">
                {step13.reasons.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-10 text-center mb-4 dark:bg-neutral-800 dark:border-neutral-700">
                        <p className="text-2xl mb-3">📡</p>
                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No IOT reasons defined</p>
                        <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">
                            Add reasons for machine idle time and alarms. Operators select these during downtime logging.
                        </p>
                    </div>
                ) : (
                    step13.reasons.map((r, idx) => (
                        <ItemCard
                            key={r.id}
                            title={r.reason || `Reason ${idx + 1}`}
                            subtitle={[r.reasonType, r.department].filter(Boolean).join(' · ')}
                            badge={r.reasonType === 'Machine Idle' ? '⚡ Idle' : '🚨 Alarm'}
                            badgeVariant={r.reasonType === 'Machine Idle' ? 'warning' : 'info'}
                            defaultOpen={idx === 0}
                        >
                            <IOTReasonForm
                                reason={r}
                                onUpdate={(u) => updateIOTReason(r.id, u)}
                                onRemove={() => removeIOTReason(r.id)}
                            />
                        </ItemCard>
                    ))
                )}

                <AddButton label="Add IOT Reason" onClick={addIOTReason} />
            </SectionCard>

            {/* Quick populate reference */}
            <SectionCard title="Common Reasons Reference" subtitle="Typical IOT reasons for manufacturing companies — add as needed" accent="info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-warning-600 mb-2">⚡ Common Idle Reasons</p>
                        <div className="space-y-1">
                            {[
                                'Material Shortage', 'Changeover', 'Operator Absence',
                                'Quality Hold', 'Tool Change', 'Scheduled Break',
                                'Power Fluctuation', 'No Job Order',
                            ].map((s) => (
                                <p key={s} className="text-xs text-neutral-600 bg-warning-50 rounded-lg px-3 py-1.5 border border-warning-100 dark:text-neutral-300 dark:bg-warning-900/20">
                                    • {s}
                                </p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-danger-600 mb-2">🚨 Common Alarm Reasons</p>
                        <div className="space-y-1">
                            {[
                                'Machine Breakdown', 'Hydraulic Failure', 'Spindle Error',
                                'Coolant System Fault', 'Electrical Fault', 'Servo Alarm',
                                'Chuck Pressure Low', 'Emergency Stop Triggered',
                            ].map((s) => (
                                <p key={s} className="text-xs text-neutral-600 bg-danger-50 rounded-lg px-3 py-1.5 border border-danger-100 dark:text-neutral-300 dark:bg-danger-900/20 dark:border-danger-800/50">
                                    • {s}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
