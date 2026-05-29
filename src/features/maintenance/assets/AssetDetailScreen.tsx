import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useAuthStore, getDisplayName } from "@/store/useAuthStore";
import { platformUsersApi } from "@/lib/api/platform-users";
import { HelpDrawer } from "@/components/ui/HelpDrawer";
import { assetDetailHelp } from "@/features/maintenance/help";

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
    const currentUser = useAuthStore((s) => s.user);

    const [activeTab, setActiveTab] = useState<TabKey>("overview");
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [meterModalOpen, setMeterModalOpen] = useState(false);
    const [readingModalOpen, setReadingModalOpen] = useState(false);
    const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

    // Transfer form
    const [transferForm, setTransferForm] = useState({ newLocationId: "", reason: "" });

    // Meter form
    const [meterForm, setMeterForm] = useState({ label: "", unit: "", meterType: "RUNTIME_HOURS", isCumulative: true, currentValue: 0 });

    // Reading form
    const [readingForm, setReadingForm] = useState({ value: "", isReset: false });

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
        if (!meterForm.label || !meterForm.unit) return;
        try {
            await addMeterMutation.mutateAsync({
                assetId: id!,
                data: {
                    label: meterForm.label,
                    unit: meterForm.unit,
                    meterType: meterForm.meterType,
                    isCumulative: meterForm.isCumulative,
                    currentValue: Number(meterForm.currentValue || 0),
                }
            });
            showSuccess("Meter Added", "New meter has been added to this asset.");
            setMeterModalOpen(false);
            setMeterForm({ label: "", unit: "", meterType: "RUNTIME_HOURS", isCumulative: true, currentValue: 0 });
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
                data: { value: Number(readingForm.value), isReset: readingForm.isReset },
            });
            showSuccess("Reading Logged", "Meter reading has been recorded.");
            setReadingModalOpen(false);
            setReadingForm({ value: "", isReset: false });
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-primary-950 dark:text-white tracking-tight">{asset.name}</h1>
                            <HelpDrawer help={assetDetailHelp} />
                        </div>
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
                {activeTab === "overview" && <OverviewTab asset={asset} fmt={fmt} locations={locations} />}
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
                {activeTab === "history" && <HistoryTab history={history} fmt={fmt} currentUser={currentUser} />}
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
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Meter Label <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={meterForm.label}
                                onChange={(e) => setMeterForm((p) => ({ ...p, label: e.target.value }))}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Meter Type</label>
                                <select
                                    value={meterForm.meterType}
                                    onChange={(e) => setMeterForm((p) => ({ ...p, meterType: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="RUNTIME_HOURS">Runtime Hours</option>
                                    <option value="CYCLE_COUNT">Cycle Count</option>
                                    <option value="MILEAGE">Mileage</option>
                                    <option value="OUTPUT_UNITS">Output Units</option>
                                    <option value="ENERGY_KWH">Energy (kWh)</option>
                                    <option value="TEMPERATURE">Temperature</option>
                                    <option value="PRESSURE">Pressure</option>
                                    <option value="VIBRATION">Vibration</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Behavior</label>
                                <select
                                    value={meterForm.isCumulative ? "true" : "false"}
                                    onChange={(e) => setMeterForm((p) => ({ ...p, isCumulative: e.target.value === "true" }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="true">Cumulative (Increases)</option>
                                    <option value="false">Gauge (Fluctuates)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Initial Value</label>
                            <input
                                type="number"
                                value={meterForm.currentValue}
                                onChange={(e) => setMeterForm((p) => ({ ...p, currentValue: Number(e.target.value || 0) }))}
                                placeholder="0"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setMeterModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleAddMeter}
                                disabled={addMeterMutation.isPending || !meterForm.label || !meterForm.unit}
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
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/50">
                            <input
                                type="checkbox"
                                id="isResetCheck"
                                checked={readingForm.isReset}
                                onChange={(e) => setReadingForm((p) => ({ ...p, isReset: e.target.checked }))}
                                className="mt-0.5 w-4 h-4 rounded accent-warning-500 cursor-pointer shrink-0"
                            />
                            <div>
                                <label htmlFor="isResetCheck" className="block text-xs font-bold text-warning-700 dark:text-warning-400 cursor-pointer">
                                    Meter reset / replacement
                                </label>
                                <p className="text-[11px] text-warning-600 dark:text-warning-500 mt-0.5">
                                    Check this if the meter was reset or replaced. Allows the reading value to be lower than the current value.
                                </p>
                            </div>
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

function OverviewTab({ asset, fmt, locations }: { asset: any; fmt: any; locations: any[] }) {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Identity Card */}
                <InfoCard title="Identity">
                    <InfoRow label="Asset Number" value={asset.assetNumber} />
                    <InfoRow label="Name" value={asset.name} />
                    <InfoRow label="Asset Code" value={asset.assetCode || asset.assetNumber} />
                    <InfoRow label="Serial Number" value={asset.serialNumber} />
                    <InfoRow label="Class" value={(asset.assetClass || "").replace(/_/g, " ")} />
                </InfoCard>

                {/* Classification Card */}
                <InfoCard title="Classification">
                    <InfoRow label="Category" value={asset.category?.name} />
                    <InfoRow label="Sub-Category" value={asset.subCategory?.name} />
                    <InfoRow label="Type" value={asset.assetType?.name} />
                    <InfoRow label="Ownership" value={(asset.ownership || "").replace(/_/g, " ")} />
                    <InfoRow label="Bottleneck" value={asset.isBottleneck ? "Yes" : "No"} />
                </InfoCard>

                {/* Location Card */}
                <InfoCard title="Location">
                    <InfoRow label="Location" value={locations.find((l: any) => l.id === asset.locationId)?.name || asset.location?.name} />
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
                                Type: {(m.meterType || "").replace(/_/g, " ")}
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
                                    <th className="py-3 px-4 font-bold">Source</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {readings.map((r: any, idx: number) => {
                                    const delta = r.previousValue != null
                                        ? Number(r.value) - Number(r.previousValue)
                                        : null;
                                    return (
                                        <tr key={r.id || idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs">{r.createdAt ? fmt.date(r.createdAt) : "---"}</td>
                                            <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">{Number(r.value).toLocaleString()}</td>
                                            <td className="py-3 px-4">
                                                {r.isReset ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50">RESET</span>
                                                ) : delta != null ? (
                                                    <span className={delta >= 0 ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"}>
                                                        {delta >= 0 ? "+" : ""}{Number(delta).toLocaleString()}
                                                    </span>
                                                ) : "---"}
                                            </td>
                                            <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400 text-xs">{r.source || "MANUAL"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── History Tab ── */

/** Resolves an actor's display name from their userId.
 *  - If actorId matches the logged-in user → use local store (no network).
 *  - Otherwise, fetches via platformUsersApi.getUserById (cached by React Query).
 */
function UserName({ actorId, currentUser }: { actorId: string | null | undefined; currentUser: any }) {
    const isCurrentUser = !!actorId && currentUser?.id === actorId;
    const { data } = useQuery({
        queryKey: ["platform-user", actorId],
        queryFn: () => platformUsersApi.getUserById(actorId!),
        enabled: !!actorId && !isCurrentUser,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    if (!actorId) return <span className="italic text-neutral-400">System</span>;

    if (isCurrentUser) {
        return <span>{getDisplayName(currentUser)}</span>;
    }

    const fetched = data?.data;
    if (fetched) {
        const name = `${fetched.firstName ?? ""} ${fetched.lastName ?? ""}`.trim() || fetched.email;
        return <span>{name}</span>;
    }

    return <span className="italic text-neutral-400">User #{actorId.slice(-6)}</span>;
}

/** Build a human-readable description from the raw event fields. */
function buildEventDescription(event: any): string {
    if (event.description) return event.description;
    if (event.notes) return event.notes;

    const meta = event.metadata as any;
    const nv = event.newValue as any;
    const ov = event.oldValue as any;

    switch (event.eventType) {
        case "CREATED":
            return "Asset was registered in the system.";
        case "STATUS_CHANGED": {
            const from = (ov?.operationalStatus || ov?.status || "").replace(/_/g, " ");
            const to = (nv?.operationalStatus || nv?.status || "").replace(/_/g, " ");
            if (from && to) return `Status changed from ${from} to ${to}.`;
            if (to) return `Status changed to ${to}.`;
            return "Asset status was updated.";
        }
        case "TRANSFERRED": {
            const loc = meta?.toLocationName || nv?.locationName || "";
            return loc ? `Asset transferred to ${loc}.` : "Asset was transferred to a new location.";
        }
        case "RETIRED":
            return "Asset was retired and soft-deleted.";
        case "READING_LOGGED": {
            const val = meta?.value ?? nv?.value;
            const unit = meta?.unit || "";
            const isReset = meta?.isReset || nv?.isReset;
            if (isReset) return `Meter reset. New reading: ${val}${unit ? ` ${unit}` : ""}.`;
            return val != null ? `Meter reading logged: ${val}${unit ? ` ${unit}` : ""}.` : "Meter reading logged.";
        }
        default:
            return "---";
    }
}

function HistoryTab({ history, fmt, currentUser }: { history: any[]; fmt: any; currentUser: any }) {
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
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{buildEventDescription(event)}</p>
                                <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                                    <span>By:</span>
                                    <UserName actorId={event.actorId} currentUser={currentUser} />
                                </p>
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
