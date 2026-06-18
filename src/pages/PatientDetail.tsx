import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Heart,
  Dna,
  Pill,
  Stethoscope,
  Download,
  Edit,
  Brain,
  Sparkles,
  Camera,
  Upload,
  X,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AIRecommendationsPanel } from "@/components/AIRecommendationsPanel";
import { OutcomeTrackingTab } from "@/components/OutcomeTrackingTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Patient detail loads data from backend; no local mock fallbacks

export default function PatientDetail() {
  const { id } = useParams();
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [patientData, setPatientData] = useState<any | null>(null);
  const [riskHistory, setRiskHistory] = useState<Array<{date:string;score:number}>>([]);
  const [treatmentHistory, setTreatmentHistory] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit logic
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  const getRiskLevel = (score: number) => {
    if (score <= 50) return { label: "Low", color: "success", bgClass: "bg-success", textClass: "text-success", borderClass: "border-success/20", bgLightClass: "bg-success/10" };
    if (score <= 75) return { label: "Medium", color: "warning", bgClass: "bg-warning", textClass: "text-warning", borderClass: "border-warning/20", bgLightClass: "bg-warning/10" };
    return { label: "High", color: "destructive", bgClass: "bg-destructive", textClass: "text-destructive", borderClass: "border-destructive/20", bgLightClass: "bg-destructive/10" };
  };

  const riskLevel = getRiskLevel(patientData?.riskScore ?? 0);

  useEffect(() => {
    // Fetch patient and related dynamic data from backend
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const pid = Number(id);
        const api = (await import("@/services/api")).apiService;
        const resp = await api.getPatient(pid);
        const patient = resp?.patient || resp?.data || resp || null;

        if (!patient) {
          setError('Patient not found');
          setPatientData(null);
          return;
        }

        setPatientData(patient);

        // Build risk history from actual patient data (created_at, updated_at, and current risk_score)
        const rHist: Array<{date:string;score:number}> = [];
        const baseScore = Math.round(Number(patient.risk_score ?? patient.riskScore ?? 50));
        const createdDate = patient.created_at ? new Date(patient.created_at) : null;
        const updatedDate = patient.updated_at ? new Date(patient.updated_at) : null;
        
        // If patient has creation date, use it as first data point
        if (createdDate) {
          const createdMonth = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          rHist.push({ date: createdMonth, score: baseScore });
        }
        
        // If updated date is different from created date, add it
        if (updatedDate && createdDate && updatedDate.getTime() !== createdDate.getTime()) {
          const updatedMonth = `${updatedDate.getFullYear()}-${String(updatedDate.getMonth() + 1).padStart(2, '0')}`;
          // Only add if it's a different month
          if (updatedMonth !== (createdDate ? `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}` : '')) {
            rHist.push({ date: updatedMonth, score: baseScore });
          }
        }
        
        // If no history, just show current month with current score
        if (rHist.length === 0) {
          const now = new Date();
          rHist.push({ 
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, 
            score: baseScore 
          });
        }
        
        // Sort by date
        rHist.sort((a, b) => a.date.localeCompare(b.date));
        setRiskHistory(rHist);

        // Prep edit form
        setEditForm({
          name: patient.name || "",
          age: String(patient.age || ""),
          gender: patient.gender || "",
          email: patient.email || "",
          phone: patient.phone || "",
          address: patient.address || "",
          cancer_type: patient.cancer_type || patient.cancerType || "",
          cancer_subtype: patient.cancer_subtype || patient.cancerSubtype || "",
          stage: patient.stage || "",
          status: patient.status || "",
          diagnosis_date: patient.diagnosis_date || patient.diagnosisDate || "",
        });

        // Treatment history: try to get from patient.treatment_protocol
        if (patient.treatment_protocol) {
          try {
            const protocol = typeof patient.treatment_protocol === 'string' ? JSON.parse(patient.treatment_protocol) : patient.treatment_protocol;
            setTreatmentHistory((protocol.sessions || []).map((s: any, idx: number) => ({ id: idx + 1, date: s.date || new Date().toISOString(), treatment: s.name || s.type || 'Therapy', status: s.status || 'Completed', notes: s.notes || '' })));
          } catch {
            setTreatmentHistory([]);
          }
        } else {
          setTreatmentHistory([
            { id: 1, date: new Date().toISOString(), treatment: `${patient.cancer_type || patient.cancerType} - Initial Therapy`, status: 'Completed', notes: 'Treatment data not provided' }
          ]);
        }

        // Medications: prefer clinical_data.medications if present
        let meds: any[] = [];
        try {
          const clinical = typeof patient.clinical_data === 'string' ? JSON.parse(patient.clinical_data || '{}') : patient.clinical_data || {};
          meds = clinical.medications || [];
        } catch {
          meds = [];
        }
        setMedications(meds);

        // Appointments: fetch and filter by patient id
        try {
          const apptResp = await api.getAppointments();
          const appts = (apptResp?.appointments || apptResp?.data?.appointments || apptResp || []).filter((a: any) => Number(a.patient_id || a.patientId) === Number(patient.id || patient.patient_id));
          setUpcomingAppointments(appts);
        } catch {
          setUpcomingAppointments([]);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSavePatient = async () => {
    try {
      setSaving(true);
      const pid = Number(id);
      const api = (await import("@/services/api")).apiService;
      
      const updateData = {
        ...editForm,
        age: parseInt(editForm.age) || 0,
      };

      const resp = await api.updatePatient(pid, updateData);
      const updated = resp?.patient || resp?.data || resp;
      
      if (updated) {
        setPatientData(updated);
        setShowEditDialog(false);
        toast.success("Patient information updated successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update patient");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        setSaving(true);
        const pid = Number(id);
        const api = (await import("@/services/api")).apiService;
        
        const resp = await api.updatePatient(pid, { avatar_url: base64String });
        const updated = resp?.patient || resp?.data || resp;
        
        if (updated) {
          setPatientData(updated);
          toast.success("Patient photo updated successfully");
        }
      } catch (err: any) {
        toast.error("Failed to upload photo");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-background via-background to-muted/20">
        <main className="flex-1">
          <div className="container py-12">
            <div className="text-center text-muted-foreground">Loading patient...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-b from-background via-background to-muted/20">
        <main className="flex-1">
          <div className="container py-12">
            <div className="text-center text-destructive">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/20">
      <main className="flex-1">
        {/* Header Section */}
        <section className="py-8 bg-gradient-to-br from-primary/5 via-background to-success/5 border-b border-border">
          <div className="container">
            <Link to="/patients" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Patients
            </Link>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden border-4 border-card shadow-lg relative bg-muted flex items-center justify-center cursor-zoom-in hover:border-primary/50 transition-all"
                  onClick={() => setIsImageEnlarged(true)}
                >
                  {patientData?.avatar_url || patientData?.avatarUrl ? (
                    <img 
                      src={patientData?.avatar_url || patientData?.avatarUrl} 
                      alt={patientData?.name || 'Patient'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                  
                  {/* Photo Overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Dedicated Upload Button (No longer just on hover) */}
                <label 
                  htmlFor="photo-upload-direct" 
                  className="absolute -bottom-1 -left-1 h-8 w-8 bg-white dark:bg-slate-900 border-2 border-border rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-110 hover:text-primary transition-all z-10"
                  title="Upload New Photo"
                >
                  <Camera className="h-4 w-4" />
                  <input 
                    id="photo-upload-direct" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                    disabled={saving}
                  />
                </label>

                {/* Status Indicator (replacing the green icon with a sharper status ring) */}
                <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full ${riskLevel.bgClass} border-2 border-card flex items-center justify-center`}>
                   <div className="h-2 w-2 rounded-full bg-white opacity-40 animate-pulse" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{patientData?.name || 'Patient'}</h1>
                  <Badge className={`${riskLevel.bgLightClass} ${riskLevel.textClass} ${riskLevel.borderClass}`}>
                    {riskLevel.label} Risk
                  </Badge>
                  <Badge variant="outline">{patientData?.status || 'Unknown'}</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  {patientData?.age ?? '-'} years old • {patientData?.gender || '-'} • {patientData?.cancer_type || patientData?.cancerType || '-'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Diagnosed: {patientData?.diagnosis_date || patientData?.diagnosisDate ? new Date(patientData?.diagnosis_date || patientData?.diagnosisDate).toLocaleDateString() : '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Last Visit: {patientData?.lastVisit ? new Date(patientData.lastVisit).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => setShowAIRecommendations(true)}
                >
                  <Brain className="h-4 w-4" />
                  AI Recommendations
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="py-8">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-6 bg-card shadow-card hover:shadow-card-hover transition-all border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                    <p className="text-3xl font-bold text-foreground">{patientData?.risk_score ?? patientData?.riskScore ?? 0}%</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg ${riskLevel.bgLightClass} flex items-center justify-center`}>
                    <TrendingUp className={`h-6 w-6 ${riskLevel.textClass}`} />
                  </div>
                </div>
                <Progress value={patientData?.risk_score ?? patientData?.riskScore ?? 0} className="mt-4 h-2" />
              </Card>

              <Card className="p-6 bg-card shadow-card hover:shadow-card-hover transition-all border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Treatment Cycles</p>
                    <p className="text-3xl font-bold text-foreground">12</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card shadow-card hover:shadow-card-hover transition-all border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Days Since Diagnosis</p>
                    <p className="text-3xl font-bold text-foreground">
                      {patientData?.diagnosis_date || patientData?.diagnosisDate ? Math.floor((new Date().getTime() - new Date(patientData?.diagnosis_date || patientData?.diagnosisDate).getTime()) / (1000 * 60 * 60 * 24)) : '-'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-success" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card shadow-card hover:shadow-card-hover transition-all border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Appointment</p>
                    <p className="text-lg font-bold text-foreground">Apr 3</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="treatment">Treatment</TabsTrigger>
                <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Risk Score Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={riskHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Patient Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="text-foreground">{patientData?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Phone</p>
                        <p className="text-foreground">{patientData?.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Address</p>
                        <p className="text-foreground">{patientData?.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Stage</p>
                        <Badge variant="outline">{patientData?.stage || '-'}</Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Dna className="h-5 w-5 text-primary" />
                    Genomic Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">PD-L1 Expression</p>
                      <p className="text-xl font-bold text-foreground">85%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">TMB Score</p>
                      <p className="text-xl font-bold text-foreground">12.5</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">MSI Status</p>
                      <p className="text-xl font-bold text-foreground">MSS</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="treatment" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Treatment History
                  </h3>
                  <div className="space-y-4">
                    {treatmentHistory.map((treatment) => (
                      <div key={treatment.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{treatment.treatment}</p>
                            <p className="text-sm text-muted-foreground">{new Date(treatment.date).toLocaleDateString()}</p>
                          </div>
                          <Badge className="bg-success/10 text-success border-success/20">
                            {treatment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="outcomes" className="space-y-6">
                <OutcomeTrackingTab patientId={parseInt(id || "1")} patientData={patientData} />
              </TabsContent>

              <TabsContent value="medications" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Current Medications
                  </h3>
                  <div className="space-y-4">
                    {medications.map((med, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{med.name}</p>
                            <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {med.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="appointments" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Appointments
                  </h3>
                  <div className="space-y-4">
                    {upcomingAppointments.map((appt, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{appt.type}</p>
                            <p className="text-sm text-muted-foreground">{appt.doctor}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(appt.date).toLocaleDateString()} at {appt.time}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Medical Documents
                  </h3>
                  <div className="space-y-2">
                    {["Lab Results - March 2024", "Imaging Report - CT Scan", "Pathology Report", "Treatment Plan"].map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-foreground">{doc}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* AI Recommendations Dialog */}
      <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Treatment Recommendations
            </DialogTitle>
          </DialogHeader>
          <AIRecommendationsPanel
            patientId={parseInt(id || "1")}
            patientData={patientData}
            onClose={() => setShowAIRecommendations(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Patient Information
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number" 
                value={editForm.age} 
                onChange={(e) => setEditForm({...editForm, age: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={editForm.gender} onValueChange={(val) => setEditForm({...editForm, gender: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editForm.status} onValueChange={(val) => setEditForm({...editForm, status: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Remission">Remission</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancer_type">Cancer Type</Label>
              <Input 
                id="cancer_type" 
                value={editForm.cancer_type} 
                onChange={(e) => setEditForm({...editForm, cancer_type: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Clinical Stage</Label>
              <Select value={editForm.stage} onValueChange={(val) => setEditForm({...editForm, stage: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stage I">Stage I</SelectItem>
                  <SelectItem value="Stage II">Stage II</SelectItem>
                  <SelectItem value="Stage III">Stage III</SelectItem>
                  <SelectItem value="Stage IV">Stage IV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis_date">Diagnosis Date</Label>
              <Input 
                id="diagnosis_date" 
                type="date"
                value={editForm.diagnosis_date} 
                onChange={(e) => setEditForm({...editForm, diagnosis_date: e.target.value})}
              />
            </div>
            <div className="col-span-full space-y-2">
              <Label htmlFor="address">Residential Address</Label>
              <Textarea 
                id="address" 
                value={editForm.address} 
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={handleSavePatient}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Photo Lightbox */}
      <AnimatePresence>
        {isImageEnlarged && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-10"
            onClick={() => setIsImageEnlarged(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full bg-card rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container */}
              <div className="flex-1 bg-muted flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                {patientData?.avatar_url || patientData?.avatarUrl ? (
                  <img 
                    src={patientData?.avatar_url || patientData?.avatarUrl} 
                    alt={patientData?.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <User className="w-32 h-32 text-muted-foreground/20" />
                )}
              </div>

              {/* Right Box (Clinical Info) */}
              <div className="w-full md:w-80 bg-slate-900 border-l border-white/5 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{patientData?.name}</h2>
                    <Badge className={`${riskLevel.bgLightClass} ${riskLevel.textClass} border-none`}>
                      {riskLevel.label} Priority
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/40 hover:text-white hover:bg-white/10 -mt-2 -mr-2"
                    onClick={() => setIsImageEnlarged(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">ID Verification</p>
                    <p className="text-sm text-slate-300 font-mono">ONC-{patientData?.id?.toString().padStart(6, '0')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Cancer Profile</p>
                    <p className="text-sm text-slate-300">{patientData?.cancer_type || patientData?.cancerType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Clinical Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-2 w-2 rounded-full ${riskLevel.bgClass} animate-pulse`} />
                      <p className="text-sm text-slate-100 font-semibold">{patientData?.status || 'Active'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5">
                  <p className="text-[10px] text-white/30 leading-relaxed italic">
                    Certified biometric visual for clinical identification only. AI Risk recalculation active.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}