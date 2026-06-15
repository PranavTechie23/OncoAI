import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const colors = ["bg-primary", "bg-success", "bg-warning"];

export function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on the client side
    const generatedParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 20 + 5, // 5px to 25px
      duration: Math.random() * 20 + 10, // 10s to 30s
      delay: Math.random() * -20, // Negative delay so they start already moving
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full opacity-20 dark:opacity-30 blur-[2px] ${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [`0%`, `-100%`, `100%`, `0%`],
            x: [`0%`, `50%`, `-50%`, `0%`],
            scale: [1, 1.5, 0.8, 1],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
      
      {/* Glow mesh background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-success/10 dark:bg-success/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-warning/10 dark:bg-warning/5 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
    </div>
  );
}
