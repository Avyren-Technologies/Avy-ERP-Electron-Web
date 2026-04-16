import { useEffect, useState } from "react";
import type { StageProgress } from "../types/docdiff.types";

const DOCDIFF_API_URL =
  import.meta.env.VITE_DOCDIFF_API_URL || "http://localhost:8000/api/v1";

export function useProcessingSSE(jobId: string | null) {
  const [progress, setProgress] = useState<StageProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const source = new EventSource(`${DOCDIFF_API_URL}/jobs/${jobId}/progress`);

    source.onmessage = (event) => {
      try {
        const data: StageProgress = JSON.parse(event.data);
        setProgress(data);
        if (
          ["ready_for_review", "failed", "cancelled"].includes(data.status)
        ) {
          setIsComplete(true);
          source.close();
        }
      } catch {
        /* ignore parse errors */
      }
    };

    source.onerror = () => source.close();

    return () => source.close();
  }, [jobId]);

  return { progress, isComplete };
}
