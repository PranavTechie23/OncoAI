import { Brain, Dna, HeartPulse, Terminal, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { AddPatientDialog } from "./AddPatientDialog";
import TextType from "./ui/TextType";
import { ParticleBackground } from "./ui/ParticleBackground";
import { TiltCard } from "./ui/TiltCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const { isAuthenticated } = useAuth();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-16 lg:pb-32 dark:bg-slate-950">
      <ParticleBackground />
      {/* Vibrant Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Right Blob */}
        <div className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-primary/30 via-purple-400/20 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Bottom Left Blob */}
        <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-success/30 via-emerald-400/20 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000" style={{ animationDuration: '10s' }} />
        {/* Center Accent Blob */}
        <div className="absolute top-[20%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-700" style={{ animationDuration: '7s' }} />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in relative">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight drop-shadow-sm">
                <TextType
                  text={["Intelligent Cancer Care", "Precision Oncology AI", "Data-Driven Medicine"]}
                  typingSpeed={50}
                  pauseDuration={3000}
                  showCursor={true}
                  cursorCharacter="|"
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-success pb-2"
                />
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                Empowering oncologists with AI-driven treatment recommendations. 
                Analyze clinical data, predict outcomes, and optimize patient protocols in seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {isAuthenticated ? (
                <AddPatientDialog />
              ) : (
                <>
                  <div className="transition-transform duration-300 hover:scale-105">
                    <Button 
                      size="lg" 
                      className="gap-3 text-lg px-8 h-16 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/25 transition-all duration-300 border-none relative overflow-hidden group" 
                      asChild
                    >
                      <Link to="/signup">
                        {/* Button shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <span className="relative z-10 flex items-center gap-3">
                          Get Started Free
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <div className="transition-transform duration-300 hover:scale-105">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="gap-2 text-lg px-8 h-16 rounded-2xl border-2 border-primary/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-primary/5 hover:border-primary/40 shadow-sm transition-all duration-300" 
                      asChild
                    >
                      <Link to="/login">
                        Doctor Login
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Premium Glassmorphism Stats */}
            <div className="flex flex-wrap gap-4 pt-8">
              {[
                { icon: Brain, label: "AI-Powered", sub: "Analysis", color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20", border: "border-primary/20" },
                { icon: Dna, label: "Genomic", sub: "Integration", color: "text-success", bg: "bg-success/10 dark:bg-success/20", border: "border-success/20" },
                { icon: HeartPulse, label: "Real-time", sub: "Monitoring", color: "text-warning", bg: "bg-warning/10 dark:bg-warning/20", border: "border-warning/20" }
              ].map((stat, i) => (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${stat.border} bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group`}>
                  <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-foreground leading-tight">{stat.label}</p>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex justify-center relative z-10">
            <TiltCard maxTilt={10} scaleOnHover={1.02} className="w-full max-w-[420px] relative">
              {/* Glowing aura behind the card */}
              <div className="absolute -inset-2 bg-gradient-to-r from-primary via-success to-purple-500 rounded-[2.5rem] blur-2xl opacity-40 dark:opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
              
              <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-8 border border-white/40 dark:border-white/10 overflow-hidden">
                {/* Internal gradient shine */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col items-center justify-center gap-10">
                  {/* Mock Terminal AI Processing */}
                  <div className="w-full bg-slate-950 rounded-xl p-5 border border-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
                      <Terminal className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-slate-400">onco-ai-core v2.4.1</span>
                      <div className="ml-auto flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
                      </div>
                    </div>
                    <div className="font-mono text-xs md:text-sm space-y-2">
                      <div className={`text-slate-300 transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="text-primary font-bold">$</span> analyzing patient_genome.vcf...
                      </div>
                      <div className={`text-success font-medium transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
                        [OK] Genomic markers isolated.
                      </div>
                      <div className={`text-slate-300 transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
                        <span className="text-primary font-bold">$</span> querying treatment_db...
                      </div>
                      <div className={`text-warning flex items-center gap-2 font-medium transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1500ms' }}>
                        Processing <span className="animate-pulse">...</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative py-12">
                    {/* Central brain icon */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
                      <Brain className="w-16 h-16 text-primary drop-shadow-md" />
                    </div>
                    
                    {/* Orbiting elements - Now Actually Spinning! */}
                    <div className="absolute inset-[-2.5rem] border-2 border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-success to-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                        <Dna className="w-6 h-6 text-white animate-[spin_10s_linear_infinite]" style={{ animationDirection: 'reverse' }} />
                      </div>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)]">
                        <HeartPulse className="w-6 h-6 text-white animate-[spin_10s_linear_infinite]" style={{ animationDirection: 'reverse' }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="w-full space-y-4 pt-2">
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all duration-1000 ease-out" 
                        style={{ width: loaded ? '94%' : '0%', transitionDelay: '500ms' }}
                      />
                    </div>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-success to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                        style={{ width: loaded ? '82%' : '0%', transitionDelay: '1000ms' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}
