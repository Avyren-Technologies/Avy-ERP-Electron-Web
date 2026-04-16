import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useProcessingSSE } from "../hooks/useProcessingSSE";

interface Props {
  jobId: string;
  onComplete: () => void;
  onBack: () => void;
}

const STAGE_NAMES = [
  "Ingestion & Validation",
  "Page Classification",
  "Content Extraction",
  "Normalization",
  "Section Alignment",
  "Computing Differences",
  "Classifying Differences",
  "Assembling Results",
];

type StageStatus = "pending" | "in_progress" | "completed" | "failed";

function StageRow({
  name,
  status,
  index,
}: {
  name: string;
  status: StageStatus;
  index: number;
}) {
  const iconMap: Record<StageStatus, React.ReactNode> = {
    pending: <Circle className="h-5 w-5 text-neutral-300" />,
    in_progress: (
      <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
    ),
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    failed: <XCircle className="h-5 w-5 text-red-500" />,
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-shrink-0">{iconMap[status]}</div>
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${
            status === "completed"
              ? "text-green-700"
              : status === "in_progress"
                ? "text-indigo-700"
                : status === "failed"
                  ? "text-red-600"
                  : "text-neutral-400"
          }`}
        >
          {index + 1}. {name}
        </span>
      </div>
      {status === "in_progress" && (
        <span className="text-xs text-indigo-500 font-medium animate-pulse">
          Processing...
        </span>
      )}
      {status === "completed" && (
        <span className="text-xs text-green-600">Done</span>
      )}
      {status === "failed" && (
        <span className="text-xs text-red-600">Failed</span>
      )}
    </div>
  );
}

export function ProcessingView({ jobId, onComplete, onBack }: Props) {
  const { progress, isComplete } = useProcessingSSE(jobId);

  useEffect(() => {
    if (isComplete && progress?.status === "ready_for_review") {
      // slight delay so user can see the complete state
      const timer = setTimeout(() => onComplete(), 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, progress?.status, onComplete]);

  const getStageStatus = (stageIndex: number): StageStatus => {
    if (!progress) return "pending";
    const stageKey = String(stageIndex + 1);
    const stage = progress.stages?.[stageKey];
    if (!stage) return "pending";
    return stage.status as StageStatus;
  };

  const isFailed = progress?.status === "failed";
  const isReady = progress?.status === "ready_for_review";

  const completedCount = STAGE_NAMES.filter(
    (_, i) => getStageStatus(i) === "completed",
  ).length;

  const overallProgress =
    STAGE_NAMES.length > 0
      ? Math.round((completedCount / STAGE_NAMES.length) * 100)
      : 0;

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-neutral-800 mb-1">
          Processing Documents
        </h2>
        <p className="text-sm text-neutral-500">
          AI is analyzing your documents for differences
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500">Overall Progress</span>
          <span className="text-xs font-semibold text-indigo-600">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 px-4 mb-6">
        {STAGE_NAMES.map((name, i) => (
          <StageRow
            key={name}
            name={name}
            index={i}
            status={getStageStatus(i)}
          />
        ))}
      </div>

      {/* Error */}
      {isFailed && progress?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <p className="font-medium mb-1">Processing failed</p>
          <p className="text-xs">{progress.error}</p>
        </div>
      )}

      {/* Actions */}
      {isFailed && (
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back to Upload
        </button>
      )}

      {isReady && (
        <button
          type="button"
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="h-4 w-4" />
          View Differences
        </button>
      )}

      {!isFailed && !isReady && (
        <p className="text-center text-xs text-neutral-400">
          This may take a minute. You can leave this page — the job will
          continue in the background.
        </p>
      )}
    </div>
  );
}
