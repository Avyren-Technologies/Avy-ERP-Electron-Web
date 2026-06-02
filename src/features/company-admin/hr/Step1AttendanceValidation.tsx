import { Lock, Check, Users, CalendarDays, UserPlus, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendanceSummary } from "@/features/company-admin/api/use-payroll-run-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

export function Step1AttendanceValidation({ runId, runDetail, completedStep, onStepAction, anyMutating }: StepProps) {
    const { data: summaryResp, isLoading } = useAttendanceSummary(runId);
    const summary = summaryResp?.data;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <Lock size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h3 className="font-bold text-primary-950 dark:text-white">Step 1: Lock Attendance</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Review attendance summary and lock for payroll processing</p>
                </div>
            </div>

            {isLoading ? (
                <SkeletonTable rows={4} cols={4} />
            ) : summary ? (
                <>
                    {/* Row 1: Headcount KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Employees", value: summary.headcount?.totalActive ?? runDetail?.employeeCount ?? 0, icon: Users, color: "text-primary-600 dark:text-primary-400" },
                            { label: "With Salary", value: summary.headcount?.withSalary ?? 0, icon: Users, color: "text-success-600 dark:text-success-400" },
                            { label: "Working Days", value: summary.workingDays ?? 0, icon: CalendarDays, color: "text-info-600 dark:text-info-400" },
                            { label: "New Joiners", value: summary.headcount?.newJoiners?.length ?? 0, icon: UserPlus, color: "text-accent-600 dark:text-accent-400" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <item.icon size={14} className={item.color} />
                                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                </div>
                                <p className="text-2xl font-extrabold text-primary-950 dark:text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Row 2: Attendance breakdown (per-employee averages) */}
                    {(() => {
                        const totalActive = summary.headcount?.totalActive ?? runDetail?.employeeCount ?? 1;
                        const present = summary.attendance?.present ?? 0;
                        const absent = summary.attendance?.absent ?? 0;
                        const lop = summary.attendance?.lop ?? 0;
                        const onLeave = summary.attendance?.onLeave ?? 0;
                        const late = summary.attendance?.late ?? 0;
                        return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Present Days (Avg)", value: Math.round(present / totalActive), subtitle: `${present} total records`, color: "text-success-600" },
                            { label: "Absent / LOP (Avg)", value: `${Math.round(absent / totalActive)} / ${Math.round(lop / totalActive)}`, subtitle: `${absent} absent, ${lop} LOP records`, color: "text-danger-600" },
                            { label: "Leave Days (Avg)", value: Math.round(onLeave / totalActive), subtitle: `${onLeave} total records`, color: "text-warning-600" },
                            { label: "Late Arrivals (Avg)", value: Math.round(late / totalActive), subtitle: `${late} total records`, color: "text-amber-600" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                                <p className={cn("text-2xl font-extrabold mt-1", item.color)}>{item.value}</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{item.subtitle}</p>
                            </div>
                        ))}
                    </div>
                        );
                    })()}

                    {/* Alerts */}
                    {(() => {
                        const alertItems = [
                            { key: "employeesWithNoAttendance", label: "Missing Attendance", count: summary.attendance?.employeesWithNoAttendance },
                            { key: "unapprovedLeaves", label: "Unapproved Leaves", count: summary.alerts?.unapprovedLeaves },
                            { key: "unapprovedOvertime", label: "Unapproved Overtime", count: summary.alerts?.unapprovedOvertime },
                            { key: "missingPunchOut", label: "Missing Punch-Out", count: summary.alerts?.missingPunchOut },
                        ].filter((a) => Number(a.count) > 0);
                        return alertItems.length > 0 ? (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Alerts</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {alertItems.map((alert) => (
                                        <div key={alert.key} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3">
                                            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{alert.label}</p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">{alert.count} employee(s) affected</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : null;
                    })()}
                </>
            ) : (
                /* Fallback: show basic data from runDetail */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Employees", value: runDetail?.employeeCount ?? 0 },
                        { label: "Present Days (Avg)", value: runDetail?.avgPresentDays ?? 0 },
                        { label: "Leave Days (Avg)", value: runDetail?.avgLeaveDays ?? 0 },
                        { label: "Exceptions", value: runDetail?.exceptionCount ?? 0 },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{item.label}</span>
                            <p className="text-2xl font-extrabold text-primary-950 dark:text-white mt-1">{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {completedStep === 0 && (
                <button onClick={onStepAction} disabled={anyMutating} className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                    {anyMutating ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    Lock Attendance
                </button>
            )}
            {completedStep > 0 && (
                <div className="flex items-center gap-2 mt-4 text-success-600 dark:text-success-400">
                    <Check size={16} />
                    <span className="text-sm font-bold">Attendance locked</span>
                </div>
            )}
        </div>
    );
}
