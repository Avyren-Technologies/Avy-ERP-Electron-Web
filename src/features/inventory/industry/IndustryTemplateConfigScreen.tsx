import { useState, useMemo } from 'react';
import {
    Loader2, Factory, Pill, UtensilsCrossed, FlaskConical, Car, Cpu,
    Shirt, Hammer, Flame, Box, ShoppingCart, HardHat, Check, Copy,
    Zap, Eye, EyeOff, AlertCircle, ChevronRight, Database,
} from 'lucide-react';
import { useCanPerform } from '@/hooks/useCanPerform';
import { useIndustryTemplates, useIndustryTemplate } from '@/features/inventory/api/use-inventory-queries';
import {
    useActivateIndustryTemplate,
    useCloneIndustryTemplate,
    useUpdateFieldConfig,
    useSeedIndustryTemplates,
} from '@/features/inventory/api/use-inventory-mutations';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/lib/toast';

type FilterType = 'all' | 'system' | 'custom';
type DetailTab = 'overview' | 'fields' | 'defaults';

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    pharma: Pill,
    food: UtensilsCrossed,
    chemicals: FlaskConical,
    automotive: Car,
    electronics: Cpu,
    textile: Shirt,
    steel: Hammer,
    foundry: Flame,
    plastics: Box,
    fmcg: ShoppingCart,
    engineering: HardHat,
};

const FEFO_COLORS: Record<string, string> = {
    OFF: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    SOFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function getIndustryIcon(industry: string) {
    const key = (industry || '').toLowerCase().replace(/[_\s-]/g, '');
    return INDUSTRY_ICONS[key] || Factory;
}

export function IndustryTemplateConfigScreen() {
    const canConfigure = useCanPerform('inventory.config:configure');
    const [selectedId, setSelectedId] = useState<string>('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');
    const [cloneModal, setCloneModal] = useState(false);
    const [cloneName, setCloneName] = useState('');

    const { data: templatesData, isLoading } = useIndustryTemplates();
    const templates: any[] = templatesData?.data || [];

    const { data: detailData, isLoading: detailLoading } = useIndustryTemplate(selectedId);
    const detail: any = detailData?.data || null;

    const activateMutation = useActivateIndustryTemplate();
    const cloneMutation = useCloneIndustryTemplate();
    const updateFieldMutation = useUpdateFieldConfig();
    const seedMutation = useSeedIndustryTemplates();

    const filtered = useMemo(() => {
        if (filter === 'system') return templates.filter((t: any) => t.isSystem);
        if (filter === 'custom') return templates.filter((t: any) => !t.isSystem);
        return templates;
    }, [templates, filter]);

    const handleActivate = (id: string) => {
        activateMutation.mutate(id);
    };

    const handleClone = () => {
        if (!selectedId || !cloneName.trim()) return;
        cloneMutation.mutate({ id: selectedId, data: { displayName: cloneName.trim() } }, {
            onSuccess: () => { setCloneModal(false); setCloneName(''); },
        });
    };

    const handleFieldToggle = (fieldId: string, field: string, value: boolean) => {
        if (!selectedId) return;
        updateFieldMutation.mutate({ templateId: selectedId, fieldId, data: { [field]: value } });
    };

    const inputClass = 'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none';

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Industry Templates</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure industry-specific field visibility, defaults, and compliance requirements</p>
                </div>
                {canConfigure && (
                    <button
                        onClick={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Seed System Templates
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-60"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
                <div className="grid grid-cols-12 gap-6">
                    {/* Left: Template List */}
                    <div className="col-span-4 space-y-4">
                        {/* Filter tabs */}
                        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            {(['all', 'system', 'custom'] as FilterType[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={cn('flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize', filter === f ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Template cards */}
                        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                            {filtered.length === 0 && (
                                <div className="text-center py-12">
                                    <Factory className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-400">No templates found</p>
                                </div>
                            )}
                            {filtered.map((t: any) => {
                                const Icon = getIndustryIcon(t.industryType);
                                const isActive = t.isActive;
                                const isSelected = selectedId === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedId(t.id); setDetailTab('overview'); }}
                                        className={cn(
                                            'w-full text-left p-4 rounded-xl border transition-all',
                                            isSelected ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-300' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300',
                                            isActive && !isSelected && 'border-indigo-300 dark:border-indigo-700',
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn('p-2 rounded-lg', isActive ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-neutral-100 dark:bg-neutral-800')}>
                                                <Icon className={cn('w-5 h-5', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500')} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{t.displayName || t.industryType}</p>
                                                    {isActive && <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded">Active</span>}
                                                </div>
                                                <p className="text-xs text-neutral-500 truncate mt-0.5">{t.description || '--'}</p>
                                                <span className={cn('inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded', t.isSystem ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400')}>
                                                    {t.isSystem ? 'System' : 'Custom'}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0 mt-1" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Template Detail */}
                    <div className="col-span-8">
                        {!selectedId ? (
                            <div className="flex items-center justify-center h-80 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
                                <div className="text-center">
                                    <Factory className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                                    <p className="text-sm text-neutral-400">Select a template to view details</p>
                                </div>
                            </div>
                        ) : detailLoading ? (
                            <div className="flex items-center justify-center h-80"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                        ) : detail ? (
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                                {/* Detail Header */}
                                <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {(() => { const Icon = getIndustryIcon(detail.industryType); return <Icon className="w-6 h-6 text-primary-500" />; })()}
                                            <div>
                                                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{detail.displayName || detail.industryType}</h2>
                                                <p className="text-xs text-neutral-500">{detail.industryType} template</p>
                                            </div>
                                        </div>
                                        {canConfigure && (
                                            <div className="flex items-center gap-2">
                                                {!detail.isActive && (
                                                    <button
                                                        onClick={() => handleActivate(detail.id)}
                                                        disabled={activateMutation.isPending}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {activateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                                        Activate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setCloneName(`${detail.displayName} (Copy)`); setCloneModal(true); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> Clone to Custom
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                    {(['overview', 'fields', 'defaults'] as DetailTab[]).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setDetailTab(tab)}
                                            className={cn(
                                                'px-5 py-3 text-sm font-semibold transition-colors capitalize border-b-2',
                                                detailTab === tab ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-700',
                                            )}
                                        >
                                            {tab === 'fields' ? 'Field Configuration' : tab === 'defaults' ? 'Defaults' : 'Overview'}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-5 max-h-[calc(100vh-420px)] overflow-y-auto">
                                    {detailTab === 'overview' && <OverviewTab detail={detail} />}
                                    {detailTab === 'fields' && <FieldConfigTab detail={detail} canEdit={canConfigure && !detail.isSystem} onToggle={handleFieldToggle} />}
                                    {detailTab === 'defaults' && <DefaultsTab detail={detail} />}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Clone Modal */}
            {cloneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Clone Template</h3>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">New Template Name</label>
                        <input className={inputClass} value={cloneName} onChange={e => setCloneName(e.target.value)} placeholder="Custom template name" />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setCloneModal(false)} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800">Cancel</button>
                            <button
                                onClick={handleClone}
                                disabled={cloneMutation.isPending || !cloneName.trim()}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                            >
                                {cloneMutation.isPending ? 'Cloning...' : 'Clone'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Overview Tab ──

function OverviewTab({ detail }: { detail: any }) {
    return (
        <div className="space-y-6">
            {/* Description */}
            <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{detail.description || 'No description'}</p>
            </div>

            {/* Extensions */}
            <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Extensions</h4>
                <div className="flex gap-3">
                    <ExtBadge label="Production" enabled={detail.enableProduction} />
                    <ExtBadge label="Tool Room" enabled={detail.enableToolRoom} />
                </div>
            </div>

            {/* FEFO */}
            <div>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">FEFO Enforcement</h4>
                <span className={cn('px-2.5 py-1 text-xs font-bold rounded-full', FEFO_COLORS[detail.fefoEnforcement || 'OFF'])}>
                    {detail.fefoEnforcement || 'OFF'}
                </span>
            </div>

            {/* Activated Statuses */}
            {detail.activatedStatuses?.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Activated Statuses</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {detail.activatedStatuses.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Activated Reports */}
            {detail.activatedReports?.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Activated Reports</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {detail.activatedReports.map((r: string) => (
                            <span key={r} className="px-2 py-0.5 text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 rounded">{r}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ExtBadge({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold', enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800')}>
            {enabled ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {label}
        </div>
    );
}

// ── Field Configuration Tab ──

function FieldConfigTab({ detail, canEdit, onToggle }: { detail: any; canEdit: boolean; onToggle: (fieldId: string, field: string, value: boolean) => void }) {
    const fields: any[] = detail.fieldConfigs || [];

    if (fields.length === 0) {
        return (
            <div className="text-center py-12">
                <Eye className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No field configurations found</p>
            </div>
        );
    }

    // Group by section
    const sections = fields.reduce((acc: Record<string, any[]>, f: any) => {
        const sec = f.sectionName || 'General';
        if (!acc[sec]) acc[sec] = [];
        acc[sec].push(f);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {!canEdit && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">System templates are read-only. Clone to a custom template to edit.</p>
                </div>
            )}
            {Object.entries(sections).map(([sectionName, sectionFields]) => (
                <div key={sectionName}>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{sectionName}</h4>
                    <div className="overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Field</th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-24">Visible</th>
                                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-24">Mandatory</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Default Value</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Validation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(sectionFields as any[]).map((f: any) => (
                                    <tr key={f.id} className="border-b border-neutral-50 dark:border-neutral-800/50">
                                        <td className="px-4 py-2.5">
                                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{f.fieldName}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <ToggleSwitch checked={f.isVisible} onChange={v => onToggle(f.id, 'isVisible', v)} disabled={!canEdit} />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <ToggleSwitch checked={f.isMandatory} onChange={v => onToggle(f.id, 'isMandatory', v)} disabled={!canEdit} />
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-mono">{f.defaultValue || '--'}</td>
                                        <td className="px-4 py-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-mono">{f.validationRule || '--'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
                checked ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700',
                disabled && 'opacity-50 cursor-not-allowed',
            )}
        >
            <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
        </button>
    );
}

// ── Defaults Tab ──

function DefaultsTab({ detail }: { detail: any }) {
    const overrides = detail.defaultItemPolicyOverrides || {};
    const entries = Object.entries(overrides);

    const defaultKeys = [
        { key: 'lotTracking', label: 'Lot Tracking' },
        { key: 'serialTracking', label: 'Serial Tracking' },
        { key: 'expiryTracking', label: 'Expiry Tracking' },
        { key: 'issueRule', label: 'Issue Rule' },
        { key: 'qcOnReceipt', label: 'QC on Receipt' },
        { key: 'qcOnFG', label: 'QC on FG' },
    ];

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Default Item Policy Overrides</h4>
            {entries.length === 0 ? (
                <p className="text-sm text-neutral-400">No defaults configured for this template</p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {defaultKeys.map(({ key, label }) => {
                        const value = overrides[key];
                        if (value === undefined) return null;
                        return (
                            <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                                {typeof value === 'boolean' ? (
                                    <span className={cn('px-2 py-0.5 text-xs font-bold rounded', value ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500')}>
                                        {value ? 'ON' : 'OFF'}
                                    </span>
                                ) : (
                                    <span className="text-sm font-mono font-semibold text-neutral-800 dark:text-neutral-200">{String(value)}</span>
                                )}
                            </div>
                        );
                    })}
                    {/* Show remaining overrides not in defaultKeys */}
                    {entries.filter(([k]) => !defaultKeys.some(d => d.key === k)).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{key}</span>
                            <span className="text-sm font-mono font-semibold text-neutral-800 dark:text-neutral-200">{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
