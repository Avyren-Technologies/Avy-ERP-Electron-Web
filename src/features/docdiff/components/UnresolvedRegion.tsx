import { CheckCircle, Plus, ZoomIn } from "lucide-react";
import { useState } from "react";
import { docdiffApi } from "../api/docdiff-api";

interface Props {
  jobId: string;
  pageVersionA: number;
  pageVersionB: number;
}

export function UnresolvedRegion({ jobId, pageVersionA, pageVersionB }: Props) {
  const [zoom, setZoom] = useState(1);
  const [noDiffConfirmed, setNoDiffConfirmed] = useState(false);

  const imageUrlA = docdiffApi.getPageImageUrl(jobId, "version_a", pageVersionA);
  const imageUrlB = docdiffApi.getPageImageUrl(jobId, "version_b", pageVersionB);

  const handleAddDifference = () => {
    // Placeholder — in a full implementation this would open a form
    // to manually specify difference details
    alert(
      "Manual difference creation: open a form to describe the difference for this region.",
    );
  };

  const handleNoDifference = () => {
    setNoDiffConfirmed(true);
  };

  if (noDiffConfirmed) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="text-sm font-medium text-green-700">
          Marked as no difference
        </p>
        <button
          type="button"
          onClick={() => setNoDiffConfirmed(false)}
          className="text-xs text-green-600 hover:text-green-800 underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100 bg-amber-50">
        <span className="text-sm font-semibold text-amber-700">
          Unresolved Region
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Zoom</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-1 rounded hover:bg-amber-100 transition-colors"
          >
            <ZoomIn className="h-4 w-4 text-amber-600" />
          </button>
          <span className="text-xs text-neutral-500 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1 rounded hover:bg-amber-100 transition-colors text-amber-600 font-bold text-sm"
          >
            −
          </button>
        </div>
      </div>

      {/* Side-by-side pages */}
      <div className="grid grid-cols-2 divide-x divide-neutral-200 overflow-auto">
        <div className="p-3">
          <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            Version A — Page {pageVersionA}
          </p>
          <div className="overflow-auto rounded border border-neutral-200 bg-neutral-50">
            <img
              src={imageUrlA}
              alt={`Version A page ${pageVersionA}`}
              className="block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
              }}
            />
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">
            Version B — Page {pageVersionB}
          </p>
          <div className="overflow-auto rounded border border-neutral-200 bg-neutral-50">
            <img
              src={imageUrlB}
              alt={`Version B page ${pageVersionB}`}
              className="block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 py-3 border-t border-neutral-100">
        <button
          type="button"
          onClick={handleAddDifference}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Difference Manually
        </button>
        <button
          type="button"
          onClick={handleNoDifference}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          No Difference
        </button>
      </div>
    </div>
  );
}
