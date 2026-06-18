import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Shield, Palette, Mail, Smartphone, Lock, CreditCard, Globe, Moon, Sun, Check, Save, AlertCircle, ArrowLeft, Stethoscope, FileText, Activity, Clock, Users, Brain, Eye, EyeOff, Monitor, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";

import { useEffect, useRef } from "react";
import { apiService } from "@/services/api";

export default function Settings() {
  const navigate = useNavigate();
  const { theme: currentTheme, setTheme: setThemeProvider } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [user, setUser] = useState({
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    role: "Medical Oncologist",
    institution: "Memorial Cancer Center",
    created_at: "2024-01-15",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
  });
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: "+1 (555) 123-4567",
    specialty: "Medical Oncology",
    subspecialty: "Breast & Thoracic Oncology",
    license: "MD-12345678",
    npi: "1234567890",
    institution: user.institution,
    department: "Oncology Department"
  });
  
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    patientUpdates: true,
    appointmentReminders: true,
    treatmentAlerts: true,
    labResults: true,
    aiRecommendations: true,
    email: true,
    sms: true,
    push: true
  });
  
  const [preferences, setPreferences] = useState({
    theme: currentTheme || "system",
    language: "en",
    timezone: "UTC-5",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    defaultView: "dashboard"
  });
  
  const [clinicalSettings, setClinicalSettings] = useState({
    autoSaveForms: true,
    showRiskScores: true,
    enableAIAssist: true,
    compactView: false,
    showPatientPhotos: true
  });
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current user from backend (uses optional_auth on backend so demo user is returned)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await apiService.getCurrentUser();
        const u = resp?.user || resp?.data?.user || resp;
        if (mounted && u) {
          setUser((prev) => ({ ...prev, ...u }));
          setFormData((prev) => ({
            ...prev,
            name: u.name || prev.name,
            email: u.email || prev.email,
            institution: u.institution || prev.institution || prev.institution,
            phone: (u as any).phone || prev.phone,
            license: (u as any).license || prev.license,
            npi: (u as any).npi || prev.npi,
            department: (u as any).department || prev.department,
            specialty: (u as any).specialty || prev.specialty,
            subspecialty: (u as any).subspecialty || prev.subspecialty,
          }));
        }
      } catch (err) {
        // ignore; fallback to defaults already present
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Sync preferences theme with theme provider
  useEffect(() => {
    if (currentTheme) {
      setPreferences((prev) => ({ ...prev, theme: currentTheme }));
    }
  }, [currentTheme]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['profile', 'clinical', 'notifications', 'appearance', 'security'];
      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle section navigation
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setPreferences((prev) => ({ ...prev, theme }));
    if (setThemeProvider) {
      setThemeProvider(theme);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        institution: formData.institution,
        department: formData.department,
        license: formData.license,
        npi: formData.npi,
        specialty: formData.specialty,
        subspecialty: formData.subspecialty,
      };
      const resp = await apiService.updateCurrentUser(payload);
      const updatedUser = resp?.user || resp?.data?.user || resp;
      if (updatedUser) {
        setUser((prev) => ({ ...prev, ...updatedUser }));
      }
      setSaveSuccess(true);
    } catch (err) {
      // show error briefly using saveSuccess flag as false; could add error state
    } finally {
      setSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const Toggle = ({ checked, onChange, label, description }: any) => {
    return (
      <div className="flex items-center justify-between py-4 group">
        <div className="flex-1">
          <div className="font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground mt-1">{description}</div>
          )}
        </div>
        <button
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm ${
            checked 
              ? 'bg-gradient-to-r from-primary to-primary/80' 
              : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 lg:py-16 bg-gradient-to-br from-primary/10 via-background to-success/10 dark:from-primary/20 dark:via-slate-950 dark:to-success/20 border-b border-border/50 dark:border-slate-800">
          <div className="absolute inset-0 opacity-40 dark:opacity-30">
            <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-20 w-80 h-80 bg-success/20 dark:bg-success/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(120,119,198,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_30%,rgba(120,119,198,0.15),transparent_50%)]" />
          
          <div className="container relative z-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/30 mb-6">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Account Settings</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Settings & Preferences
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Customize your OncoAI experience and manage your professional profile
              </p>
            </div>
          </div>
        </section>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="container py-6">
            <Card className="p-4 bg-gradient-to-r from-success/10 via-success/5 to-transparent border-success/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Settings saved successfully</p>
                <p className="text-sm text-muted-foreground">Your changes have been applied</p>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="p-6 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-auto">
                  <nav className="space-y-2">
                    <button
                      onClick={() => scrollToSection("profile")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === "profile"
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </button>
                    <button
                      onClick={() => scrollToSection("clinical")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === "clinical"
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <Stethoscope className="h-5 w-5" />
                      Clinical Settings
                    </button>
                    <button
                      onClick={() => scrollToSection("notifications")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === "notifications"
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                      Notifications
                    </button>
                    <button
                      onClick={() => scrollToSection("appearance")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === "appearance"
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <Palette className="h-5 w-5" />
                      Appearance
                    </button>
                    <button
                      onClick={() => scrollToSection("security")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeSection === "security"
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                      Security
                    </button>
                  </nav>

                  <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-xl ring-2 ring-primary/20" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{(user as any).specialty || user.role || 'Doctor'}</div>
                      </div>
                    </div>
                    <Badge className="w-full justify-center bg-success/10 text-success border-success/30">
                      Active Account
                    </Badge>
                  </div>
                </Card>
              </div>

              {/* Main Settings Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Profile Information */}
                <div id="profile">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">Professional Profile</h2>
                          <p className="text-sm text-muted-foreground">Manage your medical credentials and contact information</p>
                        </div>
                      </div>
                      {!isEditMode && (
                        <Button
                          onClick={() => setIsEditMode(true)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Dr. John Doe"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Medical License Number *</Label>
                          <Input
                            value={formData.license}
                            onChange={(e) => setFormData({...formData, license: e.target.value})}
                            placeholder="MD-12345678"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="doctor@hospital.com"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="+1 (555) 123-4567"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Primary Specialty *</Label>
                          <Input
                            value={formData.specialty}
                            onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                            placeholder="Medical Oncology"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Subspecialty</Label>
                          <Input
                            value={formData.subspecialty}
                            onChange={(e) => setFormData({...formData, subspecialty: e.target.value})}
                            placeholder="Breast & Thoracic Oncology"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>NPI Number</Label>
                          <Input
                            value={formData.npi}
                            onChange={(e) => setFormData({...formData, npi: e.target.value})}
                            placeholder="1234567890"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Institution</Label>
                          <Input
                            value={formData.institution}
                            onChange={(e) => setFormData({...formData, institution: e.target.value})}
                            placeholder="Memorial Cancer Center"
                            className="h-11"
                            disabled={!isEditMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          placeholder="Oncology Department"
                          className="h-11"
                          disabled={!isEditMode}
                        />
                      </div>

                      {isEditMode && (
                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            onClick={() => setIsEditMode(false)}
                            variant="outline"
                            size="lg"
                            className="gap-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              await handleSave();
                              setIsEditMode(false);
                            }}
                            disabled={saving}
                            size="lg"
                            className="gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                            {saving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Clinical Settings */}
                <div id="clinical">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 dark:from-success/30 dark:to-success/20 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Clinical Settings</h2>
                        <p className="text-sm text-muted-foreground">Customize your clinical workflow and display preferences</p>
                      </div>
                    </div>

                    <div className="space-y-1 divide-y divide-border/50">
                      <Toggle
                        checked={clinicalSettings.enableAIAssist}
                        onChange={(v: boolean) => setClinicalSettings({...clinicalSettings, enableAIAssist: v})}
                        label="AI Treatment Recommendations"
                        description="Enable AI-powered treatment suggestions based on patient data"
                      />
                      <Toggle
                        checked={clinicalSettings.showRiskScores}
                        onChange={(v: boolean) => setClinicalSettings({...clinicalSettings, showRiskScores: v})}
                        label="Display Risk Scores"
                        description="Show calculated risk scores on patient profiles and lists"
                      />
                      <Toggle
                        checked={clinicalSettings.autoSaveForms}
                        onChange={(v: boolean) => setClinicalSettings({...clinicalSettings, autoSaveForms: v})}
                        label="Auto-save Clinical Forms"
                        description="Automatically save form data as you type to prevent data loss"
                      />
                      <Toggle
                        checked={clinicalSettings.showPatientPhotos}
                        onChange={(v: boolean) => setClinicalSettings({...clinicalSettings, showPatientPhotos: v})}
                        label="Show Patient Photos"
                        description="Display patient photographs in profiles and appointment lists"
                      />
                      <Toggle
                        checked={clinicalSettings.compactView}
                        onChange={(v: boolean) => setClinicalSettings({...clinicalSettings, compactView: v})}
                        label="Compact View Mode"
                        description="Display more information on screen with reduced spacing"
                      />
                    </div>
                  </Card>
                </div>

                {/* Notifications */}
                <div id="notifications">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/10 dark:from-warning/30 dark:to-warning/20 flex items-center justify-center">
                        <Bell className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Notification Preferences</h2>
                        <p className="text-sm text-muted-foreground">Choose how you want to receive alerts and updates</p>
                      </div>
                    </div>

                    <Tabs defaultValue="clinical" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="clinical" className="rounded-lg">Clinical Alerts</TabsTrigger>
                        <TabsTrigger value="channels" className="rounded-lg">Notification Channels</TabsTrigger>
                      </TabsList>

                      <TabsContent value="clinical" className="space-y-1 divide-y divide-border/50">
                        <Toggle
                          checked={notifications.criticalAlerts}
                          onChange={(v: boolean) => setNotifications({...notifications, criticalAlerts: v})}
                          label="Critical Patient Alerts"
                          description="Urgent notifications for critical changes in patient condition"
                        />
                        <Toggle
                          checked={notifications.patientUpdates}
                          onChange={(v: boolean) => setNotifications({...notifications, patientUpdates: v})}
                          label="Patient Status Updates"
                          description="Receive updates when patient status or treatment plan changes"
                        />
                        <Toggle
                          checked={notifications.labResults}
                          onChange={(v: boolean) => setNotifications({...notifications, labResults: v})}
                          label="Lab Results Available"
                          description="Get notified when new lab results are ready for review"
                        />
                        <Toggle
                          checked={notifications.treatmentAlerts}
                          onChange={(v: boolean) => setNotifications({...notifications, treatmentAlerts: v})}
                          label="Treatment Milestones"
                          description="Alerts for upcoming treatments, cycles, and follow-ups"
                        />
                        <Toggle
                          checked={notifications.appointmentReminders}
                          onChange={(v: boolean) => setNotifications({...notifications, appointmentReminders: v})}
                          label="Appointment Reminders"
                          description="Reminders for upcoming patient appointments"
                        />
                        <Toggle
                          checked={notifications.aiRecommendations}
                          onChange={(v: boolean) => setNotifications({...notifications, aiRecommendations: v})}
                          label="AI Recommendation Alerts"
                          description="Notifications when new AI treatment recommendations are available"
                        />
                      </TabsContent>

                      <TabsContent value="channels" className="space-y-1 divide-y divide-border/50">
                        <Toggle
                          checked={notifications.email}
                          onChange={(v: boolean) => setNotifications({...notifications, email: v})}
                          label="Email Notifications"
                          description={`Send notifications to ${formData.email}`}
                        />
                        <Toggle
                          checked={notifications.sms}
                          onChange={(v: boolean) => setNotifications({...notifications, sms: v})}
                          label="SMS Text Messages"
                          description={`Send critical alerts to ${formData.phone}`}
                        />
                        <Toggle
                          checked={notifications.push}
                          onChange={(v: boolean) => setNotifications({...notifications, push: v})}
                          label="Push Notifications"
                          description="Receive instant notifications on your desktop and mobile devices"
                        />
                      </TabsContent>
                    </Tabs>
                  </Card>
                </div>

                {/* Appearance */}
                <div id="appearance">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center">
                        <Palette className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Appearance & Display</h2>
                        <p className="text-sm text-muted-foreground">Customize the look and feel of your interface</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Theme Mode</Label>
                        <p className="text-sm text-muted-foreground mb-4">Choose how OncoAI looks for you</p>
                        <div className="grid grid-cols-3 gap-4">
                          <button
                            onClick={() => handleThemeChange('light')}
                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                              preferences.theme === 'light'
                                ? 'border-primary bg-primary/5 shadow-lg'
                                : 'border-border hover:border-primary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-all ${
                                preferences.theme === 'light'
                                  ? 'from-amber-400 to-orange-500'
                                  : 'from-amber-400/50 to-orange-500/50 group-hover:from-amber-400 group-hover:to-orange-500'
                              }`}>
                                <Sun className="h-7 w-7 text-white" />
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-foreground">Light</div>
                                <div className="text-xs text-muted-foreground mt-1">Bright & clear</div>
                              </div>
                            </div>
                            {preferences.theme === 'light' && (
                              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </button>

                          <button
                            onClick={() => handleThemeChange('dark')}
                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                              preferences.theme === 'dark'
                                ? 'border-primary bg-primary/5 shadow-lg'
                                : 'border-border hover:border-primary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-all ${
                                preferences.theme === 'dark'
                                  ? 'from-indigo-500 to-purple-600'
                                  : 'from-indigo-500/50 to-purple-600/50 group-hover:from-indigo-500 group-hover:to-purple-600'
                              }`}>
                                <Moon className="h-7 w-7 text-white" />
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-foreground">Dark</div>
                                <div className="text-xs text-muted-foreground mt-1">Easy on eyes</div>
                              </div>
                            </div>
                            {preferences.theme === 'dark' && (
                              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </button>

                          <button
                            onClick={() => handleThemeChange('system')}
                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                              preferences.theme === 'system'
                                ? 'border-primary bg-primary/5 shadow-lg'
                                : 'border-border hover:border-primary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-all ${
                                preferences.theme === 'system'
                                  ? 'from-blue-500 to-cyan-500'
                                  : 'from-blue-500/50 to-cyan-500/50 group-hover:from-blue-500 group-hover:to-cyan-500'
                              }`}>
                                <Monitor className="h-7 w-7 text-white" />
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-foreground">System</div>
                                <div className="text-xs text-muted-foreground mt-1">Auto switch</div>
                              </div>
                            </div>
                            {preferences.theme === 'system' && (
                              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <select
                            value={preferences.language}
                            onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                            className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                            className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          >
                            <option value="UTC-5">Eastern Time (UTC-5)</option>
                            <option value="UTC-6">Central Time (UTC-6)</option>
                            <option value="UTC-7">Mountain Time (UTC-7)</option>
                            <option value="UTC-8">Pacific Time (UTC-8)</option>
                          </select>
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Date Format</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setPreferences({...preferences, dateFormat: 'MM/DD/YYYY'})}
                              className={`py-3 rounded-xl border-2 transition-all duration-300 ${
                                preferences.dateFormat === 'MM/DD/YYYY'
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }`}
                            >
                              MM/DD/YYYY
                            </button>
                            <button
                              onClick={() => setPreferences({...preferences, dateFormat: 'DD/MM/YYYY'})}
                              className={`py-3 rounded-xl border-2 transition-all duration-300 ${
                                preferences.dateFormat === 'DD/MM/YYYY'
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }`}
                            >
                              DD/MM/YYYY
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Time Format</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setPreferences({...preferences, timeFormat: '12h'})}
                              className={`py-3 rounded-xl border-2 transition-all duration-300 ${
                                preferences.timeFormat === '12h'
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }`}
                            >
                              12-hour
                            </button>
                            <button
                              onClick={() => setPreferences({...preferences, timeFormat: '24h'})}
                              className={`py-3 rounded-xl border-2 transition-all duration-300 ${
                                preferences.timeFormat === '24h'
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }`}
                            >
                              24-hour
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Security */}
                <div id="security">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/10 dark:from-warning/30 dark:to-warning/20 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Security & Privacy</h2>
                        <p className="text-sm text-muted-foreground">Manage your account security and privacy settings</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-foreground">Password</div>
                            <div className="text-sm text-muted-foreground">Last changed 30 days ago</div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Lock className="h-4 w-4" />
                            Change Password
                          </Button>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div>
                            <div className="font-semibold text-foreground">Two-Factor Authentication</div>
                            <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                          </div>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Active
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div>
                            <div className="font-semibold text-foreground">Active Sessions</div>
                            <div className="text-sm text-muted-foreground">2 devices currently logged in</div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Monitor className="h-4 w-4" />
                            Manage Sessions
                          </Button>
                        </div>
                      </div>

                      {/* Data & Privacy */}
                      <div className="space-y-4 pt-6 border-t border-border/50">
                        <h3 className="text-lg font-semibold text-foreground">Data & Privacy</h3>
                        <div className="space-y-3">
                          <Toggle
                            checked={true}
                            onChange={() => {}}
                            label="Share anonymous usage data"
                            description="Help us improve OncoAI by sharing anonymous usage statistics"
                          />
                          <Toggle
                            checked={false}
                            onChange={() => {}}
                            label="Data export on account deletion"
                            description="Receive a copy of your data when deleting your account"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border/50">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Data Export & Account</h3>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start gap-2 hover:bg-muted">
                            <FileText className="h-4 w-4" />
                            Download your data
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                            <AlertCircle className="h-4 w-4" />
                            Delete account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Account Usage */}
                <div id="usage">
                  <Card className="p-8 bg-card/50 backdrop-blur-sm shadow-lg border border-border/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Account Usage</h2>
                        <p className="text-sm text-muted-foreground">Monitor your account activity and limits</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">Active Patients</div>
                            <div className="text-2xl font-bold text-foreground">108 / ∞</div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground">No limit on active patients</div>
                      </div>

                      <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-success/5 to-success/10 border border-success/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                            <Brain className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">AI Recommendations</div>
                            <div className="text-2xl font-bold text-foreground">156 / 200</div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: '78%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground">Resets on Feb 1, 2024</div>
                      </div>

                      <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">Session Duration</div>
                            <div className="text-2xl font-bold text-foreground">4.7h avg</div>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full" style={{ width: '50%' }} />
                        </div>
                        <div className="text-xs text-muted-foreground">Daily average this month</div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                        <Button variant="ghost" size="sm">View All</Button>
                      </div>
                      <div className="space-y-3">
                        {[
                          { time: "2 hours ago", action: "Changed password", icon: Lock },
                          { time: "Yesterday", action: "Updated profile information", icon: User },
                          { time: "2 days ago", action: "Logged in from new device", icon: Smartphone },
                          { time: "3 days ago", action: "Exported patient data", icon: FileText }
                        ].map((activity, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <activity.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{activity.action}</div>
                              <div className="text-xs text-muted-foreground">{activity.time}</div>
                            </div>
                            <Badge variant="outline">Completed</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="flex-1 gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 gap-2 hover:shadow-md transition-all duration-300"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}