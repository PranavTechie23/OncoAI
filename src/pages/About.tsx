import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { 
  Heart,
  Shield,
  Zap,
  Target,
  Globe,
  Lock,
  Users,
  Stethoscope,
  Sparkles,
  Rocket
} from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief Medical Officer",
    bio: "20+ years in oncology with expertise in personalized medicine and clinical trials",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    specialization: "Medical Oncology",
  },
  {
    name: "Dr. Michael Rodriguez",
    role: "AI Research Director",
    bio: "PhD in Machine Learning from MIT, specializing in healthcare AI applications",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    specialization: "Deep Learning",
  },
  {
    name: "Dr. Emily Watson",
    role: "Clinical Data Scientist",
    bio: "Expert in genomic data analysis, biostatistics, and treatment optimization",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    specialization: "Genomics",
  },
  {
    name: "James Park",
    role: "Chief Product Officer",
    bio: "10+ years building healthcare technology solutions and leading product teams",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    specialization: "Product Strategy",
  }
];

const values = [
  {
    icon: Heart,
    title: "Patient-Centered",
    description: "Every decision prioritizes patient outcomes and quality of life",
  },
  {
    icon: Shield,
    title: "Evidence-Based",
    description: "All recommendations backed by rigorous clinical research",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Cutting-edge AI technology meets clinical expertise",
  },
  {
    icon: Target,
    title: "Precision",
    description: "Personalized treatment plans for each unique patient",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making advanced cancer care available to everyone",
  },
  {
    icon: Lock,
    title: "Security & Privacy",
    description: "Your data is protected with enterprise-grade encryption",
  }
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32 dark:bg-slate-950">
          <ParticleBackground />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-primary/20 via-purple-400/10 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-[40%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-success/20 via-emerald-400/10 to-transparent blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000" style={{ animationDuration: '10s' }} />
          </div>
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-primary border-white/20 dark:border-slate-700 mb-8 px-6 py-2.5 rounded-full shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="font-semibold tracking-wide uppercase text-xs">Our Story</span>
              </Badge>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">
                Driven by Compassion,
                <span className="bg-gradient-to-r from-primary via-purple-500 to-success bg-clip-text text-transparent block mt-2"> Powered by AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed font-light">
                We are a dedicated team of oncologists, data scientists, and engineers united by a single mission: to ensure every cancer patient receives the most advanced, personalized care possible, regardless of where they are.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Heart className="h-3 w-3 mr-2" />
                Our Values
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                What Drives Us
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our core values guide everything we do, from product development to patient care
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, idx) => (
                <Card key={idx} className="p-8 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/40 dark:border-white/10 rounded-[2rem] group hover:-translate-y-2">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <Users className="h-3 w-3 mr-2" />
                Our Team
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Meet Our Experts
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A world-class team of oncologists, AI researchers, and data scientists
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {teamMembers.map((member, idx) => (
                <Card key={idx} className="p-6 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/40 dark:border-white/10 rounded-[2rem] group hover:-translate-y-2">
                  <div className="relative mb-6 overflow-hidden rounded-lg">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                      <p className="text-sm text-primary font-medium">{member.role}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Stethoscope className="h-3 w-3 mr-1" />
                        {member.specialization}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-success/10 border-t border-border/50">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-6 py-2">
                <Rocket className="h-3 w-3 mr-2" />
                Join Us
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Be Part of the Future
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                We're always looking for passionate individuals to join our mission.
              </p>
              <Button size="lg" className="px-8 rounded-full shadow-lg">
                View Open Positions
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}