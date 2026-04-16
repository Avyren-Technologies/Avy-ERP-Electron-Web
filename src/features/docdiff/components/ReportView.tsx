import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  PlusCircle,
} from "lucide-react";
import { useReport } from "../api/use-docdiff-queries";
import { docdiffApi } from "../api/docdiff-api";

interface Props {
  jobId: string;
  onBackToViewer: () => void;
  onNewComparison: () => void;
}

export function ReportView({ jobId, onBackToViewer, onNewComparison }: Props) {
  const { data, isLoading, isError } = useReport(jobId);
  const report = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-neutral-500">
        <FileText className="h-10 w-10 text-neutral-300" />
        <p className="text-sm">Report not available</p>
        <button
          type="button"
          onClick={onBackToViewer}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Return to Viewer
        </button>
      </div>
    );
  }

  const pdfUrl = docdiffApi.getReportPdfUrl(jobId);

  const summaryStats = report.summary_stats ?? {};
  const statEntries = Object.entries(summaryStats);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToViewer}
            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Viewer
          </button>
          <span className="text-neutral-300">|</span>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-neutral-700">
              Diff Report
            </span>
          </div>
          {report.is_partial && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Partial Report
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewComparison}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Comparison
          </button>
          {report.report_pdf_path && (
            <a
              href={pdfUrl}
              download
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {statEntries.length > 0 && (
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap gap-4 flex-shrink-0">
          {statEntries.map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-lg font-bold text-neutral-800">
                {String(val)}
              </p>
              <p className="text-xs text-neutral-500 capitalize">
                {key.replace(/_/g, " ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Report HTML content */}
      <div className="flex-1 overflow-auto p-4">
        {report.report_html ? (
          <div
            className="prose prose-sm max-w-none bg-white rounded-xl border border-neutral-200 p-6"
            dangerouslySetInnerHTML={{ __html: report.report_html }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-400 gap-2">
            <FileText className="h-8 w-8" />
            <p className="text-sm">Report HTML not available</p>
            {report.report_pdf_path && (
              <a
                href={pdfUrl}
                download
                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
              >
                Download PDF instead
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
