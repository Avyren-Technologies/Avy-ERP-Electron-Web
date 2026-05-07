import { useState, useMemo } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Loader2,
  X,
  Users,
} from 'lucide-react';
import {
  useBiometricMappings,
  useBiometricDevices,
  useUnmappedPunches,
  useCreateBiometricMapping,
  useDeleteBiometricMapping,
  useEmployees,
} from '@/features/company-admin/api';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
// Toast errors handled by mutation onError callbacks

/* ── Types ── */

interface MappingEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  profilePhotoUrl?: string | null;
}

interface BiometricMapping {
  id: string;
  employeeId: string;
  deviceSerialNumber: string;
  deviceUserId: string;
  companyId: string;
  enrolledAt: string;
  employee: MappingEmployee;
  device: { serialNumber: string; deviceName: string; location: { id: string; name: string } | null } | null;
}

interface UnmappedPunch {
  serialNumber: string;
  deviceUserId: string;
  punchCount: number;
  lastPunchTime: string;
}

interface BiometricDevice {
  id: string;
  serialNumber: string;
  deviceName: string;
  locationId: string | null;
  location: { id: string; name: string } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

/* ── Avatar ── */

function EmployeeAvatar({ employee }: { employee: MappingEmployee }) {
  const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();

  if (employee.profilePhotoUrl) {
    return (
      <img
        src={employee.profilePhotoUrl}
        alt={`${employee.firstName} ${employee.lastName}`}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
      {initials}
    </div>
  );
}

/* ── Screen ── */

export function BiometricMappingScreen() {
  const fmt = useCompanyFormatter();

  // State
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BiometricMapping | null>(null);
  const [prefill, setPrefill] = useState<{ deviceSerialNumber?: string; deviceUserId?: string } | null>(null);

  // Queries
  const { data: mappingsData, isLoading: mappingsLoading, isError: mappingsError } = useBiometricMappings();
  const { data: unmappedData, isLoading: unmappedLoading } = useUnmappedPunches();
  const { data: devicesData } = useBiometricDevices();

  // Mutations
  const createMutation = useCreateBiometricMapping();
  const deleteMutation = useDeleteBiometricMapping();

  // Derived data
  const mappings: BiometricMapping[] = (mappingsData as Record<string, unknown>)?.data as BiometricMapping[] ?? [];
  const unmappedPunches: UnmappedPunch[] = (unmappedData as Record<string, unknown>)?.data as UnmappedPunch[] ?? [];
  const devices: BiometricDevice[] = (devicesData as Record<string, unknown>)?.data as BiometricDevice[] ?? [];

  const filteredMappings = useMemo(() => {
    if (!search) return mappings;
    const s = search.toLowerCase();
    return mappings.filter((m) => {
      const fullName = `${m.employee.firstName} ${m.employee.lastName}`.toLowerCase();
      const empId = m.employee.employeeId?.toLowerCase() ?? '';
      return fullName.includes(s) || empId.includes(s);
    });
  }, [mappings, search]);

  // Handlers
  const openCreateModal = (prefillData?: { deviceSerialNumber: string; deviceUserId: string }) => {
    setPrefill(prefillData ?? null);
    setCreateModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error toast handled by mutation onError
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biometric Mapping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Link employees to biometric device user IDs
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      {/* Section 1: Existing Mappings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Employee-Device Mappings</h2>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {mappings.length}
            </span>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {mappingsError && (
          <div className="mx-5 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
            Failed to load mappings. Please try again.
          </div>
        )}

        {mappingsLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : mappings.length === 0 && !search ? (
          <EmptyState
            icon="list"
            title="No mappings yet"
            message="Link employees to biometric device user IDs to start processing attendance."
            action={{ label: 'Add Mapping', onClick: () => openCreateModal() }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device User ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enrolled Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar employee={m.employee} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {m.employee.firstName} {m.employee.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{m.employee.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm text-gray-900 dark:text-white">{m.device?.deviceName ?? m.deviceSerialNumber}</p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{m.deviceSerialNumber}</p>
                      {m.device?.location && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{m.device.location.name}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {m.deviceUserId}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {fmt.date(m.enrolledAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove mapping"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMappings.length === 0 && search && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No mappings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Unmapped Punches */}
      <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800/50">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-yellow-200 dark:border-yellow-800/50">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Unlinked Device Users</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              These device user IDs have recorded punches but haven&apos;t been linked to employees yet
            </p>
          </div>
        </div>

        {unmappedLoading ? (
          <SkeletonTable rows={3} cols={5} />
        ) : unmappedPunches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">All device users are mapped</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No unlinked device punches found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-yellow-100/50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device Serial Number</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device User ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Punch Count</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Punch</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-yellow-100 dark:divide-yellow-800/30">
                {unmappedPunches.map((p) => (
                  <tr key={`${p.serialNumber}-${p.deviceUserId}`} className="hover:bg-yellow-100/40 dark:hover:bg-yellow-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {p.serialNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {p.deviceUserId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                        {p.punchCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {fmt.dateTime(p.lastPunchTime)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openCreateModal({ deviceSerialNumber: p.serialNumber, deviceUserId: p.deviceUserId })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Link2 size={13} />
                        Map Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Mapping Modal */}
      {createModalOpen && (
        <CreateMappingModal
          devices={devices}
          prefill={prefill}
          mutation={createMutation}
          onClose={() => { setCreateModalOpen(false); setPrefill(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Remove Mapping?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remove the mapping for <strong className="text-gray-700 dark:text-gray-300">{deleteTarget.employee.firstName} {deleteTarget.employee.lastName}</strong>? Historical punches will keep their employee link.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Mapping Modal ── */

function CreateMappingModal({
  devices,
  prefill,
  mutation,
  onClose,
}: {
  devices: BiometricDevice[];
  prefill: { deviceSerialNumber?: string; deviceUserId?: string } | null;
  mutation: ReturnType<typeof useCreateBiometricMapping>;
  onClose: () => void;
}) {
  const hasPrefill = !!(prefill?.deviceSerialNumber && prefill?.deviceUserId);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [deviceSerial, setDeviceSerial] = useState(prefill?.deviceSerialNumber ?? '');
  const [deviceUserId, setDeviceUserId] = useState(prefill?.deviceUserId ?? '');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Employee search query
  const { data: employeesData } = useEmployees(
    employeeSearch.length >= 2 ? { search: employeeSearch, limit: 10 } : undefined,
  );
  const employees: Employee[] = employeeSearch.length >= 2
    ? ((employeesData as Record<string, unknown>)?.data as Employee[] ?? [])
    : [];

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmployeeId(emp.id);
    setEmployeeSearch(`${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!employeeId || !deviceSerial || !deviceUserId) return;
    try {
      await mutation.mutateAsync({
        employeeId,
        deviceSerialNumber: deviceSerial,
        deviceUserId,
      });
      onClose();
    } catch {
      // Error toast handled by mutation onError
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Link Employee to Device</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Employee Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setSelectedEmployee(null);
                setEmployeeId('');
                setShowDropdown(true);
              }}
              onFocus={() => { if (employees.length > 0 && !selectedEmployee) setShowDropdown(true); }}
              placeholder="Search employee by name..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
            />
            {showDropdown && employees.length > 0 && !selectedEmployee && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{emp.employeeId}</span>
                  </button>
                ))}
              </div>
            )}
            {employeeSearch.length >= 2 && employees.length === 0 && !selectedEmployee && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No employees found</p>
              </div>
            )}
          </div>

          {/* Device Serial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device <span className="text-red-500">*</span>
            </label>
            {hasPrefill ? (
              <input
                type="text"
                value={deviceSerial}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            ) : (
              <select
                value={deviceSerial}
                onChange={(e) => setDeviceSerial(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              >
                <option value="">Select device...</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.serialNumber}>
                    {d.deviceName} ({d.serialNumber}){d.location ? ` — ${d.location.name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Device User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Device User ID <span className="text-red-500">*</span>
            </label>
            {hasPrefill ? (
              <input
                type="text"
                value={deviceUserId}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            ) : (
              <input
                type="text"
                value={deviceUserId}
                onChange={(e) => setDeviceUserId(e.target.value)}
                placeholder="e.g., 1, 2, 101..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-gray-400"
              />
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !employeeId || !deviceSerial || !deviceUserId}
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {mutation.isPending ? 'Linking...' : 'Link Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BiometricMappingScreen;
