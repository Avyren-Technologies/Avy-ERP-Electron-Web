import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    Building2,
    ArrowLeft,
    KeySquare,
    ShieldCheck,
    Users,
    Factory,
    HeartPulse,
    Boxes,
    Truck,
    FileText,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomLoader } from "@/components/ui/CustomLoader";

const MODULES_DB = [
    { id: "masters", name: "System Masters", icon: KeySquare, color: "from-neutral-500 to-neutral-600", required: true, dependsOn: [] },
    { id: "security", name: "Security & Access", icon: ShieldCheck, color: "from-indigo-500 to-indigo-600", required: true, dependsOn: [] },
    { id: "hr", name: "HR Management", icon: Users, color: "from-blue-500 to-blue-600", required: false, dependsOn: ["masters", "security"] },
    { id: "production", name: "Production Console", icon: Factory, color: "from-orange-500 to-orange-600", required: false, dependsOn: ["masters", "inventory"] },
    { id: "machine", name: "Machine Maintenance", icon: HeartPulse, color: "from-rose-500 to-rose-600", required: false, dependsOn: ["masters"] },
    { id: "inventory", name: "Inventory", icon: Boxes, color: "from-emerald-500 to-emerald-600", required: false, dependsOn: ["masters"] },
    { id: "vendor", name: "Vendor Logistics", icon: Truck, color: "from-cyan-500 to-cyan-600", required: false, dependsOn: ["masters", "inventory"] },
    { id: "sales", name: "Sales & Invoicing", icon: FileText, color: "from-violet-500 to-violet-600", required: false, dependsOn: ["masters", "inventory"] },
];

export function ModuleAssignmentScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeModules, setActiveModules] = useState<Set<string>>(new Set(["masters", "security", "hr", "inventory", "sales"]));
    const [isSaving, setIsSaving] = useState(false);

    const toggleModule = (modId: string) => {
        const mod = MODULES_DB.find(m => m.id === modId);
        if (!mod || mod.required) return;

        setActiveModules(prev => {
            const next = new Set(prev);
            if (next.has(modId)) {
                next.delete(modId);
                // Cascade disable dependents
                MODULES_DB.forEach(m => {
                    if (m.dependsOn.includes(modId)) next.delete(m.id);
                });
            } else {
                next.add(modId);
                // Cascade enable dependencies
                mod.dependsOn.forEach(dep => next.add(dep));
            }
            return next;
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            navigate(`/app/companies/${id}`);
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to={`/app/companies/${id}`} className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-primary-600" />
                        Module Assignment
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Configure feature access for Tenant #{id}</p>
                </div>
            </div>

            <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-info-600 shrink-0 mt-0.5" />
                <p className="text-sm text-info-800">
                    <strong>Dependency Resolution Active:</strong> Toggling a module will automatically enable any required foundational modules, and disabling a core module will turn off features that depend on it.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES_DB.map((mod) => {
                    const isActive = activeModules.has(mod.id);

                    return (
                        <div
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            className={cn(
                                "relative rounded-2xl p-6 border-2 cursor-pointer transition-all duration-300",
                                isActive
                                    ? "bg-primary-50/50 border-primary-500 shadow-lg shadow-primary-500/10"
                                    : "bg-white border-neutral-100 hover:border-primary-200 shadow-sm"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-inner",
                                    isActive ? mod.color : "from-neutral-300 to-neutral-400"
                                )}>
                                    <mod.icon className="w-6 h-6" />
                                </div>

                                <div className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                                    isActive ? "bg-primary-500" : "bg-neutral-200"
                                )}>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm",
                                        isActive ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </div>
                            </div>

                            <h3 className={cn("text-lg font-bold mb-1", isActive ? "text-primary-950" : "text-neutral-700")}>
                                {mod.name}
                            </h3>

                            {mod.dependsOn.length > 0 && (
                                <p className="text-xs text-neutral-400 font-medium">
                                    Requires: {mod.dependsOn.join(', ')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-neutral-200 flex items-center justify-end z-20">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-neutral-500 mr-4">
                        {activeModules.size} of {MODULES_DB.length} active
                    </span>
                    <Link
                        to={`/app/companies/${id}`}
                        className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center justify-center min-w-[140px] px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all disabled:opacity-70"
                    >
                        {isSaving ? <CustomLoader size="sm" className="brightness-200" /> : "Save Configuration"}
                    </button>
                </div>
            </div>
        </div>
    );
}
