import {
  Download,
  ExternalLink,
  FileText,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useJobs } from "../api/use-docdiff-queries";
import { docdiffClient } from "../api/docdiff-client";
import { showApiError } from "@/lib/toast";
import type { JobStatus } from "../types/docdiff.types";

interface Props {
  onSelectJob: (jobId: string) => void;
  onNewComparison: () => void;
}

const STATUS_BADGE: Record<
  JobStatus,
  { label: string; bg: string; text: string }
> = {
  uploading:              { label: "Uploading",         bg: "bg-blue-50",    text: "text-blue-700"    },
  parsing_version_a:      { label: "Parsing A",         bg: "bg-blue-50",    text: "text-blue-700"    },
  parsing_version_b:      { label: "Parsing B",         bg: "bg-blue-50",    text: "text-blue-700"    },
  aligning:               { label: "Aligning",          bg: "bg-indigo-50",  text: "text-indigo-700"  },
  diffing:                { label: "Diffing",           bg: "bg-indigo-50",  text: "text-indigo-700"  },
  classifying:            { label: "Classifying",       bg: "bg-indigo-50",  text: "text-indigo-700"  },
  assembling:             { label: "Assembling",        bg: "bg-indigo-50",  text: "text-indigo-700"  },
  ready_for_review:       { label: "Ready for Review",  bg: "bg-amber-50",   text: "text-amber-700"   },
  verification_in_progress: { label: "In Verification", bg: "bg-violet-50",  text: "text-violet-700"  },
  completed:              { label: "Completed",         bg: "bg-green-50",   text: "text-green-700"   },
  failed:                 { label: "Failed",            bg: "bg-red-50",     text: "text-red-700"     },
  cancelled:              { label: "Cancelled",         bg: "bg-neutral-100", text: "text-neutral-500" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function ComparisonHistory({ onSelectJob, onNewComparison }: Props) {
  const { data, isLoading, refetch } = useJobs();
  const jobs = data?.data ?? [];

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-neutral-800">
            Comparison History
          </h2>
          {jobs.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {jobs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded hover:bg-neutral-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-neutral-500" />
          </button>
          <button
            type="button"
            onClick={onNewComparison}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Comparison
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-neutral-400">
            <svg className="h-6 w-6 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading comparisons...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4 text-neutral-400">
            <FileText className="h-12 w-12 text-neutral-200" />
            <p className="text-sm">No comparisons yet</p>
            <button
              type="button"
              onClick={onNewComparison}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Start first comparison
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Version A
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Version B
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Differences
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Material
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobs.map((job) => {
                  const badge = STATUS_BADGE[job.status] ?? {
                    label: job.status,
                    bg: "bg-neutral-100",
                    text: "text-neutral-600",
                  };
                  const verifyPct =
                    job.total_differences > 0
                      ? Math.round(
                          (job.differences_verified / job.total_differences) *
                            100,
                        )
                      : 0;
                  const isOpenable = [
                    "ready_for_review",
                    "verification_in_progress",
                    "completed",
                  ].includes(job.status);

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-800 truncate block max-w-[150px]">
                          {job.label_a ?? "Version A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-800 truncate block max-w-[150px]">
                          {job.label_b ?? "Version B"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-neutral-700">
                          {job.total_differences}
                        </span>
                        {job.total_differences > 0 && (
                          <div className="text-xs text-neutral-400">
                            {verifyPct}% verified
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {job.material_count != null ? (
                          <span
                            className={`font-semibold ${
                              job.material_count > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {job.material_count}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {isOpenable && (
                            <button
                              type="button"
                              onClick={() => onSelectJob(job.id)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Open in viewer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </button>
                          )}
                          {job.status === "completed" && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await docdiffClient.get(`/jobs/${job.id}/report/pdf`, { responseType: "blob" });
                                  const blob = response instanceof Blob ? response : new Blob([response as BlobPart], { type: "application/pdf" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = "docdiff-report.pdf";
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } catch (err) {
                                  showApiError(err);
                                }
                              }}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                              title="Download report PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
