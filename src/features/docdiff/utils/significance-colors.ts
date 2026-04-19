import type { Significance } from "../types/docdiff.types";

export const SIGNIFICANCE_COLORS: Record<
  Significance,
  { bg: string; text: string; border: string; label: string }
> = {
  material: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
    label: "Material",
  },
  substantive: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    label: "Substantive",
  },
  cosmetic: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    label: "Cosmetic",
  },
  uncertain: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-300",
    label: "Uncertain",
  },
};

export const SIGNIFICANCE_OVERLAY_COLORS: Record<Significance, string> = {
  material: "rgba(220, 38, 38, 0.2)",
  substantive: "rgba(217, 119, 6, 0.2)",
  cosmetic: "rgba(37, 99, 235, 0.2)",
  uncertain: "rgba(124, 58, 237, 0.2)",
};
