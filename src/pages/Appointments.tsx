import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Video,
  LayoutList,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const doctors = [
  { id: 1, name: "Dr. Sarah Chen", specialty: "Oncology" },
  { id: 2, name: "Dr. Michael Rodriguez", specialty: "Oncology" },
  { id: 3, name: "Dr. Emily Watson", specialty: "Radiation Oncology" },
];

type ViewMode = "today" | "upcoming" | "all";
type DisplayMode = "list" | "day";

type Appointment = {
  id: number;
  patientName: string;
  patientId?: number;
  patientAvatar: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: string;
  notes: string;
  location: string;
  duration: string;
};

function normalizeAppointment(a: any): Appointment {
  const dt = a.appointment_date || a.date;
  const dateObj = dt ? new Date(dt) : null;
  const dateStr = dateObj ? dateObj.toISOString().split("T")[0] : "";
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const name = a.patient_name || a.patientName || "Patient";
  return {
    id: a.id,
    patientName: name,
    patientId: a.patient_id || a.patientId,
    patientAvatar: name
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .toUpperCase(),
    date: dateStr,
    time: timeStr,
    type: a.appointment_type || a.type || "Consultation",
    doctor: "Assigned Doctor",
    status: (a.status || "Scheduled")
      .replace("scheduled", "Scheduled")
      .replace("completed", "Completed")
      .replace("cancelled", "Cancelled"),
    notes: a.notes || "",
    location: "Clinic",
    duration: "30 min",
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function isThisWeek(date: string) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const d = new Date(`${date}T12:00:00`);
  return d >= start && d <= end;
}

function getDateGroup(date: string): "today" | "tomorrow" | "later" | "past" {
  const today = todayStr();
  const tomorrow = tomorrowStr();
  if (date === today) return "today";
  if (date === tomorrow) return "tomorrow";
  if (date < today) return "past";
  return "later";
}

function formatGroupLabel(key: string) {
  switch (key) {
    case "today":
      return "Today";
    case "tomorrow":
      return "Tomorrow";
    case "later":
      return "Later";
    case "past":
      return "Past";
    default:
      return key;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Scheduled":
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
          Scheduled
        </Badge>
      );
    case "Completed":
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-violet-500/30 text-violet-700 dark:text-violet-300">
          Completed
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-rose-500/30 text-rose-700 dark:text-rose-300">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0">
          {status}
        </Badge>
      );
  }
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    Treatment: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    "Follow-up": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    Consultation: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 capitalize", colors[type] || colors.Consultation)}>
      {type}
    </Badge>
  );
}

function EmptyState({ title, description, onSchedule }: { title: string; description: string; onSchedule?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 px-6 py-14 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
        <CalendarDays className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="max-w-sm text-center text-xs text-muted-foreground">{description}</p>
      {onSchedule && (
        <Button size="sm" className="mt-2 rounded-full gap-1.5" onClick={onSchedule}>
          <Plus className="h-3.5 w-3.5" />
          Schedule appointment
        </Button>
      )}
    </div>
  );
}

function AppointmentRow({
  apt,
  showDate,
  onEdit,
  onJoin,
  onDelete,
}: {
  apt: Appointment;
  showDate?: boolean;
  onEdit: (apt: Appointment) => void;
  onJoin: (apt: Appointment) => void;
  onDelete: (apt: Appointment) => void;
}) {
  return (
    <div className="group flex items-center gap-3 border-b border-slate-100/80 px-4 py-2.5 last:border-0 transition-colors hover:bg-emerald-500/[0.04] dark:border-white/5 dark:hover:bg-white/[0.03]">
      <div className="w-[4.5rem] shrink-0">
        <p className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{apt.time || "—"}</p>
        {showDate && apt.date && (
          <p className="text-[10px] text-muted-foreground">
            {new Date(`${apt.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-violet-500/10 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
        {apt.patientAvatar.slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{apt.patientName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {getTypeBadge(apt.type)}
          <span className="text-[10px] text-muted-foreground">{apt.duration}</span>
        </div>
      </div>

      <div className="hidden sm:block shrink-0">{getStatusBadge(apt.status)}</div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-80 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
          onClick={() => onEdit(apt)}
          title="Edit"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {apt.status === "Scheduled" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400"
            onClick={() => onJoin(apt)}
            title="Join"
          >
            <Video className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
          onClick={() => onDelete(apt)}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [apptType, setApptType] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    const today = todayStr();
    return {
      today: appointments.filter((a) => a.date === today).length,
      thisWeek: appointments.filter((a) => isThisWeek(a.date)).length,
      scheduled: appointments.filter((a) => a.status === "Scheduled").length,
      completed: appointments.filter((a) => a.status === "Completed").length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const today = todayStr();
    return appointments
      .filter((apt) => {
        const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "All" || apt.status === filterStatus;
        if (!matchesSearch || !matchesStatus) return false;

        if (viewMode === "today") return apt.date === today;
        if (viewMode === "upcoming") return apt.date >= today && apt.status === "Scheduled";
        return true;
      })
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`;
        const db = `${b.date}T${b.time}`;
        return da.localeCompare(db);
      });
  }, [appointments, searchQuery, filterStatus, viewMode]);

  const groupedAppointments = useMemo(() => {
    const order = ["today", "tomorrow", "later", "past"] as const;
    const groups: Record<string, Appointment[]> = { today: [], tomorrow: [], later: [], past: [] };

    filteredAppointments.forEach((apt) => {
      groups[getDateGroup(apt.date)].push(apt);
    });

    return order
      .map((key) => ({ key, label: formatGroupLabel(key), items: groups[key] }))
      .filter((g) => g.items.length > 0);
  }, [filteredAppointments]);

  const dayViewAppointments = useMemo(() => {
    const target = viewMode === "today" ? todayStr() : todayStr();
    return filteredAppointments.filter((a) => a.date === target);
  }, [filteredAppointments, viewMode]);

  useEffect(() => {
    let mounted = true;
    const pollMs = 10000;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp: any = await apiService.getAppointments();
        const list = resp?.appointments || resp?.data?.appointments || [];
        if (!mounted) return;
        setAppointments((list as any[]).map(normalizeAppointment));
      } catch (e: any) {
        if (mounted) setError(e?.message || "Unable to load appointments");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, pollMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const reloadAppointments = async () => {
    try {
      setLoading(true);
      const resp: any = await apiService.getAppointments();
      const list = resp?.appointments || resp?.data?.appointments || [];
      setAppointments((list as any[]).map(normalizeAppointment));
    } catch (e: any) {
      setError(e?.message || "Unable to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDate(apt.date);
    setTime(apt.time);
    setApptType(apt.type || "");

    let notesText = apt.notes || "";
    let extractedLocation = "";
    if (notesText.includes("Location:")) {
      const parts = notesText.split("Location:");
      notesText = parts[0].trim();
      extractedLocation = parts[1]?.trim() || "";
    }
    setNotes(notesText);
    setLocation(extractedLocation || "");
    setEditDialogOpen(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment || !date || !time) {
      toast({
        title: "Missing information",
        description: "Please fill in date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const isoDateTime = new Date(`${date}T${time}:00`).toISOString();
      const payload: any = {
        appointment_date: isoDateTime,
        appointment_type: apptType.toLowerCase() || "consultation",
        status: selectedAppointment.status.toLowerCase(),
        notes: `${notes || ""}\nLocation: ${location}`.trim(),
      };

      await apiService.updateAppointment(selectedAppointment.id, payload);

      toast({
        title: "Appointment updated",
        description: "The appointment has been updated successfully.",
      });

      setEditDialogOpen(false);
      setSelectedAppointment(null);
      reloadAppointments();
    } catch (error: any) {
      toast({
        title: "Failed to update appointment",
        description: error?.message || "Please check your backend connection.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setDeleting(true);
      await apiService.deleteAppointment(selectedAppointment.id);

      toast({
        title: "Appointment deleted",
        description: "The appointment has been deleted successfully.",
      });

      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
      reloadAppointments();
    } catch (error: any) {
      toast({
        title: "Failed to delete appointment",
        description: error?.message || "Please check your backend connection.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleJoinAppointment = (apt: Appointment) => {
    const videoLink = `https://meet.google.com/onco-${apt.id}-${apt.patientId}`;
    window.open(videoLink, "_blank");
    toast({
      title: "Joining video call",
      description: "Opening video call in a new window.",
    });
  };

  const handleCreateAppointment = async () => {
    if (!patientName || !doctorName || !date || !time) {
      toast({
        title: "Missing information",
        description: "Please fill in patient, doctor, date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const isoDateTime = new Date(`${date}T${time}:00`).toISOString();

      const payload = {
        patient_id: 1,
        appointment_date: isoDateTime,
        appointment_type: apptType || "consultation",
        status: "scheduled",
        notes: `${notes || ""}\nPatient: ${patientName}\nDoctor: ${doctorName}\nLocation: ${location}`.trim(),
      };

      await apiService.createAppointment(payload);

      toast({
        title: "Appointment scheduled",
        description: "The appointment has been created successfully.",
      });

      setDialogOpen(false);
      setPatientName("");
      setDoctorName("");
      setDate("");
      setTime("");
      setApptType("");
      setLocation("");
      setNotes("");
      reloadAppointments();
    } catch (error: any) {
      toast({
        title: "Failed to schedule appointment",
        description: error?.message || "Please check your backend connection.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const viewPills: { value: ViewMode; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="bg-background text-foreground transition-colors">
      <main className="flex-1">
        {/* Hero — matches Patients / Reports */}
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
                    Appointments schedule
                  </span>
                </h1>
                <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground max-w-2xl">
                  A compact view of today&apos;s clinic — scan times, patients, and status at a glance.
                </p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-9 rounded-full gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-violet-600 hover:from-emerald-500 hover:to-violet-500 shadow-lg shadow-emerald-500/20">
                    <Plus className="h-3.5 w-3.5" />
                    Schedule appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>Create a new appointment for a patient</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Patient</Label>
                        <Input
                          placeholder="Patient name"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Doctor</Label>
                        <Select value={doctorName} onValueChange={setDoctorName}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.name}>
                                {doctor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Date</Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Time</Label>
                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Appointment Type</Label>
                      <Select value={apptType} onValueChange={setApptType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Treatment">Treatment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Location</Label>
                      <Input
                        placeholder="Room number or location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Notes</Label>
                      <Textarea
                        placeholder="Additional notes or instructions"
                        className="min-h-20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCreateAppointment} disabled={submitting}>
                      {submitting ? "Scheduling..." : "Schedule Appointment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="relative py-8 md:py-10 bg-gradient-to-b from-background via-background to-muted/30 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/20">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.12),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.15),transparent_60%)]" />
          </div>

          <div className="relative z-10 container space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : (
                <>
                  <StatCard title="Today" value={stats.today} icon={CalendarIcon} color="success" delay={0} />
                  <StatCard title="This Week" value={stats.thisWeek} icon={CalendarDays} color="info" delay={0.05} />
                  <StatCard title="Scheduled" value={stats.scheduled} icon={Clock} color="primary" delay={0.1} />
                  <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="warning" delay={0.15} />
                </>
              )}
            </div>

            {/* Toolbar: filters + search + display toggle */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex rounded-full bg-white/70 border border-slate-200 shadow-sm p-1 dark:bg-slate-900/80 dark:border-slate-700/70">
                {viewPills.map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setViewMode(pill.value)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                      viewMode === pill.value
                        ? "bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 shadow-[0_0_18px_rgba(52,211,153,0.25)] dark:text-emerald-50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px] lg:w-56">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 rounded-full pl-9 text-xs border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-950/80"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-[130px] rounded-full text-xs border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-950/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All status</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <div className="inline-flex rounded-full border border-slate-200 bg-white/70 p-0.5 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("list")}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      displayMode === "list"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="List view"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("day")}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      displayMode === "day"
                        ? "bg-violet-500/20 text-violet-700 dark:text-violet-300"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Day view"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : displayMode === "day" ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {dayViewAppointments.length} appointment{dayViewAppointments.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {dayViewAppointments.length === 0 ? (
                  <EmptyState
                    title="No appointments today"
                    description="Your schedule is clear for this day. Schedule a new visit or switch to Upcoming / All."
                    onSchedule={() => setDialogOpen(true)}
                  />
                ) : (
                  dayViewAppointments.map((apt) => (
                    <AppointmentRow
                      key={apt.id}
                      apt={apt}
                      onEdit={handleEditClick}
                      onJoin={handleJoinAppointment}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </div>
            ) : groupedAppointments.length === 0 ? (
              <EmptyState
                title={
                  viewMode === "today"
                    ? "No appointments today"
                    : viewMode === "upcoming"
                      ? "No upcoming appointments"
                      : "No appointments found"
                }
                description={
                  searchQuery || filterStatus !== "All"
                    ? "Try adjusting your search or status filter."
                    : "Schedule a new appointment to get started."
                }
                onSchedule={() => setDialogOpen(true)}
              />
            ) : (
              <div className="space-y-5">
                {groupedAppointments.map((group) => (
                  <div key={group.key}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {group.label}
                      </h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        {group.items.length}
                      </Badge>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
                      {group.items.map((apt) => (
                        <AppointmentRow
                          key={apt.id}
                          apt={apt}
                          showDate={group.key !== "today"}
                          onEdit={handleEditClick}
                          onJoin={handleJoinAppointment}
                          onDelete={handleDeleteClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Appointment Type</Label>
              <Select value={apptType} onValueChange={setApptType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Location</Label>
              <Input
                placeholder="Room number or location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Notes</Label>
              <Textarea
                placeholder="Additional notes or instructions"
                className="min-h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleUpdateAppointment} disabled={updating}>
                {updating ? "Updating..." : "Update Appointment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the appointment for{" "}
              {selectedAppointment?.patientName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
