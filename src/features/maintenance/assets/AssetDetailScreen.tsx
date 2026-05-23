import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Edit3,
    Loader2,
    X,
    Plus,
    ArrowRightLeft,
    Archive,
    Gauge,
    History,
    FileText,
    DollarSign,
    LayoutDashboard,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAsset, useAssetHistory, useAssetMeters, useMeterReadings } from "@/features/maintenance/api/use-maintenance-queries";
import { useUpdateAsset, useDeleteAsset, useTransferAsset, useAddMeter, useLogReading } from "@/features/maintenance/api/use-maintenance-mutations";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { useCanPerform } from "@/hooks/useCanPerform";
import { AssetStatusBadge } from "@/features/maintenance/shared/AssetStatusBadge";
import { CriticalityBadge } from "@/features/maintenance/shared/CriticalityBadge";
import { showSuccess, showApiError } from "@/lib/toast";

const TABS = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "meters", label: "Meters", icon: Gauge },
    { key: "history", label: "History", icon: History },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "cost", label: "Cost", icon: DollarSign },
] as const;

type TabKey = typeof TABS[number]["key"];

/* ── Screen ── */

export function AssetDetailScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();
    const canEdit = useCanPerform("maintenance.assets:update");
    const canDelete = useCanPerform("maintenance.assets:delete");

    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [meterModalOpen, setMeterModalOpen] = useState(false);
    const [readingModalOpen, setReadingModalOpen] = useState(false);
    const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

    // Transfer form
    const [transferForm, setTransferForm] = useState({ newLocationId: "", reason: "" });

    // Meter form
    const [meterForm, setMeterForm] = useState({ name: "", unit: "", readingType: "CUMULATIVE" });

    // Reading form
    const [readingForm, setReadingForm] = useState({ value: "", readingDate: "", notes: "" });

    // Queries
    const { data: assetData, isLoading, isError } = useAsset(id!);
    const { data: historyData } = useAssetHistory(id!);
    const { data: metersData } = useAssetMeters(id!);
    const { data: readingsData } = useMeterReadings(id!, selectedMeterId || "");
    const locationsQuery = useCompanyLocations();

    const asset: any = assetData?.data ?? null;
    const history: any[] = historyData?.data ?? [];
    const meters: any[] = metersData?.data ?? [];
    const readings: any[] = readingsData?.data ?? [];
    const locations: any[] = locationsQuery.data?.data ?? [];

    // Mutations
    const transferMutation = useTransferAsset();
    const deleteMutation = useDeleteAsset();
    const addMeterMutation = useAddMeter();
    const logReadingMutation = useLogReading();

    const handleTransfer = async () => {
        if (!transferForm.newLocationId) return;
        try {
            await transferMutation.mutateAsync({ id: id!, data: transferForm });
            showSuccess("Asset Transferred", "Asset has been transferred to the new location.");
            setTransferModalOpen(false);
            setTransferForm({ newLocationId: "", reason: "" });
        } catch (err) {
            showApiError(err);
        }
    };

    const handleRetire = async () => {
        try {
            await deleteMutation.mutateAsync(id!);
            showSuccess("Asset Retired", "Asset has been soft-deleted (retired).");
            navigate("/app/maintenance/assets");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleAddMeter = async () => {
        if (!meterForm.name || !meterForm.unit) return;
        try {
            await addMeterMutation.mutateAsync({ assetId: id!, data: meterForm });
            showSuccess("Meter Added", "New meter has been added to this asset.");
            setMeterModalOpen(false);
            setMeterForm({ name: "", unit: "", readingType: "CUMULATIVE" });
        } catch (err) {
            showApiError(err);
        }
    };

    const handleLogReading = async () => {
        if (!readingForm.value || !selectedMeterId) return;
        try {
            await logReadingMutation.mutateAsync({
                assetId: id!,
                meterId: selectedMeterId,
                data: { value: Number(readingForm.value), readingDate: readingForm.readingDate || undefined, notes: readingForm.notes || undefined },
            });
            showSuccess("Reading Logged", "Meter reading has been recorded.");
            setReadingModalOpen(false);
            setReadingForm({ value: "", readingDate: "", notes: "" });
        } catch (err) {
            showApiError(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    if (isError || !asset) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-neutral-500 dark:text-neutral-400">Asset not found.</p>
                <button onClick={() => navigate("/app/maintenance/assets")} className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">
                    Back to Asset Register
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/app/maintenance/assets")}
                        className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">
                                {asset.assetNumber}
                            </span>
                            <AssetStatusBadge operationalStatus={asset.operationalStatus} maintenanceStatus={asset.maintenanceStatus} />
                            <CriticalityBadge criticality={asset.criticality} />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">{asset.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button
                            onClick={() => setTransferModalOpen(true)}
                            className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Transfer
                        </button>
                    )}
                    {canEdit && (
                        <a
                            href={`/app/maintenance/assets`}
                            onClick={(e) => { e.preventDefault(); navigate("/app/maintenance/assets"); }}
                            className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </a>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleRetire}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-2 border border-danger-200 dark:border-danger-800/50 text-danger-700 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                            <Archive className="w-4 h-4" />
                            Retire
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === tab.key
                                ? "bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                {activeTab === "overview" && <OverviewTab asset={asset} fmt={fmt} />}
                {activeTab === "meters" && (
                    <MetersTab
                        meters={meters}
                        readings={readings}
                        selectedMeterId={selectedMeterId}
                        onSelectMeter={setSelectedMeterId}
                        onAddMeter={() => setMeterModalOpen(true)}
                        onLogReading={(meterId) => { setSelectedMeterId(meterId); setReadingModalOpen(true); }}
                        canEdit={canEdit}
                        fmt={fmt}
                    />
                )}
                {activeTab === "history" && <HistoryTab history={history} fmt={fmt} />}
                {activeTab === "documents" && <DocumentsTab />}
                {activeTab === "cost" && <CostTab asset={asset} />}
            </div>

            {/* Transfer Modal */}
            {transferModalOpen && (
                <SimpleModal title="Transfer Asset" onClose={() => setTransferModalOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">New Location <span className="text-red-500">*</span></label>
                            <select
                                value={transferForm.newLocationId}
                                onChange={(e) => setTransferForm((p) => ({ ...p, newLocationId: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="">Select location...</option>
                                {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reason</label>
                            <textarea
                                value={transferForm.reason}
                                onChange={(e) => setTransferForm((p) => ({ ...p, reason: e.target.value }))}
                                placeholder="Reason for transfer..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setTransferModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleTransfer}
                                disabled={transferMutation.isPending || !transferForm.newLocationId}
                                className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {transferMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Transfer
                            </button>
                        </div>
                    </div>
                </SimpleModal>
            )}

            {/* Add Meter Modal */}
            {meterModalOpen && (
                <SimpleModal title="Add Meter" onClose={() => setMeterModalOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Meter Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={meterForm.name}
                                onChange={(e) => setMeterForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Runtime Hours"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Unit <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={meterForm.unit}
                                onChange={(e) => setMeterForm((p) => ({ ...p, unit: e.target.value }))}
                                placeholder="e.g. hours, km, cycles"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reading Type</label>
                            <select
                                value={meterForm.readingType}
                                onChange={(e) => setMeterForm((p) => ({ ...p, readingType: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            >
                                <option value="CUMULATIVE">Cumulative</option>
                                <option value="GAUGE">Gauge</option>
                                <option value="CHARACTERISTIC">Characteristic</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setMeterModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleAddMeter}
                                disabled={addMeterMutation.isPending || !meterForm.name || !meterForm.unit}
                                className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {addMeterMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Add Meter
                            </button>
                        </div>
                    </div>
                </SimpleModal>
            )}

            {/* Log Reading Modal */}
            {readingModalOpen && (
                <SimpleModal title="Log Meter Reading" onClose={() => setReadingModalOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Value <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={readingForm.value}
                                onChange={(e) => setReadingForm((p) => ({ ...p, value: e.target.value }))}
                                placeholder="Enter reading value"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Reading Date</label>
                            <input
                                type="date"
                                value={readingForm.readingDate}
                                onChange={(e) => setReadingForm((p) => ({ ...p, readingDate: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Notes</label>
                            <textarea
                                value={readingForm.notes}
                                onChange={(e) => setReadingForm((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="Optional notes..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setReadingModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleLogReading}
                                disabled={logReadingMutation.isPending || !readingForm.value}
                                className="px-6 py-2 text-sm font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {logReadingMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Log Reading
                            </button>
                        </div>
                    </div>
                </SimpleModal>
            )}
        </div>
    );
}

/* ── Overview Tab ── */

function OverviewTab({ asset, fmt }: { asset: any; fmt: any }) {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Identity Card */}
                <InfoCard title="Identity">
                    <InfoRow label="Asset Number" value={asset.assetNumber} />
                    <InfoRow label="Name" value={asset.name} />
                    <InfoRow label="Asset Code" value={asset.assetCode} />
                    <InfoRow label="Serial Number" value={asset.serialNumber} />
                    <InfoRow label="Class" value={(asset.assetClass || "").replace(/_/g, " ")} />
                </InfoCard>

                {/* Classification Card */}
                <InfoCard title="Classification">
                    <InfoRow label="Category" value={asset.category?.name} />
                    <InfoRow label="Sub-Category" value={asset.subCategory?.name} />
                    <InfoRow label="Type" value={asset.type?.name} />
                    <InfoRow label="Ownership" value={(asset.ownership || "").replace(/_/g, " ")} />
                    <InfoRow label="Bottleneck" value={asset.isBottleneck ? "Yes" : "No"} />
                </InfoCard>

                {/* Location Card */}
                <InfoCard title="Location">
                    <InfoRow label="Location" value={asset.location?.name} />
                    <InfoRow label="Department" value={asset.department?.name} />
                    <InfoRow label="Floor / Zone" value={asset.floorZone} />
                </InfoCard>

                {/* Technical Card */}
                <InfoCard title="Technical">
                    <InfoRow label="Manufacturer" value={asset.manufacturer} />
                    <InfoRow label="Brand" value={asset.brand} />
                    <InfoRow label="Model" value={asset.modelNumber} />
                    <InfoRow label="Condition" value={asset.condition} />
                    <InfoRow label="Rated Capacity" value={asset.ratedCapacity} />
                    <InfoRow label="Design Life" value={asset.designLifeYears ? `${asset.designLifeYears} years` : null} />
                    <InfoRow label="Commissioned" value={asset.commissioningDate ? fmt.date(asset.commissioningDate) : null} />
                </InfoCard>

                {/* Compliance Card */}
                <InfoCard title="Compliance">
                    <InfoRow label="Permit Required" value={asset.permitRequired ? "Yes" : "No"} />
                    <InfoRow label="PTW Class" value={asset.ptwClass ? (asset.ptwClass as string).replace(/_/g, " ") : null} />
                    <InfoRow label="Warranty Expiry" value={asset.warrantyExpiry ? fmt.date(asset.warrantyExpiry) : null} />
                    <InfoRow label="Insurance Expiry" value={asset.insuranceExpiry ? fmt.date(asset.insuranceExpiry) : null} />
                    <InfoRow label="Registration Expiry" value={asset.registrationExpiry ? fmt.date(asset.registrationExpiry) : null} />
                    <InfoRow label="Fitness Expiry" value={asset.fitnessExpiry ? fmt.date(asset.fitnessExpiry) : null} />
                </InfoCard>

                {/* Financial Card */}
                <InfoCard title="Financial">
                    <InfoRow label="Purchase Cost" value={asset.purchaseCost ? `${Number(asset.purchaseCost).toLocaleString()}` : null} />
                    <InfoRow label="Book Value" value={asset.currentBookValue ? `${Number(asset.currentBookValue).toLocaleString()}` : null} />
                    <InfoRow label="Replacement Value" value={asset.replacementValue ? `${Number(asset.replacementValue).toLocaleString()}` : null} />
                    <InfoRow label="Accumulated Maint. Cost" value={`${Number(asset.accumulatedMaintCost || 0).toLocaleString()}`} />
                </InfoCard>
            </div>
        </div>
    );
}

/* ── Meters Tab ── */

function MetersTab({ meters, readings, selectedMeterId, onSelectMeter, onAddMeter, onLogReading, canEdit, fmt }: {
    meters: any[]; readings: any[]; selectedMeterId: string | null;
    onSelectMeter: (id: string | null) => void; onAddMeter: () => void; onLogReading: (meterId: string) => void;
    canEdit: boolean; fmt: any;
}) {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Asset Meters</h3>
                {canEdit && (
                    <button
                        onClick={onAddMeter}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                    >
                        <Plus size={16} />
                        Add Meter
                    </button>
                )}
            </div>

            {meters.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                    <Gauge size={40} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No meters configured for this asset.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meters.map((m: any) => (
                        <div
                            key={m.id}
                            className={cn(
                                "rounded-xl border p-4 cursor-pointer transition-all",
                                selectedMeterId === m.id
                                    ? "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10"
                                    : "border-neutral-200 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800"
                            )}
                            onClick={() => onSelectMeter(m.id)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-neutral-900 dark:text-white">{m.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                    {m.unit}
                                </span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-neutral-400 mb-0.5">Current Value</p>
                                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">
                                        {m.currentValue != null ? Number(m.currentValue).toLocaleString() : "---"}
                                    </p>
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onLogReading(m.id); }}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 transition-colors"
                                    >
                                        <TrendingUp size={12} />
                                        Log
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-2">
                                Type: {(m.readingType || "").replace(/_/g, " ")}
                                {m.lastReadingDate && ` | Last: ${fmt.date(m.lastReadingDate)}`}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Reading History */}
            {selectedMeterId && readings.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">Reading History</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-3 px-4 font-bold">Date</th>
                                    <th className="py-3 px-4 font-bold">Value</th>
                                    <th className="py-3 px-4 font-bold">Delta</th>
                                    <th className="py-3 px-4 font-bold">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {readings.map((r: any, idx: number) => (
                                    <tr key={r.id || idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs">{r.readingDate ? fmt.date(r.readingDate) : fmt.date(r.createdAt)}</td>
                                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{Number(r.value).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">{r.delta != null ? `+${Number(r.delta).toLocaleString()}` : "---"}</td>
                                        <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs">{r.notes || "---"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── History Tab ── */

function HistoryTab({ history, fmt }: { history: any[]; fmt: any }) {
    return (
        <div className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Maintenance History</h3>
            {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                    <History size={40} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No history records yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((event: any, idx: number) => (
                        <div key={event.id || idx} className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                        {(event.eventType || event.type || "Event").replace(/_/g, " ")}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">{fmt.dateTime(event.createdAt || event.eventDate)}</span>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{event.description || event.notes || "---"}</p>
                                {event.performedBy && (
                                    <p className="text-[10px] text-neutral-400 mt-1">By: {event.performedBy}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Documents Tab ── */

function DocumentsTab() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Documents</h3>
                <button
                    disabled
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm opacity-50 cursor-not-allowed"
                >
                    <Plus size={16} />
                    Upload Document
                </button>
            </div>
            <div className="text-center py-12 text-neutral-400">
                <FileText size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Document management coming soon.</p>
                <p className="text-xs text-neutral-400 mt-1">Attach manuals, drawings, warranty documents, and compliance certificates.</p>
            </div>
        </div>
    );
}

/* ── Cost Tab ── */

function CostTab({ asset }: { asset: any }) {
    return (
        <div className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Cost Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CostCard label="Purchase Cost" value={asset.purchaseCost} />
                <CostCard label="Book Value" value={asset.currentBookValue} />
                <CostCard label="Replacement Value" value={asset.replacementValue} />
                <CostCard label="Accumulated Maint. Cost" value={asset.accumulatedMaintCost} highlight />
            </div>
            <div className="text-center py-8 text-neutral-400">
                <DollarSign size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Detailed cost transaction history coming soon.</p>
            </div>
        </div>
    );
}

/* ── Helpers ── */

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{title}</h4>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">{value || "---"}</span>
        </div>
    );
}

function CostCard({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
    const numValue = value != null ? Number(value) : 0;
    return (
        <div className={cn(
            "rounded-xl border p-4",
            highlight
                ? "border-primary-200 dark:border-primary-800/50 bg-primary-50/50 dark:bg-primary-900/10"
                : "border-neutral-200 dark:border-neutral-800"
        )}>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
            <p className={cn("text-xl font-bold", highlight ? "text-primary-700 dark:text-primary-400" : "text-neutral-900 dark:text-white")}>
                {numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
    );
}

function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
}
