import { motion } from "framer-motion";
import { Sparkles, Brain, ArrowRight, Zap, Inbox, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Insight {
  id: string;
  type: "prediction" | "alert" | "recommendation";
  content: string;
  patient_name?: string;
  confidence?: number;
  patient_id?: number;
}

interface AIInsightsProps {
  insights?: Insight[];
  loading?: boolean;
}

const typeMeta = {
  recommendation: {
    label: "Review plan",
    icon: Brain,
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  alert: {
    label: "Needs attention",
    icon: Zap,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  prediction: {
    label: "Prediction",
    icon: Sparkles,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
};

function parseInsight(insight: Insight) {
  if (insight.patient_name) {
    return { name: insight.patient_name, summary: insight.content };
  }
  const colonIdx = insight.content.indexOf(":");
  if (colonIdx > 0 && colonIdx < 40) {
    return {
      name: insight.content.slice(0, colonIdx).trim(),
      summary: insight.content.slice(colonIdx + 1).trim(),
    };
  }
  return { name: null, summary: insight.content };
}

export function AIInsights({ insights = [], loading }: AIInsightsProps) {
  return (
    <div className="flex h-full min-h-[380px] max-h-[420px] flex-col overflow-hidden rounded-3xl border border-border dark:border-white/10 bg-card dark:bg-slate-950/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none">
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Insights</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {insights.length > 0 ? `${insights.length} patients need your review` : "Treatment suggestions for your patients"}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))
        ) : insights.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 mb-3">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">All caught up</p>
            <p className="mt-1 max-w-[220px] text-xs text-slate-500 dark:text-slate-400">
              AI recommendations will appear here when patient data is analyzed.
            </p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const meta = typeMeta[insight.type];
            const Icon = meta.icon;
            const { name, summary } = parseInsight(insight);
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={cn(
                  "group rounded-xl border border-border dark:border-white/5 bg-muted/40 dark:bg-white/5 p-4 transition-colors",
                  insight.patient_id && "hover:border-emerald-300/50 dark:hover:border-emerald-500/30 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                    <Icon className={cn("h-4 w-4", meta.accent)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      {name ? (
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{name}</p>
                      ) : (
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", meta.accent)}>
                          {meta.label}
                        </span>
                      )}
                      {insight.patient_id && (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                      )}
                    </div>
                    {name && (
                      <span className={cn("mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wide", meta.accent)}>
                        {meta.label}
                      </span>
                    )}
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                      {summary}
                    </p>
                    {insight.confidence != null && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1 flex-1 max-w-[100px] rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500"
                            style={{ width: `${Math.min(100, insight.confidence)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );

            return insight.patient_id ? (
              <Link key={insight.id} to={`/patients/${insight.patient_id}`} className="block">
                {card}
              </Link>
            ) : (
              <div key={insight.id}>{card}</div>
            );
          })
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 w-full justify-between text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 shrink-0"
        asChild
      >
        <Link to="/recommendations">
          View all recommendations
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
