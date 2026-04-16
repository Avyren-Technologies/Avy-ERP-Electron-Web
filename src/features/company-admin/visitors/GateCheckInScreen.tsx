import { useState } from "react";
import {
    QrCode,
    Search,
    LogIn,
    LogOut,
    Loader2,
    Users,
    UserCheck,
    Clock,
    Hash,
    User,
    Phone,
    Building2,
    X,
    Camera,
} from "lucide-react";
import { useDashboardToday, useDashboardOnSite, useVisitByCode } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckOutVisit, useCreateVisit, useCheckWatchlist } from "@/features/company-admin/api/use-visitor-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { showSuccess, showApiError, showWarning, showError } from "@/lib/toast";
import { VisitStatusBadge } from "@/features/company-admin/visitors/components/VisitStatusBadge";

/* ── Screen ── */

export function GateCheckInScreen() {
    const fmt = useCompanyFormatter();
    const checkInMutation = useCheckInVisit();
    const checkOutMutation = useCheckOutVisit();
    const createMutation = useCreateVisit();
    const checkWatchlist = useCheckWatchlist();

    const [visitCode, setVisitCode] = useState("");
    const [searchCode, setSearchCode] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);
    const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
    const [showWalkIn, setShowWalkIn] = useState(false);
    const [walkInForm, setWalkInForm] = useState({
        visitorName: "",
        visitorMobile: "",
        visitorCompany: "",
        purpose: "",
        hostName: "",
    });

    const todayQuery = useDashboardToday();
    const onSiteQuery = useDashboardOnSite();
    const codeQuery = useVisitByCode(searchCode);

    const todayData = todayQuery.data?.data ?? {};
    const expectedVisitors: any[] = (todayData.visitors ?? todayData.visits ?? []).filter(
        (v: any) => v.status === "PRE_REGISTERED" || v.status === "APPROVED" || v.status === "PENDING_APPROVAL"
    );
    const onSiteVisitors: any[] = onSiteQuery.data?.data ?? [];
    const foundVisit = codeQuery.data?.data;

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setVisitorPhoto(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleLookupCode = () => {
        if (visitCode.trim()) {
            setSearchCode(visitCode.trim());
        }
    };

    const handleCheckIn = async (id: string) => {
        try {
            setActionId(id);
            await checkInMutation.mutateAsync({
                id,
                data: visitorPhoto ? { visitorPhoto } : undefined,
            });
            showSuccess("Checked In", "Visitor has been checked in successfully.");
            setSearchCode("");
            setVisitCode("");
            setVisitorPhoto(null);
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleCheckOut = async (id: string) => {
        try {
            setActionId(id);
            await checkOutMutation.mutateAsync({ id });
            showSuccess("Checked Out", "Visitor has been checked out.");
        } catch (err) {
            showApiError(err);
        } finally {
            setActionId(null);
        }
    };

    const handleWalkIn = async () => {
        try {
            // Watchlist check (non-blocking on network error)
            if (walkInForm.visitorMobile) {
                try {
                    const watchlistResult = await checkWatchlist.mutateAsync({ mobile: walkInForm.visitorMobile });
                    const match = watchlistResult?.data;
                    if (match?.type === "BLOCKLIST" || match?.listType === "BLOCKLIST") {
                        showError("Blocked Visitor", `${walkInForm.visitorName} is on the blocklist: ${match.reason || "entry denied"}.`);
                        return;
                    }
                    if (match?.type === "WATCHLIST" || match?.listType === "WATCHLIST") {
                        showWarning("Watchlist Match", `${walkInForm.visitorName} is on the watchlist: ${match.reason || "proceed with caution"}.`);
                    }
                } catch {
                    // Network error — proceed with registration anyway
                }
            }

            await createMutation.mutateAsync({
                ...walkInForm,
                isWalkIn: true,
            });
            showSuccess("Walk-In Registered", `${walkInForm.visitorName} has been registered and checked in.`);
            setShowWalkIn(false);
            setWalkInForm({ visitorName: "", visitorMobile: "", visitorCompany: "", purpose: "", hostName: "" });
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header + Quick Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Gate Check-In</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Check in visitors using code, QR, or walk-in registration</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 rounded-xl px-4 py-2">
                        <UserCheck size={16} className="text-success-600 dark:text-success-400" />
                        <span className="text-sm font-bold text-success-700 dark:text-success-400">{onSiteVisitors.length} On-Site</span>
                    </div>
                    <div className="flex items-center gap-2 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800/50 rounded-xl px-4 py-2">
                        <Clock size={16} className="text-info-600 dark:text-info-400" />
                        <span className="text-sm font-bold text-info-700 dark:text-info-400">{expectedVisitors.length} Expected</span>
                    </div>
                </div>
            </div>

            {/* Main Grid: Code Entry + Walk-In */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visit Code Entry */}
                <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Hash size={16} className="text-primary-600 dark:text-primary-400" />
                        Visit Code Entry
                    </h2>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={visitCode}
                            onChange={(e) => setVisitCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleLookupCode()}
                            placeholder="Enter visit code (e.g. VIS-A1B2C3)"
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                        <button
                            onClick={handleLookupCode}
                            disabled={!visitCode.trim() || codeQuery.isFetching}
                            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {codeQuery.isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            Look Up
                        </button>
                        <div className="text-center">
                            <span className="text-xs text-neutral-400">or</span>
                        </div>
                        <button
                            className="w-full py-3 rounded-xl border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-sm font-bold transition-colors hover:bg-accent-100 dark:hover:bg-accent-900/30 flex items-center justify-center gap-2"
                        >
                            <QrCode size={16} />
                            Scan QR Code
                        </button>
                    </div>

                    {/* Found visit display */}
                    {foundVisit && (
                        <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800/50 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-success-700 dark:text-success-400">Visit Found</span>
                                <VisitStatusBadge status={foundVisit.status} />
                            </div>
                            <div className="text-sm space-y-1">
                                <p className="font-bold text-primary-950 dark:text-white">{foundVisit.visitorName}</p>
                                <p className="text-neutral-500 dark:text-neutral-400">{foundVisit.visitorCompany || "No company"}</p>
                                <p className="text-neutral-500 dark:text-neutral-400">Host: {foundVisit.hostName || "---"}</p>
                            </div>
                            {(foundVisit.status === "PRE_REGISTERED" || foundVisit.status === "APPROVED") && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 transition-colors">
                                            <Camera className="w-4 h-4" />
                                            <span>Visitor Photo</span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                        </label>
                                        {visitorPhoto && <span className="text-xs text-success-600 dark:text-success-400 font-medium">Photo captured</span>}
                                    </div>
                                    <button
                                        onClick={() => handleCheckIn(foundVisit.id)}
                                        disabled={actionId === foundVisit.id}
                                        className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionId === foundVisit.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                        Check In Now
                                    </button>
                                </div>
                            )}
                            {foundVisit.status === "CHECKED_IN" && (
                                <button
                                    onClick={() => handleCheckOut(foundVisit.id)}
                                    disabled={actionId === foundVisit.id}
                                    className="w-full py-2.5 rounded-xl bg-neutral-600 hover:bg-neutral-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionId === foundVisit.id ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                    Check Out
                                </button>
                            )}
                        </div>
                    )}

                    {searchCode && !codeQuery.isFetching && !foundVisit && (
                        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/50 rounded-xl text-sm text-warning-700 dark:text-warning-400 font-medium">
                            No visit found for code "{searchCode}". Check the code or register as walk-in.
                        </div>
                    )}

                    {/* Walk-in Quick Button */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            onClick={() => setShowWalkIn(!showWalkIn)}
                            className="w-full py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-bold transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30 flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            Walk-In Registration
                        </button>
                    </div>
                </div>

                {/* Expected Visitors Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-primary-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Users size={16} className="text-primary-600 dark:text-primary-400" />
                            Expected Visitors Today ({expectedVisitors.length})
                        </h2>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 transition-colors">
                                <Camera className="w-4 h-4" />
                                <span>Visitor Photo</span>
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                            {visitorPhoto && <span className="text-xs text-success-600 dark:text-success-400 font-medium">Photo captured</span>}
                        </div>
                    </div>
                    {todayQuery.isLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-3 px-5 font-bold">Visitor</th>
                                        <th className="py-3 px-5 font-bold">Company</th>
                                        <th className="py-3 px-5 font-bold">Host</th>
                                        <th className="py-3 px-5 font-bold">Expected</th>
                                        <th className="py-3 px-5 font-bold text-center">Status</th>
                                        <th className="py-3 px-5 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {expectedVisitors.map((v: any) => (
                                        <tr key={v.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">
                                                        {(v.visitorName || "?")[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{v.visitorName}</span>
                                                        {v.visitCode && <span className="text-[10px] font-mono text-neutral-400 ml-2">{v.visitCode}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5 text-neutral-600 dark:text-neutral-400 text-xs">{v.visitorCompany || "---"}</td>
                                            <td className="py-3 px-5 text-neutral-600 dark:text-neutral-400 text-xs">{v.hostName || v.hostEmployee?.name || "---"}</td>
                                            <td className="py-3 px-5 text-neutral-600 dark:text-neutral-400 text-xs">
                                                {v.expectedArrival ? fmt.time(v.expectedArrival) : "---"}
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <VisitStatusBadge status={v.status} />
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                {(v.status === "PRE_REGISTERED" || v.status === "APPROVED") && (
                                                    <button
                                                        onClick={() => handleCheckIn(v.id)}
                                                        disabled={actionId === v.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-success-600 text-white hover:bg-success-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionId === v.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
                                                        Check In
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {expectedVisitors.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">
                                                No expected visitors for today.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Walk-In Modal */}
            {showWalkIn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Walk-In Registration</h2>
                            <button onClick={() => setShowWalkIn(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                                    Visitor Name <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorName}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorName: e.target.value }))}
                                        placeholder="Full name"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorMobile}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorMobile: e.target.value }))}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Company</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={walkInForm.visitorCompany}
                                        onChange={(e) => setWalkInForm((p) => ({ ...p, visitorCompany: e.target.value }))}
                                        placeholder="Company name"
                                        className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Purpose</label>
                                <input
                                    type="text"
                                    value={walkInForm.purpose}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, purpose: e.target.value }))}
                                    placeholder="Purpose of visit"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Host</label>
                                <input
                                    type="text"
                                    value={walkInForm.hostName}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, hostName: e.target.value }))}
                                    placeholder="Person to meet"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setShowWalkIn(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleWalkIn}
                                disabled={createMutation.isPending || !walkInForm.visitorName}
                                className="flex-1 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                {createMutation.isPending ? "Registering..." : "Register & Check In"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
