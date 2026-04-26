import { useState, useRef, useCallback, useEffect } from "react";
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
    XCircle,
    BadgeCheck,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import QRCodeReact from "react-qr-code";
import { useDashboardToday, useDashboardOnSite, useVisitByCode } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckOutVisit, useCreateVisit, useCheckWatchlist } from "@/features/company-admin/api/use-visitor-mutations";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
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
        visitorEmail: "",
        visitorCompany: "",
        purpose: "" as string,
        hostEmployeeId: "",
        visitorTypeId: "",
        plantId: "",
    });

    // Badge QR modal state after check-in
    const [checkedInBadge, setCheckedInBadge] = useState<{ visitorName: string; badgeNumber: string; visitCode: string } | null>(null);

    // QR Scanner state
    const [showQrScanner, setShowQrScanner] = useState(false);
    const qrScannerRef = useRef<Html5Qrcode | null>(null);
    const qrContainerId = "qr-reader-container";

    // Webcam photo state
    const [showPhotoCamera, setShowPhotoCamera] = useState(false);
    const photoVideoRef = useRef<HTMLVideoElement>(null);
    const photoCanvasRef = useRef<HTMLCanvasElement>(null);

    const employeesQuery = useEmployees({ limit: 500 });
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];

    const todayQuery = useDashboardToday();
    const onSiteQuery = useDashboardOnSite();
    const codeQuery = useVisitByCode(searchCode);

    const todayData = todayQuery.data?.data ?? {};
    const expectedVisitors: any[] = (todayData.visitors ?? todayData.visits ?? []).filter(
        (v: any) => v.status === "EXPECTED" || v.status === "ARRIVED"
    );
    const onSiteVisitors: any[] = onSiteQuery.data?.data ?? [];
    const foundVisit = codeQuery.data?.data;

    // ── QR Scanner functions ──
    const startQrScanner = useCallback(async () => {
        setShowQrScanner(true);
        // Wait for DOM element to render
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(qrContainerId);
                qrScannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        // Extract visit code from URL or use raw text
                        let code = decodedText;
                        // If it's a URL like /visit/register/PLT-2 or contains a visit code
                        const urlMatch = decodedText.match(/\/visit\/(?:register\/)?([A-Z0-9-]+)/i);
                        if (urlMatch) code = urlMatch[1]!;
                        // Also handle raw visit codes
                        const codeMatch = decodedText.match(/^[A-Z0-9]{6}$/i);
                        if (codeMatch) code = codeMatch[0]!;

                        setVisitCode(code.toUpperCase());
                        setSearchCode(code.toUpperCase());
                        stopQrScanner();
                        showSuccess("QR Scanned", `Code: ${code.toUpperCase()}`);
                    },
                    () => { /* ignore scan failures */ },
                );
            } catch (err) {
                showError("Camera Error", "Could not access camera. Please check permissions.");
                setShowQrScanner(false);
            }
        }, 100);
    }, []);

    const stopQrScanner = useCallback(() => {
        if (qrScannerRef.current?.isScanning) {
            qrScannerRef.current.stop().catch(() => {});
            qrScannerRef.current.clear();
        }
        qrScannerRef.current = null;
        setShowQrScanner(false);
    }, []);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (qrScannerRef.current?.isScanning) {
                qrScannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    // ── Webcam Photo functions ──
    const startPhotoCamera = useCallback(async () => {
        setShowPhotoCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 320 } });
            if (photoVideoRef.current) {
                photoVideoRef.current.srcObject = stream;
                photoVideoRef.current.play();
            }
        } catch {
            showError("Camera Error", "Could not access camera.");
            setShowPhotoCamera(false);
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (!photoVideoRef.current || !photoCanvasRef.current) return;
        const canvas = photoCanvasRef.current;
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(photoVideoRef.current, 0, 0, 320, 320);
        setVisitorPhoto(canvas.toDataURL("image/jpeg", 0.7));
        stopPhotoCamera();
    }, []);

    const stopPhotoCamera = useCallback(() => {
        if (photoVideoRef.current?.srcObject) {
            (photoVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            photoVideoRef.current.srcObject = null;
        }
        setShowPhotoCamera(false);
    }, []);

    const handleLookupCode = () => {
        if (visitCode.trim()) {
            setSearchCode(visitCode.trim());
        }
    };

    const handleCheckIn = async (id: string) => {
        try {
            setActionId(id);
            const checkInData: Record<string, unknown> = {};
            if (visitorPhoto) checkInData.visitorPhoto = visitorPhoto;
            // checkInGateId is required by the backend -- use the visit's assigned gate or first location gate
            const visit = expectedVisitors.find((v: any) => v.id === id) ?? foundVisit;
            if (visit?.gateId) {
                checkInData.checkInGateId = visit.gateId;
            } else if (visit?.checkInGateId) {
                checkInData.checkInGateId = visit.checkInGateId;
            }
            const result = await checkInMutation.mutateAsync({
                id,
                data: Object.keys(checkInData).length > 0 ? checkInData : undefined,
            });
            const badgeNo = result?.data?.badgeNumber;
            const warning = result?.data?.watchlistWarning;
            if (warning) showWarning("Watchlist Alert", warning);
            const checkInWarnings: string[] = result?.data?.warnings ?? [];
            if (checkInWarnings.length) {
                checkInWarnings.forEach((w: string) => showWarning("Requirement", w));
            }
            showSuccess("Checked In", badgeNo ? `Badge: ${badgeNo}` : "Visitor has been checked in successfully.");

            // Show badge QR modal
            const visitData = expectedVisitors.find((v: any) => v.id === id) ?? foundVisit;
            setCheckedInBadge({
                visitorName: visitData?.visitorName ?? "Visitor",
                badgeNumber: badgeNo ?? "",
                visitCode: visitData?.visitCode ?? "",
            });

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
            await checkOutMutation.mutateAsync({ id, data: { checkOutMethod: "SECURITY_DESK" } });
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

            const today = new Date().toISOString().slice(0, 10);
            await createMutation.mutateAsync({
                visitorName: walkInForm.visitorName,
                visitorMobile: walkInForm.visitorMobile || undefined,
                visitorEmail: walkInForm.visitorEmail || undefined,
                visitorCompany: walkInForm.visitorCompany || undefined,
                purpose: walkInForm.purpose || "OTHER",
                hostEmployeeId: walkInForm.hostEmployeeId || undefined,
                visitorTypeId: walkInForm.visitorTypeId || undefined,
                plantId: walkInForm.plantId || undefined,
                expectedDate: today,
            });
            showSuccess("Walk-In Registered", `${walkInForm.visitorName} has been registered.`);
            setShowWalkIn(false);
            setWalkInForm({ visitorName: "", visitorMobile: "", visitorEmail: "", visitorCompany: "", purpose: "", hostEmployeeId: "", visitorTypeId: "", plantId: "" });
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
                        {showQrScanner ? (
                            <div className="space-y-2">
                                <div id={qrContainerId} className="rounded-xl overflow-hidden bg-black" />
                                <button
                                    onClick={stopQrScanner}
                                    className="w-full py-2 rounded-xl border border-danger-300 text-danger-600 text-sm font-bold hover:bg-danger-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle size={14} /> Stop Scanner
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startQrScanner}
                                className="w-full py-3 rounded-xl border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-sm font-bold transition-colors hover:bg-accent-100 dark:hover:bg-accent-900/30 flex items-center justify-center gap-2"
                            >
                                <QrCode size={16} />
                                Scan QR Code
                            </button>
                        )}
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
                                <p className="text-neutral-500 dark:text-neutral-400">Host: {foundVisit.hostEmployeeName ?? foundVisit.hostEmployeeId ?? "---"}</p>
                            </div>
                            {(foundVisit.status === "EXPECTED" || foundVisit.status === "ARRIVED") && (
                                <div className="space-y-2">
                                    {/* Visitor Photo */}
                                    {visitorPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <img src={visitorPhoto} alt="Visitor" className="w-12 h-12 rounded-full object-cover border-2 border-success-200" />
                                            <span className="text-xs text-success-600 font-medium flex-1">Photo captured</span>
                                            <button type="button" onClick={() => setVisitorPhoto(null)} className="text-xs text-danger-500 hover:text-danger-700 font-semibold">Remove</button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={startPhotoCamera} className="flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 transition-colors">
                                            <Camera className="w-4 h-4" />
                                            <span>Capture Visitor Photo</span>
                                        </button>
                                    )}
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
                            {visitorPhoto ? (
                                <>
                                    <img src={visitorPhoto} alt="Visitor" className="w-8 h-8 rounded-full object-cover border border-success-200" />
                                    <span className="text-xs text-success-600 dark:text-success-400 font-medium">Photo ready</span>
                                    <button type="button" onClick={() => setVisitorPhoto(null)} className="text-xs text-danger-500 hover:text-danger-700 font-semibold">Clear</button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startPhotoCamera}
                                    className="flex items-center gap-2 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                    <span>Capture Photo</span>
                                </button>
                            )}
                        </div>

            {/* Webcam Photo Capture Modal */}
            {showPhotoCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><Camera size={18} /> Capture Visitor Photo</h2>
                            <button onClick={stopPhotoCamera} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-700 bg-black">
                                <video ref={photoVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            </div>
                            <canvas ref={photoCanvasRef} className="hidden" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">Position the visitor's face within the circle</p>
                            <div className="flex gap-3 w-full">
                                <button type="button" onClick={stopPhotoCamera} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Cancel</button>
                                <button type="button" onClick={capturePhoto} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"><Camera size={14} /> Capture</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                                            <td className="py-3 px-5 text-neutral-600 dark:text-neutral-400 text-xs">{v.hostEmployeeName ?? v.hostEmployeeId ?? "---"}</td>
                                            <td className="py-3 px-5 text-neutral-600 dark:text-neutral-400 text-xs">
                                                {v.expectedTime ? fmt.shiftTime(v.expectedTime) : v.expectedDate ? fmt.date(v.expectedDate) : "---"}
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <VisitStatusBadge status={v.status} />
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                {(v.status === "EXPECTED" || v.status === "ARRIVED") && (
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

            {/* Badge QR Modal (shown after successful check-in) */}
            {checkedInBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2">
                                <BadgeCheck size={18} className="text-success-600" /> Check-In Complete
                            </h2>
                            <button onClick={() => setCheckedInBadge(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="text-center">
                                <p className="text-lg font-bold text-primary-950 dark:text-white">{checkedInBadge.visitorName}</p>
                                {checkedInBadge.badgeNumber && (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Badge: <span className="font-mono font-semibold">{checkedInBadge.badgeNumber}</span></p>
                                )}
                            </div>
                            {checkedInBadge.visitCode && (
                                <div className="bg-white p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                    <QRCodeReact
                                        value={`${window.location.origin}/visit/${checkedInBadge.visitCode}/badge`}
                                        size={200}
                                    />
                                </div>
                            )}
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                                Show this QR code to the visitor to access their digital badge
                            </p>
                            <button
                                onClick={() => setCheckedInBadge(null)}
                                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email <span className="text-neutral-400 text-[10px] font-normal normal-case">(for digital badge)</span></label>
                                <input
                                    type="email"
                                    value={walkInForm.visitorEmail}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, visitorEmail: e.target.value }))}
                                    placeholder="visitor@company.com"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                />
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
                                <select
                                    value={walkInForm.purpose}
                                    onChange={(e) => setWalkInForm((p) => ({ ...p, purpose: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                                >
                                    <option value="">Select purpose...</option>
                                    <option value="MEETING">Meeting</option>
                                    <option value="DELIVERY">Delivery</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="AUDIT">Audit</option>
                                    <option value="INTERVIEW">Interview</option>
                                    <option value="SITE_TOUR">Site Tour</option>
                                    <option value="PERSONAL">Personal</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <SearchableSelect
                                label="Host Employee"
                                value={walkInForm.hostEmployeeId}
                                onChange={(v) => setWalkInForm((p) => ({ ...p, hostEmployeeId: v }))}
                                options={employees.map((e: any) => ({
                                    value: e.id,
                                    label: `${e.firstName} ${e.lastName}`,
                                    sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                                }))}
                                placeholder="Search employee..."
                            />
                            <SearchableSelect
                                label="Location (Plant)"
                                value={walkInForm.plantId}
                                onChange={(v) => setWalkInForm((p) => ({ ...p, plantId: v }))}
                                options={locations.map((l: any) => ({
                                    value: l.id,
                                    label: l.name,
                                    sublabel: l.city ? `${l.city}, ${l.state ?? ""}` : undefined,
                                }))}
                                placeholder="Select location..."
                            />
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
