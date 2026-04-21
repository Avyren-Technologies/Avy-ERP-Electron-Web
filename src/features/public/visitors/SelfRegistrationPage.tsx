import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '@/lib/api/public-client';
import { showSuccess, showApiError } from '@/lib/toast';

const PURPOSE_OPTIONS = [
  { value: 'MEETING', label: 'Business Meeting' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'AUDIT', label: 'Audit / Inspection' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'SITE_TOUR', label: 'Site Tour' },
  { value: 'PERSONAL', label: 'Personal Visit' },
  { value: 'OTHER', label: 'Other' },
];

export function SelfRegistrationPage() {
  const { plantCode } = useParams<{ plantCode: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hostEmployeeName, setHostEmployeeName] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantCode) return;

    if (!name.trim() || !mobile.trim() || !purpose) {
      showApiError({ response: { data: { message: 'Please fill in all required fields.' } } });
      return;
    }

    if (!privacyConsent) {
      showApiError({ response: { data: { message: 'Please accept the privacy consent to continue.' } } });
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicApi.post(`/public/visit/register/${plantCode}`, {
        name: name.trim(),
        mobile: mobile.trim(),
        company: company.trim() || undefined,
        purpose,
        hostEmployeeName: hostEmployeeName.trim() || undefined,
        privacyConsent: true,
      });
      const visitCode = res.data?.data?.visitCode;
      setResultCode(visitCode || 'REGISTERED');
      showSuccess('Registration submitted successfully.');
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (resultCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration Successful</h2>
          <p className="text-gray-500 mb-4">
            Thank you, {name}. Your visit has been registered.
          </p>
          {resultCode !== 'REGISTERED' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm text-indigo-600 mb-1">Your Visit Code</p>
              <p className="text-2xl font-bold text-indigo-700 tracking-wider">{resultCode}</p>
              <p className="text-xs text-indigo-400 mt-2">Please save this code for reference.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Visitor Self-Registration</h1>
          <p className="text-indigo-100 mt-1">Please fill in your details to register your visit.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your mobile number"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company / Organisation
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter your company name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Visit <span className="text-red-500">*</span>
            </label>
            <select
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition bg-white"
            >
              <option value="">Select purpose...</option>
              {PURPOSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hostEmployeeName" className="block text-sm font-medium text-gray-700 mb-1">
              Host Employee Name
            </label>
            <input
              id="hostEmployeeName"
              type="text"
              value={hostEmployeeName}
              onChange={(e) => setHostEmployeeName(e.target.value)}
              placeholder="Person you are visiting"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              I consent to the collection and processing of my personal data for the purpose of this visit.
              <span className="text-red-500"> *</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
          >
            {submitting ? 'Registering...' : 'Register Visit'}
          </button>
        </form>
      </div>
    </div>
  );
}
