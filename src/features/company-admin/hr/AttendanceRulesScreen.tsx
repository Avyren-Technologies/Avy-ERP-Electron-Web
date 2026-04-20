import { useState, useEffect } from "react";
import {
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    Timer,
    AlertTriangle,
    TrendingDown,
    Repeat,
    Settings2,
    ShieldCheck,
    Camera,
    Hourglass,
    Zap,
    Layers,
} from "lucide-react";
import { InfoTooltip, SectionDescription } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { useAttendanceRules } from "@/features/company-admin/api/use-attendance-queries";
import { useUpdateAttendanceRules } from "@/features/company-admin/api/use-attendance-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";
import type { AttendanceRule, AttendanceMode, LeaveCheckInMode, ShiftMappingStrategy } from "@/lib/api/attendance";

/* ── Toggle ── */

function Toggle({ label, description, checked, onChange, tooltip }: {
    label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; tooltip?: string;
}) {
    return (
        <div className={cn(
            "flex items-center justify-between px-5 py-4 rounded-xl border transition-colors",
            checked
                ? "bg-success-50 dark:bg-success-900/10 border-success-100 dark:border-success-800/50"
                : "bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-800"
        )}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {checked
                    ? <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />}
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className={cn("text-sm font-semibold", checked ? "text-success-800 dark:text-success-400" : "text-neutral-500 dark:text-neutral-400")}>{label}</p>
                        {tooltip && <InfoTooltip content={tooltip} />}
                    </div>
                    {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                    checked ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", checked ? "left-[22px]" : "left-[3px]")} />
            </button>
        </div>
    );
}

/* ── Number Field ── */

function NumberField({ label, value, onChange, suffix, min, max, step, description, tooltip }: {
    label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number; description?: string; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    className="w-20 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">{suffix}</span>}
            </div>
        </div>
    );
}

/* ── Time Field ── */

function TimeField({ label, value, onChange, description, tooltip }: {
    label: string; value: string; onChange: (v: string) => void; description?: string; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            />
        </div>
    );
}

/* ── Select Row ── */

function SelectRow({ label, value, onChange, options, description, tooltip }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; description?: string; tooltip?: string;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} />}
                </div>
                {description && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

/* ── Options ── */

const DEDUCTION_TYPE_OPTIONS = [
    { value: "NONE", label: "None" },
    { value: "HALF_DAY_AFTER_LIMIT", label: "Half Day After Limit" },
    { value: "PERCENTAGE", label: "Percentage" },
];

const PUNCH_MODE_OPTIONS = [
    { value: "FIRST_LAST", label: "First In / Last Out" },
    { value: "EVERY_PAIR", label: "Every Pair (In/Out)" },
    { value: "SHIFT_BASED", label: "Shift Based" },
];

const GEOFENCE_MODE_OPTIONS = [
    { value: "OFF", label: "Off — Record silently" },
    { value: "WARN", label: "Warn — Allow + Notify Manager" },
    { value: "STRICT", label: "Strict — Block if outside" },
];

const ROUNDING_STRATEGY_OPTIONS = [
    { value: "NONE", label: "None" },
    { value: "NEAREST_15", label: "Nearest 15 min" },
    { value: "NEAREST_30", label: "Nearest 30 min" },
    { value: "FLOOR_15", label: "Floor 15 min" },
    { value: "CEIL_15", label: "Ceil 15 min" },
];

const PUNCH_ROUNDING_OPTIONS = [
    { value: "NONE", label: "None" },
    { value: "NEAREST_5", label: "Nearest 5 min" },
    { value: "NEAREST_15", label: "Nearest 15 min" },
];

const ROUNDING_DIRECTION_OPTIONS = [
    { value: "NEAREST", label: "Nearest" },
    { value: "UP", label: "Round Up" },
    { value: "DOWN", label: "Round Down" },
];

const ATTENDANCE_MODE_OPTIONS = [
    { value: "SHIFT_STRICT", label: "Shift Strict — Enforce shift time window" },
    { value: "SHIFT_RELAXED", label: "Shift Relaxed — Only verify shift exists" },
    { value: "FULLY_FLEXIBLE", label: "Fully Flexible — No time restrictions" },
];

const LEAVE_CHECKIN_MODE_OPTIONS = [
    { value: "STRICT", label: "Strict — Block if outside window" },
    { value: "ALLOW_WITHIN_WINDOW", label: "Allow Within Window — Skip late limit on half-day leave" },
    { value: "ALLOW_TILL_SHIFT_END", label: "Allow Till Shift End — Extend window on any leave" },
    { value: "FULLY_FLEXIBLE", label: "Fully Flexible — No restriction if approved leave" },
];

const SHIFT_MAPPING_STRATEGY_OPTIONS = [
    { value: "BEST_FIT_HOURS", label: "Best Fit Hours — Maximum overlap" },
];

/* ── Defaults ── */

const DEFAULTS: AttendanceRule = {
    dayBoundaryTime: "00:00",
    gracePeriodMinutes: 15,
    earlyExitToleranceMinutes: 15,
    maxLateCheckInMinutes: 240,
    halfDayThresholdHours: 4,
    fullDayThresholdHours: 8,
    lateArrivalsAllowedPerMonth: 3,
    lopAutoDeduct: true,
    lateDeductionType: "NONE",
    lateDeductionValue: null,
    earlyExitDeductionType: "NONE",
    earlyExitDeductionValue: null,
    punchMode: "FIRST_LAST",
    autoMarkAbsentIfNoPunch: true,
    autoHalfDayEnabled: true,
    autoAbsentAfterDays: 0,
    regularizationWindowDays: 7,
    workingHoursRounding: "NONE",
    punchTimeRounding: "NONE",
    punchTimeRoundingDirection: "NEAREST",
    ignoreLateOnLeaveDay: true,
    ignoreLateOnHoliday: true,
    ignoreLateOnWeekOff: true,
    selfieRequired: false,
    gpsRequired: false,
    geofenceEnforcementMode: "OFF",
    missingPunchAlert: true,
    attendanceMode: "SHIFT_STRICT" as AttendanceMode,
    leaveCheckInMode: "STRICT" as LeaveCheckInMode,
    leaveAutoAdjustmentEnabled: true,
    multipleShiftsPerDayEnabled: false,
    minGapBetweenShiftsMinutes: null,
    maxShiftsPerDay: null,
    autoShiftMappingEnabled: false,
    shiftMappingStrategy: "BEST_FIT_HOURS" as ShiftMappingStrategy,
    minShiftMatchPercentage: 50,
    weeklyReviewEnabled: false,
    weeklyReviewRemindersEnabled: false,
};

/* ── Screen ── */

export function AttendanceRulesScreen() {
    const { data, isLoading, isError } = useAttendanceRules();
    const updateMutation = useUpdateAttendanceRules();

    const [rules, setRules] = useState<AttendanceRule>({ ...DEFAULTS });
    const [hasChanges, setHasChanges] = useState(false);

    const serverRules: AttendanceRule = (data as any)?.data ?? DEFAULTS;

    useEffect(() => {
        if ((data as any)?.data) {
            setRules({ ...DEFAULTS, ...serverRules });
            setHasChanges(false);
        }
    }, [data]);

    const updateRule = <K extends keyof AttendanceRule>(key: K, value: AttendanceRule[K]) => {
        setRules((p) => ({ ...p, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(rules);
            showSuccess("Rules Saved", "Attendance rules have been updated.");
            setHasChanges(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReset = () => {
        setRules({ ...DEFAULTS, ...serverRules });
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Rules</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load attendance rules</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Attendance Rules</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure time boundaries, thresholds, deductions, and processing rules</p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleReset} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Reset</button>
                        <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all disabled:opacity-50">
                            {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time & Boundary */}
                <SectionCard title="Time & Boundary" icon={Clock} sectionDescription="Set when the attendance day starts and ends. Critical for night shifts that span midnight.">
                    <TimeField label="Day Boundary Time" description="When the calendar day flips for night shifts" value={rules.dayBoundaryTime} onChange={(v) => updateRule("dayBoundaryTime", v)} tooltip="The time when one attendance day ends and the next begins. Important for night shifts that span midnight." />
                </SectionCard>

                {/* Grace & Tolerance */}
                <SectionCard title="Grace & Tolerance" icon={Hourglass} sectionDescription="Define buffer periods before marking employees as late or leaving early. These are company-wide defaults that individual shifts can override.">
                    <NumberField label="Grace Period" description="Minutes allowed after shift start" value={rules.gracePeriodMinutes} onChange={(v) => updateRule("gracePeriodMinutes", v)} suffix="min" min={0} max={60} tooltip="Minutes after shift start before an employee is marked as late. This is a company default — shifts can override this." />
                    <NumberField label="Early Exit Tolerance" description="Minutes before shift end allowed" value={rules.earlyExitToleranceMinutes} onChange={(v) => updateRule("earlyExitToleranceMinutes", v)} suffix="min" min={0} max={60} />
                    <NumberField label="Max Late Check-In" description="Auto-absent if later than this" value={rules.maxLateCheckInMinutes} onChange={(v) => updateRule("maxLateCheckInMinutes", v)} suffix="min" min={0} max={480} tooltip="If an employee arrives this many minutes late, they are automatically marked absent instead of late." />
                </SectionCard>

                {/* Day Thresholds */}
                <SectionCard title="Day Thresholds" icon={Timer} sectionDescription="Set the minimum working hours required to qualify for half-day or full-day credit.">
                    <NumberField label="Half Day Threshold" description="Minimum hours for half-day credit" value={rules.halfDayThresholdHours} onChange={(v) => updateRule("halfDayThresholdHours", v)} suffix="hrs" min={1} max={12} step={0.5} />
                    <NumberField label="Full Day Threshold" description="Minimum hours for full-day credit" value={rules.fullDayThresholdHours} onChange={(v) => updateRule("fullDayThresholdHours", v)} suffix="hrs" min={1} max={24} step={0.5} />
                </SectionCard>

                {/* Late Tracking */}
                <SectionCard title="Late Tracking" icon={AlertTriangle} sectionDescription="Configure how many late arrivals are tolerated per month before penalties apply.">
                    <NumberField label="Late Arrivals Allowed / Month" description="Max late arrivals before penalty" value={rules.lateArrivalsAllowedPerMonth} onChange={(v) => updateRule("lateArrivalsAllowedPerMonth", v)} suffix="days" min={0} max={31} />
                </SectionCard>

                {/* Deduction Rules */}
                <SectionCard title="Deduction Rules" icon={TrendingDown} sectionDescription="Define salary deduction rules for late arrivals and early departures.">
                    <Toggle label="LOP Auto-Deduct" description="Automatically deduct loss of pay" checked={rules.lopAutoDeduct} onChange={(v) => updateRule("lopAutoDeduct", v)} />
                    <SelectRow label="Late Deduction Type" value={rules.lateDeductionType} onChange={(v) => updateRule("lateDeductionType", v as AttendanceRule["lateDeductionType"])} options={DEDUCTION_TYPE_OPTIONS} tooltip="NONE: No deduction. HALF_DAY_AFTER_LIMIT: Convert to half-day after monthly late limit exceeded. PERCENTAGE: Deduct a percentage of daily salary." />
                    {rules.lateDeductionType !== "NONE" && (
                        <NumberField label="Late Deduction Value" description={rules.lateDeductionType === "PERCENTAGE" ? "Percentage of daily pay" : "Value"} value={rules.lateDeductionValue ?? 0} onChange={(v) => updateRule("lateDeductionValue", v)} suffix={rules.lateDeductionType === "PERCENTAGE" ? "%" : ""} min={0} step={0.01} />
                    )}
                    <SelectRow label="Early Exit Deduction Type" value={rules.earlyExitDeductionType} onChange={(v) => updateRule("earlyExitDeductionType", v as AttendanceRule["earlyExitDeductionType"])} options={DEDUCTION_TYPE_OPTIONS} />
                    {rules.earlyExitDeductionType !== "NONE" && (
                        <NumberField label="Early Exit Deduction Value" description={rules.earlyExitDeductionType === "PERCENTAGE" ? "Percentage of daily pay" : "Value"} value={rules.earlyExitDeductionValue ?? 0} onChange={(v) => updateRule("earlyExitDeductionValue", v)} suffix={rules.earlyExitDeductionType === "PERCENTAGE" ? "%" : ""} min={0} step={0.01} />
                    )}
                </SectionCard>

                {/* Punch Interpretation */}
                <SectionCard title="Punch Interpretation" icon={Repeat} sectionDescription="Configure how raw punch records from biometric/mobile are interpreted into attendance.">
                    <SelectRow label="Punch Mode" description="How punch records are interpreted" value={rules.punchMode} onChange={(v) => updateRule("punchMode", v as AttendanceRule["punchMode"])} options={PUNCH_MODE_OPTIONS} tooltip="FIRST_LAST: Uses first punch as check-in and last as check-out. EVERY_PAIR: Sums alternating in/out pairs. SHIFT_BASED: Matches punches to the nearest shift window." />
                </SectionCard>

                {/* Auto-Processing */}
                <SectionCard title="Auto-Processing" icon={Zap} sectionDescription="Automate attendance status assignments like absent marking, half-day classification, and regularization deadlines.">
                    <Toggle label="Auto Mark Absent" description="Mark absent if no punch for the day" checked={rules.autoMarkAbsentIfNoPunch} onChange={(v) => updateRule("autoMarkAbsentIfNoPunch", v)} tooltip="Automatically mark employees as absent if no punch is recorded for the day." />
                    <Toggle label="Auto Half-Day" description="Auto classify based on threshold hours" checked={rules.autoHalfDayEnabled} onChange={(v) => updateRule("autoHalfDayEnabled", v)} />
                    <NumberField label="Auto Absent After Days" description="Mark absent after N days no punch (0 = disabled)" value={rules.autoAbsentAfterDays} onChange={(v) => updateRule("autoAbsentAfterDays", v)} suffix="days" min={0} max={30} />
                    <NumberField label="Regularization Window" description="Days after which regularization is locked" value={rules.regularizationWindowDays} onChange={(v) => updateRule("regularizationWindowDays", v)} suffix="days" min={1} max={90} tooltip="Number of days after which employees can no longer submit attendance regularization requests." />
                </SectionCard>

                {/* Rounding */}
                <SectionCard title="Rounding" icon={Settings2} sectionDescription="Configure how working hours and punch times are rounded. Affects payroll calculations.">
                    <SelectRow label="Working Hours Rounding" value={rules.workingHoursRounding} onChange={(v) => updateRule("workingHoursRounding", v as AttendanceRule["workingHoursRounding"])} options={ROUNDING_STRATEGY_OPTIONS} tooltip="Round calculated working hours to the nearest interval. Affects payroll calculations." />
                    <SelectRow label="Punch Time Rounding" value={rules.punchTimeRounding} onChange={(v) => updateRule("punchTimeRounding", v as AttendanceRule["punchTimeRounding"])} options={PUNCH_ROUNDING_OPTIONS} />
                    <SelectRow label="Rounding Direction" value={rules.punchTimeRoundingDirection} onChange={(v) => updateRule("punchTimeRoundingDirection", v as AttendanceRule["punchTimeRoundingDirection"])} options={ROUNDING_DIRECTION_OPTIONS} />
                </SectionCard>

                {/* Exception Handling */}
                <SectionCard title="Exception Handling" icon={ShieldCheck} sectionDescription="Define when late/early penalties should be waived, such as on holidays or week-offs.">
                    <Toggle label="Ignore Late on Leave Day" description="Don't flag late if employee has partial leave" checked={rules.ignoreLateOnLeaveDay} onChange={(v) => updateRule("ignoreLateOnLeaveDay", v)} />
                    <Toggle label="Ignore Late on Holiday" description="Working on holiday = no late flag" checked={rules.ignoreLateOnHoliday} onChange={(v) => updateRule("ignoreLateOnHoliday", v)} tooltip="Don't flag late arrival when an employee voluntarily works on a holiday." />
                    <Toggle label="Ignore Late on Week Off" description="Working on week-off = no late flag" checked={rules.ignoreLateOnWeekOff} onChange={(v) => updateRule("ignoreLateOnWeekOff", v)} />
                </SectionCard>

                {/* Capture */}
                <SectionCard title="Capture" icon={Camera} sectionDescription="Configure what evidence is required when employees punch in or out.">
                    <Toggle label="Selfie Required" description="Require selfie for attendance punch" checked={rules.selfieRequired} onChange={(v) => updateRule("selfieRequired", v)} />
                    <Toggle label="GPS Required" description="Require GPS location for attendance punch" checked={rules.gpsRequired} onChange={(v) => updateRule("gpsRequired", v)} />
                    <SelectRow label="Geofence Enforcement" description="Controls whether employees are blocked from checking in outside the geofence area" value={rules.geofenceEnforcementMode} onChange={(v) => updateRule("geofenceEnforcementMode", v as AttendanceRule["geofenceEnforcementMode"])} options={GEOFENCE_MODE_OPTIONS} tooltip="OFF: Location recorded but no restriction. WARN: Allow check-in but notify the manager. STRICT: Block check-in if outside the geofence." />
                    <Toggle label="Missing Punch Alert" description="Alert when employee has incomplete punches" checked={rules.missingPunchAlert} onChange={(v) => updateRule("missingPunchAlert", v)} />
                </SectionCard>

                {/* Attendance Mode */}
                <SectionCard title="Attendance Mode" icon={Settings2} sectionDescription="Control how strictly shift timing is enforced and how leave affects check-in windows.">
                    <SelectRow label="Attendance Mode" description="Controls overall shift time window enforcement" value={rules.attendanceMode} onChange={(v) => updateRule("attendanceMode", v as AttendanceMode)} options={ATTENDANCE_MODE_OPTIONS} />
                    <SelectRow label="Leave Check-In Mode" description="How approved leave affects the check-in time window" value={rules.leaveCheckInMode} onChange={(v) => updateRule("leaveCheckInMode", v as LeaveCheckInMode)} options={LEAVE_CHECKIN_MODE_OPTIONS} />
                    <Toggle label="Leave Auto-Adjustment" description="Automatically adjust leave based on actual hours worked (cancel/convert)" checked={rules.leaveAutoAdjustmentEnabled} onChange={(v) => updateRule("leaveAutoAdjustmentEnabled", v)} />
                </SectionCard>

                {/* Multiple Shifts */}
                <SectionCard title="Multiple Shifts" icon={Layers} sectionDescription="Allow employees to work across multiple shifts within the same day.">
                    <Toggle label="Multiple Shifts Per Day" description="Enable employees to check in for multiple shifts in one day" checked={rules.multipleShiftsPerDayEnabled} onChange={(v) => updateRule("multipleShiftsPerDayEnabled", v)} />
                    {rules.multipleShiftsPerDayEnabled && (
                        <>
                            <NumberField label="Min Gap Between Shifts" suffix="min" value={rules.minGapBetweenShiftsMinutes ?? 0} onChange={(v) => updateRule("minGapBetweenShiftsMinutes", v || null)} min={0} max={480} />
                            <NumberField label="Max Shifts Per Day" value={rules.maxShiftsPerDay ?? 2} onChange={(v) => updateRule("maxShiftsPerDay", v || null)} min={2} max={10} />
                        </>
                    )}
                </SectionCard>

                {/* Shift Mapping & Review */}
                <SectionCard title="Shift Mapping & Review" icon={Zap} sectionDescription="Auto-map employee work hours to the best-fit shift and enable weekly attendance review.">
                    <Toggle label="Auto Shift Mapping" description="Automatically map work hours to the closest shift on check-out" checked={rules.autoShiftMappingEnabled} onChange={(v) => updateRule("autoShiftMappingEnabled", v)} />
                    {rules.autoShiftMappingEnabled && (
                        <>
                            <SelectRow label="Mapping Strategy" description="Algorithm used to match shifts" value={rules.shiftMappingStrategy} onChange={(v) => updateRule("shiftMappingStrategy", v as ShiftMappingStrategy)} options={SHIFT_MAPPING_STRATEGY_OPTIONS} />
                            <NumberField label="Min Match Percentage" suffix="%" value={rules.minShiftMatchPercentage} onChange={(v) => updateRule("minShiftMatchPercentage", v)} min={0} max={100} />
                        </>
                    )}
                    <Toggle label="Weekly Review" description="Enable weekly attendance review dashboard for HR" checked={rules.weeklyReviewEnabled} onChange={(v) => updateRule("weeklyReviewEnabled", v)} />
                    {rules.weeklyReviewEnabled && (
                        <Toggle label="Weekly Review Reminders" description="Send reminder notifications to HR when the week ends" checked={rules.weeklyReviewRemindersEnabled} onChange={(v) => updateRule("weeklyReviewRemindersEnabled", v)} />
                    )}
                </SectionCard>
            </div>

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 shadow-2xl shadow-neutral-900/10">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">You have unsaved changes</p>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Discard</button>
                            <button onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Section Card ── */

function SectionCard({ title, icon: Icon, children, sectionDescription }: {
    title: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    children: React.ReactNode;
    sectionDescription?: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-primary-600" />
                    </div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                </div>
                {sectionDescription && (
                    <SectionDescription>{sectionDescription}</SectionDescription>
                )}
                {!sectionDescription && <div className="mb-5" />}
                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
}
