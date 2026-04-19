import { useState } from "react";
import type {
  DetectedDifference,
  DifferenceType,
  Significance,
  VerificationStatus,
} from "../types/docdiff.types";
import {
  SIGNIFICANCE_COLORS,
} from "../utils/significance-colors";
import { formatDifferenceType } from "../utils/difference-filters";

interface Props {
  jobId: string;
  activeDiffId: string | null;
  onSelectDifference: (diff: DetectedDifference) => void;
  differences: DetectedDifference[];
}

const STATUS_ICONS: Record<VerificationStatus, { icon: string; className: string }> = {
  confirmed:  { icon: "✓", className: "text-green-600" },
  dismissed:  { icon: "✗", className: "text-neutral-400" },
  corrected:  { icon: "✎", className: "text-blue-600" },
  flagged:    { icon: "⚑", className: "text-amber-500" },
  pending:    { icon: "○", className: "text-neutral-300" },
};

export function DifferenceList({
  activeDiffId,
  onSelectDifference,
  differences,
}: Props) {
  const [filterType, setFilterType] = useState<DifferenceType | "">("");
  const [filterSignificance, setFilterSignificance] = useState<Significance | "">("");
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | "">("");

  const filtered = differences.filter((d) => {
    if (filterType && d.difference_type !== filterType) return false;
    if (filterSignificance && d.significance !== filterSignificance) return false;
    if (filterStatus && d.verification_status !== filterStatus) return false;
    return true;
  });

  const verifiedCount = differences.filter(
    (d) => d.verification_status !== "pending",
  ).length;

  const verifyPercent =
    differences.length > 0
      ? Math.round((verifiedCount / differences.length) * 100)
      : 0;

  const uniqueTypes = Array.from(new Set(differences.map((d) => d.difference_type)));

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Filter bar */}
      <div className="px-3 py-2 border-b border-neutral-100 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Differences ({filtered.length})
        </p>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DifferenceType | "")}
          className="w-full text-xs rounded border border-neutral-200 px-2 py-1 focus:border-indigo-400 focus:ring-0"
        >
          <option value="">All types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {formatDifferenceType(t)}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <select
            value={filterSignificance}
            onChange={(e) =>
              setFilterSignificance(e.target.value as Significance | "")
            }
            className="flex-1 text-xs rounded border border-neutral-200 px-2 py-1 focus:border-indigo-400 focus:ring-0"
          >
            <option value="">All significance</option>
            <option value="material">Material</option>
            <option value="substantive">Substantive</option>
            <option value="cosmetic">Cosmetic</option>
            <option value="uncertain">Uncertain</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as VerificationStatus | "")
            }
            className="flex-1 text-xs rounded border border-neutral-200 px-2 py-1 focus:border-indigo-400 focus:ring-0"
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="dismissed">Dismissed</option>
            <option value="corrected">Corrected</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Difference list */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
            No differences match filters
          </div>
        ) : (
          filtered.map((diff) => {
            const sig = SIGNIFICANCE_COLORS[diff.significance];
            const statusIcon = STATUS_ICONS[diff.verification_status];
            const isActive = diff.id === activeDiffId;

            return (
              <button
                key={diff.id}
                type="button"
                onClick={() => onSelectDifference(diff)}
                className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors ${
                  isActive ? "bg-indigo-50 border-l-2 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`flex-shrink-0 mt-0.5 text-sm font-bold ${statusIcon.className}`}
                    title={diff.verification_status}
                  >
                    {statusIcon.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-neutral-500">
                        #{diff.difference_number}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${sig.bg} ${sig.text}`}
                      >
                        {sig.label}
                      </span>
                      <span className="text-xs text-neutral-400 ml-auto flex-shrink-0">
                        {Math.round(diff.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 truncate">
                      {formatDifferenceType(diff.difference_type)}
                    </p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5 leading-snug">
                      {diff.summary}
                    </p>
                    {(diff.page_version_a ?? diff.page_version_b) != null && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Page{" "}
                        {diff.page_version_a ?? diff.page_version_b}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Progress bar */}
      <div className="px-3 py-2 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-500">
            {verifiedCount} of {differences.length} verified
          </span>
          <span className="text-xs font-semibold text-indigo-600">
            {verifyPercent}%
          </span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${verifyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
