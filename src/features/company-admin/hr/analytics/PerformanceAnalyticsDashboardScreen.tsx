import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, PieChart, Grid3X3, Users } from 'lucide-react';
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
  type FilterValues,
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
  const [filters, setFilters] = useState<FilterValues>({});
  const [tablePage, setTablePage] = useState(1);
  const { data: response, isLoading, error } = useAnalyticsDashboard('performance', filters);
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
      headerSubtitle="Track rating momentum, talent distribution, and manager effectiveness outcomes."
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
      error={error ? 'Failed to load performance dashboard' : null}
    >
      {(dashboardData?.alerts?.length ?? 0) > 0 && (
        <AlertsBanner alerts={dashboardData!.alerts} />
      )}

      <KPIGrid kpis={dashboardData?.kpis ?? []} onDrilldown={handleDrilldown} />

      {/* ── Rating Trends ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Rating Trends</h2>
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

      {/* ── Bell Curve & 9-Box ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <PieChart className="h-4 w-4 text-violet-500" />
          </div>
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Distribution & 9-Box</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData?.distributions?.[0] && (
            <DistributionChart distribution={dashboardData.distributions[0]} />
          )}
          {dashboardData?.nineBox && (
            <ScatterChart
              data={dashboardData.nineBox.data ?? []}
              xKey={dashboardData.nineBox.xKey ?? 'performance'}
              yKey={dashboardData.nineBox.yKey ?? 'potential'}
              xLabel="Performance"
              yLabel="Potential"
              title="9-Box Grid"
              quadrantLabels={{
                topLeft: 'High Potential',
                topRight: 'Stars',
                bottomLeft: 'Under-performers',
                bottomRight: 'Solid Contributors',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Skill Gap Heatmap ── */}
      {dashboardData?.heatmap && (
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Grid3X3 className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Skill Gap Analysis</h2>
          </div>
          <HeatmapChart
            title="Skill Gap Heatmap"
            cells={dashboardData.heatmap.cells ?? []}
            rows={dashboardData.heatmap.rows ?? []}
            columns={dashboardData.heatmap.columns ?? []}
          />
        </div>
      )}

      <InsightsPanel insights={dashboardData?.insights ?? []} onDrilldown={handleDrilldown} />

      {/* ── Manager Effectiveness ── */}
      {dashboardData?.managerEffectiveness?.data && (
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-cyan-500" />
            </div>
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Manager Effectiveness</h2>
          </div>
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
