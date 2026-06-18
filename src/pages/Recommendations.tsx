import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { AIRecommendationsPanel } from "@/components/AIRecommendationsPanel";
import {
  Brain,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target,
  ArrowRight,
  RefreshCw,
  Clock,
  Zap,
  Shield,
} from "lucide-react";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

type Recommendation = {
  id: number;
  patientName: string;
  cancerType?: string;
  cancer_type?: string;
  priority: string;
  title: string;
  description: string;
  confidence: number;
  impact?: string;
  category: string;
  benefits?: string[];
  risks?: string[];
  status: string;
};

type FilterKey = "all" | "pending" | "approved" | "high-priority";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "high-priority", label: "High Priority" },
];

const HIGH_CONFIDENCE_THRESHOLD = 80;

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "High":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-400/30";
    case "Medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/30";
    default:
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30";
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30";
    case "Implemented":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-400/30";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-400/30";
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return "text-emerald-500";
  if (confidence >= 60) return "text-amber-500";
  return "text-rose-500";
}

function RecommendationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-200/60 dark:border-white/5 last:border-0">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const messages: Record<FilterKey, { title: string; description: string }> = {
    all: {
      title: "No AI recommendations yet",
      description: "Recommendations appear when patient data is analyzed. Open a patient profile to generate insights.",
    },
    pending: {
      title: "Nothing pending review",
      description: "All recommendations have been reviewed. Check back after new patient analyses.",
    },
    approved: {
      title: "No approved recommendations",
      description: "Approved treatment plans will appear here once you sign off on AI suggestions.",
    },
    "high-priority": {
      title: "No high-priority items",
      description: "High-risk patients without urgent AI flags will show here when attention is needed.",
    },
  };

  const { title, description } = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
        <Brain className="h-7 w-7" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);

  const loadRecommendations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const resp: any = await apiService.listRecommendations();
      const list = resp?.recommendations || resp?.data?.recommendations || [];
      setRecommendations(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await loadRecommendations();
    };
    load();
    const id = window.setInterval(() => loadRecommendations(true), 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    const pending = recommendations.filter((r) => r.status === "Pending Review").length;
    const approved = recommendations.filter((r) => r.status === "Approved").length;
    const highConfidence = recommendations.filter((r) => (r.confidence || 0) >= HIGH_CONFIDENCE_THRESHOLD).length;
    return {
      total: recommendations.length,
      pending,
      approved,
      highConfidence,
    };
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    switch (activeFilter) {
      case "pending":
        return recommendations.filter((r) => r.status === "Pending Review");
      case "approved":
        return recommendations.filter((r) => r.status === "Approved");
      case "high-priority":
        return recommendations.filter((r) => r.priority === "High");
      default:
        return recommendations;
    }
  }, [recommendations, activeFilter]);

  const groupedRecommendations = useMemo(() => {
    const pending = filteredRecommendations.filter((r) => r.status === "Pending Review");
    const rest = filteredRecommendations.filter((r) => r.status !== "Pending Review");
    if (activeFilter !== "all" || pending.length === 0) {
      return [{ label: null as string | null, items: filteredRecommendations }];
    }
    return [
      { label: "Pending Review", items: pending },
      { label: "Reviewed", items: rest },
    ].filter((g) => g.items.length > 0);
  }, [filteredRecommendations, activeFilter]);

  const filterCounts = useMemo(
    () => ({
      all: recommendations.length,
      pending: recommendations.filter((r) => r.status === "Pending Review").length,
      approved: recommendations.filter((r) => r.status === "Approved").length,
      "high-priority": recommendations.filter((r) => r.priority === "High").length,
    }),
    [recommendations]
  );

  const openDetails = async (rec: Recommendation) => {
    try {
      setSelectedPatientId(rec.id);
      const patientResponse = await apiService.getPatient(rec.id);
      const patient = patientResponse?.patient || patientResponse?.data?.patient || patientResponse;
      setPatientData(patient);
      setShowDetailsDialog(true);
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setSelectedPatientId(rec.id);
      setShowDetailsDialog(true);
    }
  };

  const getCancerLabel = (rec: Recommendation) =>
    rec.cancerType || rec.cancer_type || rec.category || "Treatment";

  return (
    <div className="bg-background text-foreground transition-colors">
      <main className="flex-1">
        {/* Hero */}
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
                    AI Clinical Insights
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 via-emerald-600 to-violet-600 dark:from-foreground dark:via-emerald-500 dark:to-violet-500 bg-clip-text text-transparent">
                    AI treatment recommendations
                  </span>
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground max-w-2xl bg-white/70 dark:bg-transparent rounded-2xl px-3 py-2 shadow-sm backdrop-blur">
                  Review AI-generated treatment plans across your patient panel. Prioritize pending items,
                  validate confidence scores, and open full clinical analysis in one click.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full gap-1.5 text-xs self-start lg:self-auto"
                onClick={() => loadRecommendations(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                Refresh
              </Button>
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
                {error}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
              ) : (
                <>
                  <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="warning" delay={0} />
                  <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="success" delay={0.05} />
                  <StatCard title="High Confidence" value={stats.highConfidence} icon={Target} color="info" delay={0.1} />
                  <StatCard title="Total Recommendations" value={stats.total} icon={Brain} color="primary" delay={0.15} />
                </>
              )}
            </div>

            {/* Pill filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full bg-white/70 border border-slate-200 shadow-sm p-1 dark:bg-slate-900/80 dark:border-slate-700/70">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                      activeFilter === filter.key
                        ? "bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 shadow-[0_0_18px_rgba(52,211,153,0.25)] dark:text-emerald-50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter.label}
                    {!loading && (
                      <span className="ml-1.5 text-[10px] opacity-70">({filterCounts[filter.key]})</span>
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {loading ? "Loading…" : `${filteredRecommendations.length} shown`}
              </span>
            </div>

            {/* Recommendation list */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl"
            >
              {loading ? (
                <div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <RecommendationRowSkeleton key={i} />
                  ))}
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <EmptyState filter={activeFilter} />
              ) : (
                groupedRecommendations.map((group) => (
                  <div key={group.label ?? "all"}>
                    {group.label && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/5">
                        <Zap className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-slate-200 dark:border-white/10">
                          {group.items.length}
                        </Badge>
                      </div>
                    )}
                    {group.items.map((rec, index) => (
                      <motion.button
                        key={rec.id}
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => openDetails(rec)}
                        className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3.5 border-b border-slate-200/60 dark:border-white/5 last:border-0 text-left hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06] transition-colors group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-violet-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {rec.patientName?.charAt(0) || "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                              {rec.patientName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {getCancerLabel(rec)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            {rec.title}
                          </p>
                        </div>

                        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-14">
                          <span className={cn("text-sm font-bold tabular-nums", getConfidenceColor(rec.confidence))}>
                            {rec.confidence}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">confidence</span>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn("hidden md:inline-flex shrink-0 text-[10px] font-semibold", getPriorityStyles(rec.priority))}
                        >
                          {rec.priority}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={cn("shrink-0 text-[10px] font-semibold", getStatusStyles(rec.status))}
                        >
                          {rec.status === "Pending Review" ? "Pending" : rec.status}
                        </Badge>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 group-hover:border-emerald-400/40 group-hover:bg-emerald-500/10 transition-colors">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ))
              )}
            </motion.div>

            {/* Quick legend */}
            {!loading && filteredRecommendations.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  High confidence ≥ {HIGH_CONFIDENCE_THRESHOLD}%
                </span>
                <span>Click any row to open full AI analysis</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Treatment Recommendations
            </DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <AIRecommendationsPanel
              patientId={selectedPatientId}
              patientData={patientData}
              onClose={() => {
                setShowDetailsDialog(false);
                setSelectedPatientId(null);
                setPatientData(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
