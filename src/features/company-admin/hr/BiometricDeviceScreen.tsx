import { useState } from "react";
import {
    Fingerprint,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Wifi,
    WifiOff,
    RefreshCw,
    Zap,
    AlertTriangle,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBiometricDevices } from "@/features/company-admin/api/use-biometric-queries";
import {
    useCreateBiometricDevice,
    useUpdateBiometricDevice,
    useDeleteBiometricDevice,
    useTestBiometricDevice,
    useSyncBiometricDevice,
} from "@/features/company-admin/api/use-biometric-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
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

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "ACTIVE" || s === "ONLINE"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "OFFLINE"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : s === "ERROR"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

/* ── Constants ── */

const BRANDS = [
    { value: "ZKTeco", label: "ZKTeco" },
    { value: "ESSL", label: "ESSL" },
    { value: "Realtime", label: "Realtime" },
    { value: "BioEnable", label: "BioEnable" },
    { value: "Mantra", label: "Mantra" },
];

const SYNC_MODES = [
    { value: "PUSH", label: "Push" },
    { value: "PULL", label: "Pull" },
    { value: "BIDIRECTIONAL", label: "Bidirectional" },
];

const EMPTY_FORM = {
    name: "",
    brand: "",
    deviceId: "",
    ip: "",
    port: "4370",
    syncMode: "PULL",
    syncInterval: "15",
    locationId: "",
};

/* ── Screen ── */

export function BiometricDeviceScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [testResult, setTestResult] = useState<{ id: string; status: string } | null>(null);

    const { data, isLoading, isError } = useBiometricDevices();
    const createMutation = useCreateBiometricDevice();
    const updateMutation = useUpdateBiometricDevice();
    const deleteMutation = useDeleteBiometricDevice();
    const testMutation = useTestBiometricDevice();
    const syncMutation = useSyncBiometricDevice();

    const devices: any[] = (data as any)?.data ?? [];

    const filtered = devices.filter((d: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return d.name?.toLowerCase().includes(s) || d.brand?.toLowerCase().includes(s) || d.deviceId?.toLowerCase().includes(s);
    });

    // Stats
    const totalDevices = devices.length;
    const onlineCount = devices.filter((d: any) => d.status === "ACTIVE" || d.status === "ONLINE").length;
    const offlineCount = devices.filter((d: any) => d.status === "OFFLINE").length;
    const lastSync = devices.reduce((latest: string, d: any) => {
        if (d.lastSyncAt && (!latest || d.lastSyncAt > latest)) return d.lastSyncAt;
        return latest;
    }, "");

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setModalOpen(true);
    };

    const openEdit = (device: any) => {
        setEditingId(device.id);
        setForm({
            name: device.name ?? "",
            brand: device.brand ?? "",
            deviceId: device.deviceId ?? "",
            ip: device.ip ?? "",
            port: String(device.port ?? "4370"),
            syncMode: device.syncMode ?? "PULL",
            syncInterval: String(device.syncInterval ?? "15"),
            locationId: device.locationId ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                brand: form.brand,
                deviceId: form.deviceId,
                ip: form.ip,
                port: Number(form.port),
                syncMode: form.syncMode,
                syncInterval: Number(form.syncInterval),
                locationId: form.locationId || undefined,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Device Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Device Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Device Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleTest = async (device: any) => {
        try {
            const result = await testMutation.mutateAsync(device.id);
            const online = (result as any)?.data?.online ?? (result as any)?.online ?? false;
            setTestResult({ id: device.id, status: online ? "Online" : "Offline" });
            showSuccess("Connection Test", `${device.name} is ${online ? "online" : "offline"}.`);
        } catch (err) {
            setTestResult({ id: device.id, status: "Error" });
            showApiError(err);
        }
    };

    const handleSync = async (device: any) => {
        try {
            await syncMutation.mutateAsync(device.id);
            showSuccess("Sync Complete", `${device.name} synced successfully.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Biometric Devices</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage biometric attendance devices</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Device
                    </button>
                </div>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Devices", value: totalDevices, icon: Fingerprint, color: "primary" },
                    { label: "Online", value: onlineCount, icon: Wifi, color: "success" },
                    { label: "Offline", value: offlineCount, icon: WifiOff, color: "danger" },
                    { label: "Last Sync", value: lastSync ? new Date(lastSync).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never", icon: Clock, color: "accent" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${stat.color}-50 dark:bg-${stat.color}-900/30`)}>
                                <stat.icon className={cn("w-5 h-5", `text-${stat.color}-600 dark:text-${stat.color}-400`)} />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{stat.label}</p>
                                <p className="text-lg font-bold text-primary-950 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search devices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load devices. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Device</th>
                                    <th className="py-4 px-6 font-bold">Brand</th>
                                    <th className="py-4 px-6 font-bold">Device ID</th>
                                    <th className="py-4 px-6 font-bold">IP:Port</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Last Sync</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((d: any) => (
                                    <tr
                                        key={d.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Fingerprint className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{d.brand ?? "—"}</td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{d.deviceId ?? "—"}</td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{d.ip ? `${d.ip}:${d.port}` : "—"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <StatusBadge status={d.status ?? "OFFLINE"} />
                                        </td>
                                        <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">
                                            {d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleTest(d)}
                                                    disabled={testMutation.isPending}
                                                    className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                                                    title="Test Connection"
                                                >
                                                    {testMutation.isPending && testResult?.id === d.id ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                                                </button>
                                                <button
                                                    onClick={() => handleSync(d)}
                                                    disabled={syncMutation.isPending}
                                                    className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
                                                    title="Sync Now"
                                                >
                                                    <RefreshCw size={15} className={syncMutation.isPending ? "animate-spin" : ""} />
                                                </button>
                                                <button onClick={() => openEdit(d)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(d)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No devices found" message="Add a biometric device to get started." action={{ label: "Add Device", onClick: openCreate }} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Device" : "Add Device"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Device Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Main Gate Scanner" required />
                            <SelectField label="Brand" value={form.brand} onChange={(v) => updateField("brand", v)} options={BRANDS} placeholder="Select brand..." />
                            <FormField label="Device ID" value={form.deviceId} onChange={(v) => updateField("deviceId", v)} placeholder="e.g. ZK-001" required />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="IP Address" value={form.ip} onChange={(v) => updateField("ip", v)} placeholder="192.168.1.100" required />
                                <FormField label="Port" value={form.port} onChange={(v) => updateField("port", v)} placeholder="4370" type="number" />
                            </div>
                            <SelectField label="Sync Mode" value={form.syncMode} onChange={(v) => updateField("syncMode", v)} options={SYNC_MODES} />
                            <FormField label="Sync Interval (minutes)" value={form.syncInterval} onChange={(v) => updateField("syncInterval", v)} type="number" placeholder="15" />
                            <FormField label="Location ID" value={form.locationId} onChange={(v) => updateField("locationId", v)} placeholder="Optional location ID" />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Device?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
