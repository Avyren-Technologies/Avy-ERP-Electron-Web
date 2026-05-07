import { useState, useEffect, useMemo, useRef } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
  LogIn,
  LogOut,
  Activity,
  Fingerprint,
  ScanFace,
  CreditCard,
  Hash,
  Radio,
} from 'lucide-react';
import { useBiometricPunchLogs } from '@/features/company-admin/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { EmptyState } from '@/components/ui/EmptyState';

/* ── Constants ── */

const STATUS_CODE_MAP: Record<number, string> = {
  0: 'Check In',
  1: 'Check Out',
  4: 'OT In',
  5: 'OT Out',
};

const VERIFY_TYPE_MAP: Record<number, string> = {
  1: 'Fingerprint',
  4: 'Face',
  15: 'RFID',
  20: 'PIN',
};

const PUNCH_TYPE_STYLE: Record<string, string> = {
  'Check In': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'Check Out': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  'OT In': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  'OT Out': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const VERIFY_ICON: Record<string, React.ReactNode> = {
  Fingerprint: <Fingerprint className="w-3.5 h-3.5" />,
  Face: <ScanFace className="w-3.5 h-3.5" />,
  RFID: <CreditCard className="w-3.5 h-3.5" />,
  PIN: <Hash className="w-3.5 h-3.5" />,
};

/* ── Types ── */

interface FeedItem {
  id: string;
  deviceName: string;
  serialNumber: string;
  deviceUserId: string;
  employeeName: string | null;
  employeeId: string | null;
  punchTime: string;
  punchType: string;
  verifyType: string;
  isNew?: boolean;
}

/* ── Helpers ── */

function mapPunchLogToFeed(log: Record<string, unknown>): FeedItem {
  const statusCode = log.statusCode as number | undefined;
  const verifyCode = log.verifyType as number | undefined;
  // The API returns the device relation if included, otherwise just serialNumber
  const device = log.device as Record<string, unknown> | undefined;

  return {
    id: log.id as string,
    deviceName: (device?.deviceName as string) ?? (log.serialNumber as string) ?? 'Unknown Device',
    serialNumber: (log.serialNumber as string) ?? '',
    deviceUserId: (log.deviceUserId as string) ?? '',
    // API punch logs don't include employee names — show null (displayed as "Unknown - ID: X")
    employeeName: null,
    employeeId: (log.employeeId as string) ?? null,
    punchTime: (log.punchTime as string) ?? (log.receivedAt as string) ?? '',
    punchType: statusCode != null ? (STATUS_CODE_MAP[statusCode] ?? `Code ${statusCode}`) : 'Unknown',
    verifyType: verifyCode != null ? (VERIFY_TYPE_MAP[verifyCode] ?? `Type ${verifyCode}`) : 'Unknown',
  };
}

/** Check if a punch is "today" using the company formatter's timezone, not browser timezone. */
function isTodayInCompanyTz(isoString: string, fmtObj: ReturnType<typeof useCompanyFormatter>): boolean {
  const punchZoned = fmtObj.parseToZoned(isoString);
  const nowZoned = fmtObj.parseToZoned(new Date().toISOString());
  return punchZoned.hasSame(nowZoned, 'day');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Screen ── */

export function BiometricLiveFeedScreen() {
  const fmt = useCompanyFormatter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Load initial data from API
  const { data: punchLogsData } = useBiometricPunchLogs({ limit: 50 });

  // Seed feed from API on first load
  useEffect(() => {
    if (initialLoadDone.current) return;
    const logs = (punchLogsData as Record<string, unknown>)?.data as Record<string, unknown>[] | undefined;
    if (logs && logs.length > 0) {
      setFeed(logs.map(mapPunchLogToFeed));
      initialLoadDone.current = true;
    }
  }, [punchLogsData]);

  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = connectSocket();

    const handlePunch = (data: {
      punchLogId: string;
      deviceName: string;
      serialNumber: string;
      deviceUserId: string;
      employeeName: string | null;
      employeeId: string | null;
      punchTime: string;
      punchType: string;
      verifyType: string;
    }) => {
      const item: FeedItem = {
        id: data.punchLogId,
        deviceName: data.deviceName,
        serialNumber: data.serialNumber,
        deviceUserId: data.deviceUserId,
        employeeName: data.employeeName,
        employeeId: data.employeeId,
        punchTime: data.punchTime,
        punchType: data.punchType,
        verifyType: data.verifyType,
        isNew: true,
      };

      setFeed((prev) => [item, ...prev].slice(0, 50));
      setAnimatingIds((prev) => new Set(prev).add(data.punchLogId));

      // Remove animation flag after transition completes
      setTimeout(() => {
        setAnimatingIds((prev) => {
          const next = new Set(prev);
          next.delete(data.punchLogId);
          return next;
        });
      }, 700);
    };

    socket.on('attendance:punch', handlePunch);

    return () => {
      socket.off('attendance:punch', handlePunch);
      disconnectSocket();
    };
  }, []);

  // Today's stats
  const todayStats = useMemo(() => {
    const todayItems = feed.filter((item) => isTodayInCompanyTz(item.punchTime, fmt));
    return {
      checkIns: todayItems.filter((i) => i.punchType === 'Check In').length,
      checkOuts: todayItems.filter((i) => i.punchType === 'Check Out').length,
      total: todayItems.length,
    };
  }, [feed]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Attendance Feed</h1>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time biometric punch events from all connected devices
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Radio className="w-4 h-4 text-green-500" />
          <span>Listening for punches...</span>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check-Ins Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.checkIns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check-Outs Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.checkOuts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Punches Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Punches</h2>
          <span className="text-xs text-gray-400">{feed.length} events</span>
        </div>

        {feed.length === 0 ? (
          <EmptyState
            icon="list"
            title="No attendance punches yet"
            message="Punches will appear here in real-time as employees scan."
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[600px] overflow-y-auto">
            {feed.map((item) => {
              const isAnimating = animatingIds.has(item.id);
              const isUnmapped = !item.employeeId && !item.employeeName;
              const punchStyle = PUNCH_TYPE_STYLE[item.punchType] ?? 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
              const verifyIcon = VERIFY_ICON[item.verifyType] ?? null;
              const displayName = item.employeeName ?? (isUnmapped ? `Unknown — ID: ${item.deviceUserId}` : `Employee ${item.employeeId}`);

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-all duration-500 ${
                    isAnimating
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/10 translate-x-0 opacity-100'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'
                  }`}
                  style={{
                    animation: isAnimating ? 'slideInFeed 0.5s ease-out' : undefined,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${
                      isUnmapped
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}
                  >
                    {item.employeeName ? getInitials(item.employeeName) : item.deviceUserId.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isUnmapped
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {item.deviceName}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${punchStyle}`}>
                      {item.punchType}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      {verifyIcon}
                      {item.verifyType}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {fmt.time(item.punchTime)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmt.relativeDate(item.punchTime)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes slideInFeed {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default BiometricLiveFeedScreen;
