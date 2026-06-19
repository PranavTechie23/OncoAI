import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientCard } from "@/components/PatientCard";
import { AddPatientDialog } from "@/components/AddPatientDialog";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";

type Patient = {
  id: string | number;
  name: string;
  age?: number;
  gender?: string;
  cancerType?: string;
  cancerSubtype?: string;
  riskScore: number;
  riskLevel?: string;
  diagnosisDate?: string;
  stage?: string;
  lastVisit?: string;
  status?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
};

type RiskBand = "low" | "medium" | "high";
type ViewMode = "table" | "grid";
type SortKey = "name" | "risk" | "age" | "diagnosis";

function getRiskBand(score: number): RiskBand {
  if (score <= 50) return "low";
  if (score <= 75) return "medium";
  return "high";
}

function getRiskLabel(band: RiskBand): string {
  return band === "high" ? "High" : band === "medium" ? "Medium" : "Low";
}

function getRiskBadgeClass(band: RiskBand): string {
  switch (band) {
    case "high":
      return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300";
    default:
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
}

function getRiskBarClass(band: RiskBand): string {
  switch (band) {
    case "high":
      return "bg-rose-500";
    case "medium":
      return "bg-amber-400";
    default:
      return "bg-emerald-500";
  }
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizePatient(p: Record<string, unknown>): Patient {
  return {
    id: p.id as string | number,
    name: String(p.name ?? "Unknown"),
    age: p.age != null ? Number(p.age) : undefined,
    gender: (p.gender as string) || undefined,
    cancerType: (p.cancer_type as string) || (p.cancerType as string) || undefined,
    cancerSubtype: (p.cancer_subtype as string) || (p.cancerSubtype as string) || undefined,
    riskScore: Number(p.risk_score ?? p.riskScore ?? 0),
    riskLevel: (p.risk_level as string) || (p.riskLevel as string) || undefined,
    diagnosisDate: (p.diagnosis_date as string) || (p.diagnosisDate as string) || undefined,
    stage: (p.stage as string) || undefined,
    lastVisit: (p.last_visit as string) || (p.lastVisit as string) || undefined,
    status: (p.status as string) || undefined,
    avatarUrl: (p.avatar_url as string) || (p.avatarUrl as string) || undefined,
    email: (p.email as string) || undefined,
    phone: (p.phone as string) || undefined,
  };
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "default" | "high" | "medium" | "low";
}) {
  const toneClass =
    tone === "high"
      ? "border-rose-200/60 bg-rose-50/80 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      : tone === "medium"
        ? "border-amber-200/60 bg-amber-50/80 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        : tone === "low"
          ? "border-emerald-200/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-border bg-card text-foreground";

  return (
    <div className={cn("rounded-2xl border px-4 py-3 shadow-sm", toneClass)}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

const PAGE_SIZE = 12;

export default function Patients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevel, setRiskLevel] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [cancerTypeFilter, setCancerTypeFilter] = useState("All Types");
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(0);

  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await apiService.getPatients();
      const list = resp?.patients || resp?.data?.patients || [];
      setPatientsData((list || []).map(normalizePatient));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load patients");
      setPatientsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const cancerTypes = useMemo(() => {
    const set = new Set<string>();
    patientsData.forEach((p) => {
      if (p.cancerType) set.add(p.cancerType);
    });
    return ["All Types", ...Array.from(set).sort()];
  }, [patientsData]);

  const stats = useMemo(() => {
    const high = patientsData.filter((p) => getRiskBand(p.riskScore) === "high").length;
    const medium = patientsData.filter((p) => getRiskBand(p.riskScore) === "medium").length;
    const low = patientsData.filter((p) => getRiskBand(p.riskScore) === "low").length;
    return { total: patientsData.length, high, medium, low };
  }, [patientsData]);

  const filteredPatients = useMemo(() => {
    const filtered = patientsData.filter((patient) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        patient.name.toLowerCase().includes(q) ||
        (patient.cancerType || "").toLowerCase().includes(q) ||
        (patient.email || "").toLowerCase().includes(q);

      const band = getRiskBand(patient.riskScore);
      const matchesRisk =
        riskLevel === "All" ||
        (riskLevel === "Low" && band === "low") ||
        (riskLevel === "Medium" && band === "medium") ||
        (riskLevel === "High" && band === "high");

      const matchesType =
        cancerTypeFilter === "All Types" ||
        (patient.cancerType || "").toLowerCase() === cancerTypeFilter.toLowerCase();

      return matchesSearch && matchesRisk && matchesType;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "risk") cmp = a.riskScore - b.riskScore;
      else if (sortKey === "age") cmp = (a.age ?? 0) - (b.age ?? 0);
      else if (sortKey === "diagnosis") {
        const da = a.diagnosisDate ? new Date(a.diagnosisDate).getTime() : 0;
        const db = b.diagnosisDate ? new Date(b.diagnosisDate).getTime() : 0;
        cmp = da - db;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [patientsData, searchQuery, riskLevel, cancerTypeFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const paginatedPatients = filteredPatients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [page, totalPages]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  };

  return (
    <div className="relative min-h-full text-foreground selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/70 blur-[100px] mix-blend-multiply dark:bg-emerald-500/10 dark:mix-blend-normal" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-100/70 blur-[100px] mix-blend-multiply dark:bg-violet-500/10 dark:mix-blend-normal" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1">
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-50">
                Patient Registry
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">All Patients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse, search, and manage your full patient roster with clinical details.
            </p>
          </div>
          <AddPatientDialog />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Total patients" value={stats.total} />
          <StatPill label="High risk" value={stats.high} tone="high" />
          <StatPill label="Medium risk" value={stats.medium} tone="medium" />
          <StatPill label="Low risk" value={stats.low} tone="low" />
        </div>

        {/* Filters toolbar */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-xl dark:border-white/5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by name, cancer type, or email…"
                className="h-10 rounded-xl border-border bg-muted/40 pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
                {(["All", "Low", "Medium", "High"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setRiskLevel(label);
                      setPage(0);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      riskLevel === label
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Select
                value={cancerTypeFilter}
                onValueChange={(v) => {
                  setCancerTypeFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-[160px] rounded-xl border-border bg-muted/40 text-xs">
                  <SelectValue placeholder="Cancer type" />
                </SelectTrigger>
                <SelectContent>
                  {cancerTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}
              >
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-border bg-muted/40 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Risk score</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="diagnosis">Diagnosis date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => setSortAsc((v) => !v)}
                title={sortAsc ? "Ascending" : "Descending"}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>

              <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "table"
                      ? "bg-background text-emerald-700 shadow-sm dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "grid"
                      ? "bg-background text-emerald-700 shadow-sm dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-xl"
                onClick={fetchPatients}
                disabled={loading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {loading
                ? "Loading patients…"
                : `${filteredPatients.length} patient${filteredPatients.length !== 1 ? "s" : ""} found`}
            </span>
            {!loading && filteredPatients.length > PAGE_SIZE && (
              <span>
                Page {page + 1} of {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchPatients} className="rounded-full">
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl dark:border-white/5">
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card py-16 shadow-xl dark:border-white/5">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No patients found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or add a new patient.
              </p>
            </div>
            <AddPatientDialog />
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl dark:border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Patient
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Age / Gender</TableHead>
                  <TableHead>Cancer</TableHead>
                  <TableHead className="hidden lg:table-cell">Stage</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("risk")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Risk
                    </button>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <button
                      type="button"
                      onClick={() => toggleSort("diagnosis")}
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                    >
                      Diagnosed
                    </button>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.map((patient) => {
                  const band = getRiskBand(patient.riskScore);
                  return (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {patient.avatarUrl ? (
                            <img
                              src={patient.avatarUrl}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium">{patient.name}</div>
                            {patient.email && (
                              <div className="truncate text-xs text-muted-foreground">{patient.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {patient.age != null ? `${patient.age} yrs` : "—"}
                        {patient.gender ? ` · ${patient.gender}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{patient.cancerType || "—"}</div>
                          {patient.cancerSubtype && (
                            <div className="truncate text-xs text-muted-foreground">{patient.cancerSubtype}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{patient.stage || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {patient.status ? (
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {patient.status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[100px] flex-col gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn("w-fit text-[10px] font-semibold", getRiskBadgeClass(band))}
                          >
                            {getRiskLabel(band)} · {Math.round(patient.riskScore)}%
                          </Badge>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", getRiskBarClass(band))}
                              style={{ width: `${Math.max(patient.riskScore, 4)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {formatDate(patient.diagnosisDate)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedPatients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                id={Number(patient.id)}
                name={patient.name}
                age={patient.age ?? 0}
                cancerType={patient.cancerType || "—"}
                cancerSubtype={patient.cancerSubtype}
                riskScore={Math.round(patient.riskScore)}
                avatarUrl={patient.avatarUrl}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredPatients.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredPatients.length)} of{" "}
              {filteredPatients.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
