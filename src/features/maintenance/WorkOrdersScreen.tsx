import { ClipboardList, Plus, Clock, CheckCircle2, AlertTriangle, Wrench, User } from "lucide-react";

const PLANNED_FEATURES = [
    { icon: Plus, label: "Create Work Orders", desc: "Generate maintenance work orders for preventive, corrective, or emergency tasks" },
    { icon: User, label: "Assign Technicians", desc: "Assign work orders to maintenance staff with skill-based routing" },
    { icon: Clock, label: "SLA & Priority Tracking", desc: "Track response times, priorities, and SLA compliance for all work orders" },
    { icon: Wrench, label: "Parts & Labour Logging", desc: "Log spare parts consumed and labour hours for accurate cost tracking" },
    { icon: CheckCircle2, label: "Completion & Sign-off", desc: "Digital completion workflow with supervisor sign-off and quality checks" },
    { icon: AlertTriangle, label: "Escalation Management", desc: "Auto-escalate overdue work orders with configurable escalation rules" },
];

export function WorkOrdersScreen() {
    return (
        <div className="flex-1 p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <ClipboardList size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Maintenance Work Orders</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Create, assign, and manage maintenance tasks</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="px-8 pt-8 pb-4 text-center">
                    <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 rounded-full mb-4">
                        Coming Soon
                    </span>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Work Order Management</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">End-to-end maintenance work order lifecycle management</p>
                </div>

                <div className="px-8 pb-8">
                    <div className="grid gap-3">
                        {PLANNED_FEATURES.map((f) => (
                            <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <f.icon size={16} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{f.label}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 text-center">
                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                            This module is under active development and will be available in an upcoming release.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
