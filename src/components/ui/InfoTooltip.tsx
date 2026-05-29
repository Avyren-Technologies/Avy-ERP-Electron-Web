import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

/**
 * InfoTooltip — A subtle info icon that reveals a tooltip on hover.
 * Uses a portal so the tooltip is never clipped by parent overflow/modals.
 */
export function InfoTooltip({ content }: { content: string }) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, position: "top" as "top" | "bottom" });
    const triggerRef = useRef<HTMLSpanElement>(null);

    const show = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const showBelow = rect.top < 80;
        setCoords({
            top: showBelow ? rect.bottom + 8 : rect.top - 8,
            left: rect.left + rect.width / 2,
            position: showBelow ? "bottom" : "top",
        });
        setVisible(true);
    }, []);

    const hide = useCallback(() => setVisible(false), []);

    return (
        <>
            <span
                ref={triggerRef}
                className="inline-flex items-center"
                onMouseEnter={show}
                onMouseLeave={hide}
            >
                <Info className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 cursor-help flex-shrink-0" />
            </span>
            {visible &&
                createPortal(
                    <span
                        className="fixed z-[9999] px-3 py-2 text-xs leading-relaxed font-medium text-white bg-neutral-800 dark:bg-neutral-700 rounded-lg shadow-lg max-w-[280px] w-max pointer-events-none -translate-x-1/2"
                        style={{
                            top: coords.position === "top" ? undefined : coords.top,
                            bottom: coords.position === "top" ? `calc(100vh - ${coords.top}px)` : undefined,
                            left: coords.left,
                        }}
                    >
                        {content}
                        <span
                            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-800 dark:bg-neutral-700 rotate-45 ${
                                coords.position === "top" ? "-bottom-1" : "-top-1"
                            }`}
                        />
                    </span>,
                    document.body,
                )}
        </>
    );
}

/**
 * SectionDescription — A muted description line for section headers.
 * Placed below the section title to explain what the section controls.
 */
export function SectionDescription({ children }: { children: string }) {
    return (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-3 leading-relaxed">
            {children}
        </p>
    );
}
