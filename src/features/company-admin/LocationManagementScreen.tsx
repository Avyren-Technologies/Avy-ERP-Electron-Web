import { useState } from "react";
import {
    MapPin,
    Star,
    Edit3,
    Trash2,
    Loader2,
    X,
    CheckCircle2,
    XCircle,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useUpdateLocation, useDeleteLocation } from "@/features/company-admin/api/use-company-admin-mutations";
import { GeofenceManager } from "@/features/company-admin/settings/GeofenceManager";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Active: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        Inactive: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border", styles[status] ?? styles.Active)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status === "Active" ? "bg-success-500" : "bg-danger-500")} />
            {status}
        </span>
    );
}

function FormField({ label, value, onChange, placeholder, mono = false, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                    mono && "font-mono"
                )}
            />
        </div>
    );
}

export function LocationManagementScreen() {
    const { data, isLoading, isError } = useCompanyLocations();
    const updateMutation = useUpdateLocation();
    const deleteMutation = useDeleteLocation();

    const [search, setSearch] = useState("");
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [editForm, setEditForm] = useState<Record<string, any>>({});
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const locations: any[] = data?.data ?? [];
    const filtered = locations.filter((loc: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            loc.name?.toLowerCase().includes(s) ||
            loc.code?.toLowerCase().includes(s) ||
            loc.city?.toLowerCase().includes(s) ||
            loc.facilityType?.toLowerCase().includes(s)
        );
    });

    const openEdit = (loc: any) => {
        setEditingLocation(loc);
        setEditForm({
            name: loc.name ?? "",
            code: loc.code ?? "",
            facilityType: loc.facilityType ?? "",
            status: loc.status ?? "Active",
            city: loc.city ?? "",
            state: loc.state ?? "",
            pin: loc.pin ?? "",
            gstin: loc.gstin ?? "",
            contactName: loc.contactName ?? "",
            contactEmail: loc.contactEmail ?? "",
            contactPhone: loc.contactPhone ?? "",
        });
    };

    const handleSave = async () => {
        if (!editingLocation) return;
        try {
            await updateMutation.mutateAsync({ id: editingLocation.id, data: editForm });
            showSuccess("Location Updated", `${editForm.name} has been updated.`);
            setEditingLocation(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Location Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const updateField = (key: string, value: any) => setEditForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header — NO Add button */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Locations</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your company plants and branches</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {/* Error State */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load locations. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Facility Type</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">City / State</th>
                                    <th className="py-4 px-6 font-bold text-center">HQ</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((loc: any) => (
                                    <tr key={loc.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                                                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{loc.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300">{loc.code}</span>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">{loc.facilityType}</td>
                                        <td className="py-4 px-6"><StatusBadge status={loc.status ?? "Active"} /></td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                            {[loc.city, loc.state].filter(Boolean).join(", ") || "—"}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {loc.isHQ ? (
                                                <Star size={16} className="text-warning-500 fill-warning-400 inline" />
                                            ) : (
                                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(loc)}
                                                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                {!loc.isHQ && (
                                                    <button
                                                        onClick={() => setDeleteTarget(loc)}
                                                        className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="search" title="No locations found" message="Try adjusting your search." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Edit Modal ── */}
            {editingLocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Edit Location</h2>
                            <button onClick={() => setEditingLocation(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Name" value={editForm.name} onChange={(v) => updateField("name", v)} />
                                <FormField label="Code" value={editForm.code} onChange={(v) => updateField("code", v)} mono />
                            </div>
                            <FormField label="Facility Type" value={editForm.facilityType} onChange={(v) => updateField("facilityType", v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="City" value={editForm.city} onChange={(v) => updateField("city", v)} />
                                <FormField label="State" value={editForm.state} onChange={(v) => updateField("state", v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="PIN Code" value={editForm.pin} onChange={(v) => updateField("pin", v)} mono />
                                <FormField label="GSTIN" value={editForm.gstin} onChange={(v) => updateField("gstin", v)} mono />
                            </div>
                            <FormField label="Contact Name" value={editForm.contactName} onChange={(v) => updateField("contactName", v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Contact Email" value={editForm.contactEmail} onChange={(v) => updateField("contactEmail", v)} />
                                <FormField label="Contact Phone" value={editForm.contactPhone} onChange={(v) => updateField("contactPhone", v)} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => updateField("status", e.target.value)}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* ── Geofence Manager ── */}
                            <div className="mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-6">
                                <GeofenceManager
                                    locationId={editingLocation.id}
                                    companyId={editingLocation.companyId}
                                    locationLat={editingLocation.geoLat}
                                    locationLng={editingLocation.geoLng}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setEditingLocation(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Location?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
