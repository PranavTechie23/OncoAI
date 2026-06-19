import { motion } from "framer-motion";
import { Users, Target, Calendar, Brain, Activity, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopPatient {
  id: number;
  name: string;
  riskScore?: number;
  risk_score?: number;
  risk_level?: string;
  status?: string;
  cancer_type?: string;
  stage?: string;
  avatar_url?: string;
  avatarUrl?: string;
}

type RiskTier = "High" | "Medium" | "Low";

function getRiskTier(score: number, riskLevel?: string): RiskTier {
  const level = (riskLevel || "").toLowerCase();
  if (level === "high" || score > 75) return "High";
  if (level === "medium" || score > 50) return "Medium";
  return "Low";
}

const riskTierStyles: Record<RiskTier, { badge: string; score: string; dot: string }> = {
  High: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20",
    score: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
    dot: "bg-rose-500",
  },
  Medium: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20",
    score: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    dot: "bg-amber-500",
  },
  Low: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    score: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
};

export const dashboardCardClass =
  "relative rounded-3xl border border-border dark:border-white/5 bg-card dark:bg-white/5 p-6 backdrop-blur-xl h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none min-h-[300px]";

export function TopPatients({ patients }: { patients: TopPatient[] }) {
  const list = patients.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={dashboardCardClass}
    >
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Priority Patients</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {list.length > 0 ? "Highest risk — review first" : "Sorted by risk score"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm" asChild>
          <Link to="/patients">View All</Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 mb-3">
              <UserPlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No patients yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add your first patient to start tracking risk.</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" asChild>
              <Link to="/patients">Add patient</Link>
            </Button>
          </div>
        ) : (
          list.map((patient, index) => {
            const score = Math.round(patient.riskScore ?? patient.risk_score ?? 0);
            const tier = getRiskTier(score, patient.risk_level);
            const styles = riskTierStyles[tier];
            const subtitle =
              patient.cancer_type && patient.stage
                ? `${patient.cancer_type} · Stage ${patient.stage}`
                : patient.status || patient.risk_level || "Under monitoring";

            return (
              <Link key={patient.id} to={`/patients/${patient.id}`} className="block">
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-3 transition-all",
                    "hover:bg-emerald-50/60 dark:hover:bg-emerald-500/5 hover:border-emerald-200/50 dark:hover:border-emerald-500/20 hover:shadow-sm"
                  )}
                >
                  <span className="hidden sm:flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {index + 1}
                  </span>
                  <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-white uppercase border border-white/10">
                    {patient.avatar_url || patient.avatarUrl ? (
                      <img
                        src={patient.avatar_url || patient.avatarUrl}
                        alt={patient.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      patient.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">
                        {patient.name}
                      </p>
                      <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1", styles.badge)}>
                        {tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate mt-0.5">{subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={cn("flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums", styles.score)}>
                      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot)} />
                      {score}%
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

export function QuickActions() {
  const actions = [
    { to: "/patients", icon: Users, label: "Patients", description: "Browse records", color: "blue" },
    { to: "/recommendations", icon: Brain, label: "AI Plans", description: "View insights", color: "violet" },
    { to: "/reports", icon: Activity, label: "Reports", description: "Lab & imaging", color: "emerald" },
    { to: "/appointments", icon: Calendar, label: "Schedule", description: "Book visits", color: "amber" },
  ] as const;

  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/15",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/15",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/15",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/15",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={dashboardCardClass}
    >
      <div className="mb-4 flex items-center gap-3 shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Common workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
        {actions.map(({ to, icon: Icon, label, description, color }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-3",
              "hover:bg-white dark:hover:bg-white/10 hover:border-emerald-300/40 dark:hover:border-emerald-500/30 transition-all hover:shadow-sm"
            )}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors", colorMap[color])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <span className="block text-sm font-semibold text-slate-700 dark:text-white leading-tight">{label}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">{description}</span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
