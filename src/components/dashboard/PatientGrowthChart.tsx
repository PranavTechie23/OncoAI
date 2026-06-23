import React, { Suspense } from "react";
import { format, parseISO, isValid } from "date-fns";

interface DataPoint {
  month: string;
  patients: number;
  outcomes?: number;
}

interface PatientGrowthChartProps {
  data: DataPoint[];
}

function getActivitySummary(data: DataPoint[]) {
  const totalPatients = data.reduce((sum, d) => sum + (d.patients || 0), 0);
  const totalReports = data.reduce((sum, d) => sum + (d.outcomes || 0), 0);

  if (data.length === 0) {
    return { totalPatients, totalReports, badge: null as string | null };
  }

  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid).reduce((s, d) => s + (d.patients || 0), 0);
  const secondHalf = data.slice(mid).reduce((s, d) => s + (d.patients || 0), 0);

  let badge: string | null = null;
  if (totalPatients === 0 && totalReports === 0) {
    badge = "No activity in this period";
  } else if (secondHalf > firstHalf && firstHalf > 0) {
    const pct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    badge = `Enrollment up ${pct}% recently`;
  } else if (secondHalf < firstHalf && secondHalf === 0 && firstHalf > 0) {
    badge = "Activity slowed this period";
  } else {
    const peak = data.reduce(
      (best, d) => ((d.patients || 0) + (d.outcomes || 0) > best.score ? { label: d.month, score: (d.patients || 0) + (d.outcomes || 0) } : best),
      { label: "", score: 0 },
    );
    if (peak.score > 0) {
      badge = `Busiest: ${peak.label}`;
    }
  }

  return { totalPatients, totalReports, badge };
}

const ChartClient = React.lazy(() => import("./PatientGrowthChart.client"));

export function PatientGrowthChart({ data }: PatientGrowthChartProps) {
  const { totalPatients, totalReports, badge } = getActivitySummary(data);

  const skeleton = (
    <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl border border-border dark:border-white/5 bg-card dark:bg-white/5 p-6">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Clinical Activity</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {totalPatients} new {totalPatients === 1 ? "patient" : "patients"} · {totalReports}{" "}
            {totalReports === 1 ? "report" : "reports"}
          </p>
        </div>
        {badge && (
          <span className="inline-flex shrink-0 items-center rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 w-full">
        <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl bg-slate-50 dark:bg-transparent">
          <div className="h-48 w-full max-w-3xl animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={skeleton}>
      <ChartClient data={data} />
    </Suspense>
  );
}
