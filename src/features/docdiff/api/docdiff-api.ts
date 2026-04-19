import axios from "axios";
import { docdiffClient } from "./docdiff-client";
import type {
  BulkVerificationPayload,
  DetectedDifference,
  DiffReport,
  Job,
  JobListItem,
  VerificationActionPayload,
} from "../types/docdiff.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const docdiffApi = {
  createJob: (formData: FormData) =>
    docdiffClient.post<unknown, ApiResponse<Job>>("/jobs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  listJobs: () =>
    docdiffClient.get<unknown, ApiResponse<JobListItem[]>>("/jobs"),

  getJob: (id: string) =>
    docdiffClient.get<unknown, ApiResponse<Job>>(`/jobs/${id}`),

  deleteJob: (id: string) => docdiffClient.delete(`/jobs/${id}`),

  startJob: (id: string) =>
    docdiffClient.post<unknown, ApiResponse<Job>>(`/jobs/${id}/start`),

  listDifferences: (
    jobId: string,
    params?: Record<string, string | number | boolean>,
  ) =>
    docdiffClient.get<unknown, ApiResponse<DetectedDifference[]>>(
      `/jobs/${jobId}/differences`,
      { params },
    ),

  getDifference: (jobId: string, diffId: string) =>
    docdiffClient.get<unknown, ApiResponse<DetectedDifference>>(
      `/jobs/${jobId}/differences/${diffId}`,
    ),

  verifyDifference: (
    jobId: string,
    diffId: string,
    action: VerificationActionPayload,
  ) =>
    docdiffClient.patch<unknown, ApiResponse<DetectedDifference>>(
      `/jobs/${jobId}/differences/${diffId}`,
      action,
    ),

  bulkVerify: (jobId: string, payload: BulkVerificationPayload) =>
    docdiffClient.patch<unknown, ApiResponse<{ updated: number }>>(
      `/jobs/${jobId}/differences/bulk`,
      payload,
    ),

  addManualDifference: (jobId: string, data: Partial<DetectedDifference>) =>
    docdiffClient.post<unknown, ApiResponse<DetectedDifference>>(
      `/jobs/${jobId}/differences`,
      data,
    ),

  getPageImageUrl: (jobId: string, role: string, pageNum: number) =>
    `${docdiffClient.defaults.baseURL}/jobs/${jobId}/documents/${role}/pages/${pageNum}/image`,

  getPageImageBlob: async (jobId: string, role: string, pageNum: number): Promise<string> => {
    const tokensRaw = localStorage.getItem("auth_tokens");
    const token = tokensRaw ? JSON.parse(tokensRaw).accessToken : null;
    const baseUrl = import.meta.env.VITE_DOCDIFF_API_URL || "http://localhost:8000/api/v1";

    const response = await axios.get(
      `${baseUrl}/jobs/${jobId}/documents/${role}/pages/${pageNum}/image`,
      {
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return URL.createObjectURL(response.data);
  },

  getPageContent: (jobId: string, role: string, pageNum: number) =>
    docdiffClient.get(
      `/jobs/${jobId}/documents/${role}/pages/${pageNum}/content`,
    ),

  generateReport: (jobId: string) =>
    docdiffClient.post<unknown, ApiResponse<DiffReport>>(
      `/jobs/${jobId}/report`,
    ),

  getReport: (jobId: string) =>
    docdiffClient.get<unknown, ApiResponse<DiffReport>>(
      `/jobs/${jobId}/report`,
    ),

  getReportPdfUrl: (jobId: string) =>
    `${docdiffClient.defaults.baseURL}/jobs/${jobId}/report/pdf`,
};
