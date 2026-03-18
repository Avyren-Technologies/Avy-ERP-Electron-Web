import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Building2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    ArrowRight,
    Server,
    MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============ MOCK DATA ============
interface CompanyItem {
    id: number;
    name: string;
    legalName: string;
    industry: string;
    businessType: string;
    status: 'Active' | 'Trial' | 'Suspended' | 'Expired';
    users: number;
    maxUsers: number;
    modules: number;
    tier: string;
    selfHosted: boolean;
    locations: number;
    billingCycle: 'Monthly' | 'Annual';
    primaryContact: string;
    primaryEmail: string;
    multiLocation: boolean;
}

const COMPANIES: CompanyItem[] = [
    { id: 1, name: 'Apex Manufacturing Pvt. Ltd.', legalName: 'Apex Manufacturing Private Limited', industry: 'Automotive', businessType: 'Private Limited', status: 'Active', users: 156, maxUsers: 200, modules: 9, tier: 'Growth', selfHosted: false, locations: 3, billingCycle: 'Annual', primaryContact: 'Priya Sharma', primaryEmail: 'priya@apex.com', multiLocation: true },
    { id: 2, name: 'Steel Dynamics', legalName: 'Steel Dynamics Industries Ltd', industry: 'Steel & Metal', businessType: 'Public Limited', status: 'Active', users: 89, maxUsers: 100, modules: 6, tier: 'Starter', selfHosted: true, locations: 2, billingCycle: 'Annual', primaryContact: 'Rajesh Kumar', primaryEmail: 'rajesh@steeldynamics.in', multiLocation: true },
    { id: 3, name: 'Rathi Automotive', legalName: 'Rathi Automotive Pvt. Ltd', industry: 'Automotive', businessType: 'Private Limited', status: 'Trial', users: 45, maxUsers: 50, modules: 10, tier: 'Enterprise', selfHosted: false, locations: 4, billingCycle: 'Monthly', primaryContact: 'Anita Rathi', primaryEmail: 'anita@rathiauto.com', multiLocation: true },
    { id: 4, name: 'Indo Metals Corp', legalName: 'Indo Metals Corporation Pvt. Ltd', industry: 'Steel & Metal', businessType: 'Private Limited', status: 'Suspended', users: 210, maxUsers: 200, modules: 5, tier: 'Scale', selfHosted: false, locations: 1, billingCycle: 'Monthly', primaryContact: 'Sanjay Gupta', primaryEmail: 'sanjay@indometals.com', multiLocation: false },
    { id: 5, name: 'Precision CNC', legalName: 'Precision CNC Technologies Pvt. Ltd', industry: 'CNC Machining', businessType: 'Private Limited', status: 'Active', users: 12, maxUsers: 50, modules: 3, tier: 'Starter', selfHosted: false, locations: 1, billingCycle: 'Monthly', primaryContact: 'Deepak Joshi', primaryEmail: 'deepak@precisioncnc.in', multiLocation: false },
    { id: 6, name: 'Global Textiles Ltd', legalName: 'Global Textiles Limited', industry: 'Textiles', businessType: 'Public Limited', status: 'Expired', users: 500, maxUsers: 500, modules: 10, tier: 'Enterprise', selfHosted: true, locations: 5, billingCycle: 'Annual', primaryContact: 'Kavita Menon', primaryEmail: 'kavita@globaltextiles.com', multiLocation: true },
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
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Companies</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage tenant workspaces and subscriptions</p>
                </div>
                <button
                    onClick={() => navigate("/app/companies/add")}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Company
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">

                {/* Search */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search companies by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                    <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 mr-2 shrink-0">
                        <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors",
                                activeFilter === f
                                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/30 dark:shadow-none"
                                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                <th className="py-4 px-6 font-bold w-1/3">Company</th>
                                <th className="py-4 px-6 font-bold">Status</th>
                                <th className="py-4 px-6 font-bold">Locations</th>
                                <th className="py-4 px-6 font-bold">Users</th>
                                <th className="py-4 px-6 font-bold">Modules</th>
                                <th className="py-4 px-6 font-bold">Billing</th>
                                <th className="py-4 px-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filtered.map((company) => (
                                <tr
                                    key={company.id}
                                    className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-800/50">
                                                <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <Link to={`/app/companies/${company.id}`} className="font-bold text-primary-950 dark:text-white text-base hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                                    {company.name}
                                                </Link>
                                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-tight">{company.legalName}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{company.industry}</span>
                                                    {company.selfHosted && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30 px-1.5 py-0.5 rounded">
                                                                <Server className="w-3 h-3" />
                                                                SELF-HOSTED
                                                            </span>
                                                        </>
                                                    )}
                                                    {company.multiLocation && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-info-700 dark:text-info-400 bg-info-50 dark:bg-info-900/30 px-1.5 py-0.5 rounded">
                                                                <MapPin className="w-3 h-3" />
                                                                MULTI-LOCATION
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border",
                                            company.status === "Active" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" :
                                                company.status === "Trial" ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50" :
                                                    company.status === "Suspended" ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" :
                                                        "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
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
                                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                                            <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                            <span className="font-semibold text-sm">{company.locations}</span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{company.locations === 1 ? 'location' : 'locations'}</span>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-primary-950 dark:text-white">{company.users}</span>
                                                <span className="text-neutral-500 dark:text-neutral-400">/ {company.maxUsers} max</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        (company.users / company.maxUsers) > 0.9 ? "bg-danger-500" :
                                                            (company.users / company.maxUsers) > 0.7 ? "bg-warning-500" :
                                                                "bg-primary-500 dark:bg-primary-400"
                                                    )}
                                                    style={{ width: `${Math.min((company.users / company.maxUsers) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-6">
                                        <div>
                                            <span className="font-bold text-primary-950 dark:text-white">{company.modules}</span>
                                            <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">active</span>
                                        </div>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold inline-block mt-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-md">
                                            {company.tier} Tier
                                        </span>
                                    </td>

                                    <td className="py-4 px-6">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
                                            company.billingCycle === 'Annual'
                                                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                                : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                        )}>
                                            {company.billingCycle}
                                        </span>
                                    </td>

                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/app/companies/${company.id}`}
                                                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button className="p-2 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-neutral-500 dark:text-neutral-400 font-medium">
                                        No companies found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">Showing 1 to {filtered.length} of {COMPANIES.length} entries</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
