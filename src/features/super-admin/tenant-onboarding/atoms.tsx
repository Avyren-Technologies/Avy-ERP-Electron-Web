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
                'bg-white rounded-2xl border border-neutral-100 shadow-sm shadow-neutral-200/40 overflow-hidden mb-5',
                accent && `border-l-4 ${accentBorder[accent]}`,
                className
            )}
        >
            <div className="px-6 py-4 border-b border-neutral-50 bg-neutral-50/60">
                <h3 className="text-sm font-bold text-primary-950 tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
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
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <label className="block text-xs font-bold text-primary-900">
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-3 text-xs font-semibold text-neutral-400 select-none">
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
                        'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800',
                        'placeholder:text-neutral-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                        'transition-all duration-150',
                        readOnly && 'cursor-not-allowed opacity-60',
                        prefix && 'pl-8',
                        monospace && 'font-mono text-xs',
                    )}
                />
            </div>
            {hint && <p className="text-xs text-neutral-400 leading-4">{hint}</p>}
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
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-primary-900">{label}</label>
            <div className="relative flex items-center">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-11 text-sm text-neutral-800
            placeholder:text-neutral-400 font-mono
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
            transition-all duration-150"
                />
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {hint && <p className="text-xs text-neutral-400 leading-4">{hint}</p>}
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
}: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
    rows?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-primary-900">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800
          placeholder:text-neutral-400 resize-none
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
          transition-all duration-150"
            />
            {hint && <p className="text-xs text-neutral-400 leading-4">{hint}</p>}
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
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[] | { value: string; label: string }[];
    placeholder?: string;
    hint?: string;
    required?: boolean;
}) {
    const normalized = options.map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-primary-900">
                {label}
                {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 pr-10 text-sm text-neutral-800
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
            transition-all duration-150 appearance-none cursor-pointer"
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
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            {hint && <p className="text-xs text-neutral-400 leading-4">{hint}</p>}
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
                <p className="text-sm font-semibold text-primary-950">{label}</p>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(!value)}
                className={cn(
                    'relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200',
                    value ? 'bg-primary-600' : 'bg-neutral-200',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
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
                <label className="block text-xs font-bold text-primary-900">
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
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/20'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300 hover:text-primary-700'
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            {hint && <p className="text-xs text-neutral-400 leading-4">{hint}</p>}
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
                    ? 'bg-primary-50 border-primary-400 shadow-sm'
                    : 'bg-white border-neutral-200 hover:border-primary-200 hover:bg-primary-50/30'
            )}
        >
            {color && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            )}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', selected ? 'text-primary-800' : 'text-primary-950')}>
                        {label}
                    </span>
                    {badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500 uppercase">
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
            </div>
            <div
                className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    selected ? 'border-primary-600 bg-primary-600' : 'border-neutral-300 bg-white'
                )}
            >
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
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
        info: 'bg-info-50 border-info-200 text-info-800',
        warning: 'bg-warning-50 border-warning-200 text-warning-700',
        success: 'bg-success-50 border-success-200 text-success-700',
        danger: 'bg-danger-50 border-danger-200 text-danger-700',
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
                'border-2 border-dashed border-primary-200 text-primary-600',
                'text-sm font-semibold',
                'hover:border-primary-400 hover:bg-primary-50 transition-all duration-150',
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
        text-danger-600 bg-danger-50 hover:bg-danger-100 border border-danger-200 hover:border-danger-300
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
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-success-50 text-success-700',
        warning: 'bg-warning-50 text-warning-600',
        info: 'bg-info-50 text-info-700',
    };

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden mb-3">
            <div className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
                {badge && (
                    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold', badgeStyles[badgeVariant])}>
                        {badge}
                    </span>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-950 truncate">{title || 'Untitled'}</p>
                    {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {actions}
                    {onRemove && <DeleteButton onClick={onRemove} />}
                </div>
                <ChevronDown
                    size={16}
                    className={cn('text-neutral-400 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
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
            <label className="block text-xs font-bold text-primary-900">{label}</label>
            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={countryCode}
                        onChange={(e) => onCountryCodeChange(e.target.value)}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 pr-8 text-sm text-neutral-800
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
              transition-all appearance-none w-[4.5rem]"
                    >
                        {options.map((o) => (
                            <option key={o.code} value={o.code}>
                                {o.flag} {o.code}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800
            placeholder:text-neutral-400
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
            <div className="flex-1 h-px bg-neutral-100" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
            <div className="flex-1 h-px bg-neutral-100" />
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
        default: 'bg-neutral-100 text-neutral-600',
        success: 'bg-success-50 text-success-700',
        warning: 'bg-warning-50 text-warning-700',
        danger: 'bg-danger-50 text-danger-700',
        info: 'bg-info-50 text-info-700',
        primary: 'bg-primary-100 text-primary-700',
    };

    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold', styles[variant])}>
            {children}
        </span>
    );
}
