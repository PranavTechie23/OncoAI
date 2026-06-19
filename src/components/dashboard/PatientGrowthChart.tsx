import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";
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

export function PatientGrowthChart({ data }: PatientGrowthChartProps) {
  const { totalPatients, totalReports, badge } = getActivitySummary(data);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number; dataKey: string; color: string }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      let formattedLabel = label;
      if (typeof label === "string" && label.includes("-")) {
        try {
          const date = parseISO(label);
          if (isValid(date)) formattedLabel = format(date, "MMM d, yyyy");
        } catch {
          /* keep raw */
        }
      }

      return (
        <div className="rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md dark:bg-slate-900/90">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{formattedLabel}</p>
          {payload.map((entry) => (
            <div key={entry.dataKey} className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xs text-slate-500">
                {entry.dataKey === "patients" ? "New patients" : "Reports"}
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl border border-border dark:border-white/5 bg-card dark:bg-white/5 p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none"
    >
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
        {data.length === 0 || (totalPatients === 0 && totalReports === 0) ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center px-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No activity yet</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              New patients and reports will appear here as you add them to the portal.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutcomes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                dy={8}
                tickFormatter={(value: string) => {
                  if (typeof value === "string" && value.includes("-")) {
                    try {
                      const date = parseISO(value);
                      if (isValid(date)) {
                        if (value.length === 7) return format(date, "MMM");
                        return format(date, "MMM d");
                      }
                    } catch {
                      /* keep raw */
                    }
                  }
                  return value;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(148, 163, 184, 0.2)", strokeWidth: 2 }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {value === "patients" ? "New patients" : "Reports"}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2.5} fill="url(#colorPatients)" />
              <Area type="monotone" dataKey="outcomes" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorOutcomes)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
