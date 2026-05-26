import { useState, useEffect } from 'react';
import { Loader2, Save, Settings, Shield, ListChecks, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanPerform } from '@/hooks/useCanPerform';
import { showSuccess, showApiError } from '@/lib/toast';
import { useInventoryConfig, useReasonCodes, useApprovalThresholds } from '@/features/inventory/api/use-inventory-queries';
import {
    useUpdateInventoryConfig,
    useCreateReasonCode, useUpdateReasonCode, useDeleteReasonCode,
    useCreateApprovalThreshold, useUpdateApprovalThreshold, useDeleteApprovalThreshold,
} from '@/features/inventory/api/use-inventory-mutations';

/* ── Constants ── */

const ISSUE_RULES = [
    { value: 'FIFO', label: 'FIFO (First In, First Out)' },
    { value: 'LIFO', label: 'LIFO (Last In, First Out)' },
    { value: 'FEFO', label: 'FEFO (First Expiry, First Out)' },
];

const TABS = [
    { key: 'general', label: 'General Settings', icon: Settings },
    { key: 'reason-codes', label: 'Reason Codes', icon: Tag },
    { key: 'thresholds', label: 'Approval Thresholds', icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ── Config Form Types ── */

interface ConfigForm {
    defaultIssueRule: string;
    autoProvisionVirtualLocations: boolean;
    nearExpiryDays: string;
    blockedStockAgingDays: string;
    countTolerancePct: string;
}

const EMPTY_CONFIG: ConfigForm = {
    defaultIssueRule: 'FIFO',
    autoProvisionVirtualLocations: false,
    nearExpiryDays: '30',
    blockedStockAgingDays: '90',
    countTolerancePct: '2',
};

/* ── Section Component ── */

function ConfigSection({ icon: Icon, title, description, children }: {
    icon: typeof Settings; title: string; description?: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                    {description && <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

/* ── Input helpers ── */

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
                {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

/* ── Main Screen ── */

export function InventoryConfigScreen() {
    const canConfigure = useCanPerform('inventory.config:configure');
    const [tab, setTab] = useState<TabKey>('general');
    const [form, setForm] = useState<ConfigForm>(EMPTY_CONFIG);
    const { data: configData, isLoading } = useInventoryConfig();
    const updateConfig = useUpdateInventoryConfig();

    useEffect(() => {
        const cfg = configData?.data;
        if (cfg) {
            setForm({
                defaultIssueRule: cfg.defaultIssueRule || 'FIFO',
                autoProvisionVirtualLocations: cfg.autoProvisionVirtualLocations ?? false,
                nearExpiryDays: String(cfg.nearExpiryDays ?? 30),
                blockedStockAgingDays: String(cfg.blockedStockAgingDays ?? 90),
                countTolerancePct: String(cfg.countTolerancePct ?? 2),
            });
        }
    }, [configData]);

    const handleSave = () => {
        updateConfig.mutate({
            defaultIssueRule: form.defaultIssueRule,
            autoProvisionVirtualLocations: form.autoProvisionVirtualLocations,
            nearExpiryDays: parseInt(form.nearExpiryDays) || 30,
            blockedStockAgingDays: parseInt(form.blockedStockAgingDays) || 90,
            countTolerancePct: parseFloat(form.countTolerancePct) || 2,
        });
    };

    const inputClass = 'w-24 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-right text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';
    const selectClass = 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Inventory Configuration</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage module settings, reason codes, and approval thresholds</p>
                </div>
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

            {/* General Settings Tab */}
            {tab === 'general' && (
                <div className="space-y-4">
                    <ConfigSection icon={Settings} title="Issue & Provisioning" description="Default stock issue rules and virtual location settings">
                        <FieldRow label="Default Issue Rule" description="How stock is consumed when no explicit rule is set">
                            <select
                                className={selectClass}
                                value={form.defaultIssueRule}
                                onChange={(e) => setForm({ ...form, defaultIssueRule: e.target.value })}
                                disabled={!canConfigure}
                            >
                                {ISSUE_RULES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </FieldRow>
                        <FieldRow label="Auto-Provision Virtual Locations" description="Automatically create IN_TRANSIT, QC_HOLD, STAGING zones per warehouse">
                            <button
                                onClick={() => setForm({ ...form, autoProvisionVirtualLocations: !form.autoProvisionVirtualLocations })}
                                disabled={!canConfigure}
                                className={cn(
                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                                    form.autoProvisionVirtualLocations ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700',
                                )}
                            >
                                <span className={cn(
                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                                    form.autoProvisionVirtualLocations ? 'translate-x-5' : 'translate-x-0',
                                )} />
                            </button>
                        </FieldRow>
                    </ConfigSection>

                    <ConfigSection icon={ListChecks} title="Alerting & Tolerance" description="Thresholds for near-expiry warnings, aging, and count tolerance">
                        <FieldRow label="Near Expiry Days" description="Number of days before expiry to flag items as near-expiry">
                            <input
                                type="number"
                                className={inputClass}
                                value={form.nearExpiryDays}
                                onChange={(e) => setForm({ ...form, nearExpiryDays: e.target.value })}
                                disabled={!canConfigure}
                                min={1}
                            />
                        </FieldRow>
                        <FieldRow label="Blocked Stock Aging Days" description="Days after which blocked stock is flagged for review">
                            <input
                                type="number"
                                className={inputClass}
                                value={form.blockedStockAgingDays}
                                onChange={(e) => setForm({ ...form, blockedStockAgingDays: e.target.value })}
                                disabled={!canConfigure}
                                min={1}
                            />
                        </FieldRow>
                        <FieldRow label="Count Tolerance %" description="Acceptable variance percentage during stock counts">
                            <input
                                type="number"
                                className={inputClass}
                                value={form.countTolerancePct}
                                onChange={(e) => setForm({ ...form, countTolerancePct: e.target.value })}
                                disabled={!canConfigure}
                                min={0}
                                step={0.1}
                            />
                        </FieldRow>
                    </ConfigSection>

                    {/* Save button */}
                    {canConfigure && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={updateConfig.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {updateConfig.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Reason Codes Tab */}
            {tab === 'reason-codes' && <ReasonCodesTab canConfigure={canConfigure} />}

            {/* Approval Thresholds Tab */}
            {tab === 'thresholds' && <ApprovalThresholdsTab canConfigure={canConfigure} />}
        </div>
    );
}

/* ── Reason Codes Tab ── */

function ReasonCodesTab({ canConfigure }: { canConfigure: boolean }) {
    const { data: reasonCodesData, isLoading } = useReasonCodes();
    const createMutation = useCreateReasonCode();
    const updateMutation = useUpdateReasonCode();
    const deleteMutation = useDeleteReasonCode();

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formData, setFormData] = useState({ code: '', description: '', transactionType: '', isActive: true });

    const reasonCodes = reasonCodesData?.data || [];

    const openCreate = () => {
        setEditing(null);
        setFormData({ code: '', description: '', transactionType: '', isActive: true });
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setEditing(item);
        setFormData({
            code: item.code || '',
            description: item.description || '',
            transactionType: item.transactionType || '',
            isActive: item.isActive ?? true,
        });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData }, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            createMutation.mutate(formData, {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this reason code?')) {
            deleteMutation.mutate(id);
        }
    };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) {
        return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">Reason codes used for adjustments, status changes, and other transactions.</p>
                {canConfigure && (
                    <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        Add Reason Code
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Code</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Description</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction Type</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                            {canConfigure && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {reasonCodes.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-neutral-400">No reason codes configured</td></tr>
                        )}
                        {reasonCodes.map((rc: any) => (
                            <tr key={rc.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{rc.code}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{rc.description}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{rc.transactionType || '--'}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={cn('inline-block w-2 h-2 rounded-full', rc.isActive ? 'bg-emerald-500' : 'bg-neutral-300')} />
                                </td>
                                {canConfigure && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(rc)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(rc.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editing ? 'Edit' : 'Add'} Reason Code</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Code *</label>
                                <input className={inputClass} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="ADJ-DAMAGE" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Description *</label>
                                <input className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Damaged goods adjustment" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Transaction Type</label>
                                <select className={inputClass} value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}>
                                    <option value="">All types</option>
                                    <option value="ADJUSTMENT">Adjustment</option>
                                    <option value="STATUS_CHANGE">Status Change</option>
                                    <option value="WRITE_OFF">Write Off</option>
                                    <option value="CUSTOMER_RETURN">Customer Return</option>
                                    <option value="VENDOR_RETURN">Vendor Return</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-neutral-300" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.code || !formData.description || createMutation.isPending || updateMutation.isPending}
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

/* ── Approval Thresholds Tab ── */

function ApprovalThresholdsTab({ canConfigure }: { canConfigure: boolean }) {
    const { data: thresholdsData, isLoading } = useApprovalThresholds();
    const createMutation = useCreateApprovalThreshold();
    const updateMutation = useUpdateApprovalThreshold();
    const deleteMutation = useDeleteApprovalThreshold();

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formData, setFormData] = useState({ transactionType: '', minQty: '', maxQty: '', requiresApproval: true });

    const thresholds = thresholdsData?.data || [];

    const openCreate = () => {
        setEditing(null);
        setFormData({ transactionType: '', minQty: '', maxQty: '', requiresApproval: true });
        setShowModal(true);
    };

    const openEdit = (item: any) => {
        setEditing(item);
        setFormData({
            transactionType: item.transactionType || '',
            minQty: String(item.minQty ?? ''),
            maxQty: String(item.maxQty ?? ''),
            requiresApproval: item.requiresApproval ?? true,
        });
        setShowModal(true);
    };

    const handleSave = () => {
        const payload = {
            transactionType: formData.transactionType,
            minQty: formData.minQty ? parseFloat(formData.minQty) : null,
            maxQty: formData.maxQty ? parseFloat(formData.maxQty) : null,
            requiresApproval: formData.requiresApproval,
        };
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: () => setShowModal(false) });
        } else {
            createMutation.mutate(payload, { onSuccess: () => setShowModal(false) });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this threshold?')) {
            deleteMutation.mutate(id);
        }
    };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    if (isLoading) {
        return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">Configure quantity thresholds that trigger approval requirements.</p>
                {canConfigure && (
                    <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        Add Threshold
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Transaction Type</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Min Qty</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Max Qty</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Requires Approval</th>
                            {canConfigure && <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {thresholds.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-neutral-400">No approval thresholds configured</td></tr>
                        )}
                        {thresholds.map((t: any) => (
                            <tr key={t.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{t.transactionType}</td>
                                <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{t.minQty != null ? Number(t.minQty).toLocaleString() : '--'}</td>
                                <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">{t.maxQty != null ? Number(t.maxQty).toLocaleString() : '--'}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={cn('inline-block w-2 h-2 rounded-full', t.requiresApproval ? 'bg-amber-500' : 'bg-neutral-300')} />
                                </td>
                                {canConfigure && (
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => openEdit(t)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
                                        <button onClick={() => handleDelete(t.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editing ? 'Edit' : 'Add'} Approval Threshold</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Transaction Type *</label>
                                <select className={inputClass} value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}>
                                    <option value="">Select type</option>
                                    <option value="ADJUSTMENT">Adjustment</option>
                                    <option value="WRITE_OFF">Write Off</option>
                                    <option value="STATUS_CHANGE">Status Change</option>
                                    <option value="STOCK_MOVE">Stock Move</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Min Qty</label>
                                    <input type="number" className={inputClass} value={formData.minQty} onChange={(e) => setFormData({ ...formData, minQty: e.target.value })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Max Qty</label>
                                    <input type="number" className={inputClass} value={formData.maxQty} onChange={(e) => setFormData({ ...formData, maxQty: e.target.value })} placeholder="No limit" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.requiresApproval} onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })} className="rounded border-neutral-300" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Requires Approval</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.transactionType || createMutation.isPending || updateMutation.isPending}
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
