import { useState, useMemo } from "react";
import { ClipboardCheck, Check, X, Monitor, Building, DollarSign, Users, BookOpen } from "lucide-react";
import { useExitClearances, useExitRequests } from "../api/use-offboarding-queries";
import { useUpdateClearance } from "../api/use-offboarding-mutations";
import { toast } from "sonner";

// ============ TYPES ============

interface ClearanceItem {
    id: string;
    department: string;
    items: { id: string; label: string; cleared: boolean }[];
    status: "Pending" | "Cleared";
}

// ============ CONSTANTS ============

const DEPT_CONFIG: Record<string, { icon: typeof Monitor; color: string; bg: string }> = {
    IT: { icon: Monitor, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
    Admin: { icon: Building, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30" },
    Finance: { icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
    HR: { icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
    Library: { icon: BookOpen, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
};

const DEFAULT_DEPARTMENTS = ["IT", "Admin", "Finance", "HR", "Library"];

function getMockClearances(): ClearanceItem[] {
    return DEFAULT_DEPARTMENTS.map((dept, i) => ({
        id: `clr-${i}`,
        department: dept,
        status: "Pending" as const,
        items: [
            { id: `${dept}-1`, label: `${dept} asset return`, cleared: false },
            { id: `${dept}-2`, label: `${dept} access revocation`, cleared: false },
            { id: `${dept}-3`, label: `${dept} document handover`, cleared: false },
        ],
    }));
}

// ============ CONFIRM MODAL ============

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
    open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors">Confirm Clear</button>
                </div>
            </div>
        </div>
    );
}

// ============ MAIN SCREEN ============

export function ClearanceDashboardScreen() {
    const [selectedExitId, setSelectedExitId] = useState("");
    const [confirmDept, setConfirmDept] = useState<{ id: string; dept: string } | null>(null);

    const { data: exitListData } = useExitRequests();
    const { data: clearanceData, isLoading, refetch } = useExitClearances(selectedExitId);
    const updateClearance = useUpdateClearance();

    const exitRequests = useMemo(() => {
        const raw = (exitListData as any)?.data ?? exitListData ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [exitListData]);

    const clearances: ClearanceItem[] = useMemo(() => {
        const raw = (clearanceData as any)?.data ?? clearanceData ?? [];
        if (Array.isArray(raw) && raw.length > 0) return raw;
        return getMockClearances();
    }, [clearanceData]);

    const totalItems = clearances.reduce((acc, c) => acc + c.items.length, 0);
    const clearedItems = clearances.reduce((acc, c) => acc + c.items.filter(i => i.cleared).length, 0);
    const progressPct = totalItems > 0 ? Math.round((clearedItems / totalItems) * 100) : 0;

    const handleClear = () => {
        if (!confirmDept) return;
        updateClearance.mutate(
            { id: confirmDept.id, data: { status: "Cleared", clearedAll: true } },
            {
                onSuccess: () => { toast.success(`${confirmDept.dept} department cleared`); refetch(); setConfirmDept(null); },
                onError: () => toast.error("Failed to clear department"),
            }
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Exit Request Selector */}
            {exitRequests.length > 0 && (
                <div className="max-w-sm">
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Select Exit Request</label>
                    <select value={selectedExitId} onChange={(e) => setSelectedExitId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                        <option value="">-- Select --</option>
                        {exitRequests.map((er: any) => (
                            <option key={er.id} value={er.id}>{er.employeeName ?? (er.employee ? `${er.employee.firstName ?? ''} ${er.employee.lastName ?? ''}`.trim() : er.employeeId)} ({er.separationType})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Overall Progress */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Overall Clearance Progress</h3>
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{progressPct}%</span>
                </div>
                <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
                {clearedItems === totalItems && totalItems > 0 && (
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-2">All departments cleared -- exit status will auto-advance.</p>
                )}
            </div>

            {/* Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clearances.map((item) => {
                    const config = DEPT_CONFIG[item.department] ?? { icon: ClipboardCheck, color: "text-neutral-600", bg: "bg-neutral-50" };
                    const Icon = config.icon;
                    const cleared = item.items.filter(i => i.cleared).length;
                    const allCleared = cleared === item.items.length;

                    return (
                        <div key={item.id} className={`bg-white dark:bg-neutral-900 rounded-xl border p-5 transition-all ${allCleared ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10" : "border-neutral-200 dark:border-neutral-800"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{item.department}</h4>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{cleared}/{item.items.length} cleared</p>
                                    </div>
                                </div>
                                {allCleared ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">Cleared</span>
                                ) : (
                                    <button onClick={() => setConfirmDept({ id: item.id, dept: item.department })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {item.items.map(ci => (
                                    <div key={ci.id} className="flex items-center gap-2.5">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center ${ci.cleared ? "bg-green-500" : "border border-neutral-300 dark:border-neutral-600"}`}>
                                            {ci.cleared && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-xs ${ci.cleared ? "text-neutral-400 dark:text-neutral-500 line-through" : "text-neutral-700 dark:text-neutral-300"}`}>{ci.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {clearances.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <ClipboardCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400 font-semibold">No clearance data</p>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm">Select an exit request to view clearance status</p>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDept}
                title={`Clear ${confirmDept?.dept ?? ""}?`}
                message={`This will mark all ${confirmDept?.dept ?? ""} clearance items as completed. This action cannot be undone.`}
                onConfirm={handleClear}
                onCancel={() => setConfirmDept(null)}
            />
        </div>
    );
}
