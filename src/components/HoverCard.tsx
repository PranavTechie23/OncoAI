import { ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverRotate?: number;
}

export function HoverCard({
  children,
  className = "",
  hoverScale = 1.05,
  hoverRotate = 0,
}: HoverCardProps) {
  return (
    <div className={`${className} transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      {children}
    </div>
  );
}












