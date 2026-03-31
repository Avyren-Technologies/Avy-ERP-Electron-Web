import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalyticsDashboard, useAnalyticsDrilldown } from '@/features/company-admin/api/use-analytics-queries';
import {
  DashboardShell,
  KPIGrid,
  DistributionChart,
  InsightsPanel,
  AlertsBanner,
  DrilldownTable,
  ZeroDataState,
  type FilterValues,
} from '@/components/analytics';

export function WorkforceDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('workforce', filters);
  const navigate = useNavigate();

  const activeDrilldown = searchParams.get('drilldown');

  const { data: drilldownData } = useAnalyticsDrilldown('workforce', {
    type: activeDrilldown || '',
    ...filters,
    page: tablePage,
    limit: 20,
  });

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/workforce?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No workforce data yet"
        description="Workforce analytics will appear once employee records are created."
        ctaLabel="Go to Employee Directory"
        ctaPath="/app/company/hr/employees"
      />
    );
  }

  return (
    <DashboardShell
      title="Workforce Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load workforce dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Gender Ratio (donut) + Age Bands (bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.distributions?.[0] && (
          <DistributionChart distribution={dashboardData.distributions[0]} />
        )}
        {dashboardData?.distributions?.[1] && (
          <DistributionChart distribution={dashboardData.distributions[1]} />
        )}
      </div>

      {/* Dept Strength (grouped bar) + Tenure Bands (bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.distributions?.[2] && (
          <DistributionChart distribution={dashboardData.distributions[2]} />
        )}
        {dashboardData?.distributions?.[3] && (
          <DistributionChart distribution={dashboardData.distributions[3]} />
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
