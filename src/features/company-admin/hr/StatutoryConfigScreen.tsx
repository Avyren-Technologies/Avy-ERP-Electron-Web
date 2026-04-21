import { useState, useEffect } from "react";
import {
    Shield,
    Loader2,
    Plus,
    Trash2,
    AlertTriangle,
    Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    usePFConfig,
    useESIConfig,
    usePTConfigs,
    useGratuityConfig,
    useBonusConfig,
    useLWFConfigs,
} from "@/features/company-admin/api/use-payroll-queries";
import {
    useUpdatePFConfig,
    useUpdateESIConfig,
    useCreatePTConfig,
    useUpdatePTConfig,
    useDeletePTConfig,
    useUpdateGratuityConfig,
    useUpdateBonusConfig,
    useCreateLWFConfig,
    useUpdateLWFConfig,
    useDeleteLWFConfig,
} from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared atoms ── */

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button type="button" onClick={() => onChange(!checked)} className={cn("w-10 h-6 rounded-full transition-colors relative", checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
        </div>
    );
}

function NumRow({ label, value, onChange, suffix, min, max }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number }) {
    return (
        <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</p>
            <div className="flex items-center gap-2">
                <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} className="w-24 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                {suffix && <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 w-6">{suffix}</span>}
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
        </div>
    );
}

function SaveButton({ onClick, loading, label = "Save" }: { onClick: () => void; loading: boolean; label?: string }) {
    return (
        <button onClick={onClick} disabled={loading} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Saving..." : label}
        </button>
    );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string; size?: number }>; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-primary-600" />
                    </div>
                    <h3 className="text-sm font-bold text-primary-950 dark:text-white">{title}</h3>
                </div>
                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ── Indian States ── */

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
];

function formatFinancialYear(startYear: number): string {
    const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
    return `${startYear}-${endYearShort}`;
}

function getFinancialYearOptions(selectedFinancialYear?: string) {
    const currentYear = new Date().getFullYear();
    const fiscalYearStart = new Date().getMonth() >= 3 ? currentYear : currentYear - 1;
    const options: { value: string; label: string }[] = [{ value: "", label: "Select Financial Year" }];

    for (let start = fiscalYearStart - 4; start <= fiscalYearStart + 5; start += 1) {
        const fy = formatFinancialYear(start);
        options.push({ value: fy, label: fy });
    }

    if (selectedFinancialYear && !options.some((o) => o.value === selectedFinancialYear)) {
        options.push({ value: selectedFinancialYear, label: selectedFinancialYear });
    }

    return options;
}

/* ── Screen ── */

export function StatutoryConfigScreen() {
    const pfQuery = usePFConfig();
    const esiQuery = useESIConfig();
    const ptQuery = usePTConfigs();
    const gratuityQuery = useGratuityConfig();
    const bonusQuery = useBonusConfig();
    const lwfQuery = useLWFConfigs();

    const updatePF = useUpdatePFConfig();
    const updateESI = useUpdateESIConfig();
    const createPT = useCreatePTConfig();
    const updatePT = useUpdatePTConfig();
    const deletePT = useDeletePTConfig();
    const updateGratuity = useUpdateGratuityConfig();
    const updateBonus = useUpdateBonusConfig();
    const createLWF = useCreateLWFConfig();
    const updateLWF = useUpdateLWFConfig();
    const deleteLWF = useDeleteLWFConfig();

    // PF state
    const [pf, setPF] = useState<Record<string, any>>({});
    useEffect(() => { if ((pfQuery.data as any)?.data) setPF({ ...(pfQuery.data as any).data }); }, [pfQuery.data]);

    // ESI state
    const [esi, setESI] = useState<Record<string, any>>({});
    useEffect(() => { if ((esiQuery.data as any)?.data) setESI({ ...(esiQuery.data as any).data }); }, [esiQuery.data]);

    // Gratuity state
    const [gratuity, setGratuity] = useState<Record<string, any>>({});
    useEffect(() => { if ((gratuityQuery.data as any)?.data) setGratuity({ ...(gratuityQuery.data as any).data }); }, [gratuityQuery.data]);

    // Bonus state
    const [bonus, setBonus] = useState<Record<string, any>>({});
    useEffect(() => { if ((bonusQuery.data as any)?.data) setBonus({ ...(bonusQuery.data as any).data }); }, [bonusQuery.data]);

    // PT state (array)
    const ptConfigs: any[] = ptQuery.data?.data ?? [];
    const [ptForm, setPTForm] = useState({ state: "", slabs: [{ fromAmount: 0, toAmount: 0, taxAmount: 0 }], financialYear: "", monthlyOverrides: {} as Record<string, number> });
    const [ptModalOpen, setPTModalOpen] = useState(false);
    const [ptEditId, setPTEditId] = useState<string | null>(null);

    // LWF state (array)
    const lwfConfigs: any[] = lwfQuery.data?.data ?? [];
    const [lwfForm, setLWFForm] = useState({ state: "", employeeAmount: 0, employerAmount: 0, frequency: "MONTHLY" });
    const [lwfModalOpen, setLWFModalOpen] = useState(false);
    const [lwfEditId, setLWFEditId] = useState<string | null>(null);

    const isLoading = pfQuery.isLoading || esiQuery.isLoading || ptQuery.isLoading || gratuityQuery.isLoading || bonusQuery.isLoading || lwfQuery.isLoading;
    const isError = pfQuery.isError || esiQuery.isError;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div><h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Statutory Configuration</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <AlertTriangle className="w-12 h-12 text-neutral-300" />
                <p className="text-lg font-bold text-primary-950 dark:text-white">Failed to load statutory configuration</p>
            </div>
        );
    }

    const savePF = async () => { try { await updatePF.mutateAsync(pf); showSuccess("PF Config Saved", "Provident Fund settings updated."); } catch (err) { showApiError(err); } };
    const saveESI = async () => { try { await updateESI.mutateAsync(esi); showSuccess("ESI Config Saved", "ESI settings updated."); } catch (err) { showApiError(err); } };
    const saveGratuity = async () => { try { await updateGratuity.mutateAsync(gratuity); showSuccess("Gratuity Config Saved", "Gratuity settings updated."); } catch (err) { showApiError(err); } };
    const saveBonus = async () => { try { await updateBonus.mutateAsync(bonus); showSuccess("Bonus Config Saved", "Bonus settings updated."); } catch (err) { showApiError(err); } };

    const openPTCreate = () => { setPTEditId(null); setPTForm({ state: "", slabs: [{ fromAmount: 0, toAmount: 0, taxAmount: 0 }], financialYear: "", monthlyOverrides: {} }); setPTModalOpen(true); };
    const openPTEdit = (pt: any) => { setPTEditId(pt.id); setPTForm({ state: pt.state ?? "", slabs: pt.slabs ?? [{ fromAmount: 0, toAmount: 0, taxAmount: 0 }], financialYear: pt.financialYear ?? "", monthlyOverrides: pt.monthlyOverrides ?? {} }); setPTModalOpen(true); };
    const savePT = async () => {
        try {
            if (ptEditId) { await updatePT.mutateAsync({ id: ptEditId, data: ptForm }); showSuccess("PT Config Updated", `${ptForm.state} PT updated.`); }
            else { await createPT.mutateAsync(ptForm); showSuccess("PT Config Created", `${ptForm.state} PT added.`); }
            setPTModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeletePT = async (id: string) => { try { await deletePT.mutateAsync(id); showSuccess("PT Config Deleted", "State PT config removed."); } catch (err) { showApiError(err); } };

    const openLWFCreate = () => { setLWFEditId(null); setLWFForm({ state: "", employeeAmount: 0, employerAmount: 0, frequency: "MONTHLY" }); setLWFModalOpen(true); };
    const openLWFEdit = (lwf: any) => { setLWFEditId(lwf.id); setLWFForm({ state: lwf.state ?? "", employeeAmount: lwf.employeeAmount ?? 0, employerAmount: lwf.employerAmount ?? 0, frequency: lwf.frequency ?? "MONTHLY" }); setLWFModalOpen(true); };
    const saveLWF = async () => {
        try {
            if (lwfEditId) { await updateLWF.mutateAsync({ id: lwfEditId, data: lwfForm }); showSuccess("LWF Config Updated", `${lwfForm.state} LWF updated.`); }
            else { await createLWF.mutateAsync(lwfForm); showSuccess("LWF Config Created", `${lwfForm.state} LWF added.`); }
            setLWFModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteLWF = async (id: string) => { try { await deleteLWF.mutateAsync(id); showSuccess("LWF Config Deleted", "State LWF config removed."); } catch (err) { showApiError(err); } };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Statutory Configuration</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure PF, ESI, PT, Gratuity, Bonus, and LWF settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PF Section */}
                <SectionCard title="Provident Fund (PF)" icon={Shield}>
                    <NumRow label="Employee Contribution Rate" value={pf.employeeRate ?? 12} onChange={(v) => setPF((p) => ({ ...p, employeeRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Employer EPF Rate" value={pf.employerEpfRate ?? 3.67} onChange={(v) => setPF((p) => ({ ...p, employerEpfRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Employer EPS Rate" value={pf.employerEpsRate ?? 8.33} onChange={(v) => setPF((p) => ({ ...p, employerEpsRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Employer EDLI Rate" value={pf.employerEdliRate ?? 0.5} onChange={(v) => setPF((p) => ({ ...p, employerEdliRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Admin Charge Rate" value={pf.adminChargeRate ?? 0.5} onChange={(v) => setPF((p) => ({ ...p, adminChargeRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="PF Wage Ceiling (₹)" value={pf.wageCeiling ?? 15000} onChange={(v) => setPF((p) => ({ ...p, wageCeiling: v }))} suffix="₹" min={0} />
                    <ToggleSwitch label="Allow Voluntary PF (VPF)" checked={pf.vpfEnabled ?? false} onChange={(v) => setPF((p) => ({ ...p, vpfEnabled: v }))} />
                    {pf.vpfEnabled && (
                        <div className="space-y-1">
                            <NumRow label="Maximum VPF Rate (%)" value={pf.vpfMaxRate ?? 0} onChange={(v) => setPF((p) => ({ ...p, vpfMaxRate: v }))} suffix="%" min={0} max={100} />
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 pl-1">Leave at 0 for no cap</p>
                        </div>
                    )}
                    <div className="pt-2 flex justify-end">
                        <SaveButton onClick={savePF} loading={updatePF.isPending} />
                    </div>
                </SectionCard>

                {/* ESI Section */}
                <SectionCard title="Employee State Insurance (ESI)" icon={Shield}>
                    <NumRow label="Employee Rate" value={esi.employeeRate ?? 0.75} onChange={(v) => setESI((p) => ({ ...p, employeeRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Employer Rate" value={esi.employerRate ?? 3.25} onChange={(v) => setESI((p) => ({ ...p, employerRate: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="ESI Wage Ceiling (₹)" value={esi.wageCeiling ?? 21000} onChange={(v) => setESI((p) => ({ ...p, wageCeiling: v }))} suffix="₹" min={0} />
                    <div className="pt-2 flex justify-end">
                        <SaveButton onClick={saveESI} loading={updateESI.isPending} />
                    </div>
                </SectionCard>

                {/* Gratuity Section */}
                <SectionCard title="Gratuity" icon={Shield}>
                    <SelectField label="Formula" value={gratuity.formula ?? "(lastBasic * 15 * yearsOfService) / 26"} onChange={(v) => setGratuity((p) => ({ ...p, formula: v }))} options={[{ value: "(lastBasic * 15 * yearsOfService) / 26", label: "Standard (15/26 * Last Drawn * Years)" }, { value: "custom", label: "Custom" }]} />
                    <SelectField label="Basis" value={gratuity.baseSalary ?? "Basic"} onChange={(v) => setGratuity((p) => ({ ...p, baseSalary: v }))} options={[{ value: "Basic + DA", label: "Basic + DA" }, { value: "Basic", label: "Basic Only" }, { value: "Gross", label: "Gross" }]} />
                    <NumRow label="Max Gratuity (₹)" value={gratuity.maxAmount ?? 2000000} onChange={(v) => setGratuity((p) => ({ ...p, maxAmount: v }))} suffix="₹" min={0} />
                    <SelectField label="Provision Method" value={gratuity.provisionMethod ?? "MONTHLY"} onChange={(v) => setGratuity((p) => ({ ...p, provisionMethod: v }))} options={[{ value: "MONTHLY", label: "Monthly Provision" }, { value: "ACTUAL_AT_EXIT", label: "Actual at Exit" }]} />
                    <ToggleSwitch label="Gratuity Trust exists" checked={gratuity.trustExists ?? false} onChange={(v) => setGratuity((p) => ({ ...p, trustExists: v }))} />
                    <div className="pt-2 flex justify-end">
                        <SaveButton onClick={saveGratuity} loading={updateGratuity.isPending} />
                    </div>
                </SectionCard>

                {/* Bonus Section */}
                <SectionCard title="Bonus" icon={Shield}>
                    <NumRow label="Bonus Wage Ceiling (₹)" value={bonus.wageCeiling ?? 7000} onChange={(v) => setBonus((p) => ({ ...p, wageCeiling: v }))} suffix="₹" min={0} />
                    <NumRow label="Minimum Bonus (%)" value={bonus.minBonusPercent ?? 8.33} onChange={(v) => setBonus((p) => ({ ...p, minBonusPercent: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Maximum Bonus (%)" value={bonus.maxBonusPercent ?? 20} onChange={(v) => setBonus((p) => ({ ...p, maxBonusPercent: v }))} suffix="%" min={0} max={100} />
                    <NumRow label="Eligibility (days)" value={bonus.eligibilityDays ?? 30} onChange={(v) => setBonus((p) => ({ ...p, eligibilityDays: v }))} suffix="days" min={0} />
                    <SelectField label="Bonus Period" value={bonus.calculationPeriod ?? "APR_MAR"} onChange={(v) => setBonus((p) => ({ ...p, calculationPeriod: v }))} options={[{ value: "APR_MAR", label: "Financial Year (Apr-Mar)" }, { value: "JAN_DEC", label: "Calendar Year (Jan-Dec)" }]} />
                    <div className="pt-2 flex justify-end">
                        <SaveButton onClick={saveBonus} loading={updateBonus.isPending} />
                    </div>
                </SectionCard>
            </div>

            {/* PT Section — Inline DataTable */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                <Shield size={16} className="text-primary-600" />
                            </div>
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">Professional Tax (PT) — By State</h3>
                        </div>
                        <button onClick={openPTCreate} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                            <Plus size={14} /> Add State
                        </button>
                    </div>
                    {ptConfigs.length === 0 ? (
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">No PT configurations added yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-3 px-4 font-bold">State</th>
                                        <th className="py-3 px-4 font-bold">FY</th>
                                        <th className="py-3 px-4 font-bold text-center">Slabs</th>
                                        <th className="py-3 px-4 font-bold text-center">Overrides</th>
                                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ptConfigs.map((pt: any) => (
                                        <tr key={pt.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-3 px-4 font-semibold text-primary-950 dark:text-white">{pt.state}</td>
                                            <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-xs">{pt.financialYear || "—"}</td>
                                            <td className="py-3 px-4 text-center text-neutral-600 dark:text-neutral-400">{(pt.slabs ?? []).length} slabs</td>
                                            <td className="py-3 px-4 text-center text-neutral-600 dark:text-neutral-400">{Object.keys(pt.monthlyOverrides ?? {}).length || "—"}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                     <button onClick={() => openPTEdit(pt)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Pencil size={14} /></button>
                                                     <button onClick={() => handleDeletePT(pt.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* LWF Section — Inline DataTable */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                <Shield size={16} className="text-primary-600" />
                            </div>
                            <h3 className="text-sm font-bold text-primary-950 dark:text-white">Labour Welfare Fund (LWF) — By State</h3>
                        </div>
                        <button onClick={openLWFCreate} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                            <Plus size={14} /> Add State
                        </button>
                    </div>
                    {lwfConfigs.length === 0 ? (
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">No LWF configurations added yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-3 px-4 font-bold">State</th>
                                        <th className="py-3 px-4 font-bold text-right">Employee (₹)</th>
                                        <th className="py-3 px-4 font-bold text-right">Employer (₹)</th>
                                        <th className="py-3 px-4 font-bold">Frequency</th>
                                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lwfConfigs.map((lwf: any) => (
                                        <tr key={lwf.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-3 px-4 font-semibold text-primary-950 dark:text-white">{lwf.state}</td>
                                            <td className="py-3 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{lwf.employeeAmount ?? 0}</td>
                                            <td className="py-3 px-4 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{lwf.employerAmount ?? 0}</td>
                                            <td className="py-3 px-4 text-xs capitalize text-neutral-600 dark:text-neutral-400">{lwf.frequency?.toLowerCase()?.replace(/_/g, " ")}</td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openLWFEdit(lwf)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Pencil size={14} /></button>
                                                    <button onClick={() => handleDeleteLWF(lwf.id)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PT Modal ── */}
            {ptModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{ptEditId ? "Edit PT Config" : "Add PT Config"}</h2>
                            <button onClick={() => setPTModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><Loader2 size={18} className="hidden" /><span className="text-lg">&times;</span></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField label="State" value={ptForm.state} onChange={(v) => setPTForm((p) => ({ ...p, state: v }))} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} />
                            <SelectField
                                label="Financial Year"
                                value={ptForm.financialYear}
                                onChange={(v) => setPTForm((p) => ({ ...p, financialYear: v }))}
                                options={getFinancialYearOptions(ptForm.financialYear)}
                            />
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tax Slabs</label>
                            {ptForm.slabs.map((slab, i) => (
                                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                                    <div>
                                        <label className="block text-[10px] text-neutral-400 mb-1">From (₹)</label>
                                        <input type="number" value={slab.fromAmount} onChange={(e) => { const s = [...ptForm.slabs]; s[i] = { ...s[i], fromAmount: Number(e.target.value) }; setPTForm((p) => ({ ...p, slabs: s })); }} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-neutral-400 mb-1">To (₹)</label>
                                        <input type="number" value={slab.toAmount} onChange={(e) => { const s = [...ptForm.slabs]; s[i] = { ...s[i], toAmount: Number(e.target.value) }; setPTForm((p) => ({ ...p, slabs: s })); }} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-neutral-400 mb-1">Tax (₹)</label>
                                        <input type="number" value={slab.taxAmount} onChange={(e) => { const s = [...ptForm.slabs]; s[i] = { ...s[i], taxAmount: Number(e.target.value) }; setPTForm((p) => ({ ...p, slabs: s })); }} className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white" />
                                    </div>
                                    <button onClick={() => setPTForm((p) => ({ ...p, slabs: p.slabs.filter((_, idx) => idx !== i) }))} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors h-fit"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => setPTForm((p) => ({ ...p, slabs: [...p.slabs, { fromAmount: 0, toAmount: 0, taxAmount: 0 }] }))} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                <Plus size={14} /> Add Slab
                            </button>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-2">Monthly Overrides</label>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Override PT amount for specific months (1 = Jan, 2 = Feb, ... 12 = Dec)</p>
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 12 }, (_, i) => {
                                    const month = String(i + 1);
                                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    return (
                                        <div key={month}>
                                            <label className="block text-[10px] text-neutral-400 mb-1">{monthNames[i]}</label>
                                            <input type="number" value={ptForm.monthlyOverrides[month] ?? ""} onChange={(e) => {
                                                const val = e.target.value;
                                                setPTForm((p) => {
                                                    const overrides = { ...p.monthlyOverrides };
                                                    if (val === "" || val === undefined) { delete overrides[month]; } else { overrides[month] = Number(val); }
                                                    return { ...p, monthlyOverrides: overrides };
                                                });
                                            }} placeholder="-" className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none dark:text-white placeholder:text-neutral-300" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setPTModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={savePT} disabled={createPT.isPending || updatePT.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {(createPT.isPending || updatePT.isPending) && <Loader2 size={14} className="animate-spin" />}
                                {ptEditId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LWF Modal ── */}
            {lwfModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{lwfEditId ? "Edit LWF Config" : "Add LWF Config"}</h2>
                            <button onClick={() => setLWFModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><span className="text-lg">&times;</span></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField label="State" value={lwfForm.state} onChange={(v) => setLWFForm((p) => ({ ...p, state: v }))} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} />
                            <NumRow label="Employee Amount (₹)" value={lwfForm.employeeAmount} onChange={(v) => setLWFForm((p) => ({ ...p, employeeAmount: v }))} suffix="₹" min={0} />
                            <NumRow label="Employer Amount (₹)" value={lwfForm.employerAmount} onChange={(v) => setLWFForm((p) => ({ ...p, employerAmount: v }))} suffix="₹" min={0} />
                            <SelectField label="Frequency" value={lwfForm.frequency} onChange={(v) => setLWFForm((p) => ({ ...p, frequency: v }))} options={[{ value: "MONTHLY", label: "Monthly" }, { value: "SEMI_ANNUAL", label: "Half-Yearly" }, { value: "ANNUAL", label: "Yearly" }]} />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setLWFModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={saveLWF} disabled={createLWF.isPending || updateLWF.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {(createLWF.isPending || updateLWF.isPending) && <Loader2 size={14} className="animate-spin" />}
                                {lwfEditId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
