// Step 11 — Shifts & Time
import { Plus, Trash2 } from 'lucide-react';
import {
    SectionCard, FormInput, FormSelect, ToggleRow,
    AddButton, ItemCard, TwoCol, SectionDivider, InfoBanner
} from '../atoms';
import { DOWNTIME_TYPES, DAYS_OF_WEEK } from '../constants';
import { useTenantOnboardingStore } from '../store';
import type { Shift, DowntimeSlot } from '../types';

// ---- Downtime Slot Row ----

function DowntimeSlotRow({
    slot,
    onUpdate,
    onRemove,
}: {
    slot: DowntimeSlot;
    onUpdate: (u: Partial<DowntimeSlot>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-3 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                <FormSelect
                    label="Type"
                    value={slot.type}
                    onChange={(v) => onUpdate({ type: v })}
                    options={DOWNTIME_TYPES}
                />
                <FormInput
                    label="Duration (min)"
                    placeholder="30"
                    value={slot.duration}
                    onChange={(v) => onUpdate({ duration: v })}
                    type="number"
                />
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="flex-shrink-0 mt-5 w-8 h-8 flex items-center justify-center rounded-lg
          text-danger-500 hover:bg-danger-50 hover:text-danger-600 transition-colors"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

// ---- Shift Card ----

function ShiftForm({
    shift,
    onUpdate,
    onRemove,
}: {
    shift: Shift;
    onUpdate: (u: Partial<Shift>) => void;
    onRemove: () => void;
}) {
    const addDowntime = () => {
        const slot: DowntimeSlot = {
            id: Date.now().toString(), type: 'Lunch Break', duration: '30',
        };
        onUpdate({ downtimeSlots: [...shift.downtimeSlots, slot] });
    };

    const updateSlot = (id: string, u: Partial<DowntimeSlot>) => {
        onUpdate({
            downtimeSlots: shift.downtimeSlots.map((s) => s.id === id ? { ...s, ...u } : s),
        });
    };

    const removeSlot = (id: string) => {
        onUpdate({ downtimeSlots: shift.downtimeSlots.filter((s) => s.id !== id) });
    };

    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput
                    label="Shift Name"
                    placeholder="e.g. Morning Shift, Night Shift"
                    value={shift.name}
                    onChange={(v) => onUpdate({ name: v })}
                    required
                />
                <div /> {/* spacer */}
            </TwoCol>

            <TwoCol>
                <FormInput
                    label="From Time"
                    value={shift.fromTime}
                    onChange={(v) => onUpdate({ fromTime: v })}
                    type="time"
                    required
                    hint="Shift start time"
                />
                <FormInput
                    label="To Time"
                    value={shift.toTime}
                    onChange={(v) => onUpdate({ toTime: v })}
                    type="time"
                    required
                    hint="Shift end time"
                />
            </TwoCol>

            <ToggleRow
                label="No Shuffle"
                subtitle="Prevent this shift from being rotated in multi-shift scheduling"
                value={shift.noShuffle}
                onToggle={(v) => onUpdate({ noShuffle: v })}
            />

            <SectionDivider label="Planned Downtime Slots" />

            {shift.downtimeSlots.length > 0 ? (
                <div className="space-y-2">
                    {shift.downtimeSlots.map((slot) => (
                        <DowntimeSlotRow
                            key={slot.id}
                            slot={slot}
                            onUpdate={(u) => updateSlot(slot.id, u)}
                            onRemove={() => removeSlot(slot.id)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-xs text-neutral-400">
                    No downtime slots defined. Add breaks like Lunch, Tea Break, Changeover.
                </p>
            )}

            <button
                type="button"
                onClick={addDowntime}
                className="flex items-center gap-2 text-xs font-semibold text-primary-600
          hover:text-primary-700 transition-colors"
            >
                <Plus size={13} strokeWidth={2.5} />
                Add Downtime Slot
            </button>

            <div className="pt-2">
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex items-center gap-1.5 text-xs font-semibold text-danger-500
            hover:text-danger-700 transition-colors"
                >
                    <Trash2 size={13} />
                    Remove This Shift
                </button>
            </div>
        </div>
    );
}

// ---- Main Step ----

export function Step11Shifts() {
    const { step11, setStep11, addShift, updateShift, removeShift } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            {/* Working Hours Config */}
            <SectionCard title="Operational Day Window" subtitle="The outer boundary within which all shifts must fall">
                <InfoBanner variant="info">
                    The Operational Day Window defines the start and end of the entire working day. Individual shifts
                    must fall within this window. This is used for OEE calculation and production planning.
                </InfoBanner>
                <TwoCol>
                    <FormInput
                        label="Day Start Time"
                        value={step11.dayStartTime}
                        onChange={(v) => setStep11({ dayStartTime: v })}
                        type="time"
                        required
                        hint="Earliest any shift can begin"
                    />
                    <FormInput
                        label="Day End Time"
                        value={step11.dayEndTime}
                        onChange={(v) => setStep11({ dayEndTime: v })}
                        type="time"
                        required
                        hint="Latest any shift can end (may cross midnight)"
                    />
                </TwoCol>

                <div className="space-y-2">
                    <label className="block text-xs font-bold text-primary-900">Weekly Offs</label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                            const selected = step11.weeklyOffs.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                        const offs = selected
                                            ? step11.weeklyOffs.filter((d) => d !== day)
                                            : [...step11.weeklyOffs, day];
                                        setStep11({ weeklyOffs: offs });
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${selected
                                            ? 'bg-danger-500 text-white border-danger-500 shadow-sm'
                                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                                        }`}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-neutral-400">{step11.weeklyOffs.length} off day(s) selected</p>
                </div>
            </SectionCard>

            {/* Shift Master */}
            <SectionCard title="Shift Master" subtitle="Define all working shifts. Each shift can have its own downtime slots.">
                {step11.shifts.length === 0 && (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl px-5 py-8 text-center mb-4">
                        <p className="text-sm font-semibold text-neutral-500">No shifts defined</p>
                        <p className="text-xs text-neutral-400 mt-1">Add your first shift below (e.g. Morning, Evening, Night)</p>
                    </div>
                )}

                {step11.shifts.map((shift, idx) => (
                    <ItemCard
                        key={shift.id}
                        title={shift.name || `Shift ${idx + 1}`}
                        subtitle={shift.fromTime && shift.toTime ? `${shift.fromTime} – ${shift.toTime}` : 'Time not set'}
                        badge={`Shift ${idx + 1}`}
                        defaultOpen={idx === 0}
                    >
                        <ShiftForm
                            shift={shift}
                            onUpdate={(u) => updateShift(shift.id, u)}
                            onRemove={() => removeShift(shift.id)}
                        />
                    </ItemCard>
                ))}

                <AddButton label="Add Shift" onClick={addShift} />
            </SectionCard>
        </div>
    );
}
