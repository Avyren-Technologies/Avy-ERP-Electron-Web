import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, Package, Boxes, Hash, Warehouse, Grid3X3, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/features/inventory/api/use-inventory-queries';

const ENTITY_TYPES = [
    { key: '', label: 'All', icon: Search },
    { key: 'parts', label: 'Parts', icon: Package },
    { key: 'lots', label: 'Lots', icon: Boxes },
    { key: 'serials', label: 'Serials', icon: Hash },
    { key: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { key: 'bins', label: 'Bins', icon: Grid3X3 },
    { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
] as const;

const TYPE_COLORS: Record<string, string> = {
    part: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    lot: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    serial: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    warehouse: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    bin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    transaction: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export function InventorySearchScreen() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [entityType, setEntityType] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleQueryChange = useCallback((val: string) => {
        setQuery(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebouncedQuery(val), 300);
    }, []);

    const params = useMemo(() => ({
        q: debouncedQuery,
        ...(entityType ? { entityType } : {}),
    }), [debouncedQuery, entityType]);

    const { data, isLoading, isFetching } = useGlobalSearch(params);
    const results = data?.data || [];
    const hasQuery = debouncedQuery.length >= 2;

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory Search</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Search across items, lots, serials, bins, and transactions</p>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search items, lots, serials, bins, transactions..."
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                />
                {isFetching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary-500" />
                )}
            </div>

            {/* Entity Type Chips */}
            <div className="flex gap-2 flex-wrap">
                {ENTITY_TYPES.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setEntityType(t.key)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            entityType === t.key
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
                        )}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            {!hasQuery && (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400">Type to search across inventory data</p>
                    <p className="text-sm text-neutral-400 mt-1">Minimum 2 characters</p>
                </div>
            )}

            {hasQuery && !isLoading && results.length === 0 && (
                <div className="text-center py-16">
                    <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400">No results found for &apos;{debouncedQuery}&apos;</p>
                    <p className="text-sm text-neutral-400 mt-1">Try different keywords or entity types</p>
                </div>
            )}

            {hasQuery && results.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-neutral-500">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                    {results.map((r: any, i: number) => (
                        <div
                            key={r.id || i}
                            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5', TYPE_COLORS[r.type] || 'bg-neutral-100 text-neutral-600')}>
                                        {r.type || 'item'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{r.label || r.name || r.code}</p>
                                        {r.subtitle && <p className="text-xs text-neutral-500 mt-0.5 truncate">{r.subtitle}</p>}
                                        {r.description && <p className="text-xs text-neutral-400 mt-0.5 truncate">{r.description}</p>}
                                    </div>
                                </div>
                                <button className="text-primary-600 hover:text-primary-700 shrink-0">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
