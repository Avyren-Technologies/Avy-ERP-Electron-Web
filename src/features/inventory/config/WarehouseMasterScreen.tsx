import { useState } from 'react';
import { Loader2, Plus, Warehouse, MapPin, Grid3X3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useWarehouses, useZones, useBins } from '@/features/inventory/api/use-inventory-queries';
import {
    useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse,
    useCreateZone, useUpdateZone, useDeleteZone,
    useCreateBin, useUpdateBin, useDeleteBin,
} from '@/features/inventory/api/use-inventory-mutations';

/* ── Constants ── */

const TABS = [
    { key: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { key: 'zones', label: 'Zones', icon: MapPin },
    { key: 'bins', label: 'Bins', icon: Grid3X3 },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const WAREHOUSE_TYPES = [
    { value: 'MAIN', label: 'Main' },
    { value: 'TRANSIT', label: 'Transit' },
    { value: 'QC', label: 'Quality Control' },
    { value: 'STAGING', label: 'Staging' },
    { value: 'VIRTUAL', label: 'Virtual' },
];

const ZONE_TYPES = [
    { value: 'STORAGE', label: 'Storage' },
    { value: 'RECEIVING', label: 'Receiving' },
    { value: 'SHIPPING', label: 'Shipping' },
    { value: 'STAGING', label: 'Staging' },
    { value: 'QC', label: 'Quality Control' },
    { value: 'QUARANTINE', label: 'Quarantine' },
];

/* ── Main Screen ── */

export function WarehouseMasterScreen() {
    const canCreate = useCanPerform('inventory.masters:create');
    const [tab, setTab] = useState<TabKey>('warehouses');

    return (
        <div className="flex-1 p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Warehouse Management</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage warehouses, zones, and bin locations</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            tab === t.key
                                ? 'bg-white dark:bg-neutral-900 text-primary-700 dark:text-primary-400 shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'warehouses' && <WarehousesTab canCreate={canCreate} />}
            {tab === 'zones' && <ZonesTab canCreate={canCreate} />}
            {tab === 'bins' && <BinsTab canCreate={canCreate} />}
        </div>
    );
}

/* ── Warehouses Tab ── */

function WarehousesTab({ canCreate }: { canCreate: boolean }) {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useWarehouses();
    const createMutation = useCreateWarehouse();
    const updateMutation = useUpdateWarehouse();
    const deleteMutation = useDeleteWarehouse();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ code: '', name: '', type: 'MAIN', addressLine1: '', city: '', isActive: true });

    const warehouses = (data?.data || []).filter((w: any) =>
        !search || w.code?.toLowerCase().includes(search.toLowerCase()) || w.name?.toLowerCase().includes(search.toLowerCase()),
    );

    const openCreate = () => { setEditing(null); setForm({ code: '', name: '', type: 'MAIN', addressLine1: '', city: '', isActive: true }); setShowModal(true); };
    const openEdit = (w: any) => {
        setEditing(w);
        setForm({ code: w.code, name: w.name, type: w.type || 'MAIN', addressLine1: w.addressLine1 || '', city: w.city || '', isActive: w.isActive ?? true });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: form }, { onSuccess: () => setShowModal(false) });
        } else {
            createMutation.mutate(form, { onSuccess: () => setShowModal(false) });
        }
    };

    const handleDelete = (id: string) => { if (window.confirm('Delete this warehouse?')) deleteMutation.mutate(id); };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                        placeholder="Search warehouses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Warehouse
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Location</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                            {canCreate && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {warehouses.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No warehouses found</td></tr>
                        )}
                        {warehouses.map((w: any) => (
                            <tr key={w.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{w.code}</td>
                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{w.name}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{w.type}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{[w.city, w.addressLine1].filter(Boolean).join(', ') || '--'}</td>
                                <td className="px-4 py-3 text-center"><span className={cn('inline-block w-2 h-2 rounded-full', w.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} /></td>
                                {canCreate && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(w)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(w.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-lg p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editing ? 'Edit' : 'Add'} Warehouse</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Code *</label>
                                    <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WH-001" disabled={!!editing} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Type *</label>
                                    <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        {WAREHOUSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Name *</label>
                                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Main Warehouse" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Address</label>
                                    <input className={inputClass} value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} placeholder="Street address" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">City</label>
                                    <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-neutral-300" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!form.code || !form.name || createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Zones Tab ── */

function ZonesTab({ canCreate }: { canCreate: boolean }) {
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const { data: whData } = useWarehouses();
    const { data: zonesData, isLoading } = useZones(warehouseFilter ? { warehouseId: warehouseFilter } : undefined);
    const createMutation = useCreateZone();
    const updateMutation = useUpdateZone();
    const deleteMutation = useDeleteZone();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ code: '', name: '', warehouseId: '', zoneType: 'STORAGE', isActive: true });

    const warehouses = whData?.data || [];
    const zones = zonesData?.data || [];

    const openCreate = () => { setEditing(null); setForm({ code: '', name: '', warehouseId: warehouseFilter, zoneType: 'STORAGE', isActive: true }); setShowModal(true); };
    const openEdit = (z: any) => {
        setEditing(z);
        setForm({ code: z.code, name: z.name, warehouseId: z.warehouseId, zoneType: z.zoneType || 'STORAGE', isActive: z.isActive ?? true });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: form }, { onSuccess: () => setShowModal(false) });
        } else {
            createMutation.mutate(form, { onSuccess: () => setShowModal(false) });
        }
    };

    const handleDelete = (id: string) => { if (window.confirm('Delete this zone?')) deleteMutation.mutate(id); };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={warehouseFilter}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                >
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                <div className="flex-1" />
                {canCreate && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Zone
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Warehouse</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                            {canCreate && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {zones.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No zones found</td></tr>
                        )}
                        {zones.map((z: any) => (
                            <tr key={z.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{z.code}</td>
                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{z.name}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{z.warehouse?.code || '--'}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{z.zoneType}</td>
                                <td className="px-4 py-3 text-center"><span className={cn('inline-block w-2 h-2 rounded-full', z.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} /></td>
                                {canCreate && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(z)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(z.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editing ? 'Edit' : 'Add'} Zone</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Warehouse *</label>
                                <select className={inputClass} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} disabled={!!editing}>
                                    <option value="">Select warehouse</option>
                                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Code *</label>
                                    <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Z-001" disabled={!!editing} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Type</label>
                                    <select className={inputClass} value={form.zoneType} onChange={(e) => setForm({ ...form, zoneType: e.target.value })}>
                                        {ZONE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Name *</label>
                                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zone A - Raw Materials" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-neutral-300" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!form.code || !form.name || !form.warehouseId || createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Bins Tab ── */

function BinsTab({ canCreate }: { canCreate: boolean }) {
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const { data: whData } = useWarehouses();
    const { data: zonesData } = useZones(warehouseFilter ? { warehouseId: warehouseFilter } : undefined);
    const { data: binsData, isLoading } = useBins(
        zoneFilter ? { zoneId: zoneFilter } : warehouseFilter ? { warehouseId: warehouseFilter } : undefined,
    );
    const createMutation = useCreateBin();
    const updateMutation = useUpdateBin();
    const deleteMutation = useDeleteBin();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ code: '', name: '', zoneId: '', maxCapacity: '', isActive: true });

    const warehouses = whData?.data || [];
    const zones = zonesData?.data || [];
    const bins = binsData?.data || [];

    const openCreate = () => { setEditing(null); setForm({ code: '', name: '', zoneId: zoneFilter, maxCapacity: '', isActive: true }); setShowModal(true); };
    const openEdit = (b: any) => {
        setEditing(b);
        setForm({ code: b.code, name: b.name, zoneId: b.zoneId, maxCapacity: b.maxCapacity ? String(b.maxCapacity) : '', isActive: b.isActive ?? true });
        setShowModal(true);
    };

    const handleSave = () => {
        const payload = { ...form, maxCapacity: form.maxCapacity ? parseFloat(form.maxCapacity) : null };
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: () => setShowModal(false) });
        } else {
            createMutation.mutate(payload, { onSuccess: () => setShowModal(false) });
        }
    };

    const handleDelete = (id: string) => { if (window.confirm('Delete this bin?')) deleteMutation.mutate(id); };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={warehouseFilter}
                    onChange={(e) => { setWarehouseFilter(e.target.value); setZoneFilter(''); }}
                >
                    <option value="">All warehouses</option>
                    {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                <select
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 outline-none"
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    disabled={!warehouseFilter}
                >
                    <option value="">All zones</option>
                    {zones.map((z: any) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                </select>
                <div className="flex-1" />
                {canCreate && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Bin
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Zone</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Max Capacity</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                            {canCreate && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {bins.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No bins found</td></tr>
                        )}
                        {bins.map((b: any) => (
                            <tr key={b.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{b.code}</td>
                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{b.name}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{b.zone?.code || '--'}</td>
                                <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{b.maxCapacity != null ? Number(b.maxCapacity).toLocaleString() : '--'}</td>
                                <td className="px-4 py-3 text-center"><span className={cn('inline-block w-2 h-2 rounded-full', b.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} /></td>
                                {canCreate && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(b)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(b.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editing ? 'Edit' : 'Add'} Bin</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Zone *</label>
                                <select className={inputClass} value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} disabled={!!editing}>
                                    <option value="">Select zone</option>
                                    {zones.map((z: any) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Code *</label>
                                    <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="B-001" disabled={!!editing} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Max Capacity</label>
                                    <input type="number" className={inputClass} value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} placeholder="Optional" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Name *</label>
                                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bin A1 Row 1" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-neutral-300" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!form.code || !form.name || !form.zoneId || createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
