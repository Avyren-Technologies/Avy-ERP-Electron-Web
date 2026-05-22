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
import { useDashboardToday, useDashboardOnSite, useVisitByCode, useVmsConfig, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCheckInVisit, useCheckInRecurringPass, useCheckOutVisit, useCreateVisit, useCheckWatchlist } from "@/features/company-admin/api/use-visitor-mutations";
import { visitorsApi } from "@/lib/api/visitors";
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
    const recurringPassCheckInMutation = useCheckInRecurringPass();
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

    // Pre-check-in modal state
    const [pendingCheckIn, setPendingCheckIn] = useState<any>(null);
    const [passInfo, setPassInfo] = useState<{ type: string; data: any } | null>(null);
    const [preCheckIdType, setPreCheckIdType] = useState("");
    const [preCheckIdNumber, setPreCheckIdNumber] = useState("");
    const [preCheckGateId, setPreCheckGateId] = useState("");

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
    const configQuery = useVmsConfig();
    const gatesQuery = useGates();

    const vmsConfig = configQuery.data?.data;
    const gatesList: any[] = (gatesQuery.data?.data ?? []).filter((g: any) => g.isActive !== false);

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
                        stopQrScanner();
                        showSuccess("QR Scanned", `Code: ${code.toUpperCase()}`);
                        // Use unified lookup after setting code
                        visitorsApi.gateLookup(code.toUpperCase()).then((result) => {
                            const entityType = result?.data?.type;
                            const entity = result?.data?.data;
                            if (entityType === "visit") {
                                setSearchCode(code.toUpperCase());
                            } else if (entityType === "recurring_pass" || entityType === "vehicle_pass" || entityType === "material_pass") {
                                setPassInfo({ type: entityType, data: entity });
                            }
                        }).catch(() => showWarning("Not Found", "No visit or pass found for scanned code"));
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

    const [lookupLoading, setLookupLoading] = useState(false);

    const handleLookupCode = async () => {
        if (!visitCode.trim()) return;
        setLookupLoading(true);
        setSearchCode(""); // Clear old visit-by-code query
        setPassInfo(null);
        try {
            const result = await visitorsApi.gateLookup(visitCode.trim());
            const entityType = result?.data?.type;
            const entity = result?.data?.data;
            if (!entity?.id) { showWarning("Not Found", "No visit or pass found for this code"); return; }

            if (entityType === "visit") {
                setSearchCode(visitCode.trim()); // trigger useVisitByCode for display
            } else if (entityType === "recurring_pass" || entityType === "vehicle_pass" || entityType === "material_pass") {
                setPassInfo({ type: entityType, data: entity });
            }
        } catch {
            showWarning("Not Found", "No visit or pass found for this code");
        } finally {
            setLookupLoading(false);
        }
    };

    // Requirement logic: mirrors backend logic
    const getRequirements = (visit: any) => {
        const vt = visit?.visitorType;
        const photoRequired = vmsConfig?.photoCapture === "ALWAYS" || (vmsConfig?.photoCapture === "PER_VISITOR_TYPE" && vt?.requirePhoto);
        const idRequired = vmsConfig?.idVerification === "ALWAYS" || (vmsConfig?.idVerification === "PER_VISITOR_TYPE" && vt?.requireIdVerification);
        const preArrivalRequired = vmsConfig?.preArrivalForm === "ALWAYS" || (vmsConfig?.preArrivalForm === "PER_VISITOR_TYPE" && vt?.requirePreArrivalForm);
        return { photoRequired: !!photoRequired, idRequired: !!idRequired, preArrivalRequired: !!preArrivalRequired };
    };

    // Open pre-check-in modal instead of directly checking in
    const openPreCheckIn = (visit: any) => {
        setPreCheckIdType("");
        setPreCheckIdNumber("");
        setPreCheckGateId(visit?.gateId ?? visit?.checkInGateId ?? "");
        setPendingCheckIn(visit);
    };

    const handleCheckIn = async (id: string) => {
        // Find the visit data and open pre-check-in modal
        const visit = expectedVisitors.find((v: any) => v.id === id) ?? foundVisit;
        if (visit) openPreCheckIn(visit);
    };

    const handlePreCheckInSubmit = async () => {
        if (!pendingCheckIn?.id) return;
        try {
            setActionId(pendingCheckIn.id);
            const checkInData: Record<string, unknown> = {};
            if (visitorPhoto) checkInData.visitorPhoto = visitorPhoto;
            if (preCheckIdType) checkInData.governmentIdType = preCheckIdType;
            if (preCheckIdNumber.trim()) checkInData.governmentIdNumber = preCheckIdNumber.trim();
            if (pendingCheckIn?.gateId) checkInData.checkInGateId = pendingCheckIn.gateId;

            const result = await checkInMutation.mutateAsync({
                id: pendingCheckIn.id,
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

            setCheckedInBadge({
                visitorName: pendingCheckIn?.visitorName ?? "Visitor",
                badgeNumber: badgeNo ?? "",
                visitCode: pendingCheckIn?.visitCode ?? "",
            });

            setPendingCheckIn(null);
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
                            disabled={!visitCode.trim() || codeQuery.isFetching || lookupLoading}
                            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {(codeQuery.isFetching || lookupLoading) ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
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

                    {searchCode && !codeQuery.isFetching && !foundVisit && !passInfo && (
                        <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800/50 rounded-xl text-sm text-warning-700 dark:text-warning-400 font-medium">
                            No visit found for code &quot;{searchCode}&quot;. Check the code or register as walk-in.
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

            {/* Pre-Check-In Modal */}
            {pendingCheckIn && (() => {
                const reqs = getRequirements(pendingCheckIn);
                const approvalPending = pendingCheckIn.approvalStatus === "PENDING";
                const approvalRejected = pendingCheckIn.approvalStatus === "REJECTED";
                const preArrivalPending = reqs.preArrivalRequired && !pendingCheckIn.preArrivalSubmittedAt;
                const hasBlocker = approvalPending || approvalRejected || preArrivalPending;
                const photoSatisfied = !!visitorPhoto || !!pendingCheckIn.visitorPhoto;
                const idSatisfied = (!!preCheckIdType && !!preCheckIdNumber.trim()) || !!pendingCheckIn.governmentIdType;
                const canSubmit = !hasBlocker && (!reqs.photoRequired || photoSatisfied) && (!reqs.idRequired || idSatisfied);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                                <h2 className="text-lg font-bold text-primary-950 dark:text-white flex items-center gap-2"><LogIn size={18} /> Pre-Check-In</h2>
                                <button onClick={() => setPendingCheckIn(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                                {/* Visitor Info */}
                                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-400">
                                        {(pendingCheckIn.visitorName || "?")[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary-950 dark:text-white truncate">{pendingCheckIn.visitorName}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{pendingCheckIn.visitorCompany || "No company"} &middot; {pendingCheckIn.visitCode}</p>
                                    </div>
                                    {pendingCheckIn.visitorType?.name && (
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ backgroundColor: (pendingCheckIn.visitorType.badgeColour ?? "#4F46E5") + "15", color: pendingCheckIn.visitorType.badgeColour ?? "#4F46E5" }}>{pendingCheckIn.visitorType.name}</span>
                                    )}
                                </div>

                                {/* Approval Blocker */}
                                {(approvalPending || approvalRejected) && (
                                    <div className={`p-5 rounded-xl border-2 text-center ${approvalRejected ? "border-danger-300 bg-danger-50 dark:bg-danger-900/10" : "border-warning-300 bg-warning-50 dark:bg-warning-900/10"}`}>
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${approvalRejected ? "bg-danger-100" : "bg-warning-100"}`}>
                                            {approvalRejected
                                                ? <XCircle size={24} className="text-danger-600" />
                                                : <Clock size={24} className="text-warning-600" />
                                            }
                                        </div>
                                        <h3 className={`text-sm font-bold ${approvalRejected ? "text-danger-700" : "text-warning-700"}`}>
                                            {approvalRejected ? "Visit Rejected" : "Awaiting Host Approval"}
                                        </h3>
                                        <p className={`text-xs mt-1 ${approvalRejected ? "text-danger-600" : "text-warning-600"}`}>
                                            {approvalRejected
                                                ? "This visit has been rejected by the host employee. The visitor cannot be checked in."
                                                : "The host employee has not yet approved this visit. Please ask the visitor to contact their host or wait for approval."}
                                        </p>
                                    </div>
                                )}

                                {/* Pre-Arrival Form Blocker */}
                                {preArrivalPending && !approvalPending && !approvalRejected && (
                                    <div className="p-5 rounded-xl border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/10 text-center">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-warning-700">Pre-Arrival Form Required</h3>
                                        <p className="text-xs text-warning-600 mt-1 mb-4">
                                            This visitor must complete the pre-arrival form before check-in. Ask them to check their invitation email or scan the QR code below.
                                        </p>
                                        <div className="inline-block bg-white p-4 rounded-xl border border-neutral-200">
                                            <QRCodeReact value={`${window.location.origin}/visit/${pendingCheckIn.visitCode}`} size={150} />
                                            <p className="text-[10px] text-neutral-500 mt-2">Scan to open Pre-Arrival Form</p>
                                        </div>
                                    </div>
                                )}

                                {/* Photo & ID sections — only when no blockers */}
                                {!hasBlocker && (<>
                                {/* Photo Section */}
                                <div className={`p-4 rounded-xl border ${reqs.photoRequired && !photoSatisfied ? "border-danger-300 bg-danger-50/30 dark:bg-danger-900/10" : "border-neutral-200 dark:border-neutral-700"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Visitor Photo {reqs.photoRequired ? "" : "(Optional)"}</label>
                                        {reqs.photoRequired && <span className="text-[10px] font-bold text-danger-600 bg-danger-50 px-2 py-0.5 rounded">Required</span>}
                                    </div>
                                    {visitorPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <img src={visitorPhoto} alt="Visitor" className="w-14 h-14 rounded-full object-cover border-2 border-success-200" />
                                            <span className="text-xs text-success-600 font-medium flex-1">Photo captured</span>
                                            <button type="button" onClick={startPhotoCamera} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Retake</button>
                                            <button type="button" onClick={() => setVisitorPhoto(null)} className="text-xs text-danger-500 hover:text-danger-700 font-semibold">Remove</button>
                                        </div>
                                    ) : pendingCheckIn.visitorPhoto ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-success-600 font-medium bg-success-50 px-3 py-1.5 rounded-lg">Photo already on file</span>
                                            <button type="button" onClick={startPhotoCamera} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">Take New</button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={startPhotoCamera} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-primary-700 dark:text-primary-400 font-semibold transition-colors w-full justify-center">
                                            <Camera className="w-4 h-4" /> Capture Photo
                                        </button>
                                    )}
                                </div>

                                {/* ID Verification Section */}
                                {vmsConfig?.idVerification !== "NEVER" && (
                                    <div className={`p-4 rounded-xl border ${reqs.idRequired && !idSatisfied ? "border-danger-300 bg-danger-50/30 dark:bg-danger-900/10" : "border-neutral-200 dark:border-neutral-700"}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">ID Verification {reqs.idRequired ? "" : "(Optional)"}</label>
                                            {reqs.idRequired && <span className="text-[10px] font-bold text-danger-600 bg-danger-50 px-2 py-0.5 rounded">Required</span>}
                                        </div>
                                        {pendingCheckIn.governmentIdType ? (
                                            <p className="text-xs text-success-600 font-medium bg-success-50 px-3 py-1.5 rounded-lg inline-block">ID verified: {pendingCheckIn.governmentIdType} — {pendingCheckIn.governmentIdNumber}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <select value={preCheckIdType} onChange={e => setPreCheckIdType(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                                    <option value="">Select ID type...</option>
                                                    <option value="AADHAAR">Aadhaar Card</option>
                                                    <option value="PAN">PAN Card</option>
                                                    <option value="PASSPORT">Passport</option>
                                                    <option value="DRIVING_LICENSE">Driving License</option>
                                                    <option value="VOTER_ID">Voter ID</option>
                                                </select>
                                                <input type="text" value={preCheckIdNumber} onChange={e => setPreCheckIdNumber(e.target.value.toUpperCase())} placeholder="Enter ID number" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Gate is auto-assigned from the QR code scanned at the gate */}
                                </>)}
                            </div>
                            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                                {!canSubmit && <p className="text-xs text-danger-500 text-center">{approvalPending ? "Check-in blocked — awaiting host approval" : approvalRejected ? "Check-in blocked — visit rejected" : preArrivalPending ? "Check-in blocked — pre-arrival form not completed" : "Please complete all required fields before check-in"}</p>}
                                <div className="flex gap-3">
                                    <button onClick={() => setPendingCheckIn(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                                    <button onClick={handlePreCheckInSubmit} disabled={!canSubmit || actionId === pendingCheckIn.id} className="flex-[2] py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                        {actionId === pendingCheckIn.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                        Complete Check-In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Pass Info Modal — recurring, vehicle, material passes */}
            {passInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">
                                {passInfo.type === "recurring_pass" ? "Recurring Pass" : passInfo.type === "vehicle_pass" ? "Vehicle Pass" : "Material Pass"}
                            </h2>
                            <button onClick={() => setPassInfo(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                                <p className="text-xs text-neutral-500 font-mono">{passInfo.data.passNumber}</p>
                                {passInfo.type === "recurring_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.visitorName}</p>
                                        {passInfo.data.visitorCompany && <p className="text-xs text-neutral-500">{passInfo.data.visitorCompany}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700">{passInfo.data.passType}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${passInfo.data.status === "ACTIVE" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>{passInfo.data.status}</span>
                                        </div>
                                        {passInfo.data.validFrom && <p className="text-xs text-neutral-500 mt-2">Valid: {fmt.date(passInfo.data.validFrom)} — {fmt.date(passInfo.data.validUntil)}</p>}
                                    </>
                                )}
                                {passInfo.type === "vehicle_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.vehicleRegNumber}</p>
                                        <p className="text-xs text-neutral-500">{passInfo.data.vehicleType} — Driver: {passInfo.data.driverName}</p>
                                    </>
                                )}
                                {passInfo.type === "material_pass" && (
                                    <>
                                        <p className="text-base font-bold text-primary-950 dark:text-white mt-1">{passInfo.data.description}</p>
                                        <p className="text-xs text-neutral-500">{passInfo.data.type} — Qty: {passInfo.data.quantityIssued} — {passInfo.data.returnStatus}</p>
                                    </>
                                )}
                            </div>

                            {passInfo.type === "recurring_pass" && passInfo.data.status === "ACTIVE" && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await recurringPassCheckInMutation.mutateAsync({ id: passInfo.data.id, data: passInfo.data.gateId ? { gateId: passInfo.data.gateId } : {} });
                                            const badgeNo = result?.data?.badgeNumber;
                                            showSuccess("Checked In", badgeNo ? `Badge: ${badgeNo}` : "Recurring pass visitor checked in");
                                            setPassInfo(null);
                                            setVisitCode("");
                                        } catch (err) { showApiError(err); }
                                    }}
                                    disabled={recurringPassCheckInMutation.isPending}
                                    className="w-full py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {recurringPassCheckInMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                    Check In via Recurring Pass
                                </button>
                            )}
                            {(passInfo.type === "vehicle_pass" || passInfo.type === "material_pass") && (
                                <p className="text-xs text-neutral-500 text-center">This is a {passInfo.type === "vehicle_pass" ? "vehicle" : "material"} gate pass. No visitor check-in is needed.</p>
                            )}

                            <button onClick={() => setPassInfo(null)} className="w-full py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">Close</button>
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
                        <div className="p-6 space-y-4 overflow-y-auto min-h-0">
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
