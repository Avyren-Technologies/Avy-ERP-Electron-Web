import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { publicApi } from '@/lib/api/public-client';

interface BadgeData {
  visitorName: string;
  visitorCompany?: string;
  badgeNumber?: string;
  visitorType?: {
    name: string;
    code?: string;
    badgeColour?: string;
    requireEscort?: boolean;
  };
  company?: {
    name: string;
    displayName?: string;
    logoUrl?: string;
  };
  checkInTime?: string;
  expectedDurationMinutes?: number;
  qrCodeData?: string;
  status: string;
  message?: string;
  visitDate?: string;
  safetyInductionStatus?: string;
}

const TYPE_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

export function DigitalBadgePage() {
  const { visitCode } = useParams<{ visitCode: string }>();
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitCode) return;
    publicApi
      .get(`/public/visit/${visitCode}/badge`)
      .then((res) => {
        setBadge(res.data?.data);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Badge not found.');
        } else {
          setError('An unexpected error occurred.');
        }
      })
      .finally(() => setLoading(false));
  }, [visitCode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Badge Not Available</h2>
          <p className="text-gray-500">{error || 'This badge link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  // Not started
  if (badge.status === 'NOT_STARTED' || badge.status === 'PENDING' || badge.status === 'APPROVED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Badge Not Yet Active</h2>
          <p className="text-gray-500">Please check in at the gate to activate your digital badge.</p>
        </div>
      </div>
    );
  }

  // Visit ended
  if (badge.status === 'ENDED' || badge.status === 'CHECKED_OUT') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Visit Ended</h2>
          <p className="text-gray-500">This visit has been completed. Thank you for visiting.</p>
        </div>
      </div>
    );
  }

  // Active badge
  const typeColor = badge.visitorType?.badgeColour
    ? TYPE_COLORS[badge.visitorType.badgeColour] || 'bg-indigo-500'
    : 'bg-indigo-500';

  const companyDisplayName = badge.company?.displayName || badge.company?.name;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="max-w-sm w-full">
        {/* Badge card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
          {/* Color strip */}
          <div className={`h-2 ${typeColor}`} />

          {/* Safety Induction Banner */}
          {badge.safetyInductionStatus === 'PENDING' && (
            <Link
              to={`/visit/${visitCode}/induction`}
              className="block bg-amber-50 border-b border-amber-200 px-4 py-3 hover:bg-amber-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">Safety Induction Required</p>
                  <p className="text-xs text-amber-600">Please complete your safety induction</p>
                </div>
                <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Escort Required Banner */}
          {badge.visitorType?.requireEscort && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800">Escort Required</p>
                  <p className="text-xs text-red-600">This visitor requires an escort at all times</p>
                </div>
              </div>
            </div>
          )}

          {/* Badge header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
            {badge.company?.logoUrl && (
              <img src={badge.company.logoUrl} alt={companyDisplayName} className="h-8 mx-auto mb-3 object-contain" />
            )}
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-3">
              <span className="text-3xl font-bold text-indigo-600">
                {badge.visitorName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{badge.visitorName}</h2>
            {badge.visitorCompany && (
              <p className="text-sm text-gray-500 mt-1">{badge.visitorCompany}</p>
            )}
          </div>

          {/* Badge details */}
          <div className="px-6 py-4 space-y-3">
            {badge.badgeNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Badge No.</span>
                <span className="font-mono font-semibold text-gray-800">{badge.badgeNumber}</span>
              </div>
            )}
            {badge.visitorType && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Visitor Type</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor} text-white`}>
                  {badge.visitorType.name}
                </span>
              </div>
            )}
            {badge.checkInTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Check-In</span>
                <span className="font-medium text-gray-800">
                  {new Date(badge.checkInTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            )}
            {companyDisplayName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Facility</span>
                <span className="font-medium text-gray-800">{companyDisplayName}</span>
              </div>
            )}
          </div>

          {/* QR section */}
          <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCode value={badge.qrCodeData || visitCode || ''} size={160} />
            </div>
            <p className="text-xs font-mono text-gray-500 mt-2">{badge.qrCodeData || visitCode}</p>
            <p className="text-xs text-gray-400 mt-1">Visit Code</p>
          </div>

          {/* Active indicator */}
          <div className="bg-green-500 px-6 py-2.5 text-center">
            <p className="text-white text-sm font-medium tracking-wide">ACTIVE VISIT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
