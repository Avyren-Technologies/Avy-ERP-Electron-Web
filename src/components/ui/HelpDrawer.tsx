import { useState, useCallback, useEffect } from "react";
import { X, Info, Lightbulb, AlertCircle, ListChecks, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenHelp } from "@/features/maintenance/help/types";

interface HelpDrawerProps {
  help: ScreenHelp;
}

/**
 * HelpDrawer — A contextual help panel that slides in from the right.
 *
 * Usage: Place the <HelpDrawer> anywhere in a screen component.
 * It renders an (i) icon button (to be placed next to the page title)
 * and the drawer overlay + panel.
 *
 * @example
 * ```tsx
 * import { HelpDrawer } from "@/components/ui/HelpDrawer";
 * import { assetRegisterHelp } from "@/features/maintenance/help";
 *
 * // In the header, next to the h1:
 * <div className="flex items-center gap-2">
 *   <h1 className="text-3xl font-bold ...">Asset Register</h1>
 *   <HelpDrawer help={assetRegisterHelp} />
 * </div>
 * ```
 */
export function HelpDrawer({ help }: HelpDrawerProps) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <>
      {/* Trigger button — place next to page title */}
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center justify-center rounded-full p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:text-neutral-500 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
        title="Screen help"
        aria-label="Open help"
      >
        <Info className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-700 transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-primary-950 dark:text-white">
              {help.page.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(100%-65px)] px-6 py-5 space-y-6">
          {/* About section */}
          <section>
            <h3 className="text-sm font-semibold text-primary-950 dark:text-white mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary-500" />
              About
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {help.page.description}
            </p>
          </section>

          {/* Prerequisites */}
          {help.page.prerequisites && help.page.prerequisites.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary-950 dark:text-white mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Prerequisites
              </h3>
              <ul className="space-y-1.5">
                {help.page.prerequisites.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-1 flex-shrink-0">&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Steps */}
          {help.page.steps && help.page.steps.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary-950 dark:text-white mb-2 flex items-center gap-1.5">
                <ListChecks className="h-4 w-4 text-primary-500" />
                How to Use
              </h3>
              <ol className="space-y-2">
                {help.page.steps.map((step, i) => (
                  <li
                    key={i}
                    className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Tips */}
          {help.page.tips && help.page.tips.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary-950 dark:text-white mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-violet-500" />
                Tips
              </h3>
              <ul className="space-y-1.5">
                {help.page.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-violet-500 mt-1 flex-shrink-0">&#10023;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
