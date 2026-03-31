import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Clock,
  CalendarOff,
  IndianRupee,
  Shield,
  Target,
  UserMinus,
  ShieldCheck,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  History,
  RotateCcw,
  Filter,
  AlertTriangle,
  FileDown,
} from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import {
  analyticsKeys,
  useReportCatalog,
  useReportHistory,
  useRateLimit,
} from '@/features/company-admin/api/use-analytics-queries';
import { useDepartments, useGrades, useEmployeeTypes } from '@/features/company-admin/api';
import { useCompanyLocations } from '@/features/company-admin/api';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { showSuccess, showApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';

// ── Report Definitions ──

interface ReportDef {
  key: string;
  title: string;
  description: string;
  category: string;
  sheets: string[];
}

const REPORT_DEFINITIONS: Record<string, ReportDef> = {
  'employee-master': {
    key: 'employee-master',
    title: 'Employee Master Report',
    description: 'Complete employee directory with personal, employment, and statutory details.',
    category: 'Workforce',
    sheets: ['Employee Details', 'Contact Info'],
  },
  'headcount-movement': {
    key: 'headcount-movement',
    title: 'Headcount & Movement',
    description: 'Monthly joiners, leavers, and net headcount change analysis.',
    category: 'Workforce',
    sheets: ['Summary', 'Joiners', 'Leavers', 'Transfers', 'Department-wise'],
  },
  'demographics': {
    key: 'demographics',
    title: 'Demographics Report',
    description: 'Gender, age, tenure distribution and diversity metrics.',
    category: 'Workforce',
    sheets: ['Gender', 'Age Groups', 'Tenure'],
  },
  'org-hierarchy': {
    key: 'org-hierarchy',
    title: 'Org Hierarchy Report',
    description: 'Reporting relationships, spans of control, and org depth analysis.',
    category: 'Workforce',
    sheets: ['Hierarchy Tree', 'Span of Control'],
  },
  'daily-attendance': {
    key: 'daily-attendance',
    title: 'Daily Attendance Report',
    description: 'Day-by-day attendance status for all employees with shift details.',
    category: 'Attendance',
    sheets: ['Attendance Log', 'Summary', 'Exceptions'],
  },
  'monthly-attendance': {
    key: 'monthly-attendance',
    title: 'Monthly Attendance Summary',
    description: 'Monthly attendance consolidation with present, absent, leave, and OT days.',
    category: 'Attendance',
    sheets: ['Summary', 'Department-wise', 'Employee-wise', 'Late Arrivals'],
  },
  'overtime-report': {
    key: 'overtime-report',
    title: 'Overtime Report',
    description: 'Overtime hours, eligible employees, and cost analysis.',
    category: 'Attendance',
    sheets: ['OT Summary', 'Employee Details'],
  },
  'shift-roster': {
    key: 'shift-roster',
    title: 'Shift Roster Report',
    description: 'Shift assignments and rotation schedules across departments.',
    category: 'Attendance',
    sheets: ['Roster', 'Shift Coverage'],
  },
  'leave-balance': {
    key: 'leave-balance',
    title: 'Leave Balance Report',
    description: 'Current leave balances for all employees across all leave types.',
    category: 'Leave',
    sheets: ['Balances', 'Type-wise Summary'],
  },
  'leave-utilization': {
    key: 'leave-utilization',
    title: 'Leave Utilization Report',
    description: 'Leave consumption patterns, trends, and encashment analysis.',
    category: 'Leave',
    sheets: ['Utilization', 'Trends', 'Encashment'],
  },
  'leave-request-log': {
    key: 'leave-request-log',
    title: 'Leave Request Log',
    description: 'Complete log of leave requests with approval status and comments.',
    category: 'Leave',
    sheets: ['Requests', 'Approvals'],
  },
  'salary-register': {
    key: 'salary-register',
    title: 'Salary Register',
    description: 'Monthly salary register with all earnings, deductions, and net pay.',
    category: 'Payroll',
    sheets: ['Register', 'Earnings', 'Deductions', 'Bank Transfer', 'Summary'],
  },
  'payslip-batch': {
    key: 'payslip-batch',
    title: 'Payslip Batch Report',
    description: 'Batch payslip data for bulk printing and distribution.',
    category: 'Payroll',
    sheets: ['Payslips', 'Summary'],
  },
  'ctc-report': {
    key: 'ctc-report',
    title: 'CTC Report',
    description: 'Cost-to-company analysis with monthly and annual breakdowns.',
    category: 'Payroll',
    sheets: ['CTC Breakup', 'Department-wise', 'Grade-wise'],
  },
  'bank-advice': {
    key: 'bank-advice',
    title: 'Bank Advice Statement',
    description: 'Bank transfer file for salary disbursement with account details.',
    category: 'Payroll',
    sheets: ['Bank Advice'],
  },
  'pf-ecr': {
    key: 'pf-ecr',
    title: 'PF ECR Report',
    description: 'EPFO Electronic Challan cum Return for PF contributions.',
    category: 'Statutory',
    sheets: ['ECR Data', 'Summary'],
  },
  'esi-return': {
    key: 'esi-return',
    title: 'ESI Return Report',
    description: 'Employee State Insurance monthly contribution return.',
    category: 'Statutory',
    sheets: ['ESI Data', 'Summary'],
  },
  'pt-report': {
    key: 'pt-report',
    title: 'Professional Tax Report',
    description: 'State-wise professional tax deduction and remittance report.',
    category: 'Statutory',
    sheets: ['PT Deductions', 'State Summary'],
  },
  'form-16': {
    key: 'form-16',
    title: 'Form 16 Data Report',
    description: 'Annual income tax computation data for Form 16 generation.',
    category: 'Statutory',
    sheets: ['Part A', 'Part B', 'Tax Computation'],
  },
  'appraisal-summary': {
    key: 'appraisal-summary',
    title: 'Appraisal Summary Report',
    description: 'Performance appraisal scores, ratings distribution, and bell curve.',
    category: 'Performance',
    sheets: ['Scores', 'Ratings', 'Bell Curve'],
  },
  'goal-tracker': {
    key: 'goal-tracker',
    title: 'Goal Tracker Report',
    description: 'Goal setting status, progress tracking, and completion rates.',
    category: 'Performance',
    sheets: ['Goals', 'Progress', 'Completion'],
  },
  'attrition-analysis': {
    key: 'attrition-analysis',
    title: 'Attrition Analysis Report',
    description: 'Employee turnover rates, exit reasons, and retention metrics.',
    category: 'Attrition',
    sheets: ['Attrition Rate', 'Exit Reasons', 'Department-wise', 'Tenure-wise'],
  },
  'exit-fnf': {
    key: 'exit-fnf',
    title: 'Exit & F&F Report',
    description: 'Full and final settlement details for separated employees.',
    category: 'Attrition',
    sheets: ['Exit List', 'F&F Details'],
  },
  'compliance-checklist': {
    key: 'compliance-checklist',
    title: 'Compliance Checklist Report',
    description: 'HR compliance status across statutory requirements and deadlines.',
    category: 'Compliance',
    sheets: ['Checklist', 'Overdue Items'],
  },
  'document-expiry': {
    key: 'document-expiry',
    title: 'Document Expiry Report',
    description: 'Employee document validity tracking and renewal reminders.',
    category: 'Compliance',
    sheets: ['Expiring Soon', 'Expired', 'All Documents'],
  },
  'training-report': {
    key: 'training-report',
    title: 'Training Report',
    description: 'Training programs, nominations, completion status, and feedback.',
    category: 'Compliance',
    sheets: ['Programs', 'Nominations', 'Completion'],
  },
};

const CATEGORIES = [
  'Workforce',
  'Attendance',
  'Leave',
  'Payroll',
  'Statutory',
  'Performance',
  'Attrition',
  'Compliance',
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_CONFIG: Record<Category, { color: string; bgColor: string; textColor: string; borderColor: string; icon: React.ElementType }> = {
  Workforce: { color: 'bg-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', textColor: 'text-indigo-700 dark:text-indigo-300', borderColor: 'border-indigo-200 dark:border-indigo-800', icon: Users },
  Attendance: { color: 'bg-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800', icon: Clock },
  Leave: { color: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-800', icon: CalendarOff },
  Payroll: { color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800', icon: IndianRupee },
  Statutory: { color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800', icon: Shield },
  Performance: { color: 'bg-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-700 dark:text-pink-300', borderColor: 'border-pink-200 dark:border-pink-800', icon: Target },
  Attrition: { color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-700 dark:text-red-300', borderColor: 'border-red-200 dark:border-red-800', icon: UserMinus },
  Compliance: { color: 'bg-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-700 dark:text-teal-300', borderColor: 'border-teal-200 dark:border-teal-800', icon: ShieldCheck },
};

const REPORT_LIST = Object.values(REPORT_DEFINITIONS);

function getReportsByCategory(category: string) {
  return REPORT_LIST.filter(r => r.category === category);
}

// ── Helpers ──

function getCurrentMonth() {
  return String(new Date().getMonth() + 1);
}

function getCurrentYear() {
  return String(new Date().getFullYear());
}

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getLastDayOfMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(2);
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { date: `${day} ${month} '${year}`, time };
}

function summarizeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.month && filters.year) {
    const monthName = new Date(2000, Number(filters.month) - 1).toLocaleString('en-US', { month: 'short' });
    parts.push(`${monthName} ${filters.year}`);
  }
  if (filters.departmentId) parts.push('Dept filtered');
  if (filters.locationId) parts.push('Location filtered');
  if (filters.dateFrom) parts.push(`From ${filters.dateFrom}`);
  if (filters.dateTo) parts.push(`To ${filters.dateTo}`);
  return parts.join(', ') || 'No filters';
}

// ── Skeleton Components ──

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden animate-pulse">
      <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-700/50 rounded" />
        <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-700/50 rounded" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>
        <div className="h-9 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg mt-4" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
          <div className="h-5 w-1/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-1/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-1/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-1/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-1/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Filters Panel ──

interface Filters {
  dateFrom: string;
  dateTo: string;
  month: string;
  year: string;
  departmentId: string;
  locationId: string;
  gradeId: string;
  employeeTypeId: string;
}

const DEFAULT_FILTERS: Filters = {
  dateFrom: getFirstDayOfMonth(),
  dateTo: getLastDayOfMonth(),
  month: getCurrentMonth(),
  year: getCurrentYear(),
  departmentId: '',
  locationId: '',
  gradeId: '',
  employeeTypeId: '',
};

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
];

function FiltersPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const { data: deptData } = useDepartments();
  const { data: locData } = useCompanyLocations();
  const { data: gradeData } = useGrades();
  const { data: empTypeData } = useEmployeeTypes();

  const departments = useMemo(
    () => (deptData?.data ?? []).map((d: { id: string; name: string }) => ({ value: d.id, label: d.name })),
    [deptData],
  );
  const locations = useMemo(
    () => (locData?.data ?? []).map((l: { id: string; name: string }) => ({ value: l.id, label: l.name })),
    [locData],
  );
  const grades = useMemo(
    () => (gradeData?.data ?? []).map((g: { id: string; name: string }) => ({ value: g.id, label: g.name })),
    [gradeData],
  );
  const employeeTypes = useMemo(
    () => (empTypeData?.data ?? []).map((e: { id: string; name: string }) => ({ value: e.id, label: e.name })),
    [empTypeData],
  );

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50/80 dark:hover:bg-neutral-700/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          <Filter className="w-4 h-4" />
          Report Filters
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-neutral-100 dark:border-neutral-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <SearchableSelect
              label="Month"
              value={filters.month}
              onChange={v => onChange({ ...filters, month: v })}
              options={MONTHS}
              placeholder="Select month"
            />
            <SearchableSelect
              label="Year"
              value={filters.year}
              onChange={v => onChange({ ...filters, year: v })}
              options={YEARS}
              placeholder="Select year"
            />
            <SearchableSelect
              label="Department"
              value={filters.departmentId}
              onChange={v => onChange({ ...filters, departmentId: v })}
              options={departments}
              placeholder="All departments"
            />
            <SearchableSelect
              label="Location"
              value={filters.locationId}
              onChange={v => onChange({ ...filters, locationId: v })}
              options={locations}
              placeholder="All locations"
            />
            <SearchableSelect
              label="Grade"
              value={filters.gradeId}
              onChange={v => onChange({ ...filters, gradeId: v })}
              options={grades}
              placeholder="All grades"
            />
            <SearchableSelect
              label="Employee Type"
              value={filters.employeeTypeId}
              onChange={v => onChange({ ...filters, employeeTypeId: v })}
              options={employeeTypes}
              placeholder="All types"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={onReset}
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rate Limit Badge ──

function RateLimitBadge() {
  const { data: rateLimitData } = useRateLimit();
  const rateLimit = rateLimitData?.data;

  if (!rateLimit) return null;

  const remaining = rateLimit.remaining ?? 20;
  const limit = rateLimit.limit ?? 20;
  const pct = (remaining / limit) * 100;
  const barColor = remaining > 10 ? 'bg-emerald-500' : remaining > 5 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = remaining > 10 ? 'text-emerald-700 dark:text-emerald-400' : remaining > 5 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2.5">
      <FileDown className="w-4 h-4 text-neutral-400" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-sm font-medium', textColor)}>
            {remaining}/{limit} exports remaining
          </span>
          <span className="text-xs text-neutral-400">this hour</span>
        </div>
        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Report Card ──

function ReportCard({
  report,
  downloading,
  rateLimitExceeded,
  onDownload,
}: {
  report: ReportDef;
  downloading: boolean;
  rateLimitExceeded: boolean;
  onDownload: (key: string) => void;
}) {
  const config = CATEGORY_CONFIG[report.category as Category];

  return (
    <div className="group rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col">
      {/* Category accent bar */}
      <div className={cn('h-1.5', config.color)} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
            {report.title}
          </h3>
          <span className={cn('shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', config.bgColor, config.textColor)}>
            {report.sheets.length} sheets
          </span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3 line-clamp-2">
          {report.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {report.sheets.map(sheet => (
            <span
              key={sheet}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
            >
              {sheet}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onDownload(report.key)}
            disabled={downloading || rateLimitExceeded}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
              rateLimitExceeded
                ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                : downloading
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow',
            )}
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : rateLimitExceeded ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Limit Reached
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Section ──

function CategorySection({
  category,
  reports,
  downloading,
  rateLimitExceeded,
  onDownload,
}: {
  category: Category;
  reports: ReportDef[];
  downloading: Record<string, boolean>;
  rateLimitExceeded: boolean;
  onDownload: (key: string) => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.textColor)} />
        </div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{category} Reports</h2>
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
          {reports.length} {reports.length === 1 ? 'report' : 'reports'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map(report => (
          <ReportCard
            key={report.key}
            report={report}
            downloading={!!downloading[report.key]}
            rateLimitExceeded={rateLimitExceeded}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}

// ── History Table ──

interface HistoryEntry {
  id: string;
  reportType: string;
  generatedBy: { name: string };
  createdAt: string;
  filters: Record<string, unknown>;
  category: string;
}

function HistoryTable({
  downloading,
  rateLimitExceeded,
  onRegenerate,
}: {
  downloading: Record<string, boolean>;
  rateLimitExceeded: boolean;
  onRegenerate: (reportType: string, filters: Record<string, unknown>) => void;
}) {
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('');
  const limit = 10;

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page, limit };
    if (filterCategory) p.category = filterCategory;
    return p;
  }, [page, filterCategory]);

  const { data: historyData, isLoading } = useReportHistory(params);
  const entries: HistoryEntry[] = historyData?.data ?? [];
  const meta = historyData?.meta;

  const categoryOptions = CATEGORIES.map(c => ({ value: c, label: c }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-52">
          <SearchableSelect
            value={filterCategory}
            onChange={v => { setFilterCategory(v); setPage(1); }}
            options={categoryOptions}
            placeholder="All categories"
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-1">No reports generated yet</h3>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">Switch to the Report Catalog tab to generate your first report.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-neutral-50 to-neutral-50/50 dark:from-neutral-800/60 dark:to-neutral-800/30 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left font-semibold text-neutral-600 dark:text-neutral-300 px-5 py-3">Report</th>
                  <th className="text-left font-semibold text-neutral-600 dark:text-neutral-300 px-5 py-3">Generated By</th>
                  <th className="text-left font-semibold text-neutral-600 dark:text-neutral-300 px-5 py-3">Date</th>
                  <th className="text-left font-semibold text-neutral-600 dark:text-neutral-300 px-5 py-3">Filters</th>
                  <th className="text-right font-semibold text-neutral-600 dark:text-neutral-300 px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {entries.map(entry => {
                  const def = REPORT_DEFINITIONS[entry.reportType];
                  const catConfig = def ? CATEGORY_CONFIG[def.category as Category] : null;
                  const { date, time } = formatDateTime(entry.createdAt);

                  return (
                    <tr key={entry.id} className="bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {def?.title ?? entry.reportType}
                          </span>
                          {catConfig && (
                            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', catConfig.bgColor, catConfig.textColor)}>
                              {def.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-300">
                        {entry.generatedBy?.name ?? 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-neutral-900 dark:text-white">{date}</div>
                        <div className="text-xs text-neutral-400">{time}</div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400 text-xs">
                        {summarizeFilters(entry.filters ?? {})}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onRegenerate(entry.reportType, entry.filters ?? {})}
                          disabled={!!downloading[entry.reportType] || rateLimitExceeded}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                            rateLimitExceeded
                              ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                              : downloading[entry.reportType]
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 cursor-wait'
                                : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
                          )}
                        >
                          {downloading[entry.reportType] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          Re-generate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:text-neutral-300 dark:disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Prev
              </button>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:text-neutral-300 dark:disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Screen ──

type Tab = 'catalog' | 'history';

export function ReportsHubScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: rateLimitData } = useRateLimit();
  const { isLoading: catalogLoading } = useReportCatalog();

  const remaining = rateLimitData?.data?.remaining ?? 20;
  const rateLimitExceeded = remaining <= 0;

  const handleDownload = async (reportType: string, overrideFilters?: Record<string, unknown>) => {
    setDownloading(prev => ({ ...prev, [reportType]: true }));
    try {
      const exportFilters = overrideFilters ?? filters;
      const params: Record<string, unknown> = { ...exportFilters, format: 'excel' };
      // Remove empty string values
      Object.keys(params).forEach(k => {
        if (params[k] === '') delete params[k];
      });

      const response = await analyticsApi.exportReport(reportType, params);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${(exportFilters as Filters).dateFrom || 'report'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      const def = REPORT_DEFINITIONS[reportType];
      showSuccess(`${def?.title ?? reportType} downloaded`);

      queryClient.invalidateQueries({ queryKey: [...analyticsKeys.all, 'report-history'] });
      queryClient.invalidateQueries({ queryKey: [...analyticsKeys.all, 'rate-limit'] });
    } catch (err) {
      showApiError(err);
    } finally {
      setDownloading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const handleRegenerate = (reportType: string, savedFilters: Record<string, unknown>) => {
    handleDownload(reportType, savedFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-950 dark:to-neutral-900/50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4A3AFF] via-indigo-500 to-violet-500 dark:from-indigo-800 dark:via-indigo-700 dark:to-violet-700">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.06] blur-sm" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.04]" />
        <div className="absolute top-6 right-24 w-20 h-20 rounded-full bg-white/[0.05]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Reports & Downloads</h1>
          </div>
          <p className="text-white/60 text-sm font-medium mt-1.5">
            Generate and download enterprise HR reports across all modules
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Tabs + Rate Limit */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-700/60 p-1.5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'catalog'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Report Catalog
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">({REPORT_LIST.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'history'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50',
              )}
            >
              <History className="w-4 h-4" />
              Download History
            </button>
          </div>

          <div className="sm:w-72">
            <RateLimitBadge />
          </div>
        </div>

        {/* Filters */}
        {activeTab === 'catalog' && (
          <div className="mb-6">
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        )}

        {/* Content */}
        {activeTab === 'catalog' ? (
          <div className="space-y-10 pb-12">
            {catalogLoading ? (
              <div className="space-y-10">
                {CATEGORIES.slice(0, 3).map(cat => (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                      <div className="h-5 w-40 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              CATEGORIES.map(category => {
                const reports = getReportsByCategory(category);
                if (reports.length === 0) return null;
                return (
                  <CategorySection
                    key={category}
                    category={category}
                    reports={reports}
                    downloading={downloading}
                    rateLimitExceeded={rateLimitExceeded}
                    onDownload={key => handleDownload(key)}
                  />
                );
              })
            )}
          </div>
        ) : (
          <div className="pb-12">
            <HistoryTable
              downloading={downloading}
              rateLimitExceeded={rateLimitExceeded}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
