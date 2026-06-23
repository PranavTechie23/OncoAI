import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
const Footer = lazy(() => import("@/components/Footer").then(module => ({ default: module.Footer })));
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import FadeInText from "@/components/ui/FadeInText";
import { ScrollAnimation, StaggerContainer, StaggerItem } from "@/components/ScrollAnimation";
import { ParallaxSection } from "@/components/ParallaxSection";
import { HoverCard } from "@/components/HoverCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";

import { 
  ArrowRight, 
  Brain, 
  BarChart3, 
  Users, 
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Sparkles,
  HeartPulse
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Insights & Reports",
      description: "Get personalized treatment recommendations and deep clinical insights powered by advanced AI.",
      color: "primary",
      link: "/recommendations"
    },
    {
      icon: Users,
      title: "Patient Care & Monitoring",
      description: "Manage comprehensive patient records and track clinical trajectories in real time.",
      color: "success",
      link: "/patients"
    },
    {
      icon: Shield,
      title: "HIPAA Compliant Security",
      description: "Enterprise-grade encryption and strict access controls fully compliant with healthcare standards.",
      color: "warning",
      link: "/about",
      isPublic: true
    }
  ];

  const getColorClasses = (color: string, isIcon: boolean = false) => {
    const baseClasses = {
      primary: isIcon 
        ? "from-primary/20 via-primary/15 to-primary/10 dark:from-primary/30 dark:via-primary/20 dark:to-primary/15" 
        : "hover:border-primary/40 dark:hover:border-primary/50 group-hover:text-primary",
      success: isIcon 
        ? "from-success/20 via-success/15 to-success/10 dark:from-success/30 dark:via-success/20 dark:to-success/15" 
        : "hover:border-success/40 dark:hover:border-success/50 group-hover:text-success",
      warning: isIcon 
        ? "from-warning/20 via-warning/15 to-warning/10 dark:from-warning/30 dark:via-warning/20 dark:to-warning/15" 
        : "hover:border-warning/40 dark:hover:border-warning/50 group-hover:text-warning"
    };
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.primary;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background/95 to-muted/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/5 dark:bg-success/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Header />
      <main className="flex-1">
        <HeroSection />

        {/* How It Works Section */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent dark:via-primary/[0.06]" />
          <div className="container relative">
            <ScrollAnimation direction="up" delay={0.1}>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold mb-6">
                  <Zap className="h-4 w-4" />
                  Simple 3-Step Process
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                  How It{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-success bg-clip-text text-transparent">
                    Works
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
                  From patient data to actionable treatment plans — in minutes, not hours
                </p>
              </div>
            </ScrollAnimation>

            <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line (desktop) */}
              <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/40 via-success/40 to-primary/40" />

              {[
                {
                  step: "01",
                  icon: Users,
                  title: "Upload Patient Data",
                  description: "Securely import clinical records, genomic profiles, and medical history into the HIPAA-compliant platform.",
                  gradient: "from-primary/20 to-primary/5",
                  borderColor: "border-primary/30 hover:border-primary/50",
                  iconBg: "from-primary to-purple-500"
                },
                {
                  step: "02",
                  icon: Brain,
                  title: "AI Analyzes & Recommends",
                  description: "Our AI engine cross-references thousands of clinical trials and genomic markers to generate personalized treatment protocols.",
                  gradient: "from-success/20 to-success/5",
                  borderColor: "border-success/30 hover:border-success/50",
                  iconBg: "from-success to-emerald-400"
                },
                {
                  step: "03",
                  icon: BarChart3,
                  title: "Monitor & Optimize",
                  description: "Track treatment outcomes in real-time, adjust protocols dynamically, and generate detailed reports for clinical review.",
                  gradient: "from-warning/20 to-warning/5",
                  borderColor: "border-warning/30 hover:border-warning/50",
                  iconBg: "from-amber-500 to-orange-400"
                }
              ].map((item, index) => (
                <StaggerItem key={index} index={index}>
                  <HoverCard hoverScale={1.03}>
                    <div className={`relative group rounded-2xl border ${item.borderColor} bg-gradient-to-b ${item.gradient} dark:bg-card/50 backdrop-blur-sm p-8 text-center transition-all duration-500 h-full`}>
                      {/* Step number badge */}
                      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r ${item.iconBg} text-white text-xs font-bold tracking-widest shadow-lg`}>
                        <span className="font-mono text-sm">
                          STEP {item.step}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${item.iconBg} shadow-lg mb-6 mt-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Stats Section */}
        <ParallaxSection speed={0.3}>
          <section className="py-16 bg-gradient-to-b from-background to-muted/20 dark:from-slate-950 dark:to-slate-900 border-y border-border/20 dark:border-slate-800">
            <div className="container">
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: "10K+", numericValue: 10000, label: "Patients Served", icon: Users, suffix: "K+" },
                  { value: "99.8%", numericValue: 99.8, decimals: 1, label: "Accuracy Rate", icon: Brain, suffix: "%" },
                  { value: "24/7", numericValue: 24, label: "Real-time Monitoring", icon: TrendingUp, isSpecial: true },
                  { value: "100%", numericValue: 100, label: "HIPAA Compliant", icon: Shield, suffix: "%" }
                ].map((stat, index) => (
                  <StaggerItem key={index} index={index}>
                    <HoverCard hoverScale={1.05}>
                      <div className="text-center group">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 mb-4 transition-transform duration-500 group-hover:rotate-360 group-hover:scale-110">
                          <stat.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {stat.isSpecial ? (
                            "24/7"
                          ) : (
                            <AnimatedNumber 
                              value={stat.numericValue} 
                              duration={2000}
                              decimals={stat.decimals || 0}
                              suffix={stat.suffix || ""}
                              className="inline-block"
                            />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    </HoverCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>
        </ParallaxSection>

        {/* Features Section */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent dark:via-slate-900/20" />
          <div className="container relative">
            <ScrollAnimation direction="up" delay={0.2}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold mb-6 transition-transform duration-500 ease-out hover:scale-105">
                  <Sparkles className="h-4 w-4" />
                  Why Choose OncoAI
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
                  Powerful Features for{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-success bg-clip-text text-transparent">
                    Better Care
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                  Everything you need to manage patient care and make informed treatment decisions with confidence
                </p>
              </div>
            </ScrollAnimation>
            
            <StaggerContainer>
              <BentoGrid className="max-w-6xl mx-auto">
                {features.map((feature, index) => (
                  <StaggerItem key={index} index={index} className="md:col-span-1">
                    <BentoGridItem
                      title={feature.title}
                      description={feature.description}
                      icon={<feature.icon className="h-6 w-6" />}
                      color={feature.color}
                      link={feature.link}
                      isPublic={feature.isPublic}
                      className="h-full"
                    />
                  </StaggerItem>
                ))}
              </BentoGrid>
            </StaggerContainer>
          </div>
        </section>



        {/* Testimonial Section */}
        <ParallaxSection speed={0.2}>
          <section className="py-12 md:py-16 bg-muted/20 dark:bg-slate-900/30">
            <div className="container">
              <ScrollAnimation direction="scale" delay={0.2}>
                <div className="max-w-4xl mx-auto text-center">
                  <div className="h-12 w-12 text-primary/60 dark:text-primary/40 mx-auto mb-6">
                    <HeartPulse className="h-12 w-12" />
                  </div>
                  <blockquote className="text-xl md:text-2xl lg:text-3xl font-light text-foreground mb-6 leading-relaxed italic">
                    "OncoAI has revolutionized our oncology practice. The AI-driven insights have improved our treatment planning accuracy by 40% and significantly reduced administrative workload."
                  </blockquote>
                  <div className="flex items-center justify-center gap-4 transition-transform duration-500 ease-out opacity-100">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-success" />
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Dr. Sarah Johnson</div>
                      <div className="text-sm text-muted-foreground">Chief Oncology Director, Memorial Hospital</div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        </ParallaxSection>

        {/* CTA Section */}
        <section className="py-12 md:py-16 relative overflow-hidden flex items-center justify-center">
          {/* Animated Background Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-primary/30 rounded-full blur-[80px] animate-pulse mix-blend-screen opacity-50 dark:opacity-30" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-success/20 rounded-full blur-[60px] animate-pulse mix-blend-screen opacity-60 dark:opacity-40 delay-1000" style={{ animationDuration: '5s' }} />
          
          <div className="container relative z-10">
            <ScrollAnimation direction="scale" delay={0.1}>
              <div className="max-w-3xl mx-auto">
                <div className="p-[1px] rounded-[2rem] bg-gradient-to-br from-primary/30 via-transparent to-success/30 shadow-xl relative overflow-hidden group">
                  {/* Rotating border effect */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.3)_360deg)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative bg-card/40 dark:bg-slate-950/60 backdrop-blur-2xl rounded-[calc(2rem-1px)] p-8 md:p-10 border border-white/10 text-center overflow-hidden">
                    {/* Inner subtle noise/texture could go here, but a gradient overlay works well */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="relative z-20">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20 mb-6 transition-transform duration-500 hover:scale-110 hover:rotate-3">
                        <Zap className="h-7 w-7 text-white" />
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
                        Ready to Transform <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-success">
                          Patient Care?
                        </span>
                      </h2>
                      
                      <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed font-light">
                        Join top medical professionals using OncoAI to deliver personalized cancer treatment with unprecedented accuracy and efficiency.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <div className="transition-transform duration-300 hover:scale-105">
                          <Button 
                            className="gap-2 px-6 h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-all duration-300 border border-foreground/10"
                            asChild
                          >
                            <Link to="/signup" className="flex items-center gap-2">
                              Start Free Trial
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="transition-transform duration-300 hover:scale-105">
                          <Button 
                            variant="outline" 
                            className="px-6 h-12 rounded-full border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all duration-300 backdrop-blur-md"
                            asChild
                          >
                            <Link to="/demo" className="flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Watch Demo
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-6 font-medium tracking-wide uppercase">
                        No credit card required <span className="mx-2 opacity-50">•</span> 14-day free trial <span className="mx-2 opacity-50">•</span> Full feature access
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>
      </main>
      
      <Suspense fallback={<div className="py-12 bg-background"><div className="container text-center text-muted-foreground">Loading footer…</div></div>}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;