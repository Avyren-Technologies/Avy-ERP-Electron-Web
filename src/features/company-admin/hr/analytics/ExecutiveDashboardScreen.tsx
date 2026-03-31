import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalyticsDashboard, useAnalyticsDrilldown } from '@/features/company-admin/api/use-analytics-queries';
import {
  DashboardShell,
  KPIGrid,
  TrendChart,
  DistributionChart,
  InsightsPanel,
  AlertsBanner,
  DrilldownTable,
  ZeroDataState,
  type FilterValues,
} from '@/components/analytics';

export function ExecutiveDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('executive', filters);
  const navigate = useNavigate();

  const activeDrilldown = searchParams.get('drilldown');

  const { data: drilldownData } = useAnalyticsDrilldown('executive', {
    type: activeDrilldown || '',
    ...filters,
    page: tablePage,
    limit: 20,
  });

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/executive?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No analytics data yet"
        description="Analytics will appear once employee data is added and the first computation runs."
        ctaLabel="Go to Employee Directory"
        ctaPath="/app/company/hr/employees"
      />
    );
  }

  return (
    <DashboardShell
      title="Executive Overview"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load executive dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Headcount + Payroll Cost Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Department Headcount + Cost by Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.distributions?.[0] && (
          <DistributionChart distribution={dashboardData.distributions[0]} />
        )}
        {dashboardData?.distributions?.[1] && (
          <DistributionChart distribution={dashboardData.distributions[1]} />
        )}
      </div>

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {activeDrilldown && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {activeDrilldown.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <button onClick={() => setSearchParams({})} className="text-sm text-neutral-500 hover:text-neutral-700">
              Close
            </button>
          </div>
          <DrilldownTable
            data={drilldownData?.data?.data ?? []}
            columns={[]}
            total={drilldownData?.data?.meta?.total ?? 0}
            page={tablePage}
            limit={20}
            onPageChange={setTablePage}
          />
        </div>
      )}
    </DashboardShell>
  );
}
