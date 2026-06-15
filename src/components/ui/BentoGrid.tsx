import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./button";

export function BentoGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className = "",
  title,
  description,
  header,
  icon,
  color = "primary",
  link,
  isAuthenticated = false,
  isPublic = false,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  link?: string;
  isAuthenticated?: boolean;
  isPublic?: boolean;
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
    setMouseY(e.clientY - rect.top);
  }

  // Define glow colors based on the `color` prop
  const glowColorMap: Record<string, string> = {
    primary: "rgba(124, 58, 237, 0.15)",   // Purple
    success: "rgba(16, 185, 129, 0.15)",   // Emerald
    warning: "rgba(245, 158, 11, 0.15)",   // Amber
  };
  const glowColor = glowColorMap[color] || glowColorMap.primary;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative group/bento row-span-1 rounded-2xl overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 dark:border-slate-800/60 hover:shadow-2xl hover:shadow-${color}/10 transition-all duration-500 flex flex-col justify-between p-6 ${className}`}
    >
      {/* Dynamic Cursor Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-500 group-hover/bento:opacity-100"
        style={{
          background: `radial-gradient(500px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 40%)`,
        }}
      />
      
      {/* Background static subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {header && <div className="mb-4">{header}</div>}
        
        <div className="mt-auto transition-transform duration-300 group-hover/bento:-translate-y-1">
          {icon && (
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-${color}/10 dark:bg-${color}/20 text-${color}`}
            >
              {icon}
            </motion.div>
          )}
          <div className="font-bold text-xl text-foreground mb-2 tracking-tight group-hover/bento:text-primary transition-colors">
            {title}
          </div>
          <div className="font-light text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
            {description}
          </div>

          {link && (
             <div className="opacity-0 translate-y-2 group-hover/bento:opacity-100 group-hover/bento:translate-y-0 transition-all duration-300">
               <Button 
                 variant="ghost" 
                 className={`gap-2 px-0 font-medium text-${color} hover:bg-transparent hover:text-${color}/80 transition-all duration-300`}
                 asChild
               >
                 <Link to={(isAuthenticated || isPublic) ? link : "/login"}>
                   {(isAuthenticated || isPublic) ? (link === "/about" ? "Learn More" : "Explore Feature") : "Login to explore"}
                   <motion.span
                     className="inline-block"
                     whileHover={{ x: 4 }}
                     transition={{ type: "spring", stiffness: 400 }}
                   >
                     <ArrowRight className="h-4 w-4" />
                   </motion.span>
                 </Link>
               </Button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
