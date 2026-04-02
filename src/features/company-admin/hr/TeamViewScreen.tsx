import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Eye,
    CalendarDays,
    UserCircle,
    Mail,
    Phone,
    Briefcase,
    Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useTeamMembers,
    usePendingMssApprovals,
    useTeamAttendance,
    useTeamLeaveCalendar,
} from "@/features/company-admin/api/use-ess-queries";
import { useApproveRequest, useRejectRequest } from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

// formatDate moved inside component

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string }> = {
        pending: { icon: Clock, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50" },
        approved: { icon: CheckCircle2, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" },
        rejected: { icon: XCircle, cls: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50" },
    };
    const c = config[s] ?? config.pending;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", c.cls)}>
            <Icon size={10} />
            {status}
        </span>
    );
}

function AttendanceDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        present: "bg-success-500",
        absent: "bg-danger-500",
        leave: "bg-primary-500",
        half_day: "bg-warning-500",
        not_checked_in: "bg-neutral-300 dark:bg-neutral-600",
    };
    return <div className={cn("w-2.5 h-2.5 rounded-full", colors[status] ?? colors.not_checked_in)} />;
}

/* ── Screen ── */

export function TeamViewScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const teamQuery = useTeamMembers();
    const pendingQuery = usePendingMssApprovals();
    const attendanceQuery = useTeamAttendance();
    const leaveCalendarQuery = useTeamLeaveCalendar();

    const approveMutation = useApproveRequest();
    const rejectMutation = useRejectRequest();

    const teamMembers: any[] = (teamQuery.data?.data as any) ?? [];
    const pendingApprovals: any[] = (pendingQuery.data?.data as any) ?? [];
    const teamAttendance: any[] = (attendanceQuery.data?.data as any) ?? [];
    const leaveCalendar: any[] = (leaveCalendarQuery.data?.data as any) ?? [];

    const handleApprove = async (req: any) => {
        try {
            await approveMutation.mutateAsync({ id: req.id });
            showSuccess("Approved", `Request from ${req.employeeName ?? "employee"} has been approved.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleReject = async (req: any) => {
        try {
            await rejectMutation.mutateAsync({ id: req.id, data: { note: "Rejected by manager" } });
            showSuccess("Rejected", `Request from ${req.employeeName ?? "employee"} has been rejected.`);
        } catch (err) {
            showApiError(err);
        }
    };

    // Attendance summary
    const presentCount = teamAttendance.filter((a: any) => a.status === "present").length;
    const absentCount = teamAttendance.filter((a: any) => a.status === "absent").length;
    const onLeaveCount = teamAttendance.filter((a: any) => a.status === "leave").length;
    const notCheckedInCount = teamAttendance.filter((a: any) => a.status === "not_checked_in" || !a.status).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Team View</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manager self-service: team members, approvals, attendance, and leave</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Team Members ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                            <Users size={16} className="text-primary-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Team Members</h3>
                        <span className="ml-auto text-xs font-bold text-neutral-400">{teamMembers.length} members</span>
                    </div>
                    {teamQuery.isLoading ? (
                        <div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
                    ) : teamMembers.length === 0 ? (
                        <EmptyState icon="list" title="No team members" message="Direct reportees will appear here." />
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {teamMembers.map((m: any) => {
                                const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.fullName || m.email || "Employee";
                                return (
                                    <div key={m.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-primary-950 dark:text-white text-sm truncate">{name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] text-neutral-400 flex items-center gap-1"><Briefcase size={9} />{m.designation ?? m.jobTitle ?? "—"}</span>
                                                <span className="text-[10px] text-neutral-400">{m.department ?? ""}</span>
                                            </div>
                                        </div>
                                        {m.email && (
                                            <a href={`mailto:${m.email}`} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors shrink-0">
                                                <Mail size={14} />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pending Approvals ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/20 flex items-center justify-center">
                            <Clock size={16} className="text-warning-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Pending Approvals</h3>
                        {pendingApprovals.length > 0 && (
                            <span className="ml-auto text-[10px] font-bold bg-warning-500 text-white rounded-full px-2 py-0.5">{pendingApprovals.length}</span>
                        )}
                    </div>
                    {pendingQuery.isLoading ? (
                        <div className="p-4 space-y-3"><SkeletonCard /><SkeletonCard /></div>
                    ) : pendingApprovals.length === 0 ? (
                        <EmptyState icon="list" title="No pending approvals" message="All requests have been actioned." />
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {pendingApprovals.map((req: any) => (
                                <div key={req.id} className="px-6 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-primary-950 dark:text-white text-sm">{req.employeeName ?? "Employee"}</p>
                                            <p className="text-[10px] text-neutral-400 capitalize">{(req.requestType ?? "").replace(/_/g, " ")} &bull; {formatDate(req.createdAt)}</p>
                                        </div>
                                        <StatusBadge status={req.status ?? "Pending"} />
                                    </div>
                                    {req.description && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-1">{req.description}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 py-1.5 rounded-lg bg-success-600 hover:bg-success-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 size={11} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(req)}
                                            disabled={rejectMutation.isPending}
                                            className="flex-1 py-1.5 rounded-lg bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle size={11} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Team Attendance (Today) ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-success-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Team Attendance Today</h3>
                    </div>
                    {attendanceQuery.isLoading ? (
                        <div className="p-4"><SkeletonCard /></div>
                    ) : (
                        <>
                            {/* Summary bar */}
                            <div className="px-6 py-3 grid grid-cols-4 gap-2 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-success-600 dark:text-success-400">{presentCount}</p>
                                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Present</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-danger-600 dark:text-danger-400">{absentCount}</p>
                                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Absent</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{onLeaveCount}</p>
                                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Leave</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-neutral-500 dark:text-neutral-400">{notCheckedInCount}</p>
                                    <p className="text-[10px] text-neutral-400 uppercase font-bold">Pending</p>
                                </div>
                            </div>
                            {teamAttendance.length === 0 ? (
                                <EmptyState icon="list" title="No attendance data" message="Attendance data for today will appear here." />
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                                    {teamAttendance.map((a: any) => (
                                        <div key={a.id ?? a.employeeId} className="flex items-center gap-3 px-6 py-2.5">
                                            <AttendanceDot status={a.status ?? "not_checked_in"} />
                                            <span className="text-sm font-semibold text-primary-950 dark:text-white flex-1 truncate">
                                                {a.employeeName ?? "Employee"}
                                            </span>
                                            <span className="text-[10px] text-neutral-400 font-mono">{a.checkIn ?? "—"}</span>
                                            <span className="text-[10px] text-neutral-300">/</span>
                                            <span className="text-[10px] text-neutral-400 font-mono">{a.checkOut ?? "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Team Leave Calendar ── */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                            <CalendarDays size={16} className="text-accent-600" />
                        </div>
                        <h3 className="text-sm font-bold text-primary-950 dark:text-white">Team Leave Calendar</h3>
                    </div>
                    {leaveCalendarQuery.isLoading ? (
                        <div className="p-4"><SkeletonCard /></div>
                    ) : leaveCalendar.length === 0 ? (
                        <EmptyState icon="list" title="No upcoming leave" message="Team leave schedule will appear here." />
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/50">
                            {leaveCalendar.map((entry: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-accent-600 dark:text-accent-400 uppercase leading-none">
                                            {entry.startDate ? fmt.date(entry.startDate) : ""}
                                        </span>
                                        <span className="text-sm font-bold text-accent-700 dark:text-accent-400 leading-none">
                                            {entry.startDate ? new Date(entry.startDate).getDate() : ""}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary-950 dark:text-white text-sm truncate">{entry.employeeName ?? "Employee"}</p>
                                        <p className="text-[10px] text-neutral-400">
                                            {formatDate(entry.startDate)} - {formatDate(entry.endDate)} &bull; {entry.leaveType ?? "Leave"} &bull; {entry.days ?? 1} day(s)
                                        </p>
                                    </div>
                                    <StatusBadge status={entry.status ?? "Approved"} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
