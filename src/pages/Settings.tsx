import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  User,
  Lock,
  Save,
  AlertCircle,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PREFS_STORAGE_KEY = "oncoai_settings_prefs";

const panel =
  "rounded-3xl border border-border bg-card shadow-xl dark:border-white/5";
const fieldBase =
  "h-11 w-full rounded-xl border border-border bg-muted/40 px-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.03] dark:placeholder:text-muted-foreground";
const fieldError = "border-rose-400/50 focus:border-rose-400/50 focus:ring-rose-400/20";
const labelBase = "text-[13px] font-medium text-foreground/80";

type SectionId = "profile" | "notifications" | "security";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  license: string;
  institution: string;
}

interface StoredPrefs {
  notifications: Record<string, boolean>;
}

function getAvatarUrl(name: string, avatarUrl?: string | null) {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "Doctor")}`;
}

function loadStoredPrefs(): Partial<StoredPrefs> | null {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredPrefs(prefs: StoredPrefs) {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

function validateProfile(form: ProfileForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email";
  if (!form.license.trim()) errors.license = "License number is required";
  if (!form.specialty.trim()) errors.specialty = "Specialty is required";
  return errors;
}

const NAV_ITEMS: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuth();
  const storedPrefs = loadStoredPrefs();

  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [isEditMode, setIsEditMode] = useState(false);

  const [profileUser, setProfileUser] = useState({
    name: authUser?.name || "Doctor",
    email: authUser?.email || "",
    specialty: authUser?.specialty || "",
    avatar: getAvatarUrl(authUser?.name || "Doctor", authUser?.avatar_url),
  });

  const [formData, setFormData] = useState<ProfileForm>({
    name: authUser?.name || "",
    email: authUser?.email || "",
    phone: authUser?.phone || "",
    specialty: authUser?.specialty || "",
    license: authUser?.license || "",
    institution: authUser?.institution || "",
  });
  const [savedFormData, setSavedFormData] = useState<ProfileForm>(formData);

  const [notifications, setNotifications] = useState(
    storedPrefs?.notifications ?? {
      criticalAlerts: true,
      appointmentReminders: true,
      labResults: true,
      email: true,
    },
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const resp = await apiService.getCurrentUser();
      const u = resp?.user || resp?.data?.user || resp;
      if (!u) return;

      const nextForm: ProfileForm = {
        name: u.name || authUser?.name || "",
        email: u.email || authUser?.email || "",
        phone: u.phone || "",
        specialty: u.specialty || "",
        license: u.license || "",
        institution: u.institution || "",
      };

      setProfileUser({
        name: u.name || "Doctor",
        email: u.email || "",
        specialty: u.specialty || "",
        avatar: getAvatarUrl(u.name || "Doctor", u.avatar_url),
      });
      setFormData(nextForm);
      setSavedFormData(nextForm);
      setFieldErrors({});
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [authUser?.email, authUser?.name]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onSection = (e: Event) => {
      const section = (e as CustomEvent<SectionId>).detail;
      if (section && NAV_ITEMS.some((item) => item.id === section)) {
        setActiveSection(section);
      }
    };
    window.addEventListener("oncoai:settings-section", onSection);
    return () => window.removeEventListener("oncoai:settings-section", onSection);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveStoredPrefs({ notifications });
    }
  }, [notifications, loading]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedFormData),
    [formData, savedFormData],
  );

  const handleSave = async (options?: { closeEdit?: boolean }) => {
    const errors = validateProfile(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix the highlighted fields");
      return false;
    }

    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        institution: formData.institution.trim(),
        license: formData.license.trim(),
        specialty: formData.specialty.trim(),
      };
      const resp = await apiService.updateCurrentUser(payload);
      const updatedUser = resp?.user || resp?.data?.user || resp;

      if (updatedUser) {
        setProfileUser((prev) => ({
          ...prev,
          name: updatedUser.name || prev.name,
          email: updatedUser.email || prev.email,
          specialty: updatedUser.specialty || prev.specialty,
          avatar: getAvatarUrl(updatedUser.name || prev.name, updatedUser.avatar_url),
        }));
        updateUser({
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          institution: updatedUser.institution,
          license: updatedUser.license,
          specialty: updatedUser.specialty,
        });
      }

      setSavedFormData(formData);
      saveStoredPrefs({ notifications });
      toast.success("Settings saved");
      if (options?.closeEdit) setIsEditMode(false);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(savedFormData);
    setFieldErrors({});
    setIsEditMode(false);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col text-foreground selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/70 blur-[100px] mix-blend-multiply dark:bg-emerald-500/10 dark:mix-blend-normal" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-100/70 blur-[100px] mix-blend-multiply dark:bg-violet-500/10 dark:mix-blend-normal" />
      </div>

      {/* Page header */}
      <div className="relative z-10 shrink-0 border-b border-border px-6 py-5 dark:border-white/5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your profile and preferences
            </p>
          </div>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-xl border border-rose-200/60 bg-rose-50/80 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <div className="flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{loadError}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadProfile} className="shrink-0 rounded-full">
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Mobile nav */}
      <div className="relative z-10 flex shrink-0 gap-2 overflow-x-auto border-b border-border px-6 py-3 dark:border-white/5 lg:hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
              activeSection === id
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Fixed sidebar + scrollable content */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 px-6">
        {/* Left nav — stays fixed while right scrolls */}
        <aside className="hidden w-52 shrink-0 py-6 pr-6 lg:block">
          <div className={`${panel} p-2`}>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] transition ${
                      active
                        ? "border border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400"
                        : "border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-border pt-4 dark:border-white/5">
              {loading ? (
                <div className="flex items-center gap-3 px-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-2">
                  <img
                    src={profileUser.avatar}
                    alt=""
                    className="h-9 w-9 rounded-lg ring-1 ring-border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{profileUser.name}</div>
                    <div className="truncate text-[12px] text-muted-foreground">
                      {profileUser.specialty || "Doctor"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right content — scrolls independently */}
        <div className="min-h-0 flex-1 overflow-y-auto py-6 lg:pl-0">
          <div className={`${panel} p-6`}>
            {activeSection === "profile" && (
              <SettingsPanel
                title="Profile"
                description="Your name and contact details"
                action={
                  !isEditMode && !loading ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-muted/60"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  ) : undefined
                }
              >
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Full name" error={fieldErrors.name}>
                        <input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`${fieldBase} ${fieldErrors.name ? fieldError : ""}`}
                          disabled={!isEditMode}
                        />
                      </Field>
                      <Field label="License number" error={fieldErrors.license}>
                        <input
                          value={formData.license}
                          onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                          className={`${fieldBase} ${fieldErrors.license ? fieldError : ""}`}
                          disabled={!isEditMode}
                        />
                      </Field>
                      <Field label="Email" error={fieldErrors.email}>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`${fieldBase} ${fieldErrors.email ? fieldError : ""}`}
                          disabled={!isEditMode}
                        />
                      </Field>
                      <Field label="Phone">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={fieldBase}
                          disabled={!isEditMode}
                        />
                      </Field>
                      <Field label="Specialty" error={fieldErrors.specialty}>
                        <input
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          className={`${fieldBase} ${fieldErrors.specialty ? fieldError : ""}`}
                          disabled={!isEditMode}
                        />
                      </Field>
                      <Field label="Institution">
                        <input
                          value={formData.institution}
                          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                          className={fieldBase}
                          disabled={!isEditMode}
                        />
                      </Field>
                    </div>

                    {isEditMode && (
                      <div className="flex justify-end gap-3 border-t border-border pt-5 dark:border-white/5">
                        <button
                          onClick={handleCancelEdit}
                          className="rounded-xl border border-border px-4 py-2 text-[14px] font-medium text-muted-foreground transition hover:bg-muted/60"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave({ closeEdit: true })}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                        >
                          {saving ? "Saving…" : "Save profile"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </SettingsPanel>
            )}

            {activeSection === "notifications" && (
              <SettingsPanel
                title="Notifications"
                description="Choose what alerts you receive"
              >
                <div className="divide-y divide-border dark:divide-white/5">
                  <Toggle
                    checked={notifications.criticalAlerts}
                    onChange={(v) => setNotifications({ ...notifications, criticalAlerts: v })}
                    label="Critical patient alerts"
                  />
                  <Toggle
                    checked={notifications.appointmentReminders}
                    onChange={(v) => setNotifications({ ...notifications, appointmentReminders: v })}
                    label="Appointment reminders"
                  />
                  <Toggle
                    checked={notifications.labResults}
                    onChange={(v) => setNotifications({ ...notifications, labResults: v })}
                    label="Lab results ready"
                  />
                  <Toggle
                    checked={notifications.email}
                    onChange={(v) => setNotifications({ ...notifications, email: v })}
                    label="Send alerts by email"
                  />
                </div>
              </SettingsPanel>
            )}

            {activeSection === "security" && (
              <SettingsPanel title="Security" description="Keep your account safe">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 dark:border-white/5">
                  <div>
                    <div className="text-[14px] font-medium">Password</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      Update your login password
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("Password change coming soon")}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted/60"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Change
                  </button>
                </div>
              </SettingsPanel>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => handleSave()}
              disabled={saving || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-muted-foreground transition hover:bg-muted/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className={labelBase}>{label}</label>
      {children}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="text-[14px] font-medium">{label}</div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
