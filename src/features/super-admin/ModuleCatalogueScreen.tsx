import { useState, useMemo } from "react";
import {
    KeySquare, Users, ShieldCheck, Factory, HeartPulse, Truck,
    FileText, Boxes, Smartphone, Laptop, Search, Loader2, AlertCircle,
    Filter, ChevronDown, Lock, Plus, Minus, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useModuleCatalogue } from "@/features/company-admin/api/use-company-admin-queries";
import { useAddLocationModules, useRemoveLocationModule } from "@/features/company-admin/api";
import type { CatalogueModule } from "@/lib/api/company-admin";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { showSuccess, showApiError } from "@/lib/toast";

// ── Icon map for modules ──

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    masters: KeySquare,
    security: ShieldCheck,
    hr: Users,
    production: Factory,
    machine: HeartPulse,
    inventory: Boxes,
    vendor: Truck,
    sales: FileText,
};

const COLOR_MAP: Record<string, string> = {
    masters: "from-neutral-500 to-neutral-600",
    security: "from-indigo-500 to-indigo-600",
    hr: "from-blue-500 to-blue-600",
    production: "from-orange-500 to-orange-600",
    machine: "from-rose-500 to-rose-600",
    inventory: "from-emerald-500 to-emerald-600",
    vendor: "from-cyan-500 to-cyan-600",
    sales: "from-violet-500 to-violet-600",
    // Category-based defaults
    Core: "from-neutral-500 to-neutral-600",
    Operations: "from-orange-500 to-orange-600",
    Finance: "from-emerald-500 to-emerald-600",
    default: "from-primary-500 to-primary-600",
};

function getModuleIcon(mod: CatalogueModule) {
    return ICON_MAP[mod.id] ?? ICON_MAP[mod.icon ?? ''] ?? Boxes;
}

function getModuleColor(mod: CatalogueModule) {
    return COLOR_MAP[mod.id] ?? COLOR_MAP[mod.category ?? ''] ?? COLOR_MAP.default;
}

// ── Categories ──

const ALL_CATEGORY = "All";

function getCategories(modules: CatalogueModule[]): string[] {
    const cats = new Set<string>();
    modules.forEach((m) => {
        if (m.category) cats.add(m.category);
    });
    return [ALL_CATEGORY, ...Array.from(cats).sort()];
}

// ── Main Screen ──

export function ModuleCatalogueScreen() {
    const userRole = useAuthStore((s) => s.userRole);
    const isCompanyAdmin = userRole === "company-admin";

    const navigate = useNavigate();
    const { data, isLoading, isError, error } = useModuleCatalogue();
    const addModulesMutation = useAddLocationModules();
    const removeModuleMutation = useRemoveLocationModule();
    const isMutating = addModulesMutation.isPending || removeModuleMutation.isPending;

    // Backend returns { data: { catalogue: [...], companyActiveModuleIds: [...] } }
    const rawData = data?.data as any;
    const modules: CatalogueModule[] = (rawData?.catalogue ?? rawData ?? []).map((mod: any) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        price: mod.pricePerMonth ? `₹${mod.pricePerMonth}/mo` : mod.price,
        pricingModel: mod.pricingModel,
        isRequired: mod.isRequired ?? mod.id === 'masters',
        isActive: mod.isActive ?? false,
        dependencies: mod.dependencies,
        features: mod.features,
    }));

    const locationConfig: string = rawData?.locationConfig ?? 'common';
    const billingType: string = rawData?.billingType ?? 'monthly';
    const locationModules: Array<{ locationId: string; locationName: string; activeModuleIds: string[] }> = rawData?.locationModules ?? [];
    const isOneTimeBilling = billingType === 'one-time';

    function handleAddModule(locationId: string, moduleId: string, moduleName: string) {
        if (isOneTimeBilling) {
            navigate('/app/help', { state: { prefill: { category: 'MODULE_CHANGE', metadata: { type: 'ADD', locationId, moduleId, moduleName } } } });
            return;
        }
        addModulesMutation.mutate({ locationId, moduleIds: [moduleId] }, {
            onSuccess: () => showSuccess(`${moduleName} added successfully`),
            onError: (err) => showApiError(err),
        });
    }

    function handleRemoveModule(locationId: string, moduleId: string, moduleName: string) {
        if (isOneTimeBilling) {
            navigate('/app/help', { state: { prefill: { category: 'MODULE_CHANGE', metadata: { type: 'REMOVE', locationId, moduleId, moduleName } } } });
            return;
        }
        removeModuleMutation.mutate({ locationId, moduleId }, {
            onSuccess: () => showSuccess(`${moduleName} removed successfully`),
            onError: (err) => showApiError(err),
        });
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const categories = useMemo(() => getCategories(modules), [modules]);

    const filteredModules = useMemo(() => {
        return modules.filter((mod) => {
            const matchesSearch =
                !searchQuery ||
                mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (mod.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === ALL_CATEGORY || mod.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [modules, searchQuery, selectedCategory]);

    // Group by category for display
    const groupedModules = useMemo(() => {
        if (selectedCategory !== ALL_CATEGORY) return { [selectedCategory]: filteredModules };
        const groups: Record<string, CatalogueModule[]> = {};
        filteredModules.forEach((mod) => {
            const cat = mod.category ?? "Other";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(mod);
        });
        return groups;
    }, [filteredModules, selectedCategory]);

    // ── Error State ──
    if (isError) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-danger-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary-950 dark:text-white mb-2">Failed to load modules</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        {(error as any)?.message ?? "Something went wrong. Please try again."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Module Catalogue</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {isCompanyAdmin
                            ? "Your subscribed modules and available add-ons."
                            : "Avyren ERP ecosystem features available to tenants."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-bold transition-colors",
                                viewMode === "grid"
                                    ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-950 dark:text-white"
                                    : "text-neutral-500 dark:text-neutral-400 hover:text-primary-950 dark:hover:text-white"
                            )}
                        >
                            Grid View
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-bold transition-colors",
                                viewMode === "list"
                                    ? "bg-white dark:bg-neutral-700 shadow-sm text-primary-950 dark:text-white"
                                    : "text-neutral-500 dark:text-neutral-400 hover:text-primary-950 dark:hover:text-white"
                            )}
                        >
                            List View
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-primary-950 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
                    />
                </div>

                {/* Category Filter */}
                {categories.length > 2 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-neutral-400" />
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    selectedCategory === cat
                                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700"
                                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-700"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!isLoading && filteredModules.length === 0 && (
                <EmptyState
                    icon="search"
                    title="No modules found"
                    message={searchQuery ? "Try a different search term." : "No modules available."}
                />
            )}

            {/* Module Cards */}
            {!isLoading && Object.keys(groupedModules).length > 0 && Object.entries(groupedModules).map(([category, mods]) => (
                <div key={category}>
                    {selectedCategory === ALL_CATEGORY && Object.keys(groupedModules).length > 1 && (
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white mb-4">{category}</h2>
                    )}

                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {mods.map((mod) => (
                                <ModuleCard key={mod.id} mod={mod} isCompanyAdmin={isCompanyAdmin} locationModules={locationModules} onAdd={handleAddModule} onRemove={handleRemoveModule} isOneTimeBilling={isOneTimeBilling} isMutating={isMutating} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mods.map((mod) => (
                                <ModuleListItem key={mod.id} mod={mod} isCompanyAdmin={isCompanyAdmin} locationModules={locationModules} onAdd={handleAddModule} onRemove={handleRemoveModule} isOneTimeBilling={isOneTimeBilling} isMutating={isMutating} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Module Card ──

function ModuleCard({ mod, isCompanyAdmin, locationModules, onAdd, onRemove, isOneTimeBilling, isMutating }: {
    mod: CatalogueModule;
    isCompanyAdmin: boolean;
    locationModules?: Array<{ locationId: string; locationName: string; activeModuleIds: string[] }>;
    onAdd?: (locationId: string, moduleId: string, moduleName: string) => void;
    onRemove?: (locationId: string, moduleId: string, moduleName: string) => void;
    isOneTimeBilling?: boolean;
    isMutating?: boolean;
}) {
    const Icon = getModuleIcon(mod);
    const color = getModuleColor(mod);

    return (
        <div className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-xl shadow-neutral-900/5 hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
            {/* Soft background glow on hover */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.08] transition-opacity duration-500 bg-gradient-to-br", color)} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-inner", color)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    {mod.isRequired && (
                        <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            Required
                        </span>
                    )}
                    {isCompanyAdmin && (
                        <span className={cn(
                            "text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded border",
                            mod.isActive
                                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                        )}>
                            {mod.isActive ? "Active" : "Not Subscribed"}
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-2 relative z-10">{mod.name}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 flex-1 relative z-10">{mod.description}</p>

            {/* Features list if available */}
            {mod.features && mod.features.length > 0 && (
                <div className="mb-4 relative z-10">
                    <div className="flex flex-wrap gap-1.5">
                        {mod.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                {f}
                            </span>
                        ))}
                        {mod.features.length > 3 && (
                            <span className="text-[10px] font-medium text-primary-500 dark:text-primary-400 px-2 py-0.5">
                                +{mod.features.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Dependencies */}
            {mod.dependencies && mod.dependencies.length > 0 && (
                <div className="mb-4 relative z-10">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                        Requires: {mod.dependencies.join(", ")}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 relative z-10 mt-auto">
                <span className="font-bold text-primary-600 dark:text-primary-400">
                    {mod.price ?? (mod.isRequired ? "Included" : "Contact Sales")}
                </span>
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center relative z-20">
                        <Smartphone className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center relative z-10">
                        <Laptop className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    </div>
                </div>
            </div>

            {/* Module Actions for Company Admin */}
            {isCompanyAdmin && locationModules && locationModules.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 relative z-10">
                    {locationModules.map((loc) => {
                        const isActiveOnLocation = loc.activeModuleIds.includes(mod.id);
                        const isMasters = mod.id === 'masters';
                        return (
                            <div key={loc.locationId} className="flex items-center justify-between py-1.5">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex-1">{loc.locationName}</span>
                                {isMasters ? (
                                    <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                                        <Lock className="w-3 h-3" /> Required
                                    </span>
                                ) : isActiveOnLocation ? (
                                    <button
                                        onClick={() => onRemove?.(loc.locationId, mod.id, mod.name)}
                                        disabled={isMutating}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 rounded-md hover:bg-danger-100 dark:hover:bg-danger-900/40 transition-colors disabled:opacity-50"
                                    >
                                        {isOneTimeBilling ? <><ExternalLink className="w-3 h-3" /> Request Remove</> : <><Minus className="w-3 h-3" /> Remove</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onAdd?.(loc.locationId, mod.id, mod.name)}
                                        disabled={isMutating}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 rounded-md hover:bg-success-100 dark:hover:bg-success-900/40 transition-colors disabled:opacity-50"
                                    >
                                        {isOneTimeBilling ? <><ExternalLink className="w-3 h-3" /> Request Add</> : <><Plus className="w-3 h-3" /> Add</>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Module List Item ──

function ModuleListItem({ mod, isCompanyAdmin, locationModules, onAdd, onRemove, isOneTimeBilling, isMutating }: {
    mod: CatalogueModule;
    isCompanyAdmin: boolean;
    locationModules?: Array<{ locationId: string; locationName: string; activeModuleIds: string[] }>;
    onAdd?: (locationId: string, moduleId: string, moduleName: string) => void;
    onRemove?: (locationId: string, moduleId: string, moduleName: string) => void;
    isOneTimeBilling?: boolean;
    isMutating?: boolean;
}) {
    const Icon = getModuleIcon(mod);
    const color = getModuleColor(mod);

    return (
        <div className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 px-6 py-4 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300 flex items-center gap-5 relative overflow-hidden">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-inner flex-shrink-0", color)}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{mod.name}</h3>
                    {mod.isRequired && (
                        <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Required</span>
                    )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{mod.description}</p>
            </div>

            {mod.category && (
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded hidden lg:inline-flex">
                    {mod.category}
                </span>
            )}

            <span className="font-bold text-sm text-primary-600 dark:text-primary-400 whitespace-nowrap">
                {mod.price ?? (mod.isRequired ? "Included" : "Contact Sales")}
            </span>

            {isCompanyAdmin && (
                <span className={cn(
                    "text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded border whitespace-nowrap",
                    mod.isActive
                        ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                        : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                )}>
                    {mod.isActive ? "Active" : "Not Subscribed"}
                </span>
            )}

            {/* Module Actions for Company Admin */}
            {isCompanyAdmin && locationModules && locationModules.length > 0 && (
                <div className="flex items-center gap-2">
                    {locationModules.map((loc) => {
                        const isActiveOnLocation = loc.activeModuleIds.includes(mod.id);
                        const isMasters = mod.id === 'masters';
                        return (
                            <div key={loc.locationId} className="flex items-center gap-1.5">
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden xl:inline">{loc.locationName}:</span>
                                {isMasters ? (
                                    <span className="flex items-center gap-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                        <Lock className="w-3 h-3" />
                                    </span>
                                ) : isActiveOnLocation ? (
                                    <button
                                        onClick={() => onRemove?.(loc.locationId, mod.id, mod.name)}
                                        disabled={isMutating}
                                        className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 rounded hover:bg-danger-100 dark:hover:bg-danger-900/40 transition-colors disabled:opacity-50"
                                    >
                                        {isOneTimeBilling ? <ExternalLink className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onAdd?.(loc.locationId, mod.id, mod.name)}
                                        disabled={isMutating}
                                        className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 rounded hover:bg-success-100 dark:hover:bg-success-900/40 transition-colors disabled:opacity-50"
                                    >
                                        {isOneTimeBilling ? <ExternalLink className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
