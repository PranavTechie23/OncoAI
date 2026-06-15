import { Brain, Dna, HeartPulse, Terminal, ArrowRight } from "lucide-react";
import { AddPatientDialog } from "./AddPatientDialog";
import TextType from "./ui/TextType";
import { ParticleBackground } from "./ui/ParticleBackground";
import { TiltCard } from "./ui/TiltCard";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative overflow-hidden gradient-hero py-12 lg:py-24 dark:bg-slate-950">
      <ParticleBackground />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none mix-blend-screen">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-success/10 dark:bg-success/5 rounded-full blur-[150px]" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
                <TextType
                  text={["Intelligent Cancer Care", "Precision Oncology AI"]}
                  typingSpeed={60}
                  pauseDuration={3000}
                  showCursor={true}
                  cursorCharacter="|"
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-success pb-2 drop-shadow-sm"
                />
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                AI-driven tailored treatment recommendations for each patient.
                Analyze clinical data, predict outcomes, and optimize protocols.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <AddPatientDialog />
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      className="gap-2 text-base px-6 py-5 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse" 
                      style={{ animationDuration: '3s' }}
                      asChild
                    >
                      <Link to="/signup">
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="gap-2 text-base px-6 py-5 rounded-xl border-2 hover:bg-accent/50 hover:border-accent transition-all duration-300" 
                      asChild
                    >
                      <Link to="/login">
                        Doctor Login
                      </Link>
                    </Button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">AI-Powered</p>
                  <p className="text-xs text-muted-foreground">Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Dna className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Genomic</p>
                  <p className="text-xs text-muted-foreground">Integration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Real-time</p>
                  <p className="text-xs text-muted-foreground">Monitoring</p>
                </div>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex justify-center relative z-10">
            <TiltCard maxTilt={10} scaleOnHover={1.02} className="w-full max-w-sm relative">
              {/* Glowing aura behind the card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-success to-primary rounded-[2rem] blur-xl opacity-30 dark:opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
              
              <div className="relative bg-card/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-8 border border-white/20 dark:border-white/10 overflow-hidden">
                {/* Internal gradient shine */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                <div className="flex flex-col items-center justify-center gap-8">
                  {/* Mock Terminal AI Processing */}
                  <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-inner overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                      <Terminal className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-slate-400">onco-ai-core v2.4.1</span>
                      <div className="ml-auto flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <div className="w-2 h-2 rounded-full bg-success" />
                      </div>
                    </div>
                    <div className="font-mono text-xs space-y-1">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-slate-300">
                        <span className="text-primary">$</span> analyzing patient_genome.vcf...
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-success">
                        [OK] Genomic markers isolated.
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="text-slate-300">
                        <span className="text-primary">$</span> querying treatment_db...
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} 
                        className="text-warning flex items-center gap-2"
                      >
                        Processing <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1 }}>...</motion.span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="relative">
                    {/* Central brain icon */}
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(124,58,237,0)", "0 0 20px 5px rgba(124,58,237,0.3)", "0 0 0 0 rgba(124,58,237,0)"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center relative z-10"
                    >
                      <Brain className="w-14 h-14 text-primary" />
                    </motion.div>
                    
                    {/* Orbiting elements */}
                    <motion.div 
                      animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-2rem] border border-dashed border-primary/20 rounded-full"
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <Dna className="w-4 h-4 text-success-foreground" />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                        <HeartPulse className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="w-full space-y-3">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "94%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full relative" />
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "82%" }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-gradient-to-r from-success to-emerald-400 rounded-full" />
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
