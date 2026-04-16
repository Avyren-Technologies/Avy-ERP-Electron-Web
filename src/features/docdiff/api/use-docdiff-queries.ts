import { useQuery } from "@tanstack/react-query";
import { docdiffApi } from "./docdiff-api";

export const docdiffKeys = {
  all: ["docdiff"] as const,
  jobs: (params?: Record<string, unknown>) =>
    [
      ...docdiffKeys.all,
      "jobs",
      ...(params ? [params] : []),
    ] as const,
  job: (id: string) => [...docdiffKeys.all, "job", id] as const,
  differences: (jobId: string, filters?: Record<string, unknown>) =>
    [
      ...docdiffKeys.all,
      "differences",
      jobId,
      ...(filters ? [filters] : []),
    ] as const,
  difference: (jobId: string, diffId: string) =>
    [...docdiffKeys.all, "difference", jobId, diffId] as const,
  report: (jobId: string) => [...docdiffKeys.all, "report", jobId] as const,
};

const PROCESSING_STATUSES = new Set([
  "uploading",
  "parsing_version_a",
  "parsing_version_b",
  "aligning",
  "diffing",
  "classifying",
  "assembling",
]);

export function useJobs() {
  return useQuery({
    queryKey: docdiffKeys.jobs(),
    queryFn: () => docdiffApi.listJobs(),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: docdiffKeys.job(id),
    queryFn: () => docdiffApi.getJob(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status && PROCESSING_STATUSES.has(status)) {
        return 3000;
      }
      return false;
    },
  });
}

export function useDifferences(
  jobId: string,
  filters?: Record<string, string | number | boolean>,
) {
  return useQuery({
    queryKey: docdiffKeys.differences(jobId, filters),
    queryFn: () => docdiffApi.listDifferences(jobId, filters),
    enabled: !!jobId,
  });
}

export function useDifference(jobId: string, diffId: string) {
  return useQuery({
    queryKey: docdiffKeys.difference(jobId, diffId),
    queryFn: () => docdiffApi.getDifference(jobId, diffId),
    enabled: !!jobId && !!diffId,
  });
}

export function useReport(jobId: string) {
  return useQuery({
    queryKey: docdiffKeys.report(jobId),
    queryFn: () => docdiffApi.getReport(jobId),
    enabled: !!jobId,
  });
}
