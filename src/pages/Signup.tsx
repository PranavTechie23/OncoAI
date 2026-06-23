import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, Lock, User, AlertCircle, ArrowLeft, Building2, Phone, Shield, Stethoscope, Edit2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

export default function Signup() {
  // Step state
  const [step, setStep] = useState(1);

  // Account (required)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Professional info (some required)
  const [specialty, setSpecialty] = useState("");
  const [subspecialty, setSubspecialty] = useState("");
  const [license, setLicense] = useState("");
  const [npi, setNpi] = useState("");

  // Contact & institution (optional except phone)
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateStep = (): boolean => {
    // Basic required-field validation per step
    if (step === 1) {
      if (!name || !email || !password || !confirmPassword) {
        setError("Please fill in all required account fields.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    } else if (step === 2) {
      if (!specialty || !license || !npi) {
        setError("Please provide specialty, medical license number, and NPI.");
        return false;
      }
    } else if (step === 3) {
      if (!phone) {
        setError("Please provide a contact phone number.");
        return false;
      }
      if (!location) {
        setError("Please provide a location.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Only allow submission on step 4
    if (step !== 4) {
      return;
    }

    // Final validation before creating account
    if (!name || !email || !password || !specialty || !license || !npi || !phone || !location) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role: "doctor",
        phone,
        institution,
        department,
        license,
        npi,
        specialty,
        subspecialty,
        location,
      };

      await apiService.register(payload);

      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      setError(err?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStep = (stepNumber: number) => {
    setStep(stepNumber);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <ParticleBackground />
      
      {/* Vibrant Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-primary/20 via-purple-400/10 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-success/20 via-emerald-400/10 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000" style={{ animationDuration: '10s' }} />
      </div>

      {/* Header Bar */}
      <div className="w-full border-b border-white/20 bg-white/40 dark:bg-slate-950/40 dark:border-slate-800 backdrop-blur-xl relative z-20 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/assets/OncoAI.png" 
              alt="OncoAI Logo" 
              className="h-12 w-12 object-contain transition-transform group-hover:scale-110 drop-shadow-lg"
            />
            <span className="text-xl font-bold text-foreground">
              Onco<span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" className="hidden sm:flex hover:bg-primary/10 hover:text-primary transition-colors" asChild>
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10 py-12">
        <div className="w-full max-w-xl relative group">
          {/* Glowing aura behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-success rounded-[2rem] blur-xl opacity-20 dark:opacity-40 group-hover:opacity-30 transition duration-1000" />
          
          <Card className="relative w-full shadow-2xl bg-white/80 dark:bg-slate-950/60 backdrop-blur-2xl border-white/40 dark:border-white/10 rounded-[2rem] overflow-hidden">
            {/* Minimal Progress Bar at the very top */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 relative">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <div className="p-8 sm:p-10 pt-8">
              {/* Inner top shine */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Create Account
                </h1>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Step {step} of 4
                </span>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step === 4) {
                    handleSubmit(e);
                  }
                }} 
                className="space-y-6 relative z-10"
              >
                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-fade-in rounded-xl py-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                  </Alert>
                )}

            {/* Step content */}
            {step === 1 && (
              <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">1. Account details</h2>
                  <p className="text-sm font-medium text-muted-foreground">Required: basic login details.</p>
                </div>
                <div className="grid gap-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="font-semibold text-slate-700 dark:text-slate-300">Full Name *</Label>
                    <div className="relative group/input">
                      <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Dr. Sarah Johnson"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300">Work Email *</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@hospital.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="password" className="font-semibold text-slate-700 dark:text-slate-300">Password *</Label>
                      <div className="relative group/input">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="confirmPassword" className="font-semibold text-slate-700 dark:text-slate-300">Confirm Password *</Label>
                      <div className="relative group/input">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">2. Professional details</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    Required: specialty, license, and NPI. Subspecialty is optional.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="specialty" className="font-semibold text-slate-700 dark:text-slate-300">Primary Specialty *</Label>
                    <div className="relative group/input">
                      <Stethoscope className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="specialty"
                        placeholder="Medical Oncology"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="subspecialty" className="font-semibold text-slate-700 dark:text-slate-300">Subspecialty (optional)</Label>
                    <Input
                      id="subspecialty"
                      placeholder="Breast & Thoracic Oncology"
                      value={subspecialty}
                      onChange={(e) => setSubspecialty(e.target.value)}
                      className="h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all px-4"
                    />
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="license" className="font-semibold text-slate-700 dark:text-slate-300">Medical License Number *</Label>
                    <div className="relative group/input">
                      <Shield className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="license"
                        placeholder="MD-123456"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="npi" className="font-semibold text-slate-700 dark:text-slate-300">NPI Number *</Label>
                    <Input
                      id="npi"
                      placeholder="1234567890"
                      value={npi}
                      onChange={(e) => setNpi(e.target.value)}
                      className="h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all px-4"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">3. Contact & institution</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone and location are required; other fields help personalize analytics but are optional.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="phone" className="font-semibold text-slate-700 dark:text-slate-300">Phone Number *</Label>
                    <div className="relative group/input">
                      <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="institution" className="font-semibold text-slate-700 dark:text-slate-300">Institution (optional)</Label>
                    <div className="relative group/input">
                      <Building2 className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        id="institution"
                        placeholder="Memorial Cancer Center"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="pl-11 h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="department" className="font-semibold text-slate-700 dark:text-slate-300">Department (optional)</Label>
                    <Input
                      id="department"
                      placeholder="Oncology Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all px-4"
                    />
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <Label htmlFor="location" className="font-semibold text-slate-700 dark:text-slate-300">Location *</Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-12 bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all px-4"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">4. Review & create account</h2>
                <p className="text-xs text-muted-foreground">
                  Review your details below. Click the edit icon to modify any information before creating your account.
                </p>
                <div className="grid gap-4 text-sm bg-muted/40 dark:bg-slate-900/40 p-6 rounded-xl">
                  {/* Step 1: Account Details */}
                  <div className="border-b border-border/50 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">1. Account Details</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(1)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium text-foreground">{name || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium text-foreground">{email || "Not set"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Professional Details */}
                  <div className="border-b border-border/50 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">2. Professional Details</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(2)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Specialty:</span>
                        <span className="font-medium text-foreground">{specialty || "Not set"}</span>
                      </div>
                      {subspecialty && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subspecialty:</span>
                          <span className="font-medium text-foreground">{subspecialty}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">License:</span>
                        <span className="font-medium text-foreground">{license || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">NPI:</span>
                        <span className="font-medium text-foreground">{npi || "Not set"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Contact & Institution */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">3. Contact & Institution</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(3)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-foreground">{phone || "Not set"}</span>
                      </div>
                      {institution && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Institution:</span>
                          <span className="font-medium text-foreground">{institution}</span>
                        </div>
                      )}
                      {department && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Department:</span>
                          <span className="font-medium text-foreground">{department}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">{location || "Not set"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 relative z-10 border-t border-border/20 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (step === 1) {
                    navigate(-1);
                  } else {
                    setStep((s) => Math.max(1, s - 1));
                    setError("");
                  }
                }}
                disabled={loading}
                className="gap-2 h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep()) setStep((s) => Math.min(4, s + 1));
                  }}
                  disabled={loading}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-md transition-all gap-2"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-success to-emerald-500 hover:from-success/90 hover:to-emerald-500/90 shadow-md shadow-success/25 transition-all gap-2 overflow-hidden group/btn relative"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? "Creating Account..." : "Complete Registration"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              )}
            </div>

            <div className="mt-8 text-center text-sm font-medium text-muted-foreground relative z-10">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4">
                  Sign In to Dashboard
                </Link>
              </p>
            </div>
          </form>
          </div>
          </Card>
        </div>
      </div>
    </div>
  );
}








