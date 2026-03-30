import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

/**
 * InfoTooltip — A subtle info icon that reveals a tooltip on hover.
 * Used across HRMS config screens to explain non-obvious fields.
 */
export function InfoTooltip({ content }: { content: string }) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<"top" | "bottom">("top");
    const triggerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (visible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // If too close to top of viewport, show below instead
            setPosition(rect.top < 100 ? "bottom" : "top");
        }
    }, [visible]);

    return (
        <span
            ref={triggerRef}
            className="relative inline-flex items-center"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            <Info className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 cursor-help flex-shrink-0" />
            {visible && (
                <span
                    className={`absolute z-50 px-3 py-2 text-xs leading-relaxed font-medium text-white bg-neutral-800 dark:bg-neutral-700 rounded-lg shadow-lg max-w-[280px] w-max pointer-events-none ${
                        position === "top"
                            ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
                            : "top-full left-1/2 -translate-x-1/2 mt-2"
                    }`}
                >
                    {content}
                    <span
                        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-800 dark:bg-neutral-700 rotate-45 ${
                            position === "top" ? "-bottom-1" : "-top-1"
                        }`}
                    />
                </span>
            )}
        </span>
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
