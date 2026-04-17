import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  MinusCircle,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import type {
  DetectedDifference,
  VerificationActionPayload,
} from "../types/docdiff.types";
import { SIGNIFICANCE_COLORS } from "../utils/significance-colors";
import { formatDifferenceType } from "../utils/difference-filters";
import { HandwritingReview } from "./HandwritingReview";

interface Props {
  difference: DetectedDifference;
  jobId: string;
  onVerify: (diffId: string, action: VerificationActionPayload) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function DifferenceDetail({
  difference,
  jobId,
  onVerify,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: Props) {
  const [correctMode, setCorrectMode] = useState(false);
  const [correctedDescription, setCorrectedDescription] = useState(
    difference.corrected_description ?? difference.summary,
  );
  const [flagMode, setFlagMode] = useState(false);
  const [flagComment, setFlagComment] = useState(
    difference.verifier_comment ?? "",
  );

  const sig = SIGNIFICANCE_COLORS[difference.significance];

  const handleConfirm = () => {
    onVerify(difference.id, { action: "confirmed" });
    setCorrectMode(false);
    setFlagMode(false);
  };

  const handleDismiss = () => {
    onVerify(difference.id, { action: "dismissed" });
    setCorrectMode(false);
    setFlagMode(false);
  };

  const handleCorrect = () => {
    if (!correctMode) {
      setCorrectMode(true);
      setFlagMode(false);
      return;
    }
    onVerify(difference.id, {
      action: "corrected",
      corrected_description: correctedDescription,
    });
    setCorrectMode(false);
  };

  const handleFlag = () => {
    if (!flagMode) {
      setFlagMode(true);
      setCorrectMode(false);
      return;
    }
    onVerify(difference.id, {
      action: "flagged",
      comment: flagComment,
    });
    setFlagMode(false);
  };

  const confidencePct = Math.round(difference.confidence * 100);

  return (
    <div className="bg-white px-4 py-2">
      {/* Single row: nav + info + actions */}
      <div className="flex items-center gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={onPrevious} disabled={!hasPrevious}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <button type="button" onClick={onNext} disabled={!hasNext}
            className="p-1 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>

        {/* Difference info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-neutral-500">#{difference.difference_number}</span>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${sig.bg} ${sig.text} border ${sig.border}`}>
            {sig.label}
          </span>
          <span className="text-xs text-neutral-500">{formatDifferenceType(difference.difference_type)}</span>
          <span className="text-xs text-neutral-400">({confidencePct}%)</span>

          {/* Before / After inline */}
          {(difference.value_before || difference.value_after) && (
            <div className="flex items-center gap-1 text-xs min-w-0 flex-shrink">
              {difference.value_before && (
                <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded line-through truncate max-w-[150px]">
                  {difference.value_before}
                </span>
              )}
              {difference.value_before && difference.value_after && (
                <span className="text-neutral-400">&rarr;</span>
              )}
              {difference.value_after && (
                <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                  {difference.value_after}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons - ALWAYS VISIBLE */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button type="button" onClick={handleConfirm}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
            <CheckCircle className="h-3.5 w-3.5" /> Confirm <kbd className="text-green-200 text-[9px] ml-0.5">C</kbd>
          </button>
          <button type="button" onClick={handleDismiss}
            className="flex items-center gap-1 rounded-lg bg-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-300">
            <MinusCircle className="h-3.5 w-3.5" /> Dismiss <kbd className="text-neutral-400 text-[9px] ml-0.5">D</kbd>
          </button>
          <button type="button" onClick={handleCorrect}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              correctMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}>
            <Pencil className="h-3.5 w-3.5" /> {correctMode ? "Submit" : "Correct"} {!correctMode && <kbd className="text-blue-400 text-[9px] ml-0.5">E</kbd>}
          </button>
          <button type="button" onClick={handleFlag}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              flagMode ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}>
            <Flag className="h-3.5 w-3.5" /> {flagMode ? "Submit" : "Flag"} {!flagMode && <kbd className="text-amber-400 text-[9px] ml-0.5">F</kbd>}
          </button>
        </div>
      </div>

      {/* Inline editors (only shown when needed) */}
      {correctMode && (
        <div className="flex gap-2 mt-2">
          <input type="text" value={correctedDescription} onChange={(e) => setCorrectedDescription(e.target.value)}
            className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter corrected description..." autoFocus />
          <button type="button" onClick={() => setCorrectMode(false)}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Cancel</button>
        </div>
      )}
      {flagMode && (
        <div className="flex gap-2 mt-2">
          <input type="text" value={flagComment} onChange={(e) => setFlagComment(e.target.value)}
            className="flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Add comment for flag (optional)..." autoFocus />
          <button type="button" onClick={() => setFlagMode(false)}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Cancel</button>
        </div>
      )}

      {/* Handwriting review for annotation differences */}
      {difference.difference_type.includes("annotation") && difference.needs_verification && (
        <HandwritingReview difference={difference} jobId={jobId} onVerify={onVerify} />
      )}
    </div>
  );
}
