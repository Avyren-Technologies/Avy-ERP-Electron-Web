// ============================================================
// Tenant Onboarding — Shared Atom Components (Web)
// All reusable form primitives used across steps
// ============================================================
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Plus, Trash2, ChevronDown } from 'lucide-react';

// ---- Section Card ----

export function SectionCard({
    title,
    subtitle,
    children,
    className,
    accent,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    accent?: 'warning' | 'info' | 'success';
}) {
    const accentBorder = {
        warning: 'border-l-warning-400',
        info: 'border-l-info-500',
        success: 'border-l-success-500',
    };

    return (
        <div
            className={cn(
                'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm shadow-neutral-200/40 overflow-hidden mb-5',
                accent && `border-l-4 ${accentBorder[accent]}`,
                className
            )}
        >
            <div className="px-6 py-4 border-b border-neutral-50 bg-neutral-50/60">
                <h3 className="text-sm font-bold text-primary-950 tracking-tight dark:text-white">{title}</h3>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">{subtitle}</p>}
            </div>
            <div className="px-6 py-5 space-y-4">{children}</div>
        </div>
    );
}

// ---- Form Input ----

export function FormInput({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    hint,
    required,
    className,
    readOnly,
    prefix,
    monospace,
    error,
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    hint?: string;
    required?: boolean;
    className?: string;
    readOnly?: boolean;
    prefix?: string;
    monospace?: boolean;
    error?: string;
}) {
    return (
        <div className={cn('space-y-1.5 w-full', className)}>
            <label className="block text-xs font-bold text-primary-900 dark:text-white">
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-4 text-sm font-semibold text-neutral-400 select-none dark:text-neutral-500">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={cn(
                        'w-full rounded-2xl border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200',
                        'placeholder:text-neutral-400 dark:text-neutral-500',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                        'transition-all duration-150',
                        error && 'border-danger-400 focus:ring-danger-500/20 focus:border-danger-400 bg-danger-50/30 dark:bg-danger-900/10',
                        readOnly && 'cursor-not-allowed opacity-60',
                        prefix && 'pl-9',
                        monospace && 'font-mono text-xs',
                    )}
                />
            </div>
            {error ? (
                <p className="text-xs text-danger-500 font-medium leading-4">{error}</p>
            ) : hint ? (
                <p className="text-xs text-neutral-400 leading-4 dark:text-neutral-500">{hint}</p>
            ) : null}
        </div>
    );
}

// ---- Secret Input (password with toggle) ----

export function SecretInput({
    label,
    placeholder,
    value,
    onChange,
    hint,
    error,
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
    error?: string;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-1.5 w-full">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">{label}</label>
            <div className="relative flex items-center">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full rounded-2xl border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 px-4 py-3 pr-11 text-sm text-neutral-800 dark:text-neutral-200',
                        'placeholder:text-neutral-400 dark:text-neutral-500 font-mono',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                        'transition-all duration-150',
                        error && 'border-danger-400 focus:ring-danger-500/20 focus:border-danger-400 bg-danger-50/30 dark:bg-danger-900/10'
                    )}
                />
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-colors dark:text-neutral-300"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {error ? (
                <p className="text-xs text-danger-500 font-medium leading-4">{error}</p>
            ) : hint ? (
                <p className="text-xs text-neutral-400 leading-4 dark:text-neutral-500">{hint}</p>
            ) : null}
        </div>
    );
}

// ---- Textarea ----

export function FormTextarea({
    label,
    placeholder,
    value,
    onChange,
    hint,
    rows = 3,
    error,
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
    rows?: number;
    error?: string;
}) {
    return (
        <div className="space-y-1.5 w-full">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={cn(
                    'w-full rounded-2xl border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200',
                    'placeholder:text-neutral-400 dark:text-neutral-500 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                    'transition-all duration-150',
                    error && 'border-danger-400 focus:ring-danger-500/20 focus:border-danger-400 bg-danger-50/30 dark:bg-danger-900/10'
                )}
            />
            {error ? (
                <p className="text-xs text-danger-500 font-medium leading-4">{error}</p>
            ) : hint ? (
                <p className="text-xs text-neutral-400 leading-4 dark:text-neutral-500">{hint}</p>
            ) : null}
        </div>
    );
}

// ---- Select Dropdown ----

export function FormSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
    hint,
    required,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[] | { value: string; label: string }[];
    placeholder?: string;
    hint?: string;
    required?: boolean;
    error?: string;
}) {
    const normalized = options.map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    return (
        <div className="space-y-1.5 w-full">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        'w-full rounded-2xl border border-neutral-200/60 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 px-4 py-3 pr-10 text-sm text-neutral-800 dark:text-neutral-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                        'transition-all duration-150 appearance-none cursor-pointer',
                        error && 'border-danger-400 focus:ring-danger-500/20 focus:border-danger-400 bg-danger-50/30 dark:bg-danger-900/10'
                    )}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {normalized.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none dark:text-neutral-500" />
            </div>
            {error ? (
                <p className="text-xs text-danger-500 font-medium leading-4">{error}</p>
            ) : hint ? (
                <p className="text-xs text-neutral-400 leading-4 dark:text-neutral-500">{hint}</p>
            ) : null}
        </div>
    );
}

// ---- Toggle Row ----

export function ToggleRow({
    label,
    subtitle,
    value,
    onToggle,
    disabled,
}: {
    label: string;
    subtitle?: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-4 py-3 border-b border-neutral-50 last:border-0',
                disabled && 'opacity-50'
            )}
        >
            <div className="flex-1">
                <p className="text-sm font-semibold text-primary-950 dark:text-white">{label}</p>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed dark:text-neutral-400">{subtitle}</p>}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(!value)}
                className={cn(
                    'relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200',
                    value ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 shadow-sm transition-all duration-200',
                        value ? 'translate-x-5' : 'translate-x-0'
                    )}
                />
            </button>
        </div>
    );
}

// ---- Chip Selector (multi or single) ----

export function ChipSelector({
    label,
    options,
    selected,
    onSelect,
    required,
    hint,
}: {
    label?: string;
    options: string[];
    selected: string | string[];
    onSelect: (v: string) => void;
    required?: boolean;
    hint?: string;
}) {
    const isSelected = (opt: string) =>
        Array.isArray(selected) ? selected.includes(opt) : selected === opt;

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-xs font-bold text-primary-900 dark:text-white">
                    {label}
                    {required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onSelect(opt)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 select-none',
                            isSelected(opt)
                                ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-500 shadow-sm shadow-primary-500/20'
                                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:text-primary-700 dark:text-primary-400'
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            {hint && <p className="text-xs text-neutral-400 leading-4 dark:text-neutral-500">{hint}</p>}
        </div>
    );
}

// ---- Radio Option ----

export function RadioOption({
    label,
    subtitle,
    selected,
    onSelect,
    badge,
    color,
}: {
    label: string;
    subtitle?: string;
    selected: boolean;
    onSelect: () => void;
    badge?: string;
    color?: string;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150',
                selected
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 shadow-sm'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-primary-200 dark:border-primary-800/50 hover:bg-primary-50/30'
            )}
        >
            {color && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            )}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', selected ? 'text-primary-800 dark:text-primary-300' : 'text-primary-950 dark:text-white')}>
                        {label}
                    </span>
                    {badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">{subtitle}</p>}
            </div>
            <div
                className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    selected ? 'border-primary-600 dark:border-primary-500 bg-primary-600' : 'border-neutral-300 bg-white dark:bg-neutral-900'
                )}
            >
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
            </div>
        </button>
    );
}

// ---- Info Banner ----

export function InfoBanner({
    children,
    variant = 'info',
    className,
}: {
    children: React.ReactNode;
    variant?: 'info' | 'warning' | 'success' | 'danger';
    className?: string;
}) {
    const styles = {
        info: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/50 text-info-800 dark:text-info-400',
        warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/50 text-warning-700 dark:text-warning-400',
        success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800/50 text-success-700 dark:text-success-400',
        danger: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800/50 text-danger-700 dark:text-danger-400',
    };
    const iconMap = {
        info: 'ℹ️',
        warning: '⚠️',
        success: '✅',
        danger: '🚨',
    };

    return (
        <div className={cn('flex items-start gap-3 p-4 rounded-xl border text-xs leading-5', styles[variant], className)}>
            <span className="flex-shrink-0 mt-0.5">{iconMap[variant]}</span>
            <div>{children}</div>
        </div>
    );
}

// ---- Add Button ----

export function AddButton({
    label,
    onClick,
    className,
}: {
    label: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
                'border-2 border-dashed border-primary-200 dark:border-primary-800/50 text-primary-600',
                'text-sm font-semibold',
                'hover:border-primary-400 hover:bg-primary-50 dark:bg-primary-900/30 transition-all duration-150',
                className
            )}
        >
            <Plus size={16} strokeWidth={2.5} />
            {label}
        </button>
    );
}

// ---- Delete Button (icon) ----

export function DeleteButton({
    onClick,
    label,
}: {
    onClick: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        text-danger-600 bg-danger-50 dark:bg-danger-900/20 hover:bg-danger-100 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800/50 hover:border-danger-300
        transition-all duration-150"
        >
            <Trash2 size={12} strokeWidth={2.5} />
            {label ?? 'Remove'}
        </button>
    );
}

// ---- Card Item (expandable item card for locations, shifts, etc.) ----

export function ItemCard({
    title,
    subtitle,
    badge,
    badgeVariant = 'primary',
    onRemove,
    actions,
    children,
    defaultOpen = false,
}: {
    title: string;
    subtitle?: string;
    badge?: string;
    badgeVariant?: 'primary' | 'success' | 'warning' | 'info';
    onRemove?: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const badgeStyles = {
        primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400',
        success: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400',
        warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600',
        info: 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-400',
    };

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-3 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
                {badge && (
                    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', badgeStyles[badgeVariant])}>
                        {badge}
                    </span>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-950 truncate dark:text-white">{title || 'Untitled'}</p>
                    {subtitle && <p className="text-xs text-neutral-500 truncate dark:text-neutral-400">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {actions}
                    {onRemove && <DeleteButton onClick={onRemove} />}
                </div>
                <ChevronDown
                    size={16}
                    className={cn('text-neutral-400 dark:text-neutral-500 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
                />
            </div>
            {open && (
                <div className="px-5 pb-5 border-t border-neutral-50 pt-4 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
}

// ---- Two column grid ----

export function TwoCol({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    );
}

// ---- Three column grid ----

export function ThreeCol({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    );
}

// ---- Phone Input ----

export function PhoneInput({
    label,
    countryCode,
    phone,
    onCountryCodeChange,
    onPhoneChange,
    options,
}: {
    label: string;
    countryCode: string;
    phone: string;
    onCountryCodeChange: (v: string) => void;
    onPhoneChange: (v: string) => void;
    options: { code: string; flag: string; country: string }[];
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-primary-900 dark:text-white">{label}</label>
            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={countryCode}
                        onChange={(e) => onCountryCodeChange(e.target.value)}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-3 pr-8 text-sm text-neutral-800 dark:text-neutral-200
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
              transition-all appearance-none w-[4.5rem]"
                    >
                        {options.map((o) => (
                            <option key={o.code} value={o.code}>
                                {o.flag} {o.code}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none dark:text-neutral-500" />
                </div>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200
            placeholder:text-neutral-400 dark:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
            transition-all"
                />
            </div>
        </div>
    );
}

// ---- Divider with label ----

export function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider dark:text-neutral-500">{label}</span>
            <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
        </div>
    );
}

// ---- Badge ----

export function Badge({
    children,
    variant = 'default',
}: {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}) {
    const styles = {
        default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
        success: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400',
        warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400',
        danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400',
        info: 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-400',
        primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400',
    };

    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold', styles[variant])}>
            {children}
        </span>
    );
}
