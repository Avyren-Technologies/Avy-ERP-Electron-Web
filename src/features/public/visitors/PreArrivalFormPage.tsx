import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '@/lib/api/public-client';
import { showSuccess, showApiError } from '@/lib/toast';

interface VisitDetails {
  visitorName: string;
  expectedDate: string;
  purpose: string;
  visitorType: {
    name: string;
    requiresPhoto: boolean;
    requiresId: boolean;
    requiresNda: boolean;
  };
  preArrivalCompleted: boolean;
  companyName?: string;
}

export function PreArrivalFormPage() {
  const { visitCode } = useParams<{ visitCode: string }>();
  const [visit, setVisit] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [materialCarriedIn, setMaterialCarriedIn] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);

  useEffect(() => {
    if (!visitCode) return;
    publicApi
      .get(`/public/visit/${visitCode}`)
      .then((res) => {
        const data = res.data?.data;
        setVisit(data);
        if (data?.preArrivalCompleted) setSubmitted(true);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Visit not found or link has expired.');
      })
      .finally(() => setLoading(false));
  }, [visitCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitCode) return;

    if (visit?.visitorType?.requiresNda && !ndaAccepted) {
      showApiError({ response: { data: { message: 'Please accept the NDA to continue.' } } });
      return;
    }

    setSubmitting(true);
    try {
      await publicApi.post(`/public/visit/${visitCode}/pre-arrival`, {
        vehicleNumber: vehicleNumber || undefined,
        emergencyContact: emergencyContact || undefined,
        materialCarriedIn: materialCarriedIn || undefined,
        ndaAccepted: visit?.visitorType?.requiresNda ? ndaAccepted : undefined,
      });
      showSuccess('Pre-arrival form submitted successfully.');
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Pre-Arrival Complete</h2>
          <p className="text-gray-500">
            Thank you, {visit.visitorName}. Your pre-arrival form has been submitted. You are all set for your visit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Pre-Arrival Form</h1>
          {visit.companyName && (
            <p className="text-indigo-100 mt-1">{visit.companyName}</p>
          )}
        </div>

        {/* Visit Info */}
        <div className="bg-white border-x border-gray-200 px-6 py-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Visitor</span>
              <p className="font-medium text-gray-800">{visit.visitorName}</p>
            </div>
            <div>
              <span className="text-gray-500">Expected Date</span>
              <p className="font-medium text-gray-800">{visit.expectedDate}</p>
            </div>
            <div>
              <span className="text-gray-500">Purpose</span>
              <p className="font-medium text-gray-800">{visit.purpose}</p>
            </div>
            <div>
              <span className="text-gray-500">Visitor Type</span>
              <p className="font-medium text-gray-800">{visit.visitorType?.name}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-4 flex flex-wrap gap-2">
            {visit.visitorType?.requiresPhoto && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Photo Required
              </span>
            )}
            {visit.visitorType?.requiresId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                ID Required
              </span>
            )}
            {visit.visitorType?.requiresNda && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                NDA Required
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-6 space-y-5">
          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Number
            </label>
            <input
              id="vehicleNumber"
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g. KA-01-AB-1234"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact
            </label>
            <input
              id="emergencyContact"
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="materialCarriedIn" className="block text-sm font-medium text-gray-700 mb-1">
              Material Carried In
            </label>
            <textarea
              id="materialCarriedIn"
              value={materialCarriedIn}
              onChange={(e) => setMaterialCarriedIn(e.target.value)}
              placeholder="Describe any materials you are bringing..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
            />
          </div>

          {visit.visitorType?.requiresNda && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ndaAccepted}
                onChange={(e) => setNdaAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the Non-Disclosure Agreement terms and conditions for this visit.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
          >
            {submitting ? 'Submitting...' : 'Submit Pre-Arrival Form'}
          </button>
        </form>
      </div>
    </div>
  );
}
