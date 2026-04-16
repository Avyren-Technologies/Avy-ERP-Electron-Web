import { useCallback, useRef, useState } from "react";

export function useSyncScroll() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const isSyncing = useRef(false);

  const handleScroll = useCallback(
    (source: "left" | "right") => {
      if (!syncEnabled || isSyncing.current) return;
      isSyncing.current = true;
      const sourceEl = source === "left" ? leftRef.current : rightRef.current;
      const targetEl = source === "left" ? rightRef.current : leftRef.current;
      if (sourceEl && targetEl) {
        targetEl.scrollTop = sourceEl.scrollTop;
        targetEl.scrollLeft = sourceEl.scrollLeft;
      }
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    },
    [syncEnabled],
  );

  return {
    leftRef,
    rightRef,
    syncEnabled,
    setSyncEnabled,
    handleScroll,
  };
}
