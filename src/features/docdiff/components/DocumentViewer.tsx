import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { docdiffApi } from "../api/docdiff-api";
import type { DetectedDifference } from "../types/docdiff.types";
import {
  SIGNIFICANCE_OVERLAY_COLORS,
} from "../utils/significance-colors";

interface Props {
  jobId: string;
  role: "version_a" | "version_b";
  pageNumber: number;
  differences: DetectedDifference[];
  activeDiffId: string | null;
  onPageChange: (page: number) => void;
  totalPages: number;
}

interface BBoxOverlayProps {
  diff: DetectedDifference;
  role: "version_a" | "version_b";
  isActive: boolean;
}

function BBoxOverlay({ diff, role, isActive }: BBoxOverlayProps) {
  const bbox =
    role === "version_a" ? diff.bbox_version_a : diff.bbox_version_b;
  if (!bbox) return null;

  const color = SIGNIFICANCE_OVERLAY_COLORS[diff.significance];

  return (
    <div
      title={`#${diff.difference_number}: ${diff.summary}`}
      style={{
        position: "absolute",
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.width * 100}%`,
        height: `${bbox.height * 100}%`,
        backgroundColor: color,
        border: isActive
          ? `2px solid ${color.replace("0.2", "0.9")}`
          : `1px solid ${color.replace("0.2", "0.5")}`,
        boxShadow: isActive ? `0 0 0 2px ${color.replace("0.2", "0.4")}` : undefined,
        borderRadius: 2,
        cursor: "pointer",
        transition: "all 0.15s ease",
        pointerEvents: "all",
      }}
    />
  );
}

export function DocumentViewer({
  jobId,
  role,
  pageNumber,
  differences,
  activeDiffId,
  onPageChange,
  totalPages,
}: Props) {
  const imageUrl = useMemo(
    () => docdiffApi.getPageImageUrl(jobId, role, pageNumber),
    [jobId, role, pageNumber],
  );

  const pageDiffs = useMemo(() => {
    return differences.filter((d) => {
      const page =
        role === "version_a" ? d.page_version_a : d.page_version_b;
      return page === pageNumber;
    });
  }, [differences, role, pageNumber]);

  const label = role === "version_a" ? "Version A" : "Version B";

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-neutral-200">
        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => onPageChange(pageNumber - 1)}
            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <span className="text-xs text-neutral-500 min-w-[60px] text-center">
            {pageNumber} / {totalPages || "?"}
          </span>
          <button
            type="button"
            disabled={totalPages > 0 && pageNumber >= totalPages}
            onClick={() => onPageChange(pageNumber + 1)}
            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Page image + overlays */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-3">
        <div className="relative inline-block shadow-md">
          <img
            src={imageUrl}
            alt={`${label} page ${pageNumber}`}
            className="block max-w-full"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Bounding box overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {pageDiffs.map((diff) => (
              <BBoxOverlay
                key={diff.id}
                diff={diff}
                role={role}
                isActive={diff.id === activeDiffId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
