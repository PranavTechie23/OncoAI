import { useParams, Link } from "react-router-dom";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  User,
  Dna,
  Pill,
  Stethoscope,
  Download,
  Edit,
  Brain,
  Camera,
  X,
  Maximize2,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
const AIRecommendationsPanel = lazy(() => import("@/components/AIRecommendationsPanel").then((mod) => ({ default: mod.AIRecommendationsPanel })));
const OutcomeTrackingTab = lazy(() => import("@/components/OutcomeTrackingTab").then((mod) => ({ default: mod.OutcomeTrackingTab })));
const PatientRiskTrendChart = lazy(() => import("@/components/PatientRiskTrendChart").then((mod) => ({ default: mod.default })));
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

type ClinicalData = {
  notes?: string;
  genomics?: {
    mutations?: string[];
    biomarkers?: { "PD-L1"?: number; TMB?: number; MSI_Status?: string };
  };
  histopathology?: {
    grade?: string;
    ki67?: number;
    tumor_size_cm?: number;
    lymph_nodes_involved?: number;
  };
  comorbidities?: string[];
  comorbidity_score?: number;
  medications?: Array<{ name: string; dosage?: string; frequency?: string; status?: string }>;
  treatment_history?: Array<{ date?: string; name?: string; type?: string; status?: string; notes?: string }>;
};

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function getRiskScore(patient: Record<string, unknown> | null): number {
  return Number(patient?.risk_score ?? patient?.riskScore ?? 0);
}

function getRiskLevel(score: number) {
  if (score <= 50)
    return {
      label: "Low",
      textClass: "text-emerald-700 dark:text-emerald-400",
      bgLightClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      barClass: "bg-emerald-500",
    };
  if (score <= 75)
    return {
      label: "Medium",
      textClass: "text-amber-700 dark:text-amber-400",
      bgLightClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      barClass: "bg-amber-400",
    };
  return {
    label: "High",
    textClass: "text-rose-700 dark:text-rose-400",
    bgLightClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
    barClass: "bg-rose-500",
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not recorded";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLabel(value?: string | null): string {
  if (!value) return "Not recorded";
  return value
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  const empty = !value || value === "Not recorded" || value === "—";
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3 dark:border-white/5", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("mt-0.5 text-sm font-medium", empty && "text-muted-foreground italic")}>
          {value || "Not recorded"}
        </p>
      </div>
    </div>
  );
}

function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const patientId = Number(id);

  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [patientData, setPatientData] = useState<Record<string, unknown> | null>(null);
  const [clinical, setClinical] = useState<ClinicalData>({});
  const [protocol, setProtocol] = useState<Record<string, unknown>>({});
  const [riskHistory, setRiskHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    cancer_type: "",
    cancer_subtype: "",
    stage: "",
    status: "",
    diagnosis_date: "",
  });

  const riskScore = getRiskScore(patientData);
  const riskLevel = getRiskLevel(riskScore);

  const cancerType = String(patientData?.cancer_type || patientData?.cancerType || "");
  const cancerSubtype = String(patientData?.cancer_subtype || patientData?.cancerSubtype || "");
  const diagnosisDate = String(patientData?.diagnosis_date || patientData?.diagnosisDate || "");
  const patientStatus = String(patientData?.status || "Active");

  const treatmentCycles = Number(protocol.cycles ?? 0);
  const treatmentRegimen = String(protocol.regimen || protocol.name || "");

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    const upcoming = appointments
      .filter((a) => {
        const d = new Date(String(a.appointment_date || a.date || ""));
        return !Number.isNaN(d.getTime()) && d.getTime() >= now;
      })
      .sort(
        (a, b) =>
          new Date(String(a.appointment_date || a.date)).getTime() -
          new Date(String(b.appointment_date || b.date)).getTime(),
      );
    return upcoming[0] || null;
  }, [appointments]);

  const medications = useMemo(() => {
    if (clinical.medications?.length) return clinical.medications;
    if (treatmentRegimen)
      return [{ name: treatmentRegimen, dosage: "Per protocol", frequency: "As scheduled", status: "Active" }];
    return [];
  }, [clinical.medications, treatmentRegimen]);

  const treatmentHistory = useMemo(() => {
    if (clinical.treatment_history?.length) {
      return clinical.treatment_history.map((t, idx) => ({
        id: idx,
        treatment: t.name || t.type || "Treatment session",
        date: t.date || diagnosisDate,
        status: t.status || "Completed",
        notes: t.notes || "",
      }));
    }
    if (treatmentRegimen) {
      return [
        {
          id: 0,
          treatment: treatmentRegimen,
          date: diagnosisDate,
          status: patientStatus,
          notes: treatmentCycles ? `${treatmentCycles} planned cycles` : "Active treatment protocol",
        },
      ];
    }
    return [];
  }, [clinical.treatment_history, treatmentRegimen, treatmentCycles, diagnosisDate, patientStatus]);

  const biomarkers = clinical.genomics?.biomarkers;
  const mutations = clinical.genomics?.mutations || [];
  const histo = clinical.histopathology;

  const hasClinicalData =
    Boolean(biomarkers) ||
    mutations.length > 0 ||
    Boolean(histo) ||
    (clinical.comorbidities?.length ?? 0) > 0 ||
    Boolean(clinical.notes);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const patient = await apiService.getPatient(patientId);
        const data = (patient?.patient || patient?.data || patient) as Record<string, unknown>;

        if (!data?.id) {
          setError("Patient not found");
          return;
        }

        setPatientData(data);

        const clinicalData = parseJsonField<ClinicalData>(data.clinical_data, {});
        const protocolData = parseJsonField<Record<string, unknown>>(data.treatment_protocol, {});
        setClinical(clinicalData);
        setProtocol(protocolData);

        const baseScore = Math.round(getRiskScore(data));
        const created = data.created_at ? new Date(String(data.created_at)) : null;
        const updated = data.updated_at ? new Date(String(data.updated_at)) : null;
        const history: Array<{ date: string; score: number }> = [];

        if (created) {
          history.push({
            date: `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`,
            score: baseScore,
          });
        }
        if (updated && created && updated.getTime() !== created.getTime()) {
          const updatedKey = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, "0")}`;
          const createdKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
          if (updatedKey !== createdKey) history.push({ date: updatedKey, score: baseScore });
        }
        if (history.length === 0) {
          const now = new Date();
          history.push({
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            score: baseScore,
          });
        }
        setRiskHistory(history.sort((a, b) => a.date.localeCompare(b.date)));

        setEditForm({
          name: String(data.name || ""),
          age: String(data.age || ""),
          gender: String(data.gender || ""),
          email: String(data.email || ""),
          phone: String(data.phone || ""),
          address: String(data.address || ""),
          cancer_type: cancerType,
          cancer_subtype: cancerSubtype,
          stage: String(data.stage || ""),
          status: patientStatus,
          diagnosis_date: diagnosisDate ? diagnosisDate.split("T")[0] : "",
        });

        try {
          const apptResp = await apiService.getAppointments();
          const allAppts = (apptResp?.appointments || apptResp?.data?.appointments || []) as Record<string, unknown>[];
          setAppointments(
            allAppts.filter((a) => Number(a.patient_id || a.patientId) === Number(data.id)),
          );
        } catch {
          setAppointments([]);
        }

        try {
          const reportResp = await apiService.getReports();
          const allReports = (reportResp?.reports || reportResp?.data?.reports || []) as Record<string, unknown>[];
          setReports(allReports.filter((r) => Number(r.patient_id) === Number(data.id)));
        } catch {
          setReports([]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load patient");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) load();
  }, [patientId]);

  const handleSavePatient = async () => {
    try {
      setSaving(true);
      const resp = await apiService.updatePatient(patientId, {
        ...editForm,
        age: parseInt(editForm.age) || 0,
      });
      const updated = (resp?.patient || resp?.data || resp) as Record<string, unknown>;
      if (updated) {
        setPatientData(updated);
        setShowEditDialog(false);
        toast.success("Patient updated");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update patient");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setSaving(true);
        const resp = await apiService.updatePatient(patientId, { avatar_url: reader.result as string });
        const updated = (resp?.patient || resp?.data || resp) as Record<string, unknown>;
        if (updated) {
          setPatientData(updated);
          toast.success("Photo updated");
        }
      } catch {
        toast.error("Failed to upload photo");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateReport = async () => {
    try {
      await apiService.generateReport(patientId);
      toast.success("Report generated");
      const reportResp = await apiService.getReports();
      const allReports = (reportResp?.reports || reportResp?.data?.reports || []) as Record<string, unknown>[];
      setReports(allReports.filter((r) => Number(r.patient_id) === patientId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate report");
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="flex gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">{error || "Patient not found"}</p>
        <Button asChild variant="outline">
          <Link to="/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  const displayName = formatLabel(String(patientData.name || "Patient"));
  const avatarUrl = String(patientData.avatar_url || patientData.avatarUrl || "");
  const daysSinceDiagnosis = daysSince(diagnosisDate);
  const lastVisitDate = String(
    patientData.last_visit || patientData.lastVisit || patientData.updated_at || "",
  );

  return (
    <div className="relative min-h-full text-foreground selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/70 blur-[100px] mix-blend-multiply dark:bg-emerald-500/10 dark:mix-blend-normal" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-100/70 blur-[100px] mix-blend-multiply dark:bg-violet-500/10 dark:mix-blend-normal" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1400px] p-6 lg:p-8">
        <Link
          to="/patients"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>

        {/* Header */}
        <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-xl dark:border-white/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div
                className="flex h-24 w-24 cursor-zoom-in items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg ring-2 ring-border"
                onClick={() => setIsImageEnlarged(true)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-1 -left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-card shadow-md hover:text-emerald-600"
                title="Upload photo"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={saving}
                />
              </label>
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card",
                  riskLevel.barClass,
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{displayName}</h1>
                <Badge className={cn(riskLevel.bgLightClass, riskLevel.textClass, riskLevel.borderClass)}>
                  {riskLevel.label} Risk
                </Badge>
                <Badge variant="outline">{formatLabel(patientStatus)}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                {patientData.age ?? "—"} years · {formatLabel(String(patientData.gender || ""))} ·{" "}
                {cancerType || "Cancer type not set"}
                {cancerSubtype ? ` (${cancerSubtype})` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Diagnosed {formatDate(diagnosisDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  Last updated {formatDate(lastVisitDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4" />
                  Stage {patientData.stage || "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setShowAIRecommendations(true)}
              >
                <Brain className="h-4 w-4" />
                AI Recommendations
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Risk Score",
              value: `${riskScore.toFixed(1)}%`,
              icon: TrendingUp,
              extra: <Progress value={riskScore} className="mt-3 h-2" />,
            },
            {
              label: "Treatment Cycles",
              value: treatmentCycles || treatmentHistory.length || "—",
              icon: Pill,
            },
            {
              label: "Days Since Diagnosis",
              value: daysSinceDiagnosis ?? "—",
              icon: Calendar,
            },
            {
              label: "Next Appointment",
              value: nextAppointment
                ? formatDate(String(nextAppointment.appointment_date || nextAppointment.date))
                : appointments.length
                  ? "None upcoming"
                  : "Not scheduled",
              icon: Clock,
            },
          ].map(({ label, value, icon: Icon, extra }) => (
            <Card key={label} className="rounded-2xl border-border p-5 shadow-sm dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              {extra}
            </Card>
          ))}
        </div>

        {/* Tabs — consolidated to 3 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className="rounded-xl px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="clinical" className="rounded-xl px-4">
              Clinical & Treatment
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-xl px-4">
              Appointments & Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Contact & Demographics
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow icon={Mail} label="Email" value={String(patientData.email || "")} />
                  <InfoRow icon={Phone} label="Phone" value={String(patientData.phone || "")} />
                  <InfoRow icon={MapPin} label="Address" value={String(patientData.address || "")} className="sm:col-span-2" />
                  <InfoRow icon={User} label="Age" value={patientData.age ? `${patientData.age} years` : ""} />
                  <InfoRow icon={User} label="Gender" value={formatLabel(String(patientData.gender || ""))} />
                  <InfoRow icon={Stethoscope} label="Cancer Type" value={cancerType} />
                  <InfoRow icon={Dna} label="Subtype" value={cancerSubtype} />
                  <InfoRow icon={Activity} label="Clinical Stage" value={String(patientData.stage || "")} />
                  <InfoRow icon={FileText} label="Patient ID" value={`ONC-${String(patientData.id).padStart(5, "0")}`} />
                </div>
                {!patientData.email && !patientData.phone && !patientData.address && (
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowEditDialog(true)}>
                      <Edit className="mr-2 h-3.5 w-3.5" />
                      Add contact details
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Risk Assessment
                </h3>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold tabular-nums">{riskScore.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{riskLevel.label} risk classification</p>
                  </div>
                  <Badge className={cn(riskLevel.bgLightClass, riskLevel.textClass)}>{riskLevel.label}</Badge>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", riskLevel.barClass)} style={{ width: `${riskScore}%` }} />
                </div>
                {riskHistory.length > 1 ? (
                  <div className="mt-6 h-48">
                    <Suspense fallback={<div className="h-full rounded-3xl bg-muted animate-pulse" />}>
                      <PatientRiskTrendChart riskHistory={riskHistory} />
                    </Suspense>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Risk trend will appear after multiple assessments over time.
                  </p>
                )}
              </Card>
            </div>

            {hasClinicalData ? (
              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Dna className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Clinical Summary
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {biomarkers?.["PD-L1"] != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">PD-L1 Expression</p>
                      <p className="mt-1 text-xl font-bold">{biomarkers["PD-L1"]}%</p>
                    </div>
                  )}
                  {biomarkers?.TMB != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">TMB Score</p>
                      <p className="mt-1 text-xl font-bold">{biomarkers.TMB}</p>
                    </div>
                  )}
                  {biomarkers?.MSI_Status && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">MSI Status</p>
                      <p className="mt-1 text-xl font-bold">{biomarkers.MSI_Status}</p>
                    </div>
                  )}
                  {clinical.comorbidity_score != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Comorbidity Score</p>
                      <p className="mt-1 text-xl font-bold">{clinical.comorbidity_score}</p>
                    </div>
                  )}
                </div>
                {mutations.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Mutations</p>
                    <div className="flex flex-wrap gap-2">
                      {mutations.map((m) => (
                        <Badge key={m} variant="outline">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {clinical.comorbidities && clinical.comorbidities.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Comorbidities</p>
                    <div className="flex flex-wrap gap-2">
                      {clinical.comorbidities.map((c) => (
                        <Badge key={c} variant="secondary">
                          {formatLabel(c)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {clinical.notes && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">Clinical Notes</p>
                    <p className="mt-1 text-sm">{clinical.notes}</p>
                  </div>
                )}
              </Card>
            ) : (
              <EmptyBlock
                title="No clinical data yet"
                description="Genomic and biomarker data will appear here once recorded. Use Edit to add contact details and notes."
                action={
                  <Button variant="outline" className="rounded-xl" onClick={() => setShowEditDialog(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Update patient record
                  </Button>
                }
              />
            )}
          </TabsContent>

          {/* Clinical & Treatment */}
          <TabsContent value="clinical" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Treatment Protocol
                </h3>
                {treatmentRegimen || treatmentCycles ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Regimen</p>
                      <p className="mt-1 font-semibold">{treatmentRegimen || "Not specified"}</p>
                    </div>
                    {treatmentCycles > 0 && (
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">Planned Cycles</p>
                        <p className="mt-1 text-2xl font-bold">{treatmentCycles}</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {treatmentHistory.map((t) => (
                        <div key={t.id} className="rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{t.treatment}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                            </div>
                            <Badge variant="outline">{t.status}</Badge>
                          </div>
                          {t.notes && <p className="mt-2 text-sm text-muted-foreground">{t.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyBlock
                    title="No treatment protocol"
                    description="Treatment regimen and cycle data has not been recorded for this patient."
                  />
                )}
              </Card>

              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Medications
                </h3>
                {medications.length > 0 ? (
                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {med.status && <Badge variant="outline">{med.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock title="No medications listed" description="Active medications will appear here when added to the clinical record." />
                )}
              </Card>
            </div>

            {histo && (
              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 text-lg font-semibold">Histopathology</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {histo.grade && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <p className="mt-1 font-bold">{histo.grade}</p>
                    </div>
                  )}
                  {histo.ki67 != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Ki-67</p>
                      <p className="mt-1 font-bold">{histo.ki67}%</p>
                    </div>
                  )}
                  {histo.tumor_size_cm != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Tumor Size</p>
                      <p className="mt-1 font-bold">{histo.tumor_size_cm} cm</p>
                    </div>
                  )}
                  {histo.lymph_nodes_involved != null && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">Lymph Nodes</p>
                      <p className="mt-1 font-bold">{histo.lymph_nodes_involved}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <OutcomeTrackingTab patientId={patientId} patientData={patientData} />
          </TabsContent>

          {/* Appointments & Reports */}
          <TabsContent value="records" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Appointments
                </h3>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments
                      .sort(
                        (a, b) =>
                          new Date(String(b.appointment_date || b.date)).getTime() -
                          new Date(String(a.appointment_date || a.date)).getTime(),
                      )
                      .map((appt, idx) => (
                        <div key={idx} className="rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {String(appt.appointment_type || appt.type || "Appointment")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(String(appt.appointment_date || appt.date))}
                              </p>
                              {appt.notes && (
                                <p className="mt-1 text-xs text-muted-foreground">{String(appt.notes)}</p>
                              )}
                            </div>
                            <Badge variant="outline">{String(appt.status || "Scheduled")}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <EmptyBlock
                    title="No appointments"
                    description="Scheduled visits for this patient will appear here."
                  />
                )}
              </Card>

              <Card className="rounded-3xl border-border p-6 shadow-xl dark:border-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Reports
                  </h3>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={handleGenerateReport}>
                    Generate
                  </Button>
                </div>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{String(report.report_type || "Clinical Report")}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(String(report.generated_at))}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock
                    title="No reports yet"
                    description="Generate a clinical report to document this patient's care."
                    action={
                      <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-500" onClick={handleGenerateReport}>
                        Generate report
                      </Button>
                    }
                  />
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Recommendations */}
      <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Treatment Recommendations
            </DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="p-8 text-center">Loading AI recommendations...</div>}>
            {Number.isFinite(patientId) && (
              <AIRecommendationsPanel
                patientId={patientId}
                patientData={patientData}
                onClose={() => setShowAIRecommendations(false)}
              />
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Remission">Remission</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancer_type">Cancer Type</Label>
              <Input id="cancer_type" value={editForm.cancer_type} onChange={(e) => setEditForm({ ...editForm, cancer_type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Input id="stage" value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis_date">Diagnosis Date</Label>
              <Input id="diagnosis_date" type="date" value={editForm.diagnosis_date} onChange={(e) => setEditForm({ ...editForm, diagnosis_date: e.target.value })} />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleSavePatient} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo lightbox */}
      <AnimatePresence>
        {isImageEnlarged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setIsImageEnlarged(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setIsImageEnlarged(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="max-h-[85vh] w-full object-contain" />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center">
                  <User className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
