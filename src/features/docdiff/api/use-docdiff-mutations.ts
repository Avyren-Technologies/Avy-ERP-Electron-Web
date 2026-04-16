import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showApiError, showSuccess } from "@/lib/toast";
import { docdiffApi } from "./docdiff-api";
import { docdiffKeys } from "./use-docdiff-queries";
import type {
  BulkVerificationPayload,
  VerificationActionPayload,
} from "../types/docdiff.types";

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => docdiffApi.createJob(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docdiffKeys.jobs() });
      showSuccess("Comparison job created");
    },
    onError: (err) => showApiError(err),
  });
}

export function useStartJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => docdiffApi.startJob(jobId),
    onSuccess: (_, jobId) => {
      qc.invalidateQueries({ queryKey: docdiffKeys.job(jobId) });
      showSuccess("Processing started");
    },
    onError: (err) => showApiError(err),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => docdiffApi.deleteJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docdiffKeys.jobs() });
      showSuccess("Job deleted");
    },
    onError: (err) => showApiError(err),
  });
}

export function useVerifyDifference(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      diffId,
      action,
    }: {
      diffId: string;
      action: VerificationActionPayload;
    }) => docdiffApi.verifyDifference(jobId, diffId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docdiffKeys.differences(jobId) });
      qc.invalidateQueries({ queryKey: docdiffKeys.job(jobId) });
    },
    onError: (err) => showApiError(err),
  });
}

export function useBulkVerify(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkVerificationPayload) =>
      docdiffApi.bulkVerify(jobId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docdiffKeys.differences(jobId) });
      qc.invalidateQueries({ queryKey: docdiffKeys.job(jobId) });
      showSuccess("Bulk verification applied");
    },
    onError: (err) => showApiError(err),
  });
}

export function useGenerateReport(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => docdiffApi.generateReport(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docdiffKeys.report(jobId) });
      showSuccess("Diff report generated");
    },
    onError: (err) => showApiError(err),
  });
}
