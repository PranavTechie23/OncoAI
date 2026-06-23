import { ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function ParallaxSection({ children, className = "", speed = 1 }: ParallaxSectionProps) {
  return <div className={className}>{children}</div>;
}

interface ParallaxTextProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxText({ children, className = "" }: ParallaxTextProps) {
  return <div className={className}>{children}</div>;
}