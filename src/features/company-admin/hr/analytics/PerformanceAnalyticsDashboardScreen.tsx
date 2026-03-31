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
  DrilldownTable,
  ScatterChart,
  HeatmapChart,
  ZeroDataState,
  type DrilldownColumn,
} from '@/components/analytics';

const managerColumns: DrilldownColumn[] = [
  { key: 'managerName', header: 'Manager', sortable: true },
  { key: 'department', header: 'Department', sortable: true },
  { key: 'teamSize', header: 'Team Size', sortable: true },
  { key: 'avgRating', header: 'Avg Rating', sortable: true },
  { key: 'completionPct', header: 'Completion %', sortable: true },
  { key: 'effectivenessScore', header: 'Effectiveness', sortable: true },
];

export function PerformanceAnalyticsDashboardScreen() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('performance', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/performance?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No performance data yet"
        description="Performance analytics will appear once appraisal cycles and goals are configured."
        ctaLabel="Go to Appraisal Cycles"
        ctaPath="/app/company/hr/appraisal-cycles"
      />
    );
  }

  return (
    <DashboardShell
      title="Performance Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load performance dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Rating by Cycle + Goal Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Bell Curve Overlay + 9-Box Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.distributions?.[0] && (
          <DistributionChart distribution={dashboardData.distributions[0]} />
        )}
        {dashboardData?.nineBox && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">
              9-Box Grid
            </h3>
            <ScatterChart
              data={dashboardData.nineBox.data ?? []}
              xKey={dashboardData.nineBox.xKey ?? 'performance'}
              yKey={dashboardData.nineBox.yKey ?? 'potential'}
              xLabel="Performance"
              yLabel="Potential"
              quadrantLabels={{
                topLeft: 'High Potential',
                topRight: 'Stars',
                bottomLeft: 'Under-performers',
                bottomRight: 'Solid Contributors',
              }}
            />
          </div>
        )}
      </div>

      {/* Skill Gap Heatmap */}
      {dashboardData?.heatmap && (
        <HeatmapChart
          title="Skill Gap Heatmap"
          cells={dashboardData.heatmap.cells ?? []}
          rows={dashboardData.heatmap.rows ?? []}
          columns={dashboardData.heatmap.columns ?? []}
        />
      )}

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {/* Manager Effectiveness Table */}
      {dashboardData?.managerEffectiveness?.data && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">
            Manager Effectiveness
          </h3>
          <DrilldownTable
            data={dashboardData.managerEffectiveness.data}
            columns={managerColumns}
            total={dashboardData.managerEffectiveness.total ?? 0}
            page={tablePage}
            limit={dashboardData.managerEffectiveness.limit ?? 20}
            onPageChange={setTablePage}
            exportReportType="manager-effectiveness"
            exportFilters={filters}
          />
        </div>
      )}
    </DashboardShell>
  );
}
