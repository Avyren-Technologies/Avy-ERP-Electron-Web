import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

  // Bboxes are stored as normalized 0-1 fractions of page dimensions
  const left = bbox.x * 100;
  const top = bbox.y * 100;
  const width = bbox.width * 100;
  const height = bbox.height * 100;

  // Skip bboxes that are all zeros (no position data)
  if (width < 0.1 && height < 0.1) return null;

  return (
    <div
      title={`#${diff.difference_number}: ${diff.summary}`}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        backgroundColor: color,
        border: isActive
          ? `3px solid ${color.replace("0.2", "0.9")}`
          : `1px solid ${color.replace("0.2", "0.5")}`,
        boxShadow: isActive ? `0 0 8px 2px ${color.replace("0.2", "0.5")}` : undefined,
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.15s ease",
        pointerEvents: "all",
        zIndex: isActive ? 10 : 1,
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const url = await docdiffApi.getPageImageBlob(jobId, role, pageNumber);
        if (!cancelled) {
          blobUrl = url;
          setImageUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch {
        if (!cancelled) setImageUrl(null);
      }
    };
    fetchImage();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [jobId, role, pageNumber]);

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
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${label} page ${pageNumber}`}
              className="block max-w-full"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 w-96 bg-neutral-50 text-neutral-400 text-sm">
              Loading page...
            </div>
          )}
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
