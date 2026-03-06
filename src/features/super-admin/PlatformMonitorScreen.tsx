import {
    Activity,
    Server,
    Cpu,
    HardDrive,
    AlertTriangle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// MOCK DATA
const SYSTEM_HEALTH = [
    { label: "API Uptime", value: "99.98%", stat: "Operational", color: "success", icon: Activity },
    { label: "Global Latency", value: "124ms", stat: "-12ms", color: "primary", icon: Clock },
    { label: "Active Connections", value: "4,210", stat: "Peak", color: "info", icon: Server },
];

const SERVER_METRICS = [
    { name: "Node Region: AP-South-1", cpu: 42, mem: 68, disk: 34, status: "Healthy" },
    { name: "Node Region: EU-West-2", cpu: 28, mem: 45, disk: 22, status: "Healthy" },
    { name: "Node Region: US-East-1 (Primary)", cpu: 78, mem: 85, disk: 60, status: "Warning" },
];

export function PlatformMonitorScreen() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Platform Monitor</h1>
                    <p className="text-neutral-500 mt-1">Real-time infrastructure health and system metrics</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                    <span className="text-sm font-bold text-success-700">All Systems Go</span>
                </div>
            </div>

            {/* Global Health KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SYSTEM_HEALTH.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col justify-between h-40 shadow-xl shadow-neutral-200/30">
                        <div className="flex justify-between items-start">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                item.color === "success" && "bg-success-100 text-success-600",
                                item.color === "primary" && "bg-primary-100 text-primary-600",
                                item.color === "info" && "bg-info-100 text-info-600"
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{item.stat}</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{item.value}</h3>
                            <p className="text-sm text-neutral-500 font-medium">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Node Metrics */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-200/30 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100">
                        <h2 className="text-lg font-bold text-neutral-900">Infrastructure Nodes</h2>
                        <p className="text-sm text-neutral-500">Resource utilization across global regions</p>
                    </div>

                    <div className="divide-y divide-neutral-100">
                        {SERVER_METRICS.map((node, i) => (
                            <div key={i} className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <Server className={cn("w-5 h-5", node.status === 'Warning' ? "text-warning-500" : "text-neutral-400")} />
                                        <span className="font-bold text-neutral-900">{node.name}</span>
                                    </div>
                                    {node.status === "Warning" ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-warning-700 bg-warning-50 px-2 py-0.5 rounded-full border border-warning-200 uppercase">
                                            <AlertTriangle className="w-3 h-3" /> Warning
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded-full border border-success-200 uppercase">
                                            <CheckCircle2 className="w-3 h-3" /> Healthy
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {/* CPU */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-neutral-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                                            <span className="font-bold text-neutral-900">{node.cpu}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", node.cpu > 70 ? "bg-warning-500" : "bg-primary-500")} style={{ width: node.cpu + '%' }} />
                                        </div>
                                    </div>

                                    {/* Mem */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-neutral-500 flex items-center gap-1"><Activity className="w-3 h-3" /> MEM</span>
                                            <span className="font-bold text-neutral-900">{node.mem}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", node.mem > 80 ? "bg-warning-500" : "bg-accent-500")} style={{ width: node.mem + '%' }} />
                                        </div>
                                    </div>

                                    {/* Disk */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-neutral-500 flex items-center gap-1"><HardDrive className="w-3 h-3" /> DSK</span>
                                            <span className="font-bold text-neutral-900">{node.disk}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-info-500 rounded-full transition-all" style={{ width: node.disk + '%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Event Stream */}
                <div className="bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden flex flex-col relative text-white">
                    <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-danger-500 animate-ping absolute" />
                                <div className="w-2 h-2 rounded-full bg-danger-500 relative" />
                                Live Event Stream
                            </h2>
                            <p className="text-sm text-neutral-400 mt-0.5">Automated anomaly detection</p>
                        </div>
                        <button className="text-xs font-bold text-neutral-400 border border-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                            Pause Stream
                        </button>
                    </div>

                    <div className="flex-1 p-6 space-y-4 font-mono text-xs overflow-y-auto">
                        <div className="flex gap-4 opacity-100">
                            <span className="text-neutral-500 shrink-0">17:42:05</span>
                            <span className="text-danger-400 shrink-0">[WARN]</span>
                            <span className="text-neutral-300">US-East-1 mem threshold exceed (85%)</span>
                        </div>
                        <div className="flex gap-4 opacity-90">
                            <span className="text-neutral-500 shrink-0">17:41:12</span>
                            <span className="text-success-400 shrink-0">[INFO]</span>
                            <span className="text-neutral-300">Tenant cache invalidate: Apex Mfg (ID: 1)</span>
                        </div>
                        <div className="flex gap-4 opacity-75">
                            <span className="text-neutral-500 shrink-0">17:38:55</span>
                            <span className="text-success-400 shrink-0">[INFO]</span>
                            <span className="text-neutral-300">New company payload received from Add Wizard</span>
                        </div>
                        <div className="flex gap-4 opacity-50">
                            <span className="text-neutral-500 shrink-0">17:35:10</span>
                            <span className="text-info-400 shrink-0">[DIAG]</span>
                            <span className="text-neutral-300">Running CRON: invoice_generator_monthly</span>
                        </div>
                        <div className="flex gap-4 opacity-30">
                            <span className="text-neutral-500 shrink-0">17:22:04</span>
                            <span className="text-success-400 shrink-0">[INFO]</span>
                            <span className="text-neutral-300">Database backup sequence triggered</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
