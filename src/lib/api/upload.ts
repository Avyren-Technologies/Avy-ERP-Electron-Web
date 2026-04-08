import { client } from './client';

export type FileCategory =
  | 'company-logo'
  | 'employee-photo'
  | 'employee-document'
  | 'education-certificate'
  | 'prev-employment-doc'
  | 'expense-receipt'
  | 'attendance-photo'
  | 'hr-letter'
  | 'recruitment-doc'
  | 'candidate-document'
  | 'training-material'
  | 'training-certificate'
  | 'payslip'
  | 'salary-revision'
  | 'offboarding-doc'
  | 'transfer-letter'
  | 'policy-document'
  | 'billing-invoice';

interface RequestUploadPayload {
  category: FileCategory;
  entityId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  companyId?: string;
}

interface UploadResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

interface DownloadUrlResponse {
  downloadUrl: string;
  expiresIn: number;
}

export const uploadApi = {
  requestUpload: (payload: RequestUploadPayload) =>
    client.post<{ success: boolean; data: UploadResponse }>('/upload/request', payload)
      .then((r) => r.data),

  requestUploadPlatform: (payload: RequestUploadPayload) =>
    client.post<{ success: boolean; data: UploadResponse }>('/platform/upload/request', payload)
      .then((r) => r.data),

  getDownloadUrl: (key: string) =>
    client.post<{ success: boolean; data: DownloadUrlResponse }>('/upload/download-url', { key })
      .then((r) => r.data),

  getDownloadUrlPlatform: (key: string) =>
    client.post<{ success: boolean; data: DownloadUrlResponse }>('/platform/upload/download-url', { key })
      .then((r) => r.data),
};

export const uploadKeys = {
  all: ['upload'] as const,
  downloadUrl: (key: string) => [...uploadKeys.all, 'download-url', key] as const,
};
