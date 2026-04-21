import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { publicApi } from '@/lib/api/public-client';

interface VisitStatus {
  visitorName: string;
  status: string;
  expectedDate: string;
  expectedTime?: string;
  purpose?: string;
  hostName?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: 'Pending Approval', bg: 'bg-amber-100', text: 'text-amber-700' },
  APPROVED: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-700' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-blue-100', text: 'text-blue-700' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-gray-100', text: 'text-gray-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
  ACTIVE: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700' },
  NOT_STARTED: { label: 'Not Started', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ENDED: { label: 'Ended', bg: 'bg-gray-100', text: 'text-gray-700' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
}

export function VisitStatusPage() {
  const { visitCode } = useParams<{ visitCode: string }>();
  const [data, setData] = useState<VisitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    if (!visitCode) return;
    try {
      const res = await publicApi.get(`/public/visit/${visitCode}/status`);
      const result = res.data?.data;
      setData(result);
      setError(null);

      // Stop polling once no longer pending
      if (result?.status !== 'PENDING' && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Visit not found.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitCode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Visit Not Found</h2>
          <p className="text-gray-500">{error || 'This visit link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const statusCfg = getStatusConfig(data.status);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-bold">Visit Status</h1>
          <p className="text-indigo-100 mt-1 text-sm">Code: {visitCode}</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-gray-800">{data.visitorName}</p>
            <div className="mt-3">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Expected Date</span>
              <span className="font-medium text-gray-800">{data.expectedDate}</span>
            </div>
            {data.expectedTime && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Expected Time</span>
                <span className="font-medium text-gray-800">{data.expectedTime}</span>
              </div>
            )}
            {data.purpose && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Purpose</span>
                <span className="font-medium text-gray-800">{data.purpose}</span>
              </div>
            )}
            {data.hostName && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Host</span>
                <span className="font-medium text-gray-800">{data.hostName}</span>
              </div>
            )}
          </div>

          {data.status === 'PENDING' && (
            <p className="mt-6 text-center text-xs text-gray-400">
              Auto-refreshing every 10 seconds...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
