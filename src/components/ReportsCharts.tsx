import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#10b981", "#8b5cf6", "#06b6d4", "#f59e0b", "#f43f5e", "#6366f1", "#64748b"];

export function ReportsChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-blue-100/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-sm font-semibold text-slate-800 dark:text-white">
          {entry.name || entry.dataKey}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ReportsMonthlyAreaChart({ monthlyData }: { monthlyData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="reportsPatients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="reportsTreatments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<ReportsChartTooltip />} />
        <Area type="monotone" dataKey="patients" name="Patients" stroke="#10b981" strokeWidth={2} fill="url(#reportsPatients)" />
        <Area type="monotone" dataKey="treatments" name="Treatments" stroke="#8b5cf6" strokeWidth={2} fill="url(#reportsTreatments)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReportsCancerTypePieChart({ cancerTypeDistribution }: { cancerTypeDistribution: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={cancerTypeDistribution}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {cancerTypeDistribution.map((entry, index) => (
            <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ReportsChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ReportsPatientGrowthChart({ monthlyData }: { monthlyData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<ReportsChartTooltip />} />
        <Line type="monotone" dataKey="patients" name="Patients" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReportsTreatmentVolumeChart({ monthlyData }: { monthlyData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<ReportsChartTooltip />} />
        <Bar dataKey="treatments" name="Treatments" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsOutcomeDistributionChart({ treatmentOutcomes }: { treatmentOutcomes: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={treatmentOutcomes} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<ReportsChartTooltip />} />
        <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
          {treatmentOutcomes.map((entry: any) => (
            <Cell key={entry.type} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportsRiskDistributionChart({ riskDistribution }: { riskDistribution: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={riskDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<ReportsChartTooltip />} />
        <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]}>
          {riskDistribution.map((entry: any) => (
            <Cell key={entry.range} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
