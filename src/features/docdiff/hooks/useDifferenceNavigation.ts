import { useCallback, useEffect, useState } from "react";
import type { DetectedDifference } from "../types/docdiff.types";

interface NavigationCallbacks {
  onConfirm?: () => void;
  onDismiss?: () => void;
  onCorrect?: () => void;
  onFlag?: () => void;
}

export function useDifferenceNavigation(
  differences: DetectedDifference[],
  callbacks?: NavigationCallbacks,
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeDifference = differences[activeIndex] ?? null;

  useEffect(() => {
    setActiveIndex((i) => {
      if (differences.length === 0) return 0;
      return Math.min(i, differences.length - 1);
    });
  }, [differences.length]);
  const goNext = useCallback(
    () =>
      setActiveIndex((i) => Math.min(i + 1, differences.length - 1)),
    [differences.length],
  );

  const goPrevious = useCallback(
    () => setActiveIndex((i) => Math.max(i - 1, 0)),
    [],
  );

  const goToDifference = useCallback(
    (diff: DetectedDifference) => {
      const idx = differences.findIndex((d) => d.id === diff.id);
      if (idx >= 0) setActiveIndex(idx);
    },
    [differences],
  );

  const goToNextUnverified = useCallback(() => {
    const next = differences.findIndex(
      (d, i) => i > activeIndex && d.verification_status === "pending",
    );
    if (next >= 0) setActiveIndex(next);
  }, [differences, activeIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          goPrevious();
          break;
        case "c":
          callbacks?.onConfirm?.();
          break;
        case "d":
          callbacks?.onDismiss?.();
          break;
        case "e":
          callbacks?.onCorrect?.();
          break;
        case "f":
          callbacks?.onFlag?.();
          break;
        case " ":
          e.preventDefault();
          goToNextUnverified();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrevious, goToNextUnverified, callbacks]);

  return {
    activeDifference,
    activeIndex,
    goNext,
    goPrevious,
    goToDifference,
    goToNextUnverified,
    hasPrevious: activeIndex > 0,
    hasNext: activeIndex < differences.length - 1,
  };
}
