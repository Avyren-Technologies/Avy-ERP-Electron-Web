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
  ZeroDataState,
  type DrilldownColumn,
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
          {score}%
        </span>
      );
    },
  },
  { key: 'topFactor', header: 'Top Factor', sortable: false },
];

export function AttritionDashboardScreen() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('attrition', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;

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
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load attrition dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Attrition 12mo + Early Attrition Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Separation Type Donut + Exit Reasons Bar + Tenure at Exit Bar */}
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

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {/* Flight Risk Panel */}
      {dashboardData?.flightRisk?.data && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">
            Flight Risk Panel
          </h3>
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
