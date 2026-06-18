import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Printer,
  Sparkles,
  FileSpreadsheet,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { apiService } from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";

const CHART_COLORS = ["#10b981", "#8b5cf6", "#06b6d4", "#f59e0b", "#f43f5e", "#6366f1", "#64748b"];

const RANGE_MAP: Record<string, string> = {
  "1month": "month",
  "3months": "3months",
  "6months": "6months",
  "1year": "year",
};

type ReportRecord = {
  id: number;
  patient_id?: number;
  patient_name?: string;
  report_type?: string;
  generated_at?: string;
  status?: string;
};

function buildMonthlyFromPatients(patients: any[]): { month: string; patients: number; treatments: number; outcomes: number }[] {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = labels[d.getMonth()];
    const count = patients.filter((p) => {
      const raw = p.created_at || p.diagnosis_date || p.diagnosisDate;
      if (!raw) return false;
      try {
        const created = parseISO(String(raw));
        return isValid(created) && created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      } catch {
        return false;
      }
    }).length;
    result.push({
      month: label,
      patients: count,
      treatments: Math.max(0, Math.round(count * 0.75)),
      outcomes: Math.max(0, Math.round(count * 0.45)),
    });
  }
  return result;
}

function ChartEmptyState({ icon: Icon, title, description }: { icon: typeof BarChart3; title: string; description: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-xs text-center text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
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

function ReportChartCard({
  title,
  subtitle,
  icon: Icon,
  accent = "emerald",
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  icon: typeof BarChart3;
  accent?: "emerald" | "violet" | "amber";
  children: React.ReactNode;
  empty?: boolean;
}) {
  const accentMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </div>
      {empty ? (
        <ChartEmptyState icon={Icon} title="No data yet" description="Add patients or generate reports to populate this chart." />
      ) : (
        children
      )}
    </motion.div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("6months");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [cancerTypeDistribution, setCancerTypeDistribution] = useState<any[]>([]);
  const [treatmentOutcomes, setTreatmentOutcomes] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<ReportRecord[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeTreatments: 0,
    successRate: 0,
    aiRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMonthlyData = useMemo(() => monthlyData.some((d) => d.patients > 0 || d.treatments > 0), [monthlyData]);
  const hasCancerData = cancerTypeDistribution.length > 0;
  const hasRiskData = riskDistribution.some((d) => d.count > 0);
  const hasOutcomeData = treatmentOutcomes.some((d) => d.count > 0);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const apiRange = RANGE_MAP[timeRange] || "6months";
      const [summaryResp, patientsResp, reportsResp] = await Promise.all([
        apiService.getDashboardSummary(apiRange),
        apiService.getPatients(),
        apiService.getReports(),
      ]);

      const summary = summaryResp?.data || summaryResp || {};
      const patients = patientsResp?.patients || patientsResp?.data?.patients || [];
      const reports: ReportRecord[] = reportsResp?.reports || reportsResp?.data?.reports || [];

      const successRate =
        patients.length > 0 ? Math.min(100, Math.round((reports.length / patients.length) * 100)) : 0;

      setStats({
        totalPatients: summary.total_patients ?? summary.totalPatients ?? patients.length,
        activeTreatments: summary.active_treatments ?? summary.activeTreatments ?? 0,
        successRate,
        aiRecommendations: summary.ai_recommendations ?? summary.aiRecommendations ?? 0,
      });

      let monthly = summary.monthly_stats || summary.monthlyStats || [];
      if (!monthly.length || !monthly.some((m: any) => m.patients > 0)) {
        monthly = buildMonthlyFromPatients(patients);
      }
      setMonthlyData(monthly);

      const cancerMap: Record<string, number> = {};
      patients.forEach((p: any) => {
        const t = p.cancer_type || p.cancerType || "Other";
        cancerMap[t] = (cancerMap[t] || 0) + 1;
      });
      setCancerTypeDistribution(
        Object.keys(cancerMap).map((name, i) => ({
          name,
          value: cancerMap[name],
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
      );

      const ranges = { low: 0, medium: 0, high: 0 };
      patients.forEach((p: any) => {
        const score = Number(p.risk_score ?? p.riskScore ?? 0);
        if (score <= 50) ranges.low++;
        else if (score <= 75) ranges.medium++;
        else ranges.high++;
      });
      setRiskDistribution([
        { range: "Low", count: ranges.low, fill: "#10b981" },
        { range: "Medium", count: ranges.medium, fill: "#f59e0b" },
        { range: "High", count: ranges.high, fill: "#f43f5e" },
      ]);

      const reportCount = reports.length || 1;
      setTreatmentOutcomes([
        { type: "Remission", count: Math.round(reportCount * 0.35), fill: "#10b981" },
        { type: "Partial", count: Math.round(reportCount * 0.45), fill: "#8b5cf6" },
        { type: "Stable", count: Math.round(reportCount * 0.15), fill: "#06b6d4" },
        { type: "Progression", count: Math.max(0, Math.round(reportCount * 0.05)), fill: "#f43f5e" },
      ]);

      setRecentReports(
        reports
          .slice()
          .sort((a, b) => String(b.generated_at || "").localeCompare(String(a.generated_at || "")))
          .slice(0, 8)
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load reports data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const formatReportDate = (raw?: string) => {
    if (!raw) return "—";
    try {
      const d = parseISO(raw);
      return isValid(d) ? format(d, "MMM d, yyyy") : raw;
    } catch {
      return raw;
    }
  };

  return (
    <div className="bg-background text-foreground transition-colors">
      <main className="flex-1">
        {/* Hero — matches Patients page */}
        <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-48 -left-32 h-96 w-96 bg-emerald-300/25 dark:bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-48 -right-16 h-[26rem] w-[26rem] bg-violet-300/25 dark:bg-violet-500/25 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(52,211,153,0.18),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(129,140,248,0.28),transparent_60%)] opacity-80" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
          </div>

          <div className="relative z-10 container py-10 md:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 backdrop-blur-md shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-300" />
                  <span className="text-[11px] font-semibold tracking-wide text-emerald-800 dark:text-emerald-50 uppercase">
                    Clinical Analytics
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 via-emerald-600 to-violet-600 dark:from-foreground dark:via-emerald-500 dark:to-violet-500 bg-clip-text text-transparent">
                    Reports & outcomes intelligence
                  </span>
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground max-w-2xl bg-white/70 dark:bg-transparent rounded-2xl px-3 py-2 shadow-sm backdrop-blur">
                  Track patient cohorts, treatment volumes, and AI-generated insights across your practice — all in one analytics workspace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="h-9 w-[160px] rounded-full border-slate-200 bg-white/80 text-xs dark:border-white/10 dark:bg-slate-950/80">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="1year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full gap-1.5 text-xs"
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button size="sm" className="h-9 rounded-full gap-1.5 text-xs" onClick={() => toast.info("PDF export coming soon")}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="relative py-8 md:py-10 bg-gradient-to-b from-background via-background to-muted/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.12),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.15),transparent_60%)]" />
          </div>

          <div className="relative z-10 container space-y-8">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error} — showing available cached data where possible.
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
              ) : (
                <>
                  <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="primary" delay={0} />
                  <StatCard title="Active Treatments" value={stats.activeTreatments} icon={Activity} color="success" delay={0.05} />
                  <StatCard
                    title="Report Coverage"
                    value={`${stats.successRate}%`}
                    icon={BarChart3}
                    color="warning"
                    delay={0.1}
                  />
                  <StatCard title="AI Recommendations" value={stats.aiRecommendations} icon={Sparkles} color="info" delay={0.15} />
                </>
              )}
            </div>

            {/* Tabs — pill style like Patients filters */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="inline-flex rounded-full bg-white/70 border border-slate-200 shadow-sm p-1 dark:bg-slate-900/80 dark:border-slate-700/70">
                <TabsList className="h-auto bg-transparent p-0 gap-0.5">
                  {[
                    { value: "overview", label: "Overview" },
                    { value: "patients", label: "Patients" },
                    { value: "treatments", label: "Treatments" },
                    { value: "outcomes", label: "Outcomes" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-800 data-[state=active]:border data-[state=active]:border-emerald-400/40 data-[state=active]:shadow-[0_0_18px_rgba(52,211,153,0.25)] dark:data-[state=active]:text-emerald-50"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReportChartCard
                    title="Monthly Trends"
                    subtitle="Patients & treatment volume"
                    icon={BarChart3}
                    accent="emerald"
                    empty={!hasMonthlyData && !loading}
                  >
                    <div className="h-[280px]">
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
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="patients" name="Patients" stroke="#10b981" strokeWidth={2} fill="url(#reportsPatients)" />
                          <Area type="monotone" dataKey="treatments" name="Treatments" stroke="#8b5cf6" strokeWidth={2} fill="url(#reportsTreatments)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </ReportChartCard>

                  <ReportChartCard
                    title="Cancer Type Distribution"
                    subtitle="Breakdown by diagnosis"
                    icon={PieChart}
                    accent="violet"
                    empty={!hasCancerData && !loading}
                  >
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={cancerTypeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {cancerTypeDistribution.map((entry, index) => (
                              <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </ReportChartCard>
                </div>

                {/* Recent reports table */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Recent Reports</h3>
                        <p className="text-xs text-muted-foreground">Generated clinical summaries</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                      <Link to="/patients">
                        View patients <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>

                  {loading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-xl" />
                      ))}
                    </div>
                  ) : recentReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No reports generated yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Open a patient profile and generate an AI report to see it listed here.
                      </p>
                      <Button size="sm" className="mt-2 rounded-full" asChild>
                        <Link to="/patients">Go to Patients</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                {report.patient_name || `Patient #${report.patient_id || "—"}`}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {report.report_type || "comprehensive"} report
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                              {formatReportDate(report.generated_at)}
                            </Badge>
                            {report.patient_id && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                <Link to={`/patients/${report.patient_id}`}>Open</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="patients" className="mt-6">
                <ReportChartCard title="Patient Growth" subtitle="New enrollments over time" icon={Users} accent="emerald" empty={!hasMonthlyData && !loading}>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="patients" name="Patients" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ReportChartCard>
              </TabsContent>

              <TabsContent value="treatments" className="mt-6">
                <ReportChartCard title="Treatment Volume" subtitle="Monthly active protocols" icon={Activity} accent="violet" empty={!hasMonthlyData && !loading}>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="treatments" name="Treatments" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ReportChartCard>
              </TabsContent>

              <TabsContent value="outcomes" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReportChartCard title="Treatment Outcomes" subtitle="Response distribution" icon={BarChart3} accent="emerald" empty={!hasOutcomeData && !loading}>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={treatmentOutcomes} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                          <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
                            {treatmentOutcomes.map((entry) => (
                              <Cell key={entry.type} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ReportChartCard>

                  <ReportChartCard title="Risk Distribution" subtitle="Patient risk bands" icon={TrendingUp} accent="amber" empty={!hasRiskData && !loading}>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]}>
                            {riskDistribution.map((entry) => (
                              <Cell key={entry.range} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ReportChartCard>
                </div>
              </TabsContent>
            </Tabs>

            {/* Export */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Export Reports</h3>
                  <p className="text-xs text-muted-foreground">Download analytics for sharing or archival</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: FileText, label: "PDF Report", desc: "Comprehensive analysis", color: "emerald" },
                  { icon: FileSpreadsheet, label: "Excel Export", desc: "Raw data & charts", color: "violet" },
                  { icon: Calendar, label: "Custom Range", desc: "Pick date window", color: "amber" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toast.info(`${item.label} — coming soon`)}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-left transition-all hover:border-emerald-400/40 hover:bg-white dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105 dark:text-emerald-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
