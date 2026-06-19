import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Users, Activity, AlertCircle, Brain, CalendarDays, RefreshCw, AlertTriangle } from "lucide-react";
import { apiService } from "@/services/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/dashboard/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Insight } from "@/components/dashboard/AIInsights";
import type { UpcomingAppointment } from "@/components/dashboard/UpcomingAppointments";
import type { ActivityItem } from "@/components/dashboard/RecentActivity";

const PatientGrowthChart = lazy(() => import("@/components/dashboard/PatientGrowthChart").then((mod) => ({ default: mod.PatientGrowthChart })));
const AIInsights = lazy(() => import("@/components/dashboard/AIInsights").then((mod) => ({ default: mod.AIInsights })));
const RecentActivity = lazy(() => import("@/components/dashboard/RecentActivity").then((mod) => ({ default: mod.RecentActivity })));
const TopPatients = lazy(() => import("@/components/dashboard/DashboardWidgets").then((mod) => ({ default: mod.TopPatients })));
const UpcomingAppointments = lazy(() => import("@/components/dashboard/UpcomingAppointments").then((mod) => ({ default: mod.UpcomingAppointments })));

interface DashboardTrend {
  value: number;
  is_positive: boolean;
}

interface TopPatient {
  id: number;
  name: string;
  riskScore?: number;
  risk_score?: number;
  risk_level?: string;
  status?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function mapTrend(trend?: DashboardTrend) {
  if (!trend) return undefined;
  return { value: trend.value, isPositive: trend.is_positive };
}

const widgetFallback = (className = "h-56") => (
  <div className={`rounded-3xl border border-border dark:border-white/5 bg-card p-6 shadow-xl ${className}`}>
    <div className="h-full animate-pulse rounded-2xl bg-muted" />
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();

  const [timeRange, setTimeRange] = useState("6months");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [stats, setStats] = useState({
    totalPatients: 0,
    activeTreatments: 0,
    highRiskPatients: 0,
    aiRecommendations: 0,
  });
  const [trends, setTrends] = useState<Record<string, DashboardTrend>>({});
  const [monthlyStats, setMonthlyStats] = useState<{ month: string; patients: number; outcomes?: number }[]>([]);
  const [topPatients, setTopPatients] = useState<TopPatient[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (timeRange === "custom" && dateRange?.from) {
        startDateStr = dateRange.from.toISOString();
        if (dateRange.to) {
          endDateStr = dateRange.to.toISOString();
        }
      }

      const resp = await apiService.getDashboardSummary(timeRange, startDateStr, endDateStr);

      if (signal?.cancelled) return;

      setStats({
        totalPatients: Number(resp?.total_patients ?? resp?.totalPatients ?? 0),
        activeTreatments: Number(resp?.active_treatments ?? resp?.activeTreatments ?? 0),
        highRiskPatients: Number(resp?.high_risk_patients ?? resp?.highRiskPatients ?? 0),
        aiRecommendations: Number(resp?.ai_recommendations ?? resp?.aiRecommendations ?? 0),
      });
      setTrends(resp?.trends ?? {});
      setMonthlyStats(resp?.monthly_stats ?? []);
      setTopPatients(resp?.top_patients ?? []);
      setRecentActivities(resp?.recent_activities ?? []);
      setUpcomingAppointments(resp?.upcoming_appointments ?? []);
      setAiInsights(resp?.ai_insights ?? []);
    } catch (e) {
      console.error("[Dashboard] API Error:", e);
      if (!signal?.cancelled) {
        setError(e instanceof Error ? e.message : "Unable to load dashboard data");
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [timeRange, dateRange]);

  useEffect(() => {
    const signal = { cancelled: false };
    const timeoutId = setTimeout(() => {
      loadDashboard(signal);
    }, timeRange === "custom" ? 500 : 0);

    return () => {
      signal.cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [loadDashboard, refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="relative text-foreground dark:text-slate-100 selection:bg-emerald-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/70 dark:bg-emerald-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-100/70 dark:bg-violet-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
        <div className="absolute top-[20%] right-[20%] h-[300px] w-[300px] rounded-full bg-teal-100/50 dark:bg-teal-500/5 blur-[80px] mix-blend-multiply dark:mix-blend-normal" />
      </div>

      <main className="relative z-10 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground dark:text-white">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Doctor"}
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {formatToday()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {timeRange === "custom" && (
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            )}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] border-border/50 dark:border-white/10 bg-background/50 dark:bg-white/5 text-foreground dark:text-slate-200 backdrop-blur-sm hover:bg-accent/50 dark:hover:bg-white/10 focus:ring-emerald-500/50">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="border-border dark:border-white/10 bg-background dark:bg-[#0F172A] text-foreground dark:text-slate-200">
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-full border-emerald-200/60 dark:border-white/10 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh dashboard</span>
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200/60 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 px-4 py-3">
            <div className="flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="shrink-0 rounded-full border-rose-300/50">
              Retry
            </Button>
          </div>
        )}

        {/* High-risk alert */}
        {!loading && stats.highRiskPatients > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {stats.highRiskPatients} high-risk {stats.highRiskPatients === 1 ? "patient needs" : "patients need"} attention
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/70">Review priority patients and AI recommendations.</p>
              </div>
            </div>
            <Button size="sm" className="rounded-full bg-amber-600 hover:bg-amber-700 text-white shrink-0" asChild>
              <Link to="/patients">Review patients</Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard
                title="Patients"
                subtitle="Under your care"
                value={stats.totalPatients}
                trend={mapTrend(trends.total_patients)}
                icon={Users}
                color="primary"
                delay={0}
                href="/patients"
              />
              <StatCard
                title="Active treatments"
                subtitle="Ongoing protocols"
                value={stats.activeTreatments}
                trend={mapTrend(trends.active_treatments)}
                icon={Activity}
                color="success"
                delay={0.1}
                href="/patients"
              />
              <StatCard
                title="High risk"
                subtitle={stats.highRiskPatients > 0 ? "Review recommended" : "No urgent cases"}
                value={stats.highRiskPatients}
                trend={mapTrend(trends.high_risk_patients)}
                trendLabel="vs last period"
                icon={AlertCircle}
                color="warning"
                delay={0.2}
                href="/patients"
              />
              <StatCard
                title="AI recommendations"
                subtitle="Ready to review"
                value={stats.aiRecommendations}
                trend={mapTrend(trends.ai_recommendations)}
                icon={Brain}
                color="info"
                delay={0.3}
                href="/recommendations"
              />
            </>
          )}
        </div>

        {/* Chart + AI Insights — matched height, insights scroll internally */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          <div className="lg:col-span-2">
            <Suspense fallback={widgetFallback("h-[420px]")}>
              <PatientGrowthChart data={monthlyStats} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={widgetFallback("h-[420px]")}>
              <AIInsights insights={aiInsights} loading={loading} />
            </Suspense>
          </div>
        </div>

        {/* Today's focus — appointments + priority patients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Suspense fallback={widgetFallback("min-h-[300px]")}>
            <UpcomingAppointments appointments={upcomingAppointments} loading={loading} />
          </Suspense>
          <Suspense fallback={widgetFallback("min-h-[300px]")}>
            <TopPatients patients={topPatients} />
          </Suspense>
        </div>

        {/* Recent activity */}
        <Suspense fallback={widgetFallback("min-h-[260px]")}>
          <RecentActivity activities={recentActivities} />
        </Suspense>
      </main>
    </div>
  );
}
