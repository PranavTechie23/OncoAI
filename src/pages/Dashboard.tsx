import { Suspense, lazy, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users, Activity, AlertCircle, Brain, Sparkles } from "lucide-react";
import { apiService } from "@/services/api";
import { StatCard } from "@/components/dashboard/StatCard";
const PatientGrowthChart = lazy(() => import("@/components/dashboard/PatientGrowthChart").then((mod) => ({ default: mod.PatientGrowthChart })));
const AIInsights = lazy(() => import("@/components/dashboard/AIInsights").then((mod) => ({ default: mod.AIInsights })));
const RecentActivity = lazy(() => import("@/components/dashboard/RecentActivity").then((mod) => ({ default: mod.RecentActivity })));
const TopPatients = lazy(() => import("@/components/dashboard/DashboardWidgets").then((mod) => ({ default: mod.TopPatients })));
const QuickActions = lazy(() => import("@/components/dashboard/DashboardWidgets").then((mod) => ({ default: mod.QuickActions })));
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/dashboard/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";

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
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [topPatients, setTopPatients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        
        let startDateStr: string | undefined;
        let endDateStr: string | undefined;

        if (timeRange === 'custom' && dateRange?.from) {
          startDateStr = dateRange.from.toISOString();
          if (dateRange.to) {
            endDateStr = dateRange.to.toISOString();
          }
        }

        const resp: any = await apiService.getDashboardSummary(timeRange, startDateStr, endDateStr);
        
        if (!mounted) return;
        
        const totalPatients = Number(resp?.total_patients ?? resp?.totalPatients ?? 0);
        const activeTreatments = Number(resp?.active_treatments ?? resp?.activeTreatments ?? 0);
        const highRiskPatients = Number(resp?.high_risk_patients ?? resp?.highRiskPatients ?? 0);
        const aiRecommendations = Number(resp?.ai_recommendations ?? resp?.aiRecommendations ?? 0);
        
        if (mounted) {
          setStats({
            totalPatients,
            activeTreatments,
            highRiskPatients,
            aiRecommendations,
          });
          setMonthlyStats(resp?.monthly_stats ?? []);
          setTopPatients(resp?.top_patients ?? []);
          setRecentActivities(resp?.recent_activities ?? []);
          setLoading(false);
        }
      } catch (e) {
        console.error('[Dashboard] API Error:', e);
        if (mounted) setLoading(false);
      }
    };
    
    // Debounce custom range loading to avoid too many requests while picking
    const timeoutId = setTimeout(() => {
        load();
    }, timeRange === 'custom' ? 500 : 0);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [timeRange, dateRange]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-foreground dark:text-slate-100 selection:bg-indigo-500/30 transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Light Mode Gradients */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-100/80 dark:bg-indigo-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-100/80 dark:bg-violet-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
        <div className="absolute top-[20%] right-[20%] h-[300px] w-[300px] rounded-full bg-sky-100/60 dark:bg-blue-500/5 blur-[80px] mix-blend-multiply dark:mix-blend-normal" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">
                <Sparkles className="h-3 w-3" />
                <span>AI-Powered Oncology Platform</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground dark:text-white">
                Dashboard Overview
              </h1>
              <p className="mt-2 text-muted-foreground dark:text-slate-400">
                Welcome back, {user?.name || "Doctor"}. Here's what's happening today.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {timeRange === 'custom' && (
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              )}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] border-border/50 dark:border-white/10 bg-background/50 dark:bg-white/5 text-foreground dark:text-slate-200 backdrop-blur-sm hover:bg-accent/50 dark:hover:bg-white/10 focus:ring-indigo-500/50">
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
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Patients"
              value={stats.totalPatients}
              trend={{ value: 12, isPositive: true }}
              icon={Users}
              color="primary"
              delay={0}
            />
            <StatCard
              title="Active Treatments"
              value={stats.activeTreatments}
              trend={{ value: 8, isPositive: true }}
              icon={Activity}
              color="success"
              delay={0.1}
            />
            <StatCard
              title="High Risk Patients"
              value={stats.highRiskPatients}
              trend={{ value: 5, isPositive: false }}
              icon={AlertCircle}
              color="warning"
              delay={0.2}
            />
            <StatCard
              title="AI Recommendations"
              value={stats.aiRecommendations}
              trend={{ value: 15, isPositive: true }}
              icon={Brain}
              color="info"
              delay={0.3}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section - Spans 2 columns */}
            <Suspense fallback={<div className="lg:col-span-2 rounded-3xl border border-border/50 bg-card/70 p-6 shadow-xl"><div className="h-72 animate-pulse rounded-3xl bg-muted" /></div>}>
              <PatientGrowthChart data={monthlyStats} />
            </Suspense>
            
            {/* AI Insights - Spans 1 column */}
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="rounded-3xl border border-border/50 bg-card/70 p-6 shadow-xl"><div className="h-72 animate-pulse rounded-3xl bg-muted" /></div>}>
                <AIInsights />
              </Suspense>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Suspense fallback={<div className="rounded-3xl border border-border/50 bg-card/70 p-6 shadow-xl"><div className="h-56 animate-pulse rounded-3xl bg-muted" /></div>}>
              <RecentActivity activities={recentActivities} />
            </Suspense>
            <Suspense fallback={<div className="rounded-3xl border border-border/50 bg-card/70 p-6 shadow-xl"><div className="h-56 animate-pulse rounded-3xl bg-muted" /></div>}>
              <TopPatients patients={topPatients} />
            </Suspense>
            <Suspense fallback={<div className="rounded-3xl border border-border/50 bg-card/70 p-6 shadow-xl"><div className="h-56 animate-pulse rounded-3xl bg-muted" /></div>}>
              <QuickActions />
            </Suspense>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}