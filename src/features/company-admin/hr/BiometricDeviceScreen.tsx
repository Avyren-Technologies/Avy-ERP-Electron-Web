import { useState, useMemo } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  Fingerprint,
  Plus,
  Edit3,
  Loader2,
  X,
  Search,
  Wifi,
  WifiOff,
  Cpu,
  Power,
  Info,
} from 'lucide-react';
import {
  useBiometricDevices,
  useBiometricDeviceStats,
  useClaimBiometricDevice,
  useUpdateBiometricDevice,
  useDeactivateBiometricDevice,
  useCompanyLocations,
} from '@/features/company-admin/api';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
// Toast errors handled by mutation onError callbacks

/* ── Types ── */

interface BiometricDevice {
  id: string;
  serialNumber: string;
  deviceName: string;
  isActive: boolean;
  lastHeartbeatAt: string | null;
  heartbeatCount: number;
  locationId: string | null;
  location: { id: string; name: string; code: string } | null;
  timezone: string;
  protocol: string;
  claimStatus: string;
  firmwareVersion: string | null;
  registeredAt: string;
  assignedAt: string | null;
}

/* ── Helpers ── */

function getDeviceStatus(device: { isActive: boolean; lastHeartbeatAt?: string | null }) {
  if (!device.isActive) return 'inactive';
  if (!device.lastHeartbeatAt) return 'offline';
  const diff = Date.now() - new Date(device.lastHeartbeatAt).getTime();
  if (diff <= 2 * 60 * 1000) return 'online';
  if (diff <= 60 * 60 * 1000) return 'idle';
  return 'offline';
}

const STATUS_CONFIG = {
  online: { label: 'Online', className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  idle: { label: 'Idle', className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  offline: { label: 'Offline', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
} as const;

/* ── Screen ── */

export function BiometricDeviceScreen() {
  const fmt = useCompanyFormatter();

  // State
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<BiometricDevice | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BiometricDevice | null>(null);

  // Claim form state
  const [claimForm, setClaimForm] = useState({ serialNumber: '', deviceName: '', locationId: '', timezone: 'Asia/Kolkata' });

  // Edit form state
  const [editForm, setEditForm] = useState({ deviceName: '', locationId: '', timezone: '', isActive: true });

  // Queries
  const { data: devicesData, isLoading, isError } = useBiometricDevices(locationFilter || undefined);
  const { data: statsData } = useBiometricDeviceStats(locationFilter || undefined);
  const { data: locationsData } = useCompanyLocations();

  // Mutations
  const claimMutation = useClaimBiometricDevice();
  const updateMutation = useUpdateBiometricDevice();
  const deactivateMutation = useDeactivateBiometricDevice();

  // Derived data
  const devices: BiometricDevice[] = ((devicesData as any)?.data ?? []) as BiometricDevice[];
  const stats = (statsData as Record<string, unknown>)?.data as { total?: number; online?: number; offline?: number } | undefined;
  const locations: Array<{ id: string; name: string }> = ((locationsData as unknown as Record<string, unknown>)?.data as Array<{ id: string; name: string }>) ?? [];

  const filtered = useMemo(() => {
    if (!search) return devices;
    const s = search.toLowerCase();
    return devices.filter((d) =>
      d.deviceName.toLowerCase().includes(s) || d.serialNumber.toLowerCase().includes(s),
    );
  }, [devices, search]);

  // Handlers
  const openClaimModal = () => {
    setClaimForm({ serialNumber: '', deviceName: '', locationId: '', timezone: 'Asia/Kolkata' });
    setClaimModalOpen(true);
  };

  const openEditModal = (device: BiometricDevice) => {
    setEditDevice(device);
    setEditForm({
      deviceName: device.deviceName,
      locationId: device.locationId ?? '',
      timezone: device.timezone ?? 'Asia/Kolkata',
      isActive: device.isActive,
    });
  };

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync({
        serialNumber: claimForm.serialNumber,
        deviceName: claimForm.deviceName,
        locationId: claimForm.locationId || undefined,
        timezone: claimForm.timezone || undefined,
      });
      setClaimModalOpen(false);
    } catch {
      // Error toast handled by mutation onError
    }
  };

  const handleUpdate = async () => {
    if (!editDevice) return;
    try {
      await updateMutation.mutateAsync({
        id: editDevice.id,
        data: {
          deviceName: editForm.deviceName,
          locationId: editForm.locationId || undefined,
          timezone: editForm.timezone || undefined,
          isActive: editForm.isActive,
        },
      });
      setEditDevice(null);
    } catch {
      // Error toast handled by mutation onError
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.id);
      setDeactivateTarget(null);
    } catch {
      // Error toast handled by mutation onError
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biometric Devices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage eSSL ADMS biometric attendance devices
          </p>
        </div>
        <button
          onClick={openClaimModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Device
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total ?? devices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.online ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Offline</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.offline ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Location Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by device name or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400 transition-all"
            />
          </div>
          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load devices. Please try again.
        </div>
      )}

      {/* Device Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : filtered.length === 0 && !search ? (
          <EmptyState
            icon="list"
            title="No devices found"
            message="Register a biometric device to get started."
            action={{ label: 'Register Device', onClick: openClaimModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Heartbeat</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/50">
                {filtered.map((d) => {
                  const status = getDeviceStatus(d);
                  const cfg = STATUS_CONFIG[status];
                  const locName = d.location?.name ?? null;

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{d.deviceName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {d.serialNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                        {locName ?? <span className="text-gray-400">&mdash;</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {d.lastHeartbeatAt ? fmt.dateTime(d.lastHeartbeatAt) : 'Never'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          {d.isActive && (
                            <button
                              onClick={() => setDeactivateTarget(d)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <Power size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && search && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No devices match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register / Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Register New Device</h2>
              <button
                onClick={() => setClaimModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Guidance callout */}
              <div className="flex gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  The biometric device must be powered on and connected to the network with the correct ADMS server URL configured. It needs to have connected to the server at least once before it can be registered here. Contact your platform admin if the device has not been provisioned yet.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={claimForm.serialNumber}
                  onChange={(e) => setClaimForm((p) => ({ ...p, serialNumber: e.target.value }))}
                  placeholder="Enter device serial number"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={claimForm.deviceName}
                  onChange={(e) => setClaimForm((p) => ({ ...p, deviceName: e.target.value }))}
                  placeholder="e.g., Main Gate Scanner"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                {locations.length > 0 ? (
                  <select
                    value={claimForm.locationId}
                    onChange={(e) => setClaimForm((p) => ({ ...p, locationId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={claimForm.locationId}
                    onChange={(e) => setClaimForm((p) => ({ ...p, locationId: e.target.value }))}
                    placeholder="Location ID (optional)"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                <input
                  type="text"
                  value={claimForm.timezone}
                  onChange={(e) => setClaimForm((p) => ({ ...p, timezone: e.target.value }))}
                  placeholder="Asia/Kolkata"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setClaimModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={claimMutation.isPending || !claimForm.serialNumber || !claimForm.deviceName}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {claimMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {claimMutation.isPending ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editDevice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Device</h2>
              <button
                onClick={() => setEditDevice(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Name</label>
                <input
                  type="text"
                  value={editForm.deviceName}
                  onChange={(e) => setEditForm((p) => ({ ...p, deviceName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                {locations.length > 0 ? (
                  <select
                    value={editForm.locationId}
                    onChange={(e) => setEditForm((p) => ({ ...p, locationId: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                  >
                    <option value="">Select location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editForm.locationId}
                    onChange={(e) => setEditForm((p) => ({ ...p, locationId: e.target.value }))}
                    placeholder="Location ID"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                <input
                  type="text"
                  value={editForm.timezone}
                  onChange={(e) => setEditForm((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                <button
                  type="button"
                  onClick={() => setEditForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      editForm.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditDevice(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deactivate Device?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to deactivate <strong className="text-gray-700 dark:text-gray-300">{deactivateTarget.deviceName}</strong>? The device will stop processing attendance punches.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deactivateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
