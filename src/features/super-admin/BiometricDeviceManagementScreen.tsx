import { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  Wifi,
  WifiOff,
  Fingerprint,
  Building2,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  useUnassignedDevices,
  useUnassignedDeviceCount,
  useAssignBiometricDevice,
} from '@/features/company-admin/api';
import { useTenantList } from '@/features/super-admin/api/use-tenant-queries';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface UnassignedDevice {
  id: string;
  serialNumber: string;
  deviceName: string;
  protocol: string;
  firmwareVersion: string | null;
  lastHeartbeatAt: string | null;
  heartbeatCount: number;
  registeredAt: string;
  isActive: boolean;
}

function getConnectionStatus(device: { lastHeartbeatAt?: string | null }) {
  if (!device.lastHeartbeatAt) return 'never';
  const diff = Date.now() - new Date(device.lastHeartbeatAt).getTime();
  if (diff <= 2 * 60 * 1000) return 'online';
  if (diff <= 60 * 60 * 1000) return 'idle';
  return 'offline';
}

const CONNECTION_CONFIG = {
  online: { label: 'Online', className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  idle: { label: 'Idle', className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  offline: { label: 'Offline', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  never: { label: 'Never Connected', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
} as const;

export function BiometricDeviceManagementScreen() {
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<UnassignedDevice | null>(null);
  const [assignForm, setAssignForm] = useState({ companyId: '', deviceName: '' });

  // Queries
  const { data: devicesData, isLoading, isError } = useUnassignedDevices();
  const { data: countData } = useUnassignedDeviceCount();
  const { data: companiesData } = useTenantList({ limit: 500 });

  // Mutations
  const assignMutation = useAssignBiometricDevice();

  // Derived data
  const devices: UnassignedDevice[] = ((devicesData as any)?.data ?? []) as UnassignedDevice[];
  const unassignedCount = ((countData as any)?.data as { count?: number })?.count ?? devices.length;
  const companies: Array<{ id: string; name: string }> = ((companiesData as any)?.data ?? []) as Array<{ id: string; name: string }>;

  const filtered = useMemo(() => {
    if (!search) return devices;
    const s = search.toLowerCase();
    return devices.filter((d) =>
      d.serialNumber.toLowerCase().includes(s) || d.deviceName.toLowerCase().includes(s),
    );
  }, [devices, search]);

  const openAssignModal = (device: UnassignedDevice) => {
    setAssignTarget(device);
    setAssignForm({ companyId: '', deviceName: device.deviceName || device.serialNumber });
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    try {
      await assignMutation.mutateAsync({
        id: assignTarget.id,
        data: {
          companyId: assignForm.companyId,
          deviceName: assignForm.deviceName,
        },
      });
      setAssignTarget(null);
    } catch {
      // Error toast handled by mutation onError
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biometric Devices</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage unassigned biometric devices and assign them to companies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned Devices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{unassignedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting Assignment</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                Devices that connected but haven&apos;t been assigned to any company
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load unassigned devices. Please try again.
        </div>
      )}

      {/* Device Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : filtered.length === 0 && !search ? (
          <EmptyState
            icon="list"
            title="No unassigned devices"
            message="All connected biometric devices have been assigned to companies. New devices will appear here once they connect to the ADMS server."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Connection</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Heartbeat</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heartbeats</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/50">
                {filtered.map((d) => {
                  const status = getConnectionStatus(d);
                  const cfg = CONNECTION_CONFIG[status];

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{d.serialNumber}</span>
                            {d.firmwareVersion && (
                              <p className="text-xs text-gray-400 mt-0.5">FW: {d.firmwareVersion}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(d.lastHeartbeatAt)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {d.heartbeatCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAssignModal(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                        >
                          <Building2 size={13} />
                          Assign to Company
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && search && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No devices match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Device to Company</h2>
              <button
                onClick={() => setAssignTarget(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Device info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{assignTarget.serialNumber}</p>
                  <p className="text-xs text-gray-500">
                    {getConnectionStatus(assignTarget) === 'online' ? 'Currently online' : `Last seen: ${formatTimeAgo(assignTarget.lastHeartbeatAt)}`}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignForm.companyId}
                  onChange={(e) => setAssignForm((p) => ({ ...p, companyId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignForm.deviceName}
                  onChange={(e) => setAssignForm((p) => ({ ...p, deviceName: e.target.value }))}
                  placeholder="e.g., Main Gate Scanner"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !assignForm.companyId || !assignForm.deviceName}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {assignMutation.isPending ? 'Assigning...' : 'Assign Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
