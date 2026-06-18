import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles,
  AlertCircle, 
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";

type Patient = {
  id: string | number;
  name: string;
  age?: number;
  cancerType?: string;
  cancerSubtype?: string;
  riskScore: number;
  diagnosisDate?: string;
  stage?: string;
  lastVisit?: string;
  status?: string;
  raw?: any;
};

type RiskBand = "low" | "medium" | "high";

function getRiskBand(score: number): RiskBand {
  if (score <= 50) return "low";
  if (score <= 75) return "medium";
  return "high";
}

function getStatusTone(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (!normalized) return "idle";
  if (normalized.includes("active")) return "active";
  if (normalized.includes("surveillance") || normalized.includes("follow")) {
    return "watch";
  }
  if (normalized.includes("completed") || normalized.includes("remission")) {
    return "stable";
  }
  return "idle";
}

// Map patient attributes into a polar / spatial coordinate
function computePosition(index: number, total: number, patient: Patient) {
  const risk = Math.min(Math.max(patient.riskScore || 0, 0), 100);
  const band = getRiskBand(risk);

  // Angle: group by cancer type / index to create constellation arcs
  const angle = (index / Math.max(total, 1)) * Math.PI * 1.8 - Math.PI * 0.9;

  // Radius: high risk pulled closer to center
  const baseRadius = 0.18; // 18% of field radius
  const radius =
    baseRadius +
    (1 - risk / 100) * 0.45 + // lower risk pushed out
    (band === "high" ? 0.02 : band === "medium" ? 0.06 : 0.1);

  const x = 50 + Math.cos(angle) * radius * 100;
  const y = 50 + Math.sin(angle) * radius * 70; // slightly squashed ellipse

  return { x, y };
}

function getNodeSize(patient: Patient) {
  const risk = Math.min(Math.max(patient.riskScore || 0, 0), 100);
  const band = getRiskBand(risk);
  const base = band === "high" ? 42 : band === "medium" ? 32 : 26;

  // Nudge size by recency (if available)
  const createdAt =
    patient.raw?.created_at ||
    patient.raw?.diagnosis_date ||
    patient.diagnosisDate;
  let recencyBoost = 0;
  if (createdAt) {
    const d = new Date(createdAt as string);
    const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(daysAgo)) {
      if (daysAgo < 7) recencyBoost = 8;
      else if (daysAgo < 30) recencyBoost = 4;
      else if (daysAgo < 90) recencyBoost = 2;
    }
  }

  return base + recencyBoost;
}

function getPulseProps(patient: Patient) {
  const risk = Math.min(Math.max(patient.riskScore || 0, 0), 100);
  const band = getRiskBand(risk);
  const statusTone = getStatusTone(patient.status);

  let duration = 2.4;
  let scale = 1.04;
  let opacity = 0.4;

  if (band === "high") {
    duration = 1.6;
    scale = 1.12;
    opacity = 0.75;
  } else if (band === "medium") {
    duration = 2.0;
    scale = 1.08;
    opacity = 0.55;
  }

  if (statusTone === "active") {
    duration *= 0.8;
    scale += 0.04;
  } else if (statusTone === "idle") {
    duration *= 1.1;
    opacity *= 0.9;
  }

  return { duration, scale, opacity };
}

function getBandColor(band: RiskBand) {
  switch (band) {
    case "low":
      return "from-emerald-400/40 via-emerald-300/20 to-transparent";
    case "medium":
      return "from-amber-400/60 via-amber-300/15 to-transparent";
    case "high":
      return "from-rose-500/80 via-rose-400/20 to-transparent";
    default:
      return "from-slate-400/40 via-slate-300/15 to-transparent";
  }
}

function getBandStroke(band: RiskBand) {
  switch (band) {
    case "low":
      return "#34d399";
    case "medium":
      return "#fbbf24";
    case "high":
      return "#fb7185";
    default:
      return "#64748b";
  }
}

function buildExplanation(patient: Patient): string {
  const pieces: string[] = [];
  const riskBand = getRiskBand(patient.riskScore);
  if (riskBand === "high") {
    pieces.push("Prioritized due to elevated composite risk.");
  } else if (riskBand === "medium") {
    pieces.push("Moderate risk profile under active AI surveillance.");
  } else {
    pieces.push("Low-risk trajectory with stable indicators.");
  }

  if (patient.cancerType) {
    pieces.push(`Cancer type: ${patient.cancerType}`);
  }
  if (patient.cancerSubtype) {
    pieces.push(`Subtype signal: ${patient.cancerSubtype}`);
  }
  if (patient.stage) {
    pieces.push(`Stage influence: ${patient.stage}`);
  }
  if (patient.status) {
    pieces.push(`Current treatment state: ${patient.status}`);
  }

  return pieces.join(" · ");
}

type PatientOrbProps = {
  patient: Patient;
  index: number;
  total: number;
  isFocused: boolean;
  isHovered: boolean;
  onHover: () => void;
  onBlur: () => void;
  onSelect: () => void;
};

function PatientOrb({
  patient,
  index,
  total,
  isFocused,
  isHovered,
  onHover,
  onBlur,
  onSelect,
}: PatientOrbProps) {
  const riskBand = getRiskBand(patient.riskScore);
  const { x, y } = computePosition(index, total, patient);
  const size = getNodeSize(patient);

  // Ultra-clear contrast colors
  const coreColor = riskBand === "high" ? "#ef4444" : riskBand === "medium" ? "#f59e0b" : "#10b981";
  
  // High-fidelity depth shadows to pop from background
  const boldShadow = riskBand === "high" 
    ? "shadow-[0_20px_50px_rgba(239,68,68,0.35)]" 
    : riskBand === "medium" 
    ? "shadow-[0_20px_50px_rgba(245,158,11,0.3)]" 
    : "shadow-[0_20px_50px_rgba(16,185,129,0.3)]";

  return (
    <motion.button
      type="button"
      layout
      onMouseEnter={onHover}
      onMouseLeave={onBlur}
      onClick={onSelect}
      className={`absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none z-[45]`}
      style={{ left: `${x}%`, top: `${y}%` }}
      whileHover={{ scale: 1.15, zIndex: 60 }}
      animate={{ 
        y: [0, -8, 0],
        transition: { duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <div className={`relative group transition-all duration-300 ${isFocused ? "scale-110" : ""}`}>
        {/* The "Real Ball" - High Fidelity Sphere (Opaque to avoid blending with BG) */}
        <div 
          className={`relative rounded-full border-2 border-white dark:border-white/40 flex items-center justify-center ${boldShadow} overflow-hidden bg-white/95 dark:bg-slate-900/95`}
          style={{ 
            width: size + 16, 
            height: size + 16,
            boxShadow: `inset 0 -8px 20px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.3)`
          }}
        >
          {/* Internal Shimmer Layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/10" />

          {/* Glowing Status Core - Sharper & Bolder */}
          <div 
            className="w-6 h-6 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.2)] flex items-center justify-center"
            style={{ backgroundColor: coreColor }}
          >
             <div className="w-2.5 h-2.5 rounded-full bg-white opacity-60 blur-[1px]" />
          </div>

          {/* SVG Data Elements - High Saturation */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-2.5 opacity-40">
             <motion.circle 
               cx="50" cy="50" r="42" 
               fill="none" 
               stroke={coreColor} 
               strokeWidth="1.5" 
               strokeDasharray="5 5"
               animate={{ rotate: 360 }}
               transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
             />
          </svg>

          {/* Glass Highlight */}
          <div className="absolute top-1 left-3 w-4 h-2 bg-white rounded-full blur-[2.5px] rotate-[-15deg]" />
        </div>

        {/* High-Contrast Label - Bold & Clear */}
        <div className={`absolute left-1/2 -bottom-4 -translate-x-1/2 translate-y-full px-5 py-2.5 rounded-2xl border-2 border-slate-900 bg-slate-950 text-white shadow-2xl transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] ${isHovered || isFocused ? "opacity-100 scale-100" : "opacity-0 scale-90 translate-y-[-10px]"}`}>
           <div className="flex flex-col items-center gap-1">
              <span className="text-[13px] font-black uppercase tracking-tighter text-white">{patient.name}</span>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-emerald-400 border border-emerald-400/30">
                   {patient.cancerType || "Oncology"}
                 </span>
                 <span className="text-[10px] font-black text-white/50">{Math.round(patient.riskScore)}% RISK</span>
              </div>
           </div>
           {/* Sharp pointer */}
           <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-l-2 border-t-2 border-slate-900 rotate-45" />
        </div>
      </div>
    </motion.button>
  );
}

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevel, setRiskLevel] = useState<"All" | "Low" | "Medium" | "High">(
    "All"
  );
  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [focusedId, setFocusedId] = useState<string | number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [cancerTypeFilter, setCancerTypeFilter] = useState<string>("All Types");

  const navigate = useNavigate();

  const filteredPatients = useMemo(() => {
    return patientsData.filter((patient) => {
      const matchesSearch = patient.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesRisk =
        riskLevel === "All"
          ? true
          : riskLevel === "Low"
          ? getRiskBand(patient.riskScore) === "low"
          : riskLevel === "Medium"
          ? getRiskBand(patient.riskScore) === "medium"
          : getRiskBand(patient.riskScore) === "high";

      const matchesType =
        cancerTypeFilter === "All Types" ||
        (patient.cancerType || "").toLowerCase() ===
          cancerTypeFilter.toLowerCase();

      return matchesSearch && matchesRisk && matchesType;
    });
  }, [patientsData, searchQuery, riskLevel, cancerTypeFilter]);

  // Derive simple global intensity signal
  const overallLoad = useMemo(() => {
    if (!patientsData.length) return "calm";
    const high = patientsData.filter(
      (p) => getRiskBand(p.riskScore) === "high"
    ).length;
    const ratio = high / patientsData.length;
    if (ratio > 0.4) return "critical";
    if (ratio > 0.2) return "elevated";
    return "calm";
  }, [patientsData]);

  const cancerTypes = useMemo(() => {
    const set = new Set<string>();
    patientsData.forEach((p) => {
      if (p.cancerType) set.add(p.cancerType);
    });
    return ["All Types", ...Array.from(set).sort()];
  }, [patientsData]);

  // Fetch patients once on mount and when manual refresh triggered
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = (await import("@/services/api")).apiService;
      const resp = await api.getPatients();
      const list = resp?.patients || resp?.data?.patients || [];
      const normalized: Patient[] = (list || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        cancerType: p.cancer_type || p.cancerType,
        cancerSubtype: p.cancer_subtype || p.cancerSubtype,
        riskScore: Number(p.risk_score ?? p.riskScore ?? 0),
        diagnosisDate: p.diagnosis_date || p.diagnosisDate,
        stage: p.stage,
        lastVisit: p.last_visit || p.lastVisit,
        status: p.status,
        raw: p,
      }));
      setPatientsData(normalized);
    } catch (err: any) {
      setError(err?.message || "Unable to load patients");
      setPatientsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchPatients();
    return () => {
      mounted = false;
    };
  }, []);

  const focusedPatient =
    filteredPatients.find((p) => p.id === focusedId) || filteredPatients[0];

  const hoveredPatient = filteredPatients.find((p) => p.id === hoveredId);

  const intensityGradient =
    overallLoad === "critical"
      ? "from-rose-100/40 via-background to-emerald-100/30 dark:from-rose-900/80 dark:via-slate-950 dark:to-emerald-900/40"
      : overallLoad === "elevated"
      ? "from-violet-100/40 via-background to-emerald-100/30 dark:from-violet-900/80 dark:via-slate-950 dark:to-emerald-900/40"
      : "from-background via-background to-muted/40 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/40";

  return (
    <div className="bg-background text-foreground transition-colors">
      <main className="flex-1">
        {/* Hero: Patient Intelligence Space */}
        <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-48 -left-32 h-96 w-96 bg-emerald-300/25 dark:bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-48 -right-16 h-[26rem] w-[26rem] bg-violet-300/25 dark:bg-violet-500/25 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(52,211,153,0.18),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(129,140,248,0.28),transparent_60%)] opacity-80" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
          </div>

          <div className="relative z-10 container py-10 md:py-14 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[11px] font-semibold tracking-wide text-emerald-800 dark:text-emerald-50 uppercase">
                Patient Intelligence Space
              </span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-emerald-600 to-violet-600 dark:from-foreground dark:via-emerald-500 dark:to-violet-500 bg-clip-text text-transparent">
                  An AI field monitoring patient lives in real time.
                </span>
              </h1>
              <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground max-w-2xl bg-white/70 dark:bg-transparent rounded-2xl px-3 py-2 shadow-sm backdrop-blur">
                Each point in this field represents a living clinical entity. Risk, treatment
                status, and AI confidence shape their size, glow, and motion—so you see where
                attention is needed{" "}
                <span className="font-medium text-emerald-600 dark:text-emerald-200">
                  before
                </span>{" "}
                it becomes urgent.
              </p>
            </div>
          </div>
        </section>

        {/* Spatial intelligence field */}
        <section
          className={`relative py-10 md:py-14 bg-gradient-to-b ${intensityGradient}`}
        >
          <div className="absolute inset-0 pointer-events-none">
            {/* Neural grid background - Enhanced for Light Mode depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.15),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.25),transparent_60%)] opacity-40 dark:opacity-30" />
            <div className="absolute inset-6 rounded-[2.5rem] border border-slate-200/60 dark:border-border/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl shadow-[0_40px_100px_rgba(15,23,42,0.08)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">
               {/* Ambient floating data points - more visible in light mode */}
               {[...Array(20)].map((_, i) => (
                 <motion.div
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/10"
                    initial={{ 
                      x: Math.random() * 100 + "%", 
                      y: Math.random() * 100 + "%",
                      opacity: Math.random() * 0.6
                    }}
                    animate={{ 
                      y: ["-5%", "105%"],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 10 + Math.random() * 20, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: Math.random() * 10
                    }}
                 />
               ))}
            </div>
          </div>

          <div className="relative z-10 container">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
              {/* Left: Field + filters */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Filters morph the space instead of hiding rows */}
                <div className="flex flex-wrap items-center gap-3 justify-between mb-1">
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" />
                      AI lens:
                    </span>
                    <div className="inline-flex rounded-full bg-white/70 border border-slate-200 shadow-sm backdrop-blur-md p-1 dark:bg-slate-900/80 dark:border-slate-700/70">
                      {["All", "Low", "Medium", "High"].map((label) => {
                        const active = riskLevel === (label as any);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              setRiskLevel(label as "All" | "Low" | "Medium" | "High")
                            }
                            className={[
                              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                              active
                                ? "bg-emerald-500/20 text-emerald-800 border border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)] dark:text-emerald-50"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300/80 dark:hover:text-slate-100 dark:hover:bg-slate-800/70",
                            ].join(" ")}
                          >
                            {label === "All" ? "All risk bands" : `${label} risk`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 ml-auto text-xs">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by patient name"
                      className="h-8 w-40 md:w-48 rounded-full border border-slate-200 bg-white/80 px-3 text-[11px] text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 dark:border-border/70 dark:bg-slate-950/80 dark:text-foreground dark:placeholder:text-muted-foreground"
                    />
                    <select
                      value={cancerTypeFilter}
                      onChange={(e) => setCancerTypeFilter(e.target.value)}
                      className="h-8 rounded-full border border-slate-200 bg-white/80 px-3 pr-6 text-[11px] text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:border-border/70 dark:bg-slate-950/80 dark:text-foreground"
                    >
                      {cancerTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-full border-slate-200 bg-white/90 text-[11px] text-slate-800 hover:bg-white hover:border-emerald-400/60 gap-1 shadow-sm dark:border-border dark:bg-slate-900/80 dark:text-foreground"
                      onClick={fetchPatients}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">
                        {loading ? "Syncing…" : "Refresh"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Intelligence field */}
                <LayoutGroup>
                  <div className="relative mt-2 h-[520px] md:h-[580px] rounded-[2rem] border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
                    {/* High-Fidelity Background Layer - Deep Blur (Bokeh Effect) */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-20 blur-[8px] scale-110"
                      style={{ backgroundImage: 'url("/assets/oncoai_field_bg.png")' }}
                    />
                    
                    {/* Frosted Fog Layer to separate FG from BG */}
                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[6px]" />

                    {/* Multi-layer clinical grid */}
                    <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    </div>

                    {/* SVG Connection Layer - Real-time Data Threads */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <defs>
                         <linearGradient id="conn-grad" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                            <stop offset="50%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                         </linearGradient>
                      </defs>
                      {filteredPatients.map((p, i) => {
                        const { x, y } = computePosition(i, filteredPatients.length, p);
                        return (
                          <g key={`line-${p.id}`}>
                            <line 
                              x1="50%" y1="50%" 
                              x2={`${x}%`} y2={`${y}%`} 
                              stroke="currentColor" 
                              className="text-emerald-500/20 dark:text-emerald-400/10"
                              strokeWidth="1.5"
                            />
                            {/* Animated data pulse */}
                            <motion.circle
                              r="2"
                              fill="#10b981"
                              animate={{ 
                                cx: ["50%", `${x}%`],
                                cy: ["50%", `${y}%`],
                                opacity: [0, 0.8, 0]
                              }}
                              transition={{ 
                                duration: 3 + Math.random() * 4,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 5
                              }}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Center radar nucleus - Enhanced for premium light mode crystal look */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative h-48 w-48 md:h-64 md:w-64">
                        {/* Outer rotating rings */}
                        {[...Array(3)].map((_, i) => (
                           <motion.div
                              key={i}
                              className="absolute inset-0 rounded-full border border-emerald-500/30 dark:border-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                              style={{ 
                                rotateX: i * 60,
                                rotateY: i * 30,
                              }}
                              animate={{ rotateZ: 360 }}
                              transition={{ 
                                duration: 20 + i * 10,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                           />
                        ))}
                        
                        {/* Shimmering glass core */}
                        <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-white/80 via-white/40 to-emerald-50/20 dark:from-slate-800/40 dark:to-slate-900/10 border border-white/60 dark:border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(16,185,129,0.15)] dark:shadow-[0_0_80px_rgba(16,185,129,0.2)]" />
                        
                        {/* Pulsing inner star */}
                        <motion.div
                          className="absolute inset-[35%] rounded-full bg-emerald-500 dark:bg-emerald-400"
                          style={{ filter: "blur(25px)" }}
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="absolute inset-[42%] rounded-full bg-white dark:bg-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.5)] dark:shadow-[0_0_30px_#10b981]" />
                      </div>
                    </div>

                    {/* Patient entities */}
                    <div className="absolute inset-0 px-6 py-6 md:px-10 md:py-10">
                      <AnimatePresence>
                        {filteredPatients.map((patient, index) => (
                          <PatientOrb
                            key={patient.id}
                            patient={patient}
                            index={index}
                            total={filteredPatients.length}
                            isFocused={focusedPatient?.id === patient.id}
                            isHovered={hoveredId === patient.id}
                            onHover={() => setHoveredId(patient.id)}
                            onBlur={() =>
                              setHoveredId((prev) =>
                                prev === patient.id ? null : prev
                              )
                            }
                            onSelect={() => setFocusedId(patient.id)}
                          />
                        ))}
                      </AnimatePresence>

                      {filteredPatients.length === 0 && !loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 text-slate-300/80">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/80 border border-slate-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/70">
                            <Activity className="h-6 w-6 text-slate-400" />
                    </div>
                          <p className="text-sm font-medium">
                            No entities match this AI lens.
                          </p>
                          <p className="text-xs text-slate-500 max-w-xs dark:text-slate-400">
                            Adjust the risk band or search query to bring
                            patients back into the field.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Live stream status bar */}
                    <div className="absolute inset-x-0 bottom-0 px-6 pb-4 pt-2 flex items-center justify-between text-[11px] text-muted-foreground bg-gradient-to-t from-background/90 via-background/70 to-transparent dark:from-slate-950/90 dark:via-slate-950/70">
                      <div className="inline-flex items-center gap-1.5">
                        <div
                          className={[
                            "h-1.5 w-1.5 rounded-full",
                            overallLoad === "critical"
                              ? "bg-rose-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]"
                              : overallLoad === "elevated"
                              ? "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.8)]"
                              : "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]",
                          ].join(" ")}
                        />
                        <span className="uppercase tracking-[0.15em]">
                          {overallLoad === "critical"
                            ? "Network load: critical"
                            : overallLoad === "elevated"
                            ? "Network load: elevated"
                            : "Network load: calm"}
                        </span>
                </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">
                          {filteredPatients.length} entities in current view
                        </span>
                      </div>
                    </div>
                  </div>
                </LayoutGroup>
              </div>

              {/* Right: Intelligence panel */}
              <div className="w-full lg:w-[360px] xl:w-[400px] flex flex-col">
                <div className="relative flex-1">
                  <div className="h-full flex flex-col rounded-3xl border border-border/80 bg-card/95 dark:bg-slate-950/85 backdrop-blur-2xl shadow-[0_30px_80px_rgba(15,23,42,0.12)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.9)] p-6 md:p-7">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-50">
                            AI Intelligence
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                          Why this patient matters
                        </h2>
                      </div>
                      {focusedPatient && (
                        <Badge
                          variant="outline"
                          className="border-border/80 bg-muted/70 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5"
                        >
                          {getRiskBand(focusedPatient.riskScore) === "high"
                            ? "High Risk"
                            : getRiskBand(focusedPatient.riskScore) === "medium"
                            ? "Moderate"
                            : "Low Risk"}
                        </Badge>
                      )}
                    </div>

                    {focusedPatient ? (
                      <div className="flex-1 flex flex-col space-y-6">
                        <div className="space-y-2">
                          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                            {focusedPatient.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {[
                              focusedPatient.cancerType,
                              focusedPatient.cancerSubtype,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm/relaxed text-slate-700 dark:text-slate-300">
                            {buildExplanation(focusedPatient)}
                          </p>
                          
                          {/* Visual Risk Gauge */}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${
                                 getRiskBand(focusedPatient.riskScore) === "high" ? "bg-rose-500" : 
                                 getRiskBand(focusedPatient.riskScore) === "medium" ? "bg-amber-400" : "bg-emerald-400"
                               }`}
                               style={{ width: `${Math.max(focusedPatient.riskScore, 10)}%` }}
                             />
                          </div>
                          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            <span>Clinical Stability</span>
                            <span>Composite Risk: {Math.round(focusedPatient.riskScore)}/100</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 py-2">
                          <div className="rounded-2xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">
                              Temporal Analysis
                            </p>
                            <p className="text-sm font-medium text-foreground/90">
                              {focusedPatient.diagnosisDate
                                ? "Trajectory tracked since " +
                                  new Date(
                                    focusedPatient.diagnosisDate
                                  ).toLocaleDateString()
                                : "Oncology timeline inferred from record"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">
                              Intervention Status
                            </p>
                            <p className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-emerald-500" />
                              {getStatusTone(focusedPatient.status) === "active"
                                ? "Active intervention, under tight watch"
                                : getStatusTone(focusedPatient.status) ===
                                  "watch"
                                ? "Structured surveillance, adaptive thresholds"
                                : "Stable configuration, low variance trend"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-3 mt-auto">
                          <Button
                            size="lg"
                            className="w-full justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
                            onClick={() =>
                              navigate(`/patients/${focusedPatient.id}`)
                            }
                          >
                            Open Full Patient Workspace
                          </Button>
                          <p className="text-xs text-center text-muted-foreground px-4">
                            Access detailed timelines, treatment protocols, and genetic profiling in the deep view.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground space-y-2">
                        <p>
                          Hover any entity in the field to reveal why the AI has
                          positioned it there. Click to lock focus and step into
                          a richer clinical explanation.
                        </p>
                        <p className="text-muted-foreground">
                          The system continuously recomputes risk, confidence,
                          and treatment state to keep this view aligned with
                          what matters now.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hover explanation overlays just the intelligence card */}
                  <AnimatePresence>
                    {hoveredPatient && (
                      <motion.div
                        key={hoveredPatient.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 rounded-3xl border border-border/80 bg-card/95 dark:bg-slate-950/95 backdrop-blur-2xl p-6 md:p-7 flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.95)] z-20"
                      >
                         <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1">
                                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                                <span className="text-xs font-semibold tracking-wide text-violet-700 dark:text-violet-50">
                                  Hover Insight
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-border/80 bg-muted/70 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 shrink-0"
                            >
                              {getRiskBand(hoveredPatient.riskScore) === "high"
                                ? "High Risk"
                                : getRiskBand(hoveredPatient.riskScore) === "medium"
                                ? "Moderate"
                                : "Low Risk"}
                            </Badge>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
                            {/* Massive Risk Focal Point */}
                            <motion.div 
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="relative"
                            >
                              <div className="text-7xl md:text-8xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                                {Math.round(hoveredPatient.riskScore)}%
                              </div>
                              <div className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground -mt-2">
                                AI Risk Index
                              </div>
                              <motion.div 
                                className={`absolute -inset-4 rounded-full blur-2xl opacity-20 dark:opacity-40 -z-10 ${
                                  getRiskBand(hoveredPatient.riskScore) === 'high' ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            </motion.div>

                            <div className="space-y-4 w-full">
                              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                                {hoveredPatient.name}
                              </h3>
                              
                              <div className="flex flex-wrap justify-center gap-2">
                                 <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-3 py-1 text-[10px] uppercase font-bold">
                                   {hoveredPatient.cancerType || 'Oncology'}
                                 </Badge>
                                 <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-[10px] uppercase font-bold">
                                   Signal: {getStatusTone(hoveredPatient.status).toUpperCase()}
                                 </Badge>
                              </div>

                              <div className="pt-6 space-y-4 border-t border-slate-100 dark:border-white/5 w-full">
                                 <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Top AI Concerns</p>
                                 <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                       <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                       <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Potential Pathological Shift</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                       <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Metric Stability Confidence: 94%</span>
                                    </div>
                                 </div>
                              </div>
                            </div>

                            <div className="mt-auto pt-8 flex flex-col items-center gap-4">
                              <div className="px-6 py-2 rounded-full bg-violet-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-violet-500/20 animate-bounce">
                                Unlock Forensic Evidence
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium max-w-[180px]">
                                Click to access temporal mapping & spatial pathology analysis
                              </p>
                            </div>
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
