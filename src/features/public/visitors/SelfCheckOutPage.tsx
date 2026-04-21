import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { publicApi } from '@/lib/api/public-client';
import { showSuccess, showApiError } from '@/lib/toast';

interface VisitInfo {
  visitorName: string;
  status: string;
  checkInTime?: string;
}

export function SelfCheckOutPage() {
  const { visitCode } = useParams<{ visitCode: string }>();
  const [visit, setVisit] = useState<VisitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitCode) return;
    publicApi
      .get(`/public/visit/${visitCode}/status`)
      .then((res) => {
        const data = res.data?.data;
        setVisit(data);
        if (data?.status === 'CHECKED_OUT' || data?.status === 'ENDED') {
          setCheckedOut(true);
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Visit not found.');
        } else {
          setError('An unexpected error occurred.');
        }
      })
      .finally(() => setLoading(false));
  }, [visitCode]);

  const handleCheckOut = async () => {
    if (!visitCode) return;
    setSubmitting(true);
    try {
      await publicApi.post(`/public/visit/${visitCode}/check-out`);
      showSuccess('You have been checked out successfully.');
      setCheckedOut(true);
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !visit) {
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

  if (checkedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500">
            Thank you for visiting, {visit.visitorName}. You have been successfully checked out. We hope to see you again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-bold">Self Check-Out</h1>
          <p className="text-indigo-100 mt-1 text-sm">Ready to leave? Check out below.</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-indigo-600">
              {visit.visitorName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">{visit.visitorName}</p>
          {visit.checkInTime && (
            <p className="text-sm text-gray-500 mb-6">Checked in at {visit.checkInTime}</p>
          )}

          <button
            onClick={handleCheckOut}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg py-3 text-sm transition"
          >
            {submitting ? 'Checking Out...' : 'Check Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
