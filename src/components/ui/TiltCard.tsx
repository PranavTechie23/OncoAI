import React from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scaleOnHover?: number;
}

export function TiltCard({ children, className = "", scaleOnHover = 1.05, maxTilt = 10 }: TiltCardProps) {
  return (
    <div 
      className={`transition-transform duration-300 perspective-1000 ${className}`}
      onMouseEnter={(e) => e.currentTarget.style.transform = `scale(${scaleOnHover})`}
      onMouseLeave={(e) => e.currentTarget.style.transform = `scale(1)`}
    >
      <div className="w-full h-full">{children}</div>
    </div>
  );
}
