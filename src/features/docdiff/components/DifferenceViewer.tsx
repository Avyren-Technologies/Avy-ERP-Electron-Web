import { Eye, EyeOff, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  useDifferences,
  useJob,
} from "../api/use-docdiff-queries";
import {
  useGenerateReport,
  useVerifyDifference,
} from "../api/use-docdiff-mutations";
import type { DetectedDifference, VerificationActionPayload } from "../types/docdiff.types";
import { filtersToParams } from "../utils/difference-filters";
import { useDifferenceNavigation } from "../hooks/useDifferenceNavigation";
import { useSyncScroll } from "../hooks/useSyncScroll";
import { DifferenceList } from "./DifferenceList";
import { DocumentViewer } from "./DocumentViewer";
import { DifferenceDetail } from "./DifferenceDetail";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

interface Props {
  jobId: string;
  onGenerateReport: () => void;
}

export function DifferenceViewer({ jobId, onGenerateReport }: Props) {
  const [showCosmetic, setShowCosmetic] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [pageA, setPageA] = useState(1);
  const [pageB, setPageB] = useState(1);

  const { leftRef, rightRef, syncEnabled, setSyncEnabled, handleScroll } = useSyncScroll();

  const filters = showCosmetic ? {} : filtersToParams({ significance: undefined });
  const diffsQuery = useDifferences(jobId, filters);
  const allDiffs: DetectedDifference[] = diffsQuery.data?.data ?? [];

  const visibleDiffs = showCosmetic
    ? allDiffs
    : allDiffs.filter((d) => d.significance !== "cosmetic");

  const jobQuery = useJob(jobId);
  const job = jobQuery.data?.data;

  const verifyMutation = useVerifyDifference(jobId);
  const generateReport = useGenerateReport(jobId);

  const handleVerify = useCallback(
    (diffId: string, action: VerificationActionPayload) => {
      verifyMutation.mutate({ diffId, action });
    },
    [verifyMutation],
  );

  const nav = useDifferenceNavigation(visibleDiffs, {
    onConfirm: () => {
      if (nav.activeDifference) {
        handleVerify(nav.activeDifference.id, { action: "confirmed" });
      }
    },
    onDismiss: () => {
      if (nav.activeDifference) {
        handleVerify(nav.activeDifference.id, { action: "dismissed" });
      }
    },
  });

  // Sync page viewers when active difference changes
  useEffect(() => {
    const diff = nav.activeDifference;
    if (!diff) return;
    if (diff.page_version_a != null) setPageA(diff.page_version_a);
    if (diff.page_version_b != null) setPageB(diff.page_version_b);
  }, [nav.activeDifference]);

  // Keyboard shortcut for help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "?") setShowKeyboardHelp((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync();
      onGenerateReport();
    } catch {
      // Error handling is performed by the mutation's onError callback.
    }
  };

  // Compute actual page counts from differences (not total_differences which is the diff count)
  const maxPageA = Math.max(1, ...((allDiffs ?? []).map(d => d.page_version_a).filter(Boolean) as number[]));
  const maxPageB = Math.max(1, ...((allDiffs ?? []).map(d => d.page_version_b).filter(Boolean) as number[]));
  const totalPagesA = allDiffs.length > 0 ? maxPageA : 1;
  const totalPagesB = allDiffs.length > 0 ? maxPageB : 1;
  const activeDiffId = nav.activeDifference?.id ?? null;

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-700">
            Difference Viewer
          </h2>
          {job && (
            <span className="text-xs text-neutral-500">
              {job.differences_verified} / {job.total_differences} verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Cosmetic toggle */}
          <button
            type="button"
            onClick={() => setShowCosmetic((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showCosmetic
                ? "bg-indigo-100 text-indigo-700"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
            title="Toggle cosmetic differences"
          >
            {showCosmetic ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            Cosmetic
          </button>

          {/* Sync scroll toggle */}
          <button
            type="button"
            onClick={() => setSyncEnabled((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              syncEnabled
                ? "bg-indigo-100 text-indigo-700"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
            title="Toggle sync scrolling"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Scroll
          </button>

          {/* Keyboard help */}
          <button
            type="button"
            onClick={() => setShowKeyboardHelp(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors border border-neutral-200"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>

          {/* Generate report */}
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generateReport.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Diff Report
          </button>
        </div>
      </div>

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: difference list */}
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <DifferenceList
            jobId={jobId}
            activeDiffId={activeDiffId}
            onSelectDifference={nav.goToDifference}
            differences={visibleDiffs}
          />
        </div>

        {/* Center: dual document viewers */}
        <div className="flex flex-1 min-w-0">
          <div ref={leftRef} onScroll={() => handleScroll("left")} className="flex-1 overflow-auto border-l border-neutral-200">
            <DocumentViewer
              jobId={jobId}
              role="version_a"
              pageNumber={pageA}
              differences={allDiffs}
              activeDiffId={activeDiffId}
              onPageChange={setPageA}
              totalPages={totalPagesA}
            />
          </div>
          <div ref={rightRef} onScroll={() => handleScroll("right")} className="flex-1 overflow-auto border-l border-neutral-200">
            <DocumentViewer
              jobId={jobId}
              role="version_b"
              pageNumber={pageB}
              differences={allDiffs}
              activeDiffId={activeDiffId}
              onPageChange={setPageB}
              totalPages={totalPagesB}
            />
          </div>
        </div>
      </div>

      {/* Bottom: difference detail - ALWAYS VISIBLE */}
      {nav.activeDifference && (
        <div className="flex-shrink-0 border-t-2 border-indigo-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <DifferenceDetail
            difference={nav.activeDifference}
            jobId={jobId}
            onVerify={handleVerify}
            onPrevious={nav.goPrevious}
            onNext={nav.goNext}
            hasPrevious={nav.hasPrevious}
            hasNext={nav.hasNext}
          />
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </div>
  );
}
