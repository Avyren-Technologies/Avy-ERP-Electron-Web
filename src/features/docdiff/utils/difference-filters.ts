import type {
  DifferenceType,
  VerificationStatus,
  Significance,
} from "../types/docdiff.types";

export interface DifferenceFilters {
  differenceType?: DifferenceType;
  significance?: Significance;
  verificationStatus?: VerificationStatus;
  page?: number;
  needsVerification?: boolean;
  confidenceMin?: number;
  confidenceMax?: number;
}

export function filtersToParams(
  filters: DifferenceFilters,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.differenceType) params.difference_type = filters.differenceType;
  if (filters.significance) params.significance = filters.significance;
  if (filters.verificationStatus)
    params.verification_status = filters.verificationStatus;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.needsVerification !== undefined)
    params.needs_verification = filters.needsVerification;
  if (filters.confidenceMin !== undefined)
    params.confidence_min = filters.confidenceMin;
  if (filters.confidenceMax !== undefined)
    params.confidence_max = filters.confidenceMax;

  return params;
}

export function formatDifferenceType(type: DifferenceType): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
