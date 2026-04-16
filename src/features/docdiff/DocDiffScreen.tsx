import { useState } from "react";
import { ComparisonHistory } from "./components/ComparisonHistory";
import { DifferenceViewer } from "./components/DifferenceViewer";
import { ProcessingView } from "./components/ProcessingView";
import { ReportView } from "./components/ReportView";
import { UploadView } from "./components/UploadView";

type View = "history" | "upload" | "processing" | "verification" | "report";

export function DocDiffScreen() {
  const [view, setView] = useState<View>("history");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId);
    setView("processing");
  };

  const handleProcessingComplete = () => {
    setView("verification");
  };

  const handleGenerateReport = () => {
    setView("report");
  };

  const handleSelectJob = (jobId: string) => {
    setActiveJobId(jobId);
    setView("verification");
  };

  const handleNewComparison = () => {
    setActiveJobId(null);
    setView("upload");
  };

  const handleBackToViewer = () => {
    setView("verification");
  };

  const handleBackToHistory = () => {
    setView("history");
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Top nav breadcrumb */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-neutral-200 text-xs text-neutral-500 flex-shrink-0">
        <button
          type="button"
          onClick={handleBackToHistory}
          className="hover:text-indigo-600 transition-colors font-medium"
        >
          DocDiff Pro
        </button>
        {view !== "history" && (
          <>
            <span className="text-neutral-300">/</span>
            <span
              className={`capitalize ${view === "verification" || view === "report" ? "font-medium text-neutral-700" : "text-neutral-500"}`}
            >
              {view === "processing"
                ? "Processing"
                : view === "upload"
                  ? "New Comparison"
                  : view === "verification"
                    ? "Difference Viewer"
                    : "Report"}
            </span>
          </>
        )}
        {activeJobId && (
          <span className="ml-auto font-mono text-neutral-400 truncate max-w-[200px]">
            {activeJobId}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "history" && (
          <ComparisonHistory
            onSelectJob={handleSelectJob}
            onNewComparison={handleNewComparison}
          />
        )}

        {view === "upload" && (
          <div className="h-full overflow-auto">
            <UploadView onJobCreated={handleJobCreated} />
          </div>
        )}

        {view === "processing" && activeJobId && (
          <div className="h-full overflow-auto">
            <ProcessingView
              jobId={activeJobId}
              onComplete={handleProcessingComplete}
              onBack={() => setView("upload")}
            />
          </div>
        )}

        {view === "verification" && activeJobId && (
          <DifferenceViewer
            jobId={activeJobId}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {view === "report" && activeJobId && (
          <ReportView
            jobId={activeJobId}
            onBackToViewer={handleBackToViewer}
            onNewComparison={handleNewComparison}
          />
        )}
      </div>
    </div>
  );
}
