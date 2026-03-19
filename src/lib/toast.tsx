import { toast } from 'sonner';

export function showSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

export function showError(message: string, description?: string) {
  toast.error(message, { description, duration: 5000 });
}

export function showInfo(message: string, description?: string) {
  toast.info(message, { description });
}

export function showWarning(message: string, description?: string) {
  toast.warning(message, { description, duration: 5000 });
}

export function showApiError(error: unknown) {
  const msg = extractErrorMessage(error);
  toast.error('Request Failed', { description: msg, duration: 5000 });
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as any).response?.data;
    if (typeof resp?.message === 'string') return resp.message;
    if (typeof resp?.error === 'string') return resp.error;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
