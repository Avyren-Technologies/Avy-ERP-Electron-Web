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
  HeatmapChart,
  ZeroDataState,
} from '@/components/analytics';

export function LeaveAnalyticsDashboardScreen() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const { data: response, isLoading, error } = useAnalyticsDashboard('leave', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/leave?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No leave analytics yet"
        description="Leave analytics will appear once leave policies and balances are configured."
        ctaLabel="Go to Leave Types"
        ctaPath="/app/company/hr/leave-types"
      />
    );
  }

  return (
    <DashboardShell
      title="Leave Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load leave dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Monthly Consumption Stacked */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
      </div>

      {/* Leave Density Heatmap */}
      {dashboardData?.heatmap && (
        <HeatmapChart
          title="Leave Density Heatmap"
          cells={dashboardData.heatmap.cells ?? []}
          rows={dashboardData.heatmap.rows ?? []}
          columns={dashboardData.heatmap.columns ?? []}
        />
      )}

      {/* Type Utilization Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.distributions?.[0] && (
          <DistributionChart distribution={dashboardData.distributions[0]} />
        )}
        {dashboardData?.distributions?.[1] && (
          <DistributionChart distribution={dashboardData.distributions[1]} />
        )}
      </div>

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />
    </DashboardShell>
  );
}
