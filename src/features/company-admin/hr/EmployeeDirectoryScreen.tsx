import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Plus,
    Search,
    Filter,
    Eye,
    Edit3,
    MapPin,
    Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployees, useDepartments } from "@/features/company-admin/api/use-hr-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Status helpers ── */

const STATUS_FILTERS = ["All", "Active", "Probation", "Confirmed", "On Notice", "Exited"];

const STATUS_STYLES: Record<string, string> = {
    active: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
    confirmed: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
    probation: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    "on notice": "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
    exited: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
};

function EmployeeStatusBadge({ status }: { status: string }) {
    const key = status?.toLowerCase() ?? "active";
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
            STATUS_STYLES[key] ?? STATUS_STYLES.active
        )}>
            <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                key === "active" || key === "confirmed" ? "bg-success-500" :
                key === "probation" ? "bg-warning-500" :
                key === "on notice" ? "bg-accent-500" :
                "bg-neutral-400"
            )} />
            {status || "Active"}
        </span>
    );
}

function getInitials(firstName?: string, lastName?: string): string {
    const f = firstName?.charAt(0) ?? "";
    const l = lastName?.charAt(0) ?? "";
    return (f + l).toUpperCase() || "?";
}

function formatDate(d: string | null | undefined) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Screen ── */

export function EmployeeDirectoryScreen() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [page, setPage] = useState(1);
    const limit = 25;

    const { data, isLoading, isError } = useEmployees({
        search: search || undefined,
        status: statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
        departmentId: departmentFilter === "All" ? undefined : departmentFilter,
        page,
        limit,
    });

    const departmentsQuery = useDepartments();
    const departments: any[] = departmentsQuery.data?.data ?? [];

    const employees: any[] = data?.data ?? [];
    const meta = (data as any)?.meta;
    const total = meta?.total ?? employees.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Employee Directory</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {total > 0 ? `${total} employee${total !== 1 ? "s" : ""}` : "Manage your workforce"}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/app/company/hr/employees/new")}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Employee
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or department..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            {STATUS_FILTERS.map((f) => (
                                <option key={f} value={f}>{f === "All" ? "All Statuses" : f}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Department:</span>
                        <select
                            value={departmentFilter}
                            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            <option value="All">All Departments</option>
                            {departments.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load employees. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={10} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Employee ID</th>
                                    <th className="py-4 px-6 font-bold">Department</th>
                                    <th className="py-4 px-6 font-bold">Designation</th>
                                    <th className="py-4 px-6 font-bold">Location</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold">Joined</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {employees.map((emp: any) => {
                                    const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || "—";
                                    return (
                                        <tr
                                            key={emp.id}
                                            onClick={() => navigate(`/app/company/hr/employees/${emp.id}`)}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {emp.photoUrl ? (
                                                        <img
                                                            src={emp.photoUrl}
                                                            alt={fullName}
                                                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-sm font-bold text-accent-700 dark:text-accent-400">
                                                            {getInitials(emp.firstName, emp.lastName)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white block">{fullName}</span>
                                                        {emp.officialEmail && (
                                                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{emp.officialEmail}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {emp.employeeCode || emp.employeeId || "—"}
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                                {emp.departmentName || emp.department?.name || "—"}
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">
                                                {emp.designationName || emp.designation?.name || "—"}
                                            </td>
                                            <td className="py-4 px-6">
                                                {emp.locationName || emp.location?.name ? (
                                                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                                                        <MapPin size={12} className="text-neutral-400 shrink-0" />
                                                        <span>{emp.locationName || emp.location?.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">{"—"}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <EmployeeStatusBadge status={emp.status ?? "Active"} />
                                            </td>
                                            <td className="py-4 px-6 text-neutral-500 dark:text-neutral-400 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-neutral-400 shrink-0" />
                                                    {formatDate(emp.joiningDate ?? emp.joinedDate)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => navigate(`/app/company/hr/employees/${emp.id}`)}
                                                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/app/company/hr/employees/${emp.id}?edit=true`)}
                                                        className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {employees.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState
                                                icon="search"
                                                title="No employees found"
                                                message="Try adjusting your search or filters, or add your first employee."
                                                action={{ label: "Add Employee", onClick: () => navigate("/app/company/hr/employees/new") }}
                                            />
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
                        Showing {employees.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            disabled={!meta || page >= (meta.totalPages ?? 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
