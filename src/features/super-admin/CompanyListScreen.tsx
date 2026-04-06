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
    MapPin,
    Loader2,
    Upload,
} from "lucide-react";
import { BulkUploadModal } from "./bulk-upload/BulkUploadModal";
import { cn } from "@/lib/utils";
import { useTenantList } from "@/features/super-admin/api/use-tenant-queries";
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const FILTERS = ["All", "Active", "Draft", "Pilot", "Inactive"];

function Spinner() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
    );
}

export function CompanyListScreen() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const limit = 25;

    const { data, isLoading, isError } = useTenantList({
        search: search || undefined,
        status: activeFilter === "All" ? undefined : activeFilter,
        page,
        limit,
    });

    const companies: any[] = data?.data ?? [];
    const meta = (data as any)?.meta;
    const total = meta?.total ?? companies.length;

    return (
        <>
        {showBulkUpload && (
            <BulkUploadModal
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => setShowBulkUpload(false)}
            />
        )}
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Companies</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage tenant workspaces and subscriptions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => navigate("/app/companies/add")}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Company
                    </button>
                </div>
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
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                            onClick={() => { setActiveFilter(f); setPage(1); }}
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

            {/* Error State */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load companies. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden transition-colors">
                {isLoading ? <SkeletonTable rows={8} cols={7} /> : (
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
                                {companies.map((company: any) => {
                                    const status = company.wizardStatus ?? 'Draft';
                                    const userCount = company._count?.users ?? 0;
                                    const locationCount = company._count?.locations ?? 0;
                                    const moduleIds = (company.selectedModuleIds as string[] | null) ?? null;
                                    const moduleCount = moduleIds?.length ?? null;
                                    const tier = company.userTier
                                        ?? (company.locationConfig === 'per-location' ? 'Per-location' : '—');
                                    const billingCycle = company.billingCycle ?? 'monthly';
                                    const billingLabel = billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1);
                                    const selfHosted = company.endpointType === 'custom';
                                    const multiLocation = company.multiLocationMode === true;

                                    return (
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
                                                            {company.displayName || company.name}
                                                        </Link>
                                                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-tight">{company.legalName || ''}</p>
                                                        {company.slug && <span className="text-xs text-neutral-400 font-mono">{company.slug}.avyren.in</span>}
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{company.industry}</span>
                                                            {selfHosted && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30 px-1.5 py-0.5 rounded">
                                                                        <Server className="w-3 h-3" />
                                                                        SELF-HOSTED
                                                                    </span>
                                                                </>
                                                            )}
                                                            {multiLocation && (
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
                                                    status === "Active" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" :
                                                        status === "Pilot" ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50" :
                                                            status === "Inactive" ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" :
                                                                "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
                                                )}>
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        status === "Active" ? "bg-success-500" :
                                                            status === "Pilot" ? "bg-info-500" :
                                                                status === "Inactive" ? "bg-danger-500" :
                                                                    "bg-warning-500"
                                                    )} />
                                                    {status}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                                                    <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                                    <span className="font-semibold text-sm">{locationCount}</span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{locationCount === 1 ? 'location' : 'locations'}</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-primary-950 dark:text-white text-xs">{userCount}</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{moduleCount ?? '—'}</span>
                                                    <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">
                                                        {moduleCount === null ? 'n/a' : 'active'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold inline-block mt-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-md">
                                                    {tier} Tier
                                                </span>
                                            </td>

                                            <td className="py-4 px-6">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                    billingLabel === 'Annual'
                                                        ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                                                        : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                                )}>
                                                    {billingLabel}
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
                                    );
                                })}

                                {companies.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="search" title="No companies found" message="Try adjusting your search or filters." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="font-medium">
                        Showing {companies.length > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={!meta || page >= (meta.totalPages ?? 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
