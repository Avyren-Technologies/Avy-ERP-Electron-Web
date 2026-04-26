import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
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

interface FormConfig {
  company: { id: string; name: string; displayName?: string; logoUrl?: string };
  plant: { id: string; name: string; code: string };
  visitorTypes: { id: string; name: string; code: string }[];
  employees: { id: string; name: string }[];
  config: { photoRequired: boolean; privacyConsentText?: string };
}

export function SelfRegistrationPage() {
  const { plantCode } = useParams<{ plantCode: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [visitorName, setVisitorName] = useState('');
  const [visitorMobile, setVisitorMobile] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hostEmployeeId, setHostEmployeeId] = useState('');
  const [hostSearch, setHostSearch] = useState('');
  const [hostDropdownOpen, setHostDropdownOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const [visitorTypeId, setVisitorTypeId] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Load form config (company info, visitor types, privacy text) on mount
  useEffect(() => {
    if (!plantCode) return;
    publicApi
      .get(`/public/visit/register/${plantCode}`)
      .then((res) => {
        setFormConfig(res.data?.data);
      })
      .catch((err) => {
        setConfigError(err.response?.data?.message || err.response?.data?.error || 'Failed to load registration form.');
      })
      .finally(() => setConfigLoading(false));
  }, [plantCode]);

  // Close host dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) {
        setHostDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantCode) return;

    if (!visitorName.trim() || !visitorMobile.trim() || !purpose) {
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
        visitorName: visitorName.trim(),
        visitorMobile: visitorMobile.trim(),
        visitorEmail: visitorEmail.trim() || undefined,
        visitorCompany: visitorCompany.trim() || undefined,
        purpose,
        hostEmployeeId: hostEmployeeId || undefined,
        visitorTypeId: visitorTypeId || undefined,
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

  if (configLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (configError || !formConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration Unavailable</h2>
          <p className="text-gray-500">{configError || 'Self-registration is not available at this facility.'}</p>
        </div>
      </div>
    );
  }

  const downloadQR = () => {
    const svg = document.querySelector("#visit-qr-code svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `visit-${resultCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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
            Thank you, {visitorName}. Your visit has been registered.
          </p>
          {resultCode !== 'REGISTERED' && (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-indigo-600 mb-1">Your Visit Code</p>
                <p className="text-2xl font-bold text-indigo-700 tracking-wider mb-3">{resultCode}</p>
                <div id="visit-qr-code" className="flex justify-center mb-3">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode value={resultCode} size={180} />
                  </div>
                </div>
                <button
                  onClick={downloadQR}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </button>
                <p className="text-xs text-indigo-400 mt-3">Please save this code for reference.</p>
              </div>

              <div className="space-y-2">
                <Link
                  to={`/visit/${resultCode}/status`}
                  className="block w-full py-2.5 px-4 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition"
                >
                  Check Visit Status
                </Link>
                <Link
                  to={`/visit/${resultCode}/badge`}
                  className="block w-full py-2.5 px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition"
                >
                  View Digital Badge (after check-in)
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const companyDisplayName = formConfig.company.displayName || formConfig.company.name;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white">
          {formConfig.company.logoUrl && (
            <img src={formConfig.company.logoUrl} alt={companyDisplayName} className="h-10 mb-3 object-contain" />
          )}
          <h1 className="text-2xl font-bold">Visitor Self-Registration</h1>
          <p className="text-indigo-100 mt-1">{companyDisplayName} - {formConfig.plant.name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-6 space-y-5">
          <div>
            <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="visitorName"
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="visitorMobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              id="visitorMobile"
              type="tel"
              value={visitorMobile}
              onChange={(e) => setVisitorMobile(e.target.value)}
              placeholder="Enter your mobile number"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="visitorEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400 text-xs font-normal">(for visit confirmation &amp; digital badge)</span>
            </label>
            <input
              id="visitorEmail"
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="visitor@company.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="visitorCompany" className="block text-sm font-medium text-gray-700 mb-1">
              Company / Organisation
            </label>
            <input
              id="visitorCompany"
              type="text"
              value={visitorCompany}
              onChange={(e) => setVisitorCompany(e.target.value)}
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

          <div ref={hostRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host Employee <span className="text-gray-400 text-xs font-normal">(optional)</span>
            </label>
            <button
              type="button"
              onClick={() => setHostDropdownOpen(!hostDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition bg-white text-left"
            >
              <span className={hostEmployeeId ? 'text-gray-900' : 'text-gray-400'}>
                {hostEmployeeId
                  ? formConfig.employees.find(e => e.id === hostEmployeeId)?.name ?? 'Selected'
                  : 'Select person you are visiting...'}
              </span>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {hostDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                    placeholder="Search employees..."
                    autoFocus
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="overflow-y-auto max-h-48">
                  <button
                    type="button"
                    onClick={() => { setHostEmployeeId(''); setHostSearch(''); setHostDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 italic"
                  >
                    No host (walk-in)
                  </button>
                  {(formConfig.employees ?? [])
                    .filter(e => !hostSearch || e.name.toLowerCase().includes(hostSearch.toLowerCase()))
                    .map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => { setHostEmployeeId(emp.id); setHostSearch(''); setHostDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition ${hostEmployeeId === emp.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                      >
                        {emp.name}
                        {hostEmployeeId === emp.id && (
                          <svg className="inline w-4 h-4 ml-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {formConfig.visitorTypes.length > 1 && (
            <div>
              <label htmlFor="visitorTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Type
              </label>
              <select
                id="visitorTypeId"
                value={visitorTypeId}
                onChange={(e) => setVisitorTypeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition bg-white"
              >
                <option value="">Select type...</option>
                {formConfig.visitorTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>{vt.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              {formConfig.config.privacyConsentText || 'I consent to the collection and processing of my personal data for the purpose of this visit.'}
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
