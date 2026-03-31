import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart } from 'lucide-react';
import { useAnalyticsDashboard } from '@/features/company-admin/api/use-analytics-queries';
import {
  DashboardShell,
  KPIGrid,
  TrendChart,
  DistributionChart,
  InsightsPanel,
  AlertsBanner,
  ZeroDataState,
  type FilterValues,
} from '@/components/analytics';

export function ComplianceDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const { data: response, isLoading, error } = useAnalyticsDashboard('compliance', filters);
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
    navigate(`/app/company/hr/analytics/compliance?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No compliance data yet"
        description="Compliance analytics will appear once statutory filings and grievance records are created."
        ctaLabel="Go to Statutory Filings"
        ctaPath="/app/company/hr/statutory-filings"
      />
    );
  }

  return (
    <DashboardShell
      title="Compliance Dashboard"
      headerSubtitle="Stay ahead on statutory readiness, governance exposure, and policy compliance."
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
      error={error ? 'Failed to load compliance dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* ── Compliance Trends ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Compliance Trends</h2>
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
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Category Breakdown</h2>
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
    </DashboardShell>
  );
}
