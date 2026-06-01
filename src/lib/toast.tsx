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
  const isRequestError = error && typeof error === 'object' && 'response' in error;
  if (isRequestError) {
    toast.error('Request Failed', { description: msg, duration: 5000 });
  } else {
    toast.error(msg, { duration: 5000 });
  }
}

function extractErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong';

  if (typeof error === 'object') {
    if ('response' in error) {
      const resp = (error as any).response?.data;
      if (typeof resp?.message === 'string') return resp.message;
      if (typeof resp?.error === 'string') return resp.error;
    }
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as any).error;
    }
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  return 'Something went wrong';
}
