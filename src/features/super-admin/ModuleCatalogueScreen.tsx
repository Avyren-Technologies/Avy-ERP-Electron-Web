import { Boxes, KeySquare, Users, ShieldCheck, Factory, HeartPulse, Truck, FileText, Smartphone, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

// Modules match the mobile PRD
const MODULES = [
    { id: "masters", name: "System Masters", desc: "Core global definitions, tax rates, UOMs, and foundational data.", icon: KeySquare, price: "Base Required", color: "from-neutral-500 to-neutral-600", required: true },
    { id: "security", name: "Security & Access", desc: "Role-based control, feature toggles, and IP whitelisting.", icon: ShieldCheck, price: "Included", color: "from-indigo-500 to-indigo-600", required: true },
    { id: "hr", name: "HR Management", desc: "Employees, attendance, payroll, leave tracking.", icon: Users, price: "₹20/user/mo", color: "from-blue-500 to-blue-600", required: false },
    { id: "production", name: "Production Console", desc: "BOMs, shop floor routing, job cards, and WIP tracking.", icon: Factory, price: "₹5000/mo", color: "from-orange-500 to-orange-600", required: false },
    { id: "machine", name: "Machine Maintenance", desc: "Downtime logging, preventive maintenance schedules, tooling.", icon: HeartPulse, price: "₹3000/mo", color: "from-rose-500 to-rose-600", required: false },
    { id: "inventory", name: "Inventory", desc: "Stock ledgers, gate entry, MRN, min-max thresholds.", icon: Boxes, price: "₹4000/mo", color: "from-emerald-500 to-emerald-600", required: false },
    { id: "vendor", name: "Vendor Logistics", desc: "Procurement, POs, vendor ratings, RFQs.", icon: Truck, price: "₹3500/mo", color: "from-cyan-500 to-cyan-600", required: false },
    { id: "sales", name: "Sales & Invoicing", desc: "Quotations, sales orders, dispatch challans, e-invoicing.", icon: FileText, price: "₹4500/mo", color: "from-violet-500 to-violet-600", required: false },
];

export function ModuleCatalogueScreen() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Module Catalogue</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Avyren ERP ecosystem features available to tenants.</p>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                    <button className="px-4 py-1.5 rounded-md bg-white dark:bg-neutral-700 shadow-sm text-sm font-bold text-primary-950 dark:text-white transition-colors">List View</button>
                    <button className="px-4 py-1.5 rounded-md text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-primary-950 dark:hover:text-white transition-colors">Grid View</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {MODULES.map((mod) => (
                    <div key={mod.id} className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 shadow-xl shadow-neutral-900/5 hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                        {/* Soft background glow on hover */}
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.08] transition-opacity duration-500 bg-gradient-to-br", mod.color)} />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-inner", mod.color)}>
                                <mod.icon className="w-6 h-6" />
                            </div>
                            {mod.required && (
                                <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">Required</span>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-primary-950 dark:text-white mb-2 relative z-10">{mod.name}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 flex-1 relative z-10">{mod.desc}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 relative z-10 mt-auto">
                            <span className="font-bold text-primary-600 dark:text-primary-400">{mod.price}</span>
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center relative z-20"><Smartphone className="w-3 h-3 text-neutral-400 dark:text-neutral-500" /></div>
                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-white dark:border-neutral-900 flex items-center justify-center relative z-10"><Laptop className="w-3 h-3 text-neutral-400 dark:text-neutral-500" /></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
