export type JobStatus =
  | "uploading"
  | "parsing_version_a"
  | "parsing_version_b"
  | "aligning"
  | "diffing"
  | "classifying"
  | "assembling"
  | "ready_for_review"
  | "verification_in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type DifferenceType =
  | "text_addition"
  | "text_deletion"
  | "text_modification"
  | "table_cell_change"
  | "table_row_addition"
  | "table_row_deletion"
  | "table_structure_change"
  | "annotation_present_in_b"
  | "annotation_removed_from_b"
  | "section_moved"
  | "formatting_change";

export type Significance = "material" | "substantive" | "cosmetic" | "uncertain";
export type VerificationStatus = "pending" | "confirmed" | "dismissed" | "corrected" | "flagged";

export interface Job {
  id: string;
  status: JobStatus;
  model_provider: string;
  model_name: string;
  current_stage: number;
  stage_progress: Record<string, { status: string; name: string }> | null;
  error_message: string | null;
  total_differences: number;
  differences_verified: number;
  auto_confirm_threshold: number;
  processing_time_ms: number | null;
  token_usage: { input_tokens: number; output_tokens: number; cost_estimate: number } | null;
  created_at: string;
  updated_at: string;
}

export interface JobListItem {
  id: string;
  status: JobStatus;
  model_provider: string;
  model_name: string;
  label_a: string | null;
  label_b: string | null;
  total_differences: number;
  differences_verified: number;
  material_count: number | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface DetectedDifference {
  id: string;
  difference_number: number;
  difference_type: DifferenceType;
  significance: Significance;
  confidence: number;
  page_version_a: number | null;
  page_version_b: number | null;
  bbox_version_a: { x: number; y: number; width: number; height: number } | null;
  bbox_version_b: { x: number; y: number; width: number; height: number } | null;
  value_before: string | null;
  value_after: string | null;
  context: string | null;
  summary: string;
  verification_status: VerificationStatus;
  auto_confirmed: boolean;
  needs_verification: boolean;
  verifier_comment: string | null;
  corrected_description: string | null;
  verified_at: string | null;
}

export interface VerificationActionPayload {
  action: VerificationStatus;
  comment?: string;
  corrected_description?: string;
  corrected_significance?: Significance;
  corrected_value_after?: string;
}

export interface BulkVerificationPayload {
  difference_ids: string[];
  action: VerificationStatus;
  comment?: string;
}

export interface DiffReport {
  id: string;
  job_id: string;
  summary_stats: Record<string, number> | null;
  report_html: string | null;
  report_pdf_path: string | null;
  is_partial: boolean;
  generated_at: string;
}

export interface StageProgress {
  job_id: string;
  status: string;
  current_stage: number;
  stages: Record<string, { status: string; name: string }>;
  error?: string;
}

export interface ModelOption {
  provider: string;
  model: string;
  label: string;
  description: string;
}

export const DEFAULT_MODEL_PROVIDER = "google";
export const DEFAULT_MODEL_NAME = "gemini-2.5-flash";

export const MODEL_OPTIONS: ModelOption[] = [
  // ── Google Gemini (Primary Provider) ─────────────────────────────────
  {
    provider: "google",
    model: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Best balance — fast, smart, 1M context (default)",
  },
  {
    provider: "google",
    model: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Highest accuracy, thinking model, higher cost",
  },
  {
    provider: "google",
    model: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    description: "Lightest 2.5 model — fastest and cheapest",
  },
  {
    provider: "google",
    model: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Stable multimodal, 1M context, generous free tier",
  },
  {
    provider: "google",
    model: "gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash 001",
    description: "Pinned stable release of Gemini 2.0 Flash",
  },
  {
    provider: "google",
    model: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash-Lite",
    description: "Lightweight 2.0 model — lowest latency",
  },
  {
    provider: "google",
    model: "gemini-2.0-flash-lite-001",
    label: "Gemini 2.0 Flash-Lite 001",
    description: "Pinned stable release of Gemini 2.0 Flash-Lite",
  },
  // ── Anthropic (Secondary) ─────────────────────────────────────────────
  {
    provider: "anthropic",
    model: "claude-3-7-sonnet-20250219",
    label: "Claude 3.7 Sonnet",
    description: "Fast, strong reasoning",
  },
  {
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    label: "Claude 3 Opus",
    description: "Most capable Claude, higher cost",
  },
  // ── OpenRouter (Secondary) ────────────────────────────────────────────
  {
    provider: "openrouter",
    model: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B (Free)",
    description: "Best free vision-capable model via OpenRouter",
  },
  // ── Local (Self-hosted) ───────────────────────────────────────────────
  {
    provider: "qwen_local",
    model: "qwen3-vl-8b",
    label: "Qwen3-VL 8B (Local)",
    description: "Self-hosted, no API cost",
  },
  {
    provider: "qwen_local",
    model: "qwen3-vl-30b-a3b",
    label: "Qwen3-VL 30B (Local)",
    description: "Larger local model",
  },
];
