import { motion } from "framer-motion";
import { Clock, Inbox, Calendar, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { Link } from "react-router-dom";
import { dashboardCardClass } from "@/components/dashboard/DashboardWidgets";
import { Button } from "@/components/ui/button";

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  status: "success" | "warning" | "info";
  type?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

function getActivityLink(activity: ActivityItem): string | null {
  if (activity.type === "appointment") return "/appointments";
  if (activity.type === "report") return "/reports";
  return null;
}

function formatRelativeTime(timeStr: string): string {
  try {
    const date = parseISO(timeStr);
    if (!isValid(date)) return timeStr;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return timeStr;
  }
}

function simplifyMessage(message: string, type?: string): string {
  if (type === "appointment") {
    const match = message.match(/for (.+)$/i);
    if (match) {
      const status = message.includes("completed") ? "Completed" : message.includes("scheduled") ? "Scheduled" : "Updated";
      return `${status} visit — ${match[1]}`;
    }
  }
  if (type === "report") {
    const match = message.match(/for (.+)$/i);
    if (match) return `Report ready — ${match[1]}`;
  }
  return message;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const list = activities.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(dashboardCardClass, "min-h-[260px]")}
    >
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {list.length > 0 ? "Latest updates from your practice" : "Appointments and reports"}
            </p>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mb-3">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nothing recent</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Activity from appointments and reports will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {list.map((activity) => {
            const link = getActivityLink(activity);
            const relativeTime = formatRelativeTime(activity.time);
            const isAppointment = activity.type === "appointment";
            const Icon = isAppointment ? Calendar : FileText;
            const message = simplifyMessage(activity.message, activity.type);

            const inner = (
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border border-border dark:border-white/5 bg-muted/40 dark:bg-white/5 p-4 transition-all",
                  link && "group-hover:border-emerald-200/60 dark:group-hover:border-emerald-500/20 group-hover:bg-emerald-50/40 dark:group-hover:bg-emerald-500/5",
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      isAppointment ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{relativeTime}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug flex-1">
                  {message}
                </p>
              </div>
            );

            return link ? (
              <Link key={activity.id} to={link} className="block group">
                {inner}
              </Link>
            ) : (
              <div key={activity.id}>{inner}</div>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <div className="mt-4 flex justify-end shrink-0">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400" asChild>
            <Link to="/appointments">
              View all activity
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
