import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalyticsDashboard } from '@/features/company-admin/api/use-analytics-queries';
import {
  DashboardShell,
  KPIGrid,
  TrendChart,
  DistributionChart,
  InsightsPanel,
  AlertsBanner,
  ScatterChart,
  ZeroDataState,
} from '@/components/analytics';

export function PayrollAnalyticsDashboardScreen() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const { data: response, isLoading, error } = useAnalyticsDashboard('payroll', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/payroll?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No payroll analytics yet"
        description="Payroll analytics will appear once payroll runs have been processed."
        ctaLabel="Go to Payroll Runs"
        ctaPath="/app/company/hr/payroll-runs"
      />
    );
  }

  return (
    <DashboardShell
      title="Payroll Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load payroll dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Payroll Cost 12mo + CTC Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Dept Cost Bar + CTC Bands Bar + Component Breakup Donut */}
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

      {/* Cost vs Performance Scatter */}
      {dashboardData?.scatter && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">
            Cost vs Performance
          </h3>
          <ScatterChart
            data={dashboardData.scatter.data ?? []}
            xKey={dashboardData.scatter.xKey ?? 'cost'}
            yKey={dashboardData.scatter.yKey ?? 'performance'}
            xLabel="CTC (Annual)"
            yLabel="Performance Score"
            quadrantLabels={{
              topLeft: 'High Perf / Low Cost',
              topRight: 'High Perf / High Cost',
              bottomLeft: 'Low Perf / Low Cost',
              bottomRight: 'Low Perf / High Cost',
            }}
          />
        </div>
      )}

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />
    </DashboardShell>
  );
}
