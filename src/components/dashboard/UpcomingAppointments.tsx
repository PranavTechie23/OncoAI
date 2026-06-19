import { motion } from "framer-motion";
import { Calendar, Clock, Video, ArrowRight, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, parseISO, isValid, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { dashboardCardClass } from "@/components/dashboard/DashboardWidgets";

export interface UpcomingAppointment {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_date: string;
  appointment_type?: string;
  status?: string;
}

interface UpcomingAppointmentsProps {
  appointments: UpcomingAppointment[];
  loading?: boolean;
}

function formatAppointmentDate(dateStr: string): { label: string; time: string } {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return { label: dateStr, time: "" };
    let label = format(date, "MMM d");
    if (isToday(date)) label = "Today";
    else if (isTomorrow(date)) label = "Tomorrow";
    return { label, time: format(date, "h:mm a") };
  } catch {
    return { label: dateStr, time: "" };
  }
}

function formatTodayShort(): string {
  return format(new Date(), "EEEE, MMM d");
}

export function UpcomingAppointments({ appointments, loading }: UpcomingAppointmentsProps) {
  const list = appointments.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className={dashboardCardClass}
    >
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Today's Schedule</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {list.length > 0
                ? `${list.length} upcoming ${list.length === 1 ? "visit" : "visits"}`
                : formatTodayShort()}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm" asChild>
          <Link to="/appointments">View All</Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))
        ) : list.length === 0 ? (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="rounded-xl border border-dashed border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 px-4 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No visits scheduled</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Your calendar is open today. Schedule a follow-up or new consultation when you are ready.
                  </p>
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link to="/appointments">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Schedule visit
              </Link>
            </Button>
          </div>
        ) : (
          list.map((apt, idx) => {
            const { label, time } = formatAppointmentDate(apt.appointment_date);
            const isConsultation = (apt.appointment_type || "").toLowerCase().includes("consult");
            let badgeTop = label;
            let badgeBottom = time || "—";
            try {
              const date = parseISO(apt.appointment_date);
              if (isValid(date) && label !== "Today" && label !== "Tomorrow") {
                badgeTop = format(date, "MMM");
                badgeBottom = format(date, "d");
              }
            } catch {
              /* keep label fallback */
            }
            return (
              <Link key={apt.id} to={`/patients/${apt.patient_id}`} className="block">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                    idx === 0
                      ? "border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/5"
                      : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 hover:border-emerald-200/50 dark:hover:border-emerald-500/20",
                  )}
                >
                  {idx === 0 && (
                    <span className="absolute sr-only">Next visit</span>
                  )}
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1">
                    <span className="text-[10px] font-bold uppercase leading-none truncate max-w-full">{badgeTop}</span>
                    <span className="text-xs font-bold leading-none mt-0.5 tabular-nums">{badgeBottom}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span className="shrink-0 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          Next
                        </span>
                      )}
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {apt.patient_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{label}</span>
                      {time && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </span>
                        </>
                      )}
                      {apt.appointment_type && (
                        <>
                          <span>·</span>
                          <span className="capitalize truncate">{apt.appointment_type}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isConsultation ? "bg-violet-500/10 text-violet-500" : "bg-blue-500/10 text-blue-500"
                    )}
                  >
                    {isConsultation ? <Video className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>

      {list.length > 0 && (
        <Button variant="ghost" size="sm" className="mt-3 w-full justify-between text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 shrink-0" asChild>
          <Link to="/appointments">
            Open calendar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </motion.div>
  );
}
