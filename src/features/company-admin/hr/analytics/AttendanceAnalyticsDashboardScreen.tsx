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
  HeatmapChart,
  ZeroDataState,
  type DrilldownColumn,
  type FilterValues,
} from '@/components/analytics';

const attendanceColumns: DrilldownColumn[] = [
  { key: 'employeeName', header: 'Employee', sortable: true },
  { key: 'department', header: 'Department', sortable: true },
  { key: 'attendancePct', header: 'Attendance %', sortable: true },
  { key: 'lateCount', header: 'Late Count', sortable: true },
  { key: 'avgHours', header: 'Avg Hours', sortable: true },
  { key: 'otHours', header: 'OT Hours', sortable: true },
];

export function AttendanceAnalyticsDashboardScreen() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [drilldownPage, setDrilldownPage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('attendance', filters);
  const navigate = useNavigate();

  const dashboardData = response?.data;

  const handleDrilldown = (type: string) => {
    navigate(`/app/company/hr/analytics/attendance?drilldown=${type}`);
  };

  if (!isLoading && !dashboardData?.kpis?.length && !dashboardData?.meta?.lastComputedAt) {
    return (
      <ZeroDataState
        title="No attendance analytics yet"
        description="Attendance analytics will appear once attendance records are processed."
        ctaLabel="Go to Attendance"
        ctaPath="/app/company/hr/attendance"
      />
    );
  }

  return (
    <DashboardShell
      title="Attendance Analytics"
      filters={filters}
      onFiltersChange={setFilters}
      loading={isLoading}
      error={error ? 'Failed to load attendance dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* Daily Attendance 30d + OT Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {dashboardData?.trends?.[0] && (
          <TrendChart series={[dashboardData.trends[0]]} />
        )}
        {dashboardData?.trends?.[1] && (
          <TrendChart series={[dashboardData.trends[1]]} />
        )}
      </div>

      {/* Department Heatmap */}
      {dashboardData?.heatmap && (
        <HeatmapChart
          title="Department Attendance Heatmap"
          cells={dashboardData.heatmap.cells ?? []}
          rows={dashboardData.heatmap.rows ?? []}
          columns={dashboardData.heatmap.columns ?? []}
        />
      )}

      {/* Source Breakdown + Shift Adherence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData?.distributions?.[0] && (
          <DistributionChart distribution={dashboardData.distributions[0]} />
        )}
        {dashboardData?.distributions?.[1] && (
          <DistributionChart distribution={dashboardData.distributions[1]} />
        )}
      </div>

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {/* Drilldown Table */}
      {dashboardData?.drilldown?.data && (
        <DrilldownTable
          data={dashboardData.drilldown.data}
          columns={attendanceColumns}
          total={dashboardData.drilldown.total ?? 0}
          page={drilldownPage}
          limit={dashboardData.drilldown.limit ?? 20}
          onPageChange={setDrilldownPage}
          exportReportType="attendance-drilldown"
          exportFilters={filters}
        />
      )}
    </DashboardShell>
  );
}
