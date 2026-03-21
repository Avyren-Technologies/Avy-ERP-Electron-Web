import { Package, Box, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RefreshCw, Clock } from "lucide-react";

const PLANNED_FEATURES = [
    { icon: Box, label: "Stock Management", desc: "Real-time stock levels across all warehouses and locations" },
    { icon: ArrowDownToLine, label: "Goods Receipt", desc: "Inward material receipt with quality inspection workflow" },
    { icon: ArrowUpFromLine, label: "Material Issue", desc: "Issue materials against work orders or departments" },
    { icon: ArrowLeftRight, label: "Stock Transfer", desc: "Inter-warehouse and inter-location stock movement" },
    { icon: RefreshCw, label: "Cycle Counting", desc: "Scheduled and ad-hoc inventory audits with variance analysis" },
];

export function InventoryScreen() {
    return (
        <div className="flex-1 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Package size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Stock management and material tracking</p>
                    </div>
                </div>
            </div>

            {/* Coming Soon Card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                {/* Badge + Title */}
                <div className="px-8 pt-8 pb-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                        <Clock size={12} />
                        Coming Soon
                    </span>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Inventory Module
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                        Comprehensive inventory management with real-time stock tracking, automated reorder points, and multi-warehouse support.
                    </p>
                </div>

                {/* Feature List */}
                <div className="px-8 pb-8">
                    <div className="mt-6 space-y-3">
                        {PLANNED_FEATURES.map((f) => (
                            <div
                                key={f.label}
                                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <f.icon size={16} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{f.label}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer note */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                            This module is under development. Features and timelines are subject to change.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
