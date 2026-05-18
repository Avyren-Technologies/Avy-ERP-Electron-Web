import { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Loader2,
  X,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Cog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-utils';
import { useCompanyProfile } from '@/features/company-admin/api/use-company-admin-queries';
import {
  useMachines,
  useMachineCategories,
  useMachineTypes,
  useMachineZones,
} from '@/features/masters/api/use-masters-queries';
import {
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  useCreateMachineCategory,
  useUpdateMachineCategory,
  useDeleteMachineCategory,
  useCreateMachineType,
  useUpdateMachineType,
  useDeleteMachineType,
  useCreateMachineZone,
  useUpdateMachineZone,
  useDeleteMachineZone,
} from '@/features/masters/api/use-masters-mutations';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ManageModal } from '@/components/ui/ManageModal';
import { showSuccess, showApiError } from '@/lib/toast';
import type { Machine, MachineCategory, MachineType, MachineZone } from '@/lib/api/masters';

/* ── Constants ── */

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
];

const MACHINE_STATUS_OPTIONS = [
  { value: 'RUNNING', label: 'Running' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUS_BADGE: Record<string, string> = {
  RUNNING: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50',
  IDLE: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-400 dark:border-neutral-700',
  MAINTENANCE: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
  DECOMMISSIONED: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50',
  MEDIUM: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50',
  LOW: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',
};

const PAGE_SIZE = 20;

/* ── Form State ── */

interface MachineFormState {
  assetName: string;
  assetCode: string;
  serialNumber: string;
  categoryId: string;
  zoneId: string;
  priority: string;
  status: string;
  typeId: string;
  machineCode: string;
  lineWorkCenter: string;
  capacity: string;
  powerRating: string;
  make: string;
  model: string;
  yearOfManufacture: string;
  idleReason: string;
}

const EMPTY_FORM: MachineFormState = {
  assetName: '',
  assetCode: '',
  serialNumber: '',
  categoryId: '',
  zoneId: '',
  priority: 'MEDIUM',
  status: 'RUNNING',
  typeId: '',
  machineCode: '',
  lineWorkCenter: '',
  capacity: '',
  powerRating: '',
  make: '',
  model: '',
  yearOfManufacture: '',
  idleReason: '',
};

/* ── Shared Form Components ── */

function FormField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
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
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Dropdown with Manage button ── */

function DropdownWithManage({ label, value, onChange, options, onManage, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  onManage: () => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onManage}
          className="px-3 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-xs font-bold transition-colors whitespace-nowrap"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

/* ── Screen ── */

export function MachineMasterScreen() {
  // Data queries
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [page, search, statusFilter]);

  const { data: machinesData, isLoading, isError } = useMachines(queryParams);
  const { data: categoriesData, isLoading: categoriesLoading } = useMachineCategories();
  const { data: typesData, isLoading: typesLoading } = useMachineTypes();
  const { data: zonesData, isLoading: zonesLoading } = useMachineZones();

  const { data: profileData } = useCompanyProfile();

  const machines: Machine[] = machinesData?.data ?? [];
  const meta = machinesData?.meta;
  const categories: MachineCategory[] = categoriesData?.data ?? [];
  const machineTypes: MachineType[] = typesData?.data ?? [];
  const zones: MachineZone[] = zonesData?.data ?? [];

  // Mutations
  const createMutation = useCreateMachine();
  const updateMutation = useUpdateMachine();
  const deleteMutation = useDeleteMachine();
  const createCategoryMutation = useCreateMachineCategory();
  const updateCategoryMutation = useUpdateMachineCategory();
  const deleteCategoryMutation = useDeleteMachineCategory();
  const createTypeMutation = useCreateMachineType();
  const updateTypeMutation = useUpdateMachineType();
  const deleteTypeMutation = useDeleteMachineType();
  const createZoneMutation = useCreateMachineZone();
  const updateZoneMutation = useUpdateMachineZone();
  const deleteZoneMutation = useDeleteMachineZone();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MachineFormState>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);

  // ManageModal state
  const [manageModal, setManageModal] = useState<'category' | 'type' | 'zone' | null>(null);

  const openCreate = () => {
    setEditingId(null);
    const defaults = { ...EMPTY_FORM };
    // Set default category to first active one matching "Machinery" or first available
    const machineryCategory = categories.find((c) => c.isActive && c.name.toLowerCase().includes('machinery'));
    if (machineryCategory) defaults.categoryId = machineryCategory.id;
    else if (categories.length > 0) defaults.categoryId = categories.filter((c) => c.isActive)[0]?.id ?? '';
    // Set default zone to first available
    const activeZones = zones.filter((z) => z.isActive);
    if (activeZones.length > 0) defaults.zoneId = activeZones[0].id;
    setForm(defaults);
    setModalOpen(true);
  };

  const openEdit = (machine: Machine) => {
    setEditingId(machine.id);
    setForm({
      assetName: machine.assetName,
      assetCode: machine.assetCode,
      serialNumber: machine.serialNumber ?? '',
      categoryId: machine.categoryId ?? '',
      zoneId: machine.zoneId ?? '',
      priority: machine.priority,
      status: machine.status,
      typeId: machine.typeId ?? '',
      machineCode: machine.machineCode ?? '',
      lineWorkCenter: machine.lineWorkCenter ?? '',
      capacity: machine.capacity ?? '',
      powerRating: machine.powerRating ?? '',
      make: machine.make ?? '',
      model: machine.model ?? '',
      yearOfManufacture: machine.yearOfManufacture != null ? String(machine.yearOfManufacture) : '',
      idleReason: machine.idleReason ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.assetName.trim()) {
      showApiError({ message: 'Asset Name is required' });
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        assetName: form.assetName.trim(),
        priority: form.priority,
        status: form.status,
      };
      if (form.assetCode.trim()) payload.assetCode = form.assetCode.trim();
      if (form.serialNumber) payload.serialNumber = form.serialNumber.trim();
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.zoneId) payload.zoneId = form.zoneId;
      if (form.typeId) payload.typeId = form.typeId;
      if (form.machineCode) payload.machineCode = form.machineCode.trim();
      if (form.lineWorkCenter) payload.lineWorkCenter = form.lineWorkCenter.trim();
      if (form.capacity) payload.capacity = form.capacity.trim();
      if (form.powerRating) payload.powerRating = form.powerRating.trim();
      if (form.make) payload.make = form.make.trim();
      if (form.model) payload.model = form.model.trim();
      if (form.yearOfManufacture) payload.yearOfManufacture = parseInt(form.yearOfManufacture, 10);
      if (form.status === 'IDLE' && form.idleReason) payload.idleReason = form.idleReason.trim();

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        showSuccess('Machine Updated', `${form.assetName} has been updated.`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        const newAssetCode = result?.data?.assetCode ?? '';
        showSuccess('Machine Created', `${form.assetName} (${newAssetCode}) has been added.`);
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
      showSuccess('Machine Deleted', `${deleteTarget.assetName} has been removed.`);
      setDeleteTarget(null);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleExport = () => {
    const headers = [
      'Asset Code', 'Asset Name', 'Machine Code', 'Serial No', 'Category', 'Type',
      'Zone / Area', 'Line / Work Center', 'Priority', 'Capacity', 'Power Rating',
      'Make', 'Model', 'Year', 'Status', 'Idle Reason',
    ];
    const rows = machines.map((m) => [
      m.assetCode,
      m.assetName,
      m.machineCode ?? '',
      m.serialNumber ?? '',
      m.category?.name ?? '',
      m.type?.name ?? '',
      m.zone?.name ?? '',
      m.lineWorkCenter ?? '',
      m.priority,
      m.capacity ?? '',
      m.powerRating ?? '',
      m.make ?? '',
      m.model ?? '',
      m.yearOfManufacture != null ? m.yearOfManufacture : '',
      m.status,
      m.idleReason ?? '',
    ]);
    const companyName = profileData?.data?.name ?? profileData?.data?.displayName ?? '';
    exportToExcel(headers, rows, {
      fileName: 'machines-export',
      sheetName: 'Machine Master',
      companyName,
      title: 'Machine Master Report',
      reportDate: new Date().toLocaleDateString(),
    });
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Machine Master</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Asset register &mdash; machines available in the factory with zone, category &amp; priority</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          New Machine
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search by asset code or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-bold transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
          Failed to load machines. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Asset Code</th>
                  <th className="py-4 px-6 font-bold">Asset Name</th>
                  <th className="py-4 px-6 font-bold">Serial No (MFR)</th>
                  <th className="py-4 px-6 font-bold">Asset Category</th>
                  <th className="py-4 px-6 font-bold">Zone / Area</th>
                  <th className="py-4 px-6 font-bold">Priority</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {machines.map((machine) => (
                  <tr key={machine.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-mono text-xs font-bold border border-primary-100 dark:border-primary-800/50">
                        {machine.assetCode}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                          <Cog className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                        </div>
                        <span className="font-bold text-primary-950 dark:text-white">{machine.assetName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {machine.serialNumber ? (
                        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{machine.serialNumber}</span>
                      ) : (
                        <span className="text-neutral-400">--</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                      {machine.category?.name ?? <span className="text-neutral-400">--</span>}
                    </td>
                    <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                      {machine.zone?.name ?? <span className="text-neutral-400">--</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn('inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border', PRIORITY_BADGE[machine.priority] ?? PRIORITY_BADGE.MEDIUM)}>
                        {machine.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn('inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border', STATUS_BADGE[machine.status] ?? STATUS_BADGE.IDLE)}>
                        {machine.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(machine)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(machine)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon="list" title="No machines found" message="Add your first machine to the asset register." action={{ label: 'New Machine', onClick: openCreate }} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {((page - 1) * PAGE_SIZE) + 1}&ndash;{Math.min(page * PAGE_SIZE, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? 'Edit Machine' : 'Add Machine'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Row 1: Asset Name + Asset Code */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Asset Name" value={form.assetName} onChange={(v) => setForm((p) => ({ ...p, assetName: v }))} placeholder="e.g. CNC Lathe #3" required />
                <FormField label="Asset Code" value={form.assetCode} onChange={(v) => setForm((p) => ({ ...p, assetCode: v }))} placeholder={editingId ? 'Asset code' : 'Leave blank to auto-generate'} />
              </div>

              {/* Row 2: Serial Number + Category */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Serial Number (MFR)" value={form.serialNumber} onChange={(v) => setForm((p) => ({ ...p, serialNumber: v }))} placeholder="e.g. SN-2024-00456" />
                <DropdownWithManage
                  label="Asset Category"
                  value={form.categoryId}
                  onChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
                  options={categories.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name }))}
                  onManage={() => setManageModal('category')}
                />
              </div>

              {/* Row 3: Zone + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <DropdownWithManage
                  label="Zone / Area"
                  value={form.zoneId}
                  onChange={(v) => setForm((p) => ({ ...p, zoneId: v }))}
                  options={zones.filter((z) => z.isActive).map((z) => ({ value: z.id, label: z.name }))}
                  onManage={() => setManageModal('zone')}
                />
                <FormSelect label="Priority" value={form.priority} onChange={(v) => setForm((p) => ({ ...p, priority: v }))} options={PRIORITY_OPTIONS} />
              </div>

              {/* Row 4: Status (half-width) */}
              <div className="grid grid-cols-2 gap-4">
                <FormSelect label="Status" value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={MACHINE_STATUS_OPTIONS} />
              </div>

              {/* Row 5: Machine Type */}
              <DropdownWithManage
                label="Machine Type"
                value={form.typeId}
                onChange={(v) => setForm((p) => ({ ...p, typeId: v }))}
                options={machineTypes.filter((t) => t.isActive).map((t) => ({ value: t.id, label: t.name }))}
                onManage={() => setManageModal('type')}
              />

              {/* Additional Fields */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Additional Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Machine Code" value={form.machineCode} onChange={(v) => setForm((p) => ({ ...p, machineCode: v }))} placeholder="e.g. CNC-L3" />
                  <FormField label="Line / Work Center" value={form.lineWorkCenter} onChange={(v) => setForm((p) => ({ ...p, lineWorkCenter: v }))} placeholder="e.g. Line A" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField label="Capacity" value={form.capacity} onChange={(v) => setForm((p) => ({ ...p, capacity: v }))} placeholder="e.g. 500 pcs/shift" />
                  <FormField label="Power Rating" value={form.powerRating} onChange={(v) => setForm((p) => ({ ...p, powerRating: v }))} placeholder="e.g. 15 kW" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <FormField label="Make" value={form.make} onChange={(v) => setForm((p) => ({ ...p, make: v }))} placeholder="e.g. Mazak" />
                  <FormField label="Model" value={form.model} onChange={(v) => setForm((p) => ({ ...p, model: v }))} placeholder="e.g. QT-250" />
                  <FormField label="Year of Manufacture" value={form.yearOfManufacture} onChange={(v) => setForm((p) => ({ ...p, yearOfManufacture: v }))} placeholder="e.g. 2022" type="number" />
                </div>
              </div>

              {/* Idle Reason - shown only when status is Idle */}
              {form.status === 'IDLE' && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
                  <FormField label="Idle Reason" value={form.idleReason} onChange={(v) => setForm((p) => ({ ...p, idleReason: v }))} placeholder="e.g. Awaiting spare parts" />
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ManageModal: Machine Category ── */}
      <ManageModal
        open={manageModal === 'category'}
        onClose={() => setManageModal(null)}
        title="Manage Machine Categories"
        items={categories.map((c) => ({ id: c.id, name: c.name }))}
        isLoading={categoriesLoading}
        createFields={[
          { key: 'name', label: 'Name', placeholder: 'e.g. CNC', required: true },
        ]}
        onCreate={async (values) => {
          const res = await createCategoryMutation.mutateAsync({ name: values.name });
          const newId = res?.data?.id;
          if (newId) setForm((p) => ({ ...p, categoryId: newId }));
        }}
        onUpdate={async (id, values) => {
          await updateCategoryMutation.mutateAsync({ id, data: { name: values.name } });
        }}
        onDelete={async (id) => {
          await deleteCategoryMutation.mutateAsync(id);
          if (form.categoryId === id) setForm((p) => ({ ...p, categoryId: '' }));
        }}
        isCreating={createCategoryMutation.isPending}
        isUpdating={updateCategoryMutation.isPending}
        isDeleting={deleteCategoryMutation.isPending}
      />

      {/* ── ManageModal: Machine Zone ── */}
      <ManageModal
        open={manageModal === 'zone'}
        onClose={() => setManageModal(null)}
        title="Manage Machine Zones"
        items={zones.map((z) => ({ id: z.id, name: z.name, code: z.code }))}
        isLoading={zonesLoading}
        createFields={[
          { key: 'name', label: 'Name', placeholder: 'e.g. Zone A', required: true },
          { key: 'code', label: 'Code', placeholder: 'e.g. ZN-A' },
        ]}
        onCreate={async (values) => {
          const res = await createZoneMutation.mutateAsync({ name: values.name, ...(values.code ? { code: values.code } : {}) });
          const newId = res?.data?.id;
          if (newId) setForm((p) => ({ ...p, zoneId: newId }));
        }}
        onUpdate={async (id, values) => {
          await updateZoneMutation.mutateAsync({ id, data: { name: values.name } });
        }}
        onDelete={async (id) => {
          await deleteZoneMutation.mutateAsync(id);
          if (form.zoneId === id) setForm((p) => ({ ...p, zoneId: '' }));
        }}
        isCreating={createZoneMutation.isPending}
        isUpdating={updateZoneMutation.isPending}
        isDeleting={deleteZoneMutation.isPending}
      />

      {/* ── ManageModal: Machine Type ── */}
      <ManageModal
        open={manageModal === 'type'}
        onClose={() => setManageModal(null)}
        title="Manage Machine Types"
        items={machineTypes.map((t) => ({ id: t.id, name: t.name }))}
        isLoading={typesLoading}
        createFields={[
          { key: 'name', label: 'Name', placeholder: 'e.g. Lathe', required: true },
        ]}
        onCreate={async (values) => {
          const res = await createTypeMutation.mutateAsync({ name: values.name });
          const newId = res?.data?.id;
          if (newId) setForm((p) => ({ ...p, typeId: newId }));
        }}
        onUpdate={async (id, values) => {
          await updateTypeMutation.mutateAsync({ id, data: { name: values.name } });
        }}
        onDelete={async (id) => {
          await deleteTypeMutation.mutateAsync(id);
          if (form.typeId === id) setForm((p) => ({ ...p, typeId: '' }));
        }}
        isCreating={createTypeMutation.isPending}
        isUpdating={updateTypeMutation.isPending}
        isDeleting={deleteTypeMutation.isPending}
      />

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Machine?</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              This will permanently delete <strong>{deleteTarget.assetName}</strong> ({deleteTarget.assetCode}). If this machine is referenced in slab configurations, the delete will fail.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
