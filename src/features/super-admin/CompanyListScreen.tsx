import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Building2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    ArrowRight,
    Server
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============ MOCK DATA ============
const COMPANIES = [
    { id: 1, name: "Apex Manufacturing Pvt. Ltd.", industry: "Automotive", status: "Active", users: 156, maxUsers: 200, modules: 8, tier: "Growth", selfHosted: false },
    { id: 2, name: "Steel Dynamics", industry: "Steel & Metal", status: "Active", users: 89, maxUsers: 100, modules: 6, tier: "Starter", selfHosted: true },
    { id: 3, name: "Rathi Automotive", industry: "Automotive", status: "Trial", users: 45, maxUsers: 50, modules: 10, tier: "Enterprise", selfHosted: false },
    { id: 4, name: "Indo Metals Corp", industry: "Steel & Metal", status: "Suspended", users: 210, maxUsers: 200, modules: 5, tier: "Scale", selfHosted: false },
    { id: 5, name: "Precision CNC", industry: "CNC Machining", status: "Active", users: 12, maxUsers: 50, modules: 3, tier: "Starter", selfHosted: false },
    { id: 6, name: "Global Textiles Ltd", industry: "Textiles", status: "Expired", users: 500, maxUsers: 500, modules: 10, tier: "Enterprise", selfHosted: true },
];

const FILTERS = ["All", "Active", "Trial", "Suspended", "Expired"];

export function CompanyListScreen() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const filtered = COMPANIES.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = activeFilter === "All" || c.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Companies</h1>
                    <p className="text-neutral-500 mt-1">Manage tenant workspaces and subscriptions</p>
                </div>
                <button
                    onClick={() => navigate("/app/companies/add")}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Company
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* Search */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search companies by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
                    <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 mr-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                    </div>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                                activeFilter === f
                                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/30"
                                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-200/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100 text-sm text-neutral-500">
                                <th className="py-4 px-6 font-semibold w-1/3">Company</th>
                                <th className="py-4 px-6 font-semibold">Status</th>
                                <th className="py-4 px-6 font-semibold">Users</th>
                                <th className="py-4 px-6 font-semibold">Modules</th>
                                <th className="py-4 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filtered.map((company) => (
                                <tr
                                    key={company.id}
                                    className="border-b border-neutral-50 last:border-0 hover:bg-primary-50/30 transition-colors group"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-100 to-accent-100 flex items-center justify-center shrink-0 border border-primary-200/50">
                                                <Building2 className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <div>
                                                <Link to={`/app/companies/${company.id}`} className="font-bold text-neutral-900 text-base hover:text-primary-600 transition-colors">
                                                    {company.name}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-neutral-500 font-medium">{company.industry}</span>
                                                    {company.selfHosted && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-neutral-300" />
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-700 bg-accent-50 px-1.5 py-0.5 rounded">
                                                                <Server className="w-3 h-3" />
                                                                SELF-HOSTED
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                                            company.status === "Active" ? "bg-success-50 text-success-700 border-success-200" :
                                                company.status === "Trial" ? "bg-info-50 text-info-700 border-info-200" :
                                                    company.status === "Suspended" ? "bg-warning-50 text-warning-700 border-warning-200" :
                                                        "bg-danger-50 text-danger-700 border-danger-200"
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                company.status === "Active" ? "bg-success-500" :
                                                    company.status === "Trial" ? "bg-info-500" :
                                                        company.status === "Suspended" ? "bg-warning-500" :
                                                            "bg-danger-500"
                                            )} />
                                            {company.status}
                                        </span>
                                    </td>

                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-neutral-900">{company.users}</span>
                                                <span className="text-neutral-500">/ {company.maxUsers} max</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        (company.users / company.maxUsers) > 0.9 ? "bg-danger-500" :
                                                            (company.users / company.maxUsers) > 0.7 ? "bg-warning-500" :
                                                                "bg-primary-500"
                                                    )}
                                                    style={{ width: `${Math.min((company.users / company.maxUsers) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <div>
                                            <span className="font-bold text-neutral-900">{company.modules}</span>
                                            <span className="text-neutral-500 text-xs ml-1">active</span>
                                        </div>
                                        <span className="text-xs text-neutral-400 font-medium inline-block mt-0.5 bg-neutral-100 px-2 rounded-sm">
                                            {company.tier} Tier
                                        </span>
                                    </td>

                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/app/companies/${company.id}`}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors group-hover:bg-white"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-lg transition-colors group-hover:bg-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-neutral-500">
                                        No companies found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500 bg-neutral-50/50">
                    <span>Showing 1 to {filtered.length} of {COMPANIES.length} entries</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 bg-white border border-neutral-200 rounded text-neutral-400 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 bg-white border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
