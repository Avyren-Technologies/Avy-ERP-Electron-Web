import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    /** Show a "Create New" button at the bottom of the dropdown */
    onCreateNew?: () => void;
    createNewLabel?: string;
    /** Allow multiple selections */
    multiple?: boolean;
    selectedValues?: string[];
    onMultiChange?: (values: string[]) => void;
    /** Tooltip text shown on hover */
    tooltip?: string;
}

export function SearchableSelect({
    label,
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    required = false,
    onCreateNew,
    createNewLabel = "Create New",
    multiple = false,
    selectedValues = [],
    onMultiChange,
    tooltip,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = options.filter(
        (o) =>
            o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const selected = options.find((o) => o.value === value);

    const handleSelect = (optValue: string) => {
        if (multiple && onMultiChange) {
            const current = [...selectedValues];
            const idx = current.indexOf(optValue);
            if (idx >= 0) {
                current.splice(idx, 1);
            } else {
                current.push(optValue);
            }
            onMultiChange(current);
        } else {
            onChange(optValue);
            setIsOpen(false);
            setSearchTerm("");
        }
    };

    const displayText = multiple
        ? selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : placeholder
        : selected?.label ?? placeholder;

    return (
        <div
            ref={containerRef}
            className={cn("relative", isOpen ? "z-[110]" : "z-20")}
            title={tooltip}
        >
            {label && (
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                    {label}
                    {required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-left transition-all flex items-center justify-between gap-2",
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                    isOpen && "ring-2 ring-primary-500/20 border-primary-500"
                )}
            >
                <span className={cn("truncate", !selected && !multiple ? "text-neutral-400" : "dark:text-white")}>
                    {displayText}
                </span>
                <ChevronDown size={14} className={cn("text-neutral-400 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 z-[1] mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search */}
                    <div className="p-2 border-b border-neutral-100 dark:border-neutral-700">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:text-white"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="overflow-y-auto max-h-52">
                        {!multiple && (
                            <button
                                type="button"
                                onClick={() => handleSelect("")}
                                className="w-full text-left px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {placeholder}
                            </button>
                        )}
                        {filtered.map((o) => {
                            const isSelected = multiple ? selectedValues.includes(o.value) : o.value === value;
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-white transition-colors flex items-center gap-2",
                                        isSelected && "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold"
                                    )}
                                >
                                    {multiple && (
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px]",
                                            isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-neutral-300 dark:border-neutral-600"
                                        )}>
                                            {isSelected && "✓"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate">{o.label}</div>
                                        {o.sublabel && <div className="text-[10px] text-neutral-400 truncate">{o.sublabel}</div>}
                                    </div>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-sm text-neutral-400 text-center">No results found</div>
                        )}
                    </div>

                    {/* Create New */}
                    {onCreateNew && (
                        <div className="border-t border-neutral-100 dark:border-neutral-700 p-1.5">
                            <button
                                type="button"
                                onClick={() => { onCreateNew(); setIsOpen(false); setSearchTerm(""); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold transition-colors"
                            >
                                <Plus size={14} />
                                {createNewLabel}
                            </button>
                        </div>
                    )}

                    {/* Done button for multi-select */}
                    {multiple && selectedValues.length > 0 && (
                        <div className="border-t border-neutral-100 dark:border-neutral-700 p-2">
                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); setSearchTerm(""); }}
                                className="w-full py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
                            >
                                Done ({selectedValues.length} selected)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
