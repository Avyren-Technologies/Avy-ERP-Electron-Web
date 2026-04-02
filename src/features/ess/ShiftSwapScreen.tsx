import { useState, useMemo } from "react";
import {
    ArrowLeftRight,
    Plus,
    X,
    Loader2,
    Clock,
    CheckCircle2,
    XCircle,
    Ban,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Repeat2,
    ArrowRight,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showApiError } from "@/lib/toast";
import { useMyShiftSwaps, useCreateShiftSwap, useCancelShiftSwap } from "@/features/company-admin/api";
import { useCompanyShifts } from "@/features/company-admin/api";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string }> = {
        pending: { icon: Clock, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        approved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        rejected: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
        cancelled: { icon: Ban, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700" },
    };
    const c = config[s] ?? config.pending;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

/* ── Mini Calendar ── */

function MiniCalendar({
    value,
    onChange,
    swapDates,
}: {
    value: string;
    onChange: (date: string) => void;
    swapDates: Map<string, string>;
}) {
    const [viewDate, setViewDate] = useState(() => {
        if (value) return new Date(value + "T00:00:00");
        return new Date();
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const STATUS_DOT: Record<string, string> = {
        PENDING: "bg-warning-400",
        APPROVED: "bg-success-400",
        REJECTED: "bg-danger-400",
        CANCELLED: "bg-neutral-400",
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-5 py-4 flex items-center justify-between">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white">
                    <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm font-bold text-white tracking-wide">{monthName}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 px-3 pt-3">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider py-1.5">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                {days.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = dateStr === value;
                    const isToday = dateStr === todayStr;
                    const isPast = new Date(dateStr + "T00:00:00") < today;
                    const swapStatus = swapDates.get(dateStr);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => !isPast && onChange(dateStr)}
                            disabled={isPast}
                            className={cn(
                                "relative w-9 h-9 mx-auto rounded-xl text-xs font-medium transition-all duration-150",
                                isPast && "text-neutral-300 dark:text-neutral-600 cursor-not-allowed",
                                !isPast && !isSelected && "hover:bg-primary-50 dark:hover:bg-primary-900/20 text-neutral-700 dark:text-neutral-300",
                                isSelected && "bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/40 font-bold",
                                isToday && !isSelected && "ring-2 ring-primary-300 dark:ring-primary-600 font-bold text-primary-600 dark:text-primary-400",
                            )}
                        >
                            {day}
                            {swapStatus && (
                                <span className={cn("absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", STATUS_DOT[swapStatus] ?? STATUS_DOT.PENDING)} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-2.5 flex items-center gap-4 text-[10px] text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-400" /> Pending</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-400" /> Approved</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-400" /> Rejected</span>
            </div>
        </div>
    );
}

/* ── Shift Selector Card ── */

function ShiftCard({
    label,
    shiftId,
    shifts,
    onChange,
    disabled,
    highlight,
}: {
    label: string;
    shiftId: string;
    shifts: any[];
    onChange: (id: string) => void;
    disabled?: boolean;
    highlight?: "from" | "to";
}) {
    const selected = shifts.find((s: any) => s.id === shiftId);
    const colorCls = highlight === "from"
        ? "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30"
        : highlight === "to"
        ? "border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-950/30"
        : "border-neutral-200 dark:border-neutral-800";

    return (
        <div className={cn("rounded-xl border p-4 transition-colors", colorCls)}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">{label}</label>
            <select
                value={shiftId}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="">Select shift...</option>
                {shifts.map((s: any) => (
                    <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                    </option>
                ))}
            </select>
            {selected && (
                <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock size={12} />
                    <span>{selected.startTime} &ndash; {selected.endTime}</span>
                    {selected.shiftType && (
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-medium uppercase">
                            {selected.shiftType}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Summary Stats ── */

function SwapStats({ swaps }: { swaps: any[] }) {
    const stats = useMemo(() => {
        const pending = swaps.filter((s: any) => s.status === "PENDING").length;
        const approved = swaps.filter((s: any) => s.status === "APPROVED").length;
        const rejected = swaps.filter((s: any) => s.status === "REJECTED").length;
        return [
            { label: "Pending", value: pending, cls: "text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50" },
            { label: "Approved", value: approved, cls: "text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50" },
            { label: "Rejected", value: rejected, cls: "text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50" },
            { label: "Total", value: swaps.length, cls: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50" },
        ];
    }, [swaps]);

    return (
        <div className="grid grid-cols-4 gap-3">
            {stats.map((s) => (
                <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.cls)}>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ── Main Screen ── */

export function ShiftSwapScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useMyShiftSwaps();
    const swaps: any[] = data?.data ?? [];
    const { data: shiftsData } = useCompanyShifts();
    const shifts: any[] = shiftsData?.data ?? [];

    const [showForm, setShowForm] = useState(false);
    const [currentShiftId, setCurrentShiftId] = useState("");
    const [requestedShiftId, setRequestedShiftId] = useState("");
    const [swapDate, setSwapDate] = useState("");
    const [reason, setReason] = useState("");
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

    const createMutation = useCreateShiftSwap();
    const cancelMutation = useCancelShiftSwap();

    // Build a map of swap dates → status for the calendar dots
    const swapDates = useMemo(() => {
        const map = new Map<string, string>();
        for (const s of swaps) {
            const d = s.swapDate?.split("T")[0];
            if (d) map.set(d, s.status);
        }
        return map;
    }, [swaps]);

    const isFormValid = currentShiftId && requestedShiftId && currentShiftId !== requestedShiftId && swapDate && reason.trim().length >= 5;

    function handleSubmit() {
        if (!isFormValid) return;
        createMutation.mutate(
            { currentShiftId, requestedShiftId, swapDate, reason: reason.trim() },
            {
                onSuccess: () => {
                    showSuccess("Shift swap request submitted");
                    setShowForm(false);
                    resetForm();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleCancel(id: string) {
        cancelMutation.mutate(id, {
            onSuccess: () => {
                showSuccess("Shift swap request cancelled");
                setCancelConfirmId(null);
            },
            onError: (err) => showApiError(err),
        });
    }

    function resetForm() {
        setCurrentShiftId("");
        setRequestedShiftId("");
        setSwapDate("");
        setReason("");
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
                            <Repeat2 className="w-5 h-5 text-white" />
                        </div>
                        Shift Swap
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 ml-[46px]">
                        Request and track shift changes
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-sm font-bold hover:from-primary-700 hover:to-accent-700 transition-all shadow-md shadow-primary-200 dark:shadow-primary-900/30 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {/* Stats */}
            {swaps.length > 0 && <SwapStats swaps={swaps} />}

            {/* Layout: Calendar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <MiniCalendar
                        value={swapDate}
                        onChange={(d) => {
                            setSwapDate(d);
                            if (!showForm) setShowForm(true);
                        }}
                        swapDates={swapDates}
                    />
                </div>

                {/* Requests List */}
                <div className="lg:col-span-2 space-y-4">
                    {/* New Request Form — Slide-in Panel */}
                    {showForm && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-primary-200 dark:border-primary-700/50 shadow-lg shadow-primary-100/50 dark:shadow-none overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-5 py-3 flex items-center justify-between">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <ArrowLeftRight size={16} />
                                    New Shift Swap Request
                                </h3>
                                <button
                                    onClick={() => { setShowForm(false); resetForm(); }}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Shift Selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <ShiftCard
                                        label="Current Shift"
                                        shiftId={currentShiftId}
                                        shifts={shifts}
                                        onChange={setCurrentShiftId}
                                        highlight="from"
                                    />
                                    <ShiftCard
                                        label="Requested Shift"
                                        shiftId={requestedShiftId}
                                        shifts={shifts.filter((s: any) => s.id !== currentShiftId)}
                                        onChange={setRequestedShiftId}
                                        highlight="to"
                                    />
                                </div>

                                {/* Arrow indicator between shifts */}
                                {currentShiftId && requestedShiftId && (
                                    <div className="flex items-center justify-center gap-3 py-1">
                                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                                            {shifts.find((s: any) => s.id === currentShiftId)?.name}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-accent-500" />
                                        <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                                            {shifts.find((s: any) => s.id === requestedShiftId)?.name}
                                        </span>
                                    </div>
                                )}

                                {/* Same-shift warning */}
                                {currentShiftId && requestedShiftId && currentShiftId === requestedShiftId && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 text-warning-700 dark:text-warning-400 text-xs">
                                        <AlertTriangle size={14} />
                                        Current and requested shifts must be different.
                                    </div>
                                )}

                                {/* Swap Date */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                                        Swap Date
                                    </label>
                                    <div className="relative">
                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={swapDate}
                                            onChange={(e) => setSwapDate(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-10 pr-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                                        Reason <span className="normal-case opacity-60">(min 5 chars)</span>
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Why do you need this shift change?"
                                        className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 resize-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || createMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-sm font-bold hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                                    >
                                        {createMutation.isPending ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                        ) : (
                                            <><ArrowLeftRight className="w-4 h-4" /> Submit Request</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        className="px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Request List */}
                    {swaps.length === 0 && !showForm ? (
                        <EmptyState
                            icon="inbox"
                            title="No Shift Swap Requests"
                            message="You haven't submitted any shift swap requests yet. Click the calendar or 'New Request' to get started."
                        />
                    ) : (
                        <div className="space-y-3">
                            {swaps.map((s: any, index: number) => (
                                <div
                                    key={s.id}
                                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-200"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Shift Change Visual */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold">
                                                    {s.currentShift?.name ?? s.currentShiftName ?? "—"}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs font-bold">
                                                    {s.requestedShift?.name ?? s.requestedShiftName ?? "—"}
                                                </span>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={12} />
                                                    {fmt.date(s.swapDate)}
                                                </span>
                                                <span className="text-neutral-300 dark:text-neutral-600">&middot;</span>
                                                <span>Filed {fmt.relativeDate(s.createdAt)}</span>
                                            </div>

                                            {/* Reason */}
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">{s.reason}</p>
                                        </div>

                                        <StatusBadge status={s.status} />
                                    </div>

                                    {/* Cancel Action */}
                                    {s.status === "PENDING" && (
                                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                            {cancelConfirmId === s.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Are you sure?</span>
                                                    <button
                                                        onClick={() => handleCancel(s.id)}
                                                        disabled={cancelMutation.isPending}
                                                        className="px-3 py-1 text-xs font-semibold text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
                                                    </button>
                                                    <button
                                                        onClick={() => setCancelConfirmId(null)}
                                                        className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setCancelConfirmId(s.id)}
                                                    className="text-xs font-semibold text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 transition-colors"
                                                >
                                                    Cancel Request
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
