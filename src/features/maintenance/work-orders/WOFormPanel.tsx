import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2, Lock, Play, RotateCcw, Square, X } from "lucide-react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import {
    formatElapsedTimer,
    hoursFromElapsedMs,
} from "@/features/maintenance/work-orders/work-order-parts-labour";

export const woFieldInputClass =
    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all";

export function WOFormLabel({
    children,
    required,
    htmlFor,
}: {
    children: ReactNode;
    required?: boolean;
    htmlFor?: string;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5"
        >
            {children}
            {required ? <span className="text-danger-500 ml-0.5">*</span> : null}
        </label>
    );
}

export function WOFormField({
    label,
    required,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-0", className)}>
            <WOFormLabel required={required}>{label}</WOFormLabel>
            {children}
            {error ? <p className="text-[11px] text-danger-600 dark:text-danger-400 mt-1">{error}</p> : null}
            {!error && hint ? <p className="text-[11px] text-neutral-400 mt-1">{hint}</p> : null}
        </div>
    );
}

export function WOFormSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/30 p-4 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {title}
            </h4>
            {children}
        </div>
    );
}

export function WOFormPanel({
    title,
    subtitle,
    icon: Icon,
    tone = "primary",
    onClose,
    children,
    footer,
}: {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    tone?: "primary" | "warning";
    onClose: () => void;
    children: ReactNode;
    footer: ReactNode;
}) {
    const toneStyles =
        tone === "warning"
            ? "border-warning-200/70 dark:border-warning-800/40 from-warning-50/90 dark:from-warning-950/30"
            : "border-primary-200/60 dark:border-primary-800/40 from-primary-50/90 dark:from-primary-950/30";

    const iconStyles =
        tone === "warning"
            ? "bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300"
            : "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300";

    return (
        <div
            className={cn(
                "rounded-2xl border bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-900/5 overflow-hidden",
                tone === "warning" ? "border-warning-200/70" : "border-primary-200/60 dark:border-primary-800/40",
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r",
                    toneStyles,
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", iconStyles)}>
                        <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white truncate">{title}</h3>
                        {subtitle ? (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
                        ) : null}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-white/60 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Close form"
                >
                    <X size={18} />
                </button>
            </div>
            <div className="p-5 space-y-5">{children}</div>
            <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-wrap items-center justify-end gap-3">
                {footer}
            </div>
        </div>
    );
}

export function LabourQuickTimer({
    timezone,
    onTimerStart,
    onTimerStop,
}: {
    timezone: string;
    onTimerStart: (data: { startTime: string }) => void;
    onTimerStop: (data: { startTime: string; endTime: string; hours: string }) => void;
}) {
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerStartMs, setTimerStartMs] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!timerRunning || timerStartMs === null) return;
        const tick = () => setElapsed(Date.now() - timerStartMs);
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [timerRunning, timerStartMs]);

    const handleStart = () => {
        const now = DateTime.now().setZone(timezone);
        const startMs = Date.now();
        setTimerStartMs(startMs);
        setTimerRunning(true);
        setElapsed(0);
        onTimerStart({
            startTime: now.toFormat("yyyy-MM-dd'T'HH:mm"),
        });
    };

    const handleStop = () => {
        if (timerStartMs === null) return;
        const start = DateTime.fromMillis(timerStartMs).setZone(timezone);
        const end = DateTime.now().setZone(timezone);
        const ms = Date.now() - timerStartMs;
        setTimerRunning(false);
        setTimerStartMs(null);
        setElapsed(0);
        onTimerStop({
            startTime: start.toFormat("yyyy-MM-dd'T'HH:mm"),
            endTime: end.toFormat("yyyy-MM-dd'T'HH:mm"),
            hours: hoursFromElapsedMs(ms),
        });
    };

    return (
        <div className="rounded-xl border border-primary-100 dark:border-primary-900/50 bg-gradient-to-br from-primary-50/80 to-accent-50/40 dark:from-primary-950/30 dark:to-neutral-900/50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">
                Quick timer
            </p>
            <p
                className={cn(
                    "text-center font-mono text-4xl font-bold tracking-tight tabular-nums mb-4",
                    timerRunning ? "text-primary-600 dark:text-primary-300" : "text-primary-950 dark:text-white",
                )}
                aria-live="polite"
            >
                {formatElapsedTimer(elapsed)}
            </p>
            <div className="flex gap-3">
                {!timerRunning ? (
                    <button
                        type="button"
                        onClick={handleStart}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors"
                    >
                        <Play size={16} fill="currentColor" />
                        Start timer
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleStop}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors"
                    >
                        <Square size={14} fill="currentColor" />
                        Stop & fill form
                    </button>
                )}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mt-3">
                Stopping the timer fills start time, end time, and hours below.
            </p>
        </div>
    );
}

export function WorkOrderReasonModal({
    title,
    subtitle,
    icon: Icon,
    tone = "primary",
    fieldLabel,
    placeholder,
    value,
    onChange,
    onClose,
    onConfirm,
    isPending,
    confirmLabel,
    confirmVariant = "primary",
    disabled,
}: {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    tone?: "primary" | "warning";
    fieldLabel: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
    isPending?: boolean;
    confirmLabel: string;
    confirmVariant?: "primary" | "warning" | "success";
    disabled?: boolean;
}) {
    const IconComponent = Icon ?? (tone === "warning" ? RotateCcw : Lock);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className={cn(
                        "flex items-center gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r",
                        tone === "warning"
                            ? "from-warning-50/90 dark:from-warning-950/30"
                            : "from-primary-50/90 dark:from-primary-950/30",
                    )}
                >
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            tone === "warning"
                                ? "bg-warning-100 dark:bg-warning-900/40 text-warning-700"
                                : "bg-primary-100 dark:bg-primary-900/50 text-primary-600",
                        )}
                    >
                        <IconComponent size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-primary-950 dark:text-white">{title}</h3>
                        {subtitle ? <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-white/60 dark:hover:bg-neutral-800"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="px-5 py-5">
                    <WOFormField label={fieldLabel} required>
                        <textarea
                            rows={4}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className={cn(woFieldInputClass, "resize-none min-h-[110px]")}
                        />
                    </WOFormField>
                </div>
                <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex justify-end gap-3">
                    <WOFormButton variant="secondary" onClick={onClose}>
                        Cancel
                    </WOFormButton>
                    <WOFormButton
                        variant={confirmVariant}
                        onClick={onConfirm}
                        loading={isPending}
                        disabled={disabled}
                    >
                        {confirmLabel}
                    </WOFormButton>
                </div>
            </div>
        </div>
    );
}

export function WOFormButton({
    variant = "primary",
    onClick,
    disabled,
    loading,
    children,
}: {
    variant?: "primary" | "secondary" | "warning" | "success";
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: ReactNode;
}) {
    const variants = {
        primary:
            "bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 disabled:opacity-50",
        secondary:
            "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700",
        warning:
            "bg-warning-600 hover:bg-warning-700 text-white shadow-sm disabled:opacity-50",
        success:
            "bg-success-600 hover:bg-success-700 text-white shadow-sm disabled:opacity-50",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center gap-2 min-w-[120px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                variants[variant],
            )}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {children}
        </button>
    );
}
