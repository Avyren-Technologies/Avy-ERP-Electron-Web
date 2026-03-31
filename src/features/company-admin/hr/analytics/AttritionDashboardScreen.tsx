import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, ShieldAlert } from 'lucide-react';
import { useAnalyticsDashboard } from '@/features/company-admin/api/use-analytics-queries';
import {
  DashboardShell,
  KPIGrid,
  TrendChart,
  DistributionChart,
  InsightsPanel,
  AlertsBanner,
  DrilldownTable,
  ZeroDataState,
  type DrilldownColumn,
  type FilterValues,
} from '@/components/analytics';

const flightRiskColumns: DrilldownColumn[] = [
  { key: 'employeeName', header: 'Employee', sortable: true },
  { key: 'department', header: 'Department', sortable: true },
  { key: 'designation', header: 'Designation', sortable: true },
  { key: 'tenure', header: 'Tenure', sortable: true },
  {
    key: 'riskScore',
    header: 'Risk Score',
    sortable: true,
    render: (item: Record<string, unknown>) => {
      const score = Number(item.riskScore) || 0;
      const colorClass =
        score >= 80
          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
          : score >= 60
            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
          {score}%
        </span>
      );
    },
  },
  { key: 'topFactor', header: 'Top Factor', sortable: false },
];

export function AttritionDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('attrition', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;
  const alertCount = dashboardData?.alerts?.length ?? 0;
  const kpiCount = dashboardData?.kpis?.length ?? 0;
  const lastComputedAt = dashboardData?.meta?.lastComputedAt
    ? new Date(dashboardData.meta.lastComputedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Pending';

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/attrition?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No attrition data yet"
        description="Attrition analytics will appear once exit records and separations are processed."
        ctaLabel="Go to Exit Requests"
        ctaPath="/app/company/hr/exit-requests"
      />
    );
  }

  return (
    <DashboardShell
      title="Attrition Analytics"
      headerSubtitle="Analyze attrition risk, separation drivers, and retention performance trends."
      headerAside={(
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm md:min-w-[360px]">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold">Last refresh</p>
            <p className="mt-1 text-xs font-semibold text-white">{lastComputedAt}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold">KPIs</p>
            <p className="mt-1 text-sm font-bold text-white">{kpiCount}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/70 font-semibold">Alerts</p>
            <p className="mt-1 text-sm font-bold text-white">{alertCount}</p>
          </div>
        </div>
      )}
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load attrition dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* ── Trend Analysis ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Attrition Trends</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData?.trends?.[0] && (
            <TrendChart series={[dashboardData.trends[0]]} />
          )}
          {dashboardData?.trends?.[1] && (
            <TrendChart series={[dashboardData.trends[1]]} />
          )}
        </div>
      </div>

      {/* ── Distribution ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <PieChart className="h-4 w-4 text-violet-500" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Separation Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {dashboardData?.distributions?.[0] && (
            <DistributionChart distribution={dashboardData.distributions[0]} />
          )}
          {dashboardData?.distributions?.[1] && (
            <DistributionChart distribution={dashboardData.distributions[1]} />
          )}
          {dashboardData?.distributions?.[2] && (
            <DistributionChart distribution={dashboardData.distributions[2]} />
          )}
        </div>
      </div>

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {/* ── Flight Risk Panel ── */}
      {dashboardData?.flightRisk?.data && (
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Flight Risk Panel</h2>
          </div>
          <DrilldownTable
            data={dashboardData.flightRisk.data}
            columns={flightRiskColumns}
            total={dashboardData.flightRisk.total ?? 0}
            page={tablePage}
            limit={dashboardData.flightRisk.limit ?? 20}
            onPageChange={setTablePage}
            exportReportType="flight-risk"
            exportFilters={filters}
          />
        </div>
      )}
    </DashboardShell>
  );
}
