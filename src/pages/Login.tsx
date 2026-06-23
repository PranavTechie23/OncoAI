import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/ui/ParticleBackground";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome back!", {
          description: "Your clinical dashboard is ready.",
        });
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <Link to="/signup">
                Create Account
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md relative group">
          {/* Glowing aura behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-success rounded-[2rem] blur-xl opacity-20 dark:opacity-40 group-hover:opacity-30 transition duration-1000" />
          
          <Card className="relative w-full p-8 sm:p-10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/40 dark:border-white/10 rounded-[2rem] overflow-hidden">
            {/* Inner top shine */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 dark:from-white/5 to-transparent pointer-events-none" />

            <div className="flex flex-col items-center mb-8 relative z-10">
              <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <img 
                  src="/assets/OncoAI.png" 
                  alt="OncoAI Logo" 
                  className="h-28 w-28 object-contain relative z-10 drop-shadow-2xl filter brightness-110"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2 text-center tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-center font-medium">
                Sign in to your clinical dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-fade-in rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300">Email Address</Label>
                <div className="relative group/input">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-slate-700 dark:text-slate-300">Password</Label>
                  <Link to="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary via-purple-500 to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 relative overflow-hidden group/btn" 
                  disabled={loading}
                >
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? "Authenticating..." : "Sign In to Dashboard"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </span>
                </Button>
              </div>

              <div className="mt-6 text-center text-sm font-medium text-muted-foreground">
                <p>
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4">
                    Create one now
                  </Link>
                </p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}