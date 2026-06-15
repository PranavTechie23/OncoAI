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
import { ParallaxSection, ParallaxText } from "@/components/ParallaxSection";
import { HoverCard } from "@/components/HoverCard";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
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
  const { isAuthenticated } = useAuth();
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

        <section className="py-16">
          <div className="container rounded-[2rem] border border-border/70 bg-card/70 p-10 shadow-xl shadow-primary/5 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Get started with OncoAI</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Login or register to access the full doctor dashboard</h2>
              <p className="text-muted-foreground leading-relaxed">
                Use the secure OncoAI portal for patient management, intelligent treatment recommendations, reports, and appointment tracking.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                  {isAuthenticated ? "Go to Dashboard" : "Login"}
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/signup">Register</Link>
                </Button>
              )}
            </div>
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
                  <StaggerItem key={index}>
                    <HoverCard hoverScale={1.05}>
                      <div className="text-center group">
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 mb-4"
                        >
                          <stat.icon className="h-6 w-6 text-primary" />
                        </motion.div>
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-semibold mb-6"
                >
                  <Sparkles className="h-4 w-4" />
                  Why Choose OncoAI
                </motion.div>
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
                  <StaggerItem key={index} className="md:col-span-1">
                    <BentoGridItem
                      title={feature.title}
                      description={feature.description}
                      icon={<feature.icon className="h-6 w-6" />}
                      color={feature.color}
                      link={feature.link}
                      isAuthenticated={isAuthenticated}
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
          <section className="py-24 bg-muted/20 dark:bg-slate-900/30">
            <div className="container">
              <ScrollAnimation direction="scale" delay={0.2}>
                <div className="max-w-4xl mx-auto text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <HeartPulse className="h-12 w-12 text-primary/60 dark:text-primary/40 mx-auto mb-8" />
                  </motion.div>
                  <motion.blockquote
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl md:text-3xl font-light text-foreground mb-8 leading-relaxed italic"
                  >
                    "OncoAI has revolutionized our oncology practice. The AI-driven insights have improved our treatment planning accuracy by 40% and significantly reduced administrative workload."
                  </motion.blockquote>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-center justify-center gap-4"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-success"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Dr. Sarah Johnson</div>
                      <div className="text-sm text-muted-foreground">Chief Oncology Director, Memorial Hospital</div>
                    </div>
                  </motion.div>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        </ParallaxSection>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
          <div className="container relative">
            <ScrollAnimation direction="scale" delay={0.2}>
              <Card className="p-16 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900 
                           border-2 border-primary/20 dark:border-primary/30 
                           shadow-2xl dark:shadow-2xl dark:shadow-primary/10
                           relative overflow-hidden backdrop-blur-sm">
                {/* Animated gradient border */}
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-success/10 bg-[length:200%_100%]"
                />
                
                <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center justify-center h-20 w-20 rounded-3xl 
                            bg-gradient-to-br from-primary/30 to-success/30 dark:from-primary/40 dark:to-success/40 
                            mb-8"
                >
                  <Zap className="h-10 w-10 text-primary-foreground" />
                </motion.div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
                  Ready to Transform{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-success bg-clip-text text-transparent">
                    Patient Care?
                  </span>
                </h2>
                
                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                  Join hundreds of medical professionals using OncoAI to deliver personalized cancer treatment with unprecedented accuracy and efficiency.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      className="gap-3 text-lg px-10 py-7 rounded-2xl 
                               bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary
                               shadow-xl hover:shadow-2xl transition-all duration-300"
                      asChild
                    >
                      <Link to="/signup">
                        Start Free Trial
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-5 w-5 inline" />
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="text-lg px-10 py-7 rounded-2xl border-2 
                               hover:bg-accent/50 hover:border-accent 
                               transition-all duration-300"
                      asChild
                    >
                      <Link to="/demo" className="flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Watch Demo
                      </Link>
                    </Button>
                  </motion.div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-8 text-center">
                  No credit card required • 14-day free trial • Full feature access
                </p>
                </div>
              </Card>
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