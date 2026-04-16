import { PenLine } from "lucide-react";
import { useState } from "react";
import { docdiffApi } from "../api/docdiff-api";
import type {
  DetectedDifference,
  VerificationActionPayload,
} from "../types/docdiff.types";

interface Props {
  difference: DetectedDifference;
  jobId: string;
  onVerify: (diffId: string, action: VerificationActionPayload) => void;
}

export function HandwritingReview({ difference, jobId, onVerify }: Props) {
  const [correctedText, setCorrectedText] = useState(
    difference.corrected_description ?? difference.value_after ?? "",
  );

  const pageNum = difference.page_version_b ?? difference.page_version_a ?? 1;
  const imageUrl = docdiffApi.getPageImageUrl(jobId, "version_b", pageNum);

  const handleConfirmTranscription = () => {
    onVerify(difference.id, {
      action: "confirmed",
    });
  };

  const handleCorrectTranscription = () => {
    onVerify(difference.id, {
      action: "corrected",
      corrected_description: correctedText,
    });
  };

  const handleDismiss = () => {
    onVerify(difference.id, { action: "dismissed" });
  };

  const confidencePct = Math.round(difference.confidence * 100);
  const isLowConfidence = difference.confidence < 0.7;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-amber-50">
        <PenLine className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">
          Handwriting Review
        </span>
        <span className="ml-auto text-xs text-amber-600">
          Confidence: {confidencePct}%{" "}
          {isLowConfidence && (
            <span className="text-amber-700 font-semibold">— Low confidence</span>
          )}
        </span>
      </div>

      <div className="p-4 flex gap-4">
        {/* Source image */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            Source Image
          </p>
          <div className="rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
            {difference.bbox_version_b ? (
              <img
                src={imageUrl}
                alt="Handwriting region"
                className="block w-full object-contain max-h-48"
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
                No image region available
              </div>
            )}
          </div>
        </div>

        {/* Transcription + correction */}
        <div className="flex-1 flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wide">
              AI Transcription
            </p>
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
              {difference.value_after || (
                <span className="italic text-neutral-400">
                  No transcription available
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wide">
              Correction (optional)
            </p>
            <textarea
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter corrected transcription if needed..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmTranscription}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={handleCorrectTranscription}
              disabled={
                correctedText ===
                (difference.corrected_description ?? difference.value_after ?? "")
              }
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Correction
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 rounded-lg bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
