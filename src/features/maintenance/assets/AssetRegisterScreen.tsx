import { useState } from "react";
import {
    Package,
    Search,
    Plus,
    Filter,
    X,
    Edit3,
    Trash2,
    Eye,
    Loader2,
    RefreshCw,
    Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssets, useAssetCategories, useAssetSubCategories, useAssetTypes } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useCreateAsset,
    useUpdateAsset,
    useDeleteAsset,
    useSyncMachines,
    useCreateAssetCategory,
    useUpdateAssetCategory,
    useDeleteAssetCategory,
    useCreateAssetSubCategory,
    useUpdateAssetSubCategory,
    useDeleteAssetSubCategory,
    useCreateAssetType,
    useUpdateAssetType,
    useDeleteAssetType,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ManageModal } from "@/components/ui/ManageModal";
import { AssetStatusBadge } from "@/features/maintenance/shared/AssetStatusBadge";
import { CriticalityBadge } from "@/features/maintenance/shared/CriticalityBadge";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const ASSET_CLASS_OPTIONS = [
    { value: "", label: "All Classes" },
    { value: "MACHINE", label: "Machine" },
    { value: "VEHICLE", label: "Vehicle" },
    { value: "BUILDING", label: "Building" },
    { value: "GARDEN", label: "Garden" },
    { value: "LAB_EQUIPMENT", label: "Lab Equipment" },
    { value: "TOOLING", label: "Tooling" },
    { value: "UTILITY", label: "Utility" },
    { value: "INFRASTRUCTURE", label: "Infrastructure" },
    { value: "PROJECT_SITE", label: "Project Site" },
    { value: "WAREHOUSE_EQUIPMENT", label: "Warehouse Equipment" },
];

const CRITICALITY_OPTIONS = [
    { value: "", label: "All Criticalities" },
    { value: "CRITICAL", label: "Critical" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

const OPERATIONAL_STATUS_OPTIONS = [
    { value: "", label: "All Operational" },
    { value: "RUNNING", label: "Running" },
    { value: "IDLE", label: "Idle" },
    { value: "BREAKDOWN", label: "Breakdown" },
    { value: "SHUTDOWN", label: "Shutdown" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "RETIRED", label: "Retired" },
];

const MAINTENANCE_STATUS_OPTIONS = [
    { value: "", label: "All Maintenance" },
    { value: "NO_ACTION", label: "No Action" },
    { value: "PM_DUE", label: "PM Due" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "WAITING_PARTS", label: "Waiting Parts" },
    { value: "CLOSED", label: "Closed" },
];

const OWNERSHIP_OPTIONS = [
    { value: "OWNED", label: "Owned" },
    { value: "LEASED", label: "Leased" },
    { value: "AMC_MANAGED", label: "AMC Managed" },
    { value: "CUSTOMER_SITE", label: "Customer Site" },
];

const PTW_CLASS_OPTIONS = [
    { value: "", label: "None" },
    { value: "HOT_WORK", label: "Hot Work" },
    { value: "CONFINED_SPACE", label: "Confined Space" },
    { value: "ELECTRICAL_ISOLATION", label: "Electrical Isolation" },
    { value: "PRESSURE_RELEASE", label: "Pressure Release" },
    { value: "GENERAL_WORK", label: "General Work" },
];

const EMPTY_FORM: Record<string, any> = {
    name: "",
    assetClass: "MACHINE",
    categoryId: "",
    subCategoryId: "",
    typeId: "",
    ownership: "OWNED",
    criticality: "MEDIUM",
    isBottleneck: false,
    locationId: "",
    departmentId: "",
    floorZone: "",
    manufacturer: "",
    brand: "",
    modelNumber: "",
    serialNumber: "",
    commissioningDate: "",
    condition: "",
    ratedCapacity: "",
    designLifeYears: "",
    failureCodeSetId: "",
    permitRequired: false,
    ptwClass: "",
    warrantyExpiry: "",
    insuranceExpiry: "",
    registrationExpiry: "",
    fitnessExpiry: "",
    purchaseCost: "",
    currentBookValue: "",
    replacementValue: "",
};

/* ── Screen ── */

export function AssetRegisterScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("maintenance.assets:create");
    const canDelete = useCanPerform("maintenance.assets:delete");

    // Filters
    const [search, setSearch] = useState("");
    const [assetClass, setAssetClass] = useState("");
    const [criticality, setCriticality] = useState("");
    const [operationalStatus, setOperationalStatus] = useState("");
    const [maintenanceStatus, setMaintenanceStatus] = useState("");
    const [locationId, setLocationId] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);
    const [form, setForm] = useState<Record<string, any>>({ ...EMPTY_FORM });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Manage dropdowns
    const [manageCategoryOpen, setManageCategoryOpen] = useState(false);
    const [manageSubCategoryOpen, setManageSubCategoryOpen] = useState(false);
    const [manageTypeOpen, setManageTypeOpen] = useState(false);

    // Queries
    const params: Record<string, unknown> = { page, limit: 25 };
    if (search) params.search = search;
    if (assetClass) params.assetClass = assetClass;
    if (criticality) params.criticality = criticality;
    if (operationalStatus) params.operationalStatus = operationalStatus;
    if (maintenanceStatus) params.maintenanceStatus = maintenanceStatus;
    if (locationId) params.locationId = locationId;

    const { data, isLoading, isError } = useAssets(params);
    const locationsQuery = useCompanyLocations();
    const categoriesQuery = useAssetCategories();
    const subCategoriesQuery = useAssetSubCategories(form.categoryId ? { categoryId: form.categoryId } : undefined);
    const typesQuery = useAssetTypes();

    const assets: any[] = data?.data ?? [];
    const meta = data?.meta ?? {};
    const locations: any[] = locationsQuery.data?.data ?? [];
    const categories: any[] = categoriesQuery.data?.data ?? [];
    const subCategories: any[] = subCategoriesQuery.data?.data ?? [];
    const types: any[] = typesQuery.data?.data ?? [];

    // Mutations
    const createMutation = useCreateAsset();
    const updateMutation = useUpdateAsset();
    const deleteMutation = useDeleteAsset();
    const syncMutation = useSyncMachines();

    // Category mutations
    const createCategoryMutation = useCreateAssetCategory();
    const updateCategoryMutation = useUpdateAssetCategory();
    const deleteCategoryMutation = useDeleteAssetCategory();

    // SubCategory mutations
    const createSubCategoryMutation = useCreateAssetSubCategory();
    const updateSubCategoryMutation = useUpdateAssetSubCategory();
    const deleteSubCategoryMutation = useDeleteAssetSubCategory();

    // Type mutations
    const createTypeMutation = useCreateAssetType();
    const updateTypeMutation = useUpdateAssetType();
    const deleteTypeMutation = useDeleteAssetType();

    const hasFilters = assetClass || criticality || operationalStatus || maintenanceStatus || locationId;

    const clearFilters = () => {
        setSearch("");
        setAssetClass("");
        setCriticality("");
        setOperationalStatus("");
        setMaintenanceStatus("");
        setLocationId("");
        setPage(1);
    };

    const openAdd = () => {
        setEditingAsset(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (asset: any) => {
        setEditingAsset(asset);
        setForm({
            name: asset.name || "",
            assetClass: asset.assetClass || "MACHINE",
            categoryId: asset.categoryId || "",
            subCategoryId: asset.subCategoryId || "",
            typeId: asset.typeId || "",
            ownership: asset.ownership || "OWNED",
            criticality: asset.criticality || "MEDIUM",
            isBottleneck: asset.isBottleneck || false,
            locationId: asset.locationId || "",
            departmentId: asset.departmentId || "",
            floorZone: asset.floorZone || "",
            manufacturer: asset.manufacturer || "",
            brand: asset.brand || "",
            modelNumber: asset.modelNumber || "",
            serialNumber: asset.serialNumber || "",
            commissioningDate: asset.commissioningDate ? asset.commissioningDate.split("T")[0] : "",
            condition: asset.condition || "",
            ratedCapacity: asset.ratedCapacity || "",
            designLifeYears: asset.designLifeYears ?? "",
            failureCodeSetId: asset.failureCodeSetId || "",
            permitRequired: asset.permitRequired || false,
            ptwClass: asset.ptwClass || "",
            warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split("T")[0] : "",
            insuranceExpiry: asset.insuranceExpiry ? asset.insuranceExpiry.split("T")[0] : "",
            registrationExpiry: asset.registrationExpiry ? asset.registrationExpiry.split("T")[0] : "",
            fitnessExpiry: asset.fitnessExpiry ? asset.fitnessExpiry.split("T")[0] : "",
            purchaseCost: asset.purchaseCost ?? "",
            currentBookValue: asset.currentBookValue ?? "",
            replacementValue: asset.replacementValue ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload: Record<string, any> = { ...form };
        // Clean empty strings to undefined
        for (const key of Object.keys(payload)) {
            if (payload[key] === "") {
                delete payload[key];
            }
        }
        // Convert numeric fields
        if (payload.designLifeYears) payload.designLifeYears = Number(payload.designLifeYears);
        if (payload.purchaseCost) payload.purchaseCost = Number(payload.purchaseCost);
        if (payload.currentBookValue) payload.currentBookValue = Number(payload.currentBookValue);
        if (payload.replacementValue) payload.replacementValue = Number(payload.replacementValue);

        try {
            if (editingAsset) {
                await updateMutation.mutateAsync({ id: editingAsset.id, data: payload });
                showSuccess("Asset Updated", "Asset has been updated successfully.");
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Asset Created", "New asset has been added to the register.");
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            showSuccess("Asset Deleted", "Asset has been removed from the register.");
            setDeleteConfirmId(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSync = async () => {
        try {
            await syncMutation.mutateAsync();
            showSuccess("Sync Complete", "Machines have been synchronized to asset register.");
        } catch (err) {
            showApiError(err);
        }
    };

    const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Asset Register</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage all maintenance assets, equipment, and facilities</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncMutation.isPending}
                        className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                        Sync Machines
                    </button>
                    <button
                        onClick={() => setManageCategoryOpen(true)}
                        className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                        <Settings2 className="w-4 h-4" />
                        Manage
                    </button>
                    {canCreate && (
                        <button
                            onClick={openAdd}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            <Plus className="w-5 h-5" />
                            Add Asset
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, code, serial number..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <select
                        value={assetClass}
                        onChange={(e) => { setAssetClass(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {ASSET_CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                        value={criticality}
                        onChange={(e) => { setCriticality(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {CRITICALITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-2.5 rounded-xl border transition-colors",
                            showFilters || hasFilters
                                ? "bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
                                : "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <Filter size={16} />
                    </button>
                    {hasFilters && (
                        <button onClick={clearFilters} className="text-xs font-bold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Operational Status</label>
                            <select
                                value={operationalStatus}
                                onChange={(e) => { setOperationalStatus(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {OPERATIONAL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Maintenance Status</label>
                            <select
                                value={maintenanceStatus}
                                onChange={(e) => { setMaintenanceStatus(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                {MAINTENANCE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Location</label>
                            <select
                                value={locationId}
                                onChange={(e) => { setLocationId(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="">All Locations</option>
                                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load assets. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={8} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Asset Number</th>
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Class</th>
                                    <th className="py-4 px-6 font-bold">Criticality</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Location</th>
                                    <th className="py-4 px-6 font-bold">Category</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {assets.map((a: any) => (
                                    <tr
                                        key={a.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                                {a.assetNumber}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-primary-950 dark:text-white block">{a.name}</span>
                                                {a.serialNumber && <span className="text-[10px] text-neutral-400">SN: {a.serialNumber}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                {(a.assetClass || "").replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <CriticalityBadge criticality={a.criticality} />
                                        </td>
                                        <td className="py-4 px-6">
                                            <AssetStatusBadge operationalStatus={a.operationalStatus} maintenanceStatus={a.maintenanceStatus} />
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {a.location?.name || "---"}
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {a.category?.name || "---"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={`/app/maintenance/assets/${a.id}`}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={15} />
                                                </a>
                                                {canCreate && (
                                                    <button
                                                        onClick={() => openEdit(a)}
                                                        className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    deleteConfirmId === a.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(a.id)}
                                                                disabled={deleteMutation.isPending}
                                                                className="px-2 py-1 text-xs font-bold rounded-lg bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="px-2 py-1 text-xs font-bold rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(a.id)}
                                                            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {assets.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No assets found" message="Add a new asset or adjust your filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            Page {meta.page} of {meta.totalPages} ({meta.total} total)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Asset Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
                    <div
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                {editingAsset ? "Edit Asset" : "Add New Asset"}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                            {/* Identity */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Identity</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormInput label="Name" required value={form.name} onChange={(v) => setField("name", v)} placeholder="Asset name" />
                                    <FormSelect label="Asset Class" required value={form.assetClass} onChange={(v) => setField("assetClass", v)} options={ASSET_CLASS_OPTIONS.filter((o) => o.value)} />
                                    <FormInput label="Serial Number" value={form.serialNumber} onChange={(v) => setField("serialNumber", v)} placeholder="Serial number" />
                                </div>
                            </fieldset>

                            {/* Classification */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Classification</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FormSelect
                                        label="Category"
                                        value={form.categoryId}
                                        onChange={(v) => { setField("categoryId", v); setField("subCategoryId", ""); }}
                                        options={[{ value: "", label: "Select..." }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]}
                                    />
                                    <FormSelect
                                        label="Sub-Category"
                                        value={form.subCategoryId}
                                        onChange={(v) => setField("subCategoryId", v)}
                                        options={[{ value: "", label: "Select..." }, ...subCategories.map((c: any) => ({ value: c.id, label: c.name }))]}
                                    />
                                    <FormSelect
                                        label="Type"
                                        value={form.typeId}
                                        onChange={(v) => setField("typeId", v)}
                                        options={[{ value: "", label: "Select..." }, ...types.map((t: any) => ({ value: t.id, label: t.name }))]}
                                    />
                                    <FormSelect label="Ownership" value={form.ownership} onChange={(v) => setField("ownership", v)} options={OWNERSHIP_OPTIONS} />
                                    <FormSelect label="Criticality" value={form.criticality} onChange={(v) => setField("criticality", v)} options={CRITICALITY_OPTIONS.filter((o) => o.value)} />
                                    <FormCheckbox label="Is Bottleneck" checked={form.isBottleneck} onChange={(v) => setField("isBottleneck", v)} />
                                </div>
                            </fieldset>

                            {/* Location */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Location</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormSelect
                                        label="Location"
                                        value={form.locationId}
                                        onChange={(v) => setField("locationId", v)}
                                        options={[{ value: "", label: "Select..." }, ...locations.map((l: any) => ({ value: l.id, label: l.name }))]}
                                    />
                                    <FormInput label="Floor / Zone" value={form.floorZone} onChange={(v) => setField("floorZone", v)} placeholder="e.g. Floor 2, Zone A" />
                                </div>
                            </fieldset>

                            {/* Technical */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Technical</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FormInput label="Manufacturer" value={form.manufacturer} onChange={(v) => setField("manufacturer", v)} placeholder="Manufacturer" />
                                    <FormInput label="Brand" value={form.brand} onChange={(v) => setField("brand", v)} placeholder="Brand" />
                                    <FormInput label="Model Number" value={form.modelNumber} onChange={(v) => setField("modelNumber", v)} placeholder="Model number" />
                                    <FormInput label="Commissioning Date" value={form.commissioningDate} onChange={(v) => setField("commissioningDate", v)} type="date" />
                                    <FormInput label="Condition" value={form.condition} onChange={(v) => setField("condition", v)} placeholder="e.g. Good, Fair" />
                                    <FormInput label="Rated Capacity" value={form.ratedCapacity} onChange={(v) => setField("ratedCapacity", v)} placeholder="e.g. 500 kg/hr" />
                                    <FormInput label="Design Life (Years)" value={form.designLifeYears} onChange={(v) => setField("designLifeYears", v)} type="number" />
                                </div>
                            </fieldset>

                            {/* Compliance */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Compliance</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormCheckbox label="Permit Required" checked={form.permitRequired} onChange={(v) => setField("permitRequired", v)} />
                                    <FormSelect label="PTW Class" value={form.ptwClass} onChange={(v) => setField("ptwClass", v)} options={PTW_CLASS_OPTIONS} />
                                    <FormInput label="Warranty Expiry" value={form.warrantyExpiry} onChange={(v) => setField("warrantyExpiry", v)} type="date" />
                                    <FormInput label="Insurance Expiry" value={form.insuranceExpiry} onChange={(v) => setField("insuranceExpiry", v)} type="date" />
                                    <FormInput label="Registration Expiry" value={form.registrationExpiry} onChange={(v) => setField("registrationExpiry", v)} type="date" />
                                    <FormInput label="Fitness Expiry" value={form.fitnessExpiry} onChange={(v) => setField("fitnessExpiry", v)} type="date" />
                                </div>
                            </fieldset>

                            {/* Financial */}
                            <fieldset>
                                <legend className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Financial</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FormInput label="Purchase Cost" value={form.purchaseCost} onChange={(v) => setField("purchaseCost", v)} type="number" placeholder="0.00" />
                                    <FormInput label="Current Book Value" value={form.currentBookValue} onChange={(v) => setField("currentBookValue", v)} type="number" placeholder="0.00" />
                                    <FormInput label="Replacement Value" value={form.replacementValue} onChange={(v) => setField("replacementValue", v)} type="number" placeholder="0.00" />
                                </div>
                            </fieldset>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !form.name}
                                className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                {editingAsset ? "Update Asset" : "Create Asset"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Category Modal */}
            <ManageModal
                open={manageCategoryOpen}
                onClose={() => setManageCategoryOpen(false)}
                title="Manage Categories"
                items={categories.map((c: any) => ({ id: c.id, name: c.name, code: c.code }))}
                isLoading={categoriesQuery.isLoading}
                createFields={[{ key: "name", label: "Category Name", placeholder: "e.g. Rotating Equipment", required: true }]}
                onCreate={async (vals) => { await createCategoryMutation.mutateAsync({ name: vals.name }); }}
                onUpdate={async (id, vals) => { await updateCategoryMutation.mutateAsync({ id, data: { name: vals.name } }); }}
                onDelete={async (id) => { await deleteCategoryMutation.mutateAsync(id); }}
                isCreating={createCategoryMutation.isPending}
                isUpdating={updateCategoryMutation.isPending}
                isDeleting={deleteCategoryMutation.isPending}
            />

            {/* Manage Sub-Category Modal */}
            <ManageModal
                open={manageSubCategoryOpen}
                onClose={() => setManageSubCategoryOpen(false)}
                title="Manage Sub-Categories"
                items={subCategories.map((c: any) => ({ id: c.id, name: c.name, code: c.code }))}
                isLoading={subCategoriesQuery.isLoading}
                createFields={[
                    { key: "name", label: "Sub-Category Name", placeholder: "e.g. Pumps", required: true },
                ]}
                onCreate={async (vals) => { await createSubCategoryMutation.mutateAsync({ name: vals.name }); }}
                onUpdate={async (id, vals) => { await updateSubCategoryMutation.mutateAsync({ id, data: { name: vals.name } }); }}
                onDelete={async (id) => { await deleteSubCategoryMutation.mutateAsync(id); }}
                isCreating={createSubCategoryMutation.isPending}
                isUpdating={updateSubCategoryMutation.isPending}
                isDeleting={deleteSubCategoryMutation.isPending}
            />

            {/* Manage Types Modal */}
            <ManageModal
                open={manageTypeOpen}
                onClose={() => setManageTypeOpen(false)}
                title="Manage Asset Types"
                items={types.map((t: any) => ({ id: t.id, name: t.name, code: t.code }))}
                isLoading={typesQuery.isLoading}
                createFields={[{ key: "name", label: "Type Name", placeholder: "e.g. Centrifugal Pump", required: true }]}
                onCreate={async (vals) => { await createTypeMutation.mutateAsync({ name: vals.name }); }}
                onUpdate={async (id, vals) => { await updateTypeMutation.mutateAsync({ id, data: { name: vals.name } }); }}
                onDelete={async (id) => { await deleteTypeMutation.mutateAsync(id); }}
                isCreating={createTypeMutation.isPending}
                isUpdating={updateTypeMutation.isPending}
                isDeleting={deleteTypeMutation.isPending}
            />

            {/* Manage Dropdown Picker (shown from Manage button) */}
            {manageCategoryOpen || manageSubCategoryOpen || manageTypeOpen ? null : (
                /* This is invisible — the Manage button opens a picker first */
                null
            )}
        </div>
    );
}

/* ── Form Helpers ── */

function FormInput({ label, value, onChange, placeholder, type = "text", required }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function FormSelect({ label, value, onChange, options, required }: {
    label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function FormCheckbox({ label, checked, onChange }: {
    label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-2 pt-5">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
            />
            <label className="text-sm text-neutral-700 dark:text-neutral-300">{label}</label>
        </div>
    );
}
