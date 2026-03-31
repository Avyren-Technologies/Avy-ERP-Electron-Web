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
  FunnelChart,
  ZeroDataState,
  type FilterValues,
} from '@/components/analytics';

export function RecruitmentDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('recruitment', filters);
  const navigate = useNavigate();

  const activeDrilldown = searchParams.get('drilldown');

  const { data: drilldownData } = useAnalyticsDrilldown('recruitment', {
    type: activeDrilldown || '',
    ...filters,
    page: tablePage,
    limit: 20,
  });

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/recruitment?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No recruitment data yet"
        description="Recruitment analytics will appear once requisitions and candidates are tracked."
        ctaLabel="Go to Requisitions"
        ctaPath="/app/company/hr/requisitions"
      />
    );
  }

  return (
    <DashboardShell
      title="Recruitment Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load recruitment dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Hiring Velocity + Time-to-Hire Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Recruitment Funnel */}
      {dashboardData?.funnel && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">
            Recruitment Funnel
          </h3>
          <FunnelChart stages={dashboardData.funnel.stages ?? []} />
        </div>
      )}

      {/* Source Effectiveness Grouped Bar */}
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
