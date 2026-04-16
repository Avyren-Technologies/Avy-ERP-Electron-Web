import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  MessageSquare,
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

interface Props {
  difference: DetectedDifference;
  onVerify: (diffId: string, action: VerificationActionPayload) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function DifferenceDetail({
  difference,
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
    <div className="bg-white border-t border-neutral-200 px-4 py-3 flex flex-col gap-3">
      {/* Top row: info + nav */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-neutral-500">
              #{difference.difference_number}
            </span>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${sig.bg} ${sig.text} ${sig.border} border`}
            >
              {sig.label}
            </span>
            <span className="text-xs text-neutral-500">
              {formatDifferenceType(difference.difference_type)}
            </span>
            <span className="text-xs text-neutral-400 ml-auto">
              Confidence:{" "}
              <span className="font-semibold">{confidencePct}%</span>
            </span>
          </div>

          {/* Confidence bar */}
          <div className="w-48 bg-neutral-100 rounded-full h-1 mb-1.5">
            <div
              className={`h-1 rounded-full ${
                confidencePct >= 80
                  ? "bg-green-400"
                  : confidencePct >= 50
                    ? "bg-amber-400"
                    : "bg-red-400"
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>

          <p className="text-sm text-neutral-700 leading-snug">
            {difference.summary}
          </p>

          {(difference.value_before || difference.value_after) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-600">
              {difference.value_before && (
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded line-through max-w-[200px] truncate">
                  {difference.value_before}
                </span>
              )}
              {difference.value_before && difference.value_after && (
                <span className="text-neutral-400">→</span>
              )}
              {difference.value_after && (
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded max-w-[200px] truncate">
                  {difference.value_after}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous difference"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next difference"
          >
            <ChevronRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Inline correct editor */}
      {correctMode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={correctedDescription}
            onChange={(e) => setCorrectedDescription(e.target.value)}
            className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter corrected description..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setCorrectMode(false)}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Flag comment */}
      {flagMode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={flagComment}
            onChange={(e) => setFlagComment(e.target.value)}
            className="flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Add comment for flag (optional)..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setFlagMode(false)}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          title="Confirm (C)"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Confirm
          <span className="text-green-200 text-[10px]">[C]</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors"
          title="Dismiss (D)"
        >
          <MinusCircle className="h-3.5 w-3.5" />
          Dismiss
          <span className="text-neutral-400 text-[10px]">[D]</span>
        </button>

        <button
          type="button"
          onClick={handleCorrect}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            correctMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          title="Correct (E)"
        >
          <Pencil className="h-3.5 w-3.5" />
          {correctMode ? "Submit Correction" : "Correct"}
          {!correctMode && (
            <span className="text-blue-400 text-[10px]">[E]</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleFlag}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            flagMode
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
          title="Flag (F)"
        >
          <Flag className="h-3.5 w-3.5" />
          {flagMode ? "Submit Flag" : "Flag"}
          {!flagMode && (
            <span className="text-amber-400 text-[10px]">[F]</span>
          )}
        </button>

        {difference.verifier_comment && !flagMode && (
          <span className="flex items-center gap-1 text-xs text-neutral-500 ml-auto">
            <MessageSquare className="h-3 w-3" />
            {difference.verifier_comment}
          </span>
        )}
      </div>
    </div>
  );
}
